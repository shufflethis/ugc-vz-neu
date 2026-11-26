import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { BRAND_SESSION_COOKIE, verifyBrandSession } from '@/app/lib/brand-session';
import { getBrandAccount } from '@/app/lib/brand-workspace';
import {
  calculatePayInSurchargeCents,
  createPendingTopup,
  type PayInMethod,
} from '@/app/lib/payments-ledger';
import {
  createBrandCheckoutTopupSession,
  ensureStripeBrandCustomerAndVirtualIban,
  isStripeConfigured,
} from '@/app/lib/stripe-connect';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_METHODS = new Set<PayInMethod>([
  'sepa_debit',
  'bank_transfer',
  'card',
  'apple_pay',
  'google_pay',
  'paypal',
]);

export async function POST(request: NextRequest) {
  const brandId = verifyBrandSession(cookies().get(BRAND_SESSION_COOKIE)?.value);
  if (!brandId) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Datenbank nicht konfiguriert.' }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    amountEur?: number;
    amountCents?: number;
    method?: string;
  };

  const amountCents =
    typeof body.amountCents === 'number'
      ? Math.round(body.amountCents)
      : typeof body.amountEur === 'number'
        ? Math.round(body.amountEur * 100)
        : 0;
  const method = String(body.method || 'sepa_debit') as PayInMethod;

  if (!ALLOWED_METHODS.has(method)) {
    return NextResponse.json({ success: false, error: 'Unbekannte Zahlungsart.' }, { status: 400 });
  }
  if (!Number.isInteger(amountCents) || amountCents < 10_000 || amountCents > 5_000_000) {
    return NextResponse.json(
      { success: false, error: 'Bitte wähle einen Aufladebetrag zwischen 100 € und 50.000 €.' },
      { status: 400 },
    );
  }

  const feeBreakdown = calculatePayInSurchargeCents(amountCents, method);

  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        success: false,
        code: 'stripe_not_configured',
        error:
          'Online-Aufladungen über Stripe Connect werden gerade freigeschaltet. Schreib uns an hi@ugc-vz.de, um dein Kampagnenguthaben sofort per Rechnung zu aktivieren.',
        preview: {
          amountCents,
          ...feeBreakdown,
          method,
        },
      },
      { status: 503 },
    );
  }

  try {
    const sql = getDatabase();
    const brand = await getBrandAccount(sql, brandId);
    if (!brand) {
      return NextResponse.json({ success: false, error: 'Marken-Konto nicht gefunden.' }, { status: 404 });
    }

    const customer = await ensureStripeBrandCustomerAndVirtualIban(sql, brand);

    if (method === 'bank_transfer') {
      return NextResponse.json({
        success: true,
        method: 'bank_transfer',
        amountCents,
        surchargeCents: 0,
        surchargeLabel: '',
        totalChargedCents: amountCents,
        bankTransfer: {
          iban: customer.virtualIban,
          bic: customer.virtualBic,
          bankName: customer.virtualBankName,
          accountHolder: customer.virtualAccountHolder,
          hint: 'Empfängername exakt wie bei Stripe hinterlegt angeben. Gutschrift erfolgt automatisch nach Zahlungseingang.',
        },
      });
    }

    const origin = request.nextUrl.origin;
    const checkout = await createBrandCheckoutTopupSession({
      stripeCustomerId: customer.stripeCustomerId,
      brandId,
      amountCents,
      method,
      successUrl: `${origin}/brand?topup=success`,
      cancelUrl: `${origin}/brand?topup=cancelled`,
    });

    const topup = await createPendingTopup(sql, {
      brandId,
      amountCents,
      method,
      providerRef: checkout.sessionId,
    });

    return NextResponse.json({
      success: true,
      method,
      topupId: topup.id,
      invoiceNumber: topup.invoiceNumber,
      amountCents: topup.amountCents,
      surchargeCents: topup.surchargeCents,
      surchargeLabel: topup.surchargeLabel,
      totalChargedCents: topup.totalChargedCents,
      checkoutUrl: checkout.checkoutUrl,
    });
  } catch (err) {
    console.error('Brand topup creation failed', err instanceof Error ? err.message : 'unknown error');
    return NextResponse.json(
      { success: false, error: 'Aufladung konnte gerade nicht gestartet werden.' },
      { status: 500 },
    );
  }
}

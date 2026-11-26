import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { BRAND_SESSION_COOKIE, verifyBrandSession } from '@/app/lib/brand-session';
import { getBrandAccount } from '@/app/lib/brand-workspace';
import { generateBrandTopupInvoicePdf } from '@/app/lib/credit-note-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const METHOD_LABELS: Record<string, string> = {
  sepa_debit: 'SEPA-Lastschrift',
  bank_transfer: 'Überweisung (virtuelle DE-IBAN)',
  card: 'Kreditkarte',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  paypal: 'PayPal',
};

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const brandId = verifyBrandSession(cookies().get(BRAND_SESSION_COOKIE)?.value);
  if (!brandId) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Datenbank nicht konfiguriert.' }, { status: 503 });
  }

  try {
    const sql = getDatabase();
    const [topup] = await sql.query(
      `SELECT id, brand_id, amount_cents, surcharge_cents, surcharge_label,
              total_charged_cents, method, invoice_number, created_at
       FROM wallet_topups
       WHERE id = $1 AND brand_id = $2
       LIMIT 1`,
      [params.id, brandId],
    );
    if (!topup) {
      return NextResponse.json({ success: false, error: 'Rechnung nicht gefunden.' }, { status: 404 });
    }
    const brand = await getBrandAccount(sql, brandId);
    const invoiceNumber = String(topup.invoice_number || `RE-${String(topup.id).slice(0, 8)}`);
    const pdfBytes = await generateBrandTopupInvoicePdf({
      invoiceNumber,
      issuedAtIso: new Date(String(topup.created_at)).toISOString(),
      brandCompany: brand?.companyName || brand?.contactName || '',
      brandEmail: brand?.email || '',
      amountCents: Number(topup.amount_cents),
      surchargeCents: Number(topup.surcharge_cents),
      surchargeLabel: String(topup.surcharge_label || 'Kartengebühr'),
      totalChargedCents: Number(topup.total_charged_cents),
      methodLabel: METHOD_LABELS[String(topup.method)] || String(topup.method),
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoiceNumber}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Rechnung konnte nicht erstellt werden.' }, { status: 500 });
  }
}

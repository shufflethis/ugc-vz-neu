import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import { getCreatorTaxProfile } from '@/app/lib/payments-ledger';
import { createCreatorOnboardingLink, isStripeConfigured } from '@/app/lib/stripe-connect';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Spec 8.8: Stripe Connect Hosted Onboarding wird ERST ausgelöst, wenn der Creator seine erste Auszahlung vorbereitet.
 */
export async function POST(request: NextRequest) {
  const creatorId = verifySession(cookies().get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Datenbank nicht konfiguriert.' }, { status: 503 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        success: false,
        code: 'stripe_not_configured',
        error: 'Auszahlungen über Stripe Connect werden gerade freigeschaltet. Dein Steuerprofil ist bereits gespeichert.',
      },
      { status: 503 },
    );
  }

  try {
    const sql = getDatabase();
    const [contact] = await sql.query(
      `SELECT email FROM creator_private_contacts WHERE creator_id = $1 LIMIT 1`,
      [creatorId],
    );
    const email = contact?.email ? String(contact.email) : '';
    if (!email) {
      return NextResponse.json({ success: false, error: 'Keine E-Mail-Adresse im Profil hinterlegt.' }, { status: 400 });
    }

    const taxProfile = await getCreatorTaxProfile(sql, creatorId);
    const country = taxProfile?.country || 'DE';
    const origin = request.nextUrl.origin;

    const result = await createCreatorOnboardingLink(sql, {
      creatorId,
      email,
      country,
      returnUrl: `${origin}/konto?stripe_onboarding=return`,
      refreshUrl: `${origin}/konto?stripe_onboarding=refresh`,
    });

    return NextResponse.json({
      success: true,
      accountId: result.accountId,
      onboardingUrl: result.onboardingUrl,
    });
  } catch (err) {
    console.error('Creator Stripe onboarding failed', err instanceof Error ? err.message : 'unknown error');
    return NextResponse.json(
      { success: false, error: 'Stripe-Verifizierung konnte gerade nicht gestartet werden.' },
      { status: 500 },
    );
  }
}

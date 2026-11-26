import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import {
  reserveCreatorPayout,
  revertCreatorPayoutFailed,
  type PayoutSpeed,
} from '@/app/lib/payments-ledger';
import { executeCreatorStripePayout, isStripeConfigured } from '@/app/lib/stripe-connect';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
        error: 'Auszahlungen über Stripe Connect werden gerade freigeschaltet.',
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    amountCents?: number;
    payoutSpeed?: string;
  };
  const amountCents = Math.round(Number(body.amountCents || 0));
  const payoutSpeed: PayoutSpeed = body.payoutSpeed === 'instant' ? 'instant' : 'standard';

  const sql = getDatabase();
  let payoutId = '';

  try {
    const reserved = await reserveCreatorPayout(sql, {
      creatorId,
      amountCents,
      payoutSpeed,
    });
    payoutId = reserved.payoutId;

    const stripeResult = await executeCreatorStripePayout({
      payoutId: reserved.payoutId,
      creatorId,
      stripeConnectAccountId: reserved.stripeConnectAccountId,
      netPayoutCents: reserved.preview.netPayoutCents,
      payoutSpeed: reserved.preview.payoutSpeed,
    });

    await sql.query(
      `UPDATE creator_payouts
       SET status = 'processing',
           provider_transfer_ref = $2,
           provider_payout_ref = $3
       WHERE id = $1`,
      [reserved.payoutId, stripeResult.transferId, stripeResult.payoutRef],
    );

    return NextResponse.json({
      success: true,
      payoutId: reserved.payoutId,
      status: 'processing',
      preview: reserved.preview,
    });
  } catch (err) {
    if (payoutId) {
      await revertCreatorPayoutFailed(sql, payoutId).catch(() => {});
    }
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Auszahlung konnte nicht gestartet werden.' },
      { status: 400 },
    );
  }
}

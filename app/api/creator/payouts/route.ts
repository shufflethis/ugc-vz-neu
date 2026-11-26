import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import {
  DEFAULT_CREATOR_MIN_PAYOUT_CENTS,
  ensureCreatorBalance,
  getCreatorTaxProfile,
  validateCreatorTaxProfileForPayout,
} from '@/app/lib/payments-ledger';
import { isStripeConfigured } from '@/app/lib/stripe-connect';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const creatorId = verifySession(cookies().get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Datenbank nicht konfiguriert.' }, { status: 503 });
  }

  try {
    const sql = getDatabase();
    const [balance, taxProfile, payouts, creditNotes, settlements] = await Promise.all([
      ensureCreatorBalance(sql, creatorId),
      getCreatorTaxProfile(sql, creatorId),
      sql.query(
        `SELECT id, amount_cents, platform_fee_cents, instant_fee_cents, net_payout_cents,
                payout_speed, status, credit_note_id, created_at, paid_at
         FROM creator_payouts
         WHERE creator_id = $1
         ORDER BY created_at DESC
         LIMIT 25`,
        [creatorId],
      ),
      sql.query(
        `SELECT id, number, period, net_cents, vat_rate_type, vat_cents, gross_cents, small_business, issued_at
         FROM credit_notes
         WHERE creator_id = $1
         ORDER BY issued_at DESC
         LIMIT 50`,
        [creatorId],
      ),
      sql.query(
        `SELECT s.id, s.submission_id, s.views_at_cutoff, s.counted_thousands,
                s.rate_per_1000_cents, s.amount_cents, s.status, s.review_note, s.settled_at,
                c.title AS campaign_title
         FROM submission_settlements s
         JOIN brand_campaigns c ON c.id = s.campaign_id
         WHERE s.creator_id = $1
         ORDER BY s.created_at DESC
         LIMIT 25`,
        [creatorId],
      ),
    ]);

    return NextResponse.json({
      success: true,
      stripeConfigured: isStripeConfigured(),
      minPayoutCents: DEFAULT_CREATOR_MIN_PAYOUT_CENTS,
      balance,
      taxProfile,
      taxValidation: validateCreatorTaxProfileForPayout(taxProfile),
      payouts: payouts.map((p) => ({
        id: String(p.id),
        amountCents: Number(p.amount_cents),
        platformFeeCents: Number(p.platform_fee_cents),
        instantFeeCents: Number(p.instant_fee_cents),
        netPayoutCents: Number(p.net_payout_cents),
        payoutSpeed: String(p.payout_speed),
        status: String(p.status),
        creditNoteId: p.credit_note_id ? String(p.credit_note_id) : null,
        createdAt: new Date(String(p.created_at)).toISOString(),
        paidAt: p.paid_at ? new Date(String(p.paid_at)).toISOString() : null,
      })),
      creditNotes: creditNotes.map((cn) => ({
        id: String(cn.id),
        number: String(cn.number),
        period: String(cn.period),
        netCents: Number(cn.net_cents),
        vatRateType: String(cn.vat_rate_type),
        vatCents: Number(cn.vat_cents),
        grossCents: Number(cn.gross_cents),
        smallBusiness: Boolean(cn.small_business),
        issuedAt: new Date(String(cn.issued_at)).toISOString(),
      })),
      settlements: settlements.map((s) => ({
        id: String(s.id),
        campaignTitle: String(s.campaign_title || 'Kampagne'),
        viewsAtCutoff: Number(s.views_at_cutoff || 0),
        countedThousands: Number(s.counted_thousands || 0),
        ratePer1000Cents: Number(s.rate_per_1000_cents || 0),
        amountCents: Number(s.amount_cents || 0),
        status: String(s.status),
        reviewNote: String(s.review_note || ''),
        settledAt: s.settled_at ? new Date(String(s.settled_at)).toISOString() : null,
      })),
    });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === '42P01') {
      return NextResponse.json({
        success: true,
        stripeConfigured: isStripeConfigured(),
        migrationPending: true,
        minPayoutCents: DEFAULT_CREATOR_MIN_PAYOUT_CENTS,
        balance: {
          creatorId,
          stripeConnectAccountId: null,
          stripeOnboardingStatus: 'not_started',
          pendingCents: 0,
          availableCents: 0,
          paidOutCents: 0,
        },
        taxProfile: null,
        taxValidation: validateCreatorTaxProfileForPayout(null),
        payouts: [],
        creditNotes: [],
        settlements: [],
      });
    }
    return NextResponse.json({ success: false, error: 'Auszahlungsdaten konnten nicht geladen werden.' }, { status: 500 });
  }
}

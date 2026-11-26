import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { BRAND_SESSION_COOKIE, verifyBrandSession } from '@/app/lib/brand-session';
import { getBrandAccount } from '@/app/lib/brand-workspace';
import { ensureBrandWallet } from '@/app/lib/payments-ledger';
import { isStripeConfigured } from '@/app/lib/stripe-connect';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const brandId = verifyBrandSession(cookies().get(BRAND_SESSION_COOKIE)?.value);
  if (!brandId) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Datenbank nicht konfiguriert.' }, { status: 503 });
  }

  try {
    const sql = getDatabase();
    const [brand, wallet] = await Promise.all([
      getBrandAccount(sql, brandId),
      ensureBrandWallet(sql, brandId),
    ]);
    let latestComplianceRequest: {
      id: string;
      industryCategory: string;
      preferredContact: string;
      preferredPsp: string;
      status: string;
      createdAt: string;
    } | null = null;
    try {
      const [reqRow] = (await sql.query(
        `SELECT id, industry_category, preferred_contact, preferred_psp, status, created_at
         FROM brand_compliance_requests
         WHERE brand_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [brandId],
      )) as unknown as Array<any>;
      if (reqRow) {
        latestComplianceRequest = {
          id: String(reqRow.id),
          industryCategory: String(reqRow.industry_category),
          preferredContact: String(reqRow.preferred_contact),
          preferredPsp: String(reqRow.preferred_psp),
          status: String(reqRow.status),
          createdAt: new Date(String(reqRow.created_at)).toISOString(),
        };
      }
    } catch (crErr: any) {
      if (crErr?.code !== '42P01') throw crErr;
    }

    const billingProfile = {
      industryCategory: brand?.industryCategory || 'standard',
      billingTier: brand?.billingTier || 'stripe_standard',
      complianceStatus: brand?.complianceStatus || 'approved',
      highRiskFeeBps: brand?.highRiskFeeBps || 2200,
      website: brand?.website || '',
      latestComplianceRequest,
    };

    const [topups, reservations] = await Promise.all([
      sql.query(
        `SELECT id, amount_cents, surcharge_cents, surcharge_label, total_charged_cents,
                method, status, invoice_number, created_at, settled_at
         FROM wallet_topups
         WHERE brand_id = $1
         ORDER BY created_at DESC
         LIMIT 25`,
        [brandId],
      ),
      sql.query(
        `SELECT r.campaign_id, c.public_id, c.title, r.budget_cap_cents, r.platform_fee_bps,
                r.creator_pool_cap_cents, r.reserved_cents, r.released_creator_cents,
                r.released_fee_cents, r.status, r.created_at
         FROM campaign_reservations r
         JOIN brand_campaigns c ON c.id = r.campaign_id
         WHERE r.brand_id = $1
         ORDER BY r.created_at DESC
         LIMIT 25`,
        [brandId],
      ),
    ]);

    return NextResponse.json({
      success: true,
      stripeConfigured: isStripeConfigured(),
      billingProfile,
      wallet,
      topups: topups.map((t) => ({
        id: String(t.id),
        amountCents: Number(t.amount_cents),
        surchargeCents: Number(t.surcharge_cents),
        surchargeLabel: String(t.surcharge_label || ''),
        totalChargedCents: Number(t.total_charged_cents),
        method: String(t.method),
        status: String(t.status),
        invoiceNumber: t.invoice_number ? String(t.invoice_number) : null,
        createdAt: new Date(String(t.created_at)).toISOString(),
        settledAt: t.settled_at ? new Date(String(t.settled_at)).toISOString() : null,
      })),
      reservations: reservations.map((r) => ({
        campaignId: String(r.campaign_id),
        campaignPublicId: String(r.public_id),
        title: String(r.title),
        budgetCapCents: Number(r.budget_cap_cents),
        platformFeeBps: Number(r.platform_fee_bps),
        creatorPoolCapCents: Number(r.creator_pool_cap_cents),
        reservedCents: Number(r.reserved_cents),
        releasedCreatorCents: Number(r.released_creator_cents),
        releasedFeeCents: Number(r.released_fee_cents),
        status: String(r.status),
      })),
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === '42P01') {
      // Migration 024 noch nicht auf Neon ausgefuehrt -> sauberer Fallback ohne Crash
      return NextResponse.json({
        success: true,
        stripeConfigured: isStripeConfigured(),
        migrationPending: true,
        wallet: {
          brandId,
          stripeCustomerId: null,
          virtualIban: null,
          virtualBic: null,
          virtualBankName: null,
          virtualAccountHolder: null,
          availableCents: 0,
          reservedCents: 0,
          currency: 'EUR',
        },
        topups: [],
        reservations: [],
      });
    }
    return NextResponse.json({ success: false, error: 'Wallet konnte nicht geladen werden.' }, { status: 500 });
  }
}

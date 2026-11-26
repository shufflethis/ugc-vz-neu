import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { BRAND_SESSION_COOKIE, isTrustedSameOrigin, verifyBrandSession } from '@/app/lib/brand-session';
import { cleanText } from '@/app/lib/brand-workspace';
import {
  calculateAffiliateCommissionCents,
  listCampaignAffiliateConversions,
  recordAndSettleAffiliateConversion,
} from '@/app/lib/payments-ledger';
import {
  buildCreatorPayoutApprovedNotification,
  sendCampaignNotificationEmail,
} from '@/app/lib/campaign-notification-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const brandId = verifyBrandSession(request.cookies.get(BRAND_SESSION_COOKIE)?.value);
  if (!brandId) return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ success: false, error: 'Datenbank nicht verfügbar.' }, { status: 503 });

  const sql = getDatabase();
  const [camp] = (await sql.query(
    `SELECT id, public_id, affiliate_enabled, affiliate_type, affiliate_rate_bps,
            affiliate_fixed_cents, affiliate_target_url, affiliate_webhook_secret
     FROM brand_campaigns
     WHERE brand_id = $1 AND public_id = $2
     LIMIT 1`,
    [brandId, cleanText(params.id, 30)],
  )) as unknown as Array<any>;

  if (!camp) return NextResponse.json({ success: false, error: 'Kampagne nicht gefunden.' }, { status: 404 });

  const conversions = await listCampaignAffiliateConversions(sql, String(camp.id));
  return NextResponse.json({
    success: true,
    affiliate: {
      enabled: Boolean(camp.affiliate_enabled),
      type: String(camp.affiliate_type || 'percent'),
      rateBps: camp.affiliate_rate_bps === null ? null : Number(camp.affiliate_rate_bps),
      fixedCents: camp.affiliate_fixed_cents === null ? null : Number(camp.affiliate_fixed_cents),
      targetUrl: String(camp.affiliate_target_url || ''),
      webhookSecret: String(camp.affiliate_webhook_secret || ''),
    },
    conversions,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!isTrustedSameOrigin(request)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const brandId = verifyBrandSession(request.cookies.get(BRAND_SESSION_COOKIE)?.value);
  if (!brandId) return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ success: false, error: 'Datenbank nicht verfügbar.' }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const sql = getDatabase();
  const [camp] = (await sql.query(
    `SELECT id, public_id, title, brand_display_name, affiliate_enabled, affiliate_type,
            affiliate_rate_bps, affiliate_fixed_cents, COALESCE(platform_fee_bps, 1500) AS platform_fee_bps
     FROM brand_campaigns
     WHERE brand_id = $1 AND public_id = $2
     LIMIT 1`,
    [brandId, cleanText(params.id, 30)],
  )) as unknown as Array<any>;

  if (!camp) return NextResponse.json({ success: false, error: 'Kampagne nicht gefunden.' }, { status: 404 });

  const applicationId = cleanText(body.applicationId, 60);
  const affiliateCode = cleanText(body.affiliateCode, 40).toUpperCase();
  const [app] = (await sql.query(
    `SELECT a.id, a.creator_id,
            COALESCE(NULLIF(p.display_name, ''), 'Creator') AS creator_name,
            pc.email AS creator_email
     FROM brand_campaign_applications a
     JOIN creator_profiles p ON p.id = a.creator_id
     LEFT JOIN creator_private_contacts pc ON pc.creator_id = p.id
     WHERE a.campaign_id = $1
       AND ($2 <> '' AND a.id::text = $2 OR $3 <> '' AND UPPER(a.affiliate_code) = $3)
     LIMIT 1`,
    [camp.id, applicationId, affiliateCode],
  )) as unknown as Array<any>;

  if (!app) {
    return NextResponse.json({ success: false, error: 'Creator-Zuordnung / Affiliate-Code nicht gefunden.' }, { status: 404 });
  }

  const orderAmountEur = Number(String(body.orderAmountEur ?? '0').replace(',', '.')) || 0;
  const overrideCommissionEur = Number(String(body.commissionEur ?? '0').replace(',', '.')) || 0;
  const orderAmountCents = Math.max(0, Math.round(orderAmountEur * 100));
  const commissionCents = calculateAffiliateCommissionCents({
    affiliateType: String(camp.affiliate_type || 'percent') as 'percent' | 'fixed_per_sale',
    affiliateRateBps: camp.affiliate_rate_bps === null ? null : Number(camp.affiliate_rate_bps),
    affiliateFixedCents: camp.affiliate_fixed_cents === null ? null : Number(camp.affiliate_fixed_cents),
    orderAmountCents,
    overrideCommissionCents: overrideCommissionEur > 0 ? Math.round(overrideCommissionEur * 100) : null,
  });

  if (commissionCents <= 0) {
    return NextResponse.json({ success: false, error: 'Bitte gib einen Bestellwert oder Kickback-Betrag größer 0 € an.' }, { status: 400 });
  }

  try {
    const settled = await recordAndSettleAffiliateConversion(sql, {
      brandId,
      campaignId: String(camp.id),
      applicationId: String(app.id),
      creatorId: String(app.creator_id),
      externalOrderRef: cleanText(body.externalOrderRef, 120),
      orderAmountCents,
      commissionCents,
      platformFeeBps: Number(camp.platform_fee_bps || 1500),
      source: body.source === 'csv' ? 'csv' : 'manual',
      note: cleanText(body.note, 280),
      autoApprove: body.autoApprove !== false,
    });

    if (settled.createdNow && settled.status === 'approved' && app.creator_email) {
      const mail = buildCreatorPayoutApprovedNotification({
        creatorName: String(app.creator_name || 'Creator'),
        brandName: String(camp.brand_display_name || 'Brand'),
        campaignTitle: String(camp.title),
        creditedCents: settled.commissionCents,
        reasonLabel: 'Affiliate-Kickback gutgeschrieben',
      });
      await sendCampaignNotificationEmail({
        to: String(app.creator_email),
        ...mail,
        category: 'affiliate_kickback_approved',
        audience: 'creator',
      });
    }

    const conversions = await listCampaignAffiliateConversions(sql, String(camp.id));
    return NextResponse.json({ success: true, conversion: settled, conversions }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Affiliate-Sale konnte nicht verbucht werden.' },
      { status: 400 },
    );
  }
}

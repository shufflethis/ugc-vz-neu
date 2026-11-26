import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { cleanText } from '@/app/lib/brand-workspace';
import {
  calculateAffiliateCommissionCents,
  recordAndSettleAffiliateConversion,
} from '@/app/lib/payments-ledger';
import {
  buildCreatorPayoutApprovedNotification,
  sendCampaignNotificationEmail,
} from '@/app/lib/campaign-notification-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Shop-Webhook fuer Affiliate-Conversions (Shopify / Shopware / WooCommerce / Custom):
 * POST /api/webhooks/affiliate/[publicId]
 * Header: X-UGCVZ-Affiliate-Secret: <campaign.affiliate_webhook_secret>
 * Body: { "affiliateCode": "MIA-8F2A", "orderRef": "ORD-10482", "orderAmountEur": 89.90, "autoApprove": true }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { publicId: string } },
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
  }

  const providedSecret = (request.headers.get('x-ugcvz-affiliate-secret') || '').trim();
  if (!providedSecret) {
    return NextResponse.json({ success: false, error: 'Missing X-UGCVZ-Affiliate-Secret header' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  const sql = getDatabase();
  const [camp] = (await sql.query(
    `SELECT id, brand_id, public_id, title, brand_display_name, affiliate_enabled,
            affiliate_type, affiliate_rate_bps, affiliate_fixed_cents, affiliate_webhook_secret,
            COALESCE(platform_fee_bps, 1500) AS platform_fee_bps
     FROM brand_campaigns
     WHERE public_id = $1 AND affiliate_enabled = true
     LIMIT 1`,
    [cleanText(params.publicId, 30)],
  )) as unknown as Array<any>;

  if (!camp || !camp.affiliate_webhook_secret) {
    return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
  }

  const expected = Buffer.from(String(camp.affiliate_webhook_secret), 'utf8');
  const received = Buffer.from(providedSecret, 'utf8');
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    return NextResponse.json({ success: false, error: 'Invalid webhook secret' }, { status: 401 });
  }

  const affiliateCode = cleanText(body.affiliateCode || body.code, 40).toUpperCase();
  if (!affiliateCode) {
    return NextResponse.json({ success: false, error: 'affiliateCode required' }, { status: 400 });
  }

  const [app] = (await sql.query(
    `SELECT a.id, a.creator_id,
            COALESCE(NULLIF(p.display_name, ''), 'Creator') AS creator_name,
            pc.email AS creator_email
     FROM brand_campaign_applications a
     JOIN creator_profiles p ON p.id = a.creator_id
     LEFT JOIN creator_private_contacts pc ON pc.creator_id = p.id
     WHERE a.campaign_id = $1 AND UPPER(a.affiliate_code) = $2
     LIMIT 1`,
    [camp.id, affiliateCode],
  )) as unknown as Array<any>;

  if (!app) {
    return NextResponse.json({ success: false, error: 'Affiliate code not found in campaign' }, { status: 404 });
  }

  const orderAmountEur = Number(String(body.orderAmountEur ?? body.amount ?? '0').replace(',', '.')) || 0;
  const orderAmountCents = Math.max(0, Math.round(orderAmountEur * 100));
  const commissionCents = calculateAffiliateCommissionCents({
    affiliateType: String(camp.affiliate_type || 'percent') as 'percent' | 'fixed_per_sale',
    affiliateRateBps: camp.affiliate_rate_bps === null ? null : Number(camp.affiliate_rate_bps),
    affiliateFixedCents: camp.affiliate_fixed_cents === null ? null : Number(camp.affiliate_fixed_cents),
    orderAmountCents,
  });

  if (commissionCents <= 0) {
    return NextResponse.json({ success: false, error: 'Calculated commission is 0' }, { status: 400 });
  }

  try {
    const result = await recordAndSettleAffiliateConversion(sql, {
      brandId: String(camp.brand_id),
      campaignId: String(camp.id),
      applicationId: String(app.id),
      creatorId: String(app.creator_id),
      externalOrderRef: cleanText(body.orderRef || body.orderId, 120),
      orderAmountCents,
      commissionCents,
      platformFeeBps: Number(camp.platform_fee_bps || 1500),
      source: 'webhook',
      note: cleanText(body.note, 280),
      autoApprove: body.autoApprove === true,
    });

    if (result.createdNow && result.status === 'approved' && app.creator_email) {
      const mail = buildCreatorPayoutApprovedNotification({
        creatorName: String(app.creator_name || 'Creator'),
        brandName: String(camp.brand_display_name || 'Brand'),
        campaignTitle: String(camp.title),
        creditedCents: result.commissionCents,
        reasonLabel: 'Affiliate-Kickback gutgeschrieben',
      });
      await sendCampaignNotificationEmail({
        to: String(app.creator_email),
        ...mail,
        category: 'affiliate_kickback_webhook',
        audience: 'creator',
      });
    }

    return NextResponse.json({ success: true, conversion: result }, { status: result.createdNow ? 201 : 200 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Conversion settlement failed' },
      { status: 400 },
    );
  }
}

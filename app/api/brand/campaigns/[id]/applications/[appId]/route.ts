import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { BRAND_SESSION_COOKIE, isTrustedSameOrigin, verifyBrandSession } from '@/app/lib/brand-session';
import { cleanText, type ApplicationStatus } from '@/app/lib/brand-workspace';
import { ensureCreatorAffiliateCode } from '@/app/lib/payments-ledger';
import {
  buildCreatorSelectedNotification,
  sendCampaignNotificationEmail,
} from '@/app/lib/campaign-notification-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_BRAND_STATUSES = new Set<ApplicationStatus>(['shortlisted', 'selected', 'approved', 'declined']);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; appId: string } },
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

  const nextStatus = cleanText(body.status, 30) as ApplicationStatus;
  if (!ALLOWED_BRAND_STATUSES.has(nextStatus)) {
    return NextResponse.json({ success: false, error: 'Ungültiger Status.' }, { status: 400 });
  }
  const brandNote = body.brandNote !== undefined ? cleanText(body.brandNote, 500) : null;

  const sql = getDatabase();
  const updated = (await sql.query(
    `UPDATE brand_campaign_applications a
     SET status = $1,
         brand_note = COALESCE($2, a.brand_note),
         selected_at = CASE WHEN $1 = 'selected' THEN COALESCE(a.selected_at, now()) ELSE a.selected_at END,
         updated_at = now()
     FROM brand_campaigns c
     WHERE a.campaign_id = c.id
       AND c.brand_id = $3
       AND c.public_id = $4
       AND a.id = $5
     RETURNING a.id, a.creator_id, a.status, a.brand_note,
               c.title, c.brand_display_name, c.compensation_model,
               c.budget_per_video_eur, c.tkp_eur_cents`,
    [nextStatus, brandNote, brandId, cleanText(params.id, 30), cleanText(params.appId, 60)],
  )) as unknown as Array<any>;

  if (!updated.length) {
    return NextResponse.json({ success: false, error: 'Bewerbung nicht gefunden.' }, { status: 404 });
  }

  const row = updated[0];
  let affiliateCode: string | null = null;

  if (nextStatus === 'selected' || nextStatus === 'approved') {
    try {
      let meta: any;
      try {
        const [m] = (await sql.query(
          `SELECT COALESCE(NULLIF(p.display_name, ''), 'Creator') AS creator_name,
                  pc.email AS creator_email,
                  c.affiliate_enabled, c.affiliate_type, c.affiliate_rate_bps, c.affiliate_fixed_cents
           FROM creator_profiles p
           LEFT JOIN creator_private_contacts pc ON pc.creator_id = p.id
           JOIN brand_campaigns c ON c.public_id = $2
           WHERE p.id = $1 LIMIT 1`,
          [row.creator_id, cleanText(params.id, 30)],
        )) as unknown as Array<any>;
        meta = m;
      } catch (colErr: any) {
        if (colErr?.code !== '42703') throw colErr;
        const [m] = (await sql.query(
          `SELECT COALESCE(NULLIF(p.display_name, ''), 'Creator') AS creator_name,
                  pc.email AS creator_email
           FROM creator_profiles p
           LEFT JOIN creator_private_contacts pc ON pc.creator_id = p.id
           WHERE p.id = $1 LIMIT 1`,
          [row.creator_id],
        )) as unknown as Array<any>;
        meta = m;
      }

      if (meta?.affiliate_enabled) {
        affiliateCode = await ensureCreatorAffiliateCode(sql, String(row.id), String(meta.creator_name || 'Creator'));
      }

      if (nextStatus === 'selected' && meta?.creator_email) {
        const compParts: string[] = [];
        if (row.tkp_eur_cents) compParts.push(`${(Number(row.tkp_eur_cents) / 100).toFixed(2).replace('.', ',')} € / 1.000 Views`);
        if (row.budget_per_video_eur) compParts.push(`${row.budget_per_video_eur} € Fixpreis / Video`);
        if (meta.affiliate_enabled) {
          compParts.push(
            meta.affiliate_type === 'fixed_per_sale'
              ? `${(Number(meta.affiliate_fixed_cents || 1500) / 100).toFixed(2).replace('.', ',')} € / Sale Affiliate`
              : `${(Number(meta.affiliate_rate_bps || 1000) / 100).toFixed(0)} % Affiliate`,
          );
        }
        const mail = buildCreatorSelectedNotification({
          creatorName: String(meta.creator_name || 'Creator'),
          brandName: String(row.brand_display_name || 'Brand'),
          campaignTitle: String(row.title),
          compensationSummary: compParts.join(' + ') || 'Vergütung laut Briefing',
          affiliateCode,
        });
        await sendCampaignNotificationEmail({
          to: String(meta.creator_email),
          ...mail,
          category: 'creator_selected',
          audience: 'creator',
        });
      }
    } catch (err) {
      console.error('Post-select affiliate/notification failed:', err instanceof Error ? err.message : 'unknown');
    }
  }

  return NextResponse.json({
    success: true,
    application: {
      id: row.id,
      status: row.status,
      brand_note: row.brand_note,
      affiliateCode,
    },
  });
}

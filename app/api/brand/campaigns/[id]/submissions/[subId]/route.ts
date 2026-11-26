import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { BRAND_SESSION_COOKIE, isTrustedSameOrigin, verifyBrandSession } from '@/app/lib/brand-session';
import { cleanText, toPositiveIntOrNull, type SubmissionStatus } from '@/app/lib/brand-workspace';
import { settleFixedVideoSubmission } from '@/app/lib/payments-ledger';
import {
  buildCreatorPayoutApprovedNotification,
  buildCreatorRevisionNotification,
  sendCampaignNotificationEmail,
} from '@/app/lib/campaign-notification-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_SUB_STATUSES = new Set<SubmissionStatus>(['submitted', 'revision_requested', 'approved', 'rejected']);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; subId: string } },
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
  const [existing] = (await sql.query(
    `SELECT s.id, s.campaign_id, s.application_id, s.creator_id, s.status,
            s.views, s.likes, s.comments, s.shares, s.spend_eur_cents,
            s.review_note, s.checklist_passed,
            c.title AS campaign_title, c.brand_display_name, c.compensation_model,
            c.tkp_eur_cents, c.budget_per_video_eur,
            COALESCE(NULLIF(p.display_name, ''), 'Creator') AS creator_name,
            pc.email AS creator_email
     FROM brand_campaign_submissions s
     JOIN brand_campaigns c ON c.id = s.campaign_id
     JOIN creator_profiles p ON p.id = s.creator_id
     LEFT JOIN creator_private_contacts pc ON pc.creator_id = p.id
     WHERE c.brand_id = $1 AND c.public_id = $2 AND s.id = $3
     LIMIT 1`,
    [brandId, cleanText(params.id, 30), cleanText(params.subId, 60)],
  )) as unknown as Array<any>;

  if (!existing) {
    return NextResponse.json({ success: false, error: 'Einreichung nicht gefunden.' }, { status: 404 });
  }

  const nextStatus = body.status !== undefined && ALLOWED_SUB_STATUSES.has(cleanText(body.status, 30) as SubmissionStatus)
    ? (cleanText(body.status, 30) as SubmissionStatus)
    : (existing.status as SubmissionStatus);

  const views = body.views !== undefined ? (toPositiveIntOrNull(body.views, 500_000_000) ?? Number(existing.views)) : Number(existing.views);
  const likes = body.likes !== undefined ? (toPositiveIntOrNull(body.likes, 100_000_000) ?? Number(existing.likes)) : Number(existing.likes);
  const comments = body.comments !== undefined ? (toPositiveIntOrNull(body.comments, 10_000_000) ?? Number(existing.comments)) : Number(existing.comments);
  const shares = body.shares !== undefined ? (toPositiveIntOrNull(body.shares, 50_000_000) ?? Number(existing.shares)) : Number(existing.shares);
  const tkpCents = existing.tkp_eur_cents === null ? 0 : Number(existing.tkp_eur_cents);
  const autoTkpCents = tkpCents > 0 ? Math.round((views / 1000) * tkpCents) : 0;

  let spendEurCents = Number(existing.spend_eur_cents);
  if (body.autoCalculateTkp === true && tkpCents > 0) {
    spendEurCents = Math.min(100_000_000, autoTkpCents);
  } else if (body.spendEur !== undefined) {
    spendEurCents = Math.max(0, Math.min(100_000_000, Math.round((Number(body.spendEur) || 0) * 100)));
  } else if (existing.compensation_model === 'tkp' && tkpCents > 0 && views !== Number(existing.views)) {
    spendEurCents = Math.min(100_000_000, autoTkpCents);
  } else if (
    (existing.compensation_model === 'fixed' || existing.compensation_model === 'hybrid' || existing.compensation_model === 'retainer')
    && spendEurCents === 0
    && existing.budget_per_video_eur
  ) {
    spendEurCents = Number(existing.budget_per_video_eur) * 100;
  }

  const metricsChanged =
    views !== Number(existing.views)
    || likes !== Number(existing.likes)
    || comments !== Number(existing.comments)
    || shares !== Number(existing.shares);

  const reviewNote = body.reviewNote !== undefined ? cleanText(body.reviewNote, 400) : String(existing.review_note || '');
  const checklistPassed = body.checklistPassed !== undefined
    ? Boolean(body.checklistPassed)
    : nextStatus === 'approved'
      ? true
      : Boolean(existing.checklist_passed);

  // Pay-per-Video Escrow-Settlement bei Freigabe einer Fixpreis-/Hybrid-Einreichung
  let settlement: { settledNow: boolean; grantedCreatorCents: number; fundingSource: string } | null = null;
  let settlementWarning: string | null = null;
  if (
    nextStatus === 'approved'
    && (existing.compensation_model === 'fixed' || existing.compensation_model === 'hybrid' || existing.compensation_model === 'retainer')
    && spendEurCents > 0
  ) {
    try {
      const res = await settleFixedVideoSubmission(sql, {
        brandId,
        campaignId: String(existing.campaign_id),
        submissionId: String(existing.id),
        creatorId: String(existing.creator_id),
        fixedAmountCents: spendEurCents,
        reviewNote,
      });
      settlement = {
        settledNow: res.settledNow,
        grantedCreatorCents: res.grantedCreatorCents,
        fundingSource: res.fundingSource,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Budget-Freigabe ausstehend.';
      if (body.releasePayout === true) {
        return NextResponse.json({ success: false, error: msg }, { status: 400 });
      }
      settlementWarning = msg;
    }
  }

  await sql.query(
    `UPDATE brand_campaign_submissions
     SET status = $2, views = $3, likes = $4, comments = $5, shares = $6,
         spend_eur_cents = $7, last_tracked_at = CASE WHEN $8 THEN now() ELSE last_tracked_at END,
         review_note = $9, checklist_passed = $10, updated_at = now()
     WHERE id = $1`,
    [existing.id, nextStatus, views, likes, comments, shares, spendEurCents, metricsChanged, reviewNote, checklistPassed],
  );

  if (metricsChanged) {
    await sql.query(
      `INSERT INTO brand_campaign_metric_snapshots (submission_id, views, likes, comments, shares)
       VALUES ($1, $2, $3, $4, $5)`,
      [existing.id, views, likes, comments, shares],
    );
  }

  if (nextStatus === 'approved') {
    await sql.query(
      `UPDATE brand_campaign_applications SET status = 'approved', updated_at = now() WHERE id = $1`,
      [existing.application_id],
    );
  }

  // CI-Status-E-Mails an den Creator (Freigabe mit Guthaben ODER Korrektur-Hinweis)
  if (existing.creator_email) {
    if (settlement?.settledNow && settlement.grantedCreatorCents > 0) {
      const mail = buildCreatorPayoutApprovedNotification({
        creatorName: String(existing.creator_name || 'Creator'),
        brandName: String(existing.brand_display_name || 'Brand'),
        campaignTitle: String(existing.campaign_title),
        creditedCents: settlement.grantedCreatorCents,
        reasonLabel:
          existing.compensation_model === 'retainer'
            ? 'Retainer-Meilenstein freigegeben · Guthaben gutgeschrieben'
            : 'Video freigegeben · Fixpreis gutgeschrieben',
      });
      await sendCampaignNotificationEmail({
        to: String(existing.creator_email),
        ...mail,
        category: 'fixed_video_approved_payout',
        audience: 'creator',
      });
    } else if (nextStatus === 'revision_requested' && existing.status !== 'revision_requested') {
      const mail = buildCreatorRevisionNotification({
        creatorName: String(existing.creator_name || 'Creator'),
        brandName: String(existing.brand_display_name || 'Brand'),
        campaignTitle: String(existing.campaign_title),
        reviewNote,
      });
      await sendCampaignNotificationEmail({
        to: String(existing.creator_email),
        ...mail,
        category: 'submission_revision_requested',
        audience: 'creator',
      });
    }
  }

  return NextResponse.json({
    success: true,
    submission: { id: existing.id, status: nextStatus, views, likes, comments, shares, spendEurCents },
    settlement,
    settlementWarning,
  });
}

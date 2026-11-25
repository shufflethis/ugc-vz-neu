import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import { isTrustedSameOrigin } from '@/app/lib/brand-session';
import { safePortfolioUrl } from '@/app/lib/creator-public';
import { cleanText, detectSubmissionPlatform, toPositiveIntOrNull } from '@/app/lib/brand-workspace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isTrustedSameOrigin(request)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const creatorId = verifySession(request.cookies.get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ success: false, error: 'Datenbank nicht verfügbar.' }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const contentUrl = safePortfolioUrl(cleanText(body.contentUrl, 500));
  if (!contentUrl || !contentUrl.startsWith('https://')) {
    return NextResponse.json({ success: false, error: 'Bitte gib eine gültige HTTPS-URL (TikTok, Instagram, YouTube oder Drive) ein.' }, { status: 400 });
  }

  const sql = getDatabase();
  const [app] = (await sql.query(
    `SELECT a.id, a.campaign_id, a.status, a.proposed_fee_eur, c.compensation_model, c.tkp_eur_cents
     FROM brand_campaign_applications a
     JOIN brand_campaigns c ON c.id = a.campaign_id
     WHERE c.public_id = $1 AND a.creator_id = $2
     LIMIT 1`,
    [cleanText(params.id, 30), creatorId],
  )) as unknown as Array<any>;

  if (!app || !['selected', 'delivered', 'approved'].includes(String(app.status))) {
    return NextResponse.json(
      { success: false, error: 'Content kann eingereicht werden, sobald dich die Brand für diese Kampagne ausgewählt hat.' },
      { status: 403 },
    );
  }

  const platform = detectSubmissionPlatform(contentUrl);
  const title = cleanText(body.title, 140) || `Clip (${platform.toUpperCase()})`;
  const views = toPositiveIntOrNull(body.views, 500_000_000) ?? 0;
  const likes = toPositiveIntOrNull(body.likes, 100_000_000) ?? 0;
  const comments = toPositiveIntOrNull(body.comments, 10_000_000) ?? 0;
  const shares = toPositiveIntOrNull(body.shares, 50_000_000) ?? 0;
  const tkpCents = app.tkp_eur_cents === null ? 0 : Number(app.tkp_eur_cents);
  const spendCents =
    app.compensation_model === 'tkp' && tkpCents > 0
      ? Math.round((views / 1000) * tkpCents)
      : app.proposed_fee_eur
        ? Number(app.proposed_fee_eur) * 100
        : 0;

  const [created] = (await sql.query(
    `INSERT INTO brand_campaign_submissions (
       campaign_id, application_id, creator_id, platform, content_url, title,
       status, views, likes, comments, shares, spend_eur_cents, metrics_source, last_tracked_at
     ) VALUES ($1, $2, $3, $4, $5, $6, 'submitted', $7, $8, $9, $10, $11, 'manual', now())
     RETURNING id, platform, content_url, title, status, views, likes, comments, shares, created_at`,
    [app.campaign_id, app.id, creatorId, platform, contentUrl, title, views, likes, comments, shares, spendCents],
  )) as unknown as Array<any>;

  await sql.query(
    `INSERT INTO brand_campaign_metric_snapshots (submission_id, views, likes, comments, shares)
     VALUES ($1, $2, $3, $4, $5)`,
    [created.id, views, likes, comments, shares],
  );

  await sql.query(
    `UPDATE brand_campaign_applications SET status = 'delivered', updated_at = now() WHERE id = $1 AND status = 'selected'`,
    [app.id],
  );

  return NextResponse.json({ success: true, submission: created }, { status: 201 });
}

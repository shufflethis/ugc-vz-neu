import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { BRAND_SESSION_COOKIE, isTrustedSameOrigin, verifyBrandSession } from '@/app/lib/brand-session';
import { cleanText, type ApplicationStatus } from '@/app/lib/brand-workspace';

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
     RETURNING a.id, a.status, a.brand_note`,
    [nextStatus, brandNote, brandId, cleanText(params.id, 30), cleanText(params.appId, 60)],
  )) as unknown as Array<any>;

  if (!updated.length) {
    return NextResponse.json({ success: false, error: 'Bewerbung nicht gefunden.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, application: updated[0] });
}

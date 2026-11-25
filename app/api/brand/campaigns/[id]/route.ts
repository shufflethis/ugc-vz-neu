import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { BRAND_SESSION_COOKIE, isTrustedSameOrigin, verifyBrandSession } from '@/app/lib/brand-session';
import {
  cleanMultiline,
  cleanText,
  getBrandCampaignDetail,
  toPositiveIntOrNull,
} from '@/app/lib/brand-workspace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const brandId = verifyBrandSession(request.cookies.get(BRAND_SESSION_COOKIE)?.value);
  if (!brandId) return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ success: false, error: 'Datenbank nicht verfügbar.' }, { status: 503 });

  const detail = await getBrandCampaignDetail(getDatabase(), brandId, cleanText(params.id, 30));
  if (!detail) return NextResponse.json({ success: false, error: 'Kampagne nicht gefunden.' }, { status: 404 });

  return NextResponse.json({ success: true, ...detail }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
  const publicId = cleanText(params.id, 30);
  const [existing] = (await sql.query(
    `SELECT id, title, description, visibility, status, deliverables, usage_rights, deadline, total_budget_eur
     FROM brand_campaigns WHERE brand_id = $1 AND public_id = $2 LIMIT 1`,
    [brandId, publicId],
  )) as unknown as Array<any>;
  if (!existing) return NextResponse.json({ success: false, error: 'Kampagne nicht gefunden.' }, { status: 404 });

  const nextStatus = ['draft', 'active', 'paused', 'completed'].includes(String(body.status))
    ? String(body.status)
    : String(existing.status);
  const nextVisibility = ['open', 'invite_only'].includes(String(body.visibility))
    ? String(body.visibility)
    : String(existing.visibility);
  const nextTitle = body.title !== undefined ? cleanText(body.title, 140) || String(existing.title) : String(existing.title);
  const nextDescription = body.description !== undefined ? cleanMultiline(body.description, 3000) : String(existing.description || '');
  const nextDeliverables = body.deliverables !== undefined ? cleanText(body.deliverables, 240) : String(existing.deliverables || '');
  const nextRights = body.usageRights !== undefined ? cleanText(body.usageRights, 160) : String(existing.usage_rights || '');
  const nextDeadline = body.deadline !== undefined ? cleanText(body.deadline, 120) : String(existing.deadline || '');
  const nextBudget = body.totalBudgetEur !== undefined
    ? toPositiveIntOrNull(body.totalBudgetEur, 1_000_000)
    : existing.total_budget_eur;

  await sql.query(
    `UPDATE brand_campaigns
     SET title = $2, description = $3, visibility = $4, status = $5,
         deliverables = $6, usage_rights = $7, deadline = $8, total_budget_eur = $9,
         updated_at = now()
     WHERE id = $1`,
    [existing.id, nextTitle, nextDescription, nextVisibility, nextStatus, nextDeliverables, nextRights, nextDeadline, nextBudget],
  );

  const detail = await getBrandCampaignDetail(sql, brandId, publicId);
  return NextResponse.json({ success: true, ...detail });
}

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { BRAND_SESSION_COOKIE, isTrustedSameOrigin, verifyBrandSession } from '@/app/lib/brand-session';
import {
  cleanMultiline,
  cleanText,
  createBrandCampaign,
  getBrandAccount,
  listBrandCampaigns,
  toPositiveIntOrNull,
  type CampaignVisibility,
  type CompensationModel,
} from '@/app/lib/brand-workspace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const brandId = verifyBrandSession(request.cookies.get(BRAND_SESSION_COOKIE)?.value);
  if (!brandId) return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ success: false, error: 'Datenbank nicht verfügbar.' }, { status: 503 });

  const sql = getDatabase();
  const brand = await getBrandAccount(sql, brandId);
  if (!brand) return NextResponse.json({ success: false, error: 'Konto nicht gefunden.' }, { status: 401 });

  const campaigns = await listBrandCampaigns(sql, brand.id);
  return NextResponse.json({ success: true, brand, campaigns }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: NextRequest) {
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

  const title = cleanText(body.title, 140);
  if (!title) return NextResponse.json({ success: false, error: 'Bitte gib einen Kampagnentitel an.' }, { status: 400 });

  const sql = getDatabase();
  const brand = await getBrandAccount(sql, brandId);
  if (!brand) return NextResponse.json({ success: false, error: 'Konto nicht gefunden.' }, { status: 401 });

  const created = await createBrandCampaign(sql, brand, {
    title,
    brandDisplayName: cleanText(body.brandDisplayName, 120) || brand.companyName || brand.contactName || 'Brand',
    description: cleanMultiline(body.description, 3000),
    niche: cleanText(body.niche, 80),
    platforms: Array.isArray(body.platforms) ? body.platforms.map(String) : ['tiktok', 'instagram'],
    deliverables: cleanText(body.deliverables, 240),
    compensationModel: (['fixed', 'tkp', 'hybrid', 'barter'].includes(String(body.compensationModel))
      ? body.compensationModel
      : 'fixed') as CompensationModel,
    budgetPerVideoEur: toPositiveIntOrNull(body.budgetPerVideoEur, 50_000),
    totalBudgetEur: toPositiveIntOrNull(body.totalBudgetEur, 1_000_000),
    tkpEurCents: toPositiveIntOrNull(body.tkpEurCents, 50_000),
    requiresProductChoice: Boolean(body.requiresProductChoice),
    productChoicePrompt: cleanText(body.productChoicePrompt, 240),
    discountCode: cleanText(body.discountCode, 160),
    usageRights: cleanText(body.usageRights, 160),
    deadline: cleanText(body.deadline, 120),
    visibility: (body.visibility === 'invite_only' ? 'invite_only' : 'open') as CampaignVisibility,
    creatorPublicIds: Array.isArray(body.creatorPublicIds) ? body.creatorPublicIds.map(String) : [],
  });

  return NextResponse.json({ success: true, campaign: created }, { status: 201 });
}

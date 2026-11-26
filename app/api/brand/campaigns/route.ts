import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { BRAND_SESSION_COOKIE, isTrustedSameOrigin, verifyBrandSession } from '@/app/lib/brand-session';
import {
  cleanMultiline,
  cleanText,
  createBrandCampaign,
  getBrandAccount,
  listBrandCampaigns,
  sanitizeCampaignPlatforms,
  toPositiveIntOrNull,
  validateCampaignBusinessRules,
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

  const compensationModel = (['fixed', 'tkp', 'hybrid', 'affiliate', 'retainer', 'barter'].includes(String(body.compensationModel))
    ? body.compensationModel
    : 'fixed') as CompensationModel;
  const affiliateEnabled = compensationModel === 'affiliate' || Boolean(body.affiliateEnabled);
  const affiliateType = body.affiliateType === 'fixed_per_sale' ? 'fixed_per_sale' : 'percent';
  const platforms = sanitizeCampaignPlatforms(body.platforms);
  const totalBudgetEur = toPositiveIntOrNull(body.totalBudgetEur, 1_000_000);
  const rulesCheck = validateCampaignBusinessRules({
    compensationModel,
    totalBudgetEur,
    platforms,
  });
  if (!rulesCheck.ok) {
    return NextResponse.json({ success: false, error: rulesCheck.error }, { status: 400 });
  }

  const sql = getDatabase();
  const brand = await getBrandAccount(sql, brandId);
  if (!brand) return NextResponse.json({ success: false, error: 'Konto nicht gefunden.' }, { status: 401 });

  const created = await createBrandCampaign(sql, brand, {
    title,
    brandDisplayName: cleanText(body.brandDisplayName, 120) || brand.companyName || brand.contactName || 'Brand',
    description: cleanMultiline(body.description, 3000),
    niche: cleanText(body.niche, 80),
    platforms,
    deliverables: cleanText(body.deliverables, 240),
    compensationModel,
    budgetPerVideoEur: toPositiveIntOrNull(body.budgetPerVideoEur, 50_000),
    totalBudgetEur,
    tkpEurCents: toPositiveIntOrNull(body.tkpEurCents, 50_000),
    affiliateEnabled,
    affiliateType,
    affiliateRateBps: toPositiveIntOrNull(body.affiliateRateBps, 8000),
    affiliateFixedCents: toPositiveIntOrNull(body.affiliateFixedCents, 500_000),
    affiliateTargetUrl: cleanText(body.affiliateTargetUrl, 400),
    retainerMonthlyEur: toPositiveIntOrNull(body.retainerMonthlyEur, 100_000),
    retainerVideosPerMonth: toPositiveIntOrNull(body.retainerVideosPerMonth, 200),
    retainerMinMonths: toPositiveIntOrNull(body.retainerMinMonths, 36),
    retainerPerks: cleanText(body.retainerPerks, 300),
    requiresProductChoice: Boolean(body.requiresProductChoice),
    productChoicePrompt: cleanText(body.productChoicePrompt, 240),
    discountCode: cleanText(body.discountCode, 160),
    briefingChecklist: Array.isArray(body.briefingChecklist) ? body.briefingChecklist.map(String) : [],
    requiredMention: cleanText(body.requiredMention, 120),
    requiredHashtags: cleanText(body.requiredHashtags, 240),
    usageRights: cleanText(body.usageRights, 160),
    deadline: cleanText(body.deadline, 120),
    visibility: (body.visibility === 'invite_only' ? 'invite_only' : 'open') as CampaignVisibility,
    creatorPublicIds: Array.isArray(body.creatorPublicIds) ? body.creatorPublicIds.map(String) : [],
  });

  return NextResponse.json({ success: true, campaign: created }, { status: 201 });
}

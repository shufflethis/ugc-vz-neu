import crypto from 'node:crypto';
import type { getDatabase } from '@/app/lib/database';
import { BRAND_LOGIN_TTL_MINUTES } from '@/app/lib/brand-login-email';
import { humanizePriceText, safePortfolioUrl } from '@/app/lib/creator-public';
import { getActivePromo } from '@/app/lib/platform-pricing';

type DatabaseClient = ReturnType<typeof getDatabase>;

export type CompensationModel = 'fixed' | 'tkp' | 'hybrid' | 'affiliate' | 'barter';
export type AffiliateType = 'percent' | 'fixed_per_sale';
export type CampaignVisibility = 'invite_only' | 'open';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
export type ApplicationStatus = 'invited' | 'applied' | 'shortlisted' | 'selected' | 'delivered' | 'approved' | 'declined';
export type SubmissionPlatform = 'tiktok' | 'instagram' | 'youtube' | 'other';
export type SubmissionStatus = 'submitted' | 'revision_requested' | 'approved' | 'rejected';

export interface BrandAccount {
  id: string;
  email: string;
  contactName: string;
  companyName: string;
  website: string;
  emailVerifiedAt: string | null;
}

export interface CampaignSummary {
  id: string;
  publicId: string;
  title: string;
  brandDisplayName: string;
  niche: string;
  platforms: string[];
  deliverables: string;
  compensationModel: CompensationModel;
  budgetPerVideoEur: number | null;
  totalBudgetEur: number | null;
  tkpEurCents: number | null;
  affiliateEnabled?: boolean;
  affiliateType?: AffiliateType;
  affiliateRateBps?: number | null;
  affiliateFixedCents?: number | null;
  affiliateTargetUrl?: string;
  requiresProductChoice: boolean;
  productChoicePrompt: string;
  discountCode: string;
  briefingChecklist: string[];
  requiredMention: string;
  requiredHashtags: string;
  reportShareToken: string | null;
  usageRights: string;
  deadline: string;
  visibility: CampaignVisibility;
  status: CampaignStatus;
  createdAt: string;
  counts: {
    invited: number;
    applied: number;
    selected: number;
    submissions: number;
    approvedSubmissions: number;
  };
  metrics: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalSpendEurCents: number;
    accruedPayoutEur: number;
    remainingBudgetEur: number | null;
    capReached: boolean;
  };
}

export interface CampaignApplicationView {
  id: string;
  creatorPublicId: string;
  creatorName: string;
  creatorCity: string;
  creatorTopics: string;
  creatorPrice: string;
  creatorPortfolio: string[];
  verifiedSocials: Array<{ platform: string; handle: string; url: string; verifiedAt: string | null }>;
  contactEmail: string | null;
  source: 'invited' | 'applied';
  status: ApplicationStatus;
  creatorPitch: string;
  proposedFeeEur: number | null;
  availabilityNote: string;
  targetPlatforms: string[];
  productChoice: string;
  brandNote: string;
  affiliateCode?: string | null;
  affiliateClicks?: number;
  updatedAt: string;
}

export interface CampaignSubmissionView {
  id: string;
  applicationId: string;
  creatorPublicId: string;
  creatorName: string;
  platform: SubmissionPlatform;
  contentUrl: string;
  title: string;
  status: SubmissionStatus;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  spendEurCents: number;
  tkpEarnedEur: number;
  billedBlocks: number;
  reviewNote: string;
  checklistPassed: boolean;
  engagementRatePct: number;
  effectiveCpmEur: number | null;
  metricsSource: 'manual' | 'oembed' | 'api';
  lastTrackedAt: string | null;
  createdAt: string;
}

export interface CampaignPerformanceReport {
  totalSubmissions: number;
  approvedSubmissions: number;
  totalViews: number;
  approvedViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalEngagements: number;
  engagementRatePct: number;
  totalSpendEur: number;
  accruedTkpEur: number;
  approvedPayoutEur: number;
  cappedPayoutEur: number;
  remainingBudgetEur: number | null;
  capReached: boolean;
  viewsUntilCap: number | null;
  maxCapViews: number | null;
  effectiveCpmEur: number | null;
  budgetUtilizationPct: number | null;
  byPlatform: Array<{
    platform: SubmissionPlatform;
    submissions: number;
    views: number;
    engagements: number;
    engagementRatePct: number;
  }>;
  byCreator: Array<{
    creatorPublicId: string;
    creatorName: string;
    submissions: number;
    views: number;
    engagements: number;
    engagementRatePct: number;
    spendEur: number;
    tkpEarnedEur: number;
    effectiveCpmEur: number | null;
  }>;
}

export interface BrandCampaignDetail {
  campaign: CampaignSummary & { description: string };
  applications: CampaignApplicationView[];
  submissions: CampaignSubmissionView[];
  report: CampaignPerformanceReport;
}

export interface CreatorCampaignItem {
  applicationId: string | null;
  campaignPublicId: string;
  title: string;
  brandDisplayName: string;
  description: string;
  niche: string;
  platforms: string[];
  deliverables: string;
  compensationModel: CompensationModel;
  budgetPerVideoEur: number | null;
  totalBudgetEur: number | null;
  tkpEurCents: number | null;
  affiliateEnabled?: boolean;
  affiliateType?: AffiliateType;
  affiliateRateBps?: number | null;
  affiliateFixedCents?: number | null;
  affiliateTargetUrl?: string;
  affiliateCode?: string | null;
  affiliateClicks?: number;
  requiresProductChoice: boolean;
  productChoicePrompt: string;
  discountCode: string;
  briefingChecklist: string[];
  requiredMention: string;
  requiredHashtags: string;
  remainingBudgetEur: number | null;
  capReached: boolean;
  usageRights: string;
  deadline: string;
  status: ApplicationStatus | 'open';
  source: 'invited' | 'applied' | 'open';
  creatorPitch: string;
  proposedFeeEur: number | null;
  availabilityNote: string;
  targetPlatforms: string[];
  productChoice: string;
  submissions: Array<{
    id: string;
    platform: SubmissionPlatform;
    contentUrl: string;
    title: string;
    status: SubmissionStatus;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    createdAt: string;
  }>;
}

export interface CreatorSocialConnection {
  id: string;
  platform: string;
  handle: string;
  url: string;
  followers: number | null;
  canonicalHandle: string | null;
  verificationCode: string | null;
  verificationMethod: string | null;
  verifiedAt: string | null;
}

export const cleanText = (value: unknown, max: number) =>
  String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

export const cleanMultiline = (value: unknown, max: number) =>
  String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .trim()
    .slice(0, max);

export const toPositiveIntOrNull = (value: unknown, max = 1_000_000): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 0 || n > max) return null;
  return n;
};

export function detectSubmissionPlatform(url: string): SubmissionPlatform {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    if (host.includes('tiktok.com') || host === 'vm.tiktok.com') return 'tiktok';
    if (host.includes('instagram.com') || host === 'instagr.am') return 'instagram';
    if (host.includes('youtube.com') || host === 'youtu.be') return 'youtube';
    return 'other';
  } catch {
    return 'other';
  }
}

export function normalizeSocialHandle(platform: string, rawInput: string): { handle: string; url: string } | null {
  const value = cleanText(rawInput, 250);
  if (!value) return null;
  const normalizedPlatform = platform.toLowerCase();

  let handle = value;
  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      const segments = parsed.pathname.split('/').filter(Boolean);
      const first = segments[0] || '';
      handle = first.replace(/^@/, '');
    } catch {
      return null;
    }
  } else {
    handle = value.replace(/^@/, '').split(/[/?#\s]/)[0] || '';
  }

  handle = handle.toLowerCase().replace(/[^a-z0-9._-]/g, '');
  if (!handle || handle.length < 2 || handle.length > 60) return null;

  if (normalizedPlatform === 'instagram') {
    return { handle, url: `https://www.instagram.com/${handle}/` };
  }
  if (normalizedPlatform === 'tiktok') {
    return { handle, url: `https://www.tiktok.com/@${handle}` };
  }
  if (normalizedPlatform === 'youtube') {
    return { handle, url: `https://www.youtube.com/@${handle}` };
  }
  return null;
}

export function generateCampaignPublicId(): string {
  return `CMP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export const ALLOWED_CAMPAIGN_PLATFORMS = new Set([
  'tiktok',
  'instagram',
  'youtube',
  'tiktok_shop',
  'meta_ads',
  'files_only',
]);

export function sanitizeCampaignPlatforms(rawPlatforms: unknown): string[] {
  if (!Array.isArray(rawPlatforms)) return [];
  return [
    ...new Set(
      rawPlatforms
        .map((p) => String(p ?? '').toLowerCase().trim())
        .filter((p) => ALLOWED_CAMPAIGN_PLATFORMS.has(p)),
    ),
  ];
}

export function validateCampaignBusinessRules(input: {
  compensationModel: CompensationModel;
  totalBudgetEur: number | null;
  platforms: string[];
}): { ok: true } | { ok: false; error: string } {
  if (!input.platforms.length) {
    return { ok: false, error: 'Bitte wähle mindestens eine Plattform aus.' };
  }
  if (input.compensationModel === 'tkp' && (!input.totalBudgetEur || input.totalBudgetEur <= 0)) {
    return {
      ok: false,
      error: 'Für jede View-Kampagne ist eine feste Budget-Obergrenze in Euro Pflicht.',
    };
  }
  return { ok: true };
}

export async function findBrandByEmail(sql: DatabaseClient, rawEmail: string): Promise<BrandAccount | null> {
  const email = cleanText(rawEmail, 254).toLowerCase();
  if (!email) return null;
  const [existing] = (await sql.query(
    `SELECT id, email, contact_name, company_name, website, email_verified_at
     FROM brand_accounts WHERE lower(btrim(email)) = lower($1) LIMIT 1`,
    [email],
  )) as unknown as Array<any>;
  return existing ? mapBrandAccount(existing) : null;
}

export async function upsertBrandAccount(
  sql: DatabaseClient,
  input: { email: string; contactName?: string; companyName?: string; website?: string },
): Promise<BrandAccount> {
  const email = cleanText(input.email, 254).toLowerCase();
  const contactName = cleanText(input.contactName, 120);
  const companyName = cleanText(input.companyName, 140);
  const website = input.website ? safePortfolioUrl(cleanText(input.website, 300)) || '' : '';

  const [existing] = (await sql.query(
    `SELECT id, email, contact_name, company_name, website, email_verified_at
     FROM brand_accounts WHERE lower(btrim(email)) = lower($1) LIMIT 1`,
    [email],
  )) as unknown as Array<any>;

  if (existing) {
    const nextName = contactName || String(existing.contact_name || '');
    const nextCompany = companyName || String(existing.company_name || '');
    const nextWebsite = website || String(existing.website || '');
    const [updated] = (await sql.query(
      `UPDATE brand_accounts
       SET contact_name = $2, company_name = $3, website = NULLIF($4, ''), updated_at = now()
       WHERE id = $1
       RETURNING id, email, contact_name, company_name, website, email_verified_at`,
      [existing.id, nextName, nextCompany, nextWebsite],
    )) as unknown as Array<any>;
    return mapBrandAccount(updated);
  }

  const [created] = (await sql.query(
    `INSERT INTO brand_accounts (email, contact_name, company_name, website)
     VALUES ($1, $2, $3, NULLIF($4, ''))
     RETURNING id, email, contact_name, company_name, website, email_verified_at`,
    [email, contactName, companyName, website],
  )) as unknown as Array<any>;
  return mapBrandAccount(created);
}

const mapBrandAccount = (row: any): BrandAccount => ({
  id: String(row.id),
  email: String(row.email),
  contactName: String(row.contact_name || ''),
  companyName: String(row.company_name || ''),
  website: String(row.website || ''),
  emailVerifiedAt: row.email_verified_at ? new Date(row.email_verified_at).toISOString() : null,
});

export async function getBrandAccount(sql: DatabaseClient, brandId: string): Promise<BrandAccount | null> {
  const [row] = (await sql.query(
    `SELECT id, email, contact_name, company_name, website, email_verified_at
     FROM brand_accounts WHERE id = $1 LIMIT 1`,
    [brandId],
  )) as unknown as Array<any>;
  return row ? mapBrandAccount(row) : null;
}

const hashBrandOtp = (email: string, code: string) =>
  crypto.createHash('sha256').update(`brand_otp:${email.toLowerCase().trim()}:${code.trim()}`).digest('hex');

const MAX_BRAND_OTP_ATTEMPTS = 5;

export async function createBrandLoginChallenge(
  sql: DatabaseClient,
  brandId: string,
  email: string,
  redirectTo?: string,
): Promise<{ token: string; otpCode: string }> {
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const otpCode = String(crypto.randomInt(100000, 1000000));
  const otpHash = hashBrandOtp(email, otpCode);
  const expiresAt = new Date(Date.now() + BRAND_LOGIN_TTL_MINUTES * 60 * 1000).toISOString();
  const safeRedirect = redirectTo && redirectTo.startsWith('/brand') && !redirectTo.startsWith('//') ? redirectTo : '/brand';

  await sql.query(
    `INSERT INTO brand_login_tokens (brand_id, token_hash, otp_code_hash, redirect_to, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [brandId, tokenHash, otpHash, safeRedirect, expiresAt],
  );
  return { token, otpCode };
}

export async function createBrandLoginToken(
  sql: DatabaseClient,
  brandId: string,
  redirectTo?: string,
): Promise<string> {
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + BRAND_LOGIN_TTL_MINUTES * 60 * 1000).toISOString();
  const safeRedirect = redirectTo && redirectTo.startsWith('/brand') && !redirectTo.startsWith('//') ? redirectTo : '/brand';

  await sql.query(
    `INSERT INTO brand_login_tokens (brand_id, token_hash, redirect_to, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [brandId, tokenHash, safeRedirect, expiresAt],
  );
  return token;
}

export async function consumeBrandLoginOtp(
  sql: DatabaseClient,
  email: string,
  code: string,
): Promise<{ brandId: string; redirectTo: string } | null> {
  const cleanEmail = cleanText(email, 254).toLowerCase();
  const cleanCode = code.replace(/\s+/g, '');
  if (!cleanEmail || !/^\d{6}$/.test(cleanCode)) return null;

  const [latest] = (await sql.query(
    `SELECT t.id, t.brand_id, t.otp_code_hash, t.otp_attempts, t.redirect_to
     FROM brand_login_tokens t
     JOIN brand_accounts b ON b.id = t.brand_id
     WHERE lower(btrim(b.email)) = lower($1)
       AND t.used_at IS NULL
       AND t.expires_at > now()
       AND t.otp_code_hash IS NOT NULL
     ORDER BY t.created_at DESC
     LIMIT 1`,
    [cleanEmail],
  )) as unknown as Array<any>;

  if (!latest || Number(latest.otp_attempts) >= MAX_BRAND_OTP_ATTEMPTS) return null;

  const candidateHash = hashBrandOtp(cleanEmail, cleanCode);
  const storedHash = String(latest.otp_code_hash || '');
  const match =
    candidateHash.length === storedHash.length &&
    crypto.timingSafeEqual(Buffer.from(candidateHash), Buffer.from(storedHash));

  if (!match) {
    await sql.query(
      `UPDATE brand_login_tokens
       SET otp_attempts = otp_attempts + 1,
           used_at = CASE WHEN otp_attempts + 1 >= $2 THEN now() ELSE used_at END
       WHERE id = $1`,
      [latest.id, MAX_BRAND_OTP_ATTEMPTS],
    );
    return null;
  }

  const rows = (await sql.query(
    `WITH consumed AS (
       UPDATE brand_login_tokens
       SET used_at = now()
       WHERE id = $1 AND used_at IS NULL AND expires_at > now()
       RETURNING brand_id, redirect_to
     )
     UPDATE brand_accounts b
     SET email_verified_at = COALESCE(b.email_verified_at, now()), updated_at = now()
     FROM consumed
     WHERE b.id = consumed.brand_id
     RETURNING b.id AS brand_id, consumed.redirect_to`,
    [latest.id],
  )) as unknown as Array<any>;

  if (!rows.length) return null;
  const row = rows[0];
  const redirectTo = typeof row.redirect_to === 'string' && row.redirect_to.startsWith('/brand') && !row.redirect_to.startsWith('//')
    ? row.redirect_to
    : '/brand';
  return { brandId: String(row.brand_id), redirectTo };
}

export async function consumeBrandLoginToken(
  sql: DatabaseClient,
  token: string,
): Promise<{ brandId: string; redirectTo: string } | null> {
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) return null;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const rows = (await sql.query(
    `WITH consumed AS (
       UPDATE brand_login_tokens
       SET used_at = now()
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
       RETURNING brand_id, redirect_to
     )
     UPDATE brand_accounts b
     SET email_verified_at = COALESCE(b.email_verified_at, now()), updated_at = now()
     FROM consumed
     WHERE b.id = consumed.brand_id
     RETURNING b.id AS brand_id, consumed.redirect_to`,
    [tokenHash],
  )) as unknown as Array<any>;

  if (!rows.length) return null;
  const row = rows[0];
  const redirectTo = typeof row.redirect_to === 'string' && row.redirect_to.startsWith('/brand') && !row.redirect_to.startsWith('//')
    ? row.redirect_to
    : '/brand';
  return { brandId: String(row.brand_id), redirectTo };
}

export async function createBrandCampaign(
  sql: DatabaseClient,
  brand: BrandAccount,
  input: {
    title: string;
    brandDisplayName?: string;
    description?: string;
    niche?: string;
    platforms?: string[];
    deliverables?: string;
    compensationModel?: CompensationModel;
    budgetPerVideoEur?: number | null;
    totalBudgetEur?: number | null;
    tkpEurCents?: number | null;
    affiliateEnabled?: boolean;
    affiliateType?: AffiliateType;
    affiliateRateBps?: number | null;
    affiliateFixedCents?: number | null;
    affiliateTargetUrl?: string;
    requiresProductChoice?: boolean;
    productChoicePrompt?: string;
    discountCode?: string;
    briefingChecklist?: string[];
    requiredMention?: string;
    requiredHashtags?: string;
    usageRights?: string;
    deadline?: string;
    visibility?: CampaignVisibility;
    creatorPublicIds?: string[];
    sourceLeadPublicId?: string;
  },
): Promise<{ id: string; publicId: string; invitedCount: number; reportShareToken: string }> {
  const title = cleanText(input.title, 140) || 'Neue UGC-Kampagne';
  const brandDisplayName = cleanText(input.brandDisplayName || brand.companyName || brand.contactName, 120) || 'Brand';
  const description = cleanMultiline(input.description, 3000);
  const niche = cleanText(input.niche, 80);
  const allowedPlatforms = new Set(['tiktok', 'instagram', 'youtube', 'tiktok_shop', 'meta_ads', 'files_only']);
  const platforms = [...new Set((input.platforms || []).map((p) => p.toLowerCase().trim()).filter((p) => allowedPlatforms.has(p)))];
  const deliverables = cleanText(input.deliverables, 240);
  const compensationModel: CompensationModel = ['fixed', 'tkp', 'hybrid', 'affiliate', 'barter'].includes(String(input.compensationModel))
    ? (input.compensationModel as CompensationModel)
    : 'fixed';
  const affiliateEnabled = compensationModel === 'affiliate' || Boolean(input.affiliateEnabled);
  const affiliateType: AffiliateType = input.affiliateType === 'fixed_per_sale' ? 'fixed_per_sale' : 'percent';
  const affiliateRateBps = affiliateEnabled && affiliateType === 'percent'
    ? (toPositiveIntOrNull(input.affiliateRateBps, 8000) ?? 1000)
    : null;
  const affiliateFixedCents = affiliateEnabled && affiliateType === 'fixed_per_sale'
    ? (toPositiveIntOrNull(input.affiliateFixedCents, 500_000) ?? 1500)
    : null;
  const affiliateTargetUrl = cleanText(input.affiliateTargetUrl, 400);
  const affiliateWebhookSecret = affiliateEnabled ? `aff_${crypto.randomBytes(18).toString('hex')}` : '';
  const visibility: CampaignVisibility = input.visibility === 'invite_only' ? 'invite_only' : 'open';
  const requiresProductChoice = Boolean(input.requiresProductChoice);
  const productChoicePrompt = cleanText(input.productChoicePrompt, 240);
  const discountCode = cleanText(input.discountCode, 160);
  const briefingChecklist = (input.briefingChecklist || [])
    .map((item) => cleanText(item, 180))
    .filter(Boolean)
    .slice(0, 8);
  const requiredMention = cleanText(input.requiredMention, 120);
  const requiredHashtags = cleanText(input.requiredHashtags, 240);
  const publicId = generateCampaignPublicId();
  const reportShareToken = crypto.randomBytes(18).toString('base64url');
  const promo = getActivePromo(new Date());

  const baseParams = [
    publicId,
    brand.id,
    title,
    brandDisplayName,
    description,
    niche,
    platforms,
    deliverables,
    compensationModel,
    toPositiveIntOrNull(input.budgetPerVideoEur, 50_000),
    toPositiveIntOrNull(input.totalBudgetEur, 1_000_000),
    toPositiveIntOrNull(input.tkpEurCents, 50_000),
    requiresProductChoice,
    productChoicePrompt,
    discountCode,
    briefingChecklist,
    requiredMention,
    requiredHashtags,
    reportShareToken,
    cleanText(input.usageRights, 160),
    cleanText(input.deadline, 120),
    visibility,
    input.sourceLeadPublicId ? cleanText(input.sourceLeadPublicId, 40) : null,
  ];

  let campaign: any;
  try {
    const [row] = (await sql.query(
      `INSERT INTO brand_campaigns (
         public_id, brand_id, title, brand_display_name, description, niche, platforms,
         deliverables, compensation_model, budget_per_video_eur, total_budget_eur,
         tkp_eur_cents, requires_product_choice, product_choice_prompt, discount_code,
         briefing_checklist, required_mention, required_hashtags, report_share_token,
         usage_rights, deadline, visibility, status, source_lead_public_id,
         platform_fee_bps, fee_promo_code, creator_fee_bps,
         affiliate_enabled, affiliate_type, affiliate_rate_bps, affiliate_fixed_cents,
         affiliate_target_url, affiliate_webhook_secret
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,'active',$23,$24,$25,$26,$27,$28,$29,$30,$31,$32)
       RETURNING id, public_id`,
      [
        ...baseParams,
        promo.rateBps,
        promo.code,
        promo.creatorFeeBps,
        affiliateEnabled,
        affiliateType,
        affiliateRateBps,
        affiliateFixedCents,
        affiliateTargetUrl,
        affiliateWebhookSecret,
      ],
    )) as unknown as Array<any>;
    campaign = row;
  } catch (err: any) {
    // Graceful fallback wenn Migration 022/026 in einer Umgebung noch nicht eingespielt ist.
    const message = String(err?.message || '');
    if (err?.code !== '42703' && !message.includes('platform_fee_bps') && !message.includes('affiliate_enabled')) {
      throw err;
    }
    const [row] = (await sql.query(
      `INSERT INTO brand_campaigns (
         public_id, brand_id, title, brand_display_name, description, niche, platforms,
         deliverables, compensation_model, budget_per_video_eur, total_budget_eur,
         tkp_eur_cents, requires_product_choice, product_choice_prompt, discount_code,
         briefing_checklist, required_mention, required_hashtags, report_share_token,
         usage_rights, deadline, visibility, status, source_lead_public_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,'active',$23)
       RETURNING id, public_id`,
      baseParams,
    )) as unknown as Array<any>;
    campaign = row;
  }

  const validCreatorPublicIds = [...new Set((input.creatorPublicIds || [])
    .map((id) => cleanText(id, 40))
    .filter((id) => /^UGC-[A-F0-9]{10}$/.test(id)))]
    .slice(0, 20);

  let invitedCount = 0;
  if (validCreatorPublicIds.length) {
    const invited = (await sql.query(
      `INSERT INTO brand_campaign_applications (campaign_id, creator_id, source, status, invited_at)
       SELECT $1, p.id, 'invited', 'invited', now()
       FROM creator_profiles p
       WHERE p.public_id = ANY($2::text[]) AND p.status = 'active'
       ON CONFLICT (campaign_id, creator_id) DO NOTHING
       RETURNING id`,
      [campaign.id, validCreatorPublicIds],
    )) as unknown as Array<any>;
    invitedCount = invited.length;
  }

  return { id: String(campaign.id), publicId: String(campaign.public_id), invitedCount, reportShareToken };
}

const computeTkpEur = (views: number, tkpEurCents: number | null | undefined): number => {
  if (!tkpEurCents || tkpEurCents <= 0 || views <= 0) return 0;
  return Math.round(((views / 1000) * (tkpEurCents / 100)) * 100) / 100;
};

const computeBudgetCapState = (
  compensationModel: CompensationModel,
  totalViews: number,
  totalSpendEurCents: number,
  totalBudgetEur: number | null,
  tkpEurCents: number | null,
) => {
  const spendEur = Math.round((totalSpendEurCents / 100) * 100) / 100;
  const accruedTkpEur = computeTkpEur(totalViews, tkpEurCents);
  const accruedPayoutEur =
    compensationModel === 'tkp' && tkpEurCents && tkpEurCents > 0
      ? Math.max(spendEur, accruedTkpEur)
      : spendEur;
  const cappedPayoutEur = totalBudgetEur && totalBudgetEur > 0
    ? Math.min(accruedPayoutEur, totalBudgetEur)
    : accruedPayoutEur;
  const remainingBudgetEur = totalBudgetEur && totalBudgetEur > 0
    ? Math.max(0, Math.round((totalBudgetEur - cappedPayoutEur) * 100) / 100)
    : null;
  const capReached = Boolean(totalBudgetEur && totalBudgetEur > 0 && accruedPayoutEur >= totalBudgetEur);
  return { accruedPayoutEur, cappedPayoutEur, remainingBudgetEur, capReached };
};

export async function listBrandCampaigns(sql: DatabaseClient, brandId: string): Promise<CampaignSummary[]> {
  let rows: Array<any>;
  try {
    rows = (await sql.query(
      `SELECT
         c.id, c.public_id, c.title, c.brand_display_name, c.niche, c.platforms,
         c.deliverables, c.compensation_model, c.budget_per_video_eur, c.total_budget_eur,
         c.tkp_eur_cents, c.affiliate_enabled, c.affiliate_type, c.affiliate_rate_bps,
         c.affiliate_fixed_cents, c.affiliate_target_url,
         c.requires_product_choice, c.product_choice_prompt, c.discount_code,
         c.briefing_checklist, c.required_mention, c.required_hashtags, c.report_share_token,
         c.usage_rights, c.deadline, c.visibility, c.status, c.created_at,
         COALESCE(app.invited_count, 0)::int AS invited_count,
         COALESCE(app.applied_count, 0)::int AS applied_count,
         COALESCE(app.selected_count, 0)::int AS selected_count,
         COALESCE(sub.submission_count, 0)::int AS submission_count,
         COALESCE(sub.approved_count, 0)::int AS approved_count,
         COALESCE(sub.total_views, 0)::int AS total_views,
         COALESCE(sub.total_likes, 0)::int AS total_likes,
         COALESCE(sub.total_comments, 0)::int AS total_comments,
         COALESCE(sub.total_shares, 0)::int AS total_shares,
         COALESCE(sub.total_spend_cents, 0)::int AS total_spend_cents
       FROM brand_campaigns c
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*) FILTER (WHERE a.source = 'invited') AS invited_count,
           COUNT(*) FILTER (WHERE a.source = 'applied' OR a.status = 'applied') AS applied_count,
           COUNT(*) FILTER (WHERE a.status IN ('selected', 'delivered', 'approved')) AS selected_count
         FROM brand_campaign_applications a
         WHERE a.campaign_id = c.id
       ) app ON true
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*) AS submission_count,
           COUNT(*) FILTER (WHERE s.status = 'approved') AS approved_count,
           COALESCE(SUM(s.views), 0) AS total_views,
           COALESCE(SUM(s.likes), 0) AS total_likes,
           COALESCE(SUM(s.comments), 0) AS total_comments,
           COALESCE(SUM(s.shares), 0) AS total_shares,
           COALESCE(SUM(s.spend_eur_cents), 0) AS total_spend_cents
         FROM brand_campaign_submissions s
         WHERE s.campaign_id = c.id
       ) sub ON true
       WHERE c.brand_id = $1
       ORDER BY c.created_at DESC`,
      [brandId],
    )) as unknown as Array<any>;
  } catch (err: any) {
    if (err?.code !== '42703') throw err;
    rows = (await sql.query(
      `SELECT
         c.id, c.public_id, c.title, c.brand_display_name, c.niche, c.platforms,
         c.deliverables, c.compensation_model, c.budget_per_video_eur, c.total_budget_eur,
         c.tkp_eur_cents, c.requires_product_choice, c.product_choice_prompt, c.discount_code,
         c.briefing_checklist, c.required_mention, c.required_hashtags, c.report_share_token,
         c.usage_rights, c.deadline, c.visibility, c.status, c.created_at,
         COALESCE(app.invited_count, 0)::int AS invited_count,
         COALESCE(app.applied_count, 0)::int AS applied_count,
         COALESCE(app.selected_count, 0)::int AS selected_count,
         COALESCE(sub.submission_count, 0)::int AS submission_count,
         COALESCE(sub.approved_count, 0)::int AS approved_count,
         COALESCE(sub.total_views, 0)::int AS total_views,
         COALESCE(sub.total_likes, 0)::int AS total_likes,
         COALESCE(sub.total_comments, 0)::int AS total_comments,
         COALESCE(sub.total_shares, 0)::int AS total_shares,
         COALESCE(sub.total_spend_cents, 0)::int AS total_spend_cents
       FROM brand_campaigns c
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*) FILTER (WHERE a.source = 'invited') AS invited_count,
           COUNT(*) FILTER (WHERE a.source = 'applied' OR a.status = 'applied') AS applied_count,
           COUNT(*) FILTER (WHERE a.status IN ('selected', 'delivered', 'approved')) AS selected_count
         FROM brand_campaign_applications a
         WHERE a.campaign_id = c.id
       ) app ON true
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*) AS submission_count,
           COUNT(*) FILTER (WHERE s.status = 'approved') AS approved_count,
           COALESCE(SUM(s.views), 0) AS total_views,
           COALESCE(SUM(s.likes), 0) AS total_likes,
           COALESCE(SUM(s.comments), 0) AS total_comments,
           COALESCE(SUM(s.shares), 0) AS total_shares,
           COALESCE(SUM(s.spend_eur_cents), 0) AS total_spend_cents
         FROM brand_campaign_submissions s
         WHERE s.campaign_id = c.id
       ) sub ON true
       WHERE c.brand_id = $1
       ORDER BY c.created_at DESC`,
      [brandId],
    )) as unknown as Array<any>;
  }

  return rows.map((row) => {
    const compensationModel = row.compensation_model as CompensationModel;
    const totalBudgetEur = row.total_budget_eur === null ? null : Number(row.total_budget_eur);
    const tkpEurCents = row.tkp_eur_cents === null ? null : Number(row.tkp_eur_cents);
    const totalViews = Number(row.total_views) || 0;
    const totalSpendEurCents = Number(row.total_spend_cents) || 0;
    const capState = computeBudgetCapState(compensationModel, totalViews, totalSpendEurCents, totalBudgetEur, tkpEurCents);
    return {
      id: String(row.id),
      publicId: String(row.public_id),
      title: String(row.title),
      brandDisplayName: String(row.brand_display_name),
      niche: String(row.niche || ''),
      platforms: Array.isArray(row.platforms) ? row.platforms.map(String) : [],
      deliverables: String(row.deliverables || ''),
      compensationModel,
      budgetPerVideoEur: row.budget_per_video_eur === null ? null : Number(row.budget_per_video_eur),
      totalBudgetEur,
      tkpEurCents,
      affiliateEnabled: Boolean(row.affiliate_enabled),
      affiliateType: (row.affiliate_type === 'fixed_per_sale' ? 'fixed_per_sale' : 'percent') as AffiliateType,
      affiliateRateBps: row.affiliate_rate_bps === null || row.affiliate_rate_bps === undefined ? null : Number(row.affiliate_rate_bps),
      affiliateFixedCents: row.affiliate_fixed_cents === null || row.affiliate_fixed_cents === undefined ? null : Number(row.affiliate_fixed_cents),
      affiliateTargetUrl: String(row.affiliate_target_url || ''),
      affiliateCode: row.affiliate_code ? String(row.affiliate_code) : null,
      affiliateClicks: Number(row.affiliate_clicks || 0),
      requiresProductChoice: Boolean(row.requires_product_choice),
      productChoicePrompt: String(row.product_choice_prompt || ''),
      discountCode: String(row.discount_code || ''),
      briefingChecklist: Array.isArray(row.briefing_checklist) ? row.briefing_checklist.map(String) : [],
      requiredMention: String(row.required_mention || ''),
      requiredHashtags: String(row.required_hashtags || ''),
      reportShareToken: row.report_share_token ? String(row.report_share_token) : null,
      usageRights: String(row.usage_rights || ''),
      deadline: String(row.deadline || ''),
      visibility: row.visibility as CampaignVisibility,
      status: row.status as CampaignStatus,
      createdAt: new Date(row.created_at).toISOString(),
      counts: {
        invited: Number(row.invited_count) || 0,
        applied: Number(row.applied_count) || 0,
        selected: Number(row.selected_count) || 0,
        submissions: Number(row.submission_count) || 0,
        approvedSubmissions: Number(row.approved_count) || 0,
      },
      metrics: {
        totalViews,
        totalLikes: Number(row.total_likes) || 0,
        totalComments: Number(row.total_comments) || 0,
        totalShares: Number(row.total_shares) || 0,
        totalSpendEurCents,
        accruedPayoutEur: capState.accruedPayoutEur,
        remainingBudgetEur: capState.remainingBudgetEur,
        capReached: capState.capReached,
      },
    };
  });
}

export function computeCampaignReport(
  submissions: CampaignSubmissionView[],
  totalBudgetOrOptions:
    | number
    | null
    | { totalBudgetEur: number | null; compensationModel?: CompensationModel; tkpEurCents?: number | null },
): CampaignPerformanceReport {
  const opts =
    typeof totalBudgetOrOptions === 'object' && totalBudgetOrOptions !== null
      ? totalBudgetOrOptions
      : { totalBudgetEur: totalBudgetOrOptions, compensationModel: 'fixed' as CompensationModel, tkpEurCents: null };
  const totalBudgetEur = opts.totalBudgetEur ?? null;
  const compensationModel: CompensationModel = opts.compensationModel || 'fixed';
  const tkpEurCents = opts.tkpEurCents ?? null;

  const totalViews = submissions.reduce((sum, s) => sum + s.views, 0);
  const approvedSubs = submissions.filter((s) => s.status === 'approved');
  const approvedViews = approvedSubs.reduce((sum, s) => sum + s.views, 0);
  const totalLikes = submissions.reduce((sum, s) => sum + s.likes, 0);
  const totalComments = submissions.reduce((sum, s) => sum + s.comments, 0);
  const totalShares = submissions.reduce((sum, s) => sum + s.shares, 0);
  const totalEngagements = totalLikes + totalComments + totalShares;
  const totalSpendCents = submissions.reduce((sum, s) => sum + s.spendEurCents, 0);
  const totalSpendEur = Math.round((totalSpendCents / 100) * 100) / 100;
  const accruedTkpEur = computeTkpEur(totalViews, tkpEurCents);
  const approvedSpendEur = Math.round((approvedSubs.reduce((sum, s) => sum + s.spendEurCents, 0) / 100) * 100) / 100;
  const approvedTkpEur = computeTkpEur(approvedViews, tkpEurCents);
  const approvedPayoutEur =
    compensationModel === 'tkp' && tkpEurCents && tkpEurCents > 0
      ? Math.max(approvedSpendEur, approvedTkpEur)
      : approvedSpendEur;

  const rawTotalPayoutEur =
    compensationModel === 'tkp' && tkpEurCents && tkpEurCents > 0
      ? Math.max(totalSpendEur, accruedTkpEur)
      : totalSpendEur;
  const cappedPayoutEur = totalBudgetEur && totalBudgetEur > 0
    ? Math.min(rawTotalPayoutEur, totalBudgetEur)
    : rawTotalPayoutEur;
  const remainingBudgetEur = totalBudgetEur && totalBudgetEur > 0
    ? Math.max(0, Math.round((totalBudgetEur - cappedPayoutEur) * 100) / 100)
    : null;
  const capReached = Boolean(totalBudgetEur && totalBudgetEur > 0 && rawTotalPayoutEur >= totalBudgetEur);
  const maxCapViews =
    totalBudgetEur && totalBudgetEur > 0 && tkpEurCents && tkpEurCents > 0
      ? Math.floor(((totalBudgetEur * 100) / tkpEurCents) * 1000)
      : null;
  const viewsUntilCap =
    remainingBudgetEur !== null && tkpEurCents && tkpEurCents > 0
      ? Math.floor(((remainingBudgetEur * 100) / tkpEurCents) * 1000)
      : null;

  const engagementRatePct = totalViews > 0 ? Math.round((totalEngagements / totalViews) * 10_000) / 100 : 0;
  const effectiveSpendForCpm = cappedPayoutEur > 0 ? cappedPayoutEur : totalSpendEur;
  const effectiveCpmEur = totalViews > 0 && effectiveSpendForCpm > 0
    ? Math.round((effectiveSpendForCpm / (totalViews / 1000)) * 100) / 100
    : null;
  const budgetUtilizationPct =
    totalBudgetEur && totalBudgetEur > 0
      ? Math.min(999, Math.round((rawTotalPayoutEur / totalBudgetEur) * 1000) / 10)
      : null;

  const platformMap = new Map<SubmissionPlatform, { submissions: number; views: number; engagements: number }>();
  const creatorMap = new Map<
    string,
    { creatorPublicId: string; creatorName: string; submissions: number; views: number; engagements: number; spendCents: number; tkpEarnedEur: number }
  >();

  for (const s of submissions) {
    const eng = s.likes + s.comments + s.shares;
    const p = platformMap.get(s.platform) || { submissions: 0, views: 0, engagements: 0 };
    p.submissions += 1;
    p.views += s.views;
    p.engagements += eng;
    platformMap.set(s.platform, p);

    const clipTkpEur = computeTkpEur(s.views, tkpEurCents);
    const c = creatorMap.get(s.creatorPublicId) || {
      creatorPublicId: s.creatorPublicId,
      creatorName: s.creatorName,
      submissions: 0,
      views: 0,
      engagements: 0,
      spendCents: 0,
      tkpEarnedEur: 0,
    };
    c.submissions += 1;
    c.views += s.views;
    c.engagements += eng;
    c.spendCents += s.spendEurCents;
    c.tkpEarnedEur = Math.round((c.tkpEarnedEur + clipTkpEur) * 100) / 100;
    creatorMap.set(s.creatorPublicId, c);
  }

  return {
    totalSubmissions: submissions.length,
    approvedSubmissions: approvedSubs.length,
    totalViews,
    approvedViews,
    totalLikes,
    totalComments,
    totalShares,
    totalEngagements,
    engagementRatePct,
    totalSpendEur,
    accruedTkpEur,
    approvedPayoutEur,
    cappedPayoutEur,
    remainingBudgetEur,
    capReached,
    viewsUntilCap,
    maxCapViews,
    effectiveCpmEur,
    budgetUtilizationPct,
    byPlatform: [...platformMap.entries()].map(([platform, p]) => ({
      platform,
      submissions: p.submissions,
      views: p.views,
      engagements: p.engagements,
      engagementRatePct: p.views > 0 ? Math.round((p.engagements / p.views) * 10_000) / 100 : 0,
    })),
    byCreator: [...creatorMap.values()]
      .sort((a, b) => b.views - a.views)
      .map((c) => {
        const spendEur = Math.round((c.spendCents / 100) * 100) / 100;
        const effectiveCreatorSpend =
          compensationModel === 'tkp' && tkpEurCents && tkpEurCents > 0
            ? Math.max(spendEur, c.tkpEarnedEur)
            : spendEur;
        return {
          creatorPublicId: c.creatorPublicId,
          creatorName: c.creatorName,
          submissions: c.submissions,
          views: c.views,
          engagements: c.engagements,
          engagementRatePct: c.views > 0 ? Math.round((c.engagements / c.views) * 10_000) / 100 : 0,
          spendEur,
          tkpEarnedEur: c.tkpEarnedEur,
          effectiveCpmEur: c.views > 0 && effectiveCreatorSpend > 0
            ? Math.round((effectiveCreatorSpend / (c.views / 1000)) * 100) / 100
            : null,
        };
      }),
  };
}

export async function getBrandCampaignDetail(
  sql: DatabaseClient,
  brandId: string,
  campaignPublicId: string,
): Promise<BrandCampaignDetail | null> {
  const [campRow] = (await sql.query(
    `SELECT * FROM brand_campaigns WHERE brand_id = $1 AND public_id = $2 LIMIT 1`,
    [brandId, campaignPublicId],
  )) as unknown as Array<any>;
  if (!campRow) return null;

  let appRows: Array<any>;
  try {
    appRows = (await sql.query(
      `SELECT
         a.id, a.source, a.status, a.creator_pitch, a.proposed_fee_eur,
         a.availability_note, a.target_platforms, a.product_choice, a.brand_note,
         a.affiliate_code, a.affiliate_clicks, a.updated_at,
         p.public_id AS creator_public_id, p.display_name, p.city, p.topics, p.rate_text,
         CASE
           WHEN c.project_notifications_enabled AND c.notification_paused_at IS NULL
                AND a.status IN ('applied', 'shortlisted', 'selected', 'delivered', 'approved')
           THEN c.email
           ELSE NULL
         END AS contact_email,
         COALESCE(pf.links, '[]'::json) AS portfolio_links,
         COALESCE(sc.accounts, '[]'::json) AS social_accounts
       FROM brand_campaign_applications a
       JOIN creator_profiles p ON p.id = a.creator_id
       LEFT JOIN creator_private_contacts c ON c.creator_id = p.id
       LEFT JOIN LATERAL (
         SELECT json_agg(f.url ORDER BY f.created_at DESC) AS links
         FROM creator_portfolio_items f
         WHERE f.creator_id = p.id
       ) pf ON true
       LEFT JOIN LATERAL (
         SELECT json_agg(json_build_object(
           'platform', s.platform,
           'handle', COALESCE(s.canonical_handle, s.handle, ''),
           'url', s.url,
           'verifiedAt', s.verified_at
         ) ORDER BY s.verified_at DESC NULLS LAST, s.is_primary DESC) AS accounts
         FROM creator_social_accounts s
         WHERE s.creator_id = p.id
       ) sc ON true
       WHERE a.campaign_id = $1
       ORDER BY
         CASE a.status
           WHEN 'delivered' THEN 1
           WHEN 'selected' THEN 2
           WHEN 'applied' THEN 3
           WHEN 'shortlisted' THEN 4
           WHEN 'invited' THEN 5
           WHEN 'approved' THEN 6
           ELSE 7
         END,
         a.updated_at DESC`,
      [campRow.id],
    )) as unknown as Array<any>;
  } catch (err: any) {
    if (err?.code !== '42703') throw err;
    appRows = (await sql.query(
      `SELECT
         a.id, a.source, a.status, a.creator_pitch, a.proposed_fee_eur,
         a.availability_note, a.target_platforms, a.product_choice, a.brand_note, a.updated_at,
         p.public_id AS creator_public_id, p.display_name, p.city, p.topics, p.rate_text,
         CASE
           WHEN c.project_notifications_enabled AND c.notification_paused_at IS NULL
                AND a.status IN ('applied', 'shortlisted', 'selected', 'delivered', 'approved')
           THEN c.email
           ELSE NULL
         END AS contact_email,
         COALESCE(pf.links, '[]'::json) AS portfolio_links,
         COALESCE(sc.accounts, '[]'::json) AS social_accounts
       FROM brand_campaign_applications a
       JOIN creator_profiles p ON p.id = a.creator_id
       LEFT JOIN creator_private_contacts c ON c.creator_id = p.id
       LEFT JOIN LATERAL (
         SELECT json_agg(f.url ORDER BY f.created_at DESC) AS links
         FROM creator_portfolio_items f
         WHERE f.creator_id = p.id
       ) pf ON true
       LEFT JOIN LATERAL (
         SELECT json_agg(json_build_object(
           'platform', s.platform,
           'handle', COALESCE(s.canonical_handle, s.handle, ''),
           'url', s.url,
           'verifiedAt', s.verified_at
         ) ORDER BY s.verified_at DESC NULLS LAST, s.is_primary DESC) AS accounts
         FROM creator_social_accounts s
         WHERE s.creator_id = p.id
       ) sc ON true
       WHERE a.campaign_id = $1
       ORDER BY
         CASE a.status
           WHEN 'delivered' THEN 1
           WHEN 'selected' THEN 2
           WHEN 'applied' THEN 3
           WHEN 'shortlisted' THEN 4
           WHEN 'invited' THEN 5
           WHEN 'approved' THEN 6
           ELSE 7
         END,
         a.updated_at DESC`,
      [campRow.id],
    )) as unknown as Array<any>;
  }

  const applications: CampaignApplicationView[] = appRows.map((row) => {
    const rawLinks = Array.isArray(row.portfolio_links) ? row.portfolio_links : [];
    const rawSocials = Array.isArray(row.social_accounts) ? row.social_accounts : [];
    return {
      id: String(row.id),
      creatorPublicId: String(row.creator_public_id),
      creatorName: String(row.display_name || 'Creator').split(' ')[0],
      creatorCity: String(row.city || ''),
      creatorTopics: String(row.topics || ''),
      creatorPrice: humanizePriceText(row.rate_text) || 'Auf Anfrage',
      creatorPortfolio: rawLinks.map((u: unknown) => safePortfolioUrl(String(u))).filter((u: string | null): u is string => Boolean(u)).slice(0, 4),
      verifiedSocials: rawSocials
        .filter((s: any) => s && typeof s.url === 'string' && safePortfolioUrl(s.url))
        .map((s: any) => ({
          platform: String(s.platform || 'other'),
          handle: String(s.handle || ''),
          url: String(s.url),
          verifiedAt: s.verifiedAt ? new Date(s.verifiedAt).toISOString() : null,
        })),
      contactEmail: row.contact_email ? String(row.contact_email) : null,
      source: row.source as 'invited' | 'applied',
      status: row.status as ApplicationStatus,
      creatorPitch: String(row.creator_pitch || ''),
      proposedFeeEur: row.proposed_fee_eur === null ? null : Number(row.proposed_fee_eur),
      availabilityNote: String(row.availability_note || ''),
      targetPlatforms: Array.isArray(row.target_platforms) ? row.target_platforms.map(String) : [],
      productChoice: String(row.product_choice || ''),
      brandNote: String(row.brand_note || ''),
      affiliateCode: row.affiliate_code ? String(row.affiliate_code) : null,
      affiliateClicks: Number(row.affiliate_clicks || 0),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  });

  const subRows = (await sql.query(
    `SELECT
       s.id, s.application_id, s.platform, s.content_url, s.title, s.status,
       s.views, s.likes, s.comments, s.shares, s.spend_eur_cents, s.metrics_source,
       s.review_note, s.checklist_passed, s.last_tracked_at, s.created_at,
       p.public_id AS creator_public_id, p.display_name
     FROM brand_campaign_submissions s
     JOIN creator_profiles p ON p.id = s.creator_id
     WHERE s.campaign_id = $1
     ORDER BY s.created_at DESC`,
    [campRow.id],
  )) as unknown as Array<any>;

  let reportShareToken: string | null = campRow.report_share_token ? String(campRow.report_share_token) : null;
  if (!reportShareToken) {
    reportShareToken = crypto.randomBytes(18).toString('base64url');
    await sql.query(
      `UPDATE brand_campaigns SET report_share_token = $2 WHERE id = $1 AND report_share_token IS NULL`,
      [campRow.id, reportShareToken],
    );
  }

  const tkpEurCents = campRow.tkp_eur_cents === null ? null : Number(campRow.tkp_eur_cents);
  const compensationModel = campRow.compensation_model as CompensationModel;

  const submissions: CampaignSubmissionView[] = subRows.map((row) => {
    const views = Number(row.views) || 0;
    const likes = Number(row.likes) || 0;
    const comments = Number(row.comments) || 0;
    const shares = Number(row.shares) || 0;
    const spendEurCents = Number(row.spend_eur_cents) || 0;
    const tkpEarnedEur = computeTkpEur(views, tkpEurCents);
    const billedBlocks = Math.floor(views / 1000);
    const engagements = likes + comments + shares;
    const engagementRatePct = views > 0 ? Math.round((engagements / views) * 10_000) / 100 : 0;
    const effectiveCostEur =
      compensationModel === 'tkp' && tkpEurCents && tkpEurCents > 0
        ? Math.max(spendEurCents / 100, tkpEarnedEur)
        : spendEurCents / 100;
    const effectiveCpmEur = views > 0 && effectiveCostEur > 0
      ? Math.round((effectiveCostEur / (views / 1000)) * 100) / 100
      : null;
    return {
      id: String(row.id),
      applicationId: String(row.application_id),
      creatorPublicId: String(row.creator_public_id),
      creatorName: String(row.display_name || 'Creator').split(' ')[0],
      platform: row.platform as SubmissionPlatform,
      contentUrl: String(row.content_url),
      title: String(row.title || ''),
      status: row.status as SubmissionStatus,
      views,
      likes,
      comments,
      shares,
      spendEurCents,
      tkpEarnedEur,
      billedBlocks,
      reviewNote: String(row.review_note || ''),
      checklistPassed: Boolean(row.checklist_passed),
      engagementRatePct,
      effectiveCpmEur,
      metricsSource: (row.metrics_source || 'manual') as 'manual' | 'oembed' | 'api',
      lastTrackedAt: row.last_tracked_at ? new Date(row.last_tracked_at).toISOString() : null,
      createdAt: new Date(row.created_at).toISOString(),
    };
  });

  const totalBudgetEur = campRow.total_budget_eur === null ? null : Number(campRow.total_budget_eur);
  const report = computeCampaignReport(submissions, { totalBudgetEur, compensationModel, tkpEurCents });

  return {
    campaign: {
      id: String(campRow.id),
      publicId: String(campRow.public_id),
      title: String(campRow.title),
      brandDisplayName: String(campRow.brand_display_name),
      description: String(campRow.description || ''),
      niche: String(campRow.niche || ''),
      platforms: Array.isArray(campRow.platforms) ? campRow.platforms.map(String) : [],
      deliverables: String(campRow.deliverables || ''),
      compensationModel,
      budgetPerVideoEur: campRow.budget_per_video_eur === null ? null : Number(campRow.budget_per_video_eur),
      totalBudgetEur,
      tkpEurCents,
      affiliateEnabled: Boolean(campRow.affiliate_enabled),
      affiliateType: (campRow.affiliate_type === 'fixed_per_sale' ? 'fixed_per_sale' : 'percent') as AffiliateType,
      affiliateRateBps: campRow.affiliate_rate_bps === null || campRow.affiliate_rate_bps === undefined ? null : Number(campRow.affiliate_rate_bps),
      affiliateFixedCents: campRow.affiliate_fixed_cents === null || campRow.affiliate_fixed_cents === undefined ? null : Number(campRow.affiliate_fixed_cents),
      affiliateTargetUrl: String(campRow.affiliate_target_url || ''),
      requiresProductChoice: Boolean(campRow.requires_product_choice),
      productChoicePrompt: String(campRow.product_choice_prompt || ''),
      discountCode: String(campRow.discount_code || ''),
      briefingChecklist: Array.isArray(campRow.briefing_checklist) ? campRow.briefing_checklist.map(String) : [],
      requiredMention: String(campRow.required_mention || ''),
      requiredHashtags: String(campRow.required_hashtags || ''),
      reportShareToken,
      usageRights: String(campRow.usage_rights || ''),
      deadline: String(campRow.deadline || ''),
      visibility: campRow.visibility as CampaignVisibility,
      status: campRow.status as CampaignStatus,
      createdAt: new Date(campRow.created_at).toISOString(),
      counts: {
        invited: applications.filter((a) => a.source === 'invited').length,
        applied: applications.filter((a) => a.source === 'applied' || a.status === 'applied').length,
        selected: applications.filter((a) => ['selected', 'delivered', 'approved'].includes(a.status)).length,
        submissions: submissions.length,
        approvedSubmissions: report.approvedSubmissions,
      },
      metrics: {
        totalViews: report.totalViews,
        totalLikes: report.totalLikes,
        totalComments: report.totalComments,
        totalShares: report.totalShares,
        totalSpendEurCents: Math.round(report.totalSpendEur * 100),
        accruedPayoutEur: report.cappedPayoutEur,
        remainingBudgetEur: report.remainingBudgetEur,
        capReached: report.capReached,
      },
    },
    applications,
    submissions,
    report,
  };
}

export function buildCampaignReportCsv(detail: BrandCampaignDetail): string {
  const safeCell = (value: string | number | null | undefined) => {
    let str = value === null || value === undefined ? '' : String(value);
    if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
    return `"${str.replace(/"/g, '""')}"`;
  };
  const header = [
    'Kampagne',
    'Creator',
    'Plattform',
    'Titel',
    'URL',
    'Status',
    'Views',
    'Likes',
    'Comments',
    'Shares',
    'Engagement-Rate (%)',
    'TKP-Auszahlung (EUR)',
    'Spend (EUR)',
    'Eff. TKP/CPM (EUR)',
    'Erfasst am',
  ];
  const lines = [
    header.map(safeCell).join(','),
    ...detail.submissions.map((s) =>
      [
        detail.campaign.publicId,
        s.creatorName,
        s.platform,
        s.title,
        s.contentUrl,
        s.status,
        s.views,
        s.likes,
        s.comments,
        s.shares,
        s.engagementRatePct.toFixed(2),
        s.tkpEarnedEur.toFixed(2),
        (s.spendEurCents / 100).toFixed(2),
        s.effectiveCpmEur === null ? '' : s.effectiveCpmEur.toFixed(2),
        s.lastTrackedAt || s.createdAt,
      ]
        .map(safeCell)
        .join(','),
    ),
  ];
  return `${lines.join('\n')}\n`;
}

export async function listCreatorCampaigns(
  sql: DatabaseClient,
  creatorId: string,
): Promise<{ myCampaigns: CreatorCampaignItem[]; openCampaigns: CreatorCampaignItem[] }> {
  let myRows: Array<any>;
  let openRows: Array<any>;
  try {
    myRows = (await sql.query(
      `SELECT
         a.id AS application_id, a.source, a.status AS app_status, a.creator_pitch,
         a.proposed_fee_eur, a.availability_note, a.target_platforms, a.product_choice,
         a.affiliate_code, a.affiliate_clicks,
         c.public_id, c.title, c.brand_display_name, c.description, c.niche, c.platforms,
         c.deliverables, c.compensation_model, c.budget_per_video_eur, c.total_budget_eur,
         c.tkp_eur_cents, c.affiliate_enabled, c.affiliate_type, c.affiliate_rate_bps,
         c.affiliate_fixed_cents, c.affiliate_target_url,
         c.requires_product_choice, c.product_choice_prompt, c.discount_code,
         c.briefing_checklist, c.required_mention, c.required_hashtags,
         c.usage_rights, c.deadline,
         COALESCE(agg.total_views, 0)::int AS camp_views,
         COALESCE(agg.total_spend_cents, 0)::int AS camp_spend_cents,
         COALESCE(subs.items, '[]'::json) AS submissions
       FROM brand_campaign_applications a
       JOIN brand_campaigns c ON c.id = a.campaign_id
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(s.views), 0) AS total_views, COALESCE(SUM(s.spend_eur_cents), 0) AS total_spend_cents
         FROM brand_campaign_submissions s
         WHERE s.campaign_id = c.id
       ) agg ON true
       LEFT JOIN LATERAL (
         SELECT json_agg(json_build_object(
           'id', s.id,
           'platform', s.platform,
           'contentUrl', s.content_url,
           'title', s.title,
           'status', s.status,
           'views', s.views,
           'likes', s.likes,
           'comments', s.comments,
           'shares', s.shares,
           'createdAt', s.created_at
         ) ORDER BY s.created_at DESC) AS items
         FROM brand_campaign_submissions s
         WHERE s.application_id = a.id
       ) subs ON true
       WHERE a.creator_id = $1 AND c.status IN ('active', 'paused', 'completed')
       ORDER BY a.updated_at DESC`,
      [creatorId],
    )) as unknown as Array<any>;

    openRows = (await sql.query(
      `SELECT
         c.public_id, c.title, c.brand_display_name, c.description, c.niche, c.platforms,
         c.deliverables, c.compensation_model, c.budget_per_video_eur, c.total_budget_eur,
         c.tkp_eur_cents, c.affiliate_enabled, c.affiliate_type, c.affiliate_rate_bps,
         c.affiliate_fixed_cents, c.affiliate_target_url,
         c.requires_product_choice, c.product_choice_prompt, c.discount_code,
         c.briefing_checklist, c.required_mention, c.required_hashtags,
         c.usage_rights, c.deadline,
         COALESCE(agg.total_views, 0)::int AS camp_views,
         COALESCE(agg.total_spend_cents, 0)::int AS camp_spend_cents
       FROM brand_campaigns c
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(s.views), 0) AS total_views, COALESCE(SUM(s.spend_eur_cents), 0) AS total_spend_cents
         FROM brand_campaign_submissions s
         WHERE s.campaign_id = c.id
       ) agg ON true
       WHERE c.status = 'active'
         AND c.visibility = 'open'
         AND NOT EXISTS (
           SELECT 1 FROM brand_campaign_applications a
           WHERE a.campaign_id = c.id AND a.creator_id = $1
         )
       ORDER BY c.created_at DESC
       LIMIT 30`,
      [creatorId],
    )) as unknown as Array<any>;
  } catch (err: any) {
    if (err?.code !== '42703') throw err;
    myRows = (await sql.query(
      `SELECT
         a.id AS application_id, a.source, a.status AS app_status, a.creator_pitch,
         a.proposed_fee_eur, a.availability_note, a.target_platforms, a.product_choice,
         c.public_id, c.title, c.brand_display_name, c.description, c.niche, c.platforms,
         c.deliverables, c.compensation_model, c.budget_per_video_eur, c.total_budget_eur,
         c.tkp_eur_cents, c.requires_product_choice, c.product_choice_prompt, c.discount_code,
         c.briefing_checklist, c.required_mention, c.required_hashtags,
         c.usage_rights, c.deadline,
         COALESCE(agg.total_views, 0)::int AS camp_views,
         COALESCE(agg.total_spend_cents, 0)::int AS camp_spend_cents,
         COALESCE(subs.items, '[]'::json) AS submissions
       FROM brand_campaign_applications a
       JOIN brand_campaigns c ON c.id = a.campaign_id
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(s.views), 0) AS total_views, COALESCE(SUM(s.spend_eur_cents), 0) AS total_spend_cents
         FROM brand_campaign_submissions s
         WHERE s.campaign_id = c.id
       ) agg ON true
       LEFT JOIN LATERAL (
         SELECT json_agg(json_build_object(
           'id', s.id,
           'platform', s.platform,
           'contentUrl', s.content_url,
           'title', s.title,
           'status', s.status,
           'views', s.views,
           'likes', s.likes,
           'comments', s.comments,
           'shares', s.shares,
           'createdAt', s.created_at
         ) ORDER BY s.created_at DESC) AS items
         FROM brand_campaign_submissions s
         WHERE s.application_id = a.id
       ) subs ON true
       WHERE a.creator_id = $1 AND c.status IN ('active', 'paused', 'completed')
       ORDER BY a.updated_at DESC`,
      [creatorId],
    )) as unknown as Array<any>;

    openRows = (await sql.query(
      `SELECT
         c.public_id, c.title, c.brand_display_name, c.description, c.niche, c.platforms,
         c.deliverables, c.compensation_model, c.budget_per_video_eur, c.total_budget_eur,
         c.tkp_eur_cents, c.requires_product_choice, c.product_choice_prompt, c.discount_code,
         c.briefing_checklist, c.required_mention, c.required_hashtags,
         c.usage_rights, c.deadline,
         COALESCE(agg.total_views, 0)::int AS camp_views,
         COALESCE(agg.total_spend_cents, 0)::int AS camp_spend_cents
       FROM brand_campaigns c
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(s.views), 0) AS total_views, COALESCE(SUM(s.spend_eur_cents), 0) AS total_spend_cents
         FROM brand_campaign_submissions s
         WHERE s.campaign_id = c.id
       ) agg ON true
       WHERE c.status = 'active'
         AND c.visibility = 'open'
         AND NOT EXISTS (
           SELECT 1 FROM brand_campaign_applications a
           WHERE a.campaign_id = c.id AND a.creator_id = $1
         )
       ORDER BY c.created_at DESC
       LIMIT 30`,
      [creatorId],
    )) as unknown as Array<any>;
  }

  const mapBase = (row: any) => {
    const compensationModel = row.compensation_model as CompensationModel;
    const totalBudgetEur = row.total_budget_eur === null ? null : Number(row.total_budget_eur);
    const tkpEurCents = row.tkp_eur_cents === null ? null : Number(row.tkp_eur_cents);
    const cap = computeBudgetCapState(
      compensationModel,
      Number(row.camp_views) || 0,
      Number(row.camp_spend_cents) || 0,
      totalBudgetEur,
      tkpEurCents,
    );
    return {
      campaignPublicId: String(row.public_id),
      title: String(row.title),
      brandDisplayName: String(row.brand_display_name),
      description: String(row.description || ''),
      niche: String(row.niche || ''),
      platforms: Array.isArray(row.platforms) ? row.platforms.map(String) : [],
      deliverables: String(row.deliverables || ''),
      compensationModel,
      budgetPerVideoEur: row.budget_per_video_eur === null ? null : Number(row.budget_per_video_eur),
      totalBudgetEur,
      tkpEurCents,
      affiliateEnabled: Boolean(row.affiliate_enabled),
      affiliateType: (row.affiliate_type === 'fixed_per_sale' ? 'fixed_per_sale' : 'percent') as AffiliateType,
      affiliateRateBps: row.affiliate_rate_bps === null || row.affiliate_rate_bps === undefined ? null : Number(row.affiliate_rate_bps),
      affiliateFixedCents: row.affiliate_fixed_cents === null || row.affiliate_fixed_cents === undefined ? null : Number(row.affiliate_fixed_cents),
      affiliateTargetUrl: String(row.affiliate_target_url || ''),
      affiliateCode: row.affiliate_code ? String(row.affiliate_code) : null,
      affiliateClicks: Number(row.affiliate_clicks || 0),
      requiresProductChoice: Boolean(row.requires_product_choice),
      productChoicePrompt: String(row.product_choice_prompt || ''),
      discountCode: String(row.discount_code || ''),
      briefingChecklist: Array.isArray(row.briefing_checklist) ? row.briefing_checklist.map(String) : [],
      requiredMention: String(row.required_mention || ''),
      requiredHashtags: String(row.required_hashtags || ''),
      remainingBudgetEur: cap.remainingBudgetEur,
      capReached: cap.capReached,
      usageRights: String(row.usage_rights || ''),
      deadline: String(row.deadline || ''),
    };
  };

  const myCampaigns: CreatorCampaignItem[] = myRows.map((row) => ({
    ...mapBase(row),
    applicationId: String(row.application_id),
    status: row.app_status as ApplicationStatus,
    source: row.source as 'invited' | 'applied',
    creatorPitch: String(row.creator_pitch || ''),
    proposedFeeEur: row.proposed_fee_eur === null ? null : Number(row.proposed_fee_eur),
    availabilityNote: String(row.availability_note || ''),
    targetPlatforms: Array.isArray(row.target_platforms) ? row.target_platforms.map(String) : [],
    productChoice: String(row.product_choice || ''),
    submissions: Array.isArray(row.submissions) ? row.submissions : [],
  }));

  const openCampaigns: CreatorCampaignItem[] = openRows.map((row) => ({
    ...mapBase(row),
    applicationId: null,
    status: 'open',
    source: 'open',
    creatorPitch: '',
    proposedFeeEur: null,
    availabilityNote: '',
    targetPlatforms: [],
    productChoice: '',
    submissions: [],
  }));

  return { myCampaigns, openCampaigns };
}

export async function listCreatorSocialConnections(
  sql: DatabaseClient,
  creatorId: string,
): Promise<CreatorSocialConnection[]> {
  const rows = (await sql.query(
    `SELECT id, platform, handle, url, followers, canonical_handle,
            verification_code, verification_method, verified_at
     FROM creator_social_accounts
     WHERE creator_id = $1
     ORDER BY verified_at DESC NULLS LAST, is_primary DESC, platform ASC`,
    [creatorId],
  )) as unknown as Array<any>;

  const mapped: CreatorSocialConnection[] = rows.map((row) => ({
    id: String(row.id),
    platform: String(row.platform || 'other'),
    handle: String(row.handle || ''),
    url: String(row.url || ''),
    followers: row.followers === null ? null : Number(row.followers),
    canonicalHandle: row.canonical_handle ? String(row.canonical_handle) : null,
    verificationCode: row.verification_code ? String(row.verification_code) : null,
    verificationMethod: row.verification_method ? String(row.verification_method) : null,
    verifiedAt: row.verified_at ? new Date(row.verified_at).toISOString() : null,
  }));

  // Deduplicate same (platform, normalizedHandle) preferring verified > open code > first entry.
  const score = (acc: CreatorSocialConnection) =>
    (acc.verifiedAt ? 4 : 0) + (acc.verificationMethod === 'oauth' ? 2 : 0) + (acc.verificationCode ? 1 : 0);
  const byKey = new Map<string, CreatorSocialConnection>();
  for (const acc of mapped) {
    const plat = acc.platform.toLowerCase();
    const norm = normalizeSocialHandle(plat, acc.canonicalHandle || acc.handle || acc.url);
    const key = norm ? `${plat}:${norm.handle}` : `${plat}:${acc.url.toLowerCase().replace(/\/+$/, '')}`;
    const prev = byKey.get(key);
    if (!prev || score(acc) > score(prev)) {
      byKey.set(key, acc);
    }
  }
  return Array.from(byKey.values());
}

export interface PublicCampaignReport {
  publicId: string;
  title: string;
  brandDisplayName: string;
  platforms: string[];
  compensationModel: CompensationModel;
  totalBudgetEur: number | null;
  tkpEurCents: number | null;
  status: CampaignStatus;
  report: CampaignPerformanceReport;
  submissions: Array<{
    id: string;
    creatorName: string;
    platform: SubmissionPlatform;
    contentUrl: string;
    title: string;
    status: SubmissionStatus;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    billedBlocks: number;
    tkpEarnedEur: number;
    engagementRatePct: number;
  }>;
}

/**
 * Oeffentlicher, PII-freier Read-Only Live-Report ueber einen zufaelligen Share-Token.
 * Keine E-Mails, keine internen Notizen, keine abgelehnten Entwuerfe.
 */
export async function getPublicCampaignReportByShareToken(
  sql: DatabaseClient,
  shareToken: string,
): Promise<PublicCampaignReport | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(shareToken)) return null;
  const [campRow] = (await sql.query(
    `SELECT id, public_id, title, brand_display_name, platforms, compensation_model,
            total_budget_eur, tkp_eur_cents, status
     FROM brand_campaigns
     WHERE report_share_token = $1
     LIMIT 1`,
    [shareToken],
  )) as unknown as Array<any>;
  if (!campRow) return null;

  const tkpEurCents = campRow.tkp_eur_cents === null ? null : Number(campRow.tkp_eur_cents);
  const compensationModel = campRow.compensation_model as CompensationModel;
  const totalBudgetEur = campRow.total_budget_eur === null ? null : Number(campRow.total_budget_eur);

  const subRows = (await sql.query(
    `SELECT s.id, s.application_id, s.platform, s.content_url, s.title, s.status,
            s.views, s.likes, s.comments, s.shares, s.spend_eur_cents, s.created_at,
            p.public_id AS creator_public_id, p.display_name
     FROM brand_campaign_submissions s
     JOIN creator_profiles p ON p.id = s.creator_id
     WHERE s.campaign_id = $1 AND s.status IN ('approved', 'submitted')
     ORDER BY s.views DESC, s.created_at DESC`,
    [campRow.id],
  )) as unknown as Array<any>;

  const fullSubs: CampaignSubmissionView[] = subRows.map((row) => {
    const views = Number(row.views) || 0;
    const likes = Number(row.likes) || 0;
    const comments = Number(row.comments) || 0;
    const shares = Number(row.shares) || 0;
    const spendEurCents = Number(row.spend_eur_cents) || 0;
    const tkpEarnedEur = computeTkpEur(views, tkpEurCents);
    const billedBlocks = Math.floor(views / 1000);
    const eng = likes + comments + shares;
    const engagementRatePct = views > 0 ? Math.round((eng / views) * 10_000) / 100 : 0;
    const effectiveCost = compensationModel === 'tkp' && tkpEurCents ? Math.max(spendEurCents / 100, tkpEarnedEur) : spendEurCents / 100;
    return {
      id: String(row.id),
      applicationId: String(row.application_id),
      creatorPublicId: String(row.creator_public_id),
      creatorName: String(row.display_name || 'Creator').split(' ')[0],
      platform: row.platform as SubmissionPlatform,
      contentUrl: String(row.content_url),
      title: String(row.title || ''),
      status: row.status as SubmissionStatus,
      views,
      likes,
      comments,
      shares,
      spendEurCents,
      tkpEarnedEur,
      billedBlocks,
      reviewNote: '',
      checklistPassed: row.status === 'approved',
      engagementRatePct,
      effectiveCpmEur: views > 0 && effectiveCost > 0 ? Math.round((effectiveCost / (views / 1000)) * 100) / 100 : null,
      metricsSource: 'manual',
      lastTrackedAt: null,
      createdAt: new Date(row.created_at).toISOString(),
    };
  });

  const report = computeCampaignReport(fullSubs, { totalBudgetEur, compensationModel, tkpEurCents });
  return {
    publicId: String(campRow.public_id),
    title: String(campRow.title),
    brandDisplayName: String(campRow.brand_display_name),
    platforms: Array.isArray(campRow.platforms) ? campRow.platforms.map(String) : [],
    compensationModel,
    totalBudgetEur,
    tkpEurCents,
    status: campRow.status as CampaignStatus,
    report,
    submissions: fullSubs.map((s) => ({
      id: s.id,
      creatorName: s.creatorName,
      platform: s.platform,
      contentUrl: s.contentUrl,
      title: s.title,
      status: s.status,
      views: s.views,
      likes: s.likes,
      comments: s.comments,
      shares: s.shares,
      billedBlocks: s.billedBlocks,
      tkpEarnedEur: s.tkpEarnedEur,
      engagementRatePct: s.engagementRatePct,
    })),
  };
}

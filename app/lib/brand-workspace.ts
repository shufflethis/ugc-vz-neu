import crypto from 'node:crypto';
import type { getDatabase } from '@/app/lib/database';
import { BRAND_LOGIN_TTL_MINUTES } from '@/app/lib/brand-login-email';
import { humanizePriceText, safePortfolioUrl } from '@/app/lib/creator-public';

type DatabaseClient = ReturnType<typeof getDatabase>;

export type CompensationModel = 'fixed' | 'tkp' | 'hybrid' | 'barter';
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
  brandNote: string;
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
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalEngagements: number;
  engagementRatePct: number;
  totalSpendEur: number;
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
  usageRights: string;
  deadline: string;
  status: ApplicationStatus | 'open';
  source: 'invited' | 'applied' | 'open';
  creatorPitch: string;
  proposedFeeEur: number | null;
  availabilityNote: string;
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
     FROM brand_accounts WHERE lower(email) = lower($1) LIMIT 1`,
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
    usageRights?: string;
    deadline?: string;
    visibility?: CampaignVisibility;
    creatorPublicIds?: string[];
    sourceLeadPublicId?: string;
  },
): Promise<{ id: string; publicId: string; invitedCount: number }> {
  const title = cleanText(input.title, 140) || 'Neue UGC-Kampagne';
  const brandDisplayName = cleanText(input.brandDisplayName || brand.companyName || brand.contactName, 120) || 'Brand';
  const description = cleanMultiline(input.description, 3000);
  const niche = cleanText(input.niche, 80);
  const allowedPlatforms = new Set(['tiktok', 'instagram', 'youtube', 'meta_ads']);
  const platforms = [...new Set((input.platforms || []).map((p) => p.toLowerCase().trim()).filter((p) => allowedPlatforms.has(p)))];
  const deliverables = cleanText(input.deliverables, 240);
  const compensationModel: CompensationModel = ['fixed', 'tkp', 'hybrid', 'barter'].includes(String(input.compensationModel))
    ? (input.compensationModel as CompensationModel)
    : 'fixed';
  const visibility: CampaignVisibility = input.visibility === 'invite_only' ? 'invite_only' : 'open';
  const publicId = generateCampaignPublicId();

  const [campaign] = (await sql.query(
    `INSERT INTO brand_campaigns (
       public_id, brand_id, title, brand_display_name, description, niche, platforms,
       deliverables, compensation_model, budget_per_video_eur, total_budget_eur,
       tkp_eur_cents, usage_rights, deadline, visibility, status, source_lead_public_id
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'active',$16)
     RETURNING id, public_id`,
    [
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
      cleanText(input.usageRights, 160),
      cleanText(input.deadline, 120),
      visibility,
      input.sourceLeadPublicId ? cleanText(input.sourceLeadPublicId, 40) : null,
    ],
  )) as unknown as Array<any>;

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

  return { id: String(campaign.id), publicId: String(campaign.public_id), invitedCount };
}

export async function listBrandCampaigns(sql: DatabaseClient, brandId: string): Promise<CampaignSummary[]> {
  const rows = (await sql.query(
    `SELECT
       c.id, c.public_id, c.title, c.brand_display_name, c.niche, c.platforms,
       c.deliverables, c.compensation_model, c.budget_per_video_eur, c.total_budget_eur,
       c.tkp_eur_cents, c.usage_rights, c.deadline, c.visibility, c.status, c.created_at,
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

  return rows.map((row) => ({
    id: String(row.id),
    publicId: String(row.public_id),
    title: String(row.title),
    brandDisplayName: String(row.brand_display_name),
    niche: String(row.niche || ''),
    platforms: Array.isArray(row.platforms) ? row.platforms.map(String) : [],
    deliverables: String(row.deliverables || ''),
    compensationModel: row.compensation_model as CompensationModel,
    budgetPerVideoEur: row.budget_per_video_eur === null ? null : Number(row.budget_per_video_eur),
    totalBudgetEur: row.total_budget_eur === null ? null : Number(row.total_budget_eur),
    tkpEurCents: row.tkp_eur_cents === null ? null : Number(row.tkp_eur_cents),
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
      totalViews: Number(row.total_views) || 0,
      totalLikes: Number(row.total_likes) || 0,
      totalComments: Number(row.total_comments) || 0,
      totalShares: Number(row.total_shares) || 0,
      totalSpendEurCents: Number(row.total_spend_cents) || 0,
    },
  }));
}

export function computeCampaignReport(
  submissions: CampaignSubmissionView[],
  totalBudgetEur: number | null,
): CampaignPerformanceReport {
  const totalViews = submissions.reduce((sum, s) => sum + s.views, 0);
  const totalLikes = submissions.reduce((sum, s) => sum + s.likes, 0);
  const totalComments = submissions.reduce((sum, s) => sum + s.comments, 0);
  const totalShares = submissions.reduce((sum, s) => sum + s.shares, 0);
  const totalEngagements = totalLikes + totalComments + totalShares;
  const totalSpendCents = submissions.reduce((sum, s) => sum + s.spendEurCents, 0);
  const totalSpendEur = Math.round((totalSpendCents / 100) * 100) / 100;
  const engagementRatePct = totalViews > 0 ? Math.round((totalEngagements / totalViews) * 10_000) / 100 : 0;
  const effectiveCpmEur = totalViews > 0 && totalSpendEur > 0 ? Math.round((totalSpendEur / (totalViews / 1000)) * 100) / 100 : null;
  const budgetUtilizationPct =
    totalBudgetEur && totalBudgetEur > 0 ? Math.min(999, Math.round((totalSpendEur / totalBudgetEur) * 1000) / 10) : null;

  const platformMap = new Map<SubmissionPlatform, { submissions: number; views: number; engagements: number }>();
  const creatorMap = new Map<string, { creatorPublicId: string; creatorName: string; submissions: number; views: number; engagements: number; spendCents: number }>();

  for (const s of submissions) {
    const eng = s.likes + s.comments + s.shares;
    const p = platformMap.get(s.platform) || { submissions: 0, views: 0, engagements: 0 };
    p.submissions += 1;
    p.views += s.views;
    p.engagements += eng;
    platformMap.set(s.platform, p);

    const c = creatorMap.get(s.creatorPublicId) || {
      creatorPublicId: s.creatorPublicId,
      creatorName: s.creatorName,
      submissions: 0,
      views: 0,
      engagements: 0,
      spendCents: 0,
    };
    c.submissions += 1;
    c.views += s.views;
    c.engagements += eng;
    c.spendCents += s.spendEurCents;
    creatorMap.set(s.creatorPublicId, c);
  }

  return {
    totalSubmissions: submissions.length,
    approvedSubmissions: submissions.filter((s) => s.status === 'approved').length,
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
    totalEngagements,
    engagementRatePct,
    totalSpendEur,
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
        return {
          creatorPublicId: c.creatorPublicId,
          creatorName: c.creatorName,
          submissions: c.submissions,
          views: c.views,
          engagements: c.engagements,
          engagementRatePct: c.views > 0 ? Math.round((c.engagements / c.views) * 10_000) / 100 : 0,
          spendEur,
          effectiveCpmEur: c.views > 0 && spendEur > 0 ? Math.round((spendEur / (c.views / 1000)) * 100) / 100 : null,
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

  const appRows = (await sql.query(
    `SELECT
       a.id, a.source, a.status, a.creator_pitch, a.proposed_fee_eur,
       a.availability_note, a.brand_note, a.updated_at,
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
      brandNote: String(row.brand_note || ''),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  });

  const subRows = (await sql.query(
    `SELECT
       s.id, s.application_id, s.platform, s.content_url, s.title, s.status,
       s.views, s.likes, s.comments, s.shares, s.spend_eur_cents, s.metrics_source,
       s.last_tracked_at, s.created_at,
       p.public_id AS creator_public_id, p.display_name
     FROM brand_campaign_submissions s
     JOIN creator_profiles p ON p.id = s.creator_id
     WHERE s.campaign_id = $1
     ORDER BY s.created_at DESC`,
    [campRow.id],
  )) as unknown as Array<any>;

  const submissions: CampaignSubmissionView[] = subRows.map((row) => {
    const views = Number(row.views) || 0;
    const likes = Number(row.likes) || 0;
    const comments = Number(row.comments) || 0;
    const shares = Number(row.shares) || 0;
    const spendEurCents = Number(row.spend_eur_cents) || 0;
    const engagements = likes + comments + shares;
    const engagementRatePct = views > 0 ? Math.round((engagements / views) * 10_000) / 100 : 0;
    const effectiveCpmEur = views > 0 && spendEurCents > 0 ? Math.round(((spendEurCents / 100) / (views / 1000)) * 100) / 100 : null;
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
      engagementRatePct,
      effectiveCpmEur,
      metricsSource: (row.metrics_source || 'manual') as 'manual' | 'oembed' | 'api',
      lastTrackedAt: row.last_tracked_at ? new Date(row.last_tracked_at).toISOString() : null,
      createdAt: new Date(row.created_at).toISOString(),
    };
  });

  const totalBudgetEur = campRow.total_budget_eur === null ? null : Number(campRow.total_budget_eur);
  const report = computeCampaignReport(submissions, totalBudgetEur);

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
      compensationModel: campRow.compensation_model as CompensationModel,
      budgetPerVideoEur: campRow.budget_per_video_eur === null ? null : Number(campRow.budget_per_video_eur),
      totalBudgetEur,
      tkpEurCents: campRow.tkp_eur_cents === null ? null : Number(campRow.tkp_eur_cents),
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
  const header = ['Kampagne', 'Creator', 'Plattform', 'Titel', 'URL', 'Status', 'Views', 'Likes', 'Comments', 'Shares', 'Engagement-Rate (%)', 'Spend (EUR)', 'Eff. TKP/CPM (EUR)', 'Erfasst am'];
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
  const myRows = (await sql.query(
    `SELECT
       a.id AS application_id, a.source, a.status AS app_status, a.creator_pitch,
       a.proposed_fee_eur, a.availability_note,
       c.public_id, c.title, c.brand_display_name, c.description, c.niche, c.platforms,
       c.deliverables, c.compensation_model, c.budget_per_video_eur, c.total_budget_eur,
       c.tkp_eur_cents, c.usage_rights, c.deadline,
       COALESCE(subs.items, '[]'::json) AS submissions
     FROM brand_campaign_applications a
     JOIN brand_campaigns c ON c.id = a.campaign_id
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

  const openRows = (await sql.query(
    `SELECT
       c.public_id, c.title, c.brand_display_name, c.description, c.niche, c.platforms,
       c.deliverables, c.compensation_model, c.budget_per_video_eur, c.total_budget_eur,
       c.tkp_eur_cents, c.usage_rights, c.deadline
     FROM brand_campaigns c
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

  const mapBase = (row: any) => ({
    campaignPublicId: String(row.public_id),
    title: String(row.title),
    brandDisplayName: String(row.brand_display_name),
    description: String(row.description || ''),
    niche: String(row.niche || ''),
    platforms: Array.isArray(row.platforms) ? row.platforms.map(String) : [],
    deliverables: String(row.deliverables || ''),
    compensationModel: row.compensation_model as CompensationModel,
    budgetPerVideoEur: row.budget_per_video_eur === null ? null : Number(row.budget_per_video_eur),
    totalBudgetEur: row.total_budget_eur === null ? null : Number(row.total_budget_eur),
    tkpEurCents: row.tkp_eur_cents === null ? null : Number(row.tkp_eur_cents),
    usageRights: String(row.usage_rights || ''),
    deadline: String(row.deadline || ''),
  });

  const myCampaigns: CreatorCampaignItem[] = myRows.map((row) => ({
    ...mapBase(row),
    applicationId: String(row.application_id),
    status: row.app_status as ApplicationStatus,
    source: row.source as 'invited' | 'applied',
    creatorPitch: String(row.creator_pitch || ''),
    proposedFeeEur: row.proposed_fee_eur === null ? null : Number(row.proposed_fee_eur),
    availabilityNote: String(row.availability_note || ''),
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

  return rows.map((row) => ({
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
}

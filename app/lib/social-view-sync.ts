import type { getDatabase } from '@/app/lib/database';
import {
  decryptSocialToken,
  encryptSocialToken,
  getMetaGraphApiVersion,
  isInstagramFacebookBusinessLogin,
  isTikTokOAuthConfigured,
  isYouTubeApiConfigured,
} from '@/app/lib/social-oauth';

type DatabaseClient = ReturnType<typeof getDatabase>;

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface SocialMetricSuccess {
  ok: true;
  deleted: boolean;
  externalPostId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface SocialMetricFailure {
  ok: false;
  skippedUnconfigured?: boolean;
  error: string;
}

export type SocialMetricResult = SocialMetricSuccess | SocialMetricFailure;

const DELETED_REVIEW_NOTE = 'Beitrag nicht mehr öffentlich abrufbar (gelöscht oder privat).';

function safeParseUrl(raw: string): URL | null {
  try {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(withProtocol);
  } catch {
    return null;
  }
}

export function extractYouTubeVideoId(rawUrl: string): string | null {
  const url = safeParseUrl(rawUrl);
  if (!url) return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  let candidate = '';
  if (host === 'youtu.be') {
    candidate = url.pathname.split('/').filter(Boolean)[0] || '';
  } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'watch') {
      candidate = url.searchParams.get('v') || '';
    } else if (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live') {
      candidate = parts[1] || '';
    }
  } else {
    return null;
  }
  return /^[A-Za-z0-9_-]{6,20}$/.test(candidate) ? candidate : null;
}

export function extractTikTokVideoId(rawUrl: string): string | null {
  const url = safeParseUrl(rawUrl);
  if (!url) return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (!host.endsWith('tiktok.com')) return null;
  const parts = url.pathname.split('/').filter(Boolean);
  for (let i = 0; i < parts.length; i += 1) {
    if ((parts[i] === 'video' || parts[i] === 'photo') && parts[i + 1]) {
      const id = parts[i + 1].replace(/\.html$/i, '');
      if (/^\d{8,25}$/.test(id)) return id;
    }
    if (parts[i] === 'v' && parts[i + 1]) {
      const id = parts[i + 1].replace(/\.html$/i, '');
      if (/^\d{8,25}$/.test(id)) return id;
    }
  }
  return null;
}

export function extractInstagramShortcode(rawUrl: string): string | null {
  const url = safeParseUrl(rawUrl);
  if (!url) return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (!host.endsWith('instagram.com')) return null;
  const parts = url.pathname.split('/').filter(Boolean);
  for (let i = 0; i < parts.length; i += 1) {
    const segment = parts[i].toLowerCase();
    if ((segment === 'reel' || segment === 'reels' || segment === 'p' || segment === 'tv') && parts[i + 1]) {
      const code = parts[i + 1];
      if (/^[A-Za-z0-9_-]{5,30}$/.test(code)) return code;
    }
  }
  return null;
}

function toNonNegativeInt(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num);
}

export async function fetchYouTubeVideoMetrics(
  videoId: string,
  apiKey: string,
  fetchFn: FetchLike = fetch,
): Promise<SocialMetricResult> {
  if (!apiKey.trim()) {
    return { ok: false, skippedUnconfigured: true, error: 'youtube_api_key_missing' };
  }
  const endpoint = new URL('https://www.googleapis.com/youtube/v3/videos');
  endpoint.searchParams.set('part', 'statistics,status');
  endpoint.searchParams.set('id', videoId);
  endpoint.searchParams.set('key', apiKey.trim());

  try {
    const res = await fetchFn(endpoint.toString(), { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) {
      return { ok: false, error: `youtube_http_${res.status}` };
    }
    const json = (await res.json()) as {
      items?: Array<{
        id?: string;
        statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
        status?: { privacyStatus?: string };
      }>;
    };
    const item = Array.isArray(json.items) ? json.items[0] : undefined;
    if (!item || (item.status?.privacyStatus && item.status.privacyStatus !== 'public')) {
      return {
        ok: true,
        deleted: true,
        externalPostId: videoId,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      };
    }
    return {
      ok: true,
      deleted: false,
      externalPostId: item.id || videoId,
      views: toNonNegativeInt(item.statistics?.viewCount),
      likes: toNonNegativeInt(item.statistics?.likeCount),
      comments: toNonNegativeInt(item.statistics?.commentCount),
      shares: 0,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message.slice(0, 120) : 'youtube_fetch_failed' };
  }
}

export async function refreshTikTokAccessToken(
  refreshToken: string,
  fetchFn: FetchLike = fetch,
): Promise<{ accessToken: string; refreshToken?: string; expiresInSeconds: number } | null> {
  if (!isTikTokOAuthConfigured() || !refreshToken.trim()) return null;
  try {
    const res = await fetchFn('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!.trim(),
        client_secret: process.env.TIKTOK_CLIENT_SECRET!.trim(),
        grant_type: 'refresh_token',
        refresh_token: refreshToken.trim(),
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };
    if (!json.access_token) return null;
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresInSeconds: typeof json.expires_in === 'number' && json.expires_in > 0 ? json.expires_in : 86400,
    };
  } catch {
    return null;
  }
}

export async function fetchTikTokVideoMetrics(
  videoId: string,
  accessToken: string,
  fetchFn: FetchLike = fetch,
): Promise<SocialMetricResult> {
  if (!accessToken.trim()) {
    return { ok: false, skippedUnconfigured: true, error: 'tiktok_token_missing' };
  }
  try {
    const res = await fetchFn(
      'https://open.tiktokapis.com/v2/video/query/?fields=id,view_count,like_count,comment_count,share_count',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters: { video_ids: [videoId] } }),
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!res.ok) {
      return { ok: false, error: `tiktok_http_${res.status}` };
    }
    const json = (await res.json()) as {
      data?: {
        videos?: Array<{
          id?: string;
          view_count?: number;
          like_count?: number;
          comment_count?: number;
          share_count?: number;
        }>;
      };
      error?: { code?: string; message?: string };
    };
    if (json.error?.code && json.error.code !== 'ok') {
      return { ok: false, error: `tiktok_api_${json.error.code}` };
    }
    const videos = Array.isArray(json.data?.videos) ? json.data.videos : [];
    const match = videos.find((v) => String(v.id || '') === videoId);
    if (!match) {
      return {
        ok: true,
        deleted: true,
        externalPostId: videoId,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      };
    }
    return {
      ok: true,
      deleted: false,
      externalPostId: String(match.id || videoId),
      views: toNonNegativeInt(match.view_count),
      likes: toNonNegativeInt(match.like_count),
      comments: toNonNegativeInt(match.comment_count),
      shares: toNonNegativeInt(match.share_count),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message.slice(0, 120) : 'tiktok_fetch_failed' };
  }
}

export async function fetchInstagramMediaMetrics(
  shortcode: string,
  accessToken: string,
  fetchFn: FetchLike = fetch,
  options: {
    mode?: 'facebook_business' | 'instagram_direct';
    igUserId?: string | null;
    graphVersion?: string;
  } = {},
): Promise<SocialMetricResult> {
  if (!accessToken.trim()) {
    return { ok: false, skippedUnconfigured: true, error: 'instagram_token_missing' };
  }
  const mode = options.mode || 'instagram_direct';
  const graphVersion = options.graphVersion || getMetaGraphApiVersion();
  const apiBase = mode === 'facebook_business'
    ? `https://graph.facebook.com/${graphVersion}`
    : 'https://graph.instagram.com';

  if (mode === 'facebook_business' && !options.igUserId?.trim()) {
    return { ok: false, skippedUnconfigured: true, error: 'instagram_business_account_id_missing' };
  }

  try {
    let nextUrl: string | null = (() => {
      const mediaPath = mode === 'facebook_business'
        ? `${apiBase}/${encodeURIComponent(options.igUserId!.trim())}/media`
        : `${apiBase}/me/media`;
      const url = new URL(mediaPath);
      url.searchParams.set('fields', 'id,permalink,media_type,like_count,comments_count');
      url.searchParams.set('limit', '50');
      url.searchParams.set('access_token', accessToken.trim());
      return url.toString();
    })();

    let matched: {
      id: string;
      permalink?: string;
      like_count?: number;
      comments_count?: number;
    } | null = null;
    let reachedEnd = false;

    for (let page = 0; page < 3 && nextUrl; page += 1) {
      const res = await fetchFn(nextUrl, { signal: AbortSignal.timeout(8_000) });
      if (!res.ok) {
        return { ok: false, error: `instagram_media_http_${res.status}` };
      }
      const json = (await res.json()) as {
        data?: Array<{
          id?: string;
          permalink?: string;
          like_count?: number;
          comments_count?: number;
        }>;
        paging?: { next?: string };
        error?: { message?: string; code?: number };
      };
      if (json.error) {
        return { ok: false, error: `instagram_api_${json.error.code || 'error'}` };
      }
      const items = Array.isArray(json.data) ? json.data : [];
      for (const item of items) {
        if (item.id && item.permalink && extractInstagramShortcode(item.permalink) === shortcode) {
          matched = {
            id: String(item.id),
            permalink: item.permalink,
            like_count: item.like_count,
            comments_count: item.comments_count,
          };
          break;
        }
      }
      if (matched) break;
      if (json.paging?.next) {
        nextUrl = json.paging.next;
      } else {
        reachedEnd = true;
        nextUrl = null;
      }
    }

    if (!matched) {
      if (reachedEnd) {
        return {
          ok: true,
          deleted: true,
          externalPostId: shortcode,
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
        };
      }
      return { ok: false, error: 'instagram_media_beyond_page_limit' };
    }

    // Fetch official views (Meta Graph API v22+) with graceful fallback to legacy plays metric.
    const fetchInsights = async (metrics: string) => {
      const url = new URL(`${apiBase}/${encodeURIComponent(matched!.id)}/insights`);
      url.searchParams.set('metric', metrics);
      url.searchParams.set('access_token', accessToken.trim());
      const res = await fetchFn(url.toString(), { signal: AbortSignal.timeout(8_000) });
      if (!res.ok) return null;
      const body = (await res.json()) as {
        data?: Array<{ name?: string; values?: Array<{ value?: number }> }>;
        error?: { message?: string };
      };
      if (body.error || !Array.isArray(body.data)) return null;
      return body.data;
    };

    const insightRows = (await fetchInsights('views,shares')) || (await fetchInsights('plays,shares'));
    if (!insightRows) {
      return { ok: false, error: 'instagram_insights_unavailable' };
    }

    let views = 0;
    let shares = 0;
    for (const metric of insightRows) {
      const val = toNonNegativeInt(metric.values?.[0]?.value);
      if (metric.name === 'views' || (metric.name === 'plays' && views === 0)) {
        views = val;
      }
      if (metric.name === 'shares') {
        shares = val;
      }
    }

    return {
      ok: true,
      deleted: false,
      externalPostId: matched.id,
      views,
      likes: toNonNegativeInt(matched.like_count),
      comments: toNonNegativeInt(matched.comments_count),
      shares,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message.slice(0, 120) : 'instagram_fetch_failed' };
  }
}

export interface ViewSyncSummary {
  checked: number;
  updated: number;
  deletedMarked: number;
  skippedUnconfigured: number;
  errors: Array<{ submissionId: string; platform: string; error: string }>;
  migrationPending?: boolean;
}

interface SubmissionSyncRow {
  submission_id: string;
  campaign_id: string;
  creator_id: string;
  platform: 'tiktok' | 'instagram' | 'youtube' | 'other';
  content_url: string;
  external_post_id: string | null;
  tkp_eur_cents: number | null;
  total_budget_eur: number | null;
  compensation_model: string;
  social_account_id: string | null;
  provider_account_id: string | null;
  oauth_scope: string | null;
  oauth_access_token_enc: string | null;
  oauth_refresh_token_enc: string | null;
  oauth_token_expires_at: string | null;
}

function isUndefinedColumnError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = (err as { code?: string }).code;
  if (code === '42703') return true;
  const message = (err as { message?: string }).message || '';
  return message.includes('oauth_access_token_enc') || message.includes('external_post_id') || message.includes('post_deleted_at');
}

export async function syncActiveCampaignSubmissionViews(
  sql: DatabaseClient,
  options: {
    limit?: number;
    campaignId?: string;
    fetchFn?: FetchLike;
    youtubeApiKey?: string;
  } = {},
): Promise<ViewSyncSummary> {
  const limit = Math.min(Math.max(Math.round(options.limit ?? 30), 1), 100);
  const fetchFn = options.fetchFn || fetch;
  const youtubeApiKey = (options.youtubeApiKey ?? process.env.YOUTUBE_API_KEY ?? '').trim();

  const summary: ViewSyncSummary = {
    checked: 0,
    updated: 0,
    deletedMarked: 0,
    skippedUnconfigured: 0,
    errors: [],
  };

  let rows: SubmissionSyncRow[] = [];
  try {
    const params: unknown[] = [limit];
    const campaignFilter = options.campaignId ? 'AND c.id = $2' : '';
    if (options.campaignId) params.push(options.campaignId);

    rows = (await sql.query(
      `SELECT
         s.id AS submission_id,
         s.campaign_id,
         s.creator_id,
         s.platform,
         s.content_url,
         s.external_post_id,
         c.tkp_eur_cents,
         c.total_budget_eur,
         c.compensation_model,
         sa.id AS social_account_id,
         sa.provider_account_id,
         sa.oauth_scope,
         sa.oauth_access_token_enc,
         sa.oauth_refresh_token_enc,
         sa.oauth_token_expires_at
       FROM brand_campaign_submissions s
       JOIN brand_campaigns c ON c.id = s.campaign_id
       LEFT JOIN LATERAL (
         SELECT id, provider_account_id, oauth_scope, oauth_access_token_enc, oauth_refresh_token_enc, oauth_token_expires_at
         FROM creator_social_accounts
         WHERE creator_id = s.creator_id
           AND platform = s.platform
           AND verification_method = 'oauth'
           AND oauth_access_token_enc IS NOT NULL
         ORDER BY verified_at DESC NULLS LAST, last_synced_at DESC NULLS LAST
         LIMIT 1
       ) sa ON TRUE
       WHERE c.status = 'active'
         AND s.status IN ('submitted', 'approved')
         AND s.platform IN ('tiktok', 'instagram', 'youtube')
         ${campaignFilter}
       ORDER BY s.last_tracked_at ASC NULLS FIRST, s.created_at ASC
       LIMIT $1`,
      params,
    )) as unknown as SubmissionSyncRow[];
  } catch (err) {
    if (isUndefinedColumnError(err)) {
      return { ...summary, migrationPending: true };
    }
    throw err;
  }

  for (const row of rows) {
    summary.checked += 1;
    let result: SocialMetricResult;

    if (row.platform === 'youtube') {
      const videoId = row.external_post_id || extractYouTubeVideoId(row.content_url);
      if (!videoId) {
        result = { ok: false, error: 'youtube_invalid_url' };
      } else if (!youtubeApiKey && !isYouTubeApiConfigured()) {
        result = { ok: false, skippedUnconfigured: true, error: 'youtube_api_key_missing' };
      } else {
        result = await fetchYouTubeVideoMetrics(videoId, youtubeApiKey, fetchFn);
      }
    } else if (row.platform === 'tiktok') {
      const videoId = row.external_post_id || extractTikTokVideoId(row.content_url);
      if (!videoId) {
        result = { ok: false, error: 'tiktok_invalid_url' };
      } else {
        let accessToken = decryptSocialToken(row.oauth_access_token_enc);
        const refreshToken = decryptSocialToken(row.oauth_refresh_token_enc);
        const isExpired =
          row.oauth_token_expires_at != null
          && Number.isFinite(Date.parse(row.oauth_token_expires_at))
          && Date.parse(row.oauth_token_expires_at) <= Date.now() + 60_000;

        if ((!accessToken || isExpired) && refreshToken && row.social_account_id) {
          const refreshed = await refreshTikTokAccessToken(refreshToken, fetchFn);
          if (refreshed) {
            accessToken = refreshed.accessToken;
            const nextAccessEnc = encryptSocialToken(refreshed.accessToken);
            const nextRefreshEnc = refreshed.refreshToken ? encryptSocialToken(refreshed.refreshToken) : null;
            const nextExpiresAt = new Date(Date.now() + refreshed.expiresInSeconds * 1000).toISOString();
            await sql.query(
              `UPDATE creator_social_accounts
               SET oauth_access_token_enc = $2,
                   oauth_refresh_token_enc = COALESCE($3, oauth_refresh_token_enc),
                   oauth_token_expires_at = $4::timestamptz,
                   oauth_last_error = '',
                   last_synced_at = now()
               WHERE id = $1`,
              [row.social_account_id, nextAccessEnc, nextRefreshEnc, nextExpiresAt],
            );
          }
        }

        if (!accessToken) {
          result = { ok: false, skippedUnconfigured: true, error: 'tiktok_oauth_not_connected' };
        } else {
          result = await fetchTikTokVideoMetrics(videoId, accessToken, fetchFn);
        }
      }
    } else if (row.platform === 'instagram') {
      const shortcode = extractInstagramShortcode(row.content_url);
      if (!shortcode) {
        result = { ok: false, error: 'instagram_invalid_url' };
      } else {
        const accessToken = decryptSocialToken(row.oauth_access_token_enc);
        if (!accessToken) {
          result = { ok: false, skippedUnconfigured: true, error: 'instagram_oauth_not_connected' };
        } else {
          const scope = (row.oauth_scope || '').toLowerCase();
          const useFacebookBusiness =
            scope.startsWith('facebook_business:')
            || scope.includes('instagram_manage_insights')
            || (isInstagramFacebookBusinessLogin() && Boolean(row.provider_account_id));
          result = await fetchInstagramMediaMetrics(shortcode, accessToken, fetchFn, {
            mode: useFacebookBusiness ? 'facebook_business' : 'instagram_direct',
            igUserId: row.provider_account_id,
          });
        }
      }
    } else {
      continue;
    }

    if (!result.ok) {
      if (result.skippedUnconfigured) {
        summary.skippedUnconfigured += 1;
      } else {
        summary.errors.push({
          submissionId: row.submission_id,
          platform: row.platform,
          error: result.error,
        });
      }
      await sql.query(
        `UPDATE brand_campaign_submissions
         SET last_sync_error = $2,
             updated_at = now()
         WHERE id = $1`,
        [row.submission_id, result.error.slice(0, 200)],
      );
      continue;
    }

    if (result.deleted) {
      await sql.query(
        `UPDATE brand_campaign_submissions
         SET status = 'rejected',
             spend_eur_cents = 0,
             external_post_id = COALESCE(external_post_id, $2),
             post_deleted_at = COALESCE(post_deleted_at, now()),
             review_note = $3,
             metrics_source = 'api',
             last_tracked_at = now(),
             last_sync_error = '',
             updated_at = now()
         WHERE id = $1`,
        [row.submission_id, result.externalPostId, DELETED_REVIEW_NOTE],
      );
      summary.deletedMarked += 1;
      continue;
    }

    // Calculate TKP spend bounded strictly by campaign total_budget_eur (hard cap).
    let spendCents = 0;
    const tkpCents = typeof row.tkp_eur_cents === 'number' && row.tkp_eur_cents > 0 ? row.tkp_eur_cents : 0;
    if (tkpCents > 0 && (row.compensation_model === 'tkp' || row.compensation_model === 'hybrid')) {
      const rawSpend = Math.floor((result.views * tkpCents) / 1000);
      if (typeof row.total_budget_eur === 'number' && row.total_budget_eur >= 0) {
        const capCents = Math.round(row.total_budget_eur * 100);
        const [other] = (await sql.query(
          `SELECT COALESCE(SUM(spend_eur_cents), 0)::bigint AS other_spend
           FROM brand_campaign_submissions
           WHERE campaign_id = $1
             AND id <> $2
             AND status <> 'rejected'`,
          [row.campaign_id, row.submission_id],
        )) as unknown as Array<{ other_spend: string | number }>;
        const otherSpend = Number(other?.other_spend || 0);
        const remainingCap = Math.max(0, capCents - otherSpend);
        spendCents = Math.min(rawSpend, remainingCap);
      } else {
        spendCents = rawSpend;
      }
    }

    await sql.query(
      `UPDATE brand_campaign_submissions
       SET views = $2,
           likes = $3,
           comments = $4,
           shares = $5,
           spend_eur_cents = $6,
           external_post_id = $7,
           metrics_source = 'api',
           last_tracked_at = now(),
           last_sync_error = '',
           updated_at = now()
       WHERE id = $1`,
      [
        row.submission_id,
        result.views,
        result.likes,
        result.comments,
        result.shares,
        spendCents,
        result.externalPostId,
      ],
    );

    await sql.query(
      `INSERT INTO brand_campaign_metric_snapshots (submission_id, views, likes, comments, shares)
       VALUES ($1, $2, $3, $4, $5)`,
      [row.submission_id, result.views, result.likes, result.comments, result.shares],
    );

    summary.updated += 1;
  }

  return summary;
}

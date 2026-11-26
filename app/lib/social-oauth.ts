import crypto from 'node:crypto';
import type { getDatabase } from '@/app/lib/database';

type DatabaseClient = ReturnType<typeof getDatabase>;

export const SOCIAL_OAUTH_STATE_COOKIE = 'ugcvz_social_oauth_state';
const STATE_TTL_MS = 10 * 60 * 1000;
const TOKEN_CIPHER_VERSION = 'v1';
const TOKEN_AAD = Buffer.from('ugcvz-social-token-v1', 'utf8');

export type SocialOAuthProvider = 'tiktok' | 'instagram';

export interface SocialOAuthAvailability {
  tiktok: boolean;
  instagram: boolean;
  youtube?: boolean;
}

export const isTikTokOAuthConfigured = () =>
  Boolean(process.env.TIKTOK_CLIENT_KEY?.trim() && process.env.TIKTOK_CLIENT_SECRET?.trim());

export const isInstagramOAuthConfigured = () =>
  Boolean(process.env.INSTAGRAM_APP_ID?.trim() && process.env.INSTAGRAM_APP_SECRET?.trim());

export const isYouTubeApiConfigured = () =>
  Boolean(process.env.YOUTUBE_API_KEY?.trim());

export const getSocialOAuthAvailability = (): SocialOAuthAvailability => ({
  tiktok: isTikTokOAuthConfigured(),
  instagram: isInstagramOAuthConfigured(),
  youtube: isYouTubeApiConfigured(),
});

export const getMetaGraphApiVersion = (): string =>
  (process.env.META_GRAPH_API_VERSION || 'v22.0').trim();

export const getInstagramLoginConfigId = (): string =>
  (process.env.INSTAGRAM_LOGIN_CONFIG_ID || '').trim();

export const isInstagramFacebookBusinessLogin = (): boolean =>
  Boolean(getInstagramLoginConfigId()) || process.env.INSTAGRAM_AUTH_MODE === 'facebook_business';

export const getTikTokOAuthScopes = (): string =>
  (process.env.TIKTOK_OAUTH_SCOPES || 'user.info.basic,user.info.profile,user.info.stats,video.list').trim();

export const getInstagramOAuthScopes = (): string =>
  (process.env.INSTAGRAM_OAUTH_SCOPES || 'instagram_business_basic,instagram_business_manage_insights').trim();

export const getInstagramFacebookBusinessScopes = (): string =>
  (process.env.INSTAGRAM_FB_SCOPES || 'instagram_basic,instagram_manage_insights,pages_show_list').trim();

export function buildInstagramAuthorizeUrl(input: {
  redirectUri: string;
  stateNonce: string;
}): string {
  const appId = process.env.INSTAGRAM_APP_ID!.trim();

  if (isInstagramFacebookBusinessLogin()) {
    const version = getMetaGraphApiVersion();
    const configId = getInstagramLoginConfigId();
    const authorizeUrl = new URL(`https://www.facebook.com/${version}/dialog/oauth`);
    authorizeUrl.searchParams.set('client_id', appId);
    authorizeUrl.searchParams.set('redirect_uri', input.redirectUri);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('state', input.stateNonce);
    if (configId) {
      authorizeUrl.searchParams.set('config_id', configId);
      authorizeUrl.searchParams.set('override_default_response_type', 'true');
    } else {
      authorizeUrl.searchParams.set('scope', getInstagramFacebookBusinessScopes());
    }
    return authorizeUrl.toString();
  }

  const authorizeUrl = new URL('https://www.instagram.com/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', appId);
  authorizeUrl.searchParams.set('redirect_uri', input.redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', getInstagramOAuthScopes());
  authorizeUrl.searchParams.set('state', input.stateNonce);
  return authorizeUrl.toString();
}

const getOAuthStateSecret = () => {
  const secret = process.env.BRAND_SESSION_SECRET || process.env.CREATOR_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('CREATOR_SESSION_SECRET or BRAND_SESSION_SECRET must be set.');
  }
  return secret;
};

const getTokenEncryptionKey = (): Buffer => {
  const secret =
    process.env.SOCIAL_TOKEN_ENCRYPTION_KEY?.trim()
    || process.env.CREATOR_SESSION_SECRET?.trim()
    || process.env.BRAND_SESSION_SECRET?.trim();
  if (!secret || secret.length < 16) {
    throw new Error('SOCIAL_TOKEN_ENCRYPTION_KEY (or CREATOR_SESSION_SECRET / BRAND_SESSION_SECRET) must be set.');
  }
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
};

export function encryptSocialToken(plaintext: string): string {
  const trimmed = plaintext.trim();
  if (!trimmed) throw new Error('Cannot encrypt empty social token.');
  const key = getTokenEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(TOKEN_AAD);
  const encrypted = Buffer.concat([cipher.update(trimmed, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    TOKEN_CIPHER_VERSION,
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

export function decryptSocialToken(ciphertext: string | null | undefined): string | null {
  if (!ciphertext || typeof ciphertext !== 'string') return null;
  const parts = ciphertext.split('.');
  if (parts.length !== 4 || parts[0] !== TOKEN_CIPHER_VERSION) return null;
  try {
    const key = getTokenEncryptionKey();
    const iv = Buffer.from(parts[1], 'base64url');
    const tag = Buffer.from(parts[2], 'base64url');
    const encrypted = Buffer.from(parts[3], 'base64url');
    if (iv.length !== 12 || tag.length !== 16 || encrypted.length === 0) return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(TOKEN_AAD);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return null;
  }
}

export function createPkcePair(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

export interface SignedOAuthState {
  creatorId: string;
  provider: SocialOAuthProvider;
  nonce: string;
  codeVerifier?: string;
  exp: number;
}

export function signOAuthState(input: Omit<SignedOAuthState, 'exp'>): string {
  const payload: SignedOAuthState = {
    ...input,
    exp: Date.now() + STATE_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getOAuthStateSecret())
    .update(`social_oauth.${encoded}`)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyOAuthState(raw: string | undefined, expectedProvider: SocialOAuthProvider): SignedOAuthState | null {
  if (!raw || !raw.includes('.')) return null;
  const [encoded, sig] = raw.split('.');
  if (!encoded || !sig) return null;
  try {
    const expected = crypto
      .createHmac('sha256', getOAuthStateSecret())
      .update(`social_oauth.${encoded}`)
      .digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SignedOAuthState;
    if (parsed.provider !== expectedProvider || !parsed.creatorId || !parsed.nonce) return null;
    if (!Number.isFinite(parsed.exp) || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isUndefinedColumnError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = (err as { code?: string }).code;
  if (code === '42703') return true;
  const message = (err as { message?: string }).message || '';
  return message.includes('oauth_access_token_enc') || message.includes('does not exist');
}

export async function upsertVerifiedOAuthSocialAccount(
  sql: DatabaseClient,
  input: {
    creatorId: string;
    platform: SocialOAuthProvider;
    handle: string;
    url: string;
    providerAccountId: string;
    followers?: number | null;
    scope?: string;
    accessToken?: string | null;
    refreshToken?: string | null;
    expiresInSeconds?: number | null;
  },
): Promise<void> {
  const canonical = input.handle.toLowerCase().replace(/^@/, '').replace(/[^a-z0-9._-]/g, '').slice(0, 60);
  const displayHandle = canonical ? `@${canonical}` : input.handle.slice(0, 60);
  const followers = typeof input.followers === 'number' && Number.isFinite(input.followers) && input.followers >= 0
    ? Math.round(input.followers)
    : null;
  const accessTokenEnc = input.accessToken?.trim() ? encryptSocialToken(input.accessToken) : null;
  const refreshTokenEnc = input.refreshToken?.trim() ? encryptSocialToken(input.refreshToken) : null;
  const tokenExpiresAt =
    typeof input.expiresInSeconds === 'number' && Number.isFinite(input.expiresInSeconds) && input.expiresInSeconds > 0
      ? new Date(Date.now() + Math.round(input.expiresInSeconds) * 1000).toISOString()
      : null;

  const [existing] = (await sql.query(
    `SELECT id FROM creator_social_accounts
     WHERE creator_id = $1 AND platform = $2
       AND (provider_account_id = $3 OR lower(canonical_handle) = $4 OR lower(url) = lower($5))
     LIMIT 1`,
    [input.creatorId, input.platform, input.providerAccountId, canonical, input.url],
  )) as unknown as Array<{ id: string }>;

  if (existing) {
    try {
      await sql.query(
        `UPDATE creator_social_accounts
         SET handle = $2,
             canonical_handle = NULLIF($3, ''),
             url = $4,
             provider_account_id = $5,
             followers = COALESCE($6, followers),
             oauth_scope = $7,
             oauth_access_token_enc = COALESCE($8, oauth_access_token_enc),
             oauth_refresh_token_enc = COALESCE($9, oauth_refresh_token_enc),
             oauth_token_expires_at = COALESCE($10::timestamptz, oauth_token_expires_at),
             oauth_last_error = '',
             verification_method = 'oauth',
             verified_at = now(),
             last_synced_at = now()
         WHERE id = $1`,
        [
          existing.id,
          displayHandle,
          canonical,
          input.url,
          input.providerAccountId,
          followers,
          input.scope || '',
          accessTokenEnc,
          refreshTokenEnc,
          tokenExpiresAt,
        ],
      );
      return;
    } catch (err) {
      if (!isUndefinedColumnError(err)) throw err;
      await sql.query(
        `UPDATE creator_social_accounts
         SET handle = $2,
             canonical_handle = NULLIF($3, ''),
             url = $4,
             provider_account_id = $5,
             followers = COALESCE($6, followers),
             oauth_scope = $7,
             verification_method = 'oauth',
             verified_at = now(),
             last_synced_at = now()
         WHERE id = $1`,
        [existing.id, displayHandle, canonical, input.url, input.providerAccountId, followers, input.scope || ''],
      );
      return;
    }
  }

  try {
    await sql.query(
      `INSERT INTO creator_social_accounts (
         creator_id, platform, handle, canonical_handle, url, provider_account_id,
         followers, oauth_scope, oauth_access_token_enc, oauth_refresh_token_enc,
         oauth_token_expires_at, oauth_last_error, verification_method, verified_at, last_synced_at
       ) VALUES ($1, $2, $3, NULLIF($4, ''), $5, $6, $7, $8, $9, $10, $11::timestamptz, '', 'oauth', now(), now())`,
      [
        input.creatorId,
        input.platform,
        displayHandle,
        canonical,
        input.url,
        input.providerAccountId,
        followers,
        input.scope || '',
        accessTokenEnc,
        refreshTokenEnc,
        tokenExpiresAt,
      ],
    );
  } catch (err) {
    if (!isUndefinedColumnError(err)) throw err;
    await sql.query(
      `INSERT INTO creator_social_accounts (
         creator_id, platform, handle, canonical_handle, url, provider_account_id,
         followers, oauth_scope, verification_method, verified_at, last_synced_at
       ) VALUES ($1, $2, $3, NULLIF($4, ''), $5, $6, $7, $8, 'oauth', now(), now())`,
      [input.creatorId, input.platform, displayHandle, canonical, input.url, input.providerAccountId, followers, input.scope || ''],
    );
  }
}

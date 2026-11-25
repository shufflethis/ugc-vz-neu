import crypto from 'node:crypto';
import type { getDatabase } from '@/app/lib/database';

type DatabaseClient = ReturnType<typeof getDatabase>;

export const SOCIAL_OAUTH_STATE_COOKIE = 'ugcvz_social_oauth_state';
const STATE_TTL_MS = 10 * 60 * 1000;

export type SocialOAuthProvider = 'tiktok' | 'instagram';

export interface SocialOAuthAvailability {
  tiktok: boolean;
  instagram: boolean;
}

export const isTikTokOAuthConfigured = () =>
  Boolean(process.env.TIKTOK_CLIENT_KEY?.trim() && process.env.TIKTOK_CLIENT_SECRET?.trim());

export const isInstagramOAuthConfigured = () =>
  Boolean(process.env.INSTAGRAM_APP_ID?.trim() && process.env.INSTAGRAM_APP_SECRET?.trim());

export const getSocialOAuthAvailability = (): SocialOAuthAvailability => ({
  tiktok: isTikTokOAuthConfigured(),
  instagram: isInstagramOAuthConfigured(),
});

const getOAuthStateSecret = () => {
  const secret = process.env.BRAND_SESSION_SECRET || process.env.CREATOR_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('CREATOR_SESSION_SECRET or BRAND_SESSION_SECRET must be set.');
  }
  return secret;
};

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
  },
): Promise<void> {
  const canonical = input.handle.toLowerCase().replace(/^@/, '').replace(/[^a-z0-9._-]/g, '').slice(0, 60);
  const displayHandle = canonical ? `@${canonical}` : input.handle.slice(0, 60);
  const followers = typeof input.followers === 'number' && Number.isFinite(input.followers) && input.followers >= 0
    ? Math.round(input.followers)
    : null;

  const [existing] = (await sql.query(
    `SELECT id FROM creator_social_accounts
     WHERE creator_id = $1 AND platform = $2
       AND (provider_account_id = $3 OR lower(canonical_handle) = $4 OR lower(url) = lower($5))
     LIMIT 1`,
    [input.creatorId, input.platform, input.providerAccountId, canonical, input.url],
  )) as unknown as Array<{ id: string }>;

  if (existing) {
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

  await sql.query(
    `INSERT INTO creator_social_accounts (
       creator_id, platform, handle, canonical_handle, url, provider_account_id,
       followers, oauth_scope, verification_method, verified_at, last_synced_at
     ) VALUES ($1, $2, $3, NULLIF($4, ''), $5, $6, $7, $8, 'oauth', now(), now())`,
    [input.creatorId, input.platform, displayHandle, canonical, input.url, input.providerAccountId, followers, input.scope || ''],
  );
}

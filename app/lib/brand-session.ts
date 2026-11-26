import crypto from 'node:crypto';

export const BRAND_SESSION_COOKIE = 'ugcvz_brand_session';
export const BRAND_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const BRAND_SHORT_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export const getBrandSessionTtlMs = (rememberMe = true) =>
  rememberMe ? BRAND_SESSION_TTL_MS : BRAND_SHORT_SESSION_TTL_MS;

const getSecret = (): string | null =>
  process.env.BRAND_SESSION_SECRET || process.env.CREATOR_SESSION_SECRET || null;

const sign = (payload: string, secretValue: string) =>
  crypto.createHmac('sha256', secretValue).update(payload).digest('base64url');

/**
 * Stateless, HMAC-signierte Brand-Session (gleiche Architektur wie creator-session.ts,
 * aber eigener Cookie-Name und Scope-Claim, damit Brand- und Creator-Sessions strikt getrennt bleiben).
 */
export const signBrandSession = (brandId: string, options?: { rememberMe?: boolean }): string => {
  const secretValue = getSecret();
  if (!secretValue) throw new Error('BRAND_SESSION_SECRET / CREATOR_SESSION_SECRET is not configured.');
  const ttlMs = getBrandSessionTtlMs(options?.rememberMe !== false);
  const expiresAt = Date.now() + ttlMs;
  const payload = Buffer.from(JSON.stringify({ bid: brandId, scope: 'brand', exp: expiresAt })).toString('base64url');
  return `${payload}.${sign(payload, secretValue)}`;
};

export const verifyBrandSession = (token: string | undefined | null): string | null => {
  const secretValue = getSecret();
  if (!token || !secretValue) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!payload || !signature) return null;

  const expected = sign(payload, secretValue);
  const provided = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (provided.length !== expectedBuffer.length || !crypto.timingSafeEqual(provided, expectedBuffer)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      bid?: string;
      scope?: string;
      exp?: number;
    };
    if (data.scope !== 'brand' || typeof data.bid !== 'string' || typeof data.exp !== 'number') return null;
    if (Date.now() > data.exp) return null;
    return data.bid;
  } catch {
    return null;
  }
};

const ALLOWED_ORIGINS = new Set([
  'https://ugc-vz.de',
  'https://www.ugc-vz.de',
  'http://localhost:3000',
  'http://localhost:3001',
]);

export function isTrustedSameOrigin(req: Request): boolean {
  const fetchSite = req.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') return false;
  const parseOrigin = (value: string | null) => {
    if (!value) return null;
    try {
      return new URL(value).origin;
    } catch {
      return null;
    }
  };
  const reqOrigin = parseOrigin(req.url);
  const originHeader = req.headers.get('origin');
  const origin = parseOrigin(originHeader);
  const refererOrigin = parseOrigin(req.headers.get('referer'));
  const allowed = (candidate: string | null) => Boolean(candidate && (ALLOWED_ORIGINS.has(candidate) || candidate === reqOrigin));
  if (originHeader) return allowed(origin);
  return allowed(refererOrigin);
}

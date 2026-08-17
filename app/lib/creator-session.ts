import crypto from 'node:crypto';

export const CREATOR_SESSION_COOKIE = 'ugcvz_session';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const getSecret = (): string | null => process.env.CREATOR_SESSION_SECRET || null;

const sign = (payload: string, secretValue: string) =>
  crypto.createHmac('sha256', secretValue).update(payload).digest('base64url');

/**
 * Stateless, HMAC-signierte Session. Kein Passwort, kein Session-Store: Die
 * E-Mail-Adresse ist die Identitaet, der Magic-Link erzeugt diese Session.
 */
export const signSession = (creatorId: string): string => {
  const secretValue = getSecret();
  if (!secretValue) throw new Error('CREATOR_SESSION_SECRET is not configured.');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ cid: creatorId, exp: expiresAt })).toString('base64url');
  return `${payload}.${sign(payload, secretValue)}`;
};

export const verifySession = (token: string | undefined | null): string | null => {
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
      cid?: string;
      exp?: number;
    };
    if (typeof data.cid !== 'string' || typeof data.exp !== 'number') return null;
    if (Date.now() > data.exp) return null;
    return data.cid;
  } catch {
    return null;
  }
};

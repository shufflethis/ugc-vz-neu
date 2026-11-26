import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { buildCreatorVerificationEmail } from '@/app/lib/creator-registration-email';
import {
  CREATOR_CONSENT_TEXT_VERSION,
  normalizeImageUrl,
  normalizeWebUrls,
  socialHandle,
  type CreatorRegistrationPayload,
} from '@/app/lib/creator-registration';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_BODY_BYTES = 30_000;
const WINDOW_MS = 60 * 60 * 1000;
const OTP_TTL_MS = 20 * 60 * 1000;
const rateLimits = new Map<string, number[]>();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const text = (value: unknown, max: number) => String(value || '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, max);

const multiline = (value: unknown, max: number) => String(value || '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  .replace(/\r\n?/g, '\n')
  .trim()
  .slice(0, max);

const getIp = (request: Request) => request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  || request.headers.get('x-real-ip')
  || 'unknown';

const rateLimitKey = (value: string) => crypto.createHash('sha256').update(value).digest('hex').slice(0, 24);

const consumeRateLimit = (key: string, limit: number) => {
  const now = Date.now();
  const recent = (rateLimits.get(key) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= limit) return false;
  recent.push(now);
  rateLimits.set(key, recent);
  return true;
};

const isTrustedRequest = (request: NextRequest) => {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const parsedOrigin = new URL(origin).origin;
    const allowed = new Set([
      request.nextUrl.origin,
      'https://ugc-vz.de',
      'https://www.ugc-vz.de',
      ...(process.env.NEXT_PUBLIC_BASE_URL ? [new URL(process.env.NEXT_PUBLIC_BASE_URL).origin] : []),
    ]);
    return allowed.has(parsedOrigin);
  } catch {
    return false;
  }
};

const normalizeSocialInput = (body: Record<string, unknown>): string[] => {
  const direct = normalizeWebUrls(body.socialLinks, 8);
  if (direct.length > 0) return direct;

  const rawHandle = text(body.socialHandle, 120).replace(/^@+/, '').replace(/\s+/g, '');
  if (!rawHandle) return [];
  if (/^https?:\/\//i.test(rawHandle) || /^(?:www\.|tiktok\.|instagram\.)/i.test(rawHandle)) {
    return normalizeWebUrls([rawHandle], 8);
  }
  const platform = text(body.socialPlatform, 20).toLowerCase() === 'instagram' ? 'instagram' : 'tiktok';
  const built = platform === 'instagram'
    ? `https://instagram.com/${encodeURIComponent(rawHandle)}`
    : `https://tiktok.com/@${encodeURIComponent(rawHandle)}`;
  return normalizeWebUrls([built], 8);
};

const normalizePayload = (body: Record<string, unknown>): CreatorRegistrationPayload | null => {
  const now = new Date().getFullYear();
  const birthYearRaw = Number(body.birthYear || 0);
  const birthYear = Number.isInteger(birthYearRaw) && birthYearRaw >= 1930 && birthYearRaw <= now - 16
    ? birthYearRaw
    : null;
  const email = text(body.email, 254).toLowerCase();
  const socialLinks = normalizeSocialInput(body);
  const portfolioLinks = normalizeWebUrls(body.portfolioLinks, 15);
  const stageName = text(body.stageName, 120);
  const derivedHandle = socialLinks[0] ? socialHandle(socialLinks[0]) : null;
  const name = text(body.name, 120) || stageName || derivedHandle || '';
  const topics = multiline(body.topics, 1_200);
  const preferredContent = multiline(body.preferredContent, 1_200);
  // Spec 8.2 creator.signup: Preis für Videos ist in Schritt 3 optional.
  const rateText = multiline(body.rateText, 500) || 'Nach Absprache';

  if (
    !name
    || !emailRegex.test(email)
    || !topics
    || !preferredContent
    || socialLinks.length === 0
    || body.platformConsent !== true
    || body.projectConsent !== true
  ) return null;

  return {
    name,
    stageName: stageName || derivedHandle || '',
    email,
    birthYear,
    gender: text(body.gender, 80),
    city: text(body.city, 120),
    profileImageUrl: normalizeImageUrl(body.profileImageUrl),
    topics,
    preferredContent,
    industries: multiline(body.industries, 1_200),
    rateText,
    reachText: multiline(body.reachText, 500),
    equipment: multiline(body.equipment, 1_000),
    specialTraits: multiline(body.specialTraits, 1_000),
    childrenContext: multiline(body.childrenContext, 700),
    petContext: multiline(body.petContext, 700),
    socialLinks,
    portfolioLinks,
    platformConsent: true,
    projectConsent: true,
    newsletterConsent: body.newsletterConsent === true,
    consentTextVersion: CREATOR_CONSENT_TEXT_VERSION,
  };
};

export async function POST(request: NextRequest) {
  if (!isTrustedRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Anmeldung ist noch nicht verfügbar.' }, { status: 503 });
  }

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ success: false, error: 'Eingabe ist zu groß.' }, { status: 413 });
  }

  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
      return NextResponse.json({ success: false, error: 'Eingabe ist zu groß.' }, { status: 413 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ success: false, error: 'Ungültige Eingabe.' }, { status: 400 });
    }

    if (text(body.website, 200)) {
      return NextResponse.json({ success: true });
    }

    const payload = normalizePayload(body);
    if (!payload) {
      return NextResponse.json({
        success: false,
        error: 'Bitte gib E-Mail, TikTok- oder Instagram-Name, mindestens ein Thema und Format sowie die beiden Pflicht-Einwilligungen an.',
      }, { status: 400 });
    }

    const ipAllowed = consumeRateLimit(`ip:${rateLimitKey(getIp(request))}`, 8);
    const emailAllowed = consumeRateLimit(`email:${rateLimitKey(payload.email)}`, 5);
    if (!ipAllowed || !emailAllowed) {
      return NextResponse.json({
        success: false,
        error: 'Du hast gerade mehrere Codes angefordert. Warte bitte kurz, dann kannst du es erneut versuchen.',
      }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ success: false, error: 'Bestätigungs-E-Mail ist nicht konfiguriert.' }, { status: 503 });
    }

    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const otpCode = String(crypto.randomInt(100000, 1000000));
    const otpHash = crypto.createHash('sha256').update(`${payload.email}:${otpCode}`).digest('hex');
    const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const sql = getDatabase();

    await sql.query(`
      UPDATE creator_registration_submissions
      SET expires_at = now()
      WHERE lower(email) = lower($1) AND verified_at IS NULL AND expires_at > now()
    `, [payload.email]);

    const storedPayload = {
      ...payload,
      _otpHash: otpHash,
      _otpExpiresAt: otpExpiresAt,
    };

    const [submission] = await sql.query(`
      INSERT INTO creator_registration_submissions (email, token_hash, payload, expires_at)
      VALUES ($1, $2, $3::jsonb, $4::timestamptz)
      RETURNING id
    `, [payload.email, tokenHash, JSON.stringify(storedPayload), expiresAt]);

    const verificationUrl = new URL('/api/creators/verify', request.nextUrl.origin);
    verificationUrl.searchParams.set('token', token);
    const email = buildCreatorVerificationEmail({
      name: payload.name,
      verificationUrl: verificationUrl.toString(),
      otpCode,
    });
    const resend = new Resend(resendApiKey);
    const sendMail = () => resend.emails.send({
      from: process.env.RESEND_FROM || 'UGC VZ <hi@ugc-vz.de>',
      to: payload.email,
      replyTo: process.env.UGC_INTERNAL_EMAIL || 'hi@ugc-vz.de',
      subject: email.subject,
      html: email.html,
      text: email.text,
      tags: [
        { name: 'category', value: 'creator_registration' },
        { name: 'audience', value: 'verification' },
      ],
    }, { idempotencyKey: `ugc-vz/creator-verification/${submission.id}` });

    let response = await sendMail();
    if (response.error && (response.error.name === 'application_error' || response.error.name === 'internal_server_error')) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      response = await sendMail();
    }

    if (response.error) {
      await sql.query(`DELETE FROM creator_registration_submissions WHERE id = $1`, [submission.id]);
      console.error('Creator verification email rejected by Resend', response.error.name);
      const isRateLimit = response.error.name === 'rate_limit_exceeded';
      return NextResponse.json({
        success: false,
        error: isRateLimit
          ? 'Du hast gerade mehrere Codes angefordert. Warte bitte 60 Sekunden, dann kannst du einen neuen anfordern.'
          : 'Gerade klappt der Versand bei uns nicht. Versuch es in ein paar Minuten noch mal oder schreib uns an hi@ugc-vz.de.',
      }, { status: isRateLimit ? 429 : 503 });
    }

    return NextResponse.json({
      success: true,
      otpSent: true,
      email: payload.email,
      message: 'Fertig. Wir haben dir einen Code geschickt. Bestätige ihn, dann siehst du alle Kampagnen.',
    });
  } catch (error) {
    console.error('Creator registration failed', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ success: false, error: 'Anmeldung konnte nicht gespeichert werden.' }, { status: 500 });
  }
}

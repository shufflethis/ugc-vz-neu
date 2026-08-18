import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { buildCreatorVerificationEmail } from '@/app/lib/creator-registration-email';
import {
  CREATOR_CONSENT_TEXT_VERSION,
  normalizeImageUrl,
  normalizeWebUrls,
  type CreatorRegistrationPayload,
} from '@/app/lib/creator-registration';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_BODY_BYTES = 30_000;
const WINDOW_MS = 60 * 60 * 1000;
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

const normalizePayload = (body: Record<string, unknown>): CreatorRegistrationPayload | null => {
  const now = new Date().getFullYear();
  const birthYearRaw = Number(body.birthYear || 0);
  const birthYear = Number.isInteger(birthYearRaw) && birthYearRaw >= 1930 && birthYearRaw <= now - 16
    ? birthYearRaw
    : null;
  const email = text(body.email, 254).toLowerCase();
  const socialLinks = normalizeWebUrls(body.socialLinks, 8);
  const portfolioLinks = normalizeWebUrls(body.portfolioLinks, 15);
  const name = text(body.name, 120);
  const topics = multiline(body.topics, 1_200);
  const preferredContent = multiline(body.preferredContent, 1_200);
  const rateText = multiline(body.rateText, 500);

  if (
    !name
    || !emailRegex.test(email)
    || !topics
    || !preferredContent
    || !rateText
    || socialLinks.length === 0
    || body.platformConsent !== true
    || body.projectConsent !== true
  ) return null;

  return {
    name,
    stageName: text(body.stageName, 120),
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
        error: 'Bitte fülle alle Pflichtfelder aus, gib mindestens einen gültigen Social-Link an und bestätige die Einwilligungen.',
      }, { status: 400 });
    }

    const ipAllowed = consumeRateLimit(`ip:${rateLimitKey(getIp(request))}`, 8);
    const emailAllowed = consumeRateLimit(`email:${rateLimitKey(payload.email)}`, 3);
    if (!ipAllowed || !emailAllowed) {
      return NextResponse.json({
        success: false,
        error: 'Zu viele Versuche. Bitte probiere es später erneut.',
      }, { status: 429, headers: { 'Retry-After': '3600' } });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ success: false, error: 'Bestätigungs-E-Mail ist nicht konfiguriert.' }, { status: 503 });
    }

    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const sql = getDatabase();

    await sql.query(`
      UPDATE creator_registration_submissions
      SET expires_at = now()
      WHERE lower(email) = lower($1) AND verified_at IS NULL AND expires_at > now()
    `, [payload.email]);

    const [submission] = await sql.query(`
      INSERT INTO creator_registration_submissions (email, token_hash, payload, expires_at)
      VALUES ($1, $2, $3::jsonb, $4::timestamptz)
      RETURNING id
    `, [payload.email, tokenHash, JSON.stringify(payload), expiresAt]);

    const verificationUrl = new URL('/api/creators/verify', request.nextUrl.origin);
    verificationUrl.searchParams.set('token', token);
    const email = buildCreatorVerificationEmail({ name: payload.name, verificationUrl: verificationUrl.toString() });
    const resend = new Resend(resendApiKey);
    const response = await resend.emails.send({
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

    if (response.error) {
      await sql.query(`DELETE FROM creator_registration_submissions WHERE id = $1`, [submission.id]);
      console.error('Creator verification email rejected by Resend', response.error.name);
      return NextResponse.json({
        success: false,
        error: 'Die Bestätigungs-E-Mail konnte nicht versendet werden. Bitte erneut versuchen.',
      }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: 'Bitte bestätige jetzt deine E-Mail-Adresse.' });
  } catch (error) {
    console.error('Creator registration failed', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ success: false, error: 'Anmeldung konnte nicht gespeichert werden.' }, { status: 500 });
  }
}

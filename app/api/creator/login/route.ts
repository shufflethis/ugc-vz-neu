import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { buildCreatorLoginEmail, CREATOR_LOGIN_TTL_MINUTES } from '@/app/lib/creator-login-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const WINDOW_MS = 60 * 60 * 1000;
const rateLimits = new Map<string, number[]>();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const text = (value: unknown, max: number) => String(value || '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  .replace(/\s+/g, ' ')
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

// Die Antwort ist bewusst generisch: Sie verraet nicht, ob zu einer Adresse
// ein verifiziertes Profil existiert (kein E-Mail-Enumeration-Vektor).
const GENERIC_MESSAGE = 'Wenn zu dieser E-Mail-Adresse ein verifiziertes Creator-Profil existiert, senden wir dir jetzt einen Anmeldelink. Prüfe auch deinen Spam-Ordner.';

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Der Login ist gerade nicht verfügbar.' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Eingabe.' }, { status: 400 });
  }

  const email = text(body.email, 254).toLowerCase();
  if (!emailRegex.test(email)) {
    return NextResponse.json({ success: false, error: 'Bitte gib eine gültige E-Mail-Adresse an.' }, { status: 400 });
  }

  const ipAllowed = consumeRateLimit(`ip:${rateLimitKey(getIp(request))}`, 8);
  const emailAllowed = consumeRateLimit(`email:${rateLimitKey(email)}`, 3);
  if (!ipAllowed || !emailAllowed) {
    return NextResponse.json({
      success: false,
      error: 'Zu viele Versuche. Bitte probiere es später erneut.',
    }, { status: 429, headers: { 'Retry-After': '3600' } });
  }

  const sql = getDatabase();

  const [creator] = await sql.query(
    `
    SELECT p.id, p.display_name
    FROM creator_private_contacts c
    JOIN creator_profiles p ON p.id = c.creator_id
    WHERE lower(c.email) = lower($1)
      AND p.status = 'active'
    LIMIT 1
  `,
    [email],
  ) as unknown as Array<{ id: string; display_name: string }>;

  // Kein aktives Profil -> keine Mail, aber trotzdem generische Antwort.
  // Der Log-Eintrag verraet dem Client nichts, macht aber genau diesen Fall
  // nachvollziehbar: ohne ihn ist "Mail nie gesendet" im Support nicht von
  // "Mail nicht angekommen" zu unterscheiden.
  if (!creator) {
    console.warn('Creator login requested for unknown or inactive profile:', email);
    return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json({ success: false, error: 'Der Login ist gerade nicht verfügbar.' }, { status: 503 });
  }

  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + CREATOR_LOGIN_TTL_MINUTES * 60 * 1000).toISOString();

  await sql.query(
    `UPDATE creator_verification_tokens
     SET used_at = now()
     WHERE creator_id = $1 AND purpose = 'edit_profile' AND used_at IS NULL`,
    [creator.id],
  );

  await sql.query(
    `INSERT INTO creator_verification_tokens (creator_id, token_hash, purpose, expires_at)
     VALUES ($1, $2, 'edit_profile', $3)`,
    [creator.id, tokenHash, expiresAt],
  );

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  const loginUrl = new URL('/api/creator/login/verify', baseUrl);
  loginUrl.searchParams.set('token', token);

  const emailPayload = buildCreatorLoginEmail({ name: creator.display_name, loginUrl: loginUrl.toString() });
  const resend = new Resend(resendApiKey);
  const response = await resend.emails.send({
    from: process.env.RESEND_FROM || 'UGC VZ <hi@ugc-vz.de>',
    to: email,
    replyTo: process.env.UGC_INTERNAL_EMAIL || 'hi@ugc-vz.de',
    subject: emailPayload.subject,
    html: emailPayload.html,
    text: emailPayload.text,
    tags: [
      { name: 'category', value: 'creator_login' },
      { name: 'audience', value: 'creator' },
    ],
  });

  if (response.error) {
    console.error('Creator login email rejected by Resend', response.error.name);
    return NextResponse.json({
      success: false,
      error: 'Die E-Mail konnte nicht versendet werden. Bitte versuche es erneut.',
    }, { status: 502 });
  }

  return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
}

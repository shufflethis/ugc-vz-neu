import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { buildCreatorLoginEmail, CREATOR_LOGIN_TTL_MINUTES, hashCreatorOtp } from '@/app/lib/creator-login-email';
import {
  AUTH_ERROR_PROVIDER_UNAVAILABLE,
  checkAuthRateLimit,
  getClientIp,
  logAuthEvent,
  sendTransactionalAuthEmail,
} from '@/app/lib/auth-delivery';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const text = (value: unknown, max: number) =>
  String(value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

const GENERIC_MESSAGE =
  'Wenn zu dieser Adresse ein Profil existiert, ist der Code unterwegs. Nichts da? Schau im Spam oder im Gmail-Tab „Benachrichtigungen“.';

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: AUTH_ERROR_PROVIDER_UNAVAILABLE }, { status: 503 });
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

  const rate = checkAuthRateLimit({
    flow: 'creator',
    email,
    ip: getClientIp(request),
  });
  if (!rate.allowed) {
    logAuthEvent({
      flow: 'creator',
      email,
      profileFound: false,
      emailSent: false,
      providerStatus: 429,
      errorCode: rate.reason,
    });
    return NextResponse.json(
      { success: false, error: rate.error, retryAfterSec: rate.retryAfterSec },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } },
    );
  }

  try {
    const sql = getDatabase();

    // Case-insensitiv und getrimmt suchen; schliesst aktive und noch unbestaetigte Profile ein.
    const [creator] = (await sql.query(
      `
      SELECT p.id, p.display_name, p.status
      FROM creator_private_contacts c
      JOIN creator_profiles p ON p.id = c.creator_id
      WHERE lower(btrim(c.email)) = lower($1)
        AND p.status IN ('active', 'pending_verification')
      ORDER BY CASE WHEN p.status = 'active' THEN 0 ELSE 1 END, p.updated_at DESC
      LIMIT 1
    `,
      [email],
    )) as unknown as Array<{ id: string; display_name: string; status: string }>;

    if (!creator) {
      logAuthEvent({
        flow: 'creator',
        email,
        profileFound: false,
        profileStatus: null,
        emailSent: false,
      });
      return NextResponse.json({ success: true, message: GENERIC_MESSAGE, resendCooldownSec: 60 });
    }

    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const otpCode = String(crypto.randomInt(100000, 1000000));
    const otpHash = hashCreatorOtp(email, otpCode);
    const expiresAt = new Date(Date.now() + CREATOR_LOGIN_TTL_MINUTES * 60 * 1000).toISOString();

    await sql.query(
      `UPDATE creator_verification_tokens
       SET used_at = now()
       WHERE creator_id = $1 AND purpose = 'edit_profile' AND used_at IS NULL`,
      [creator.id],
    );

    await sql.query(
      `INSERT INTO creator_verification_tokens (creator_id, token_hash, otp_code_hash, purpose, expires_at)
       VALUES ($1, $2, $3, 'edit_profile', $4)`,
      [creator.id, tokenHash, otpHash, expiresAt],
    );

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const loginUrl = new URL('/konto/verify', baseUrl);
    loginUrl.searchParams.set('token', token);

    const emailPayload = buildCreatorLoginEmail({
      name: creator.display_name,
      loginUrl: loginUrl.toString(),
      otpCode,
      isActivation: creator.status === 'pending_verification',
    });

    const delivery = await sendTransactionalAuthEmail({
      flow: 'creator',
      message: {
        to: email,
        subject: emailPayload.subject,
        html: emailPayload.html,
        text: emailPayload.text,
        tags: [
          { name: 'category', value: 'creator_login' },
          { name: 'audience', value: 'creator' },
        ],
      },
    });

    logAuthEvent({
      flow: 'creator',
      email,
      profileFound: true,
      profileStatus: creator.status,
      emailSent: delivery.ok,
      providerStatus: delivery.providerStatus,
      errorCode: delivery.errorCode,
    });

    if (!delivery.ok) {
      return NextResponse.json(
        {
          success: false,
          error: delivery.userMessage || AUTH_ERROR_PROVIDER_UNAVAILABLE,
          ...(delivery.retryAfterSec ? { retryAfterSec: delivery.retryAfterSec } : {}),
        },
        {
          status: delivery.status,
          ...(delivery.retryAfterSec ? { headers: { 'Retry-After': String(delivery.retryAfterSec) } } : {}),
        },
      );
    }

    return NextResponse.json({
      success: true,
      message: GENERIC_MESSAGE,
      resendCooldownSec: 60,
    });
  } catch (error) {
    logAuthEvent({
      flow: 'creator',
      email,
      profileFound: false,
      emailSent: false,
      providerStatus: 500,
      errorCode: error instanceof Error ? error.name : 'unexpected_error',
    });
    return NextResponse.json({ success: false, error: AUTH_ERROR_PROVIDER_UNAVAILABLE }, { status: 503 });
  }
}

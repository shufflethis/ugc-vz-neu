import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { buildBrandLoginEmail } from '@/app/lib/brand-login-email';
import { isTrustedSameOrigin } from '@/app/lib/brand-session';
import {
  cleanText,
  createBrandLoginChallenge,
  findBrandByEmail,
  upsertBrandAccount,
} from '@/app/lib/brand-workspace';
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

export async function POST(request: NextRequest) {
  if (!isTrustedSameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: AUTH_ERROR_PROVIDER_UNAVAILABLE }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Eingabe.' }, { status: 400 });
  }

  if (cleanText(body.website, 200)) {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const email = cleanText(body.email, 254).toLowerCase();
  if (!emailRegex.test(email)) {
    return NextResponse.json({ success: false, error: 'Bitte gib eine gültige geschäftliche E-Mail-Adresse an.' }, { status: 400 });
  }

  const mode: 'login' | 'signup' = body.mode === 'signup' ? 'signup' : 'login';
  const contactName = cleanText(body.name, 120);
  const companyName = cleanText(body.company, 140);

  const rate = checkAuthRateLimit({
    flow: 'brand',
    email,
    ip: getClientIp(request),
  });
  if (!rate.allowed) {
    logAuthEvent({
      flow: 'brand',
      mode,
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
    const existingBrand = await findBrandByEmail(sql, email);

    let brand = existingBrand;
    let switchedToLogin = false;

    if (mode === 'login') {
      if (!existingBrand) {
        logAuthEvent({
          flow: 'brand',
          mode: 'login',
          email,
          profileFound: false,
          emailSent: false,
          errorCode: 'account_not_found',
        });
        return NextResponse.json(
          {
            success: false,
            code: 'account_not_found',
            suggestedMode: 'signup',
            error: 'Zu dieser E-Mail-Adresse gibt es noch kein Marken-Konto. Lege jetzt dein Konto an.',
          },
          { status: 404 },
        );
      }
    } else if (existingBrand) {
      // Bestehende E-Mail im Registrieren-Zustand fuehrt automatisch zur Anmeldung statt zu Fehler oder Doppelkonto.
      switchedToLogin = true;
      brand = existingBrand;
    } else {
      if (!contactName || !companyName) {
        return NextResponse.json(
          {
            success: false,
            error: 'Bitte gib deinen Namen und deine Marke bzw. dein Unternehmen an.',
          },
          { status: 400 },
        );
      }
      brand = await upsertBrandAccount(sql, {
        email,
        contactName,
        companyName,
        industryCategory: cleanText(body.industryCategory, 40) || undefined,
      });
    }

    if (!brand) {
      return NextResponse.json({ success: false, error: AUTH_ERROR_PROVIDER_UNAVAILABLE }, { status: 503 });
    }

    const redirectTo = cleanText(body.redirectTo, 200);
    const { token, otpCode } = await createBrandLoginChallenge(sql, brand.id, email, redirectTo);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const loginUrl = new URL('/brand/verify', baseUrl);
    loginUrl.searchParams.set('token', token);

    const emailPayload = buildBrandLoginEmail({
      name: brand.contactName,
      company: brand.companyName,
      loginUrl: loginUrl.toString(),
      otpCode,
    });

    const delivery = await sendTransactionalAuthEmail({
      flow: 'brand',
      message: {
        to: email,
        subject: emailPayload.subject,
        html: emailPayload.html,
        text: emailPayload.text,
        tags: [
          { name: 'category', value: 'brand_login' },
          { name: 'audience', value: 'brand' },
        ],
      },
    });

    logAuthEvent({
      flow: 'brand',
      mode,
      email,
      profileFound: Boolean(existingBrand),
      profileStatus: existingBrand ? 'existing' : 'created',
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
      switchedToLogin,
      resendCooldownSec: 60,
      message: `Code ist unterwegs an ${email}. Nichts da? Schau im Spam oder im Gmail-Tab „Benachrichtigungen“.`,
    });
  } catch (error) {
    logAuthEvent({
      flow: 'brand',
      mode,
      email,
      profileFound: false,
      emailSent: false,
      providerStatus: 500,
      errorCode: error instanceof Error ? error.name : 'unexpected_error',
    });
    return NextResponse.json({ success: false, error: AUTH_ERROR_PROVIDER_UNAVAILABLE }, { status: 503 });
  }
}

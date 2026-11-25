import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import {
  BRAND_SESSION_COOKIE,
  BRAND_SESSION_TTL_MS,
  isTrustedSameOrigin,
  signBrandSession,
} from '@/app/lib/brand-session';
import { consumeBrandLoginOtp, consumeBrandLoginToken } from '@/app/lib/brand-workspace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * POST-only Einloesung: unterstuetzt sowohl den Magic-Link-Token (/brand/verify)
 * als auch den 6-stelligen Einmal-Code direkt im Browser (resistent gegen Mail-Scanner).
 */
export async function POST(request: NextRequest) {
  if (!isTrustedSameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Datenbank nicht verfügbar.' }, { status: 503 });
  }

  let token = '';
  let email = '';
  let code = '';
  try {
    const body = (await request.json()) as { token?: unknown; email?: unknown; code?: unknown };
    token = typeof body.token === 'string' ? body.token.trim() : '';
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    code = typeof body.code === 'string' ? body.code.replace(/\s+/g, '') : '';
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  try {
    const sql = getDatabase();
    const result = token
      ? await consumeBrandLoginToken(sql, token)
      : email && /^\d{6}$/.test(code)
        ? await consumeBrandLoginOtp(sql, email, code)
        : null;

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: token
            ? 'Dieser Anmeldelink ist ungültig oder abgelaufen. Bitte fordere einen neuen Code an.'
            : 'Der 6-stellige Code ist ungültig oder abgelaufen. Bitte prüfe deine E-Mail oder fordere einen neuen Code an.',
        },
        { status: 400 },
      );
    }

    const session = signBrandSession(result.brandId);
    const response = NextResponse.json({ success: true, redirectTo: result.redirectTo });
    response.cookies.set(BRAND_SESSION_COOKIE, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: BRAND_SESSION_TTL_MS / 1000,
    });
    return response;
  } catch (error) {
    console.error('Brand login verify failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'Anmeldung fehlgeschlagen.' }, { status: 500 });
  }
}

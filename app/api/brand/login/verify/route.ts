import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import {
  BRAND_SESSION_COOKIE,
  BRAND_SESSION_TTL_MS,
  isTrustedSameOrigin,
  signBrandSession,
} from '@/app/lib/brand-session';
import { consumeBrandLoginToken } from '@/app/lib/brand-workspace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * POST-only Einloesung: Mail-Scanner (Outlook Safe Links / Proofpoint) rufen nur GET/HEAD ab
 * und verbrauchen diesen Token daher niemals vor dem echten Nutzerklick auf /brand/verify.
 */
export async function POST(request: NextRequest) {
  if (!isTrustedSameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Datenbank nicht verfügbar.' }, { status: 503 });
  }

  let token = '';
  try {
    const body = (await request.json()) as { token?: unknown };
    token = typeof body.token === 'string' ? body.token.trim() : '';
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  try {
    const result = await consumeBrandLoginToken(getDatabase(), token);
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Dieser Anmeldelink ist ungültig oder abgelaufen. Bitte fordere einen neuen Link an.' },
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

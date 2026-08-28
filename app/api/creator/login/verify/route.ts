import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import {
  CREATOR_SESSION_COOKIE,
  SESSION_TTL_MS,
  signSession,
} from '@/app/lib/creator-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const redirectToKonto = (request: Request, state: 'invalid' | 'error') => {
  const url = new URL('/konto', request.url);
  url.searchParams.set(state, '1');
  return NextResponse.redirect(url, 303);
};

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) return redirectToKonto(request, 'error');

  const token = new URL(request.url).searchParams.get('token') || '';
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return redirectToKonto(request, 'invalid');

  try {
    const sql = getDatabase();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [submission] = await sql.query(
      `
      SELECT id, creator_id, expires_at, used_at
      FROM creator_verification_tokens
      WHERE token_hash = $1 AND purpose = 'edit_profile'
      LIMIT 1
    `,
      [tokenHash],
    ) as unknown as Array<{ id: string; creator_id: string; expires_at: string; used_at: string | null }>;

    if (!submission) return redirectToKonto(request, 'invalid');
    if (submission.used_at) return redirectToKonto(request, 'invalid');
    if (new Date(submission.expires_at).getTime() < Date.now()) return redirectToKonto(request, 'invalid');

    // Ein geklickter Anmeldelink beweist, dass die Adresse dem Creator gehoert --
    // damit ist die E-Mail verifiziert, auch wenn das Profil aus dem Sheet-Import
    // stammt und nie ein Double-Opt-in durchlaufen hat. coalesce haelt einen
    // bereits vorhandenen Zeitstempel fest, das CTE macht beides atomar.
    await sql.query(
      `WITH consumed AS (
         UPDATE creator_verification_tokens
         SET used_at = now()
         WHERE id = $1 AND used_at IS NULL
         RETURNING creator_id
       )
       UPDATE creator_private_contacts c
       SET email_verified_at = coalesce(c.email_verified_at, now()), updated_at = now()
       FROM consumed
       WHERE c.creator_id = consumed.creator_id`,
      [submission.id],
    );

    const session = signSession(submission.creator_id);
    const response = NextResponse.redirect(new URL('/konto', request.url), 303);
    response.cookies.set(CREATOR_SESSION_COOKIE, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_MS / 1000,
    });
    return response;
  } catch (error) {
    console.error('Creator login verification failed', error instanceof Error ? error.message : 'unknown error');
    return redirectToKonto(request, 'error');
  }
}

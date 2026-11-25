import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import {
  CREATOR_SESSION_COOKIE,
  SESSION_TTL_MS,
  signSession,
} from '@/app/lib/creator-session';
import { isTrustedSameOrigin } from '@/app/lib/brand-session';
import { hashCreatorOtp } from '@/app/lib/creator-login-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_OTP_ATTEMPTS = 5;

const activateAndSignSession = async (creatorId: string) => {
  const sql = getDatabase();
  await sql.query(
    `UPDATE creator_profiles
     SET status = 'active', updated_at = now()
     WHERE id = $1 AND status = 'pending_verification'`,
    [creatorId],
  );
  await sql.query(
    `UPDATE creator_private_contacts
     SET email_verified_at = coalesce(email_verified_at, now()), updated_at = now()
     WHERE creator_id = $1`,
    [creatorId],
  );
  return signSession(creatorId);
};

/**
 * GET loest den Token bewusst NICHT ein (Schutz gegen Mail-Scanner / Outlook Safe Links),
 * sondern leitet auf die 1-Klick-POST-Seite /konto/verify weiter.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) {
    return NextResponse.redirect(new URL('/konto?invalid=1', request.url), 303);
  }
  const verifyUrl = new URL('/konto/verify', request.url);
  verifyUrl.searchParams.set('token', token);
  return NextResponse.redirect(verifyUrl, 303);
}

/**
 * POST loest entweder den Magic-Link-Token (/konto/verify) oder den 6-stelligen E-Mail-Code
 * direkt aus /konto ein und aktiviert dabei ggf. noch ausstehende Profile automatisch.
 */
export async function POST(request: NextRequest) {
  if (!isTrustedSameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Datenbank nicht verfügbar.' }, { status: 503 });
  }

  let body: { token?: unknown; email?: unknown; code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const sql = getDatabase();
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const code = typeof body.code === 'string' ? body.code.replace(/\s+/g, '') : '';

  try {
    let creatorId = '';

    if (token) {
      if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) {
        return NextResponse.json({ success: false, error: 'Ungültiger Anmeldelink.' }, { status: 400 });
      }
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const rows = (await sql.query(
        `UPDATE creator_verification_tokens
         SET used_at = now()
         WHERE token_hash = $1 AND purpose = 'edit_profile' AND used_at IS NULL AND expires_at > now()
         RETURNING creator_id`,
        [tokenHash],
      )) as unknown as Array<{ creator_id: string }>;

      if (!rows.length) {
        return NextResponse.json(
          { success: false, error: 'Dieser Link ist ungültig oder abgelaufen. Bitte fordere einen neuen Code an.' },
          { status: 400 },
        );
      }
      creatorId = String(rows[0].creator_id);
    } else if (email && /^\d{6}$/.test(code)) {
      const [latest] = (await sql.query(
        `SELECT t.id, t.creator_id, t.otp_code_hash, t.otp_attempts
         FROM creator_verification_tokens t
         JOIN creator_private_contacts c ON c.creator_id = t.creator_id
         WHERE lower(c.email) = lower($1)
           AND t.purpose = 'edit_profile'
           AND t.used_at IS NULL
           AND t.expires_at > now()
           AND t.otp_code_hash IS NOT NULL
         ORDER BY t.created_at DESC
         LIMIT 1`,
        [email],
      )) as unknown as Array<{ id: string; creator_id: string; otp_code_hash: string; otp_attempts: number }>;

      if (!latest || Number(latest.otp_attempts) >= MAX_OTP_ATTEMPTS) {
        return NextResponse.json(
          { success: false, error: 'Code ungültig oder abgelaufen. Bitte fordere einen neuen 6-stelligen Code an.' },
          { status: 400 },
        );
      }

      const candidateHash = hashCreatorOtp(email, code);
      const match =
        candidateHash.length === latest.otp_code_hash.length &&
        crypto.timingSafeEqual(Buffer.from(candidateHash), Buffer.from(latest.otp_code_hash));

      if (!match) {
        await sql.query(
          `UPDATE creator_verification_tokens
           SET otp_attempts = otp_attempts + 1,
               used_at = CASE WHEN otp_attempts + 1 >= $2 THEN now() ELSE used_at END
           WHERE id = $1`,
          [latest.id, MAX_OTP_ATTEMPTS],
        );
        return NextResponse.json(
          { success: false, error: 'Der 6-stellige Code stimmt nicht. Bitte prüfe deine E-Mail.' },
          { status: 400 },
        );
      }

      const consumed = (await sql.query(
        `UPDATE creator_verification_tokens
         SET used_at = now()
         WHERE id = $1 AND used_at IS NULL AND expires_at > now()
         RETURNING creator_id`,
        [latest.id],
      )) as unknown as Array<{ creator_id: string }>;

      if (!consumed.length) {
        return NextResponse.json(
          { success: false, error: 'Dieser Code wurde bereits verwendet oder ist abgelaufen.' },
          { status: 400 },
        );
      }
      creatorId = String(consumed[0].creator_id);
    } else {
      return NextResponse.json(
        { success: false, error: 'Bitte gib deinen 6-stelligen Code ein oder nutze den Anmeldelink.' },
        { status: 400 },
      );
    }

    const session = await activateAndSignSession(creatorId);
    const response = NextResponse.json({ success: true, redirectTo: '/konto?login=1' });
    response.cookies.set(CREATOR_SESSION_COOKIE, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_MS / 1000,
    });
    return response;
  } catch (error) {
    console.error('Creator login verification failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'Anmeldung fehlgeschlagen.' }, { status: 500 });
  }
}

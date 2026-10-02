// Opt-in/Opt-out fuer Projektanfragen per E-Mail aus dem Creator-Konto. Wer sich
// per Anmeldelink eingeloggt hat, hat die Adresse bewiesen; der Haken im Konto
// ist die ausdrueckliche Einwilligung (wird in consent_events protokolliert).
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { verifySession, CREATOR_SESSION_COOKIE } from '@/app/lib/creator-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONSENT_TEXT_VERSION = 'konto-project-v1-2026-10';

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (request.headers.get('sec-fetch-site') === 'cross-site' || !origin || ![request.nextUrl.origin, 'https://ugc-vz.de', 'https://www.ugc-vz.de'].includes(origin)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Gerade nicht verfügbar.' }, { status: 503 });
  }
  const creatorId = verifySession(request.cookies.get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) {
    return NextResponse.json({ success: false, error: 'Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.' }, { status: 401 });
  }

  let enabled: boolean;
  try {
    enabled = (await request.json()).enabled === true;
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Eingabe.' }, { status: 400 });
  }

  try {
    const sql = getDatabase();
    // Ohne verifizierte Adresse (Anmeldelink) keine Einwilligung.
    const rows = await sql.query(
      `UPDATE creator_private_contacts
       SET project_notifications_enabled = $2::boolean,
           notification_paused_at = CASE WHEN $2::boolean THEN NULL ELSE notification_paused_at END,
           updated_at = now()
       WHERE creator_id = $1 AND email_verified_at IS NOT NULL
       RETURNING creator_id`,
      [creatorId, enabled],
    );
    if (!rows.length) {
      return NextResponse.json({ success: false, error: 'Bitte melde dich zuerst über den Anmeldelink an.' }, { status: 403 });
    }
    await sql.query(
      `INSERT INTO consent_events (creator_id, purpose, granted, text_version, source, source_reference, occurred_at)
       VALUES ($1, 'project_notifications', $2, $3, 'konto', $4, now())`,
      [creatorId, enabled, CONSENT_TEXT_VERSION, randomUUID()],
    );
    return NextResponse.json({ success: true, enabled });
  } catch (error) {
    console.error('Creator notifications update failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'Speichern fehlgeschlagen.' }, { status: 500 });
  }
}

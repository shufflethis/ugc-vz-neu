import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import { isTrustedCreatorRequest } from '@/app/lib/creator-request-guard';
import { recordProfileEdits } from '@/app/lib/creator-profile';
import { loadCreatorAiProfile, withdrawCreatorAiProfile } from '@/app/lib/creator-social-analyzer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Widerruf der KI-Profilanalyse nach Spec 8.6:
 * Loescht KI-Zusammenfassung, Rohdaten und KI-Embedding sofort.
 * Das Profil faellt auf die eigenen Angaben des Creators zurueck.
 */
export async function POST(request: NextRequest) {
  if (!isTrustedCreatorRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Widerruf ist gerade nicht verfügbar.' }, { status: 503 });
  }

  const creatorId = verifySession(request.cookies.get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) {
    return NextResponse.json({ success: false, error: 'Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.' }, { status: 401 });
  }

  try {
    const sql = getDatabase();
    const before = await loadCreatorAiProfile(sql, creatorId);
    const result = await withdrawCreatorAiProfile(sql, creatorId);

    await recordProfileEdits(sql, creatorId, [
      {
        field_name: 'ai_profile_consent',
        old_value: before?.status || 'active',
        new_value: 'withdrawn',
      },
    ]).catch(() => {});

    const aiProfile = await loadCreatorAiProfile(sql, creatorId);
    return NextResponse.json({
      success: true,
      withdrawn: result.withdrawn,
      searchIndexRebuilt: result.searchIndexRebuilt,
      aiProfile,
      message: 'Einwilligung widerrufen. Deine KI-Zusammenfassung, Rohdaten und das KI-Embedding wurden sofort gelöscht.',
    });
  } catch (error) {
    console.error('Creator AI profile withdrawal failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'Widerruf konnte nicht abgeschlossen werden.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import { consumeCreatorAiRateLimit, isTrustedCreatorRequest } from '@/app/lib/creator-request-guard';
import { runCreatorAiAnalysis } from '@/app/lib/creator-social-analyzer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  if (!isTrustedCreatorRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Analyse ist gerade nicht verfügbar.' }, { status: 503 });
  }

  const creatorId = verifySession(request.cookies.get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) {
    return NextResponse.json({ success: false, error: 'Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.' }, { status: 401 });
  }

  const rate = consumeCreatorAiRateLimit(`analyze:${creatorId}`, 5, DAY_MS);
  if (!rate.allowed) {
    return NextResponse.json(
      { success: false, error: 'Du hast dein Profil heute bereits mehrfach analysiert. Bitte versuche es später erneut.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  try {
    const sql = getDatabase();
    const isTestDb = Boolean(process.env.DATABASE_URL?.includes('.invalid'));
    const aiProfile = await runCreatorAiAnalysis(sql, creatorId, {
      allowGeonode: false,
      skipNetwork: isTestDb,
    });
    return NextResponse.json({
      success: true,
      aiProfile,
      message: 'Deine Kanäle und Profilangaben wurden analysiert. Prüfe jetzt den Entwurf und gib ihn für die Suche frei.',
    });
  } catch (error) {
    console.error('Creator AI profile analysis failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json(
      { success: false, error: 'Die automatische Kanal-Analyse konnte gerade nicht abgeschlossen werden. Bitte versuche es in einem Moment erneut.' },
      { status: 502 },
    );
  }
}

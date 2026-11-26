import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import { consumeCreatorAiRateLimit, isTrustedCreatorRequest } from '@/app/lib/creator-request-guard';
import {
  AiConsentRequiredError,
  loadCreatorAiProfile,
  recordCreatorAiConsent,
  runCreatorAiAnalysis,
} from '@/app/lib/creator-social-analyzer';

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

  let body: Record<string, unknown> = {};
  try {
    const raw = await request.text();
    if (raw.trim()) body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Eingabe.' }, { status: 400 });
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
    const explicitConsent = body.consent === true;
    const existing = await loadCreatorAiProfile(sql, creatorId);

    if (!explicitConsent && (!existing?.consentAt || existing.status === 'withdrawn')) {
      return NextResponse.json(
        {
          success: false,
          code: 'consent_required',
          error: 'Bitte stimme zuerst der KI-Profilanalyse zu, bevor wir deine öffentlichen Kanäle auswerten.',
        },
        { status: 403 },
      );
    }

    if (explicitConsent) {
      await recordCreatorAiConsent(sql, creatorId);
    }

    const isTestDb = Boolean(process.env.DATABASE_URL?.includes('.invalid'));
    const aiProfile = await runCreatorAiAnalysis(sql, creatorId, {
      allowGeonode: false,
      skipNetwork: isTestDb,
      requireConsent: true,
    });
    return NextResponse.json({
      success: true,
      aiProfile,
      message: 'So würden wir dich beschreiben. Stimmt das? Prüfe den Text und gib ihn unten frei.',
    });
  } catch (error) {
    if (error instanceof AiConsentRequiredError) {
      return NextResponse.json(
        { success: false, code: 'consent_required', error: error.message },
        { status: 403 },
      );
    }
    console.error('Creator AI profile analysis failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json(
      {
        success: false,
        error: 'Wir kommen gerade nicht an deine Videos. Ist dein Profil öffentlich? Versuch es später noch mal oder schreib deinen Text selbst.',
      },
      { status: 502 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import { loadCreatorAiProfile } from '@/app/lib/creator-social-analyzer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Datenbank nicht verfügbar.' }, { status: 503 });
  }

  const creatorId = verifySession(request.cookies.get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) {
    return NextResponse.json({ success: false, error: 'Bitte melde dich erneut an.' }, { status: 401 });
  }

  try {
    const sql = getDatabase();
    const aiProfile = await loadCreatorAiProfile(sql, creatorId);
    return NextResponse.json({
      success: true,
      aiProfile,
    });
  } catch (error) {
    console.error('Failed to load creator AI profile', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'KI-Profil konnte nicht geladen werden.' }, { status: 500 });
  }
}

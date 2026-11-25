import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import { listCreatorCampaigns } from '@/app/lib/brand-workspace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const creatorId = verifySession(request.cookies.get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ success: false, error: 'Datenbank nicht verfügbar.' }, { status: 503 });

  const data = await listCreatorCampaigns(getDatabase(), creatorId);
  return NextResponse.json({ success: true, ...data }, { headers: { 'Cache-Control': 'private, no-store' } });
}

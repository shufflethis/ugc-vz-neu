import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { syncActiveCampaignSubmissionViews } from '@/app/lib/social-view-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorizedCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(auth);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function handleSyncCron(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
  }

  const limitParam = Number(request.nextUrl.searchParams.get('limit') || 30);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(Math.round(limitParam), 1), 100) : 30;
  const campaignId = request.nextUrl.searchParams.get('campaignId')?.trim() || undefined;

  try {
    const summary = await syncActiveCampaignSubmissionViews(getDatabase(), {
      limit,
      campaignId,
    });
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    console.error('Cron sync-views failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'View sync failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleSyncCron(request);
}

export async function POST(request: NextRequest) {
  return handleSyncCron(request);
}

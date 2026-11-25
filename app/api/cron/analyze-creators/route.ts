import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { runCreatorAiAnalysis } from '@/app/lib/creator-social-analyzer';

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

async function handleCron(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured() || !process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ success: false, error: 'Database or OPENROUTER_API_KEY not configured' }, { status: 503 });
  }

  const limitParam = Number(request.nextUrl.searchParams.get('limit') || 3);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(Math.round(limitParam), 1), 8) : 3;

  try {
    const sql = getDatabase();
    const candidates = await sql.query(
      `SELECT p.id, p.public_id
       FROM creator_profiles p
       LEFT JOIN creator_ai_profiles ai ON ai.creator_id = p.id
       WHERE p.status = 'active'
         AND (
           ai.creator_id IS NULL
           OR ai.status = 'pending'
           OR (
             ai.status = 'failed'
             AND ai.fail_count < 4
             AND (ai.last_attempt_at IS NULL OR ai.last_attempt_at < now() - interval '6 hours')
           )
         )
       ORDER BY (ai.status = 'pending') DESC NULLS LAST, ai.analyzed_at ASC NULLS FIRST
       LIMIT $1`,
      [limit],
    );

    const processed: Array<{ publicId: string; ok: boolean; error?: string }> = [];
    for (const row of candidates) {
      try {
        await runCreatorAiAnalysis(sql, row.id, { allowGeonode: false });
        processed.push({ publicId: String(row.public_id), ok: true });
      } catch (err) {
        processed.push({
          publicId: String(row.public_id),
          ok: false,
          error: err instanceof Error ? err.message.slice(0, 120) : 'failed',
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: processed.length,
      processed,
    });
  } catch (error) {
    console.error('Cron analyze-creators failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'Cron job failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

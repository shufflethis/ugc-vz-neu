import { timingSafeEqual } from 'node:crypto';
import { eventsEnabled } from '@/app/lib/mcp-events';
import { runEventWorker } from '@/app/lib/mcp-event-worker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : '';
  const supplied = request.headers.get('authorization') || '';
  if (!expected || Buffer.byteLength(expected) !== Buffer.byteLength(supplied) || !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!eventsEnabled()) return Response.json({ error: 'MCP Events are not configured' }, { status: 503 });
  try { return Response.json(await runEventWorker()); }
  catch { console.error('[mcp:events] Worker failed'); return Response.json({ error: 'Event processing failed' }, { status: 500 }); }
}

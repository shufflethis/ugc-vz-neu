import { NextRequest, NextResponse } from 'next/server';
import { recordSearchInteraction } from '@/app/lib/search-log';
import { isTrustedSameOrigin } from '@/app/lib/brand-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Leichtgewichtiger, PII-freier Endpunkt zum Loggen von Klicks & Anfragen
 * auf eine vorherige Suche (Spec 8.6: Query, Kategorie, Trefferzahl, Klicks, Anfragen).
 */
export async function POST(request: NextRequest) {
  if (!isTrustedSameOrigin(request)) {
    return NextResponse.json({ success: false }, { status: 401 });
  }
  try {
    const body = (await request.json()) as {
      searchLogId?: unknown;
      type?: unknown;
      creatorId?: unknown;
    };
    const searchLogId = Number(body.searchLogId);
    const type = body.type === 'outreach' ? 'outreach' : body.type === 'click' ? 'click' : null;
    if (!type || !Number.isInteger(searchLogId) || searchLogId <= 0) {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    const recorded = await recordSearchInteraction({
      searchLogId,
      type,
      creatorPublicId: typeof body.creatorId === 'string' ? body.creatorId : undefined,
    });
    return NextResponse.json({ success: true, recorded });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

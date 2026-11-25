import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import { isTrustedCreatorRequest } from '@/app/lib/creator-request-guard';
import { recordProfileEdits } from '@/app/lib/creator-profile';
import { loadCreatorAiProfile } from '@/app/lib/creator-social-analyzer';
import { sanitizePublicSearchSnippet, upsertCreatorSearchIndex } from '@/app/lib/search-index';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_BODY_BYTES = 16_384;

export async function POST(request: NextRequest) {
  if (!isTrustedCreatorRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Freigabe ist gerade nicht verfügbar.' }, { status: 503 });
  }

  const creatorId = verifySession(request.cookies.get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) {
    return NextResponse.json({ success: false, error: 'Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
      return NextResponse.json({ success: false, error: 'Eingabe ist zu groß.' }, { status: 413 });
    }
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Eingabe.' }, { status: 400 });
  }

  const summary = sanitizePublicSearchSnippet(typeof body.summary === 'string' ? body.summary : '', 1_500);
  const rawNiches = Array.isArray(body.niches)
    ? body.niches
    : typeof body.niches === 'string'
      ? body.niches.split(',')
      : [];
  const niches = [...new Set(rawNiches.map((n) => sanitizePublicSearchSnippet(String(n), 60)).filter(Boolean))].slice(0, 15);

  if (summary.length < 20) {
    return NextResponse.json(
      { success: false, error: 'Bitte gib eine aussagekräftige Zusammenfassung (mindestens 20 Zeichen) an.' },
      { status: 400 },
    );
  }

  try {
    const sql = getDatabase();
    const before = await loadCreatorAiProfile(sql, creatorId);

    await sql.query(
      `INSERT INTO creator_ai_profiles (
         creator_id, status, draft_summary, approved_summary,
         inferred_niches, approved_niches, approved_at, updated_at
       ) VALUES (
         $1, 'approved', $2, $2,
         $3::text[], $3::text[], now(), now()
       )
       ON CONFLICT (creator_id) DO UPDATE SET
         status = 'approved',
         draft_summary = EXCLUDED.draft_summary,
         approved_summary = EXCLUDED.approved_summary,
         inferred_niches = EXCLUDED.inferred_niches,
         approved_niches = EXCLUDED.approved_niches,
         approved_at = now(),
         updated_at = now()`,
      [creatorId, summary, niches],
    );

    await recordProfileEdits(sql, creatorId, [
      {
        field_name: 'ai_profile_summary',
        old_value: before?.approvedSummary || null,
        new_value: summary,
      },
      {
        field_name: 'ai_profile_niches',
        old_value: before?.approvedNiches?.length ? before.approvedNiches.join(', ') : null,
        new_value: niches.join(', ') || null,
      },
    ]).catch(() => {});

    // Synchronously refresh creator_search_index (document_text + German tsvector + embedding)
    // so the creator is immediately discoverable via their newly approved AI summary!
    const indexResult = await upsertCreatorSearchIndex(sql, creatorId).catch(() => ({
      updated: false,
      embedded: false,
    }));

    const aiProfile = await loadCreatorAiProfile(sql, creatorId);
    return NextResponse.json({
      success: true,
      aiProfile,
      searchIndexed: indexResult.updated,
      message: 'Deine Profilzusammenfassung ist jetzt freigegeben und verbessert ab sofort deine Auffindbarkeit für Brands.',
    });
  } catch (error) {
    console.error('Creator AI profile approval failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'Freigabe konnte nicht gespeichert werden.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import { isTrustedCreatorRequest } from '@/app/lib/creator-request-guard';
import { recordProfileEdits } from '@/app/lib/creator-profile';
import { upsertCreatorSearchIndex } from '@/app/lib/search-index';
import {
  classifyCreatorProfileCategories,
  getCategoryLabel,
  validateCreatorCategories,
} from '@/app/lib/creator-taxonomy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Nicht verfügbar.' }, { status: 503 });
  }
  const creatorId = verifySession(request.cookies.get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  }

  try {
    const sql = getDatabase();
    let row: any;
    try {
      [row] = await sql.query(
        `SELECT primary_category, secondary_categories, suggested_categories, categories_confirmed_at,
                topics, industries, special_traits, pet_context, children_context
         FROM creator_profiles WHERE id = $1 LIMIT 1`,
        [creatorId],
      );
    } catch {
      [row] = await sql.query(
        `SELECT topics, industries, special_traits, pet_context, children_context
         FROM creator_profiles WHERE id = $1 LIMIT 1`,
        [creatorId],
      );
    }
    if (!row) {
      return NextResponse.json({ success: false, error: 'Profil nicht gefunden.' }, { status: 404 });
    }

    const classified = classifyCreatorProfileCategories({
      primaryCategory: row.primary_category || null,
      secondaryCategories: Array.isArray(row.secondary_categories) ? row.secondary_categories : [],
      topics: row.topics,
      industries: row.industries,
      specialTraits: row.special_traits,
      petContext: row.pet_context,
      childrenContext: row.children_context,
    });

    return NextResponse.json({
      success: true,
      primaryCategory: row.primary_category || null,
      secondaryCategories: Array.isArray(row.secondary_categories) ? row.secondary_categories : [],
      suggestedCategories:
        Array.isArray(row.suggested_categories) && row.suggested_categories.length > 0
          ? row.suggested_categories
          : classified.categories,
      confirmedAt: row.categories_confirmed_at ? new Date(row.categories_confirmed_at).toISOString() : null,
    });
  } catch (error) {
    console.error('Load creator categories failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'Kategorien konnten nicht geladen werden.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isTrustedCreatorRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Nicht verfügbar.' }, { status: 503 });
  }
  const creatorId = verifySession(request.cookies.get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Eingabe.' }, { status: 400 });
  }

  const check = validateCreatorCategories({
    primaryCategory: body.primaryCategory,
    secondaryCategories: body.secondaryCategories,
  });
  if (!check.ok) {
    return NextResponse.json({ success: false, error: check.error }, { status: 400 });
  }

  try {
    const sql = getDatabase();
    await sql.query(
      `UPDATE creator_profiles
       SET primary_category = $2,
           secondary_categories = $3::text[],
           categories_confirmed_at = now(),
           updated_at = now()
       WHERE id = $1`,
      [creatorId, check.primaryCategory, check.secondaryCategories],
    );

    const labels = [check.primaryCategory, ...check.secondaryCategories].map(getCategoryLabel);
    await recordProfileEdits(sql, creatorId, [
      {
        field_name: 'categories',
        old_value: null,
        new_value: labels.join(', '),
      },
    ]).catch(() => {});

    await upsertCreatorSearchIndex(sql, creatorId).catch(() => {});

    return NextResponse.json({
      success: true,
      primaryCategory: check.primaryCategory,
      secondaryCategories: check.secondaryCategories,
      labels,
      message: `Fertig. Marken finden dich jetzt unter: ${labels.join(', ')}.`,
    });
  } catch (error) {
    console.error('Save creator categories failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'Kategorien konnten nicht gespeichert werden.' }, { status: 500 });
  }
}

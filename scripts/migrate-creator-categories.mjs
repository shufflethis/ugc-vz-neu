#!/usr/bin/env node
/**
 * Einmalige Migration bestehender Freitext-Themen auf die 20er-Kategorien-Taxonomie (Spec 8.6).
 * Speichert Vorschlaege (max. 3 Kategorien, 1 Hauptkategorie) in `suggested_categories`
 * zur Bestaetigung beim naechsten Creator-Login.
 *
 * Aufruf:
 *   node --import tsx scripts/migrate-creator-categories.mjs          # Dry-Run (Default)
 *   node --import tsx scripts/migrate-creator-categories.mjs --apply  # Schreibt in DB
 */
import 'dotenv/config';
import { getDatabase, isDatabaseConfigured } from '../app/lib/database';
import { classifyCreatorProfileCategories } from '../app/lib/creator-taxonomy';

const apply = process.argv.includes('--apply');

if (!isDatabaseConfigured()) {
  console.error('DATABASE_URL nicht konfiguriert.');
  process.exit(1);
}

const sql = getDatabase();
const rows = await sql.query(`
  SELECT
    p.id, p.public_id, p.display_name, p.topics, p.industries, p.special_traits,
    p.pet_context, p.children_context, p.primary_category, p.categories_confirmed_at,
    ai.approved_summary, ai.approved_niches
  FROM creator_profiles p
  LEFT JOIN creator_ai_profiles ai ON ai.creator_id = p.id AND ai.status = 'approved'
  WHERE p.status = 'active'
  ORDER BY p.created_at ASC
`);

let classifiedCount = 0;
let skippedConfirmed = 0;
let unclassified = 0;
const distribution = new Map();

for (const row of rows) {
  if (row.categories_confirmed_at && row.primary_category) {
    skippedConfirmed += 1;
    continue;
  }

  const result = classifyCreatorProfileCategories({
    topics: row.topics,
    industries: row.industries,
    specialTraits: row.special_traits,
    petContext: row.pet_context,
    childrenContext: row.children_context,
    aiSummary: row.approved_summary,
    aiNiches: Array.isArray(row.approved_niches) ? row.approved_niches : [],
  });

  if (!result.primary) {
    unclassified += 1;
    continue;
  }

  classifiedCount += 1;
  distribution.set(result.primary, (distribution.get(result.primary) || 0) + 1);

  if (apply) {
    await sql.query(
      `UPDATE creator_profiles
       SET suggested_categories = $2::jsonb,
           updated_at = now()
       WHERE id = $1 AND categories_confirmed_at IS NULL`,
      [row.id, JSON.stringify(result.categories)],
    );
  }
}

console.log(
  `Mode: ${apply ? 'APPLY' : 'DRY-RUN'} | Active: ${rows.length} | Classified: ${classifiedCount} | Already confirmed: ${skippedConfirmed} | Unclassified: ${unclassified}`,
);
console.log('Primary category distribution:');
for (const [cat, count] of [...distribution.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat}: ${count}`);
}

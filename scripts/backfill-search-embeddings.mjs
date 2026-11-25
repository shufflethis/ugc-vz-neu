// Backfill- und Wartungs-Skript fuer den Hybrid-Suchindex (German tsvector + Embeddings).
//
// Aufruf:
//   set -a; . .env.local; set +a
//   node --import tsx scripts/backfill-search-embeddings.mjs [--limit=100] [--batch-size=20] [--force] [--public-id=UGC-XXXX]
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCreatorSearchDocument,
  DEFAULT_EMBEDDING_MODEL,
  embedTexts,
  hashSearchDocument,
} from '../app/lib/search-index.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.env.DATABASE_URL) dotenv.config({ path: path.join(repoRoot, '.env.local') });

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;
if (!connectionString) throw new Error('Keine Neon-Datenbankverbindung gefunden.');

const sql = neon(connectionString);

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    return [key, value ?? true];
  }),
);

const LIMIT = Number(args.limit) > 0 ? Number(args.limit) : 200;
const BATCH_SIZE = Number(args['batch-size']) > 0 ? Math.min(Number(args['batch-size']), 50) : 20;
const FORCE = args.force === true || args.force === 'true';
const PUBLIC_ID = typeof args['public-id'] === 'string' ? args['public-id'] : null;
const MODEL = process.env.SEARCH_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL;

async function main() {
  const rows = await sql.query(
    `SELECT
       p.id, p.public_id, p.display_name, p.stage_name, p.city, p.gender,
       p.topics, p.industries, p.special_traits, p.preferred_content,
       p.equipment, p.pet_context, p.children_context, p.skin_type,
       p.experience_since,
       COALESCE((
         SELECT array_agg(DISTINCT a.platform ORDER BY a.platform)
         FROM creator_social_accounts a WHERE a.creator_id = p.id
       ), ARRAY[]::text[]) AS networks,
       COALESCE((
         SELECT array_agg(f.title ORDER BY f.sort_order, f.created_at)
         FROM creator_portfolio_items f
         WHERE f.creator_id = p.id AND NULLIF(TRIM(f.title), '') IS NOT NULL
       ), ARRAY[]::text[]) AS portfolio_titles,
       idx.document_hash AS existing_hash,
       (idx.embedding_values IS NOT NULL) AS has_embedding
     FROM creator_profiles p
     LEFT JOIN creator_search_index idx ON idx.creator_id = p.id
     WHERE p.status = 'active'
       AND ($2::text IS NULL OR p.public_id = $2)
     ORDER BY (idx.creator_id IS NULL) DESC, (idx.embedding_values IS NULL) DESC, p.updated_at DESC
     LIMIT $1`,
    [LIMIT, PUBLIC_ID],
  );

  // Optional Phase 3 approved AI profiles
  const aiByCreatorId = new Map();
  try {
    const aiRows = await sql.query(
      `SELECT creator_id, approved_summary, approved_niches, visual_signals
       FROM creator_ai_profiles
       WHERE status = 'approved'`,
    );
    for (const r of aiRows) aiByCreatorId.set(r.creator_id, r);
  } catch {
    // Migration 021 optional
  }

  const pending = [];
  let unchanged = 0;

  for (const row of rows) {
    const ai = aiByCreatorId.get(row.id);
    const documentText = buildCreatorSearchDocument({
      displayName: row.display_name,
      stageName: row.stage_name,
      city: row.city,
      gender: row.gender,
      topics: row.topics,
      industries: row.industries,
      specialTraits: row.special_traits,
      preferredContent: row.preferred_content,
      equipment: row.equipment,
      petContext: row.pet_context,
      childrenContext: row.children_context,
      skinType: row.skin_type,
      experienceSince: row.experience_since,
      networks: Array.isArray(row.networks) ? row.networks : [],
      portfolioTitles: Array.isArray(row.portfolio_titles) ? row.portfolio_titles : [],
      approvedAiSummary: ai?.approved_summary || null,
      approvedAiNiches: Array.isArray(ai?.approved_niches) ? ai.approved_niches : [],
      approvedVisualSignals: Array.isArray(ai?.visual_signals) ? ai.visual_signals : [],
    });

    if (!documentText) continue;
    const documentHash = hashSearchDocument(documentText);
    const needsWork = FORCE || row.existing_hash !== documentHash || !row.has_embedding;
    if (!needsWork) {
      unchanged += 1;
      continue;
    }
    pending.push({
      id: row.id,
      publicId: row.public_id,
      documentText,
      documentHash,
    });
  }

  console.log(
    `[${new Date().toISOString()}] Suchindex-Backfill: ${rows.length} geprueft, ${pending.length} zu aktualisieren, ${unchanged} unveraendert (Modell: ${MODEL})`,
  );

  let updated = 0;
  let embedded = 0;

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    const vectors = process.env.OPENROUTER_API_KEY
      ? await embedTexts(batch.map((b) => b.documentText), { model: MODEL, timeoutMs: 20_000 })
      : batch.map(() => null);

    for (let j = 0; j < batch.length; j += 1) {
      const item = batch[j];
      const vec = vectors[j];
      if (vec) {
        await sql.query(
          `INSERT INTO creator_search_index (
             creator_id, document_text, document_hash, search_tsv,
             embedding_model, embedding_dim, embedding_values, updated_at
           ) VALUES (
             $1, $2, $3, to_tsvector('german', $2),
             $4, $5, $6::real[], now()
           )
           ON CONFLICT (creator_id) DO UPDATE SET
             document_text = EXCLUDED.document_text,
             document_hash = EXCLUDED.document_hash,
             search_tsv = EXCLUDED.search_tsv,
             embedding_model = EXCLUDED.embedding_model,
             embedding_dim = EXCLUDED.embedding_dim,
             embedding_values = EXCLUDED.embedding_values,
             updated_at = now()`,
          [item.id, item.documentText, item.documentHash, MODEL, vec.length, vec],
        );
        embedded += 1;
      } else {
        await sql.query(
          `INSERT INTO creator_search_index (
             creator_id, document_text, document_hash, search_tsv, updated_at
           ) VALUES (
             $1, $2, $3, to_tsvector('german', $2), now()
           )
           ON CONFLICT (creator_id) DO UPDATE SET
             document_text = EXCLUDED.document_text,
             document_hash = EXCLUDED.document_hash,
             search_tsv = EXCLUDED.search_tsv,
             updated_at = now()`,
          [item.id, item.documentText, item.documentHash],
        );
      }
      updated += 1;
    }

    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${updated}/${pending.length} gespeichert (${embedded} mit Embedding)`);
  }

  console.log(`[${new Date().toISOString()}] Fertig: ${updated} aktualisiert, ${embedded} mit Embedding, ${unchanged} unveraendert.`);
}

main().catch((error) => {
  console.error('Backfill fehlgeschlagen:', error);
  process.exitCode = 1;
});

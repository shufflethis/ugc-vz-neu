// VPS-Worker / CLI fuer die multimodale KI-Kanalanalyse (Bio, Captions, Thumbnails, Portfolio).
//
// Laeuft als Cron auf dem VPS (analog zu scripts/fetch-social-avatars.mjs) und befuellt
// creator_ai_profiles mit Entwuerfen, die Creator im /konto lesen, per Sprache/Text
// ergaenzen und fuer die Suche freigeben koennen.
//
// Aufruf:
//   set -a; . .env.local; set +a
//   node --import tsx scripts/analyze-creator-socials.mjs [--limit=15] [--force-public-id=UGC-XXXX] [--use-geonode]
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCreatorAiAnalysis } from '../app/lib/creator-social-analyzer.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.env.DATABASE_URL) dotenv.config({ path: path.join(repoRoot, '.env.local') });

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;
if (!connectionString) throw new Error('Keine Neon-Datenbankverbindung gefunden.');
if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY fehlt.');

const sql = neon(connectionString);

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    return [key, value ?? true];
  }),
);

const LIMIT = Number(args.limit) > 0 ? Number(args.limit) : 15;
const FORCE_PUBLIC_ID = typeof args['force-public-id'] === 'string' ? args['force-public-id'] : null;
const USE_GEONODE = args['use-geonode'] === true || args['use-geonode'] === 'true' || Boolean(process.env.GEONODE_SCRAPER_API_KEY);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const candidates = await sql.query(
    `SELECT p.id, p.public_id, p.display_name, ai.status, ai.fail_count
     FROM creator_profiles p
     LEFT JOIN creator_ai_profiles ai ON ai.creator_id = p.id
     WHERE p.status = 'active'
       AND (
         ($2::text IS NOT NULL AND p.public_id = $2)
         OR (
           $2::text IS NULL AND (
             ai.creator_id IS NULL
             OR ai.status = 'pending'
             OR (
               ai.status = 'failed'
               AND ai.fail_count < 5
               AND (ai.last_attempt_at IS NULL OR ai.last_attempt_at < now() - (least(ai.fail_count, 6) + 1) * interval '6 hours')
             )
           )
         )
       )
     ORDER BY (ai.status = 'pending') DESC NULLS LAST, ai.analyzed_at ASC NULLS FIRST, p.updated_at DESC
     LIMIT $1`,
    [LIMIT, FORCE_PUBLIC_ID],
  );

  console.log(
    `[${new Date().toISOString()}] KI-Social-Profiler: ${candidates.length} Kandidaten (limit=${LIMIT}, geonode=${USE_GEONODE})`,
  );

  let ok = 0;
  let failed = 0;

  for (const creator of candidates) {
    try {
      const result = await runCreatorAiAnalysis(sql, creator.id, {
        allowGeonode: USE_GEONODE,
      });
      console.log(
        `  OK  ${creator.public_id} ${creator.display_name} -> ${result.status} (${result.inferredNiches.length} Nischen, ${result.visualSignals.length} Signale)`,
      );
      ok += 1;
    } catch (error) {
      failed += 1;
      console.log(
        `  ERR ${creator.public_id} ${creator.display_name}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (candidates.length > 1) {
      await sleep(3_000 + Math.floor(Math.random() * 2_000));
    }
  }

  console.log(`[${new Date().toISOString()}] Fertig: ${ok} analysiert, ${failed} fehlgeschlagen.`);
}

main().catch((error) => {
  console.error('Worker fehlgeschlagen:', error);
  process.exitCode = 1;
});

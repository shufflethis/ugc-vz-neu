// Vergleicht die lokale DB-Sicht mit dem, was die Live-Suche tatsaechlich sieht.
//
// Hintergrund: db:audit meldete 495 aktive Profile, die Live-API aber nur 403
// (totalCount bei geschlechtsneutraler Query = volle Poolgroesse). Entweder
// zeigt die Produktion auf eine andere Neon-Branch, oder einzelne aktive Profile
// sind live unsichtbar. Dieses Skript entscheidet das:
//   - Host der lokal konfigurierten DB (ohne Zugangsdaten)
//   - Poolgroesse laut Live-Suche
//   - Stichprobe der neuesten aktiven Profile gegen /api/v1/creators/{publicId}
//
// Aufruf: set -a; . .env.local; set +a; node scripts/check-live-visibility.mjs
import { neon } from '@neondatabase/serverless';

const BASE = process.env.LIVE_BASE_URL || 'https://ugc-vz.de';
const SAMPLE = Number(process.env.SAMPLE_SIZE || 8);

const connectionString = process.env.DATABASE_URL_UNPOOLED
  || process.env.POSTGRES_URL_NON_POOLING
  || process.env.DATABASE_URL;
if (!connectionString) throw new Error('Keine Datenbankverbindung gefunden.');

// Nur Host + Datenbankname, nie Benutzer oder Passwort.
const dbUrl = new URL(connectionString);
console.log(`Lokale DB : ${dbUrl.host}${dbUrl.pathname}`);

const sql = neon(connectionString);
const [{ active }] = await sql.query(
  `SELECT count(*)::int AS active FROM creator_search_public`,
);

const searchResponse = await fetch(`${BASE}/api/v1/creators/search`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'Produktvideo' }),
});
const search = await searchResponse.json();

console.log(`Aktiv in DB: ${active}`);
console.log(`Live-Suche : ${search.totalCount}`);
console.log(`Differenz  : ${active - Number(search.totalCount || 0)}`);

// Neueste zuerst: wenn die Produktion auf einem aelteren Stand haengt, fallen
// zuerst die juengsten Profile durch.
const newest = await sql.query(
  `SELECT public_id, display_name, created_at,
          CASE WHEN EXISTS (SELECT 1 FROM creator_source_records s WHERE s.creator_id = p.id)
               THEN 'import' ELSE 'selbstanmeldung' END AS herkunft
     FROM creator_profiles p
    WHERE status = 'active'
    ORDER BY created_at DESC
    LIMIT $1`,
  [SAMPLE],
);

console.log(`\nStichprobe der ${newest.length} neuesten aktiven Profile gegen ${BASE}:`);
let missing = 0;
for (const row of newest) {
  const response = await fetch(`${BASE}/api/v1/creators/${row.public_id}`, {
    headers: { Accept: 'application/json' },
  });
  const live = response.ok;
  if (!live) missing += 1;
  const date = new Date(row.created_at).toISOString().slice(0, 10);
  console.log(`  ${live ? 'live    ' : 'FEHLT   '} ${row.public_id}  ${date}  ${row.herkunft}  ${row.display_name}`);
}

console.log(
  missing === newest.length
    ? '\n=> Alle Stichproben fehlen: Produktion haengt sehr wahrscheinlich an einer anderen Neon-Branch.'
    : missing > 0
      ? `\n=> ${missing} von ${newest.length} fehlen: einzelne aktive Profile sind live unsichtbar.`
      : '\n=> Stichprobe vollstaendig live: die Differenz liegt weiter hinten im Bestand, nicht bei den neuesten.',
);

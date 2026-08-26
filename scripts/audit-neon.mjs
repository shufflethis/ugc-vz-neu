// Konsistenz-Check der Neon-Creator-Datenbank.
//
// Reihenfolge ist Absicht: erst die Zahlen ausgeben, dann pruefen. Frueher warf
// das Skript beim ersten verletzten Invariant, bevor irgendeine Zahl sichtbar
// war -- genau dann, wenn man sie am dringendsten braucht.
//
// Aufruf: set -a; . .env.local; set +a; npm run db:audit
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL_UNPOOLED
  || process.env.POSTGRES_URL_NON_POOLING
  || process.env.DATABASE_URL;
if (!connectionString) throw new Error('Keine Datenbankverbindung gefunden.');

const sql = neon(connectionString);
const [counts] = await sql.query(`
  SELECT
    (SELECT count(*)::int FROM schema_migrations) AS migrations,
    (SELECT count(*)::int FROM creator_profiles) AS creators,
    (SELECT count(*)::int FROM creator_profiles WHERE status = 'active') AS active,
    (SELECT count(*)::int FROM creator_profiles WHERE status = 'quarantined') AS quarantined,
    (SELECT count(*)::int FROM creator_profiles
      WHERE status NOT IN ('active', 'quarantined')) AS other_status,
    (SELECT count(*)::int FROM creator_private_contacts) AS private_contacts,
    (SELECT count(*)::int FROM creator_private_contacts WHERE newsletter_enabled) AS newsletter_opt_ins,
    (SELECT count(*)::int FROM creator_source_records) AS source_records,
    -- Profile aus einem Sheet-Import (haben eine Quellzeile) ...
    (SELECT count(DISTINCT creator_id)::int FROM creator_source_records
      WHERE creator_id IS NOT NULL) AS imported,
    -- ... gegenueber Selbstanmeldungen ueber /creator/anmelden (source_priority 30,
    -- kein Import, dafuer ein Consent-Event aus der Magic-Link-Bestaetigung).
    (SELECT count(*)::int FROM creator_profiles p
      WHERE NOT EXISTS (
        SELECT 1 FROM creator_source_records s WHERE s.creator_id = p.id
      )) AS self_registered,
    (SELECT count(*)::int FROM creator_profiles p
      WHERE NOT EXISTS (
        SELECT 1 FROM creator_source_records s WHERE s.creator_id = p.id
      ) AND NOT EXISTS (
        SELECT 1 FROM consent_events c WHERE c.creator_id = p.id
      )) AS unsourced_without_consent,
    (SELECT count(*)::int FROM creator_search_public) AS public_profiles,
    (SELECT count(*)::int FROM creator_import_review WHERE status = 'open') AS open_reviews,
    (SELECT count(*)::int FROM (
      SELECT lower(email) FROM creator_private_contacts
      WHERE email IS NOT NULL GROUP BY lower(email) HAVING count(*) > 1
    ) duplicates) AS duplicate_emails
`);

const viewColumns = await sql.query(`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'creator_search_public'
  ORDER BY ordinal_position
`);
const columnNames = viewColumns.map((row) => String(row.column_name));
const forbidden = ['email', 'phone', 'contact', 'consent', 'token', 'address', 'birth_date'];
const leakedColumns = columnNames.filter((column) => forbidden.some((word) => column.includes(word)));

console.log(JSON.stringify(
  { ...counts, public_view_columns: columnNames.length, leaked_columns: leakedColumns },
  null,
  2,
));

// Erst ab hier wird geurteilt. Alle Verstoesse sammeln statt beim ersten abbrechen --
// sonst verdeckt ein bekannter Verstoss die uebrigen.
const problems = [];
// Kein Profil darf ohne Herkunft existieren: entweder Import-Quellzeile oder
// bestaetigte Selbstanmeldung. Der alte Check (source_records >= creators) ist
// seit dem Creator-Self-Service falsch, weil Selbstanmeldungen keine Quellzeile
// erzeugen.
if (counts.unsourced_without_consent > 0) {
  problems.push(`${counts.unsourced_without_consent} Profile ohne Import-Quellzeile und ohne Consent-Event.`);
}
if (counts.creators < 1) problems.push('Keine Creator-Profile gefunden.');
if (counts.active !== counts.public_profiles) {
  problems.push(`Public View (${counts.public_profiles}) und aktive Profile (${counts.active}) weichen voneinander ab.`);
}
if (counts.duplicate_emails !== 0) problems.push(`${counts.duplicate_emails} doppelte private E-Mail-Adressen.`);
if (leakedColumns.length) problems.push(`Private Spalten in Public View: ${leakedColumns.join(', ')}`);

if (problems.length) {
  console.error(`\n${problems.length} Problem(e):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log('\nOK: alle Invarianten erfuellt.');

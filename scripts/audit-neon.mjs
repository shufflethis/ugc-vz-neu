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
    (SELECT count(*)::int FROM creator_private_contacts) AS private_contacts,
    (SELECT count(*)::int FROM creator_private_contacts WHERE newsletter_enabled) AS newsletter_opt_ins,
    (SELECT count(*)::int FROM creator_source_records) AS source_records,
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

if (counts.source_records < counts.creators) throw new Error('Mehr Profile als importierte Quellzeilen gefunden.');
if (counts.creators < 1) throw new Error('Keine Creator-Profile gefunden.');
if (counts.active !== counts.public_profiles) throw new Error('Public View und aktive Profile weichen voneinander ab.');
if (counts.duplicate_emails !== 0) throw new Error('Doppelte private E-Mail-Adressen gefunden.');
if (leakedColumns.length) throw new Error(`Private Spalten in Public View: ${leakedColumns.join(', ')}`);

console.log(JSON.stringify({ ...counts, public_view_columns: columnNames.length, leaked_columns: leakedColumns }));

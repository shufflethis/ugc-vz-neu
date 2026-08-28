// Warum bekommt ein Creator keinen Anmeldelink?
//
// Die Login-Route (app/api/creator/login/route.ts) antwortet bewusst generisch
// und sendet still keine Mail, wenn email_verified_at NULL ist, der Status nicht
// 'active' ist oder die Adresse nicht exakt matcht. Dieses Skript zeigt, welcher
// der drei Faelle vorliegt -- und wie viele Profile sonst noch betroffen sind.
//
// Aufruf: set -a; . .env.local; set +a; node scripts/check-creator-login.mjs <email>
import { neon } from '@neondatabase/serverless';

const email = (process.argv[2] || '').trim().toLowerCase();
if (!email) throw new Error('Aufruf: node scripts/check-creator-login.mjs <email>');

const connectionString = process.env.DATABASE_URL_UNPOOLED
  || process.env.POSTGRES_URL_NON_POOLING
  || process.env.DATABASE_URL;
if (!connectionString) throw new Error('Keine Datenbankverbindung gefunden.');

const sql = neon(connectionString);
const domain = email.split('@')[1] || '';

// Bewusst ohne die Filter der Login-Route: gesucht wird auch, was sie ausschliesst.
// Der Domain-Match faengt den Fall ab, dass sich der Creator mit einer anderen
// Adresse derselben Domain beworben hat.
const rows = await sql.query(
  `
  SELECT c.email, c.email_verified_at, p.status, p.display_name, p.public_id, p.updated_at
  FROM creator_private_contacts c
  JOIN creator_profiles p ON p.id = c.creator_id
  WHERE lower(c.email) = $1 OR lower(c.email) LIKE $2
  ORDER BY (lower(c.email) = $1) DESC, p.updated_at DESC
  `,
  [email, `%@${domain}`],
);

if (!rows.length) {
  console.log(`Kein Kontakt zu ${email} (auch nicht auf @${domain}). Bewerbung nie angekommen oder andere Adresse.`);
} else {
  for (const row of rows) {
    const blocker = [
      row.email_verified_at ? null : 'email_verified_at IS NULL',
      row.status === 'active' ? null : `status = '${row.status}'`,
      row.email.toLowerCase() === email ? null : `andere Adresse (${row.email})`,
    ].filter(Boolean);
    console.log(`${row.public_id}  ${row.display_name}  <${row.email}>`);
    console.log(`  verifiziert: ${row.email_verified_at || '-'}  status: ${row.status}`);
    console.log(`  Login: ${blocker.length ? `BLOCKIERT -- ${blocker.join(', ')}` : 'moeglich'}`);
  }
}

// Blast-Radius: aktive Profile, die sich prinzipiell nicht einloggen koennen.
const [scope] = await sql.query(`
  SELECT
    count(*)::int AS aktiv_gesamt,
    count(*) FILTER (WHERE c.email_verified_at IS NULL)::int AS aktiv_ohne_verify
  FROM creator_private_contacts c
  JOIN creator_profiles p ON p.id = c.creator_id
  WHERE p.status = 'active'
`);
console.log(`\nAktive Profile mit Kontakt: ${scope.aktiv_gesamt}, davon login-unfaehig: ${scope.aktiv_ohne_verify}`);

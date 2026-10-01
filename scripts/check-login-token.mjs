// Belegt, ob fuer eine Adresse gerade ein Anmeldelink erzeugt wurde.
// Die Login-Route antwortet immer generisch (Anti-Enumeration) -- ein frisches,
// unbenutztes Token ist der einzige Nachweis, dass die Mail wirklich rausging.
//
// Aufruf: set -a; . .env.local; set +a; node scripts/check-login-token.mjs <email>
import { neon } from '@neondatabase/serverless';

const email = (process.argv[2] || '').trim().toLowerCase();
if (!email) throw new Error('Aufruf: node scripts/check-login-token.mjs <email>');

const sql = neon(process.env.DATABASE_URL);
const rows = await sql.query(
  `SELECT t.created_at, t.expires_at, t.used_at, c.email_verified_at
   FROM creator_verification_tokens t
   JOIN creator_private_contacts c ON c.creator_id = t.creator_id
   WHERE lower(c.email) = $1 AND t.purpose = 'edit_profile'
   ORDER BY t.created_at DESC LIMIT 3`,
  [email],
);

if (!rows.length) console.log('Kein Anmeldelink-Token vorhanden.');
for (const r of rows) {
  const alter = Math.round((Date.now() - new Date(r.created_at).getTime()) / 1000);
  console.log(`erstellt vor ${alter}s | laeuft ab ${r.expires_at} | eingeloest: ${r.used_at || 'noch nicht'}`);
}
if (rows.length) console.log(`email_verified_at: ${rows[0].email_verified_at || '- (wird beim Klick gesetzt)'}`);

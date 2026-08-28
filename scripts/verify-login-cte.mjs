// Prueft das CTE aus app/api/creator/login/verify/route.ts gegen echtes Postgres.
//
// Das CTE hat die frueher eigenstaendige "SET used_at = now()"-Anweisung ersetzt.
// Single-Use ist eine Sicherheitsgarantie (Replay-Schutz), deshalb wird sie hier
// mit einem echten, passenden Token geprueft -- nicht nur per Augenschein.
//
// Der Test laeuft bewusst gegen einen bereits verifizierten Creator: so wird der
// Schreibpfad ausgefuehrt, ohne fuer irgendjemanden einen Einwilligungsnachweis
// zu erfinden. Das Wegwerf-Token wird am Ende geloescht.
//
// Aufruf: set -a; . .env.local; set +a; node scripts/verify-login-cte.mjs
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const CTE = `WITH consumed AS (
     UPDATE creator_verification_tokens
     SET used_at = now()
     WHERE id = $1 AND used_at IS NULL
     RETURNING creator_id
   )
   UPDATE creator_private_contacts c
   SET email_verified_at = coalesce(c.email_verified_at, now()), updated_at = now()
   FROM consumed
   WHERE c.creator_id = consumed.creator_id`;

const countVerified = async () => (await sql.query(
  `SELECT count(*)::int AS n FROM creator_private_contacts WHERE email_verified_at IS NOT NULL`,
))[0].n;

// 1) Kein passendes Token -> nichts darf geschrieben werden.
const before = await countVerified();
await sql.query(CTE, ['00000000-0000-0000-0000-000000000000']);
const after = await countVerified();
console.log(`ohne Treffer: verifiziert ${before} -> ${after}`);
if (before !== after) throw new Error('Geschrieben, obwohl kein Token matchte!');

// 2) Passendes Token -> Token verbraucht, vorhandener Zeitstempel unveraendert.
const [target] = await sql.query(
  `SELECT creator_id, email_verified_at FROM creator_private_contacts
   WHERE email_verified_at IS NOT NULL LIMIT 1`,
);
if (!target) throw new Error('Kein verifizierter Creator fuer den Test gefunden.');

const [token] = await sql.query(
  `INSERT INTO creator_verification_tokens (creator_id, token_hash, purpose, expires_at)
   VALUES ($1, $2, 'edit_profile', now() + interval '5 minutes')
   RETURNING id`,
  [target.creator_id, `cte-selftest-${Date.now()}`],
);

try {
  await sql.query(CTE, [token.id]);

  const [used] = await sql.query(
    `SELECT used_at FROM creator_verification_tokens WHERE id = $1`,
    [token.id],
  );
  if (!used.used_at) throw new Error('Token wurde NICHT verbraucht -- Replay-Schutz kaputt!');

  const [now] = await sql.query(
    `SELECT email_verified_at FROM creator_private_contacts WHERE creator_id = $1`,
    [target.creator_id],
  );
  if (String(now.email_verified_at) !== String(target.email_verified_at)) {
    throw new Error('coalesce hat den urspruenglichen Zeitstempel ueberschrieben!');
  }

  console.log('mit Treffer: Token verbraucht, vorhandener Zeitstempel unveraendert');
  console.log('OK');
} finally {
  await sql.query(`DELETE FROM creator_verification_tokens WHERE id = $1`, [token.id]);
}

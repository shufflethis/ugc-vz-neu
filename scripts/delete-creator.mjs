// DSGVO-Loeschung eines Creator-Profils (Art. 17) anhand der Kontakt-E-Mail.
//
// Ohne --apply nur Dry-Run: zeigt Profil und betroffene Zeilen.
// Mit --apply: harter DELETE. Kaskade (Migration 001/007/006) raeumt Kontakte,
// Socials, Portfolio, Consent, Tokens, Avatar, Profil-Edits mit. Zusaetzlich
// werden geloescht, weil sie personenbezogene Daten ausserhalb der Kaskade halten:
//   - creator_registration_submissions (E-Mail + Payload der Selbstanmeldung)
//   - lead_creator_matches.creator_snapshot (Profil-Kopie an Brands) -> anonymisiert
// creator_source_records bleibt absichtlich stehen (nur Fingerprint/Zeilennummer,
// keine PII) und blockiert so den Re-Import derselben Sheet-Zeile.
//
// Aufruf: npm run db:delete-creator -- <email> [--apply]
// Danach live pruefen: /api/v1/creators/<public_id> und /api/avatar/<public_id> muessen 404 liefern.
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: '.env.local' });

const email = process.argv[2];
const apply = process.argv.includes('--apply');
if (!email || !email.includes('@')) {
  console.error('Aufruf: node scripts/delete-creator.mjs <email> [--apply]');
  process.exit(2);
}

const connectionString = process.env.DATABASE_URL_UNPOOLED
  || process.env.POSTGRES_URL_NON_POOLING
  || process.env.DATABASE_URL;
if (!connectionString) throw new Error('Keine Datenbankverbindung gefunden.');
const sql = neon(connectionString);

const profiles = await sql.query(
  `SELECT p.id, p.public_id, p.import_key, p.display_name, p.status, p.created_at,
          c.email, c.newsletter_enabled
     FROM creator_private_contacts c
     JOIN creator_profiles p ON p.id = c.creator_id
    WHERE lower(c.email) = lower($1)`,
  [email],
);

if (profiles.length === 0) {
  console.log(`Kein Profil mit E-Mail ${email} gefunden.`);
  const subs = await sql.query(
    `SELECT id, created_at, verified_at FROM creator_registration_submissions WHERE lower(email) = lower($1)`,
    [email],
  );
  console.log(`Registrierungs-Submissions: ${subs.length}`);
  if (apply && subs.length) {
    const r = await sql.query(
      `DELETE FROM creator_registration_submissions WHERE lower(email) = lower($1)`, [email]);
    console.log(`Submissions geloescht: ${r.length ?? 'ok'}`);
  }
  process.exit(0);
}

for (const p of profiles) {
  console.log('Profil:', p);
  const [rel] = await sql.query(
    `SELECT
       (SELECT count(*)::int FROM creator_social_accounts WHERE creator_id = $1) AS socials,
       (SELECT count(*)::int FROM creator_portfolio_items WHERE creator_id = $1) AS portfolio,
       (SELECT count(*)::int FROM consent_events WHERE creator_id = $1) AS consents,
       (SELECT count(*)::int FROM creator_verification_tokens WHERE creator_id = $1) AS tokens,
       (SELECT count(*)::int FROM creator_social_avatars WHERE creator_id = $1) AS avatars,
       (SELECT count(*)::int FROM creator_profile_edits WHERE creator_id = $1) AS edits,
       (SELECT count(*)::int FROM creator_source_records WHERE creator_id = $1) AS source_records,
       (SELECT count(*)::int FROM lead_creator_matches WHERE creator_id = $1) AS lead_matches,
       (SELECT count(*)::int FROM email_events WHERE creator_id = $1) AS email_events,
       (SELECT count(*)::int FROM creator_registration_submissions WHERE lower(email) = lower($2)) AS submissions`,
    [p.id, email],
  );
  console.log('Verknuepft:', rel);
  // email_events bleibt per SET NULL stehen; metadata koennte Adresse/Name tragen.
  const events = await sql.query(
    `SELECT id, event_type, audience, metadata FROM email_events WHERE creator_id = $1`, [p.id]);
  console.log('E-Mail-Events:', events);

  if (!apply) continue;

  await sql.transaction([
    sql.query(
      `UPDATE lead_creator_matches
          SET creator_snapshot = jsonb_build_object('deleted', true, 'public_id', creator_public_id)
        WHERE creator_id = $1`,
      [p.id],
    ),
    sql.query(
      `UPDATE email_events SET metadata = '{}'::jsonb WHERE creator_id = $1`, [p.id]),
    sql.query(
      `DELETE FROM creator_registration_submissions WHERE lower(email) = lower($1)`, [email]),
    sql.query(`DELETE FROM creator_profiles WHERE id = $1`, [p.id]),
  ]);

  const [check] = await sql.query(
    `SELECT
       (SELECT count(*)::int FROM creator_profiles WHERE id = $1) AS profile,
       (SELECT count(*)::int FROM creator_private_contacts WHERE creator_id = $1) AS contacts,
       (SELECT count(*)::int FROM creator_social_avatars WHERE creator_id = $1) AS avatars,
       (SELECT count(*)::int FROM creator_source_records WHERE creator_id = $1) AS source_records_linked`,
    [p.id],
  );
  console.log('Nach Loeschung:', check);
}
console.log(apply ? 'FERTIG (geloescht).' : 'Dry-Run. Mit --apply loeschen.');

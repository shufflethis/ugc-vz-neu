import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
await db.exec(`
  CREATE TABLE schema_migrations(version text PRIMARY KEY);
  CREATE TABLE creator_profiles(id uuid PRIMARY KEY, public_id text, status text, display_name text, city text, topics text);
  CREATE TABLE creator_private_contacts(creator_id uuid REFERENCES creator_profiles(id), email text, email_verified_at timestamptz);
  CREATE TABLE creator_social_accounts(creator_id uuid REFERENCES creator_profiles(id));
  CREATE TABLE creator_portfolio_items(creator_id uuid REFERENCES creator_profiles(id));
  INSERT INTO creator_profiles VALUES ('00000000-0000-0000-0000-000000000001','UGC-0000000001','active','Baseline','Berlin','Beauty');
  INSERT INTO creator_private_contacts VALUES ('00000000-0000-0000-0000-000000000001','private@example.com',now());
  INSERT INTO creator_social_accounts VALUES ('00000000-0000-0000-0000-000000000001');
  INSERT INTO creator_portfolio_items VALUES ('00000000-0000-0000-0000-000000000001');
`);
const migration = await readFile('db/migrations/008_mcp_events.sql', 'utf8');
await db.exec(migration);
assert.equal((await db.query('SELECT * FROM mcp_creator_event_seen')).rows.length, 1, 'baseline recorded');
assert.equal((await db.query('SELECT * FROM mcp_event_deliveries')).rows.length, 0, 'baseline not delivered');
await db.exec(`INSERT INTO mcp_event_subscriptions(id,owner_hash,event_name,arguments,callback_url,secret_encrypted,expires_at) VALUES
  ('matching','owner','creator.verified','{"city":"berlin","topics":["beauty"]}','https://example.com/1','test',now()+interval '1 day'),
  ('nonmatching','owner','creator.verified','{"city":"hamburg"}','https://example.com/2','test',now()+interval '1 day'),
  ('expired','owner','creator.verified','{}','https://example.com/3','test',now()-interval '1 day'),
  ('stopped','owner','creator.verified','{}','https://example.com/4','test',now()+interval '1 day');
  UPDATE mcp_event_subscriptions SET active = false WHERE id = 'stopped';
  INSERT INTO creator_profiles VALUES ('00000000-0000-0000-0000-000000000002','UGC-0000000002','active','New Creator','Berlin Mitte','Beauty, Food');
  INSERT INTO creator_private_contacts VALUES ('00000000-0000-0000-0000-000000000002','secret@example.com',now());
  INSERT INTO creator_social_accounts VALUES ('00000000-0000-0000-0000-000000000002');`);
assert.equal((await db.query('SELECT * FROM mcp_event_deliveries')).rows.length, 0, 'portfolio required');
await db.exec(`INSERT INTO creator_portfolio_items VALUES ('00000000-0000-0000-0000-000000000002');`);
const [delivery] = (await db.query('SELECT * FROM mcp_event_deliveries')).rows;
assert.equal(delivery.subscription_id, 'matching', 'filter and lifecycle checks');
assert.equal(delivery.payload.name, 'creator.verified');
assert.equal(delivery.payload.data.creator_public_id, 'UGC-0000000002');
assert.equal(delivery.payload.data.human_verification_level, 1);
assert.equal(delivery.payload.cursor, null);
assert.equal(JSON.stringify(delivery.payload).includes('secret@example.com'), false, 'no private contact in event');
assert.equal(Number.isNaN(Date.parse(delivery.payload.timestamp)), false, 'ISO occurrence time');
await db.exec(`UPDATE creator_profiles SET display_name = 'Changed' WHERE public_id = 'UGC-0000000002';`);
assert.equal((await db.query('SELECT * FROM mcp_event_deliveries')).rows.length, 1, 'event is idempotent');
await db.exec(migration);
assert.equal((await db.query('SELECT * FROM mcp_event_deliveries')).rows.length, 1, 'migration is idempotent');
// Verify the unsubscribe query also cancels queued deliveries atomically.
await db.query(`WITH stopped AS (
  UPDATE mcp_event_subscriptions SET active = false WHERE id = $1 AND owner_hash = $2 RETURNING id
) UPDATE mcp_event_deliveries SET finished_at = now()
WHERE subscription_id IN (SELECT id FROM stopped) AND finished_at IS NULL`, ['matching','owner']);
assert.ok((await db.query('SELECT finished_at FROM mcp_event_deliveries')).rows[0].finished_at);
await db.close();
console.log('OK: event database migration, baseline, eligibility, filters, privacy, expiration, unsubscribe and deduplication');

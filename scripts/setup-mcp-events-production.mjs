import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

const filename = process.argv[2];
if (!filename) throw new Error('Pass a protected production env file path.');
const production = dotenv.parse(fs.readFileSync(filename));
if (!production.DATABASE_URL || production.DATABASE_URL === '[SENSITIVE]') throw new Error('Production database is unavailable.');
if (!production.CRON_SECRET || production.CRON_SECRET === '[SENSITIVE]') throw new Error('Existing production cron secret must be configured.');
const credentialsPath = path.join(process.cwd(), '.env.mcp-events.local');
if (!fs.existsSync(credentialsPath)) {
  if (production.MCP_EVENTS_ENCRYPTION_KEY || production.MCP_EVENTS_TOKEN_HASHES) throw new Error('Recover the existing event credentials before provisioning.');
  fs.writeFileSync(credentialsPath,
    `MCP_EVENTS_ACCESS_TOKEN=ugc_events_${randomBytes(32).toString('base64url')}\nMCP_EVENTS_ENCRYPTION_KEY=${randomBytes(32).toString('hex')}\n`,
    { mode: 0o600, flag: 'wx' });
}
fs.chmodSync(credentialsPath, 0o600);
const credentials = dotenv.parse(fs.readFileSync(credentialsPath));
const ownerHash = createHash('sha256').update(credentials.MCP_EVENTS_ACCESS_TOKEN).digest('hex');
const sql = neon(production.DATABASE_URL);
const migration = fs.readFileSync('db/migrations/008_mcp_events.sql', 'utf8');
const statements = migration.split(/^-- statement-breakpoint\s*$/m).map(value => value.trim()).filter(Boolean);
await sql.transaction(statements.map(statement => sql.query(statement)));
console.log('Event migration committed.');
const additions = [
  ['MCP_EVENTS_TOKEN_HASHES', ownerHash, '--no-sensitive'],
  ['MCP_EVENTS_ENCRYPTION_KEY', credentials.MCP_EVENTS_ENCRYPTION_KEY, '--sensitive'],
];
for (const [name, value, sensitivity] of additions) {
  if (production[name]) {
    if (name === 'MCP_EVENTS_TOKEN_HASHES' && !production[name].split(',').includes(ownerHash)) throw new Error('Existing account hashes differ; review before changing access.');
    console.log(`${name} already configured; preserved.`);
    continue;
  }
  try {
    execFileSync('vercel', ['env', 'add', name, 'production', sensitivity, '--yes'], {
      input: value, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch { throw new Error(`Could not configure ${name}; secret values were not printed.`); }
  console.log(`${name} configured.`);
}
const [state] = await sql.query(`SELECT
  (SELECT count(*)::int FROM mcp_creator_event_seen) AS baseline_profiles,
  (SELECT count(*)::int FROM mcp_event_deliveries) AS pending_deliveries,
  (SELECT count(*)::int FROM mcp_event_subscriptions) AS subscriptions`);
console.log(JSON.stringify(state));
console.log('Provisioned connection credentials saved in the git-ignored .env.mcp-events.local (mode 0600).');

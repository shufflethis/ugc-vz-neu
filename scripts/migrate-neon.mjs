import fs from 'node:fs/promises';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL_UNPOOLED
  || process.env.POSTGRES_URL_NON_POOLING
  || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL_UNPOOLED, POSTGRES_URL_NON_POOLING oder DATABASE_URL fehlt.');
}

const sql = neon(connectionString);
const migrationDirectory = path.join(process.cwd(), 'db', 'migrations');
const migrationFiles = (await fs.readdir(migrationDirectory))
  .filter((file) => file.endsWith('.sql'))
  .sort();

for (const migrationFile of migrationFiles) {
  const source = await fs.readFile(path.join(migrationDirectory, migrationFile), 'utf8');
  const statements = source
    .split(/^-- statement-breakpoint\s*$/m)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) await sql.query(statement);
}

const [result] = await sql.query(`
  SELECT
    count(*)::int AS migration_count,
    (SELECT count(*)::int FROM creator_profiles) AS creator_count
  FROM schema_migrations
`);

console.log(JSON.stringify(result));

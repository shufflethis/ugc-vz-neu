import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let cachedSql: NeonQueryFunction<false, false> | null = null;

export const isDatabaseConfigured = () => Boolean(process.env.DATABASE_URL);

export const getDatabase = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured.');
  }

  if (!cachedSql) cachedSql = neon(process.env.DATABASE_URL);
  return cachedSql;
};

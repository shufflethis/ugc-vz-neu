import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let cachedSql: NeonQueryFunction<false, false> | null = null;

export const isDatabaseConfigured = () => Boolean(process.env.DATABASE_URL);

export const getDatabase = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured.');
  }

  // Next.js patcht globalThis.fetch und legt POST-Antworten des Neon-HTTP-Drivers
  // im Vercel Data Cache ab -- auch in force-dynamic-Routen ohne headers()/cookies()
  // (Symptom: /api/avatar lieferte ein Bild fuer ein geloeschtes Profil, bis
  // `vercel cache purge --type all` lief). no-store schaltet das aus.
  if (!cachedSql) {
    cachedSql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });
  }
  return cachedSql;
};

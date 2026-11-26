import { getDatabase, isDatabaseConfigured } from './database';

/**
 * Anonymes Suchprotokoll fuer die Nachfrage- und Relevanz-Analyse (Spec 8.6).
 * Bewusst ohne IP/Personenbezug. Freitext wird gekuerzt und von Mail-Adressen,
 * Telefonnummern, Links und @-Handles bereinigt. Loeschung nach 90 Tagen.
 */
const RETENTION_DAYS = 90;
const MAX_INPUT = 500;

export const sanitizeQuery = (query: string) =>
  query
    .slice(0, MAX_INPUT)
    .normalize('NFKC')
    .replace(/[^\s@]+\s*[[(]\s*at\s*[\])]\s*[^\s@]+/gi, '')
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '')
    .replace(/(?:https?:\/\/|www\.)\S+/gi, '')
    .replace(/\b[\w-]+\.(?:com|de|net|org|io|at|ch|me|tv)\b\S*/gi, '')
    .replace(/@\w+/g, '')
    .replace(/\+?\d[\d\s/().-]{6,}\d/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);

export async function logSearch(
  query: string,
  resultCount: number,
  source: 'web' | 'agent',
  detectedCategory?: string | null,
): Promise<number | null> {
  const clean = sanitizeQuery(query);
  if (!clean || !isDatabaseConfigured()) return null;
  try {
    const sql = getDatabase();
    try {
      const rows = (await sql.query(
        `WITH purged AS (DELETE FROM search_log WHERE created_at < now() - ($5 || ' days')::interval)
         INSERT INTO search_log (query, result_count, source, detected_category)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [clean, resultCount, source, detectedCategory || null, String(RETENTION_DAYS)],
      )) as unknown as Array<{ id: number | string }>;
      return rows[0]?.id ? Number(rows[0].id) : null;
    } catch (err: any) {
      if (err?.code !== '42703') throw err;
      // Fallback vor Migration 023
      const rows = (await sql.query(
        `WITH purged AS (DELETE FROM search_log WHERE created_at < now() - ($4 || ' days')::interval)
         INSERT INTO search_log (query, result_count, source)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [clean, resultCount, source, String(RETENTION_DAYS)],
      )) as unknown as Array<{ id: number | string }>;
      return rows[0]?.id ? Number(rows[0].id) : null;
    }
  } catch (error) {
    console.error('Search log failed', error instanceof Error ? error.message : 'unknown error');
    return null;
  }
}

export async function recordSearchInteraction(input: {
  searchLogId: number;
  type: 'click' | 'outreach';
  creatorPublicId?: string;
}): Promise<boolean> {
  if (!isDatabaseConfigured() || !Number.isInteger(input.searchLogId) || input.searchLogId <= 0) {
    return false;
  }
  try {
    const sql = getDatabase();
    if (input.type === 'click' && input.creatorPublicId && /^UGC-[A-F0-9]{10}$/.test(input.creatorPublicId)) {
      await sql.query(
        `UPDATE search_log
         SET clicked_creator_ids = CASE
           WHEN jsonb_array_length(COALESCE(clicked_creator_ids, '[]'::jsonb)) >= 20 THEN clicked_creator_ids
           ELSE COALESCE(clicked_creator_ids, '[]'::jsonb) || to_jsonb($2::text)
         END
         WHERE id = $1`,
        [input.searchLogId, input.creatorPublicId],
      );
      return true;
    }
    if (input.type === 'outreach') {
      await sql.query(
        `UPDATE search_log
         SET requested_outreach = true
         WHERE id = $1`,
        [input.searchLogId],
      );
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

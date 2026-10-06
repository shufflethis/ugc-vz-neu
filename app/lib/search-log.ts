import { getDatabase, isDatabaseConfigured } from './database';

/**
 * Anonymes Suchprotokoll fuer die Nachfrage-Analyse (siehe Datenschutz, Abschnitt 7).
 * Bewusst ohne IP/Kennung. Freitext wird gekuerzt und von Mail-Adressen,
 * Telefonnummern und Links bereinigt, weil Suchtexte Personenbezug enthalten koennen.
 * Ein Fehler hier darf die Suche nie kippen.
 */
const RETENTION_DAYS = 90;

export const sanitizeQuery = (query: string) => query
  .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '')
  .replace(/https?:\/\/\S+/gi, '')
  .replace(/\+?\d[\d\s/().-]{6,}\d/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 200);

export async function logSearch(query: string, resultCount: number, source: 'web' | 'agent') {
  const clean = sanitizeQuery(query);
  if (!clean || !isDatabaseConfigured()) return;
  try {
    // Ein Statement: alte Zeilen loeschen, neue schreiben (Index auf created_at).
    await getDatabase().query(
      `WITH purged AS (DELETE FROM search_log WHERE created_at < now() - ($4 || ' days')::interval)
       INSERT INTO search_log (query, result_count, source) VALUES ($1, $2, $3)`,
      [clean, resultCount, source, String(RETENTION_DAYS)],
    );
  } catch (error) {
    console.error('Search log failed', error instanceof Error ? error.message : 'unknown error');
  }
}

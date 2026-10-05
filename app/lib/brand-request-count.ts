import { getDatabase, isDatabaseConfigured } from './database';

/**
 * Echte Brand-Anfragen der letzten 28 Tage, auf Fuenfer abgerundet ("25+").
 * Anders als CREATOR_COUNT_LABEL ein rollierendes Fenster, das auch sinken
 * kann -- deshalb live aus der DB statt fortgeschrieben. null = nicht anzeigen.
 * Nur serverseitig importieren (DB-Zugriff).
 */
export async function getRecentBrandRequestLabel(): Promise<string | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const [row] = await getDatabase().query(
      `SELECT count(*)::int AS n FROM brand_leads
        WHERE NOT is_internal AND created_at > now() - interval '28 days'`,
    ) as Array<{ n: number }>;
    const rounded = Math.floor(row.n / 5) * 5;
    return rounded >= 10 ? `${rounded}+` : null;
  } catch {
    return null;
  }
}

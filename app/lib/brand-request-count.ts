import { unstable_cache } from 'next/cache';
import { getDatabase, isDatabaseConfigured } from './database';

async function fetchRecentBrandRequestLabel(): Promise<string | null> {
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

const getCachedRecentBrandRequestLabel = unstable_cache(
  fetchRecentBrandRequestLabel,
  ['recent-brand-request-label-28d'],
  { revalidate: 3600 },
);

/**
 * Echte Brand-Anfragen der letzten 28 Tage, auf Fuenfer abgerundet ("25+").
 * Anders als CREATOR_COUNT_LABEL ein rollierendes Fenster, das auch sinken
 * kann -- stündlich per ISR/Data-Cache aktualisiert, damit die Startseite
 * statisch aus dem CDN ausgeliefert werden kann. null = nicht anzeigen.
 */
export async function getRecentBrandRequestLabel(): Promise<string | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    return await getCachedRecentBrandRequestLabel();
  } catch {
    return null;
  }
}

// Datenbasis der Nischen-Landingpages (/brands/ugc-creator/[nische]): filtert
// die oeffentlichen Creator-Profile pro Nische und rechnet Kennzahlen aus
// Selbstangaben. Reine Funktionen (testbar) plus ein gecachter DB-Loader.
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';

export type NicheRow = {
  public_id: string;
  display_name: string;
  city: string | null;
  gender: string | null;
  topics: string | null;
  industries: string | null;
  preferred_content: string | null;
  special_traits: string | null;
  pet_context: string | null;
  rate_text: string | null;
  reach_text: string | null;
  total_reach: number | null;
  networks: string[] | null;
  portfolio_links: string | null;
  profile_quality_score: number | null;
  has_social_avatar: boolean | null;
  contact_reachable: boolean | null;
};

export type NicheMatch = {
  /** Treffer in Themen, Branchen, Formaten oder Besonderheiten (Kleinbuchstaben-Regex). */
  text?: RegExp;
  /** Nur Creator, die laut Profil Tiere haben (Freitext, Verneinungen ausgenommen). */
  pets?: boolean;
  /** Nur maennliche Creator (Filter wirkt zusaetzlich zu `text`). */
  male?: boolean;
};

const PRIMARY_TOPICS = 2;
const NEGATION = /(^|\s)(kein|keine|keinen|nein|nicht|ohne)(\s|$)|^[-–\s]*$/i;

export function matchesNiche(row: NicheRow, match: NicheMatch): boolean {
  if (match.male && !/^m(ä|ae|a)nnlich|^male$/i.test(row.gender || '')) return false;
  // Hauptthema: nur die zuerst genannten Eintraege der Themenliste zaehlen. Viele
  // Creator listen fast alles auf (Beauty, Fashion, Food, ...), das taugt nicht
  // zur Abgrenzung. Formate/Branchen/Besonderheiten zaehlen weiter vollstaendig.
  const primary = (row.topics || '').toLowerCase().split(/[,\n;/&]+| und /).map((t) => t.trim()).filter(Boolean).slice(0, PRIMARY_TOPICS).join(' ');
  const secondary = `${row.industries || ''} ${row.special_traits || ''}`.toLowerCase();
  const byText = match.text ? match.text.test(`${primary} ${secondary}`) : false;
  const pet = row.pet_context || '';
  const byPets = match.pets ? /hund|katze|haustier|pferd|kaninchen|tier/i.test(pet) && !NEGATION.test(pet) : false;
  if (match.male && !match.text && !match.pets) return true;
  return byText || byPets;
}

/**
 * Einstiegspreis in Euro aus dem Freitext der Preisvorstellung. Bevorzugt Zeilen
 * zu Video/Reel/UGC (Foto-Preise wuerden die Zahl druecken), sonst alle Betraege.
 */
export function entryPrice(rateText: string | null | undefined): number | null {
  // "250-300 EUR" -> beide Betraege sichtbar machen (Spannen nennen den Euro nur am Ende).
  const text = String(rateText || '').replace(/(\d{2,4})\s*[–-]\s*(\d{2,4})\s*(€|euro|eur)/gi, '$1 € $2 $3');
  const amounts = (segment: string) => {
    const found: number[] = [];
    for (const m of segment.matchAll(/(\d{1,3}(?:[.,]\d{3})+|\d{2,4})(?:[.,]\d{1,2})?\s*(?:€|eur\b|euro\b)|(?:€|eur\b|euro\b)\s*(\d{2,4})/gi)) {
      const value = Number((m[1] || m[2]).replace(/[.,](?=\d{3}\b)/g, ''));
      if (value >= 15 && value <= 3000) found.push(value);
    }
    return found;
  };
  const segments = text.split(/[\n|;]+|,\s+(?=[A-Za-zÄÖÜäöü])/);
  const videoAmounts = segments.filter((s) => /video|reel|ugc|clip|tiktok/i.test(s)).flatMap(amounts);
  const all = videoAmounts.length ? videoAmounts : amounts(text);
  return all.length ? Math.min(...all) : null;
}

export function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return Math.round(sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower));
}

export type NicheStats = {
  count: number;
  withPortfolio: number;
  reachable: number;
  platforms: { name: string; count: number }[];
  /** Nur ab 8 Profilen mit Preisangabe, sonst null (keine Scheingenauigkeit). */
  price: { n: number; p25: number; median: number; p75: number } | null;
};

export function nicheStats(rows: NicheRow[]): NicheStats {
  const prices = rows.map((row) => entryPrice(row.rate_text)).filter((v): v is number => v !== null).sort((a, b) => a - b);
  const platformCounts = new Map<string, number>();
  for (const row of rows) for (const name of new Set(row.networks || [])) platformCounts.set(name, (platformCounts.get(name) || 0) + 1);
  return {
    count: rows.length,
    withPortfolio: rows.filter((row) => (row.portfolio_links || '').trim()).length,
    reachable: rows.filter((row) => row.contact_reachable).length,
    platforms: [...platformCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => ({ name, count })),
    price: prices.length >= 8
      ? { n: prices.length, p25: percentile(prices, 0.25), median: percentile(prices, 0.5), p75: percentile(prices, 0.75) }
      : null,
  };
}

/** Per Mail erreichbare, belegte Profile zuerst; dann Qualitaetsscore und Reichweite. */
export function topCreators(rows: NicheRow[], limit = 8): NicheRow[] {
  const score = (row: NicheRow) =>
    (row.contact_reachable ? 1000 : 0) + ((row.portfolio_links || '').trim() ? 500 : 0) + (row.has_social_avatar ? 100 : 0) + (row.profile_quality_score || 0);
  return [...rows].sort((a, b) => score(b) - score(a) || (b.total_reach || 0) - (a.total_reach || 0)).slice(0, limit);
}

// Eine Abfrage fuer alle Nischen, pro Serverless-Instanz eine Stunde gehalten.
let cache: { at: number; rows: NicheRow[] } | null = null;
const TTL_MS = 60 * 60 * 1000;

export async function loadNicheRows(): Promise<NicheRow[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rows;
  if (!isDatabaseConfigured()) return [];
  const rows = (await getDatabase().query(`
    SELECT public_id, display_name, city, gender, topics, industries, preferred_content,
           special_traits, pet_context, rate_text, reach_text, total_reach, networks,
           portfolio_links, profile_quality_score, has_social_avatar, contact_reachable
    FROM creator_search_public
  `)) as unknown as NicheRow[];
  cache = { at: Date.now(), rows };
  return rows;
}

/** Public fields only; private contacts never belong in search or profile UI. */
export interface SearchCreator {
  id: string;
  name: string;
  image: string;
  reach: string;
  networks: string[];
  priceRange: string;
  /** Nur ein Flag (per Projekt-Mail erreichbar), nie die Adresse. */
  contactReachable?: boolean;
  gender?: string;
  city?: string;
  topics?: string;
  preferredContent?: string;
}

export interface PublicCreatorProfile {
  public_id: string;
  display_name: string;
  city: string | null;
  topics: string | null;
  preferred_content: string | null;
  equipment: string | null;
  rate_text: string | null;
  portfolio: string[];
  socials: Array<{ platform: string; url: string; handle?: string }>;
  humanVerification: { level: 0 | 1; name: string };
}

export function safePortfolioUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
      ? url.href : null;
  } catch {
    return null;
  }
}

/** Creator-Freitexte enthalten oft Markdown (Tabellen, **fett**, Listen); hier als lesbarer Klartext. */
export function humanizeCreatorText(raw: string | null | undefined): string {
  let text = (raw ?? '').replace(/\r/g, '');
  if (/\|\s*:?-{3,}/.test(text)) {
    // ponytail: nur 2-spaltige Tabellen (Leistung | Preis), Kopfzeile entfällt
    const rows = [...text.matchAll(/\|([^|\n]+)\|([^|\n]+)\|/g)]
      .map(([, a, b]) => [a.trim(), b.trim()])
      .filter(([a, b]) => !/^:?-{3,}:?$/.test(a) && !/^:?-{3,}:?$/.test(b));
    if (rows.length > 1) text = rows.slice(1).map(([a, b]) => `${a}: ${b}`).join('\n');
  }
  return text
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '$1 ($2)')
    .trim();
}

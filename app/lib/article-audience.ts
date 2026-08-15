/**
 * Zielgruppe eines Wissen-Artikels.
 *
 * Die Wissen-Artikel bedienen zwei gegenlaeufige Intentionen: Menschen, die
 * Creator werden wollen, und Marken, die Creator suchen. Bis hierher zeigten
 * alle Artikel denselben CTA ("Als Creator anmelden"), auch auf Seiten wie
 * "UGC Video Preise" mit ueber 2.000 Impressionen aus Marken-Suchen.
 *
 * Die Kategorien im Content-JSON taugen nicht zur Ableitung — alle 64
 * veroeffentlichten Artikel tragen dieselbe Kategorie "Allgemein". Deshalb
 * Slug-Signale plus eine Override-Liste fuer die Faelle, in denen ein Signal
 * in die Irre fuehrt (etwa "geld" in einem reinen Marken-Artikel).
 */

export type Audience = 'creator' | 'brand' | 'both';

/** Slugs, bei denen die Signalzaehlung unten das Falsche ergibt. */
const OVERRIDES: Record<string, Audience> = {
  // Ratgeber FUER Creator, deren Slug nach Marke klingt
  'ugc-portfolio-so-ueberzeugst-du-brands-in-7-schritten': 'creator',
  'ugc-creator-erfahrungen-was-brands-wirklich-nervt-und-wie-man-besser-wird': 'creator',
  'ugc-creator-pitches-wie-sie-marken-ueberzeugen': 'creator',
  'ugc-outreach-5-nachrichten-vorlagen-die-antworten-bringen': 'creator',
  'ugc-creator-plattform-das-profil-das-anfragen-bringt': 'creator',
  'ugc-verzeichnis-oeffentliches-creator-profil-als-lead-quelle': 'creator',
  'ugc-upsells-9-strategien-um-ihr-umsatzpotenzial-zu-verdoppeln': 'creator',
  'ugc-creator-deutschland-die-10-bestzahlenden-branchen': 'creator',

  // Marken-Artikel, deren Slug nach Creator klingt
  'kuratiertes-content-marketing-warum-ugc-ohne-filter-geld-verbrennt': 'brand',
  'ugc-creator-finden-der-3-filter-prozess-fuer-qualitaet-in-15-minuten': 'brand',
  'ugc-marketing-definition-beispiele-bessere-konversion': 'brand',
  'ugc-portfolio-beispiele-konkrete-loesungen-fuer-marketing-entscheider': 'brand',
  'ugc-berlin-creator-styles-die-wirklich-funktionieren': 'brand',

  // Preisseiten bedienen beide Seiten: Marken kalkulieren, Creator preisen sich ein
  'ugc-video-preise-komplette-kosten-uebersicht-2025': 'both',
  'ugc-video-preise-2026-was-kostet-user-generated-content-wirklich': 'both',
  'ugc-creator-preise-in-deutschland-realistische-ranges-2024': 'both',
  'ugc-content-creator-werden-essentielle-skills-fuer-unternehmen': 'both',
  'ugc-creator-management-retainer-modelle-fuer-nachhaltigen-erfolg': 'both',
};

const CREATOR_SIGNALS = [
  /verdien/, /gehalt/, /portfolio/, /creator-werden/, /als-creator/, /nebenverdienst/,
  /pitch/, /jobs/, /auftraege/, /skills/, /anzufangen/, /einnahmen/, /revenue/,
  /subscription/, /franchise/, /product-lines/, /consulting-beratung/, /studio-model/,
  /agency-model/, /fair-pay/, /rates/,
];

const BRAND_SIGNALS = [
  /agentur/, /preise/, /kosten/, /kampagn/, /brands/, /marken/, /b2b/, /briefing/,
  /brief-/, /moderation/, /roi/, /conversion/, /kaufhemmnis/, /entscheider/, /budget/,
  /ads/, /performance/, /always-on/, /strategie/, /casting/, /hook/, /formate/,
  /tech-ugc/, /fashion/, /food/, /lokale/, /plattform/, /vergleich/, /software/,
  /tools/, /automation/, /brand-safety/, /due-diligence/, /dsgvo/, /system/,
];

export function getArticleAudience(slug: string): Audience {
  const override = OVERRIDES[slug];
  if (override) return override;

  const creator = CREATOR_SIGNALS.filter((r) => r.test(slug)).length;
  const brand = BRAND_SIGNALS.filter((r) => r.test(slug)).length;

  if (creator > brand) return 'creator';
  if (brand > creator) return 'brand';
  return 'both';
}

export interface AudienceCta {
  /** Kompakter Button oben rechts im Artikel-Header. */
  header: { href: string; label: string };
  /** Abschluss-Block unter dem Artikel. */
  footer: {
    heading: string;
    text: string;
    primary: { href: string; label: string };
    /** Zweitrangig und bewusst leise: Die Positionierung der Seite ist
     *  "Agentur ist optional, nicht Voraussetzung". */
    secondary?: string;
  };
}

const CREATOR_CTA: AudienceCta = {
  header: { href: '/creator', label: 'Als Creator anmelden' },
  footer: {
    heading: 'Bereit für die ersten Anfragen?',
    text: 'Leg ein kostenloses Profil mit Portfolio, Themen und Verfügbarkeit an. Marken finden dich darüber direkt — ohne Agentur dazwischen.',
    primary: { href: '/creator', label: 'Kostenloses Creator-Profil anlegen' },
  },
};

const BRAND_CTA: AudienceCta = {
  header: { href: '/brands', label: 'Creator suchen' },
  footer: {
    heading: 'Passende Creator für deine Kampagne finden',
    text: 'Beschreibe deine Kampagne und erhalte Profile aus dem Verzeichnis. Kostenlos, mit direkten Kontaktdaten der Creator, die du auswählst.',
    primary: { href: '/brands', label: 'Creator kostenlos suchen' },
    secondary:
      'Wenn ihr Auswahl, Briefing und Abwicklung abgeben wollt, geht das optional als Agenturleistung — Voraussetzung ist es nicht.',
  },
};

const BOTH_CTA: AudienceCta = {
  header: { href: '/brands', label: 'Creator suchen' },
  footer: {
    heading: 'Für Marken und für Creator',
    text: 'Marken beschreiben ihre Kampagne und erhalten passende Profile. Creator legen ein kostenloses Profil an und werden gefunden. Beides ohne Gebühr.',
    primary: { href: '/brands', label: 'Creator kostenlos suchen' },
    secondary: 'Du bist selbst Creator? Leg dein kostenloses Profil unter /creator an.',
  },
};

export function getAudienceCta(audience: Audience): AudienceCta {
  if (audience === 'creator') return CREATOR_CTA;
  if (audience === 'brand') return BRAND_CTA;
  return BOTH_CTA;
}

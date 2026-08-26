import { CREATOR_COUNT_LABEL } from './creator-count';

export interface CompetitorFact {
  value: string;
  source: string;
  verifiedAt: string;
  isPublic: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Competitor {
  slug: string;
  name: string;
  url: string;
  model: string;
  isOwn: boolean;
  hasOwnPage: boolean;
  pricing: CompetitorFact;
  creatorCount: CompetitorFact;
  directContact: CompetitorFact;
  commission: CompetitorFact;
  markets: CompetitorFact;
  strengths: string[];
  bestFor: string;
  faqs: FaqItem[];
}

const V = '2026-08-14';
// Eigener Creator-Count: gegen die Live-Suche (/api/v1/creators/search) nachgezaehlt.
const V_OWN = '2026-08-26';

const NOT_PUBLIC = 'nicht öffentlich';

/** Slug-Suffix aller Detailseiten: /vergleich/{slug}{SUFFIX} */
export const SUFFIX = '-alternative';

export function formatVerifiedAt(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/** Prüfdatum als deutsches Datum. Einzige Quelle für „Stand:"-Angaben im Fließtext. */
export const VERIFIED_AT_LABEL = formatVerifiedAt(V);

export const competitors: Competitor[] = [
  {
    slug: 'ugc-vz',
    name: 'UGC VZ',
    url: 'https://ugc-vz.de',
    model: 'Verzeichnis mit Direktkontakt',
    isOwn: true,
    hasOwnPage: false,
    pricing: { value: 'kostenlos', source: 'https://ugc-vz.de/brands', verifiedAt: V, isPublic: true },
    creatorCount: { value: `${CREATOR_COUNT_LABEL} (DACH, kuratiert)`, source: 'https://ugc-vz.de/brands', verifiedAt: V_OWN, isPublic: true },
    directContact: { value: 'Ja, Kontaktdaten der Creator', source: 'https://ugc-vz.de/brands', verifiedAt: V, isPublic: true },
    commission: { value: 'keine', source: 'https://ugc-vz.de/brands', verifiedAt: V, isPublic: true },
    markets: { value: 'DACH', source: 'https://ugc-vz.de/brands', verifiedAt: V, isPublic: true },
    strengths: [
      'Kostenlos, keine Plattform- oder Vermittlungsgebühr',
      'Direkte Kontaktdaten der Creator statt Kommunikation über eine Plattform',
      `${CREATOR_COUNT_LABEL} kuratierte Creator im deutschsprachigen Raum`,
    ],
    bestFor: 'Brands, die Creator direkt ansprechen, selbst verhandeln und ohne Zwischenstelle zusammenarbeiten wollen.',
    faqs: [],
  },
  {
    slug: 'speekly',
    name: 'Speekly',
    url: 'https://speekly.de',
    model: 'Marktplatz mit Festpreisen',
    isOwn: false,
    hasOwnPage: true,
    pricing: { value: '99 € / 119 € / 139 € pro Video (15/30/60 Sek.), zzgl. MwSt.; Rohmaterial-Paket ab 59 €', source: 'https://speekly.de/preise', verifiedAt: V, isPublic: true },
    creatorCount: { value: '10.000+', source: 'https://speekly.de', verifiedAt: V, isPublic: true },
    directContact: { value: 'Nein, Chat über die Plattform', source: 'https://speekly.de', verifiedAt: V, isPublic: true },
    commission: { value: 'im Videopreis enthalten', source: 'https://speekly.de/preise', verifiedAt: V, isPublic: true },
    markets: { value: 'DE, EN, IT, NL', source: 'https://speekly.de', verifiedAt: V, isPublic: true },
    strengths: [
      'Feste, öffentlich einsehbare Videopreise ohne Monatsabo',
      'Fertig geschnittene Videos inklusive Revisionen bis zur Freigabe',
      'Über 10.000 Creator im Pool, Lieferung nach etwa 7 Tagen',
    ],
    bestFor: 'Brands, die planbare Fixpreise pro Video wollen und die komplette Abwicklung abgeben möchten.',
    faqs: [
      { question: 'Was kostet Speekly?', answer: `Laut Preisseite von Speekly kosten fertig geschnittene UGC-Videos 99 € (15 Sekunden), 119 € (30 Sekunden) und 139 € (60 Sekunden), jeweils zzgl. MwSt. Ein Paket mit ungeschnittenem Rohmaterial beginnt bei 59 €. Stand: ${VERIFIED_AT_LABEL}.` },
      { question: 'Gibt es eine kostenlose Alternative zu Speekly?', answer: 'UGC VZ ist ein kostenloses Creator-Verzeichnis. Du zahlst keine Plattformgebühr und verhandelst das Honorar direkt mit dem Creator. Dafür übernimmt UGC VZ auch keine Abwicklung, keine Verträge und keine Zahlungsabwicklung — das ist der Unterschied zum Marktplatzmodell von Speekly.' },
      { question: 'Kann ich Creator bei Speekly direkt kontaktieren?', answer: 'Die Kommunikation läuft über den Chat der Speekly-Plattform. Bei UGC VZ bekommst du die Kontaktdaten der Creator und schreibst direkt.' },
      { question: 'Worin unterscheiden sich Speekly und UGC VZ?', answer: 'Speekly ist ein Marktplatz: Du erstellst einen Auftrag, Creator bewerben sich, Speekly wickelt Vertrag und Zahlung ab und liefert ein fertiges Video zum Festpreis. UGC VZ ist ein Verzeichnis: Du suchst Creator, bekommst deren Kontaktdaten und regelst alles Weitere selbst.' },
    ],
  },
  {
    slug: 'influee',
    name: 'Influee',
    url: 'https://influee.co',
    model: 'Marktplatz mit Pflicht-Abo',
    isOwn: false,
    hasOwnPage: true,
    pricing: { value: 'Abo $229 / $529 / $999 pro Monat, zzgl. 10 % Marketplace-Fee, zzgl. Creator-Honorar', source: 'https://influee.co/pricing', verifiedAt: V, isPublic: true },
    creatorCount: { value: '140.000+ weltweit, 10.000+ in Deutschland', source: 'https://influee.co/de', verifiedAt: V, isPublic: true },
    directContact: { value: 'Nein, Abwicklung über die Plattform', source: 'https://influee.co/de', verifiedAt: V, isPublic: true },
    commission: { value: '10 % Marketplace-Fee auf Creator-Zahlungen', source: 'https://influee.co/pricing', verifiedAt: V, isPublic: true },
    markets: { value: '24 Länder', source: 'https://influee.co/de', verifiedAt: V, isPublic: true },
    strengths: [
      'Mit über 140.000 Creatorn der mit Abstand größte Pool im Vergleich',
      'In 24 Ländern verfügbar, dadurch für internationale Kampagnen geeignet',
      'KI-Videoeditor mit automatischen Untertiteln in 65 Sprachen',
    ],
    bestFor: 'Brands mit hohem, kontinuierlichem Content-Volumen und internationalen Märkten, für die sich ein Monatsabo rechnet.',
    faqs: [
      { question: 'Was kostet Influee wirklich?', answer: `Die Startseite wirbt mit UGC-Videos „ab 76 €". Das ist der Creator-Anteil. Laut Preisseite kommt ein Pflicht-Abo von $229, $529 oder $999 pro Monat hinzu, dazu eine Marketplace-Fee von 10 % auf die Creator-Zahlungen. Die Creator-Honorare sind im Abo nicht enthalten. Stand: ${VERIFIED_AT_LABEL}.` },
      { question: 'Gibt es eine Influee-Alternative ohne Monatsabo?', answer: 'UGC VZ verlangt weder Abo noch Provision — es ist ein kostenloses Verzeichnis, über das du Creator direkt kontaktierst. Auch Speekly kommt ohne Abo aus und rechnet pro Video ab.' },
      { question: 'Wie viele deutsche Creator hat Influee?', answer: `Influee gibt über 10.000 Creator in Deutschland an, bei 140.000+ weltweit. Das ist deutlich mehr als das kuratierte Verzeichnis von UGC VZ mit ${CREATOR_COUNT_LABEL} Creatorn im DACH-Raum.` },
      { question: 'Wann lohnt sich Influee gegenüber UGC VZ?', answer: 'Wenn du regelmäßig viel Content in mehreren Ländern produzierst und die Abwicklung samt Nutzungsrechten und Videoschnitt an eine Plattform abgeben willst. Bei einzelnen Kampagnen im DACH-Raum trägt das Monatsabo diese Kosten nicht.' },
    ],
  },
  {
    slug: 'stylink-ugc',
    name: 'stylink UGC',
    url: 'https://ugc.stylink.com',
    model: 'Marktplatz mit Content-Check',
    isOwn: false,
    hasOwnPage: true,
    pricing: { value: NOT_PUBLIC, source: 'https://ugc.stylink.com', verifiedAt: V, isPublic: false },
    creatorCount: { value: '20.000+', source: 'https://ugc.stylink.com', verifiedAt: V, isPublic: true },
    directContact: { value: 'Nein, Abwicklung über die Plattform', source: 'https://ugc.stylink.com', verifiedAt: V, isPublic: true },
    commission: { value: NOT_PUBLIC, source: 'https://ugc.stylink.com', verifiedAt: V, isPublic: false },
    markets: { value: 'DE, EN', source: 'https://ugc.stylink.com', verifiedAt: V, isPublic: true },
    strengths: [
      'Über 20.000 Creator und 2.500+ Brands und Agenturen als Kunden',
      'Content-Check durch stylink vor der Auslieferung an die Brand',
      'Feste Durchlaufzeit: nach eigenen Angaben 9 Tage vom Auftrag zum Video',
    ],
    bestFor: 'Brands im DACH-Raum, die eine vorgeschaltete Qualitätskontrolle und eine feste Lieferzeit wollen.',
    faqs: [
      { question: 'Was kostet stylink UGC für Brands?', answer: `stylink UGC veröffentlicht auf der eigenen Website keine Preise für Brands. Angegeben ist nur die Creator-Vergütung von „bis zu 200 € pro Video". In Vergleichsartikeln kursierende Zahlen lassen sich auf der Anbieterseite nicht belegen, deshalb führen wir hier keine. Stand: ${VERIFIED_AT_LABEL}.` },
      { question: 'Wie funktioniert stylink UGC?', answer: 'Brands erstellen einen Auftrag, Creator bewerben sich darauf, stylink führt einen Content-Check durch und die Brand zahlt nach Annahme des Videos.' },
      { question: 'Gibt es eine Alternative zu stylink UGC ohne Plattformgebühr?', answer: 'UGC VZ ist ein kostenloses Verzeichnis: Du findest Creator, bekommst deren Kontaktdaten und verhandelst direkt. Es gibt keine Plattformgebühr und keine Provision — dafür auch keinen Content-Check und keine Abwicklung durch uns.' },
    ],
  },
  {
    slug: 'boksi',
    name: 'Boksi',
    url: 'https://boksi.com/de',
    model: 'Marktplatz mit Managed Service',
    isOwn: false,
    hasOwnPage: true,
    pricing: { value: NOT_PUBLIC, source: 'https://boksi.com/de', verifiedAt: V, isPublic: false },
    creatorCount: { value: '27.000+', source: 'https://boksi.com/de', verifiedAt: V, isPublic: true },
    directContact: { value: 'Nein, Abwicklung über die Plattform', source: 'https://boksi.com/de', verifiedAt: V, isPublic: true },
    commission: { value: NOT_PUBLIC, source: 'https://boksi.com/de', verifiedAt: V, isPublic: false },
    markets: { value: 'DE, FI, EN', source: 'https://boksi.com/de', verifiedAt: V, isPublic: true },
    strengths: [
      'Über 27.000 Creator und mehr als 3.500 umgesetzte Kampagnen',
      'First-Party-Daten von Instagram und TikTok mit Performance-Tracking (Engagement, CPM, Conversion)',
      'Persönlicher Support mit Büros in Helsinki und Hamburg',
    ],
    bestFor: 'Größere Brands, die Influencer-Marketing und UGC gebündelt mit Reporting und persönlicher Betreuung einkaufen.',
    faqs: [
      { question: 'Was kostet Boksi?', answer: `Boksi veröffentlicht keine Preisliste. Die Website führt zu einer kostenlosen Demo, ein individuelles Angebot wird laut Anbieter innerhalb eines Werktags erstellt. Stand: ${VERIFIED_AT_LABEL}.` },
      { question: 'Für wen eignet sich Boksi?', answer: 'Für Brands, die Kampagnen mit Reporting und Betreuung einkaufen wollen, statt einzelne Videos zu bestellen. Boksi nennt Branchen wie Food, Fashion, Beauty, Retail, Pet Care und Travel.' },
      { question: 'Gibt es eine Boksi-Alternative mit transparenten Kosten?', answer: 'UGC VZ ist kostenlos und verlangt keine Provision; du verhandelst das Honorar direkt mit dem Creator. Wer feste Videopreise sucht, findet sie bei Speekly öffentlich ausgewiesen.' },
    ],
  },
  {
    slug: 'refluenced',
    name: 'Refluenced',
    url: 'https://refluenced.com',
    model: 'Kampagnen-Plattform (Budget-Modell)',
    isOwn: false,
    hasOwnPage: false,
    pricing: { value: NOT_PUBLIC, source: 'https://refluenced.com', verifiedAt: V, isPublic: false },
    creatorCount: { value: '25.000+ Micro- und Nano-Creator', source: 'https://refluenced.com', verifiedAt: V, isPublic: true },
    directContact: { value: 'Nein, Abwicklung über die Plattform', source: 'https://refluenced.com', verifiedAt: V, isPublic: true },
    commission: { value: NOT_PUBLIC, source: 'https://refluenced.com', verifiedAt: V, isPublic: false },
    markets: { value: 'primär DACH', source: 'https://refluenced.com', verifiedAt: V, isPublic: true },
    strengths: [
      'Über 25.000 verifizierte Micro- und Nano-Creator mit DACH-Fokus',
      'KI-gestützte Briefing-Erstellung und Live-Performance-Tracking',
      'Zentrale Abrechnung: eine Rechnung statt vieler einzelner Creator-Rechnungen',
    ],
    bestFor: 'Brands, die langfristige Creator-Communities im DACH-Raum aufbauen, statt Einzelaufträge zu vergeben.',
    faqs: [],
  },
  {
    slug: 'youdji',
    name: 'Youdji',
    url: 'https://youdji.com/de',
    model: 'Marktplatz ohne Abo',
    isOwn: false,
    hasOwnPage: false,
    pricing: { value: 'kein Abo, keine Servicegebühr; Zahlung pro Auftrag an den Creator', source: 'https://youdji.com/de', verifiedAt: V, isPublic: true },
    creatorCount: { value: '10.533', source: 'https://youdji.com/de', verifiedAt: V, isPublic: true },
    directContact: { value: 'Nein, Verträge und Zahlung laufen über die Plattform', source: 'https://youdji.com/de', verifiedAt: V, isPublic: true },
    commission: { value: 'keine Servicegebühr', source: 'https://youdji.com/de', verifiedAt: V, isPublic: true },
    markets: { value: '10 Länder, 43+ Sprachen', source: 'https://youdji.com/de', verifiedAt: V, isPublic: true },
    strengths: [
      'Kein Monatsabo und keine Servicegebühr für Marken',
      '10.533 verifizierte Creator in über 43 Sprachen',
      'Verträge und Zahlungsabwicklung sind inklusive',
    ],
    bestFor: 'Brands, die ohne Abo buchen, die rechtliche und finanzielle Abwicklung aber trotzdem über eine Plattform laufen lassen wollen.',
    faqs: [],
  },
];

export function getCompetitor(slug: string): Competitor | undefined {
  return competitors.find((c) => c.slug === slug);
}

export function getPageCompetitors(): Competitor[] {
  return competitors.filter((c) => c.hasOwnPage);
}

export function getOwn(): Competitor {
  const own = competitors.find((c) => c.isOwn);
  if (!own) throw new Error('Kein isOwn-Eintrag in competitors.ts');
  return own;
}

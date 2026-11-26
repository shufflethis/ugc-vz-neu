/**
 * Feste 20er-Kategorien-Taxonomie, Stile und Synonym-Logik fuer UGC VZ (Spec 8.6).
 *
 * Regeln aus Spec 8.6:
 * - Exakt 20 feste Hauptkategorien statt unsortiertem Freitext.
 * - Max. 3 Kategorien pro Creator, davon genau 1 Pflicht-Hauptkategorie (is_primary).
 * - Stoppwoerter (creator, ugc, video, influencer, content) fliegen aus Queries raus.
 * - Konfidenz >= 0.7 fuer erkannte Query-Kategorie erlaubt harten Kategorie-Filter.
 */

export const MAX_CATEGORIES_PER_CREATOR = 3;

export const CREATOR_CATEGORY_IDS = [
  'beauty_pflege',
  'mode_schmuck',
  'food_getraenke',
  'fitness_sport',
  'gesundheit',
  'familie_kinder',
  'haustiere',
  'home_garten',
  'haushalt_putzen',
  'tech_gadgets',
  'gaming',
  'auto_mobilitaet',
  'reisen_outdoor',
  'finanzen_business',
  'apps_software',
  'bildung',
  'nachhaltigkeit',
  'events_freizeit',
  'musik_kultur',
  'handwerk_diy',
] as const;

export type CreatorCategoryId = (typeof CREATOR_CATEGORY_IDS)[number];

export const CREATOR_STYLE_OPTIONS = [
  { id: 'talking_head', label: 'Talking Head', terms: ['talking head', 'talking-head', 'kamera', 'moderation', 'testimonial', 'storytelling'] },
  { id: 'voiceover', label: 'Voiceover', terms: ['voiceover', 'voice-over', 'voice over', 'off-stimme', 'b-roll'] },
  { id: 'unboxing', label: 'Unboxing', terms: ['unboxing', 'auspacken', 'haul', 'first impression', 'erster eindruck'] },
  { id: 'tutorial', label: 'Tutorial', terms: ['tutorial', 'how-to', 'howto', 'anleitung', 'erklärvideo', 'erklaervideo', 'demo', 'produktdemo'] },
  { id: 'vorher_nachher', label: 'Vorher/Nachher', terms: ['vorher/nachher', 'vorher-nachher', 'vorher nachher', 'before after', 'ergebnis', 'vergleich'] },
  { id: 'comedy', label: 'Comedy', terms: ['comedy', 'humor', 'witzig', 'sketch', 'skit', 'entertainment'] },
  { id: 'asmr', label: 'ASMR', terms: ['asmr', 'ästhetik', 'aesthetik', 'aesthetic', 'sounds'] },
] as const;

export type CreatorStyleId = (typeof CREATOR_STYLE_OPTIONS)[number]['id'];

export interface CreatorCategoryDefinition {
  id: CreatorCategoryId;
  label: string;
  legacyTopicKeys: string[];
  synonyms: string[];
  compoundPrefixes: string[];
}

export const CREATOR_TAXONOMY: readonly CreatorCategoryDefinition[] = [
  {
    id: 'beauty_pflege',
    label: 'Beauty & Pflege',
    legacyTopicKeys: ['beauty'],
    synonyms: [
      'beauty', 'pflege', 'kosmetik', 'skincare', 'hautpflege', 'gesichtspflege',
      'makeup', 'make-up', 'schminken', 'schminke', 'haircare', 'haarpflege',
      'parfum', 'parfüm', 'duft', 'serum', 'creme', 'nagelpflege', 'nägel',
      'grooming', 'bartpflege', 'rasur', 'körperpflege', 'bodycare', 'selfcare', 'wimpern', 'friseur',
    ],
    compoundPrefixes: ['skincare', 'hautpfleg', 'haarpfleg', 'gesichtspfleg', 'kosmetik', 'schmink', 'bartpfleg', 'rasier', 'beauty'],
  },
  {
    id: 'mode_schmuck',
    label: 'Mode & Schmuck',
    legacyTopicKeys: ['fashion'],
    synonyms: [
      'mode', 'fashion', 'schmuck', 'kleidung', 'outfit', 'outfits', 'streetwear',
      'sneaker', 'schuhe', 'accessoires', 'taschen', 'uhren', 'styling', 'apparel', 'unterwäsche', 'brillen',
    ],
    compoundPrefixes: ['mode', 'fashion', 'schmuck', 'outfit', 'streetwear', 'sneaker', 'kleidung'],
  },
  {
    id: 'food_getraenke',
    label: 'Food & Getränke',
    legacyTopicKeys: ['food'],
    synonyms: [
      'food', 'getränke', 'getraenke', 'essen', 'kochen', 'backen', 'rezepte', 'rezept',
      'ernährung', 'ernaehrung', 'snacks', 'snack', 'kaffee', 'tee', 'wein', 'bier',
      'drinks', 'drink', 'lebensmittel', 'vegan', 'küche', 'kueche', 'kulinarik', 'restaurant', 'barista', 'proteinriegel', 'kombucha',
    ],
    compoundPrefixes: ['food', 'koch', 'back', 'rezept', 'snack', 'kaffee', 'getränk', 'getraenk', 'lebensmittel'],
  },
  {
    id: 'fitness_sport',
    label: 'Fitness & Sport',
    legacyTopicKeys: ['fitness'],
    synonyms: [
      'fitness', 'sport', 'gym', 'workout', 'training', 'laufen', 'joggen', 'running',
      'yoga', 'pilates', 'kraftsport', 'bodybuilding', 'crossfit', 'radfahren', 'radsport',
      'fußball', 'fussball', 'tennis', 'marathon', 'triathlon', 'calisthenics', 'sportswear', 'activewear', 'whey',
    ],
    compoundPrefixes: ['fitness', 'sport', 'workout', 'train', 'kraftsport', 'radsport'],
  },
  {
    id: 'gesundheit',
    label: 'Gesundheit',
    legacyTopicKeys: ['health'],
    synonyms: [
      'gesundheit', 'health', 'wellness', 'supplements', 'supplement', 'nahrungsergänzung',
      'nahrungsergaenzung', 'vitamine', 'vitamin', 'apotheke', 'medizin', 'schlaf',
      'achtsamkeit', 'mindfulness', 'mental health', 'longevity', 'biohacking', 'darmgesundheit', 'immunsystem', 'zahnpflege',
    ],
    compoundPrefixes: ['gesundheit', 'supplement', 'vitamin', 'wellness', 'medizin', 'apothek', 'schlaf'],
  },
  {
    id: 'familie_kinder',
    label: 'Familie & Kinder',
    legacyTopicKeys: ['family'],
    synonyms: [
      'familie', 'family', 'kinder', 'kind', 'baby', 'babys', 'kleinkind', 'mama', 'mutter',
      'papa', 'vater', 'eltern', 'schwangerschaft', 'schwanger', 'stillzeit', 'kinderwagen',
      'spielzeug', 'babybrei', 'windeln', 'elternzeit', 'momlife', 'dadlife', 'familienalltag',
    ],
    compoundPrefixes: ['familie', 'kinder', 'baby', 'eltern', 'schwanger', 'spielzeug', 'mama', 'papa'],
  },
  {
    id: 'haustiere',
    label: 'Haustiere',
    legacyTopicKeys: ['pets'],
    synonyms: [
      'haustier', 'haustiere', 'tier', 'tiere', 'hund', 'hunde', 'hundefutter', 'welpe',
      'katze', 'katzen', 'katzenfutter', 'pferd', 'pferde', 'reiten', 'pet', 'pets',
      'tierbedarf', 'tierfutter', 'tierpflege', 'hundezubehör', 'katzenzubehör', 'leckerli', 'futter',
    ],
    compoundPrefixes: ['haustier', 'hunde', 'katzen', 'pferde', 'tierfutter', 'tierbedarf', 'tierpfleg'],
  },
  {
    id: 'home_garten',
    label: 'Home & Garten',
    legacyTopicKeys: ['home'],
    synonyms: [
      'home', 'wohnen', 'interior', 'einrichtung', 'möbel', 'moebel', 'deko', 'dekoration',
      'garten', 'balkon', 'pflanzen', 'living', 'homeliving', 'küchengeräte', 'kuechengeraete',
      'matratze', 'bettwäsche', 'licht', 'lampen', 'smarthome', 'smart home', 'grill', 'grillen',
    ],
    compoundPrefixes: ['wohn', 'interior', 'möbel', 'moebel', 'garten', 'balkon', 'pflanz', 'deko'],
  },
  {
    id: 'haushalt_putzen',
    label: 'Haushalt & Putzen',
    legacyTopicKeys: ['home'],
    synonyms: [
      'haushalt', 'putzen', 'reinigung', 'clean', 'cleantok', 'cleaning', 'staubsauger',
      'saugroboter', 'waschmittel', 'wäsche', 'waesche', 'ordnung', 'organisieren',
      'putzmittel', 'haushaltsgeräte', 'haushaltsgeraete', 'spülmaschine', 'spuelmaschine', 'reiniger', 'entkalker',
    ],
    compoundPrefixes: ['haushalt', 'putz', 'reinig', 'staubsaug', 'saugrobot', 'waschmittel', 'cleantok'],
  },
  {
    id: 'tech_gadgets',
    label: 'Tech & Gadgets',
    legacyTopicKeys: ['tech'],
    synonyms: [
      'tech', 'technik', 'gadgets', 'gadget', 'elektronik', 'smartphone', 'handy',
      'kopfhörer', 'kopfhoerer', 'smartwatch', 'laptop', 'notebook', 'kamera',
      'drohne', 'powerbank', 'ladegerät', 'ladegeraet', 'hardware', 'elektronikzubehör', 'audio', 'lautsprecher',
    ],
    compoundPrefixes: ['tech', 'technik', 'gadget', 'elektronik', 'smartphone', 'kopfhoer', 'kopfhör', 'smartwatch'],
  },
  {
    id: 'gaming',
    label: 'Gaming',
    legacyTopicKeys: ['gaming'],
    synonyms: [
      'gaming', 'gamer', 'esports', 'e-sports', 'twitch', 'streaming', 'streamer',
      'playstation', 'ps5', 'xbox', 'nintendo', 'pc gaming', 'headset', 'gaming headset',
      'tastatur', 'gaming maus', 'konsole', 'videospiele', 'zocken', 'setup', 'gaming chair',
    ],
    compoundPrefixes: ['gaming', 'gamer', 'esport', 'stream', 'konsole', 'zock'],
  },
  {
    id: 'auto_mobilitaet',
    label: 'Auto & Mobilität',
    legacyTopicKeys: ['automotive'],
    synonyms: [
      'auto', 'autos', 'kfz', 'autohaus', 'automotive', 'car', 'cars', 'tuning',
      'e-auto', 'elektroauto', 'motorrad', 'werkstatt', 'fahrzeug', 'fahrzeuge',
      'autopflege', 'fahrzeugpflege', 'autozubehör', 'autozubehoer', 'mobilität', 'mobilitaet',
      'e-bike', 'ebike', 'fahrrad', 'pkw', 'reifen', 'felgen', 'dashcam', 'leasing', 'gebrauchtwagen', 'motorsport', 'enduro', 'roller',
    ],
    compoundPrefixes: ['auto', 'kfz', 'fahrzeug', 'motorrad', 'werkstatt', 'tuning', 'elektroauto', 'e-bike', 'ebike', 'motorsport', 'mobilit'],
  },
  {
    id: 'reisen_outdoor',
    label: 'Reisen & Outdoor',
    legacyTopicKeys: ['travel'],
    synonyms: [
      'reisen', 'reise', 'travel', 'urlaub', 'hotel', 'camping', 'camper', 'vanlife',
      'wohnmobil', 'outdoor', 'wandern', 'hiking', 'berge', 'strand', 'flug',
      'städtereise', 'staedtereise', 'backpacking', 'koffer', 'reisegepäck', 'ferienhaus', 'kreuzfahrt',
    ],
    compoundPrefixes: ['reise', 'travel', 'urlaub', 'camping', 'camper', 'vanlife', 'outdoor', 'wander', 'hotel'],
  },
  {
    id: 'finanzen_business',
    label: 'Finanzen & Business',
    legacyTopicKeys: ['finance', 'business'],
    synonyms: [
      'finanzen', 'finance', 'geld', 'investieren', 'aktien', 'etf', 'sparen', 'versicherung',
      'versicherungen', 'bank', 'konto', 'kredit', 'steuern', 'steuer', 'buchhaltung',
      'immobilien', 'krypto', 'business', 'b2b', 'karriere', 'job', 'gründung', 'selbstständig', 'entrepreneur', 'marketing', 'e-commerce',
    ],
    compoundPrefixes: ['finanz', 'steuer', 'versicher', 'invest', 'buchhalt', 'business', 'karrier', 'immobil'],
  },
  {
    id: 'apps_software',
    label: 'Apps & Software',
    legacyTopicKeys: ['tech', 'business'],
    synonyms: [
      'app', 'apps', 'software', 'saas', 'ki', 'ai', 'künstliche intelligenz',
      'digitalprodukt', 'tool', 'tools', 'produktivität', 'produktivitaet', 'vpn',
      'cloud', 'webseite', 'website', 'onlineshop', 'shopify', 'finanz-app', 'lern-app', 'mobile app',
    ],
    compoundPrefixes: ['app', 'software', 'saas', 'produktiv'],
  },
  {
    id: 'bildung',
    label: 'Bildung',
    legacyTopicKeys: ['business'],
    synonyms: [
      'bildung', 'lernen', 'sprachen', 'sprachkurs', 'studium', 'student', 'uni',
      'schule', 'nachhilfe', 'onlinekurs', 'weiterbildung', 'coaching', 'bücher', 'buecher', 'lesen', 'hörbuch', 'hoerbuch', 'wissen',
    ],
    compoundPrefixes: ['bildung', 'lern', 'studium', 'sprachkurs', 'weiterbild', 'nachhilf', 'hörbuch', 'hoerbuch'],
  },
  {
    id: 'nachhaltigkeit',
    label: 'Nachhaltigkeit',
    legacyTopicKeys: ['home', 'food'],
    synonyms: [
      'nachhaltigkeit', 'nachhaltig', 'eco', 'öko', 'oeko', 'bio', 'green', 'solar',
      'balkonkraftwerk', 'photovoltaik', 'zero waste', 'second hand', 'secondhand',
      'fairtrade', 'klimaschutz', 'umwelt', 'recycelt', 'plastikfrei', 'energie', 'stromtarif',
    ],
    compoundPrefixes: ['nachhaltig', 'solar', 'balkonkraft', 'photovoltaik', 'umwelt', 'klima', 'secondhand'],
  },
  {
    id: 'events_freizeit',
    label: 'Events & Freizeit',
    legacyTopicKeys: ['travel'],
    synonyms: [
      'events', 'event', 'freizeit', 'festival', 'konzert', 'party', 'ausflug',
      'freizeitpark', 'gesellschaftsspiel', 'brettspiel', 'hobby', 'basteln',
      'fotografie', 'geschenk', 'geschenke', 'erlebnis', 'erlebnisse', 'hochzeit', 'kino',
    ],
    compoundPrefixes: ['event', 'freizeit', 'festival', 'konzert', 'brettspiel', 'geschenk', 'erlebnis', 'hochzeit'],
  },
  {
    id: 'musik_kultur',
    label: 'Musik & Kultur',
    legacyTopicKeys: [],
    synonyms: [
      'musik', 'music', 'instrument', 'gitarre', 'klavier', 'dj', 'gesang', 'singen',
      'podcast', 'kultur', 'kunst', 'theater', 'museum', 'film', 'serien', 'streamingdienst', 'vinyl', 'audio',
    ],
    compoundPrefixes: ['musik', 'instrument', 'podcast', 'kultur', 'kunst'],
  },
  {
    id: 'handwerk_diy',
    label: 'Handwerk & DIY',
    legacyTopicKeys: ['home'],
    synonyms: [
      'handwerk', 'handwerker', 'diy', 'werkzeug', 'heimwerken', 'heimwerker',
      'baumarkt', 'renovieren', 'renovierung', 'bauen', 'baustelle', 'holz',
      'möbelbau', 'streichen', 'farbe', 'bohrmaschine', 'akkuschrauber', 'nähen', 'stricken', 'basteln', 'upcycling',
    ],
    compoundPrefixes: ['handwerk', 'werkzeug', 'heimwerk', 'baumarkt', 'renovi', 'baustell', 'upcycl'],
  },
] as const;

export const CREATOR_CATEGORY_MAP = new Map<CreatorCategoryId, CreatorCategoryDefinition>(
  CREATOR_TAXONOMY.map((cat) => [cat.id, cat]),
);

export const CATEGORY_ID_SET = new Set<string>(CREATOR_CATEGORY_IDS);

export const SEARCH_QUERY_STOPWORDS = new Set([
  'creator',
  'creators',
  'creatorin',
  'creatorinnen',
  'ugc',
  'video',
  'videos',
  'influencer',
  'influencerin',
  'content',
  'clip',
  'clips',
  'suche',
  'suchen',
  'suchend',
  'brauche',
  'gesucht',
  'für',
  'fuer',
  'und',
  'oder',
  'mit',
  'aus',
  'der',
  'die',
  'das',
  'ein',
  'eine',
  'einen',
  'einem',
  'einer',
  'zum',
  'zur',
  'von',
  'ich',
  'wir',
  'jemand',
  'passend',
  'passende',
  'passenden',
  'dazu',
  'passt',
]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function makeWordRegex(term: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(term)}(?![\\p{L}\\p{N}])`, 'iu');
}

function makePrefixRegex(prefix: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(prefix)}[\\p{L}-]{0,22}(?![\\p{L}\\p{N}])`, 'iu');
}

const COMPILED_CATEGORY_MATCHERS = CREATOR_TAXONOMY.map((cat) => ({
  def: cat,
  exactRegexes: cat.synonyms.map((term) => ({ term, regex: makeWordRegex(term) })),
  prefixRegexes: cat.compoundPrefixes.map((prefix) => ({ prefix, regex: makePrefixRegex(prefix) })),
}));

export function getCategoryLabel(id: string): string {
  return CREATOR_CATEGORY_MAP.get(id as CreatorCategoryId)?.label || id;
}

export function stripSearchStopwords(query: string): string {
  return query
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !SEARCH_QUERY_STOPWORDS.has(w.toLowerCase()))
    .join(' ');
}

export interface DetectedQueryCategory {
  id: CreatorCategoryId;
  label: string;
  confidence: number;
  matchedTerms: string[];
}

/**
 * Erkennt 20er-Kategorien aus einer Suchanfrage mit Konfidenz (0..1).
 * Exakte Synonym-Treffer liefern >= 0.75 (reicht fuer harten Kategorie-Filter ab 0.7).
 */
export function detectCategoriesFromQuery(query: string): DetectedQueryCategory[] {
  const cleaned = stripSearchStopwords(query);
  if (!cleaned) return [];

  const matches: DetectedQueryCategory[] = [];
  for (const matcher of COMPILED_CATEGORY_MATCHERS) {
    const matchedTerms: string[] = [];
    let exactHits = 0;
    let prefixHits = 0;

    // Direkter Treffer auf das Label oder die ID
    if (makeWordRegex(matcher.def.id).test(query) || makeWordRegex(matcher.def.label).test(query)) {
      exactHits += 2;
      matchedTerms.push(matcher.def.label);
    }

    for (const item of matcher.exactRegexes) {
      if (item.regex.test(cleaned)) {
        exactHits += 1;
        matchedTerms.push(item.term);
      }
    }
    if (exactHits === 0) {
      for (const item of matcher.prefixRegexes) {
        if (item.regex.test(cleaned)) {
          prefixHits += 1;
          matchedTerms.push(item.prefix);
        }
      }
    }

    if (exactHits > 0 || prefixHits > 0) {
      const confidence =
        exactHits >= 2 ? 0.95 : exactHits === 1 ? 0.85 : prefixHits >= 2 ? 0.8 : 0.72;
      matches.push({
        id: matcher.def.id,
        label: matcher.def.label,
        confidence,
        matchedTerms: [...new Set(matchedTerms)].slice(0, 5),
      });
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence || b.matchedTerms.length - a.matchedTerms.length);
}

export interface ClassifiedCreatorCategories {
  primary: CreatorCategoryId | null;
  categories: Array<{ id: CreatorCategoryId; label: string; isPrimary: boolean; confidence: number }>;
  isGeneralist: boolean;
  specialistBonus: number;
}

/**
 * Ordnet ein Creator-Profil auf max. 3 der 20 festen Kategorien (+ 1 Hauptkategorie) ab.
 * Bevorzugt explizit bestaetigte Kategorien, faellt sonst deterministisch auf Freitext/KI-Text zurueck.
 */
export function classifyCreatorProfileCategories(input: {
  primaryCategory?: string | null;
  secondaryCategories?: string[] | null;
  topics?: string | null;
  industries?: string | null;
  specialTraits?: string | null;
  preferredContent?: string | null;
  petContext?: string | null;
  childrenContext?: string | null;
  aiSummary?: string | null;
  aiNiches?: string[] | null;
}): ClassifiedCreatorCategories {
  // 1. Wenn explizit bestaetigte Kategorien vorliegen, haben diese hoechste Prioritaet
  if (input.primaryCategory && CATEGORY_ID_SET.has(input.primaryCategory)) {
    const primary = input.primaryCategory as CreatorCategoryId;
    const secondary = (input.secondaryCategories || [])
      .filter((id): id is CreatorCategoryId => CATEGORY_ID_SET.has(id) && id !== primary)
      .slice(0, MAX_CATEGORIES_PER_CREATOR - 1);
    const list = [primary, ...secondary];
    return {
      primary,
      categories: list.map((id, idx) => ({
        id,
        label: getCategoryLabel(id),
        isPrimary: idx === 0,
        confidence: idx === 0 ? 1 : 0.85,
      })),
      isGeneralist: false,
      specialistBonus: list.length === 1 ? 18 : list.length === 2 ? 12 : 6,
    };
  }

  // 2. Deterministische Ableitung aus bestehenden Profilfeldern (mit Positionsgewicht fuer Hauptthema!)
  const rawTopicTokens = String(input.topics || '')
    .split(/[,;/\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const rawIndustryTokens = String(input.industries || '')
    .split(/[,;/\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const leadTopicsText = rawTopicTokens.slice(0, 3).join(' ');
  const tailTopicsText = rawTopicTokens.slice(3).join(' ');
  const aiNichesText = (input.aiNiches || []).join(' ');
  const aiSummaryText = String(input.aiSummary || '');
  const fullContextText = [
    input.topics || '',
    input.industries || '',
    input.specialTraits || '',
    input.petContext || '',
    input.childrenContext || '',
    aiNichesText,
    aiSummaryText,
  ].join(' ');

  const scores = new Map<CreatorCategoryId, number>();

  for (const matcher of COMPILED_CATEGORY_MATCHERS) {
    let score = 0;

    // Erste 3 genannten Themen (Hauptgebiet!) zaehlen am staerksten
    for (const item of matcher.exactRegexes) {
      if (leadTopicsText && item.regex.test(leadTopicsText)) score += 3.5;
      if (aiNichesText && item.regex.test(aiNichesText)) score += 3.0;
      if (aiSummaryText && item.regex.test(aiSummaryText)) score += 2.2;
      if (tailTopicsText && item.regex.test(tailTopicsText)) score += 1.0;
      if (input.industries && item.regex.test(input.industries)) score += 1.6;
      if (input.specialTraits && item.regex.test(input.specialTraits)) score += 1.2;
      if (input.petContext && matcher.def.id === 'haustiere' && item.regex.test(input.petContext)) score += 2.0;
      if (input.childrenContext && matcher.def.id === 'familie_kinder' && item.regex.test(input.childrenContext)) score += 2.0;
    }

    if (score === 0) {
      for (const item of matcher.prefixRegexes) {
        if (leadTopicsText && item.regex.test(leadTopicsText)) score += 2.4;
        else if (fullContextText && item.regex.test(fullContextText)) score += 1.0;
      }
    }

    if (score > 0) {
      scores.set(matcher.def.id, score);
    }
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const totalDistinctCategories = ranked.length;
  const totalRawTopicCount = rawTopicTokens.length + rawIndustryTokens.length;
  const isGeneralist = totalDistinctCategories >= 6 || totalRawTopicCount >= 11;

  const top = ranked.slice(0, MAX_CATEGORIES_PER_CREATOR);
  const topScore = top[0]?.[1] || 1;

  const categories = top.map(([id, score], idx) => ({
    id,
    label: getCategoryLabel(id),
    isPrimary: idx === 0,
    confidence: Math.min(0.98, Math.max(0.45, Number((score / Math.max(topScore, 3.5)).toFixed(2)))),
  }));

  const specialistBonus = isGeneralist
    ? -8
    : totalDistinctCategories <= 1
      ? 14
      : totalDistinctCategories <= 2
        ? 9
        : 4;

  return {
    primary: categories[0]?.id ?? null,
    categories,
    isGeneralist,
    specialistBonus,
  };
}

export function validateCreatorCategories(input: {
  primaryCategory?: unknown;
  secondaryCategories?: unknown;
}):
  | { ok: true; primaryCategory: CreatorCategoryId; secondaryCategories: CreatorCategoryId[] }
  | { ok: false; error: string } {
  const primary = String(input.primaryCategory || '').trim();
  if (!CATEGORY_ID_SET.has(primary)) {
    return { ok: false, error: 'Bitte wähle eine gültige Hauptkategorie aus den 20 Kategorien.' };
  }
  const rawSecondary = Array.isArray(input.secondaryCategories) ? input.secondaryCategories : [];
  const secondary: CreatorCategoryId[] = [];
  for (const item of rawSecondary) {
    const id = String(item || '').trim();
    if (!id || id === primary) continue;
    if (!CATEGORY_ID_SET.has(id)) {
      return { ok: false, error: `Unbekannte Kategorie: ${id}` };
    }
    if (!secondary.includes(id as CreatorCategoryId)) {
      secondary.push(id as CreatorCategoryId);
    }
  }
  if (secondary.length > MAX_CATEGORIES_PER_CREATOR - 1) {
    return {
      ok: false,
      error: `Du kannst höchstens ${MAX_CATEGORIES_PER_CREATOR} Kategorien auswählen (1 Hauptkategorie + max. 2 weitere).`,
    };
  }
  return {
    ok: true,
    primaryCategory: primary as CreatorCategoryId,
    secondaryCategories: secondary,
  };
}

export function detectStylesInText(text: string): CreatorStyleId[] {
  const lower = String(text || '').toLowerCase();
  if (!lower) return [];
  const found: CreatorStyleId[] = [];
  for (const style of CREATOR_STYLE_OPTIONS) {
    if (style.terms.some((t) => lower.includes(t))) {
      found.push(style.id);
    }
  }
  return found;
}

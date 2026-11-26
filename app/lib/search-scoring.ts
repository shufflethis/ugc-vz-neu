import {
  castingFilters,
  directorySearchWords,
  type CastingEvidence,
  type CastingFilter,
  type CastingWork,
} from './casting';

export interface QueryAnalysis {
  gender: 'male' | 'female' | 'any';
  platforms: string[];
  topics: string[];
  minFollowers: number;
  maxFollowers: number | null;
  ageRange: {
    min: number | null;
    max: number | null;
  };
  location: string | null;
  priceRange: {
    min: number | null;
    max: number | null;
  };
  keywords: string[];
}

export interface SearchableCreatorProfile {
  id: string;
  fullName: string;
  firstName: string;
  stageName: string;
  gender: string;
  normalizedGender: 'male' | 'female' | 'any';
  socialLinks: string;
  networksList: string[];
  platforms: {
    tiktok: boolean;
    instagram: boolean;
    youtube: boolean;
    facebook: boolean;
    twitch: boolean;
    snapchat: boolean;
  };
  reachText: string;
  totalReach: number;
  priceRange: string;
  priceValue: number | null;
  age: number | null;
  location: string;
  locationLower: string;
  topicsText: string;
  formatsText: string;
  portfolioText: string;
  works: CastingWork[];
  capAvatar?: string;
  equipmentText: string;
  petContext: string;
  childrenContext: string;
  skinType: string;
  experienceSince: string;
  heightCm: number | null;
  aiSummary?: string;
  aiNiches?: string[];
  aiVisualSignalsText?: string;
  /** Focused content text excluding creator names and raw price text to prevent false topic matches. */
  topicSearchText: string;
  /** Full public searchable text including display/stage name. */
  searchableText: string;
  contactReachable: boolean;
  finalImage: string;
  hasCustomImage: boolean;
  verificationLevel: 0 | 1;
}

export interface CreatorRelevanceEvaluation {
  matchedTopics: string[];
  matchedKeywords: string[];
  matchedRelatedTopics: string[];
  hasThematicRequirement: boolean;
  hasThematicMatch: boolean;
  hasRelatedThematicMatch: boolean;
  relevanceScore: number;
  qualityScore: number;
  totalScore: number;
  hardExcluded: boolean;
  exclusionReason?: 'age' | 'followers' | 'price' | 'relevance';
  matchReason?: string;
  relatedReason?: string;
}

type TopicRule = {
  label: string;
  exactTerms: string[];
  compoundPrefixes?: string[];
  extraPatterns?: RegExp[];
  /** Adjacent topics allowed for soft "alternatives" when exact matches are scarce. */
  relatedTopics: string[];
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const wordBoundaryRegex = (term: string): RegExp =>
  new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(term)}(?![\\p{L}\\p{N}])`, 'iu');

const compoundPrefixRegex = (prefix: string): RegExp =>
  new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(prefix)}[\\p{L}-]{0,24}(?![\\p{L}\\p{N}])`, 'iu');

export const TOPIC_RULES: Record<string, TopicRule> = {
  beauty: {
    label: 'Beauty & Kosmetik',
    exactTerms: [
      'beauty', 'kosmetik', 'make-up', 'makeup', 'schminke', 'skincare',
      'hautpflege', 'gesichtspflege', 'serum', 'creme', 'haircare', 'haarpflege',
      'parfum', 'parfüm', 'duft', 'nägel', 'nagelpflege', 'nailcare', 'mascara',
      'lippenstift', 'grooming', 'bartpflege', 'rasur', 'rasierprodukte',
      'friseur', 'körperpflege', 'bodycare', 'selfcare', 'wimpern',
    ],
    compoundPrefixes: ['skincare', 'hautpfleg', 'haarpfleg', 'gesichtspfleg', 'kosmetik', 'schmink', 'bartpfleg', 'rasier', 'nagelpfleg', 'beauty'],
    relatedTopics: ['fashion', 'health'],
  },
  fashion: {
    label: 'Mode & Fashion',
    exactTerms: [
      'mode', 'fashion', 'kleidung', 'bekleidung', 'style', 'styling',
      'streetwear', 'menswear', 'womenswear', 'outfit', 'outfits', 'schuhe',
      'sneaker', 'accessoires', 'schmuck', 'uhren', 'taschen', 'poloshirts',
      'modetrends', 'modemarken', 'textil', 'secondhand', 'vintage',
    ],
    compoundPrefixes: ['fashion', 'streetwear', 'menswear', 'outfit', 'kleidung', 'bekleidung', 'sneaker', 'modemark', 'modetrend'],
    relatedTopics: ['beauty', 'lifestyle'],
  },
  travel: {
    label: 'Reisen & Outdoor',
    exactTerms: [
      'reise', 'reisen', 'travel', 'urlaub', 'vacation', 'camping', 'camper',
      'vanlife', 'outdoor', 'wandern', 'hiking', 'hotel', 'hotels', 'roadtrip',
      'backpacking', 'wohnmobil', 'campervan', 'fernreise', 'städtereise',
      'kurztrip', 'abenteuer', 'berge', 'natur',
    ],
    compoundPrefixes: ['reisen', 'urlaub', 'camping', 'outdoor', 'wander', 'roadtrip', 'wohnmobil', 'camper', 'vanlife', 'städtereis', 'fernreis'],
    relatedTopics: ['automotive', 'fitness'],
  },
  fitness: {
    label: 'Fitness & Sport',
    exactTerms: [
      'fitness', 'sport', 'sportler', 'sportlerin', 'workout', 'workouts',
      'training', 'gym', 'krafttraining', 'bodybuilding', 'laufen', 'running',
      'joggen', 'yoga', 'pilates', 'crossfit', 'radsport', 'radfahren',
      'fußball', 'fussball', 'tennis', 'schwimmen', 'triathlon', 'marathon',
      'calisthenics', 'laufschuhe', 'sportbekleidung', 'hyrox',
    ],
    compoundPrefixes: ['fitness', 'workout', 'krafttrain', 'bodybuild', 'radsport', 'laufschuh', 'sportbekleid', 'sportnahr', 'calisthenics'],
    relatedTopics: ['health', 'travel'],
  },
  food: {
    label: 'Essen, Kochen & Drinks',
    exactTerms: [
      'essen', 'food', 'foodie', 'kochen', 'cooking', 'backen', 'rezept',
      'rezepte', 'ernährung', 'ernaehrung', 'nutrition', 'supplements',
      'protein', 'snacks', 'getränke', 'getraenke', 'drinks', 'kaffee',
      'barista', 'kaffeemaschine', 'tee', 'wein', 'bier', 'küche', 'airfryer',
      'vegan', 'vegetarisch', 'grillen', 'bbq', 'restaurant', 'gastronomie',
      'mealprep', 'küchengeräte',
    ],
    compoundPrefixes: ['kochen', 'rezept', 'ernährung', 'ernaehrung', 'kaffee', 'küchengerät', 'backen', 'supplement', 'protein', 'gastronomi', 'grill'],
    relatedTopics: ['health', 'home'],
  },
  lifestyle: {
    label: 'Lifestyle & Alltag',
    exactTerms: [
      'lifestyle', 'morgenroutine', 'day-in-the-life', 'daily-vlog',
    ],
    compoundPrefixes: ['lifestyle'],
    relatedTopics: [],
  },
  tech: {
    label: 'Tech, Apps & Digital',
    exactTerms: [
      'tech', 'technologie', 'technology', 'technik', 'gadgets', 'gadget',
      'software', 'app', 'apps', 'saas', 'ki', 'ai', 'künstliche intelligenz',
      'elektronik', 'digital', 'smartphone', 'iphone', 'android', 'laptop',
      'computer', 'pc', 'smart-home', 'smarthome', 'kopfhörer', 'kamera',
      'drohne', 'photovoltaik', 'solar', 'balkonkraftwerk', 'e-bike', 'ebike',
      'webseite', 'website', 'tool', 'tools',
    ],
    compoundPrefixes: ['technolog', 'elektronik', 'software', 'smartphone', 'smarthome', 'photovoltaik', 'balkonkraftwerk', 'kopfhörer', 'app-demo'],
    relatedTopics: ['gaming', 'business'],
  },
  family: {
    label: 'Familie, Mama & Kinder',
    exactTerms: [
      'family', 'familie', 'familien', 'mama', 'mamas', 'mutter', 'mütter',
      'mom', 'momlife', 'papa', 'papas', 'vater', 'väter', 'dad', 'eltern',
      'baby', 'babys', 'kleinkind', 'kleinkinder', 'kids', 'kind', 'kinder',
      'schwanger', 'schwangerschaft', 'stillzeit', 'spielzeug', 'kinderwagen',
      'familienalltag', 'familienprodukt', 'kinderzimmer',
    ],
    compoundPrefixes: ['familie', 'kinder', 'kleinkind', 'schwangersch', 'eltern', 'baby', 'momlife'],
    relatedTopics: ['home', 'food'],
  },
  gaming: {
    label: 'Gaming & Streaming',
    exactTerms: [
      'gaming', 'gamer', 'gamerin', 'games', 'videospiele', 'zocken',
      'streaming', 'streamer', 'twitch', 'esports', 'e-sports', 'playstation',
      'xbox', 'nintendo', 'konsole', 'pc-gaming', 'gaming-setup',
    ],
    compoundPrefixes: ['gaming', 'videospiel', 'esport', 'playstation', 'nintendo', 'stream'],
    relatedTopics: ['tech'],
  },
  business: {
    label: 'Business, B2B & Karriere',
    exactTerms: [
      'business', 'b2b', 'karriere', 'bewerbung', 'office', 'homeoffice',
      'linkedin', 'gründer', 'gründerin', 'startup', 'startups', 'selbstständig',
      'freelancer', 'marketing', 'vertrieb', 'produktivität', 'coaching',
      'unternehmer', 'unternehmerin', 'agentur', 'unternehmensberatung',
    ],
    compoundPrefixes: ['business', 'karriere', 'homeoffice', 'gründer', 'startup', 'marketing', 'unternehmer'],
    relatedTopics: ['finance', 'tech'],
  },
  finance: {
    label: 'Finanzen & Versicherungen',
    exactTerms: [
      'finance', 'finanzen', 'finanz', 'finanzprodukte', 'versicherung',
      'versicherungen', 'bank', 'banking', 'geld', 'geldanlage', 'aktien',
      'etf', 'etfs', 'depot', 'krypto', 'crypto', 'steuern', 'steuererklärung',
      'sparen', 'altersvorsorge', 'kredit', 'immobilien', 'investment',
      'investieren', 'trading', 'börse',
    ],
    compoundPrefixes: ['finanz', 'versicher', 'geldanlag', 'steuererkl', 'altersvorsorg', 'immobilie', 'invest'],
    relatedTopics: ['business'],
  },
  health: {
    label: 'Gesundheit & Wellness',
    exactTerms: [
      'health', 'gesundheit', 'wellness', 'longevity', 'mental', 'mental health',
      'achtsamkeit', 'meditation', 'schlaf', 'nahrungsergänzung', 'vitamine',
      'apotheke', 'medizin', 'physiotherapie', 'ergonomie', 'zahnpflege',
      'frauengesundheit', 'darmgesundheit', 'prävention',
    ],
    compoundPrefixes: ['gesundheit', 'wellness', 'nahrungsergänz', 'physiotherap', 'zahnpfleg', 'achtsamkeit', 'longevity'],
    relatedTopics: ['fitness', 'beauty'],
  },
  home: {
    label: 'Wohnen, DIY & Garten',
    exactTerms: [
      'home', 'wohnen', 'interior', 'einrichtung', 'diy', 'heimwerken',
      'handwerk', 'werkzeug', 'haushalt', 'putzen', 'reinigung', 'deko',
      'dekoration', 'garten', 'balkon', 'pflanzen', 'möbel', 'moebel',
      'lampen', 'beleuchtung', 'renovieren', 'wohnumgebung', 'haushaltsgeräte',
      'staubsauger', 'matratze', 'bettwäsche',
    ],
    compoundPrefixes: ['interior', 'einricht', 'heimwerk', 'handwerk', 'werkzeug', 'haushalt', 'dekoration', 'garten', 'möbel', 'renovier', 'wohn'],
    relatedTopics: ['family', 'food'],
  },
  pets: {
    label: 'Hunde, Katzen & Haustiere',
    exactTerms: [
      'hund', 'hunde', 'hundefutter', 'hundezubehör', 'welpe', 'welpen',
      'katze', 'katzen', 'katzenfutter', 'haustier', 'haustiere', 'pet', 'pets',
      'tierfutter', 'tierbedarf', 'tierzubehör', 'tierhalter', 'pferd', 'pferde',
      'reiten', 'dog', 'dogs', 'cat', 'cats', 'dogmom', 'tierpflege',
    ],
    compoundPrefixes: ['hunde', 'katzen', 'haustier', 'tierfutter', 'tierbedarf', 'tierzubehör', 'tierpfleg', 'welpe', 'pferd'],
    relatedTopics: ['family', 'home'],
  },
  automotive: {
    label: 'Auto, KFZ & Mobilität',
    exactTerms: [
      'auto', 'autos', 'car', 'cars', 'kfz', 'pkw', 'lkw', 'suv',
      'e-auto', 'e-autos', 'elektroauto', 'elektroautos', 'automotive',
      'automobil', 'automobile', 'mobilität', 'mobilitaet', 'e-mobilität',
      'tuning', 'motorsport', 'oldtimer', 'youngtimer', 'werkstatt',
      'schrauber', 'schrauben', 'fahrzeug', 'fahrzeuge', 'fahrzeugpflege', 'autopflege',
      'autohaus', 'autovermietung', 'gebrauchtwagen', 'neuwagen', 'sportwagen',
      'motorrad', 'motorräder', 'biker', 'enduro', 'offroad', 'motocross', 'elektro-cross',
      'cabrio', 'wohnmobil', 'campervan', 'camper-ausbau', 'vanlife',
      'dashcam', 'felgen', 'reifen', 'wallbox', 'ladestation', 'führerschein',
      'carsharing', 'detailing', 'kfz-versicherung', 'kfz-pflege',
      'bmw', 'audi', 'mercedes', 'porsche', 'volkswagen', 'vw', 'tesla',
    ],
    compoundPrefixes: [
      'kfz', 'fahrzeug', 'automobil', 'automotive', 'motorsport', 'motorrad',
      'autopfleg', 'autohaus', 'autoteil', 'autowerk', 'autowäsch', 'autowaesch',
      'gebrauchtwagen', 'neuwagen', 'sportwagen', 'elektroauto', 'e-auto',
      'oldtimer', 'youngtimer', 'tuning', 'wohnmobil', 'carsharing', 'wallbox',
      'werkstatt', 'schrauber', 'enduro', 'offroad', 'motocross', 'camper-ausbau',
    ],
    // Match German "Auto..." compounds like Auto-Creator, Autoliebe, Autofahren,
    // while strictly excluding non-car words (automatisch, autonom, autor, autogramm, autark).
    extraPatterns: [
      /(?<![\p{L}\p{N}])auto(?:s|[- ]?(?:creator\w*|pflege|teile|haus|werkstatt|fahren|fahrer\w*|wäsche|waesche|vermietung|liebe|fan\w*|tuning|test\w*|review\w*|blog\w*|vlog\w*|content|video\w*|detailing|zubehör|zubehoer|handel|kauf|verkauf|versicherung|finanzierung|leasing|abo|service|wasch\w*|mobil\w*|szene|community|markt|bereich))(?![\p{L}\p{N}])/iu,
    ],
    relatedTopics: ['travel', 'tech', 'home'],
  },
};

type CompiledTopicRule = {
  topic: string;
  label: string;
  patterns: RegExp[];
  relatedTopics: string[];
};

const COMPILED_TOPIC_RULES: CompiledTopicRule[] = Object.entries(TOPIC_RULES).map(([topic, rule]) => ({
  topic,
  label: rule.label,
  patterns: [
    ...rule.exactTerms.map(wordBoundaryRegex),
    ...(rule.compoundPrefixes || []).map(compoundPrefixRegex),
    ...(rule.extraPatterns || []),
  ],
  relatedTopics: rule.relatedTopics,
}));

const TOPIC_RULE_BY_NAME = new Map(COMPILED_TOPIC_RULES.map((entry) => [entry.topic, entry]));

export function getTopicLabel(topic: string): string {
  return TOPIC_RULE_BY_NAME.get(topic)?.label || topic;
}

export function textMatchesTopic(text: string, topic: string): boolean {
  const rule = TOPIC_RULE_BY_NAME.get(topic);
  if (!rule || !text) return false;
  return rule.patterns.some((pattern) => pattern.test(text));
}

export function detectTopicsInText(text: string): string[] {
  if (!text) return [];
  const matched: string[] = [];
  for (const rule of COMPILED_TOPIC_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      matched.push(rule.topic);
    }
  }
  return matched;
}

const KNOWN_LOCATIONS: Array<{ canonical: string; aliases: string[] }> = [
  { canonical: 'berlin', aliases: ['berlin', 'berliner'] },
  { canonical: 'hamburg', aliases: ['hamburg', 'hamburger'] },
  { canonical: 'münchen', aliases: ['münchen', 'muenchen', 'münchner', 'muenchner'] },
  { canonical: 'köln', aliases: ['köln', 'koeln', 'kölner', 'koelner'] },
  { canonical: 'frankfurt', aliases: ['frankfurt', 'frankfurter', 'rhein-main'] },
  { canonical: 'stuttgart', aliases: ['stuttgart', 'stuttgarter'] },
  { canonical: 'düsseldorf', aliases: ['düsseldorf', 'duesseldorf'] },
  { canonical: 'leipzig', aliases: ['leipzig', 'leipziger'] },
  { canonical: 'dortmund', aliases: ['dortmund'] },
  { canonical: 'essen', aliases: ['stadt essen', 'aus essen', 'in essen'] },
  { canonical: 'bremen', aliases: ['bremen'] },
  { canonical: 'dresden', aliases: ['dresden'] },
  { canonical: 'hannover', aliases: ['hannover'] },
  { canonical: 'nürnberg', aliases: ['nürnberg', 'nuernberg'] },
  { canonical: 'nrw', aliases: ['nrw', 'nordrhein-westfalen'] },
  { canonical: 'bayern', aliases: ['bayern'] },
  { canonical: 'wien', aliases: ['wien', 'wiener'] },
  { canonical: 'zürich', aliases: ['zürich', 'zuerich'] },
  { canonical: 'österreich', aliases: ['österreich', 'oesterreich'] },
  { canonical: 'schweiz', aliases: ['schweiz'] },
];

const LOCATION_WORDS = new Set(
  KNOWN_LOCATIONS.flatMap((entry) => [entry.canonical, ...entry.aliases.flatMap((a) => a.split(/\s+/))]),
);

const STOPWORDS = new Set([
  'ich', 'wir', 'du', 'ihr', 'sie', 'es', 'man', 'jemand', 'jemanden', 'leute', 'personen', 'person',
  'suche', 'suchen', 'gesucht', 'brauche', 'brauchen', 'möchte', 'moechte', 'will', 'wollen', 'hätte', 'haette',
  'nach', 'für', 'fuer', 'mit', 'ohne', 'und', 'oder', 'aber', 'denn', 'weil', 'dass', 'wenn', 'falls',
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
  'auf', 'in', 'im', 'an', 'am', 'bei', 'beim', 'von', 'vom', 'zu', 'zum', 'zur', 'aus', 'über', 'ueber', 'unter', 'bis', 'ab', 'zwischen',
  'als', 'wie', 'sehr', 'mehr', 'weniger', 'mindestens', 'maximal', 'höchstens', 'hoechstens', 'ungefähr', 'circa', 'etwa',
  'auch', 'noch', 'doch', 'hier', 'dort', 'gerne', 'gern', 'bitte', 'mal', 'eben', 'halt', 'eigentlich', 'groben', 'grob', 'passt', 'dazu', 'sowie', 'bzw',
  'creator', 'creators', 'creatorin', 'creatorinnen', 'ugc', 'ugc-creator', 'ugc-creatorin', 'ugc-creatorinnen', 'influencer', 'influencerin', 'content-creator',
  'video', 'videos', 'clip', 'clips', 'content', 'beitrag', 'beiträge', 'post', 'posts', 'story', 'stories', 'reel', 'reels', 'short', 'shorts', 'foto', 'fotos', 'bilder',
  'alltagsvideo', 'alltagsvideos', 'erklärvideo', 'erklärvideos', 'erklaervideo', 'erklaervideos', 'anwendungsvideo', 'anwendungsvideos', 'testvideo', 'testvideos',
  'produkt', 'produkte', 'produktvideo', 'produktvideos', 'produktdemo', 'demo', 'marke', 'marken', 'brand', 'brands', 'kampagne', 'werbung', 'anzeigen', 'anzeige', 'ads', 'paid', 'meta',
  'deutsch', 'deutsche', 'deutscher', 'deutschen', 'deutschsprachig', 'deutschsprachige', 'deutschsprachigen', 'deutschsprachiger', 'deutschland', 'dach',
  'authentisch', 'authentische', 'authentischen', 'ehrlich', 'ehrliche', 'ehrlichen', 'glaubwürdig', 'glaubwürdige', 'glaubwuerdig', 'professionell', 'professionelle',
  'kurz', 'kurze', 'kurzen', 'gut', 'gute', 'guten', 'passend', 'passende', 'passenden', 'cool', 'coole', 'sympathisch', 'sympathische', 'realistisch',
  'vergütung', 'verguetung', 'bezahlt', 'bezahlte', 'honorar', 'budget', 'preis', 'preise', 'euro', 'eur', 'ware', 'gegen', 'paket', 'pro',
  'follower', 'followers', 'reichweite', 'abonnenten', 'views', 'jahre', 'jahren', 'alt', 'alter',
  'thema', 'themen', 'bereich', 'bereichen', 'nische', 'nischen', 'branche', 'branchen', 'format', 'formate', 'skript', 'gestellt', 'hochkant',
  'männlich', 'männliche', 'männlichen', 'männlicher', 'maennlich', 'maennliche', 'maennlichen', 'maennlicher',
  'weiblich', 'weibliche', 'weiblichen', 'weiblicher', 'mann', 'männer', 'maenner', 'frau', 'frauen', 'male', 'female', 'men', 'women', 'damen', 'herren', 'jungs', 'mädchen', 'maedchen', 'typ', 'typen', 'kerl', 'mädel', 'mädels',
  'tiktok', 'instagram', 'insta', 'youtube', 'facebook', 'twitch', 'snapchat', 'linkedin',
  'beispiel', 'sollte', 'sollten', 'kommen', 'haben', 'macht', 'machen', 'erstellen', 'drehen', 'zeigen', 'kann', 'können',
]);

// Words handled by casting.ts filters so they are not double-enforced as raw profile text keywords
// (e.g. a Cap-Träger matched via reviewed capAvatar/capImage should not also require the word "cap" in topics).
const CASTING_TERM_PATTERNS: Record<string, RegExp> = {
  skateboard: /\b(?:longboard\w*|pennyboards?|rollbrett|skateboard\w*|skater\w*|skate|skaten|skating|skatien)\b/iu,
  cap: /\b(?:(?:baseball[- ]?)?caps?(?:[- ]?tr(?:ä|ae)ger\w*)?|kappentr(?:ä|ae)ger\w*|snapbacks?)\b/iu,
  inline: /\b(?:inline[- ]?skat\w*|inlinern?)\b/iu,
  fashion: /\b(?:fashion|mode|streetwear|menswear|kleidung|bekleidung|outfits?)\b/iu,
};

export function extractMeaningfulKeywords(
  query: string,
  analysis: QueryAnalysis,
  requestedCastingFilters: CastingFilter[],
  removedCastingFilters: CastingFilter[],
): string[] {
  const allCastingFilters = new Set<CastingFilter>([...requestedCastingFilters, ...removedCastingFilters]);
  const hobbyTerms = new Set<string>();
  for (const filter of allCastingFilters) {
    if (filter.startsWith('hobby:')) hobbyTerms.add(filter.slice(6).toLowerCase());
  }

  const rawCandidates = [
    ...(Array.isArray(analysis.keywords) ? analysis.keywords : []),
    ...directorySearchWords(query),
  ];

  const locationLower = (analysis.location || '').toLowerCase();
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of rawCandidates) {
    const cleaned = String(raw || '')
      .toLowerCase()
      .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
      .trim();
    if (!cleaned || cleaned.length < 3) continue;
    if (/^\d+(?:[.,]\d+)?[km€]?$/i.test(cleaned)) continue;
    if (STOPWORDS.has(cleaned)) continue;
    if (locationLower && (cleaned === locationLower || LOCATION_WORDS.has(cleaned))) continue;
    if (hobbyTerms.has(cleaned)) continue;

    // Skip words already owned by a casting filter (active or explicitly removed by the user).
    let ownedByCasting = false;
    for (const [filterName, pattern] of Object.entries(CASTING_TERM_PATTERNS)) {
      if (allCastingFilters.has(filterName as CastingFilter) && pattern.test(cleaned)) {
        ownedByCasting = true;
        break;
      }
    }
    if (ownedByCasting) continue;

    // Also skip generic hobby trigger words
    if (cleaned === 'hobby' || cleaned === 'hobbys' || cleaned === 'hobbies') continue;

    if (!seen.has(cleaned)) {
      seen.add(cleaned);
      result.push(cleaned);
    }
  }

  return result;
}

export function textMatchesKeyword(text: string, keyword: string): boolean {
  if (!text || !keyword) return false;
  const kw = keyword.toLowerCase().trim();
  if (kw.length < 3) return false;

  // 1. Exact Unicode word boundary match
  if (wordBoundaryRegex(kw).test(text)) return true;

  // 2. For German words >= 5 chars, allow inflection / compound word start or clear compound noun match
  if (kw.length >= 5) {
    // Strip common German trailing inflection (-en, -er, -es, -e, -n, -s) when stem stays >= 5 chars
    const stem = kw.replace(/(?:innen|ern|en|er|es|em|e|n|s)$/u, '');
    const effectiveStem = stem.length >= 5 ? stem : kw;
    if (compoundPrefixRegex(effectiveStem).test(text)) return true;
    // Allow German compound ending when keyword is long & unambiguous (>= 6 chars, e.g. "kaffeemaschine" in "siebträger-kaffeemaschine" or "fotografie" in "produktfotografie")
    if (effectiveStem.length >= 6) {
      const compoundEnd = new RegExp(`[\\p{L}-]{0,20}${escapeRegExp(effectiveStem)}[\\p{L}]{0,5}(?![\\p{L}\\p{N}])`, 'iu');
      if (compoundEnd.test(text)) return true;
    }
  }

  return false;
}

/**
 * Parses follower counts cleanly from creator reach free text.
 * Handles German thousand separators (10.000), decimal k/m suffixes (1.5k, 2,5k, 1.25M),
 * ranges (10k - 20k -> 15000), and ignores years (seit 2024) and prices (250 €).
 */
export function calculateTotalReach(reachText: string): number {
  if (!reachText) return 0;

  // Remove years ("seit 2023", "ab 2024", "(2022)") and currency amounts ("250 €", "300 Euro")
  let cleaned = reachText
    .replace(/\b(?:seit|ab|stand|jahr)\s*(?:19|20)\d{2}\b/gi, ' ')
    .replace(/\((?:19|20)\d{2}\)/g, ' ')
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:€|(?:euro|eur)\b)/gi, ' ');

  // Normalize ranges like "10k - 20k" or "5.000 - 10.000" to a single midpoint number
  const parseSingleToken = (numRaw: string, suffixRaw: string): number => {
    const suffix = (suffixRaw || '').toLowerCase();
    let numStr = numRaw.trim();
    if (!suffix && /^\d{1,3}(?:\.\d{3})+$/.test(numStr)) {
      numStr = numStr.replace(/\./g, '');
    } else if (!suffix && /^\d{1,3}(?:,\d{3})+$/.test(numStr)) {
      numStr = numStr.replace(/,/g, '');
    } else {
      numStr = numStr.replace(',', '.');
    }
    let val = Number(numStr);
    if (!Number.isFinite(val)) return 0;
    if (suffix === 'k' || suffix === 'tsd') val *= 1_000;
    else if (suffix === 'm' || suffix === 'mio') val *= 1_000_000;
    return val;
  };

  cleaned = cleaned.replace(
    /(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*(k|tsd|mio|m)?\s*[-–—]\s*(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*(k|tsd|mio|m)?/gi,
    (_full, aNum, aSuf, bNum, bSuf) => {
      const a = parseSingleToken(aNum, aSuf || bSuf || '');
      const b = parseSingleToken(bNum, bSuf || '');
      if (a > 0 && b > 0) return String(Math.round((a + b) / 2));
      return String(Math.round(a || b));
    },
  );

  let total = 0;
  const tokenRe = /(?<![\p{L}\p{N}])(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*(k|tsd|mio|m)?(?![\p{L}\p{N}])/giu;
  for (const match of cleaned.matchAll(tokenRe)) {
    const value = parseSingleToken(match[1], match[2] || '');
    // Ignore isolated plausible calendar years without suffix if they look like 1990..2030 and appear alone?
    // Keep normal follower numbers (e.g. "2000" is valid, only skip if preceded by year word which we already stripped).
    if (value > 0 && value < 500_000_000) {
      total += value;
    }
  }

  return Math.round(Math.min(total, 2_000_000_000));
}

/**
 * Extracts a realistic single-video price in EUR from creator free text.
 * Prefers numbers directly tagged with €/Euro/EUR and ignores percentages ("10%") or counts ("3 Videos").
 */
export function parsePriceValue(priceText: string): number | null {
  if (!priceText) return null;
  const cleaned = priceText
    .replace(/\d+\s*%/g, ' ')
    .replace(/\b\d+\s*(?:videos?|fotos?|bilder|clips?|reels?|hooks?|sek(?:unden)?|tage|wochen|monate)\b/gi, ' ');

  // 1. Prefer explicit currency values ("180 €", "ab 250 Euro", "€ 300", "1.200 €")
  const explicitAfter = cleaned.match(/(\d{1,2}\.\d{3}|\d{2,5})\s*(?:€|(?:euro|eur)\b)/i);
  if (explicitAfter) {
    const val = Number(explicitAfter[1].replace(/\./g, ''));
    if (val >= 20 && val <= 50_000) return val;
  }
  const explicitBefore = cleaned.match(/(?:€|euro|eur)\s*(\d{1,2}\.\d{3}|\d{2,5})\b/i);
  if (explicitBefore) {
    const val = Number(explicitBefore[1].replace(/\./g, ''));
    if (val >= 20 && val <= 50_000) return val;
  }

  // 2. Fallback: standalone plausible EUR price (30..50000)
  const fallback = cleaned.match(/(?<![\d.,])(\d{1,2}\.\d{3}|\d{2,5})(?![\d.,])/);
  if (fallback) {
    const val = Number(fallback[1].replace(/\./g, ''));
    if (val >= 30 && val <= 50_000) return val;
  }

  return null;
}

export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function parseFollowerToken(raw: string): number {
  const lower = raw.toLowerCase().trim();
  let multiplier = 1;
  let numStr = lower;
  if (lower.endsWith('mio')) {
    multiplier = 1_000_000;
    numStr = lower.slice(0, -3);
  } else if (lower.endsWith('m')) {
    multiplier = 1_000_000;
    numStr = lower.slice(0, -1);
  } else if (lower.endsWith('tsd')) {
    multiplier = 1_000;
    numStr = lower.slice(0, -3);
  } else if (lower.endsWith('k')) {
    multiplier = 1_000;
    numStr = lower.slice(0, -1);
  } else if (/^\d{1,3}(?:\.\d{3})+$/.test(numStr)) {
    numStr = numStr.replace(/\./g, '');
  }
  const value = parseFloat(numStr.replace(',', '.'));
  return Number.isFinite(value) ? Math.round(value * multiplier) : 0;
}

/**
 * Deterministic query analyzer used as fast path for pure casting queries and reliable fallback
 * whenever OpenRouter is unavailable or unconfigured.
 */
export function analyzeQueryDeterministically(query: string): QueryAnalysis {
  const analysis: QueryAnalysis = {
    gender: 'any',
    platforms: [],
    topics: [],
    minFollowers: 0,
    maxFollowers: null,
    ageRange: { min: null, max: null },
    location: null,
    priceRange: { min: null, max: null },
    keywords: [],
  };

  const queryLower = query.toLowerCase();

  // 1. Gender via casting.ts (includes Mama, Papa, Creatorin, etc.)
  const detectedCasting = castingFilters(query);
  const castingGender = detectedCasting.find((f) => f === 'male' || f === 'female');
  if (castingGender) analysis.gender = castingGender;

  // 2. Platforms (word boundaries)
  if (/\btiktok\b/i.test(queryLower)) analysis.platforms.push('tiktok');
  if (/\b(?:instagram|insta)\b/i.test(queryLower)) analysis.platforms.push('instagram');
  if (/\b(?:youtube|yt|youtu\.be)\b/i.test(queryLower)) analysis.platforms.push('youtube');
  if (/\b(?:facebook|fb)\b/i.test(queryLower)) analysis.platforms.push('facebook');
  if (/\btwitch\b/i.test(queryLower)) analysis.platforms.push('twitch');
  if (/\bsnapchat\b/i.test(queryLower)) analysis.platforms.push('snapchat');

  // 3. Topics (strict word-boundary & compound rules, plus typo tolerance ONLY for words >= 6 chars with dist <= 1)
  const detectedTopics = detectTopicsInText(query);
  const topicSet = new Set(detectedTopics);
  const queryWords = queryLower.split(/[^\p{L}\d-]+/u).filter((w) => w.length >= 6);
  for (const [topic, rule] of Object.entries(TOPIC_RULES)) {
    if (topicSet.has(topic)) continue;
    const typoHit = rule.exactTerms.some((term) =>
      term.length >= 6 &&
      queryWords.some((word) => Math.abs(word.length - term.length) <= 1 && levenshteinDistance(word, term) <= 1),
    );
    if (typoHit) topicSet.add(topic);
  }
  analysis.topics = [...topicSet];

  // 4. Follower thresholds (require follower/abonnenten/reichweite OR k/m/mio suffix so they never collide with age/budget)
  const minFollowerPatterns = [
    /(?:mehr als|mindestens|ab|über|ueber)\s*(\d+(?:[.,]\d+)?(?:k|m|mio|tsd)|\d{1,3}(?:\.\d{3})+)\s*(?:follower|abonnenten|reichweite)?/i,
    /(\d+(?:[.,]\d+)?(?:k|m|mio|tsd)|\d{1,3}(?:\.\d{3})+)\s*(?:follower|abonnenten)\s*(?:oder mehr|\+)/i,
    /(?:mehr als|mindestens|über|ueber)\s*(\d{3,7})\s*(?:follower|abonnenten)/i,
  ];
  for (const pattern of minFollowerPatterns) {
    const match = queryLower.match(pattern);
    if (match?.[1]) {
      const parsed = parseFollowerToken(match[1]);
      if (parsed >= 100) {
        analysis.minFollowers = parsed;
        break;
      }
    }
  }

  const maxFollowerPatterns = [
    /(?:weniger als|maximal|höchstens|hoechstens|unter|bis)\s*(\d+(?:[.,]\d+)?(?:k|m|mio|tsd)|\d{1,3}(?:\.\d{3})+)\s*(?:follower|abonnenten|reichweite)?/i,
    /(?:weniger als|maximal|höchstens|hoechstens|unter|bis)\s*(\d{3,7})\s*(?:follower|abonnenten)/i,
  ];
  for (const pattern of maxFollowerPatterns) {
    const match = queryLower.match(pattern);
    if (match?.[1]) {
      const parsed = parseFollowerToken(match[1]);
      if (parsed >= 100) {
        analysis.maxFollowers = parsed;
        break;
      }
    }
  }

  // 5. Price range (MUST have currency OR budget/preis/honorar context so it NEVER collides with age!)
  const priceRangeMatch = queryLower.match(
    /(?:budget|preis|honorar)?\s*(?:zwischen\s*)?(\d{1,2}\.\d{3}|\d{2,5})\s*(?:€|euro|eur)?\s*(?:-|–|—|bis)\s*(\d{1,2}\.\d{3}|\d{2,5})\s*(?:€|euro|eur)/i,
  );
  if (priceRangeMatch) {
    analysis.priceRange.min = Number(priceRangeMatch[1].replace(/\./g, ''));
    analysis.priceRange.max = Number(priceRangeMatch[2].replace(/\./g, ''));
  } else {
    const priceMaxMatch =
      queryLower.match(/(?:bis|maximal|max\.?|unter|höchstens|hoechstens)\s*(\d{1,2}\.\d{3}|\d{2,5})\s*(?:€|(?:euro|eur)\b)/i)
      || queryLower.match(/(?:budget|preis|honorar)\s*(?:von\s*)?(?:bis|maximal|max\.?|unter)\s*(\d{1,2}\.\d{3}|\d{2,5})\b/i);
    const priceMinMatch =
      queryLower.match(/(?:ab|mindestens|über|ueber)\s*(\d{1,2}\.\d{3}|\d{2,5})\s*(?:€|(?:euro|eur)\b)/i)
      || queryLower.match(/(?:budget|preis|honorar)\s*(?:ab|mindestens)\s*(\d{1,2}\.\d{3}|\d{2,5})\b/i);
    if (priceMaxMatch) analysis.priceRange.max = Number(priceMaxMatch[1].replace(/\./g, ''));
    if (priceMinMatch) analysis.priceRange.min = Number(priceMinMatch[1].replace(/\./g, ''));
  }

  // 6. Age range (strip currency/follower/child-age parenthetical phrases first so "bis 500 €" or "Kindern (2 bis 8 Jahre)" never pollute creator age!)
  const ageQuery = queryLower
    .replace(/\b(?:budget|preis|honorar)[^,.;]*/gi, ' ')
    .replace(/\d+(?:[.,]\d+)?\s*(?:€|(?:euro|eur|k|m|mio|tsd|follower|abonnenten)\b)/gi, ' ')
    .replace(/\b(?:kind(?:ern|er)?|baby\w*|kleinkind\w*)\s*\([^)]*\)/gi, ' ');

  const isPlausibleCreatorAge = (n: number) => Number.isInteger(n) && n >= 16 && n <= 80;
  const ageRangeMatch = ageQuery.match(/(?:zwischen\s*)?(\d{2})\s*(?:-|–|—|bis|und)\s*(\d{2})(?:\s*(?:jahren|jahre|j\.))?(?!\d)/i);
  if (ageRangeMatch && isPlausibleCreatorAge(Number(ageRangeMatch[1])) && isPlausibleCreatorAge(Number(ageRangeMatch[2]))) {
    const a = Number(ageRangeMatch[1]);
    const b = Number(ageRangeMatch[2]);
    analysis.ageRange.min = Math.min(a, b);
    analysis.ageRange.max = Math.max(a, b);
  } else {
    const agePlusMatch = ageQuery.match(/\b(\d{2})\s*\+(?:\s*(?:jahre|jahren))?/i);
    const ageMinMatch = ageQuery.match(/\b(?:ab|über|ueber|mindestens|älter als)\s*(\d{2})(?!\d)(?:\s*(?:jahre|jahren))?/i);
    const ageMaxMatch = ageQuery.match(/\b(?:unter|bis|maximal|jünger als)\s*(\d{2})(?!\d)(?:\s*(?:jahre|jahren))?/i);
    if (agePlusMatch && isPlausibleCreatorAge(Number(agePlusMatch[1]))) {
      analysis.ageRange.min = Number(agePlusMatch[1]);
    } else if (ageMinMatch && isPlausibleCreatorAge(Number(ageMinMatch[1]))) {
      analysis.ageRange.min = Number(ageMinMatch[1]);
    }
    if (ageMaxMatch && isPlausibleCreatorAge(Number(ageMaxMatch[1]))) {
      analysis.ageRange.max = Number(ageMaxMatch[1]);
    }
  }

  // 7. Location (word boundaries)
  for (const loc of KNOWN_LOCATIONS) {
    if (loc.aliases.some((alias) => wordBoundaryRegex(alias).test(queryLower))) {
      analysis.location = loc.canonical;
      break;
    }
  }

  // 8. Keywords (filtered stopwords, keep meaningful tokens >= 3 chars)
  const words = queryLower
    .split(/[^\p{L}\d-]+/u)
    .map((w) => w.replace(/^-+|-+$/g, ''))
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word) && !/^\d+$/.test(word));
  analysis.keywords = [...new Set(words)];

  return analysis;
}

export function evaluateCreatorRelevance(
  profile: SearchableCreatorProfile,
  analysis: QueryAnalysis,
  meaningfulKeywords: string[],
  hasNonGenderCastingEvidence = false,
): CreatorRelevanceEvaluation {
  const matchedTopics: string[] = [];
  for (const topic of analysis.topics) {
    if (textMatchesTopic(profile.topicSearchText, topic)) {
      matchedTopics.push(topic);
    }
  }

  const matchedKeywords: string[] = [];
  for (const kw of meaningfulKeywords) {
    if (textMatchesKeyword(profile.searchableText, kw)) {
      matchedKeywords.push(kw);
    }
  }

  const specificTopics = analysis.topics.filter((t) => t !== 'lifestyle');
  const matchedSpecificTopics = matchedTopics.filter((t) => t !== 'lifestyle');
  const hasThematicRequirement =
    (analysis.topics.length > 0 || meaningfulKeywords.length > 0) && !hasNonGenderCastingEvidence;
  // When specific niches (e.g. automotive, family, pets) are requested alongside generic "lifestyle",
  // require matching a specific niche or non-generic keyword so generic lifestyle creators don't dilute results.
  const hasThematicMatch = specificTopics.length > 0
    ? matchedSpecificTopics.length > 0 || matchedKeywords.some((kw) => kw !== 'lifestyle' && kw !== 'alltag')
    : matchedTopics.length > 0 || matchedKeywords.length > 0;

  // Adjacent topics for genuine "alternatives" ONLY when there is no exact thematic match
  const matchedRelatedTopics: string[] = [];
  if (hasThematicRequirement && !hasThematicMatch && analysis.topics.length > 0) {
    const candidateRelated = new Set<string>();
    for (const topic of analysis.topics) {
      const rule = TOPIC_RULE_BY_NAME.get(topic);
      if (rule) {
        for (const rel of rule.relatedTopics) {
          if (!analysis.topics.includes(rel)) candidateRelated.add(rel);
        }
      }
    }
    for (const rel of candidateRelated) {
      if (textMatchesTopic(profile.topicSearchText, rel)) {
        matchedRelatedTopics.push(rel);
      }
    }
  }
  const hasRelatedThematicMatch = matchedRelatedTopics.length > 0;

  // Relevance score (dominates quality score!)
  let relevanceScore = 0;

  if (analysis.topics.length > 0) {
    const topicRatio = matchedTopics.length / analysis.topics.length;
    relevanceScore += matchedTopics.length * 120 + Math.round(topicRatio * 60);
  }

  if (meaningfulKeywords.length > 0) {
    const kwRatio = matchedKeywords.length / meaningfulKeywords.length;
    relevanceScore += Math.min(matchedKeywords.length * 65, 260) + Math.round(kwRatio * 50);
  }

  // Focus & Specialization adjustment:
  // Strongly favor niche specialists whose primary topics/AI summary match the query over
  // broad 12+ buzzword "Bauchladen" profiles (e.g. "Hauptgebiet: Beauty/Fashion ... Nebengebiet: Auto").
  let isWeakSecondaryOnly = false;
  if (hasThematicRequirement && hasThematicMatch) {
    const primaryTopicsLower = (profile.topicsText.split('·')[0] || '').toLowerCase();
    const aiConfirmedText = [profile.aiSummary || '', (profile.aiNiches || []).join(' ')].join(' ').toLowerCase();
    const secondarySplit = primaryTopicsLower.split(/\bnebengebiet(?:e)?\s*:/i);
    const mainAreaText = secondarySplit[0] || '';
    const hasExplicitSecondarySection = secondarySplit.length > 1;

    const matchesText = (text: string) =>
      matchedTopics.some((t) => textMatchesTopic(text, t)) ||
      matchedKeywords.some((kw) => textMatchesKeyword(text, kw));

    const matchedInMainArea = matchesText(mainAreaText);
    const matchedInAiSummary = aiConfirmedText ? matchesText(aiConfirmedText) : false;

    // Count how many distinct non-lifestyle topic buckets the creator claims overall
    const claimedBuckets = detectTopicsInText(profile.topicSearchText).filter((t) => t !== 'lifestyle').length;
    const topicListCount = primaryTopicsLower
      .split(/[,;\n/]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 2).length;

    if (matchedInAiSummary) {
      relevanceScore += 60;
    }

    if (hasExplicitSecondarySection && !matchedInMainArea && !matchedInAiSummary) {
      // Explicitly listed only under "Nebengebiete:" (e.g., Hauptgebiet Beauty/Fashion, Nebengebiet Automotive)
      relevanceScore -= 95;
      isWeakSecondaryOnly = true;
    } else if (primaryTopicsLower && !matchedInMainArea && !matchedInAiSummary) {
      // Mentioned only in special_traits / equipment (e.g., "ich habe ein eigenes Auto") or pet/child context
      const matchedInDedicatedContext =
        (analysis.topics.includes('family') && Boolean(profile.childrenContext) && matchesText(profile.childrenContext.toLowerCase())) ||
        (analysis.topics.includes('pets') && Boolean(profile.petContext) && matchesText(profile.petContext.toLowerCase()));
      if (!matchedInDedicatedContext) {
        relevanceScore -= 65;
      }
    } else if (matchedInMainArea) {
      // Check prominence: did the requested niche appear early in the creator's primary topics?
      const firstThird = mainAreaText.slice(0, Math.max(45, Math.ceil(mainAreaText.length * 0.4)));
      const isProminent = matchesText(firstThird);

      if (claimedBuckets <= 4 && topicListCount <= 6) {
        relevanceScore += 60;
      } else if (claimedBuckets <= 6 && topicListCount <= 9) {
        relevanceScore += 25;
      } else if ((claimedBuckets >= 7 || topicListCount >= 10) && !isProminent && !matchedInAiSummary) {
        // Broad 10+ topic list where the requested topic is buried near the end
        relevanceScore -= 75;
        isWeakSecondaryOnly = true;
      }

      if (isProminent) {
        relevanceScore += 45;
      }
    }
  }

  if (hasNonGenderCastingEvidence) {
    relevanceScore += 140;
  }

  // Platform match
  if (analysis.platforms.length > 0) {
    let matchedPlatforms = 0;
    for (const platform of analysis.platforms) {
      if (profile.platforms[platform as keyof typeof profile.platforms]) {
        matchedPlatforms += 1;
      }
    }
    if (matchedPlatforms > 0) {
      relevanceScore += matchedPlatforms * 35;
    } else {
      relevanceScore -= 20;
    }
  }

  // Reach / follower bounds
  const totalReach = profile.totalReach;
  if (analysis.minFollowers > 0 && analysis.maxFollowers) {
    if (totalReach >= analysis.minFollowers && totalReach <= analysis.maxFollowers) {
      const ideal = (analysis.minFollowers + analysis.maxFollowers) / 2;
      const dist = Math.abs(totalReach - ideal) / Math.max(ideal, 1);
      relevanceScore += Math.round(40 * (1 - Math.min(dist, 1)));
    } else if (totalReach > 0) {
      relevanceScore -= 40;
    } else {
      relevanceScore -= 10;
    }
  } else if (analysis.minFollowers > 0) {
    if (totalReach >= analysis.minFollowers) {
      relevanceScore += 35;
    } else if (totalReach > 0) {
      relevanceScore -= 40;
    } else {
      relevanceScore -= 10;
    }
  } else if (analysis.maxFollowers) {
    if (totalReach > 0 && totalReach <= analysis.maxFollowers) {
      relevanceScore += 35;
    } else if (totalReach > analysis.maxFollowers) {
      relevanceScore -= 40;
    }
  }

  // Age range
  let ageExcluded = false;
  if (analysis.ageRange.min !== null || analysis.ageRange.max !== null) {
    if (profile.age === null) {
      relevanceScore -= 10;
    } else {
      const belowBy = analysis.ageRange.min !== null ? analysis.ageRange.min - profile.age : 0;
      const aboveBy = analysis.ageRange.max !== null ? profile.age - analysis.ageRange.max : 0;
      if (belowBy > 0 || aboveBy > 0) {
        relevanceScore -= 80;
        if (belowBy > 6 || aboveBy > 6) ageExcluded = true;
      } else {
        relevanceScore += 45;
      }
    }
  }

  // Location match
  if (analysis.location) {
    const locLower = analysis.location.toLowerCase();
    const locEntry = KNOWN_LOCATIONS.find((l) => l.canonical === locLower);
    const aliases = locEntry ? [locEntry.canonical, ...locEntry.aliases] : [locLower];
    if (aliases.some((alias) => profile.locationLower.includes(alias))) {
      relevanceScore += 50;
    } else if (profile.location) {
      relevanceScore -= 15;
    }
  }

  // Price range
  if (profile.priceValue !== null && (analysis.priceRange.min !== null || analysis.priceRange.max !== null)) {
    const belowMin = analysis.priceRange.min !== null && profile.priceValue < analysis.priceRange.min;
    const aboveMax = analysis.priceRange.max !== null && profile.priceValue > analysis.priceRange.max;
    if (belowMin || aboveMax) {
      relevanceScore -= 45;
    } else {
      relevanceScore += 30;
    }
  }

  // Quality & tie-breaker signals (intentionally capped well below thematic relevance!)
  let qualityScore = 0;
  if (profile.portfolioText) qualityScore += 8;
  if (profile.formatsText) qualityScore += 5;
  if (profile.contactReachable) qualityScore += 10;
  if (profile.hasCustomImage) qualityScore += 4;
  if (analysis.minFollowers === 0 && !analysis.maxFollowers && totalReach > 0) {
    qualityScore += Math.min(Math.log10(totalReach) * 2.5, 12);
  }

  const totalScore = Math.round(relevanceScore + qualityScore);

  if (ageExcluded) {
    return {
      matchedTopics,
      matchedKeywords,
      matchedRelatedTopics,
      hasThematicRequirement,
      hasThematicMatch,
      hasRelatedThematicMatch,
      relevanceScore,
      qualityScore,
      totalScore,
      hardExcluded: true,
      exclusionReason: 'age',
    };
  }

  if (hasThematicRequirement && (!hasThematicMatch || isWeakSecondaryOnly)) {
    const fallbackAsRelated = isWeakSecondaryOnly || hasRelatedThematicMatch;
    const relatedLabel = isWeakSecondaryOnly
      ? `Nebengebiet / breites Profil: ${matchedTopics.map(getTopicLabel).join(', ') || matchedKeywords.slice(0, 2).join(', ')}`
      : hasRelatedThematicMatch
        ? `Verwandter Bereich: ${matchedRelatedTopics.map(getTopicLabel).join(', ')}`
        : undefined;
    return {
      matchedTopics,
      matchedKeywords,
      matchedRelatedTopics,
      hasThematicRequirement,
      hasThematicMatch: false,
      hasRelatedThematicMatch: fallbackAsRelated,
      relevanceScore,
      qualityScore,
      totalScore,
      hardExcluded: !fallbackAsRelated,
      exclusionReason: fallbackAsRelated ? undefined : 'relevance',
      relatedReason: relatedLabel,
    };
  }

  // Build concise factual deterministic match summary
  const matchParts: string[] = [];
  if (matchedTopics.length > 0) {
    matchParts.push(matchedTopics.map(getTopicLabel).join(', '));
  }
  if (matchedKeywords.length > 0) {
    const kwList = matchedKeywords.slice(0, 3).map((w) => `„${w}“`).join(', ');
    matchParts.push(`Treffer für ${kwList}`);
  }
  if (analysis.location && profile.locationLower.includes(analysis.location.toLowerCase())) {
    matchParts.push(`Region ${profile.location}`);
  }
  if (isWeakSecondaryOnly) {
    matchParts.push('Nebengebiet / breites Profil');
  }

  return {
    matchedTopics,
    matchedKeywords,
    matchedRelatedTopics,
    hasThematicRequirement,
    hasThematicMatch,
    hasRelatedThematicMatch,
    relevanceScore,
    qualityScore,
    totalScore,
    hardExcluded: false,
    matchReason: matchParts.length > 0 ? matchParts.join(' · ') : undefined,
  };
}

export function generateReasoning(analysis: QueryAnalysis, meaningfulKeywords: string[] = []): string {
  const parts: string[] = ['1. Erkannte Suchkriterien'];

  if (analysis.gender === 'male') parts.push('• Geschlecht: Männliche Creator');
  else if (analysis.gender === 'female') parts.push('• Geschlecht: Weibliche Creator');

  if (analysis.topics.length > 0) {
    parts.push(`• Themen: ${analysis.topics.map(getTopicLabel).join(', ')}`);
  }

  if (meaningfulKeywords.length > 0) {
    parts.push(`• Schlüsselbegriffe: ${meaningfulKeywords.slice(0, 6).join(', ')}`);
  }

  if (analysis.platforms.length > 0) {
    const formatted = analysis.platforms.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(', ');
    parts.push(`• Plattformen: ${formatted}`);
  }

  if (analysis.location) {
    const loc = analysis.location.charAt(0).toUpperCase() + analysis.location.slice(1);
    parts.push(`• Region: ${loc}`);
  }

  if (analysis.ageRange.min !== null || analysis.ageRange.max !== null) {
    if (analysis.ageRange.min !== null && analysis.ageRange.max !== null) {
      parts.push(`• Alter: ${analysis.ageRange.min}–${analysis.ageRange.max} Jahre`);
    } else if (analysis.ageRange.min !== null) {
      parts.push(`• Alter: ab ${analysis.ageRange.min} Jahren`);
    } else if (analysis.ageRange.max !== null) {
      parts.push(`• Alter: bis ${analysis.ageRange.max} Jahre`);
    }
  }

  if (analysis.priceRange.min !== null || analysis.priceRange.max !== null) {
    if (analysis.priceRange.min !== null && analysis.priceRange.max !== null) {
      parts.push(`• Budget: ${analysis.priceRange.min}–${analysis.priceRange.max} €`);
    } else if (analysis.priceRange.max !== null) {
      parts.push(`• Budget: bis ${analysis.priceRange.max} €`);
    } else if (analysis.priceRange.min !== null) {
      parts.push(`• Budget: ab ${analysis.priceRange.min} €`);
    }
  }

  if (analysis.minFollowers > 0 || analysis.maxFollowers) {
    if (analysis.minFollowers > 0 && analysis.maxFollowers) {
      parts.push(`• Reichweite: ${analysis.minFollowers.toLocaleString('de-DE')}–${analysis.maxFollowers.toLocaleString('de-DE')} Follower`);
    } else if (analysis.minFollowers > 0) {
      parts.push(`• Mindestreichweite: ${analysis.minFollowers.toLocaleString('de-DE')} Follower`);
    } else if (analysis.maxFollowers) {
      parts.push(`• Maximale Reichweite: ${analysis.maxFollowers.toLocaleString('de-DE')} Follower`);
    }
  }

  parts.push('');
  parts.push('2. Auswahl & Sortierung');
  parts.push('• Relevanz-Gate: Profile ohne thematischen Bezug zur Anfrage werden nicht in die Haupttreffer gemischt.');
  parts.push('• Priorisierung: Themen-, Stichwort- und Profilpassung stehen deutlich über Reichweite und Formalmerkmalen.');

  return parts.join('\n');
}

export type PublicSearchCard = {
  id: string;
  name: string;
  image: string;
  reach: string;
  networks: string[];
  priceRange: string;
  contactReachable: boolean;
  city: string;
  topics: string;
  preferredContent: string;
  gender: string | undefined;
  evidence?: CastingEvidence[];
  matchReason?: string;
};

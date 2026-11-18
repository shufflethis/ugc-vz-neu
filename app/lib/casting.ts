import { safePortfolioUrl } from './creator-public';

const castingLabels = {
  male: 'Männlich',
  female: 'Weiblich',
  skateboard: 'Skateboard',
  cap: 'Cap sichtbar',
  fashion: 'Fashion',
  inline: 'Inline-Skating',
};
export type CastingFilter = keyof typeof castingLabels | `hobby:${string}`;
export function castingLabel(filter: CastingFilter) {
  if (filter in castingLabels) return castingLabels[filter as keyof typeof castingLabels];
  return 'Hobby · ' + filter.slice(6);
}
export type CastingWork = {
  id: string;
  url: string;
  title: string | null;
  skateboard: boolean;
  capImage: string | null;
};
export type CastingEvidence = { label: string; url?: string; image?: string; imageAlt?: string };
export type CastingProfile = {
  normalizedGender: string;
  topicsText: string;
  formatsText: string;
  works: CastingWork[];
  capAvatar?: string;
};

const skateWord = /\b(?:longboard(?:s|en|ing)?|pennyboards?|rollbrett|skateboard(?:s|ing|en|fahren|er(?:in(?:nen)?|n|s)?)?|skater(?:in(?:nen)?|n|s)?|skate|skaten|skating)\b/i;
const capWord = /\b(?:(?:baseball[- ]?)?caps?(?![- ]?cut\b)(?:[- ]?tr(?:ä|ae)ger(?:in(?:nen)?|n)?)?|kappentr(?:ä|ae)ger(?:in(?:nen)?|n)?|snapbacks?)\b/i;
const inlineWord = /\b(?:inline[- ]?skat(?:ing|en|es?|er(?:in(?:nen)?)?)|inlinern?)\b/i;
const fashionWord = /\b(?:fashion|mode|streetwear|menswear|kleidung|bekleidung|outfits?)\b/i;
const boardSport = /\b(?:snowboard\w*|wakeboard\w*|bmx|parkour|surfen|surfer|surfing|boardsport\w*)\b/i;
const sportWord = /\b(?:sport|fitness|outdoor|fußball|fussball|training)\b/i;
const hobbyPhrase = /\bhobby(?:s)?(?:\s+ist)?[\s:]+([\p{L}][\p{L}-]{2,39})(?![\p{L}-])/iu;
const genderWords = {
  male: /\b(?:m(?:ä|ae)nnlich(?:e[rmns]?)?|m(?:ä|ae)nner[n]?|mann|man|men|male|herren|jungs)\b/i,
  female: /\b(?:weiblich(?:e[rmns]?)?|frau(?:en)?|wom[ae]n|female|creatorin(?:nen)?|damen|m(?:ä|ae)dchen|skaterin(?:nen)?)\b/i,
};

export function castingFilters(query: string): CastingFilter[] {
  const filters: CastingFilter[] = [];
  const male = genderWords.male.test(query);
  const female = genderWords.female.test(query);
  if (male !== female) filters.push(male ? 'male' : 'female');
  if (inlineWord.test(query)) filters.push('inline');
  if (skateWord.test(query.replace(new RegExp(inlineWord, 'gi'), '')) || /\bskatien\b/i.test(query)) filters.push('skateboard');
  if (fashionWord.test(query)) filters.push('fashion');
  if (capWord.test(query)) filters.push('cap');
  const hobby = query.match(hobbyPhrase)?.[1];
  if (hobby && !/^(und|oder|als|ist|mit|für|ein\w*|creator\w*)$/i.test(hobby)
      && !castingFilters(hobby).length && !inlineWord.test(query)) {
    filters.push(`hobby:${hobby.toLowerCase()}`);
  }
  return filters;
}

export function directorySearchWords(query: string) {
  const filler = /^(ich|wir|suche[n]?|nach|für|mit|und|der|die|das|in|aus|ein(?:e[rmns]?)?|creators?|hobbys?|hobbies|als|gerne?)$/i;
  return query.replace(inlineWord, ' ').replace(hobbyPhrase, ' ').toLowerCase().split(/[^\p{L}\d-]+/u)
    .filter(word => word && !filler.test(word) && !castingFilters(word).length);
}

function mention(text: string, pattern: RegExp) {
  return text.split(/[\n,;.!?·]+/).map(part => part.trim()).find(part =>
    pattern.test(part) && !/\b(?:kein\w*|ohne|nicht|never|no)\b/i.test(part)
    && (pattern !== skateWord || !/\b(?:inline|roller|ice|figure)[- ]skat/i.test(part)));
}

function passage(text: string, pattern: RegExp) {
  const start = Math.max(0, text.search(pattern) - 50);
  return 'Profilangabe · „' + (start ? '…' : '') + text.slice(start, start + 125) + (text.length > start + 125 ? '…' : '') + '“';
}

/** An empty list is a valid match. Null means at least one required filter failed. */
export function matchCasting(profile: CastingProfile, filters: CastingFilter[]): CastingEvidence[] | null {
  const evidence: CastingEvidence[] = [];
  for (const filter of filters) {
    if (filter === 'male' || filter === 'female') {
      if (profile.normalizedGender !== filter) return null;
      continue;
    }
    if (filter === 'cap') {
      const work = profile.works.find(item => item.capImage && safePortfolioUrl(item.capImage)?.startsWith('https:') && safePortfolioUrl(item.url));
      if (work) {
        evidence.push({ label: 'Cap sichtbar · Arbeitsprobe ansehen', url: safePortfolioUrl(work.url)!, image: work.capImage! });
      } else if (profile.capAvatar) {
        evidence.push({ label: 'Cap auf dem Profilbild ansehen', url: profile.capAvatar, image: profile.capAvatar, imageAlt: 'Geprüftes Profilbild mit Cap' });
      } else return null;
      continue;
    }
    // Hobby filters are built above from letters and hyphens only.
    const pattern = filter.startsWith('hobby:') ? new RegExp('(?<![\\p{L}])' + filter.slice(6) + '(?![\\p{L}])', 'iu') :
      filter === 'fashion' ? fashionWord : filter === 'inline' ? inlineWord : skateWord;
    const work = profile.works.find(item => safePortfolioUrl(item.url) && ((filter === 'skateboard' && item.skateboard) || mention(item.title || '', pattern)));
    if (work) {
      evidence.push({ label: castingLabel(filter) + ' · Arbeitsprobe ansehen', url: safePortfolioUrl(work.url)! });
      continue;
    }
    const quote = mention(profile.topicsText, pattern) || mention(profile.formatsText, pattern);
    if (!quote) return null;
    evidence.push({ label: passage(quote, pattern) });
  }
  return evidence;
}

// Alternatives retain gender and any other required filters. The source passage
// explains why a profile may suit the briefing while the requested skill is open.
export function relatedCasting(profile: CastingProfile, filters: CastingFilter[]) {
  const visual = filters.filter(f => f === 'skateboard' || f === 'cap');
  if (visual.length !== 1) return null;
  const wanted = visual[0];
  const evidence = matchCasting(profile, filters.filter(f => f !== wanted));
  if (!evidence) return null;
  const text = [profile.topicsText, profile.formatsText].join(' · ');
  const patterns = wanted === 'cap' ? [/\bstreetwear\b/i, fashionWord] : [boardSport, /\bstreetwear\b/i, sportWord];
  for (const [index, pattern] of patterns.entries()) {
    const quote = mention(text, pattern);
    if (!quote) continue;
    const reason = wanted === 'cap' ? 'Cap auf Anfrage' : 'Skateboard-Erfahrung offen';
    return {
      priority: patterns.length - index,
      evidence: [...evidence, { label: passage(quote, pattern) + ' · ' + reason }],
    };
  }
  return null;
}

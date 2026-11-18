import { safePortfolioUrl } from './creator-public';

export const castingLabels = {
  male: 'Männlich',
  female: 'Weiblich',
  skateboard: 'Skateboard',
  cap: 'Cap sichtbar',
};
export type CastingFilter = keyof typeof castingLabels;
export type CastingWork = {
  id: string;
  url: string;
  title: string | null;
  skateboard: boolean;
  capImage: string | null;
};
export type CastingEvidence = { label: string; url?: string; image?: string };
export type CastingProfile = {
  normalizedGender: string;
  topicsText: string;
  formatsText: string;
  works: CastingWork[];
};

const skateWord = /\b(?:skateboard(?:s|ing|en|er(?:in(?:nen)?|n|s)?)?|skater(?:in(?:nen)?|n|s)?|skate|skaten|skating)\b/i;
const capWord = /\b(?:(?:baseball[- ]?)?caps?(?:[- ]?tr(?:ä|ae)ger(?:in(?:nen)?|n)?)?|kappentr(?:ä|ae)ger(?:in(?:nen)?|n)?|snapbacks?)\b/i;
const genderWords = {
  male: /\b(?:m(?:ä|ae)nnlich(?:e[rmns]?)?|m(?:ä|ae)nner[n]?|mann|man|men|male|herren|jungs)\b/i,
  female: /\b(?:weiblich(?:e[rmns]?)?|frau(?:en)?|wom[ae]n|female|creatorin(?:nen)?|damen|m(?:ä|ae)dchen|skaterin(?:nen)?)\b/i,
};

export function castingFilters(query: string): CastingFilter[] {
  const filters: CastingFilter[] = [];
  const male = genderWords.male.test(query);
  const female = genderWords.female.test(query);
  if (male !== female) filters.push(male ? 'male' : 'female');
  if (skateWord.test(query)) filters.push('skateboard');
  if (capWord.test(query)) filters.push('cap');
  return filters;
}

export function directorySearchWords(query: string) {
  const filler = /^(ich|wir|suche[n]?|nach|für|mit|und|der|die|das|in|aus|ein(?:e[rmns]?)?|creators?)$/i;
  return query.toLowerCase().split(/[^\p{L}\d-]+/u)
    .filter(word => word && !filler.test(word) && !castingFilters(word).length);
}

function skateMention(text: string) {
  // Keep the actual short passage so the casting team can check the context.
  return text.split(/[\n,;.!?·]+/).map(part => part.trim()).find(part =>
    skateWord.test(part) && !/\b(?:kein\w*|ohne|nicht|never|no)\b/i.test(part)
    && !/\b(?:inline|roller|ice|figure)[- ]skat/i.test(part));
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
      if (!work) return null;
      evidence.push({ label: 'Cap sichtbar · Arbeitsprobe ansehen', url: safePortfolioUrl(work.url)!, image: work.capImage! });
      continue;
    }
    const work = profile.works.find(item => safePortfolioUrl(item.url) && (item.skateboard || skateMention(item.title || '')));
    if (work) {
      evidence.push({ label: 'Skateboard · Arbeitsprobe ansehen', url: safePortfolioUrl(work.url)! });
      continue;
    }
    const mention = skateMention(profile.topicsText) || skateMention(profile.formatsText);
    if (!mention) return null;
    const start = Math.max(0, mention.search(skateWord) - 55);
    evidence.push({ label: 'Profilangabe · „' + (start ? '…' : '') + mention.slice(start, start + 140) + (mention.length > start + 140 ? '…' : '') + '“' });
  }
  return evidence;
}

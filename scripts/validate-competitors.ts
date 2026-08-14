import { VERIFIED_AT_LABEL, competitors, getOwn, getPageCompetitors } from '../app/lib/competitors';
import type { Competitor, CompetitorFact } from '../app/lib/competitors';
import { getPageCopy, hasPageCopy } from '../app/lib/vergleich-copy';

const errors: string[] = [];
const FACT_KEYS = ['pricing', 'creatorCount', 'directContact', 'commission', 'markets'] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const today = new Date().toISOString().slice(0, 10);

function checkFact(slug: string, key: string, fact: CompetitorFact) {
  const at = `${slug}.${key}`;
  if (!fact.value.trim()) errors.push(`${at}: value ist leer`);
  if (!/^https:\/\//.test(fact.source)) errors.push(`${at}: source ist keine https-URL (${fact.source})`);
  if (!DATE_RE.test(fact.verifiedAt)) errors.push(`${at}: verifiedAt muss YYYY-MM-DD sein (${fact.verifiedAt})`);
  if (fact.verifiedAt > today) errors.push(`${at}: verifiedAt liegt in der Zukunft (${fact.verifiedAt})`);
  if (!fact.isPublic && fact.value !== 'nicht öffentlich') {
    errors.push(`${at}: isPublic=false, aber value ist "${fact.value}" statt "nicht öffentlich"`);
  }
}

function checkCompetitor(c: Competitor) {
  if (!/^[a-z0-9-]+$/.test(c.slug)) errors.push(`${c.slug}: slug muss kebab-case sein`);
  if (!/^https:\/\//.test(c.url)) errors.push(`${c.slug}: url ist keine https-URL`);
  for (const key of FACT_KEYS) checkFact(c.slug, key, c[key]);
  if (c.strengths.length < 2) errors.push(`${c.slug}: braucht mindestens 2 strengths (hat ${c.strengths.length})`);
  if (c.strengths.some((s) => !s.trim())) errors.push(`${c.slug}: leerer strengths-Eintrag`);
  if (!c.bestFor.trim()) errors.push(`${c.slug}: bestFor fehlt`);
  c.faqs.forEach((f, i) => checkDateLiterals(`${c.slug}.faqs[${i}]`, f.answer));
  if (c.hasOwnPage) {
    if (c.faqs.length < 3) errors.push(`${c.slug}: Seite braucht mindestens 3 FAQs (hat ${c.faqs.length})`);
    if (c.faqs.some((f) => !f.question.trim() || !f.answer.trim())) errors.push(`${c.slug}: leere FAQ`);
    checkCopy(c);
  }
}

const GERMAN_DATE_RE = /\b\d{2}\.\d{2}\.\d{4}\b/g;

/** Kein Datums-Literal im Fließtext darf vom Prüfdatum abweichen. */
function checkDateLiterals(where: string, text: string) {
  for (const match of text.match(GERMAN_DATE_RE) ?? []) {
    if (match !== VERIFIED_AT_LABEL) {
      errors.push(`${where}: hartkodiertes Datum "${match}" weicht vom Prüfdatum ${VERIFIED_AT_LABEL} ab`);
    }
  }
}

function checkCopy(c: Competitor) {
  if (!hasPageCopy(c.slug)) {
    errors.push(`${c.slug}: hasOwnPage=true, aber kein Eintrag in app/lib/vergleich-copy.ts`);
    return;
  }
  const copy = getPageCopy(c, getOwn());
  const sections: [string, string[]][] = [
    ['pricingDetail', copy.pricingDetail],
    ['handling', copy.handling],
    ['questions', copy.questions],
    ['notFor', copy.notFor],
    ['conclusion', copy.conclusion],
  ];
  for (const [name, parts] of sections) {
    if (parts.length < 2) errors.push(`${c.slug}.${name}: braucht mindestens 2 Absätze (hat ${parts.length})`);
    if (parts.some((p) => !p.trim())) errors.push(`${c.slug}.${name}: leerer Absatz`);
    parts.forEach((p, i) => checkDateLiterals(`${c.slug}.${name}[${i}]`, p));
  }
  if (!copy.questionsIntro.trim()) errors.push(`${c.slug}.questionsIntro: fehlt`);
  checkDateLiterals(`${c.slug}.questionsIntro`, copy.questionsIntro);
}

/** Kein Absatz darf wortgleich auf zwei Detailseiten stehen. */
function checkCopyUniqueness() {
  const seen = new Map<string, string>();
  for (const c of getPageCompetitors()) {
    if (!hasPageCopy(c.slug)) continue;
    const copy = getPageCopy(c, getOwn());
    const parts = [...copy.pricingDetail, ...copy.handling, ...copy.notFor, ...copy.conclusion, copy.questionsIntro];
    for (const p of parts) {
      const first = seen.get(p);
      if (first) errors.push(`${c.slug}: Absatz steht wortgleich auch bei ${first}`);
      else seen.set(p, c.slug);
    }
  }
}

const slugs = competitors.map((c) => c.slug);
const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
if (dupes.length) errors.push(`Doppelte slugs: ${dupes.join(', ')}`);

const own = competitors.filter((c) => c.isOwn);
if (own.length !== 1) errors.push(`Es muss genau einen isOwn-Eintrag geben (sind ${own.length})`);

competitors.forEach(checkCompetitor);
checkCopyUniqueness();

if (errors.length) {
  console.error(`\n${errors.length} Fehler in competitors.ts:\n`);
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log(`OK: ${competitors.length} Anbieter, ${getPageCompetitors().length} mit eigener Seite, eigener Eintrag: ${getOwn().name}`);

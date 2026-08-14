import { competitors, getOwn, getPageCompetitors } from '../app/lib/competitors';
import type { Competitor, CompetitorFact } from '../app/lib/competitors';

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
  if (c.hasOwnPage) {
    if (c.faqs.length < 3) errors.push(`${c.slug}: Seite braucht mindestens 3 FAQs (hat ${c.faqs.length})`);
    if (c.faqs.some((f) => !f.question.trim() || !f.answer.trim())) errors.push(`${c.slug}: leere FAQ`);
  }
}

const slugs = competitors.map((c) => c.slug);
const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
if (dupes.length) errors.push(`Doppelte slugs: ${dupes.join(', ')}`);

const own = competitors.filter((c) => c.isOwn);
if (own.length !== 1) errors.push(`Es muss genau einen isOwn-Eintrag geben (sind ${own.length})`);

competitors.forEach(checkCompetitor);

if (errors.length) {
  console.error(`\n${errors.length} Fehler in competitors.ts:\n`);
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log(`OK: ${competitors.length} Anbieter, ${getPageCompetitors().length} mit eigener Seite, eigener Eintrag: ${getOwn().name}`);

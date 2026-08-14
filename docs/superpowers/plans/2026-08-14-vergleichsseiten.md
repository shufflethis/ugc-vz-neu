# Vergleichsseiten Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Einen Vergleichs-Hub `/vergleich` plus vier „Alternative zu X"-Seiten bauen, die aus einer einzigen validierten Datenquelle rendern.

**Architecture:** Alle Wettbewerberdaten liegen in `app/lib/competitors.ts` als typisiertes Array. Jeder Faktenwert trägt Quelle und Prüfdatum. Ein tsx-Validierungsskript erzwingt die Redaktionsregeln (Quelle vorhanden, Stärken benannt, keine erfundenen Preise), bevor irgendetwas live geht. Hub und Detailseiten sind reine Renderer über diesen Daten — es gibt keinen zweiten Ort, an dem eine Zahl steht.

**Tech Stack:** Next.js 14.2.35 App Router, React 18, TypeScript 5, Tailwind, tsx 4.20 für Skripte. Kein Test-Framework im Repo.

**Spec:** `docs/superpowers/specs/2026-08-14-vergleichsseiten-design.md`

## Global Constraints

- **Kein Zahlenwert ohne Anbieterquelle.** Fehlt ein Preis öffentlich, ist der Wert exakt `'nicht öffentlich'` und `isPublic: false`. Niemals schätzen, niemals aus Drittquellen (OMR, Wettbewerber-Blogs) übernehmen — die waren in 3 von 4 Fällen falsch.
- **Stand aller Daten: `'2026-08-14'`.** Alle `verifiedAt`-Werte in diesem Plan tragen dieses Datum.
- **Kein `Product`/`AggregateRating`-Schema.** Nur `ItemList`, `FAQPage`, `BreadcrumbList`.
- **Jeder Wettbewerber braucht mindestens 2 echte Stärken und ein `bestFor`.** Der Typ erzwingt es, das Validierungsskript prüft es.
- **Kein lokaler Build.** `next build` und `tsc` werden auf diesem VPS von earlyoom abgeschossen. Verifikation läuft über das tsx-Validierungsskript (speicherarm) plus Live-Prüfung gegen `https://ugc-vz.de` nach dem Vercel-Deploy. Niemals „Build ist grün" behaupten, ohne die Live-Domain geprüft zu haben.
- **Umlaute in Prosa normal schreiben** (ä/ö/ü/ß), wie im übrigen Repo.

## File Structure

| Datei | Verantwortung |
|---|---|
| `app/lib/competitors.ts` | Typen + Daten aller 7 Anbieter. Einzige Wahrheitsquelle. |
| `scripts/validate-competitors.ts` | Erzwingt die Redaktionsregeln. Läuft via `npm run validate:competitors`. |
| `app/components/ComparisonTable.tsx` | Rendert die Matrix aus `Competitor[]`, mobil scrollbar, mit Quellenfußnoten. |
| `app/vergleich/page.tsx` | Hub-Seite, alle 7 Anbieter, `ItemList`-Schema. |
| `app/vergleich/[slug]/page.tsx` | Detailseiten für die 4 mit `hasOwnPage: true`, `FAQPage`-Schema. |
| `src/components/FooterNew.tsx` | Neue Spalte „Vergleiche"; zusätzlich fehlenden `/brands`-Link ergänzen. |
| `app/globals.css:105-113` | `.footer-grid-4` → 5 Spalten (siehe Falle in Task 5). |
| `app/sitemap.xml/route.ts:5-27` | Neue Routen in `staticPages` registrieren. |

---

### Task 1: Datenmodell und Validierungsskript

**Files:**
- Create: `app/lib/competitors.ts`
- Create: `scripts/validate-competitors.ts`
- Modify: `package.json` (scripts-Block)

**Interfaces:**
- Consumes: nichts
- Produces: `Competitor`, `CompetitorFact`, `FaqItem` (Typen); `competitors: Competitor[]`; `getCompetitor(slug: string): Competitor | undefined`; `getPageCompetitors(): Competitor[]` (nur `hasOwnPage: true`); `getOwn(): Competitor` (der UGC-VZ-Eintrag)

- [ ] **Step 1: Validierungsskript schreiben (das ist hier der Test)**

Erstelle `scripts/validate-competitors.ts`:

```ts
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
```

- [ ] **Step 2: Skript registrieren und laufen lassen — muss fehlschlagen**

In `package.json` im `scripts`-Block ergänzen:

```json
"validate:competitors": "node --import tsx scripts/validate-competitors.ts"
```

Run: `npm run validate:competitors`
Expected: FAIL — `Cannot find module '../app/lib/competitors'`, weil die Datei noch nicht existiert.

- [ ] **Step 3: `app/lib/competitors.ts` mit Typen und Daten anlegen**

Alle Werte sind am 14.08.2026 direkt von der jeweiligen Anbieterseite geprüft worden. Nicht verändern, nicht ergänzen, nicht schätzen.

```ts
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
const NOT_PUBLIC = 'nicht öffentlich';

export const competitors: Competitor[] = [
  {
    slug: 'ugc-vz',
    name: 'UGC VZ',
    url: 'https://ugc-vz.de',
    model: 'Verzeichnis mit Direktkontakt',
    isOwn: true,
    hasOwnPage: false,
    pricing: { value: 'kostenlos', source: 'https://ugc-vz.de/brands', verifiedAt: V, isPublic: true },
    creatorCount: { value: '470+ (DACH, kuratiert)', source: 'https://ugc-vz.de/brands', verifiedAt: V, isPublic: true },
    directContact: { value: 'Ja, Kontaktdaten der Creator', source: 'https://ugc-vz.de/brands', verifiedAt: V, isPublic: true },
    commission: { value: 'keine', source: 'https://ugc-vz.de/brands', verifiedAt: V, isPublic: true },
    markets: { value: 'DACH', source: 'https://ugc-vz.de/brands', verifiedAt: V, isPublic: true },
    strengths: [
      'Kostenlos, keine Plattform- oder Vermittlungsgebühr',
      'Direkte Kontaktdaten der Creator statt Kommunikation über eine Plattform',
      '470+ kuratierte Creator im deutschsprachigen Raum',
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
    pricing: { value: '99 € / 119 € / 139 € pro Video (15/30/60 Sek.), zzgl. MwSt.; Rohmaterial ab 59 €', source: 'https://speekly.de/preise', verifiedAt: V, isPublic: true },
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
      { question: 'Was kostet Speekly?', answer: 'Laut Preisseite von Speekly kosten fertig geschnittene UGC-Videos 99 € (15 Sekunden), 119 € (30 Sekunden) und 139 € (60 Sekunden), jeweils zzgl. MwSt. Ungeschnittenes Rohmaterial beginnt bei 59 €. Stand: 14.08.2026.' },
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
      { question: 'Was kostet Influee wirklich?', answer: 'Die Startseite wirbt mit UGC-Videos „ab 76 €". Das ist der Creator-Anteil. Laut Preisseite kommt ein Pflicht-Abo von $229, $529 oder $999 pro Monat hinzu, dazu eine Marketplace-Fee von 10 % auf die Creator-Zahlungen. Die Creator-Honorare sind im Abo nicht enthalten. Stand: 14.08.2026.' },
      { question: 'Gibt es eine Influee-Alternative ohne Monatsabo?', answer: 'UGC VZ verlangt weder Abo noch Provision — es ist ein kostenloses Verzeichnis, über das du Creator direkt kontaktierst. Auch Speekly kommt ohne Abo aus und rechnet pro Video ab.' },
      { question: 'Wie viele deutsche Creator hat Influee?', answer: 'Influee gibt über 10.000 Creator in Deutschland an, bei 140.000+ weltweit. Das ist deutlich mehr als das kuratierte Verzeichnis von UGC VZ mit 470+ Creatorn im DACH-Raum.' },
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
      { question: 'Was kostet stylink UGC für Brands?', answer: 'stylink UGC veröffentlicht auf der eigenen Website keine Preise für Brands. Angegeben ist nur die Creator-Vergütung von „bis zu 200 € pro Video". In Vergleichsartikeln kursierende Zahlen lassen sich auf der Anbieterseite nicht belegen, deshalb führen wir hier keine. Stand: 14.08.2026.' },
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
      { question: 'Was kostet Boksi?', answer: 'Boksi veröffentlicht keine Preisliste. Die Website führt zu einer kostenlosen Demo, ein individuelles Angebot wird laut Anbieter innerhalb eines Werktags erstellt. Stand: 14.08.2026.' },
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
    commission: { value: 'keine Servicegebühr angegeben', source: 'https://youdji.com/de', verifiedAt: V, isPublic: true },
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
```

- [ ] **Step 4: Validierung laufen lassen — muss bestehen**

Run: `npm run validate:competitors`
Expected: `OK: 7 Anbieter, 4 mit eigener Seite, eigener Eintrag: UGC VZ`

- [ ] **Step 5: Gegenprobe, dass die Validierung wirklich greift**

Ändere in `app/lib/competitors.ts` testweise bei `stylink-ugc` das `pricing.value` von `NOT_PUBLIC` auf `'ab 189 €'` (die falsche Drittquellen-Zahl).

Run: `npm run validate:competitors`
Expected: FAIL mit `stylink-ugc.pricing: isPublic=false, aber value ist "ab 189 €" statt "nicht öffentlich"`

Änderung anschließend zurücknehmen und erneut laufen lassen — muss wieder `OK` liefern.

- [ ] **Step 6: Commit**

```bash
git add app/lib/competitors.ts scripts/validate-competitors.ts package.json
git commit -m "feat: Wettbewerberdaten als validierte Single Source of Truth"
```

---

### Task 2: ComparisonTable-Komponente

**Files:**
- Create: `app/components/ComparisonTable.tsx`

**Interfaces:**
- Consumes: `Competitor`, `CompetitorFact` aus `app/lib/competitors.ts`
- Produces: Default-Export `ComparisonTable({ rows, highlightSlug }: { rows: Competitor[]; highlightSlug?: string })`

- [ ] **Step 1: Komponente schreiben**

Server-Komponente, kein `'use client'` — sie hat keinen State. Die Tabelle scrollt auf Mobil horizontal im eigenen Container, damit die Seite selbst nie horizontal scrollt.

```tsx
import type { Competitor, CompetitorFact } from '../lib/competitors';

const ROWS: { key: keyof Pick<Competitor, 'pricing' | 'creatorCount' | 'directContact' | 'commission' | 'markets'>; label: string }[] = [
  { key: 'pricing', label: 'Kosten für Brands' },
  { key: 'commission', label: 'Provision / Gebühr' },
  { key: 'directContact', label: 'Direkter Creator-Kontakt' },
  { key: 'creatorCount', label: 'Creator im Pool' },
  { key: 'markets', label: 'Märkte' },
];

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function Cell({ fact }: { fact: CompetitorFact }) {
  return (
    <td className="align-top px-4 py-3 text-sm text-ink border-b border-hairline">
      <span className={fact.isPublic ? '' : 'text-ink-soft italic'}>{fact.value}</span>
    </td>
  );
}

export default function ComparisonTable({ rows, highlightSlug }: { rows: Competitor[]; highlightSlug?: string }) {
  const verifiedAt = rows[0]?.pricing.verifiedAt ?? '';
  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-hairline">
        <table className="w-full min-w-[640px] border-collapse bg-white">
          <caption className="sr-only">Vergleich von UGC-Plattformen und Creator-Verzeichnissen</caption>
          <thead>
            <tr>
              <th scope="col" className="text-left px-4 py-3 text-sm font-semibold text-ink-soft border-b border-hairline">
                Kriterium
              </th>
              {rows.map((c) => (
                <th
                  key={c.slug}
                  scope="col"
                  className={`text-left px-4 py-3 text-sm font-bold border-b border-hairline ${
                    c.slug === highlightSlug || c.isOwn ? 'text-geo-violet' : 'text-ink'
                  }`}
                >
                  {c.isOwn ? `${c.name} (wir)` : c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.key}>
                <th scope="row" className="text-left align-top px-4 py-3 text-sm font-medium text-ink-soft border-b border-hairline">
                  {row.label}
                </th>
                {rows.map((c) => (
                  <Cell key={c.slug} fact={c[row.key]} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-soft/70 mt-3">
        Stand: {formatDate(verifiedAt)}. Alle Angaben stammen von den Websites der Anbieter. „nicht öffentlich" heißt, dass der
        Anbieter dazu keine Angabe veröffentlicht — wir schätzen keine Werte. Quellen:{' '}
        {rows.map((c, i) => (
          <span key={c.slug}>
            {i > 0 && ', '}
            <a href={c.url} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-geo-violet">
              {c.name}
            </a>
          </span>
        ))}
        .
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/ComparisonTable.tsx
git commit -m "feat: ComparisonTable mit Quellenangaben und Stand-Datum"
```

---

### Task 3: Hub-Seite `/vergleich`

**Files:**
- Create: `app/vergleich/page.tsx`

**Interfaces:**
- Consumes: `competitors` aus `app/lib/competitors.ts`; `ComparisonTable`; `BreadcrumbSchema` aus `app/components/BreadcrumbSchema` (Props: `items: { name: string; url: string }[]`); `JsonLdScript` aus `app/wissen/[slug]/JsonLdScript` (Props: `data: string | object`)
- Produces: Route `/vergleich`

Der Import-Stil folgt `app/brands/page.tsx`: `JsonLdScript` liegt unter `app/wissen/[slug]/JsonLdScript`, `BreadcrumbSchema` unter `app/components/BreadcrumbSchema`.

- [ ] **Step 1: Seite schreiben**

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import JsonLdScript from '../wissen/[slug]/JsonLdScript';
import ComparisonTable from '../components/ComparisonTable';
import { competitors } from '../lib/competitors';

export const metadata: Metadata = {
  title: 'UGC-Plattformen im Vergleich 2026',
  description:
    'Speekly, Influee, stylink UGC, Boksi, Refluenced und Youdji im sachlichen Vergleich: Kosten, Provisionen, Creator-Pools und Direktkontakt. Alle Angaben mit Quelle und Prüfdatum.',
  alternates: { canonical: 'https://ugc-vz.de/vergleich' },
  openGraph: {
    title: 'UGC-Plattformen im Vergleich 2026',
    description: 'Kosten, Provisionen und Creator-Pools der wichtigsten UGC-Plattformen im deutschsprachigen Raum.',
    url: 'https://ugc-vz.de/vergleich',
    siteName: 'UGC VZ',
    locale: 'de_DE',
    type: 'website',
  },
};

export default function VergleichPage() {
  const breadcrumbs = [
    { name: 'Startseite', url: 'https://ugc-vz.de' },
    { name: 'Vergleich', url: 'https://ugc-vz.de/vergleich' },
  ];

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'UGC-Plattformen im Vergleich',
    numberOfItems: competitors.length,
    itemListElement: competitors.map((c, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: c.name,
      url: c.url,
    })),
  };

  return (
    <div className="min-h-screen bg-white text-ink">
      <BreadcrumbSchema items={breadcrumbs} />
      <JsonLdScript data={itemListSchema} />

      <main className="py-12 px-4 sm:px-8 md:px-16 lg:px-24">
        <section className="max-w-5xl mx-auto mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-ink">
            UGC-Plattformen <span className="gradient-text">im Vergleich</span>
          </h1>
          <p className="text-lg text-ink-soft mb-4">
            Die meisten Anbieter in diesem Markt sind vermittelte Marktplätze: Du erstellst einen Auftrag, die Plattform
            wickelt Vertrag und Zahlung ab. UGC VZ ist ein Verzeichnis — du bekommst die Kontaktdaten der Creator und
            verhandelst direkt. Beides hat seine Berechtigung, und diese Tabelle zeigt, wann was passt.
          </p>
          <p className="text-sm text-ink-soft/80">
            Alle Zahlen stammen von den Websites der Anbieter, mit Quelle und Prüfdatum. Wo ein Anbieter keine Preise
            veröffentlicht, steht „nicht öffentlich" — wir schätzen nichts.
          </p>
        </section>

        <section className="max-w-6xl mx-auto mb-16">
          <ComparisonTable rows={competitors} />
        </section>

        <section className="max-w-5xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-6 text-ink">Die Anbieter im Einzelnen</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {competitors
              .filter((c) => !c.isOwn)
              .map((c) => (
                <div key={c.slug} className="border border-hairline rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-ink mb-2">{c.name}</h3>
                  <p className="text-sm text-ink-soft mb-3">{c.model}</p>
                  <p className="text-sm text-ink mb-4">
                    <strong>Am besten geeignet für:</strong> {c.bestFor}
                  </p>
                  <ul className="text-sm text-ink-soft space-y-1 mb-4 list-disc list-inside">
                    {c.strengths.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                  {c.hasOwnPage && (
                    <Link href={`/vergleich/${c.slug}-alternative`} className="text-sm underline hover:text-geo-violet">
                      {c.name} und UGC VZ im Detail vergleichen
                    </Link>
                  )}
                </div>
              ))}
          </div>
        </section>

        <section className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-ink">Creator direkt finden</h2>
          <p className="text-ink-soft mb-6">
            470+ kuratierte Creator im deutschsprachigen Raum, kostenlos, mit direkten Kontaktdaten.
          </p>
          <Link
            href="/brands"
            className="inline-block px-8 py-4 rounded-full bg-geo-violet text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Zur Creator-Suche
          </Link>
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Detailseiten-Links prüfen**

Die Karten verlinken auf `/vergleich/${slug}-alternative`. Task 4 muss dieselbe Slug-Konvention erzeugen: `speekly-alternative`, `influee-alternative`, `stylink-ugc-alternative`, `boksi-alternative`.

Run: `npm run validate:competitors`
Expected: weiterhin `OK` (die Datei wurde nicht verändert, dient hier als Regressionscheck).

- [ ] **Step 3: Commit**

```bash
git add app/vergleich/page.tsx
git commit -m "feat: Vergleichs-Hub /vergleich mit ItemList-Schema"
```

---

### Task 4: Detailseiten `/vergleich/[slug]`

**Files:**
- Create: `app/vergleich/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getCompetitor`, `getPageCompetitors`, `getOwn` aus `app/lib/competitors.ts`; `ComparisonTable`
- Produces: Routen `/vergleich/speekly-alternative`, `/vergleich/influee-alternative`, `/vergleich/stylink-ugc-alternative`, `/vergleich/boksi-alternative`

- [ ] **Step 1: Seite schreiben**

Der Slug in der URL ist `<competitor-slug>-alternative`. `generateStaticParams` erzeugt genau diese vier; `dynamicParams = false` sorgt dafür, dass alles andere 404 liefert.

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BreadcrumbSchema from '../../components/BreadcrumbSchema';
import JsonLdScript from '../../wissen/[slug]/JsonLdScript';
import ComparisonTable from '../../components/ComparisonTable';
import { getCompetitor, getOwn, getPageCompetitors } from '../../lib/competitors';

export const dynamicParams = false;

const SUFFIX = '-alternative';

function competitorFromParam(slug: string) {
  if (!slug.endsWith(SUFFIX)) return undefined;
  const c = getCompetitor(slug.slice(0, -SUFFIX.length));
  return c?.hasOwnPage ? c : undefined;
}

export function generateStaticParams() {
  return getPageCompetitors().map((c) => ({ slug: `${c.slug}${SUFFIX}` }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = competitorFromParam(params.slug);
  if (!c) return { title: 'Vergleich nicht gefunden', robots: { index: false, follow: false } };
  const url = `https://ugc-vz.de/vergleich/${params.slug}`;
  const title = `${c.name} Alternative: UGC Creator direkt finden`;
  const description = `${c.name} im sachlichen Vergleich mit UGC VZ: Kosten, Provisionen, Creator-Pool und Direktkontakt. Alle Angaben mit Quelle, Stand 14.08.2026.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'UGC VZ', locale: 'de_DE', type: 'article' },
  };
}

export default function VergleichDetailPage({ params }: { params: { slug: string } }) {
  const c = competitorFromParam(params.slug);
  if (!c) notFound();
  const own = getOwn();
  const others = getPageCompetitors().filter((x) => x.slug !== c.slug);

  const breadcrumbs = [
    { name: 'Startseite', url: 'https://ugc-vz.de' },
    { name: 'Vergleich', url: 'https://ugc-vz.de/vergleich' },
    { name: `${c.name} Alternative`, url: `https://ugc-vz.de/vergleich/${params.slug}` },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-white text-ink">
      <BreadcrumbSchema items={breadcrumbs} />
      <JsonLdScript data={faqSchema} />

      <main className="py-12 px-4 sm:px-8 md:px-16 lg:px-24">
        <section className="max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-ink">
            {c.name} Alternative: <span className="gradient-text">Creator direkt finden</span>
          </h1>
          <p className="text-lg text-ink-soft">
            {c.name} ist ein {c.model.toLowerCase()}: Die Abwicklung läuft über die Plattform. UGC VZ ist ein kostenloses
            Verzeichnis — du bekommst die Kontaktdaten der Creator und verhandelst direkt, ohne Plattformgebühr. Welche
            Variante besser passt, hängt davon ab, wie viel Abwicklung du abgeben willst.
          </p>
        </section>

        <section className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-6 text-ink">{c.name} und UGC VZ im Vergleich</h2>
          <ComparisonTable rows={[own, c]} highlightSlug={c.slug} />
        </section>

        <section className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4 text-ink">Wann {c.name} die bessere Wahl ist</h2>
          <p className="text-ink-soft mb-4">{c.bestFor}</p>
          <ul className="text-ink-soft space-y-2 list-disc list-inside">
            {c.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>

        <section className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4 text-ink">Wann UGC VZ besser passt</h2>
          <p className="text-ink-soft mb-4">{own.bestFor}</p>
          <ul className="text-ink-soft space-y-2 list-disc list-inside">
            {own.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className="text-sm text-ink-soft/80 mt-4">
            Fairerweise: Der Creator-Pool von {c.name} ist deutlich größer als unser kuratiertes Verzeichnis, und wir
            übernehmen weder Verträge noch Zahlungsabwicklung. Wer das braucht, ist bei {c.name} besser aufgehoben.
          </p>
        </section>

        <section className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-6 text-ink">Häufige Fragen</h2>
          <div className="space-y-6">
            {c.faqs.map((f) => (
              <div key={f.question}>
                <h3 className="text-lg font-semibold text-ink mb-2">{f.question}</h3>
                <p className="text-ink-soft">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto mb-16 text-center">
          <Link
            href="/brands"
            className="inline-block px-8 py-4 rounded-full bg-geo-violet text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Creator kostenlos finden
          </Link>
        </section>

        <section className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-ink">Weitere Vergleiche</h2>
          <ul className="space-y-2">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/vergleich/${o.slug}${SUFFIX}`} className="underline hover:text-geo-violet">
                  {o.name} Alternative
                </Link>
              </li>
            ))}
            <li>
              <Link href="/vergleich" className="underline hover:text-geo-violet">
                Alle UGC-Plattformen im Überblick
              </Link>
            </li>
          </ul>
        </section>

        <p className="max-w-3xl mx-auto mt-12 text-xs text-ink-soft/70">
          Methodik: Alle Angaben stammen von den öffentlich zugänglichen Websites der Anbieter, zuletzt geprüft am
          14.08.2026. Wo ein Anbieter keine Preise veröffentlicht, steht „nicht öffentlich" statt einer Schätzung. UGC VZ
          ist unser eigenes Angebot — diese Seite ist damit kein neutraler Test, sondern ein Vergleich aus Anbietersicht
          mit belegten Zahlen.
        </p>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Slug-Konvention gegen Task 3 prüfen**

Run: `grep -n "vergleich/" app/vergleich/page.tsx app/vergleich/\[slug\]/page.tsx`
Expected: Die Links in `page.tsx` und die `generateStaticParams` in `[slug]/page.tsx` erzeugen beide das Muster `<slug>-alternative`. Keine Abweichung.

- [ ] **Step 3: Commit**

```bash
git add app/vergleich/\[slug\]/page.tsx
git commit -m "feat: Alternative-zu-X Detailseiten mit FAQPage-Schema"
```

---

### Task 5: Footer und Sitemap

**Files:**
- Modify: `src/components/FooterNew.tsx:14` (Grid-Klassen) und neue Spalte nach Zeile 74
- Modify: `app/globals.css:105-113`
- Modify: `app/sitemap.xml/route.ts:5-27`

**Interfaces:**
- Consumes: nichts aus vorherigen Tasks (nur die Routen aus Task 3 und 4)
- Produces: nichts für spätere Tasks

**Falle:** `app/globals.css:109` setzt `grid-template-columns: repeat(4, 1fr) !important` auf `.footer-grid-4`. Eine Tailwind-Klasse `lg:grid-cols-5` würde davon überstimmt und die fünfte Spalte bliebe unsichtbar. Deshalb muss die CSS-Regel mitgeändert werden.

- [ ] **Step 1: CSS auf 5 Spalten umstellen**

In `app/globals.css` den Block ab Zeile 105 ersetzen:

```css
/* Footer 5-column layout enforcement */
@media (min-width: 1024px) {
  .footer-grid-5 {
    display: grid !important;
    grid-template-columns: repeat(5, 1fr) !important;
    gap: 2.5rem !important;
  }
  .footer-grid-5 > div { width: 100% !important; min-width: 0 !important; }
}
```

- [ ] **Step 2: Footer-Grid und neue Spalte einbauen**

In `src/components/FooterNew.tsx` Zeile 14 die Klassen ändern:

```tsx
<div className="footer-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 footer-grid-5 gap-8 lg:gap-12 mb-12">
```

Danach nach dem Schließen der vierten Spalte (nach Zeile 74, direkt vor `</div>` des Grids) einfügen:

```tsx
          {/* Column 5: Vergleiche */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Vergleiche</h3>
            <ul className="space-y-3">
              <li><Link href="/vergleich" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Alle Plattformen</Link></li>
              <li><Link href="/vergleich/speekly-alternative" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Speekly Alternative</Link></li>
              <li><Link href="/vergleich/influee-alternative" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Influee Alternative</Link></li>
              <li><Link href="/vergleich/stylink-ugc-alternative" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">stylink UGC Alternative</Link></li>
              <li><Link href="/vergleich/boksi-alternative" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Boksi Alternative</Link></li>
            </ul>
          </div>
```

Zusätzlich in Spalte 2 („Unternehmen", Zeile 42-45) den fehlenden Brands-Link ergänzen:

```tsx
              <li><Link href="/brands" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Für Brands</Link></li>
```

- [ ] **Step 3: Alte CSS-Klasse auf Rückstände prüfen**

Run: `grep -rn "footer-grid-4" app/ src/`
Expected: keine Treffer. Falls doch, die Fundstelle auf `footer-grid-5` umstellen.

- [ ] **Step 4: Sitemap-Routen registrieren**

In `app/sitemap.xml/route.ts` das `staticPages`-Array um fünf Einträge ergänzen (nach `'/brands/ugc-vertrag-vorlage',`):

```ts
  '/vergleich',
  '/vergleich/speekly-alternative',
  '/vergleich/influee-alternative',
  '/vergleich/stylink-ugc-alternative',
  '/vergleich/boksi-alternative',
```

- [ ] **Step 5: Commit**

```bash
git add src/components/FooterNew.tsx app/globals.css app/sitemap.xml/route.ts
git commit -m "feat: Vergleiche im Footer, Sitemap-Routen, fehlender /brands-Link"
```

---

### Task 6: Live-Verifikation

**Files:** keine

**Interfaces:**
- Consumes: alle vorherigen Tasks
- Produces: nichts

Auf diesem VPS lässt sich nicht bauen (earlyoom killt `next build` und `tsc`). Die Verifikation läuft deshalb gegen die Live-Domain nach dem Vercel-Deploy.

- [ ] **Step 1: Validierung ein letztes Mal laufen lassen**

Run: `npm run validate:competitors`
Expected: `OK: 7 Anbieter, 4 mit eigener Seite, eigener Eintrag: UGC VZ`

- [ ] **Step 2: Pushen und auf den Deploy warten**

```bash
git push origin main
```

Dann warten, bis die Route live ist (nicht in kürzeren Schleifen pollen):

```bash
until curl -sf -o /dev/null https://ugc-vz.de/vergleich; do sleep 15; done; echo "live"
```

- [ ] **Step 3: Alle fünf Routen prüfen**

```bash
for p in /vergleich /vergleich/speekly-alternative /vergleich/influee-alternative /vergleich/stylink-ugc-alternative /vergleich/boksi-alternative; do
  printf "%s -> %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' https://ugc-vz.de$p)"
done
```

Expected: fünfmal `200`.

- [ ] **Step 4: Schema und Kernzahlen im ausgelieferten HTML prüfen**

```bash
curl -s https://ugc-vz.de/vergleich | grep -c '"@type":"ItemList"'
curl -s https://ugc-vz.de/vergleich/influee-alternative | grep -o '"@type":"FAQPage"\|10 % Marketplace-Fee\|nicht öffentlich'
curl -s https://ugc-vz.de/vergleich/stylink-ugc-alternative | grep -o 'nicht öffentlich\|ab 189'
```

Expected: `ItemList` einmal vorhanden; auf der Influee-Seite `FAQPage` und `10 % Marketplace-Fee`; auf der stylink-Seite `nicht öffentlich` und **kein** Treffer für `ab 189`.

- [ ] **Step 5: Sitemap und Footer prüfen**

```bash
curl -s https://ugc-vz.de/sitemap.xml | grep -c '/vergleich'
curl -s https://ugc-vz.de/ | grep -o 'vergleich/speekly-alternative'
```

Expected: fünf Sitemap-Einträge, Footer-Link auf der Startseite vorhanden.

- [ ] **Step 6: Rich-Result-Test**

`https://search.google.com/test/rich-results` mit `https://ugc-vz.de/vergleich/speekly-alternative` aufrufen.
Expected: FAQPage erkannt, keine Fehler. Kein `Product`- oder `AggregateRating`-Element im Ergebnis.

---

## Nach dem Livegang

- Search Console beobachten: Für welche `[Marke] Alternative`-Queries entstehen Impressions? Das liefert die Volumendaten, die vorab nicht verfügbar waren, und entscheidet, ob Refluenced und Youdji eigene Seiten bekommen.
- Quartalsreview: `npm run validate:competitors` erzwingt Struktur, nicht Aktualität. Die `verifiedAt`-Daten stehen sichtbar auf der Seite — wenn sie älter als drei Monate sind, Preise neu prüfen.

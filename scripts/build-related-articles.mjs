/**
 * Berechnet fuer jeden veroeffentlichten Wissensartikel die thematisch
 * naechstliegenden Artikel und legt das Ergebnis als content/wissen/related.json ab.
 *
 * Hintergrund: Alle 64 Artikel tragen die Kategorie "Allgemein" und haben keine
 * Tags — es gibt also keine Taxonomie, an der sich eine Verwandtschaft festmachen
 * liesse. Die Aehnlichkeit wird daher aus den Texten selbst bestimmt.
 *
 * Verfahren: TF-IDF-gewichtete Kosinus-Aehnlichkeit. Die IDF-Gewichtung ist hier
 * entscheidend — Begriffe wie "ugc" oder "creator" stehen in praktisch jedem
 * Artikel und wuerden bei reiner Wortueberschneidung alles gleich aehnlich
 * erscheinen lassen. Titel und Excerpt zaehlen mehrfach, weil sie das Thema
 * praeziser benennen als der Fliesstext.
 *
 * Aufruf: node scripts/build-related-articles.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, 'content', 'wissen');
const OUT_FILE = path.join(CONTENT_DIR, 'related.json');
const RELATED_PER_POST = 3;
// Jeder Artikel soll auch erreichbar sein, nicht nur verweisen. Ohne diesen
// Ausgleich zieht eine Handvoll thematisch breiter Artikel fast alle Verweise
// auf sich, waehrend spezielle Artikel keinen einzigen eingehenden Link haben.
const MIN_INCOMING = 2;

// Deutsche Funktionswoerter plus die domainweit ueberall vorkommenden Begriffe.
const STOPWORDS = new Set(`
aber alle allem allen aller alles als also andere anderem anderen anderer anderes
auch auf aus bei beim bin bis bist dabei damit dann dass dein deine dem den denn
der deren des dessen dich die dies diese diesem diesen dieser dieses dir doch dort
du durch ein eine einem einen einer eines einfach er erst es etwa etwas euer eure
fuer für gegen gibt hab habe haben hat hatte hier hin ihr ihre ihrem ihren ihrer
ihres immer in ins ist jede jedem jeden jeder jedes jetzt kann kannst kein keine
koennen können machen macht man mehr mein meine mit muss musst nach nicht nichts
noch nun nur ob oder ohne schon sehr sein seine seinem seinen seiner sich sie sind
so solche sollte sondern sonst ueber über um und uns unser unsere unter viel viele
vom von vor waehrend während wann war waren was weil weitere wenn wer werden wie
wieder wir wird wirst wo wollen wurde wurden zu zum zur zwar zwischen
`.trim().split(/\s+/));

function stripHtml(html) {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ');
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-zäöüß0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

const manifest = JSON.parse(readFileSync(path.join(CONTENT_DIR, 'index.json'), 'utf8'));
const posts = manifest.filter((p) => p.indexable && p.contentStatus === 'published');

if (posts.length === 0) {
  console.error('Keine veroeffentlichten Artikel im Manifest gefunden.');
  process.exit(1);
}

// Termfrequenzen je Artikel. Titel und Excerpt hoeher gewichten als den Fliesstext.
const docs = posts.map((post) => {
  const full = JSON.parse(readFileSync(path.join(CONTENT_DIR, `${post.slug}.json`), 'utf8'));
  const tokens = [
    ...tokenize(post.title).flatMap((t) => [t, t, t]),
    ...tokenize(post.excerpt || '').flatMap((t) => [t, t]),
    ...tokenize(stripHtml(full.contentHtml || '')),
  ];
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  return { slug: post.slug, title: post.title, tf };
});

// Dokumentfrequenz -> IDF
const df = new Map();
for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) || 0) + 1);
const N = docs.length;
const idf = new Map();
for (const [t, n] of df) idf.set(t, Math.log(N / n) + 1);

// TF-IDF-Vektoren, L2-normalisiert -> Skalarprodukt ist die Kosinus-Aehnlichkeit.
for (const d of docs) {
  const vec = new Map();
  let norm = 0;
  for (const [t, freq] of d.tf) {
    const w = (1 + Math.log(freq)) * idf.get(t);
    vec.set(t, w);
    norm += w * w;
  }
  norm = Math.sqrt(norm) || 1;
  for (const [t, w] of vec) vec.set(t, w / norm);
  d.vec = vec;
}

function similarity(a, b) {
  // Ueber den kleineren Vektor iterieren.
  const [small, large] = a.vec.size < b.vec.size ? [a.vec, b.vec] : [b.vec, a.vec];
  let dot = 0;
  for (const [t, w] of small) {
    const o = large.get(t);
    if (o) dot += w * o;
  }
  return dot;
}

// Vollstaendige Rangliste je Artikel — wird fuer den Ausgleich unten nochmal gebraucht.
const rankings = new Map(
  docs.map((a) => [
    a.slug,
    docs
      .filter((b) => b.slug !== a.slug)
      .map((b) => ({ slug: b.slug, title: b.title, score: similarity(a, b) }))
      .sort((x, y) => y.score - x.score),
  ]),
);

const related = {};
for (const a of docs) related[a.slug] = rankings.get(a.slug).slice(0, RELATED_PER_POST).map((r) => r.slug);

// Ausgleich: Artikel unter MIN_INCOMING eingehenden Verweisen werden bei ihren
// thematisch naechsten Nachbarn eingefuegt — dort jeweils anstelle des schwaechsten
// Eintrags, sofern dieser dadurch nicht selbst unter die Schwelle faellt.
const incoming = new Map(docs.map((d) => [d.slug, 0]));
for (const targets of Object.values(related)) for (const t of targets) incoming.set(t, incoming.get(t) + 1);

let swaps = 0;
const needy = docs
  .map((d) => d.slug)
  .filter((s) => incoming.get(s) < MIN_INCOMING)
  .sort((x, y) => incoming.get(x) - incoming.get(y));

for (const orphan of needy) {
  for (const cand of rankings.get(orphan)) {
    if (incoming.get(orphan) >= MIN_INCOMING) break;
    const list = related[cand.slug];
    if (list.includes(orphan)) continue;
    // Schwaechsten Eintrag verdraengen, der den Verlust verkraftet.
    const weakest = [...list]
      .reverse()
      .find((s) => incoming.get(s) > MIN_INCOMING);
    if (!weakest) continue;
    list[list.indexOf(weakest)] = orphan;
    incoming.set(weakest, incoming.get(weakest) - 1);
    incoming.set(orphan, incoming.get(orphan) + 1);
    swaps += 1;
  }
}

const scoreLog = docs.map((a) => {
  const r = rankings.get(a.slug);
  return { from: a.title, top: r[0], low: r[RELATED_PER_POST - 1] };
});

writeFileSync(OUT_FILE, `${JSON.stringify(related, null, 2)}\n`, 'utf8');

const tops = scoreLog.map((s) => s.top.score);
const lows = scoreLog.map((s) => s.low.score);
const avg = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
const finalIncoming = new Map(docs.map((d) => [d.slug, 0]));
for (const targets of Object.values(related)) for (const t of targets) finalIncoming.set(t, finalIncoming.get(t) + 1);
const inCounts = [...finalIncoming.values()];

console.log(`${posts.length} Artikel, je ${RELATED_PER_POST} Verweise -> ${OUT_FILE}`);
console.log(`Eingehende Verweise: min ${Math.min(...inCounts)}  max ${Math.max(...inCounts)}  (${swaps} Umhaengungen fuer Mindestabdeckung)`);
console.log(`Artikel ohne eingehenden Verweis: ${inCounts.filter((c) => c === 0).length}`);
console.log(`Aehnlichkeit bester Treffer:  min ${Math.min(...tops).toFixed(3)}  Ø ${avg(tops).toFixed(3)}  max ${Math.max(...tops).toFixed(3)}`);
console.log(`Aehnlichkeit letzter Treffer: min ${Math.min(...lows).toFixed(3)}  Ø ${avg(lows).toFixed(3)}`);
console.log('\nStichprobe:');
for (const s of scoreLog.slice(0, 5)) {
  console.log(`  ${s.from.slice(0, 58)}`);
  console.log(`    -> ${s.top.title.slice(0, 58)} (${s.top.score.toFixed(3)})`);
}

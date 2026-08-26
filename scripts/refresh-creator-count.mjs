// Schreibt die beworbene Creator-Zahl in Zehnerschritten nach oben fort.
//
// Laeuft woechentlich als Cron auf dem VPS (siehe refresh-creator-count.sh).
// Quelle ist die Live-Suche, nicht die Datenbank: massgeblich ist, was Brands
// tatsaechlich finden. Die Antwort von /api/search enthaelt dafuer einen
// pool-Block (size = aktive Profile, scored = bewertete, dropped* = Ausfaelle).
//
// Zwei Regeln, beide absichtlich streng:
//   1. Nur nach oben. Ein einzelner Ausreisser nach unten (Cache, Ausfall)
//      darf die Website nicht kleiner machen als sie ist.
//   2. Nur bei intakter Pipeline. Weicht totalCount von pool.size ab, frisst
//      die Suche Profile -- dann ist die Zahl kein Kandidat zum Fortschreiben,
//      sondern ein Bug. Das Skript aendert nichts und meldet es.
//
// Aufruf: node scripts/refresh-creator-count.mjs [--dry-run]
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const countFile = path.join(repoRoot, 'app/lib/creator-count.ts');
const BASE = process.env.LIVE_BASE_URL || 'https://ugc-vz.de';
const STEP = 10;
const dryRun = process.argv.includes('--dry-run');

const stamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
const log = (message) => console.log(`[${stamp()}] ${message}`);

const git = (...args) => execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();

// Geschlechtsneutrale Query: nur dann ist totalCount die volle Poolgroesse.
const response = await fetch(`${BASE}/api/search`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'Produktvideo' }),
});
if (!response.ok) {
  log(`Suche antwortet mit HTTP ${response.status} - Abbruch, keine Aenderung.`);
  process.exit(1);
}

const data = await response.json();
const pool = data.pool;
const totalCount = Number(data.totalCount);

if (!pool || !Number.isFinite(Number(pool.size))) {
  log('Antwort enthaelt keinen pool-Block - vermutlich alte Deployment-Version. Keine Aenderung.');
  process.exit(1);
}

const poolSize = Number(pool.size);
if (totalCount !== poolSize) {
  log(
    `WARNUNG: totalCount ${totalCount} != pool.size ${poolSize}. `
    + `Ausfaelle: lowScore=${pool.droppedLowScore}, error=${pool.droppedError}, gender=${pool.droppedGenderFilter}. `
    + 'Die Suche verliert Profile - Zahl NICHT fortgeschrieben.',
  );
  process.exit(2);
}

const source = readFileSync(countFile, 'utf8');
const match = source.match(/export const CREATOR_COUNT_LABEL = '(\d+)\+';/);
if (!match) {
  log(`CREATOR_COUNT_LABEL in ${countFile} nicht gefunden - Format geaendert? Keine Aenderung.`);
  process.exit(1);
}

const current = Number(match[1]);
const target = Math.floor(poolSize / STEP) * STEP;

if (target <= current) {
  log(`Pool ${poolSize}, beworben ${current}+ - kein Zehnerschritt faellig.`);
  process.exit(0);
}

log(`Pool ${poolSize}: ${current}+ -> ${target}+`);
if (dryRun) {
  log('--dry-run: nichts geschrieben.');
  process.exit(0);
}

// Nur eine saubere Arbeitskopie darf committen, sonst reisst der Cron fremde
// Aenderungen mit in den Deploy.
const dirty = git('status', '--porcelain', '--', 'app/lib/creator-count.ts');
if (dirty) {
  log('creator-count.ts ist lokal veraendert - Cron fasst nichts an.');
  process.exit(1);
}

writeFileSync(countFile, source.replace(match[0], `export const CREATOR_COUNT_LABEL = '${target}+';`));

git('add', 'app/lib/creator-count.ts');
git(
  'commit',
  '-m',
  `chore: Creator-Zahl auf ${target}+ (Live-Suche: ${poolSize} auffindbare Profile)`,
  '-m',
  'Automatisch fortgeschrieben von scripts/refresh-creator-count.mjs.',
);
git('push', 'origin', 'HEAD:main');
log(`Committet und gepusht - Vercel baut ${target}+ aus.`);

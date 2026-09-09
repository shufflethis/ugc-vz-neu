// Holt Social-Profilbilder (Instagram/TikTok) fuer aktive Creator und
// persistiert die Bild-Bytes in creator_social_avatars.
//
// Laeuft als Cron auf dem VPS (nicht auf Vercel): Instagram blockt
// Rechenzentrums-IPs von Vercel, der VPS kommt durch. Ausgeliefert werden die
// Bilder ueber /api/avatar/[publicId] (siehe app/api/avatar/[publicId]/route.ts).
// Die Best-Effort-Variante beim Speichern lebt in app/lib/social-avatar.ts --
// Logik-Aenderungen bitte dort mit nachziehen.
//
// Aufruf: node scripts/fetch-social-avatars.mjs [--limit=40] [--force-public-id=UGC-XXXX]
//
// HTTP laeuft ueber curl (spawnSync) statt Node-fetch: Instagram beantwortet
// HTTP/1.1-Requests auf die Profil-API mit 429 und akzeptiert nur HTTP/2 --
// Node/undici spricht HTTP/1.1, curl verhandelt h2.
import { spawnSync } from 'node:child_process';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.env.DATABASE_URL) dotenv.config({ path: path.join(repoRoot, '.env.local') });

const connectionString = process.env.DATABASE_URL_UNPOOLED
  || process.env.POSTGRES_URL_NON_POOLING
  || process.env.DATABASE_URL;
if (!connectionString) throw new Error('Keine Neon-Datenbankverbindung gefunden.');

const sql = neon(connectionString);

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, value] = arg.replace(/^--/, '').split('=');
  return [key, value ?? true];
}));
const LIMIT = Number(args.limit) > 0 ? Number(args.limit) : 25;
const FORCE_PUBLIC_ID = typeof args['force-public-id'] === 'string' ? args['force-public-id'] : null;

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IG_RESERVED = new Set(['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'share', 'tv', 'direct', 'about', 'legal', 'developer']);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const extractHandles = (socialLinks) => {
  const handles = [];
  for (const link of String(socialLinks || '').split('\n').map((l) => l.trim()).filter(Boolean)) {
    try {
      const url = new URL(/^https?:\/\//i.test(link) ? link : `https://${link}`);
      const host = url.hostname.toLowerCase();
      const first = url.pathname.split('/').filter(Boolean)[0] || '';
      if (/(^|\.)instagram\.com$/.test(host)) {
        const handle = first.replace(/^@/, '');
        if (handle && !IG_RESERVED.has(handle.toLowerCase())) handles.push({ platform: 'instagram', handle });
      } else if (/(^|\.)tiktok\.com$/.test(host) && first.startsWith('@')) {
        handles.push({ platform: 'tiktok', handle: first.slice(1) });
      }
    } catch { /* kaputte Links ignorieren */ }
  }
  return handles.sort((a, b) => (a.platform === b.platform ? 0 : a.platform === 'instagram' ? -1 : 1));
};

// curl mit HTTP/2, folgt Redirects, harte Timeouts. Liefert {status, contentType, body(Buffer)}.
const curlFetch = (url, extraHeaders = [], timeoutSeconds = 15) => {
  const result = spawnSync('curl', [
    '-s', '-L', '--max-time', String(timeoutSeconds),
    '--max-filesize', String(MAX_IMAGE_BYTES),
    '-A', BROWSER_UA,
    '-w', `\n__CURL_META__%{http_code}__%{content_type}__`,
    ...extraHeaders.flatMap((header) => ['-H', header]),
    url,
  ], { maxBuffer: MAX_IMAGE_BYTES + 1024 * 1024 });
  if (result.status !== 0 || !result.stdout) return { status: 0, contentType: '', body: Buffer.alloc(0) };
  const stdout = result.stdout;
  const marker = Buffer.from('\n__CURL_META__');
  const markerIndex = stdout.lastIndexOf(marker);
  if (markerIndex < 0) return { status: 0, contentType: '', body: Buffer.alloc(0) };
  const meta = stdout.subarray(markerIndex + marker.length).toString('utf8');
  const [code, contentType] = meta.split('__');
  return {
    status: Number(code) || 0,
    contentType: (contentType || '').split(';')[0].trim(),
    body: stdout.subarray(0, markerIndex),
  };
};

// Pro Plattform: bei Rate-Limit-/Block-Signalen (429, 401, 403) wird die
// Plattform fuer diesen Lauf gesperrt, statt weiter gegen den Block zu rennen
// (das eskaliert sonst zum laengeren IP-Block). Die andere Plattform laeuft
// weiter -- Instagram blockt die VPS-IP z.B. seit Ende August 2026 komplett
// (401/429 auf die Profil-API), TikTok antwortet normal. Nur 404/"user not
// found" ist ein echter Fehlversuch des jeweiligen Handles.
const blockedPlatforms = new Map(); // platform -> HTTP-Status
const BLOCK_STATUSES = new Set([429, 401, 403]);
const ALL_PLATFORMS = ['instagram', 'tiktok'];

// Instagram-Fallback ueber die Geonode Scraper API (Proxy-Netz, DE-Exit):
// die VPS-IP bekommt von der Instagram-Profil-API nur noch 401/429, ueber
// Geonode kommt die Profilseite mit og:image zurueck. Kostet Tokens pro
// Aufruf -- deshalb nur fuer Instagram, nur wenn der direkte Weg gesperrt
// ist, und pro Creator genau ein Mal (kein Refresh; Creator aendern ihr Bild
// selbst im Konto). Key: GEONODE_SCRAPER_API_KEY in .env.local.
const GEONODE_KEY = process.env.GEONODE_SCRAPER_API_KEY || '';
let geonodeDisabled = !GEONODE_KEY;
if (geonodeDisabled) console.log(`[${new Date().toISOString()}] Kein GEONODE_SCRAPER_API_KEY - Instagram nur direkt.`);

const platformUsable = (platform) => !blockedPlatforms.has(platform)
  || (platform === 'instagram' && !geonodeDisabled);
const allPlatformsBlocked = () => ALL_PLATFORMS.every((platform) => !platformUsable(platform));

// og:image ist 100x100; dieselbe Datei liegt im Seiten-JSON auch als 150x150
// (signierte CDN-URL -- Groesse im Query-String laesst sich nicht umschreiben,
// das gibt 403). Gespiegelt in app/lib/social-avatar.ts.
const extractInstagramAvatarUrl = (html) => {
  const og = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
    || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
  if (!og) return null;
  const small = og[1].replace(/&amp;/g, '&');
  const file = small.match(/\/([^/?]+\.(?:jpe?g|png|webp))\?/i)?.[1];
  if (file) {
    const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const larger = html.match(new RegExp(`https:(?:\\\\/|/){2}[^"'\\s<>]*?${escaped}\\?stp=dst-jpg_s150x150[^"'\\s<>]*`));
    if (larger) return larger[0].replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/&amp;/g, '&');
  }
  return small;
};

const fetchInstagramViaGeonode = async (handle) => {
  if (geonodeDisabled) return null;
  let response;
  try {
    response = await fetch('https://scraper.geonode.io/v1/extract', {
      method: 'POST',
      headers: { 'X-Api-Key': GEONODE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: `https://www.instagram.com/${encodeURIComponent(handle)}/`,
        formats: ['html'],
        processing_mode: 'sync',
        country_code: 'de',
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (error) {
    console.log(`  ERR geonode ${handle}: ${error instanceof Error ? error.message : error}`);
    return null;
  }
  if ([401, 402, 403, 429].includes(response.status)) {
    // Key ungueltig, Guthaben leer oder Rate-Limit: fuer diesen Lauf aus.
    geonodeDisabled = true;
    console.log(`[${new Date().toISOString()}] geonode: HTTP ${response.status} - Instagram-Fallback fuer diesen Lauf deaktiviert.`);
    return null;
  }
  // 422 = Seite nicht verarbeitbar (z.B. Profil geloescht): echter Fehlversuch.
  if (!response.ok) return null;
  const json = await response.json().catch(() => null);
  const html = json?.data?.html;
  return typeof html === 'string' ? extractInstagramAvatarUrl(html) : null;
};

// TikTok liefert das Profilbild nicht mehr als og:image, sondern nur noch als
// JSON im HTML ("avatarLarger", JSON-escaped mit /). og:image bleibt als
// erster Versuch drin, falls es zurueckkommt. Gespiegelt in app/lib/social-avatar.ts.
const extractTikTokAvatarUrl = (html) => {
  const og = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
    || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
  if (og) return og[1].replace(/&amp;/g, '&');
  const json = html.match(/"avatar(?:Larger|Medium)":"((?:[^"\\]|\\.)*)"/);
  if (!json) return null;
  try {
    const url = JSON.parse(`"${json[1]}"`);
    return /^https:\/\//i.test(url) ? url : null;
  } catch {
    return null;
  }
};

const resolveAvatarSourceUrl = async ({ platform, handle }) => {
  if (blockedPlatforms.has(platform)) {
    return platform === 'instagram' ? fetchInstagramViaGeonode(handle) : null;
  }
  const response = platform === 'instagram'
    ? curlFetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`,
      ['Accept: application/json', 'x-ig-app-id: 936619743392459'],
    )
    : curlFetch(`https://www.tiktok.com/@${encodeURIComponent(handle)}`, ['Accept: text/html']);
  if (BLOCK_STATUSES.has(response.status)) {
    blockedPlatforms.set(platform, response.status);
    console.log(`[${new Date().toISOString()}] ${platform}: HTTP ${response.status} (Rate-Limit/Block) - direkter Weg fuer diesen Lauf gesperrt.`);
    return platform === 'instagram' ? fetchInstagramViaGeonode(handle) : null;
  }
  if (response.status !== 200) return null;
  if (platform === 'instagram') {
    let data = null;
    try { data = JSON.parse(response.body.toString('utf8')); } catch { return null; }
    const user = data?.data?.user;
    return user?.profile_pic_url_hd || user?.profile_pic_url || null;
  }
  return extractTikTokAvatarUrl(response.body.toString('utf8'));
};

const downloadImage = async (url) => {
  const response = curlFetch(url, ['Accept: image/*']);
  if (response.status !== 200) return null;
  if (!response.contentType.startsWith('image/')) return null;
  if (response.body.length === 0 || response.body.length > MAX_IMAGE_BYTES) return null;
  return { bytes: response.body, contentType: response.contentType };
};

// Kandidaten: aktive Creator mit Instagram/TikTok-Link, deren Avatar fehlt oder
// aelter als 14 Tage ist. Fehlversuche werden mit wachsendem Abstand wiederholt
// (fail_count-Backoff), damit geloeschte/private Accounts nicht dauerhaft
// jede Stunde angefragt werden.
//
// Der Pool ist groesser als LIMIT: Creator, deren Plattformen in diesem Lauf
// gesperrt sind, werden ohne Malus uebersprungen und zaehlen nicht als
// Versuch. Sonst staenden bei Instagram-Block die IG-only-Profile dauerhaft
// vorne in der Warteschlange und TikTok-Profile kaemen nie an die Reihe.
const POOL_SIZE = FORCE_PUBLIC_ID ? 1 : LIMIT * 8;
const candidates = await sql.query(
  `SELECT p.id, p.public_id, p.display_name,
          COALESCE(s.social_links, '') AS social_links,
          a.fetched_at, a.fail_count
   FROM creator_profiles p
   LEFT JOIN creator_social_avatars a ON a.creator_id = p.id
   LEFT JOIN LATERAL (
     SELECT string_agg(url, E'\n' ORDER BY is_primary DESC, created_at) AS social_links
     FROM creator_social_accounts WHERE creator_id = p.id
   ) s ON true
   WHERE p.status = 'active'
     AND ($2::text IS NOT NULL AND p.public_id = $2 OR $2::text IS NULL AND (
       (s.social_links ILIKE '%instagram.com%' OR s.social_links ILIKE '%tiktok.com%')
       AND (
         a.creator_id IS NULL
         OR (a.image IS NULL AND (a.last_attempt_at IS NULL OR a.last_attempt_at < now() - (least(a.fail_count, 10) + 1) * interval '6 hours'))
       )
     ))
   ORDER BY a.fetched_at ASC NULLS FIRST
   LIMIT $1`,
  [POOL_SIZE, FORCE_PUBLIC_ID],
);

console.log(`[${new Date().toISOString()}] ${candidates.length} Avatar-Kandidaten im Pool (max. ${LIMIT} Versuche)`);

let ok = 0;
let failed = 0;
let skipped = 0;
let attempts = 0;

for (const creator of candidates) {
  if (attempts >= LIMIT) break;
  if (allPlatformsBlocked()) {
    console.log(`[${new Date().toISOString()}] Alle Plattformen gesperrt - Lauf wird abgebrochen, Rest kommt beim naechsten Cron.`);
    break;
  }

  const handles = extractHandles(creator.social_links)
    .filter((handle) => platformUsable(handle.platform))
    .slice(0, 3);
  if (handles.length === 0) {
    skipped += 1;
    continue;
  }

  attempts += 1;
  let stored = false;
  let blockedDuringAttempt = false;

  for (const handle of handles) {
    if (!platformUsable(handle.platform)) { blockedDuringAttempt = true; continue; }
    try {
      const sourceUrl = await resolveAvatarSourceUrl(handle);
      if (!sourceUrl && !platformUsable(handle.platform)) { blockedDuringAttempt = true; continue; }
      if (!sourceUrl) continue;
      const image = await downloadImage(sourceUrl);
      if (!image) continue;
      await sql.query(
        `INSERT INTO creator_social_avatars (
           creator_id, image, content_type, source_platform, source_handle,
           fetched_at, last_attempt_at, fail_count, updated_at
         ) VALUES ($1, $2, $3, $4, $5, now(), now(), 0, now())
         ON CONFLICT (creator_id) DO UPDATE SET
           image = EXCLUDED.image,
           content_type = EXCLUDED.content_type,
           source_platform = EXCLUDED.source_platform,
           source_handle = EXCLUDED.source_handle,
           fetched_at = now(), last_attempt_at = now(), fail_count = 0, updated_at = now()`,
        [creator.id, image.bytes, image.contentType, handle.platform, handle.handle],
      );
      console.log(`  OK  ${creator.public_id} ${creator.display_name} <- ${handle.platform}/${handle.handle} (${image.bytes.length} B, ${image.contentType})`);
      stored = true;
      ok += 1;
      break;
    } catch (error) {
      console.log(`  ERR ${creator.public_id} ${handle.platform}/${handle.handle}: ${error instanceof Error ? error.message : error}`);
    }
  }

  if (!stored && blockedDuringAttempt) {
    // Rate-Limit ist nicht die Schuld des Creators: kein fail_count-Malus.
    continue;
  }

  if (!stored) {
    failed += 1;
    await sql.query(
      `INSERT INTO creator_social_avatars (creator_id, last_attempt_at, fail_count, updated_at)
       VALUES ($1, now(), 1, now())
       ON CONFLICT (creator_id) DO UPDATE SET
         last_attempt_at = now(),
         fail_count = creator_social_avatars.fail_count + 1,
         updated_at = now()`,
      [creator.id],
    );
    console.log(`  --  ${creator.public_id} ${creator.display_name}: kein Bild gefunden (${handles.length} Handles geprueft)`);
  }

  // Hoeflich bleiben: Instagram drosselt schon nach ~1 Dutzend schnellen
  // Requests pro IP (empirisch beim Backfill). 8-14s Abstand haelt den
  // Stundenlauf unter dem Radar; Vollabdeckung passiert ueber viele Laeufe.
  await sleep(8000 + Math.floor(Math.random() * 6000));
}

const blockedInfo = blockedPlatforms.size
  ? ` Gesperrt: ${[...blockedPlatforms].map(([platform, status]) => `${platform}=${status}`).join(', ')}.`
  : '';
console.log(`[${new Date().toISOString()}] Fertig: ${ok} gespeichert, ${failed} ohne Bild, ${skipped} uebersprungen (Plattform gesperrt).${blockedInfo}`);

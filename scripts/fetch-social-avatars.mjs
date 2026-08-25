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

// Wird bei Rate-Limit-/Block-Signalen (429, 401, 403) gesetzt: dann bricht der
// Lauf ab, statt weiter gegen den Block zu rennen (das eskaliert sonst zum
// laengeren IP-Block). Nur 404/"user not found" ist ein echter Fehlversuch des
// jeweiligen Handles.
let rateLimited = false;

const resolveAvatarSourceUrl = async ({ platform, handle }) => {
  if (platform === 'instagram') {
    const response = curlFetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`,
      ['Accept: application/json', 'x-ig-app-id: 936619743392459'],
    );
    if ([429, 401, 403].includes(response.status)) { rateLimited = true; return null; }
    if (response.status !== 200) return null;
    let data = null;
    try { data = JSON.parse(response.body.toString('utf8')); } catch { return null; }
    const user = data?.data?.user;
    return user?.profile_pic_url_hd || user?.profile_pic_url || null;
  }
  const response = curlFetch(`https://www.tiktok.com/@${encodeURIComponent(handle)}`, ['Accept: text/html']);
  if ([429, 401, 403].includes(response.status)) { rateLimited = true; return null; }
  if (response.status !== 200) return null;
  const html = response.body.toString('utf8');
  const match = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
    || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
  return match ? match[1].replace(/&amp;/g, '&') : null;
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
         OR (a.image IS NOT NULL AND a.fetched_at < now() - interval '14 days')
       )
     ))
   ORDER BY a.fetched_at ASC NULLS FIRST
   LIMIT $1`,
  [LIMIT, FORCE_PUBLIC_ID],
);

console.log(`[${new Date().toISOString()}] ${candidates.length} Avatar-Kandidaten (Limit ${LIMIT})`);

let ok = 0;
let failed = 0;

for (const creator of candidates) {
  if (rateLimited) {
    console.log(`[${new Date().toISOString()}] Rate-Limit (429) erkannt - Lauf wird abgebrochen, Rest kommt beim naechsten Cron.`);
    break;
  }

  const handles = extractHandles(creator.social_links).slice(0, 3);
  let stored = false;

  for (const handle of handles) {
    try {
      const sourceUrl = await resolveAvatarSourceUrl(handle);
      if (rateLimited) break;
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

  if (!stored && rateLimited) {
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

console.log(`[${new Date().toISOString()}] Fertig: ${ok} gespeichert, ${failed} ohne Bild.`);

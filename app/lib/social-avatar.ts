// Automatische Uebernahme des Social-Profilbilds (Instagram/TikTok).
//
// Instagram-CDN-URLs sind signiert und laufen nach Tagen ab - deshalb werden
// die Bild-Bytes in creator_social_avatars persistiert und ueber
// /api/avatar/[publicId] von der eigenen Domain ausgeliefert (CSP 'self').
//
// Instagram blockt Vercel-Rechenzentrums-IPs meist: die Fetches hier sind
// Best-Effort beim Speichern; die verlaessliche Quelle ist der VPS-Cron
// (scripts/fetch-social-avatars.mjs), der dieselbe Tabelle befuellt.

type SqlClient = { query: (query: string, params?: unknown[]) => Promise<any[]> };

export type SocialHandle = { platform: 'instagram' | 'tiktok'; handle: string };

// Pfad-Segmente, die auf instagram.com KEIN Benutzername sind.
const IG_RESERVED_SEGMENTS = new Set([
  'p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'share', 'tv',
  'direct', 'about', 'legal', 'developer',
]);

const SOCIAL_PAGE_HOSTS = /(^|\.)(instagram\.com|tiktok\.com|facebook\.com|youtube\.com|youtu\.be|x\.com|twitter\.com|linkedin\.com|pinterest\.[a-z.]+)$/i;

// Share-/Viewer-Seiten, die HTML statt eines Bildes liefern und sich nicht in
// einen direkten Bildlink umschreiben lassen.
const NON_IMAGE_SHARE_HOSTS = /(^|\.)(share\.icloud\.com|icloud\.com|photos\.google\.com|photos\.app\.goo\.gl)$/i;

// CDN-Hosts mit ablaufenden Signaturen: taugen nicht als dauerhaft gespeicherte
// Bild-URL (Altbestand aus der Airtable-Aera).
const EXPIRING_CDN_HOSTS = /(cdninstagram\.com|fbcdn\.net|tiktokcdn(-[a-z]+)?\.com|tiktokcdn\.[a-z]+)$/i;

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/** Ist die URL ein Link auf eine Social-Media-/Share-SEITE statt auf eine Bilddatei? */
export const isSocialPageUrl = (value: string): boolean => {
  try {
    const host = new URL(value).hostname;
    return SOCIAL_PAGE_HOSTS.test(host) || NON_IMAGE_SHARE_HOSTS.test(host);
  } catch {
    return false;
  }
};

/**
 * Schreibt bekannte Viewer-Links in direkte Bildlinks um (aktuell: Google-Drive
 * "file/d/<id>/view" -> "uc?export=view&id=<id>"). Gibt sonst die URL unveraendert zurueck.
 */
export const rewriteToDirectImageUrl = (value: string): string => {
  try {
    const url = new URL(value);
    if (/(^|\.)drive\.google\.com$/i.test(url.hostname)) {
      const match = url.pathname.match(/^\/file\/d\/([\w-]+)/);
      if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    return value;
  } catch {
    return value;
  }
};

/** URL auf einem CDN mit ablaufender Signatur - nicht dauerhaft speicherbar/anzeigbar. */
export const isExpiringCdnUrl = (value: string): boolean => {
  try {
    return EXPIRING_CDN_HOSTS.test(new URL(value).hostname);
  } catch {
    return false;
  }
};

/** Taugt der gespeicherte Wert als vom Creator gesetztes, direktes Bild? */
export const isUsableCustomImageUrl = (value: string | null | undefined): boolean => {
  if (!value) return false;
  return !isSocialPageUrl(value) && !isExpiringCdnUrl(value);
};

/** Extrahiert Instagram-/TikTok-Handles aus Social-Links (Instagram zuerst). */
export const extractSocialHandles = (socialLinks: string[] | string): SocialHandle[] => {
  const links = Array.isArray(socialLinks)
    ? socialLinks
    : String(socialLinks || '').split('\n');
  const handles: SocialHandle[] = [];

  for (const link of links.map((item) => item.trim()).filter(Boolean)) {
    try {
      const url = new URL(/^https?:\/\//i.test(link) ? link : `https://${link}`);
      const host = url.hostname.toLowerCase();
      const first = url.pathname.split('/').filter(Boolean)[0] || '';

      if (/(^|\.)instagram\.com$/.test(host)) {
        const handle = first.replace(/^@/, '');
        if (handle && !IG_RESERVED_SEGMENTS.has(handle.toLowerCase())) {
          handles.push({ platform: 'instagram', handle: handle.slice(0, 120) });
        }
      } else if (/(^|\.)tiktok\.com$/.test(host) && first.startsWith('@')) {
        handles.push({ platform: 'tiktok', handle: first.slice(1, 121) });
      }
    } catch {
      // kaputte Links ignorieren
    }
  }

  return handles.sort((a, b) => (a.platform === b.platform ? 0 : a.platform === 'instagram' ? -1 : 1));
};

const fetchWithTimeout = async (url: string, headers: Record<string, string>, timeoutMs: number) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers, signal: controller.signal, redirect: 'follow' });
  } finally {
    clearTimeout(timer);
  }
};

/** Ermittelt die (kurzlebige) CDN-URL des Profilbilds fuer ein Handle. */
export const resolveAvatarSourceUrl = async (
  { platform, handle }: SocialHandle,
  timeoutMs = 6000,
): Promise<string | null> => {
  if (platform === 'instagram') {
    const response = await fetchWithTimeout(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`,
      { 'User-Agent': BROWSER_UA, Accept: 'application/json', 'x-ig-app-id': '936619743392459' },
      timeoutMs,
    );
    if (!response.ok) return null;
    const data = await response.json().catch(() => null);
    const user = data?.data?.user;
    return user?.profile_pic_url_hd || user?.profile_pic_url || null;
  }

  const response = await fetchWithTimeout(
    `https://www.tiktok.com/@${encodeURIComponent(handle)}`,
    { 'User-Agent': BROWSER_UA, Accept: 'text/html' },
    timeoutMs,
  );
  if (!response.ok) return null;
  const html = await response.text();
  const match = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
    || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
  return match ? match[1].replace(/&amp;/g, '&') : null;
};

/** Laedt die Bild-Bytes (max. 2 MB, muss image/* sein). */
export const downloadAvatarImage = async (
  url: string,
  timeoutMs = 6000,
): Promise<{ bytes: Buffer; contentType: string } | null> => {
  const response = await fetchWithTimeout(url, { 'User-Agent': BROWSER_UA, Accept: 'image/*' }, timeoutMs);
  if (!response.ok) return null;
  const contentType = (response.headers.get('content-type') || '').split(';')[0].trim();
  if (!contentType.startsWith('image/')) return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) return null;
  return { bytes, contentType };
};

export const upsertSocialAvatar = async (
  sql: SqlClient,
  creatorId: string,
  avatar: { bytes: Buffer; contentType: string; platform: string; handle: string },
): Promise<void> => {
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
       fetched_at = now(),
       last_attempt_at = now(),
       fail_count = 0,
       updated_at = now()`,
    [creatorId, avatar.bytes, avatar.contentType, avatar.platform, avatar.handle],
  );
};

const recordAttemptFailure = async (sql: SqlClient, creatorId: string): Promise<void> => {
  await sql.query(
    `INSERT INTO creator_social_avatars (creator_id, last_attempt_at, fail_count, updated_at)
     VALUES ($1, now(), 1, now())
     ON CONFLICT (creator_id) DO UPDATE SET
       last_attempt_at = now(),
       fail_count = creator_social_avatars.fail_count + 1,
       updated_at = now()`,
    [creatorId],
  );
};

/**
 * Best-Effort: Profilbild sofort holen und speichern. Wirft nie - Vercel-IPs
 * werden von Instagram haeufig geblockt, dann uebernimmt der VPS-Cron.
 */
export const tryUpdateSocialAvatar = async (
  sql: SqlClient,
  creatorId: string,
  socialLinks: string[] | string,
  timeoutMs = 3000,
): Promise<boolean> => {
  try {
    // Nur das erste Handle (Instagram bevorzugt): das hier laeuft im
    // Request-Pfad des Speicherns, worst case sonst mehrere Timeouts in Serie.
    // Weitere Handles probiert der VPS-Cron.
    for (const handle of extractSocialHandles(socialLinks).slice(0, 1)) {
      const sourceUrl = await resolveAvatarSourceUrl(handle, timeoutMs);
      if (!sourceUrl) continue;
      const image = await downloadAvatarImage(sourceUrl, timeoutMs);
      if (!image) continue;
      await upsertSocialAvatar(sql, creatorId, { ...image, platform: handle.platform, handle: handle.handle });
      return true;
    }
    await recordAttemptFailure(sql, creatorId);
  } catch {
    // Best-Effort: Fehler hier duerfen Registrierung/Speichern nie kippen.
  }
  return false;
};

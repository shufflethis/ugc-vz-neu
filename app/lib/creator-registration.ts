export type CreatorRegistrationPayload = {
  name: string;
  stageName: string;
  email: string;
  birthYear: number | null;
  gender: string;
  city: string;
  profileImageUrl: string | null;
  topics: string;
  preferredContent: string;
  industries: string;
  rateText: string;
  reachText: string;
  equipment: string;
  specialTraits: string;
  childrenContext: string;
  petContext: string;
  socialLinks: string[];
  portfolioLinks: string[];
  platformConsent: true;
  projectConsent: true;
  newsletterConsent: boolean;
  consentTextVersion: 'native-creator-v1-2026-07-16';
};

export const CREATOR_CONSENT_TEXT_VERSION = 'native-creator-v1-2026-07-16' as const;

/**
 * Normalisiert eine einzelne Bild-URL. Akzeptiert nur http(s), laesst Query-Parameter
 * (Bildgroesse etc.) bewusst stehen und liefert null bei leerer/ungueltiger Eingabe.
 */
export const normalizeImageUrl = (value: unknown): string | null => {
  let candidate = String(value || '').trim();
  if (!candidate) return null;
  if (/^www\./i.test(candidate)) candidate = `https://${candidate}`;
  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
};

export const normalizeWebUrls = (value: unknown, max = 8): string[] => {
  const source = Array.isArray(value) ? value.join('\n') : String(value || '');
  const candidates = source
    .split(/[\n,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const urls: string[] = [];

  for (let candidate of candidates) {
    if (/^www\./i.test(candidate)) candidate = `https://${candidate}`;
    if (/^(?:instagram|tiktok|youtube|youtu\.be|facebook|linkedin|pinterest|drive\.google)\./i.test(candidate)) {
      candidate = `https://${candidate}`;
    }
    try {
      const url = new URL(candidate);
      if (!['http:', 'https:'].includes(url.protocol)) continue;
      url.protocol = 'https:';
      url.hash = '';
      if (['instagram.com', 'www.instagram.com', 'tiktok.com', 'www.tiktok.com'].includes(url.hostname.toLowerCase())) {
        url.search = '';
      }
      const normalized = url.toString();
      if (!urls.includes(normalized)) urls.push(normalized);
    } catch {
      // Ignore malformed links; the route reports if no usable social link remains.
    }
    if (urls.length >= max) break;
  }

  return urls;
};

export const socialPlatform = (url: string) => {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes('instagram')) return 'instagram';
  if (host.includes('tiktok')) return 'tiktok';
  if (host.includes('youtube') || host.includes('youtu.be')) return 'youtube';
  if (host.includes('facebook')) return 'facebook';
  if (host.includes('linkedin')) return 'linkedin';
  if (host.includes('pinterest')) return 'pinterest';
  return 'other';
};

export const socialHandle = (url: string) => {
  try {
    return new URL(url).pathname.split('/').filter(Boolean)[0]?.replace(/^@/, '').slice(0, 120) || null;
  } catch {
    return null;
  }
};

export const calculateReach = (value: string) => {
  let total = 0;
  for (const match of value.toLowerCase().matchAll(/\b(\d{1,3}(?:[.]\d{3})+|\d+(?:[.,]\d+)?)\s*(k|tsd|mio|m)?\b/g)) {
    let number = match[1];
    const suffix = match[2] || '';
    if (!suffix && /^\d{1,3}(?:\.\d{3})+$/.test(number)) number = number.replace(/\./g, '');
    else number = number.replace(',', '.');
    let parsed = Number(number);
    if (!Number.isFinite(parsed)) continue;
    if (suffix === 'k' || suffix === 'tsd') parsed *= 1_000;
    if (suffix === 'm' || suffix === 'mio') parsed *= 1_000_000;
    if (parsed > 0 && parsed < 100_000_000) total += Math.round(parsed);
  }
  return Math.min(total, 2_000_000_000);
};

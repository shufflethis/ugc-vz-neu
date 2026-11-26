import crypto from 'node:crypto';
import * as cheerio from 'cheerio';
import { z } from 'zod';
import {
  buildAiHeaders,
  buildChatRequestBody,
  resolveAiProvider,
  resolveChatModels,
  transcribeAudioWithOpenAI,
} from './ai-provider';
import { sanitizePublicSearchSnippet, upsertCreatorSearchIndex, type SqlClient } from './search-index';
import { extractSocialHandles } from './social-avatar';

export type AiProfileStatus =
  | 'pending'
  | 'analyzing'
  | 'draft_ready'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'failed';

export class AiConsentRequiredError extends Error {
  constructor(message = 'Für die KI-Profilanalyse ist zuerst deine ausdrückliche Einwilligung erforderlich.') {
    super(message);
    this.name = 'AiConsentRequiredError';
  }
}

export type VisualSignal = {
  signal: string;
  category: string;
  evidence: string;
  sourceUrl?: string;
};

export type ContentStyle = {
  formats: string[];
  tone: string;
  setting: string;
  productionQuality: string;
};

export type CreatorAiProfileRecord = {
  status: AiProfileStatus;
  draftSummary: string;
  approvedSummary: string;
  inferredNiches: string[];
  approvedNiches: string[];
  visualSignals: VisualSignal[];
  contentStyle: ContentStyle;
  sourceSnapshot: {
    channelsChecked?: string[];
    imagesAnalyzed?: number;
    model?: string;
  };
  creatorVoiceTranscript: string;
  consentAt: string | null;
  withdrawnAt: string | null;
  nextRefreshAt: string | null;
  rawExpiresAt: string | null;
  analyzedAt: string | null;
  approvedAt: string | null;
  lastError: string | null;
};

export type ExtractedChannelSnapshot = {
  url: string;
  platform: string;
  title: string;
  bioOrDescription: string;
  captions: string[];
  imageUrls: string[];
};

export const VisualSignalSchema = z.object({
  signal: z.string().min(2).transform((s) => s.slice(0, 100)),
  category: z.string().min(1).default('general').transform((s) => s.slice(0, 40)),
  evidence: z.string().min(2).transform((s) => s.slice(0, 220)),
  sourceUrl: z.string().transform((s) => s.slice(0, 400)).optional(),
});

export const ContentStyleSchema = z.object({
  formats: z.array(z.string().min(1).transform((s) => s.slice(0, 60))).default([]).transform((arr) => arr.slice(0, 8)),
  tone: z.string().default('').transform((s) => s.slice(0, 120)),
  setting: z.string().default('').transform((s) => s.slice(0, 140)),
  productionQuality: z.string().default('').transform((s) => s.slice(0, 120)),
});

export const AiProfileDraftSchema = z.object({
  draft_summary: z.string().min(20).transform((s) => s.slice(0, 1_500)),
  inferred_niches: z.array(z.string().min(2).transform((s) => s.slice(0, 60))).default([]).transform((arr) => arr.slice(0, 15)),
  visual_signals: z.array(VisualSignalSchema).default([]).transform((arr) => arr.slice(0, 12)),
  content_style: ContentStyleSchema.default({ formats: [], tone: '', setting: '', productionQuality: '' }),
});

export type AiProfileDraftOutput = z.infer<typeof AiProfileDraftSchema>;

export const VoiceRefineSchema = z.object({
  transcript: z.string().default('').transform((s) => s.slice(0, 2_500)),
  updatedSummary: z.string().min(20).transform((s) => s.slice(0, 1_500)),
  updatedNiches: z.array(z.string().min(2).transform((s) => s.slice(0, 60))).default([]).transform((arr) => arr.slice(0, 15)),
  changesSummary: z.string().default('').transform((s) => s.slice(0, 300)),
});

export type VoiceRefineOutput = z.infer<typeof VoiceRefineSchema>;

export const DEFAULT_ANALYZER_MODEL =
  process.env.CREATOR_ANALYZER_MODEL || 'google/gemini-2.5-flash';

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// ---------- Test hooks (used exclusively in automated test suites) ----------
type AnalyzerMockFn = (input: {
  publicProfileText: string;
  channels: ExtractedChannelSnapshot[];
  imageCount: number;
}) => Promise<AiProfileDraftOutput>;

type VoiceRefinerMockFn = (input: {
  currentSummary: string;
  currentNiches: string[];
  audioBase64?: string;
  audioFormat?: string;
  instructionText?: string;
}) => Promise<VoiceRefineOutput>;

let testAnalyzerFn: AnalyzerMockFn | null = null;
let testVoiceRefinerFn: VoiceRefinerMockFn | null = null;

export function setSocialAnalyzerForTests(fn: AnalyzerMockFn | null) {
  testAnalyzerFn = fn;
}

export function setVoiceRefinerForTests(fn: VoiceRefinerMockFn | null) {
  testVoiceRefinerFn = fn;
}

// ---------- SSRF Protection ----------
function isPrivateOrBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host) return true;
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.arpa') ||
    host === 'metadata.google.internal'
  ) {
    return true;
  }

  // IPv4 literal check
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast / reserved
  }

  // IPv6 loopback / private / link-local / IPv4-mapped
  if (host.includes(':')) {
    if (
      host === '::1' ||
      host === '::' ||
      host.startsWith('fc') ||
      host.startsWith('fd') ||
      host.startsWith('fe80') ||
      host.startsWith('::ffff:')
    ) {
      return true;
    }
  }

  // Require at least one dot for public DNS names
  if (!host.includes('.')) return true;

  return false;
}

/**
 * Strictly validates that a URL is safe for outbound server-side fetching.
 * Blocks file://, non-HTTPS protocols, credentials, custom ports, localhost, and private/metadata IPs.
 */
export function isSafeExternalUrl(rawUrl: string): URL | null {
  try {
    const trimmed = String(rawUrl || '').trim();
    if (!trimmed || trimmed.length > 1_000) return null;
    const url = new URL(trimmed);
    if (url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;
    if (url.port && url.port !== '443') return null;
    if (isPrivateOrBlockedHost(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

async function fetchSafeText(
  rawUrl: string,
  timeoutMs = 7_000,
  maxBytes = 350_000,
): Promise<{ status: number; text: string } | null> {
  const safe = isSafeExternalUrl(rawUrl);
  if (!safe) return null;
  try {
    const response = await fetch(safe.toString(), {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });
    // Validate final redirect target as well
    if (response.url && !isSafeExternalUrl(response.url)) return null;
    const status = response.status;
    if (status !== 200) return { status, text: '' };
    const buf = Buffer.from(await response.arrayBuffer());
    return { status, text: buf.subarray(0, maxBytes).toString('utf8') };
  } catch {
    return null;
  }
}

async function fetchSafeImageDataUrl(rawUrl: string, timeoutMs = 6_000): Promise<string | null> {
  const safe = isSafeExternalUrl(rawUrl);
  if (!safe) return null;
  try {
    const response = await fetch(safe.toString(), {
      headers: { 'User-Agent': BROWSER_UA, Accept: 'image/*' },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return null;
    if (response.url && !isSafeExternalUrl(response.url)) return null;
    const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!contentType.startsWith('image/')) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > 650_000) return null;
    return `data:${contentType};base64,${bytes.toString('base64')}`;
  } catch {
    return null;
  }
}

function extractTikTokSnapshot(url: string, html: string): ExtractedChannelSnapshot {
  const $ = cheerio.load(html);
  const title = sanitizePublicSearchSnippet($('meta[property="og:title"]').attr('content') || $('title').text(), 140);
  const ogDesc = sanitizePublicSearchSnippet($('meta[property="og:description"]').attr('content') || '', 400);

  const captions: string[] = [];
  const imageUrls: string[] = [];

  const ogImg = $('meta[property="og:image"]').attr('content');
  if (ogImg && isSafeExternalUrl(ogImg)) imageUrls.push(ogImg);

  // Try extracting bio & video descriptions from TikTok's rehydration JSON
  const rehydration = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__').text();
  let signature = '';
  if (rehydration) {
    try {
      const sigMatch = rehydration.match(/"signature":"((?:[^"\\]|\\.)*)"/);
      if (sigMatch) signature = sanitizePublicSearchSnippet(JSON.parse(`"${sigMatch[1]}"`), 320);

      for (const descMatch of rehydration.matchAll(/"desc":"((?:[^"\\]|\\.)*)"/g)) {
        if (captions.length >= 8) break;
        try {
          const decoded = sanitizePublicSearchSnippet(JSON.parse(`"${descMatch[1]}"`), 200);
          if (decoded && decoded.length >= 6 && !captions.includes(decoded)) captions.push(decoded);
        } catch {
          // ignore malformed snippet
        }
      }

      for (const coverMatch of rehydration.matchAll(/"(?:cover|originCover)":"((?:[^"\\]|\\.)*)"/g)) {
        if (imageUrls.length >= 4) break;
        try {
          const decoded = JSON.parse(`"${coverMatch[1]}"`);
          if (typeof decoded === 'string' && isSafeExternalUrl(decoded) && !imageUrls.includes(decoded)) {
            imageUrls.push(decoded);
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore JSON parsing issues
    }
  }

  return {
    url,
    platform: 'tiktok',
    title,
    bioOrDescription: [signature, ogDesc].filter(Boolean).join(' · ').slice(0, 500),
    captions,
    imageUrls,
  };
}

function extractInstagramSnapshotFromHtml(url: string, html: string): ExtractedChannelSnapshot {
  const $ = cheerio.load(html);
  const title = sanitizePublicSearchSnippet($('meta[property="og:title"]').attr('content') || $('title').text(), 140);
  const desc = sanitizePublicSearchSnippet(
    $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '',
    500,
  );
  const imageUrls: string[] = [];
  const ogImg = $('meta[property="og:image"]').attr('content');
  if (ogImg && isSafeExternalUrl(ogImg)) imageUrls.push(ogImg);

  const captions: string[] = [];
  $('img[alt]').each((_i, el) => {
    if (captions.length >= 6) return;
    const alt = sanitizePublicSearchSnippet($(el).attr('alt'), 220);
    if (alt && alt.length > 15 && !captions.includes(alt)) captions.push(alt);
    const src = $(el).attr('src');
    if (src && imageUrls.length < 4 && isSafeExternalUrl(src) && !imageUrls.includes(src)) {
      imageUrls.push(src);
    }
  });

  return {
    url,
    platform: 'instagram',
    title,
    bioOrDescription: desc,
    captions,
    imageUrls,
  };
}

function extractGenericWebSnapshot(url: string, platform: string, html: string): ExtractedChannelSnapshot {
  const $ = cheerio.load(html);
  $('script, style, noscript, iframe, svg').remove();
  const title = sanitizePublicSearchSnippet($('meta[property="og:title"]').attr('content') || $('title').text(), 160);
  const metaDesc = sanitizePublicSearchSnippet(
    $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '',
    400,
  );
  const headings = $('h1, h2, h3')
    .map((_i, el) => sanitizePublicSearchSnippet($(el).text(), 120))
    .get()
    .filter(Boolean)
    .slice(0, 8);
  const bodySnippet = sanitizePublicSearchSnippet($('body').text(), 900);
  const imageUrls: string[] = [];
  const ogImg = $('meta[property="og:image"]').attr('content');
  if (ogImg && isSafeExternalUrl(ogImg)) imageUrls.push(ogImg);

  return {
    url,
    platform,
    title,
    bioOrDescription: [metaDesc, ...headings.slice(0, 4)].filter(Boolean).join(' · ').slice(0, 600),
    captions: bodySnippet ? [bodySnippet] : [],
    imageUrls,
  };
}

async function fetchInstagramHtmlViaGeonode(handle: string, timeoutMs = 25_000): Promise<string | null> {
  const key = process.env.GEONODE_SCRAPER_API_KEY;
  if (!key) return null;
  try {
    const response = await fetch('https://scraper.geonode.io/v1/extract', {
      method: 'POST',
      headers: { 'X-Api-Key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: `https://www.instagram.com/${encodeURIComponent(handle)}/`,
        formats: ['html'],
        processing_mode: 'sync',
        country_code: 'de',
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return null;
    const json = await response.json().catch(() => null);
    return typeof json?.data?.html === 'string' ? json.data.html : null;
  } catch {
    return null;
  }
}

export async function extractCreatorChannelSignals(input: {
  socialLinks: string[];
  portfolioLinks: string[];
  allowGeonode?: boolean;
  skipNetwork?: boolean;
}): Promise<{ snapshots: ExtractedChannelSnapshot[]; imageDataUrls: string[] }> {
  const snapshots: ExtractedChannelSnapshot[] = [];
  const imageDataUrls: string[] = [];

  if (input.skipNetwork) {
    return { snapshots, imageDataUrls };
  }

  const candidateUrls: Array<{ url: string; platform: string }> = [];
  for (const link of input.socialLinks.slice(0, 4)) {
    const safe = isSafeExternalUrl(link);
    if (!safe) continue;
    const host = safe.hostname.toLowerCase();
    const platform = host.includes('instagram')
      ? 'instagram'
      : host.includes('tiktok')
        ? 'tiktok'
        : host.includes('youtube') || host.includes('youtu.be')
          ? 'youtube'
          : 'social';
    candidateUrls.push({ url: safe.toString(), platform });
  }
  for (const link of input.portfolioLinks.slice(0, 3)) {
    const safe = isSafeExternalUrl(link);
    if (!safe) continue;
    candidateUrls.push({ url: safe.toString(), platform: 'portfolio' });
  }

  const collectedImageUrls: string[] = [];

  for (const target of candidateUrls) {
    if (target.platform === 'instagram') {
      const handles = extractSocialHandles([target.url]).filter((h) => h.platform === 'instagram');
      const handle = handles[0]?.handle;
      let html: string | null = null;
      if (input.allowGeonode && handle && process.env.GEONODE_SCRAPER_API_KEY) {
        html = await fetchInstagramHtmlViaGeonode(handle);
      }
      if (!html) {
        const direct = await fetchSafeText(target.url, 4_500);
        if (direct && direct.status === 200 && direct.text) html = direct.text;
      }
      if (html) {
        const snap = extractInstagramSnapshotFromHtml(target.url, html);
        if (snap.title || snap.bioOrDescription || snap.captions.length) snapshots.push(snap);
        collectedImageUrls.push(...snap.imageUrls);
      }
      continue;
    }

    const res = await fetchSafeText(target.url, 6_000);
    if (!res || res.status !== 200 || !res.text) continue;

    const snap =
      target.platform === 'tiktok'
        ? extractTikTokSnapshot(target.url, res.text)
        : extractGenericWebSnapshot(target.url, target.platform, res.text);

    if (snap.title || snap.bioOrDescription || snap.captions.length) {
      snapshots.push(snap);
    }
    collectedImageUrls.push(...snap.imageUrls);
  }

  // Download up to 5 small thumbnail images for multimodal vision inspection
  const uniqueImgUrls = [...new Set(collectedImageUrls)].slice(0, 5);
  for (const imgUrl of uniqueImgUrls) {
    const dataUrl = await fetchSafeImageDataUrl(imgUrl, 5_000);
    if (dataUrl) imageDataUrls.push(dataUrl);
  }

  return { snapshots, imageDataUrls };
}

export async function generateAiProfileDraft(input: {
  publicProfileText: string;
  channels: ExtractedChannelSnapshot[];
  imageDataUrls: string[];
  model?: string;
}): Promise<AiProfileDraftOutput> {
  if (testAnalyzerFn) {
    const raw = await testAnalyzerFn({
      publicProfileText: input.publicProfileText,
      channels: input.channels,
      imageCount: input.imageDataUrls.length,
    });
    return AiProfileDraftSchema.parse(raw);
  }

  const resolved = resolveAiProvider();
  if (!resolved) {
    throw new Error('OPENROUTER_API_KEY oder OPENAI_API_KEY ist nicht konfiguriert.');
  }

  const [model] = resolveChatModels(resolved, 'vision_analyzer', input.model || process.env.CREATOR_ANALYZER_MODEL);
  const userContent: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [
    {
      type: 'text',
      text: `Erstelle aus diesen öffentlichen Creator-Daten, verlinkten Kanal-Auszügen und Bildern eine präzise, ehrliche Profilzusammenfassung für die Brand-Suche.

ÖFFENTLICHE PROFILANGABEN:
${input.publicProfileText}

AUSGELESENE KANAL- & PORTFOLIO-SIGNALE:
${input.channels.length ? JSON.stringify(input.channels.map((c) => ({
  platform: c.platform,
  url: c.url,
  title: c.title,
  bio: c.bioOrDescription,
  captions: c.captions.slice(0, 6),
})), null, 2) : 'Keine externen Kanaldaten abrufbar — nutze ausschließlich Profilangaben und bereitgestellte Bilder.'}`,
    },
  ];

  for (const dataUrl of input.imageDataUrls.slice(0, 6)) {
    userContent.push({ type: 'image_url', image_url: { url: dataUrl } });
  }

  const response = await fetch(`${resolved.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: buildAiHeaders(resolved, { title: 'UGC VZ Creator Social Analyzer' }),
    body: JSON.stringify(
      buildChatRequestBody(resolved, {
        model,
        messages: [
          {
            role: 'system',
            content: `Du bist ein sachlicher UGC-Casting-Analyst für ugc-vz.de.
Deine Aufgabe: Fasse ein Creator-Profil + öffentliche Kanal-Infos + Bilder so zusammen, dass Marken den Creator für passende Produkte/Nischen präzise finden — und der Creator selbst den Text im Konto gegenlesen und ergänzen kann.

Antworte AUSSCHLIESSLICH mit validem JSON in diesem Format:
{
  "draft_summary": "60 bis 90 Wörter auf Deutsch, sachlich und konkret (ohne Werbefloskeln, ohne Gedankenstriche). Nenne echte Nischen, konkrete Themen/Subthemen, typische Settings (z. B. Auto/Werkstatt, Küche, Haustier, Familie, Outdoor, Homeoffice) und Content-Formate.",
  "inferred_niches": ["Konkrete Nische 1", "Subnische 2", "..."],
  "visual_signals": [
    { "signal": "Konkretes Merkmal (z. B. Fahrzeug/Garage sichtbar)", "category": "auto_mobilitaet", "evidence": "Kurzbeleg aus Bild/Bio/Profil" }
  ],
  "content_style": {
    "formats": ["talking_head", "tutorial", "unboxing"],
    "tone": "z. B. ruhig, erklärend, humorvoll",
    "setting": "z. B. Alltag zu Hause, Outdoor, Werkstatt",
    "productionQuality": "basic | good | high"
  }
}

STRENGE ANTI-HALLUZINATIONS- UND DATENSCHUTZ-REGELN (Spec 8.6):
- Nenne NUR Fakten, Nischen und visuelle Signale, die in den bereitgestellten Texten oder Bildern tatsächlich vorkommen!
- Erfinde NIEMALS Hobbys, Autos, Haustiere, Kinder, Berufe oder Marken.
- VERBOTEN: Keine Gesichtserkennung! Schätze NIEMALS Alter, ethnische Herkunft, Gesundheit, Religion, politische Meinung oder andere sensible Merkmale!
- Werte NIEMALS Kommentare oder Daten Dritter aus.
- Wenn die Datenlage dünn ist, bleibe bewusst knapp und faktisch bei den bekannten Profilangaben.
- Übernimm NIEMALS E-Mail-Adressen, Telefonnummern oder private Wohnadressen.`,
          },
          { role: 'user', content: userContent },
        ],
        temperature: 0.2,
        maxTokens: 900,
        expectJson: true,
      }),
    ),
    signal: AbortSignal.timeout(22_000),
  });

  if (!response.ok) {
    throw new Error(`${resolved.provider} analyzer HTTP ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Analyzer returned empty content');
  }
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON object in analyzer response');

  const parsed = AiProfileDraftSchema.parse(JSON.parse(jsonMatch[0]));
  return {
    ...parsed,
    draft_summary: sanitizePublicSearchSnippet(parsed.draft_summary, 1_500),
    inferred_niches: [...new Set(parsed.inferred_niches.map((n) => sanitizePublicSearchSnippet(n, 60)).filter(Boolean))],
    visual_signals: parsed.visual_signals.map((v) => ({
      signal: sanitizePublicSearchSnippet(v.signal, 100),
      category: sanitizePublicSearchSnippet(v.category, 40) || 'general',
      evidence: sanitizePublicSearchSnippet(v.evidence, 220),
      ...(v.sourceUrl && isSafeExternalUrl(v.sourceUrl) ? { sourceUrl: v.sourceUrl } : {}),
    })),
  };
}

export async function refineAiProfileWithVoiceOrText(input: {
  currentSummary: string;
  currentNiches: string[];
  audio?: { base64: string; format: 'webm' | 'mp4' | 'ogg' | 'wav' | 'mp3' };
  instructionText?: string;
  model?: string;
}): Promise<VoiceRefineOutput> {
  if (testVoiceRefinerFn) {
    const raw = await testVoiceRefinerFn({
      currentSummary: input.currentSummary,
      currentNiches: input.currentNiches,
      audioBase64: input.audio?.base64,
      audioFormat: input.audio?.format,
      instructionText: input.instructionText,
    });
    return VoiceRefineSchema.parse(raw);
  }

  const resolved = resolveAiProvider();
  if (!resolved) {
    throw new Error('OPENROUTER_API_KEY oder OPENAI_API_KEY ist nicht konfiguriert.');
  }

  const [model] = resolveChatModels(resolved, 'voice_refine', input.model || process.env.CREATOR_ANALYZER_MODEL);
  let effectiveInstruction = input.instructionText;
  let whisperTranscript: string | null = null;

  // OpenAI provider uses Whisper (/audio/transcriptions) + chat completion for reliable German audio refinement.
  if (input.audio && resolved.provider === 'openai') {
    whisperTranscript = await transcribeAudioWithOpenAI(resolved, input.audio, 20_000);
    effectiveInstruction = [effectiveInstruction, whisperTranscript].filter(Boolean).join('\n');
  }

  const userContent: Array<any> = [
    {
      type: 'text',
      text: `Aktuelle Profilzusammenfassung:
${input.currentSummary || '(noch leer)'}

Aktuelle Nischen-Tags:
${input.currentNiches.length ? input.currentNiches.join(', ') : '(noch keine)'}

${effectiveInstruction ? `Ergänzung / Korrektur des Creators:\n"${effectiveInstruction}"` : 'Höre dir die angehängte deutsche Sprachnachricht des Creators an, transkribiere sie wörtlich und arbeite alle Ergänzungen und Korrekturen sauber in die Profilzusammenfassung und die Nischen-Tags ein.'}`,
    },
  ];

  if (input.audio && resolved.provider === 'openrouter') {
    userContent.push({
      type: 'input_audio',
      input_audio: {
        data: input.audio.base64,
        format: input.audio.format,
      },
    });
  }

  const response = await fetch(`${resolved.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: buildAiHeaders(resolved, { title: 'UGC VZ Creator Voice Profile Refinement' }),
    body: JSON.stringify(
      buildChatRequestBody(resolved, {
        model,
        messages: [
          {
            role: 'system',
            content: `Du hilfst einem UGC-Creator dabei, seine öffentliche Profilzusammenfassung für Marken zu verbessern.
Arbeite die gesprochene oder geschriebene Rückmeldung des Creators exakt ein:
- Übernimm konkrete neue Details (z. B. Fahrzeugmodell, Haustier, Hobbys, Beruf, Dialekt, Equipment, spezielle Nischen).
- Streiche Dinge, die der Creator ausdrücklich korrigiert oder verneint.
- Schreibe sachlich, klar und ohne Werbefloskeln auf Deutsch (4-6 Sätze).
- Entferne jegliche privaten Kontaktdaten (E-Mail, Telefon, Hausnummer/Adresse).

Antworte NUR mit validem JSON:
{
  "transcript": "Wörtliches Transkript der Sprachnachricht (oder die Text-Anweisung)",
  "updatedSummary": "Aktualisierte, vollständige Profilzusammenfassung auf Deutsch",
  "updatedNiches": ["Nische 1", "Nische 2", "..."],
  "changesSummary": "1 kurzer Satz, was ergänzt oder korrigiert wurde"
}`,
          },
          { role: 'user', content: userContent },
        ],
        temperature: 0.2,
        maxTokens: 900,
        expectJson: true,
      }),
    ),
    signal: AbortSignal.timeout(24_000),
  });

  if (!response.ok) {
    throw new Error(`${resolved.provider} voice refinement HTTP ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Voice refinement returned empty content');
  }
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON object in voice refinement response');

  const parsed = VoiceRefineSchema.parse(JSON.parse(jsonMatch[0]));
  return {
    transcript: sanitizePublicSearchSnippet(whisperTranscript || parsed.transcript, 2_500),
    updatedSummary: sanitizePublicSearchSnippet(parsed.updatedSummary, 1_500),
    updatedNiches: [...new Set(parsed.updatedNiches.map((n) => sanitizePublicSearchSnippet(n, 60)).filter(Boolean))],
    changesSummary: sanitizePublicSearchSnippet(parsed.changesSummary, 300),
  };
}

// ---------- Database Helpers ----------
export async function loadCreatorAiProfile(
  sql: SqlClient,
  creatorId: string,
): Promise<CreatorAiProfileRecord | null> {
  try {
    let rows: any[];
    try {
      rows = await sql.query(
        `SELECT
           status, draft_summary, approved_summary, inferred_niches, approved_niches,
           visual_signals, content_style, source_snapshot, creator_voice_transcript,
           consent_at, withdrawn_at, next_refresh_at, raw_expires_at,
           analyzed_at, approved_at, last_error
         FROM creator_ai_profiles
         WHERE creator_id = $1
         LIMIT 1`,
        [creatorId],
      );
    } catch {
      rows = await sql.query(
        `SELECT
           status, draft_summary, approved_summary, inferred_niches, approved_niches,
           visual_signals, content_style, source_snapshot, creator_voice_transcript,
           analyzed_at, approved_at, last_error
         FROM creator_ai_profiles
         WHERE creator_id = $1
         LIMIT 1`,
        [creatorId],
      );
    }
    const row = rows[0];
    if (!row) return null;
    return {
      status: row.status as AiProfileStatus,
      draftSummary: String(row.draft_summary || ''),
      approvedSummary: String(row.approved_summary || ''),
      inferredNiches: Array.isArray(row.inferred_niches) ? row.inferred_niches.map(String) : [],
      approvedNiches: Array.isArray(row.approved_niches) ? row.approved_niches.map(String) : [],
      visualSignals: Array.isArray(row.visual_signals) ? row.visual_signals : [],
      contentStyle: row.content_style && typeof row.content_style === 'object'
        ? {
            formats: Array.isArray(row.content_style.formats) ? row.content_style.formats.map(String) : [],
            tone: String(row.content_style.tone || ''),
            setting: String(row.content_style.setting || ''),
            productionQuality: String(row.content_style.productionQuality || ''),
          }
        : { formats: [], tone: '', setting: '', productionQuality: '' },
      sourceSnapshot: row.source_snapshot && typeof row.source_snapshot === 'object' ? row.source_snapshot : {},
      creatorVoiceTranscript: String(row.creator_voice_transcript || ''),
      consentAt: row.consent_at ? new Date(row.consent_at).toISOString() : null,
      withdrawnAt: row.withdrawn_at ? new Date(row.withdrawn_at).toISOString() : null,
      nextRefreshAt: row.next_refresh_at ? new Date(row.next_refresh_at).toISOString() : null,
      rawExpiresAt: row.raw_expires_at ? new Date(row.raw_expires_at).toISOString() : null,
      analyzedAt: row.analyzed_at ? new Date(row.analyzed_at).toISOString() : null,
      approvedAt: row.approved_at ? new Date(row.approved_at).toISOString() : null,
      lastError: row.last_error ? String(row.last_error) : null,
    };
  } catch {
    // Migration 021 not applied yet
    return null;
  }
}

export async function recordCreatorAiConsent(sql: SqlClient, creatorId: string): Promise<void> {
  try {
    await sql.query(
      `INSERT INTO creator_ai_profiles (creator_id, status, consent_at, withdrawn_at, updated_at)
       VALUES ($1, 'pending', now(), NULL, now())
       ON CONFLICT (creator_id) DO UPDATE SET
         consent_at = COALESCE(creator_ai_profiles.consent_at, now()),
         withdrawn_at = NULL,
         status = CASE
           WHEN creator_ai_profiles.status IN ('withdrawn', 'rejected') THEN 'pending'
           ELSE creator_ai_profiles.status
         END,
         updated_at = now()`,
      [creatorId],
    );
  } catch (err: any) {
    if (err?.code === '42703') {
      await queueCreatorAiAnalysis(sql, creatorId);
      return;
    }
    throw err;
  }
}

/**
 * Sofortiger Widerruf nach Spec 8.6:
 * Loescht KI-Zusammenfassung, Rohdaten, Visual-Signale und KI-Embedding sofort
 * und baut den Suchindex rein aus den eigenen Creator-Angaben neu auf.
 */
export async function withdrawCreatorAiProfile(
  sql: SqlClient,
  creatorId: string,
): Promise<{ withdrawn: boolean; searchIndexRebuilt: boolean }> {
  try {
    await sql.query(
      `INSERT INTO creator_ai_profiles (
         creator_id, status, draft_summary, approved_summary,
         inferred_niches, approved_niches, visual_signals, content_style,
         source_snapshot, source_hash, creator_voice_transcript,
         consent_at, withdrawn_at, approved_at, next_refresh_at, raw_expires_at,
         last_error, updated_at
       ) VALUES (
         $1, 'withdrawn', NULL, NULL,
         '{}'::text[], '{}'::text[], '[]'::jsonb, '{}'::jsonb,
         '{}'::jsonb, NULL, NULL,
         NULL, now(), NULL, NULL, NULL,
         NULL, now()
       )
       ON CONFLICT (creator_id) DO UPDATE SET
         status = 'withdrawn',
         draft_summary = NULL,
         approved_summary = NULL,
         inferred_niches = '{}'::text[],
         approved_niches = '{}'::text[],
         visual_signals = '[]'::jsonb,
         content_style = '{}'::jsonb,
         source_snapshot = '{}'::jsonb,
         source_hash = NULL,
         creator_voice_transcript = NULL,
         consent_at = NULL,
         withdrawn_at = now(),
         approved_at = NULL,
         next_refresh_at = NULL,
         raw_expires_at = NULL,
         last_error = NULL,
         updated_at = now()`,
      [creatorId],
    );
  } catch (err: any) {
    // Fallback fuer Umgebungen vor Migration 023
    if (err?.code !== '42703' && err?.code !== '23514') throw err;
    await sql.query(
      `DELETE FROM creator_ai_profiles WHERE creator_id = $1`,
      [creatorId],
    );
  }

  // Embedding sofort loeschen und Suchindex nur noch aus eigenen Angaben neu aufbauen
  try {
    await sql.query(
      `UPDATE creator_search_index
       SET embedding_values = NULL, document_hash = '', updated_at = now()
       WHERE creator_id = $1`,
      [creatorId],
    );
  } catch {
    // creator_search_index optional
  }

  const rebuilt = await upsertCreatorSearchIndex(sql, creatorId, { skipEmbedding: true })
    .then((r) => r.updated)
    .catch(() => false);

  return { withdrawn: true, searchIndexRebuilt: rebuilt };
}

/** Loescht abgelaufene Rohdaten (Standbilder/Signale/Transkripte > 30 Tage) nach Spec 8.6. */
export async function purgeExpiredAiRawData(sql: SqlClient): Promise<number> {
  try {
    const rows = await sql.query(
      `UPDATE creator_ai_profiles
       SET visual_signals = '[]'::jsonb,
           source_snapshot = '{}'::jsonb,
           creator_voice_transcript = NULL,
           raw_expires_at = NULL,
           updated_at = now()
       WHERE raw_expires_at IS NOT NULL
         AND raw_expires_at <= now()
       RETURNING creator_id`,
    );
    return rows.length;
  } catch {
    return 0;
  }
}

/**
 * Queues a creator profile for asynchronous AI channel analysis ONLY if consent was already granted.
 * Deliberately preserves any existing approved_summary so search quality never regresses during re-analysis.
 */
export async function queueCreatorAiAnalysis(sql: SqlClient, creatorId: string): Promise<void> {
  try {
    await sql.query(
      `UPDATE creator_ai_profiles
       SET status = CASE WHEN status = 'approved' THEN 'approved' ELSE 'pending' END,
           updated_at = now()
       WHERE creator_id = $1 AND consent_at IS NOT NULL AND status <> 'withdrawn'`,
      [creatorId],
    );
  } catch {
    // Best-effort: never block registration or profile saves if migration isn't applied yet.
  }
}

export async function runCreatorAiAnalysis(
  sql: SqlClient,
  creatorId: string,
  options: { allowGeonode?: boolean; skipNetwork?: boolean; model?: string; requireConsent?: boolean } = {},
): Promise<CreatorAiProfileRecord> {
  if (options.requireConsent !== false) {
    const existingAi = await loadCreatorAiProfile(sql, creatorId);
    if (!existingAi?.consentAt || existingAi.status === 'withdrawn') {
      throw new AiConsentRequiredError();
    }
  }
  const rows = await sql.query(
    `SELECT
       p.id, p.public_id, p.display_name, p.stage_name, p.city, p.gender,
       p.topics, p.industries, p.special_traits, p.preferred_content,
       p.equipment, p.pet_context, p.children_context, p.skin_type, p.experience_since,
       COALESCE((
         SELECT array_agg(a.url ORDER BY a.is_primary DESC, a.created_at)
         FROM creator_social_accounts a WHERE a.creator_id = p.id
       ), ARRAY[]::text[]) AS social_links,
       COALESCE((
         SELECT array_agg(f.url ORDER BY f.sort_order, f.created_at)
         FROM creator_portfolio_items f WHERE f.creator_id = p.id
       ), ARRAY[]::text[]) AS portfolio_links
     FROM creator_profiles p
     WHERE p.id = $1 AND p.status = 'active'
     LIMIT 1`,
    [creatorId],
  );
  const creator = rows[0];
  if (!creator) {
    throw new Error('Aktives Creator-Profil nicht gefunden.');
  }

  await sql.query(
    `INSERT INTO creator_ai_profiles (creator_id, status, last_attempt_at, updated_at)
     VALUES ($1, 'analyzing', now(), now())
     ON CONFLICT (creator_id) DO UPDATE SET
       status = CASE WHEN creator_ai_profiles.status = 'approved' THEN 'approved' ELSE 'analyzing' END,
       last_attempt_at = now(),
       updated_at = now()`,
    [creatorId],
  );

  try {
    const socialLinks: string[] = Array.isArray(creator.social_links) ? creator.social_links.map(String) : [];
    const portfolioLinks: string[] = Array.isArray(creator.portfolio_links) ? creator.portfolio_links.map(String) : [];

    // Load cached DB social avatar image (if present) so vision analysis works even if IG blocks live fetches
    const imageDataUrls: string[] = [];
    try {
      const avatarRows = await sql.query(
        `SELECT image, content_type FROM creator_social_avatars WHERE creator_id = $1 AND image IS NOT NULL LIMIT 1`,
        [creatorId],
      );
      const av = avatarRows[0];
      if (av?.image && av.content_type && String(av.content_type).startsWith('image/')) {
        const buf = Buffer.isBuffer(av.image) ? av.image : Buffer.from(av.image);
        if (buf.length > 0 && buf.length <= 650_000) {
          imageDataUrls.push(`data:${av.content_type};base64,${buf.toString('base64')}`);
        }
      }
    } catch {
      // optional avatar table
    }

    const extracted = await extractCreatorChannelSignals({
      socialLinks,
      portfolioLinks,
      allowGeonode: options.allowGeonode,
      skipNetwork: options.skipNetwork,
    });
    imageDataUrls.push(...extracted.imageDataUrls);

    const publicProfileText = [
      creator.display_name ? `Name: ${sanitizePublicSearchSnippet(creator.display_name, 100)}` : '',
      creator.city ? `Region: ${sanitizePublicSearchSnippet(creator.city, 100)}` : '',
      creator.gender ? `Geschlecht: ${sanitizePublicSearchSnippet(creator.gender, 40)}` : '',
      creator.topics ? `Themen: ${sanitizePublicSearchSnippet(creator.topics, 1_000)}` : '',
      creator.industries ? `Branchen: ${sanitizePublicSearchSnippet(creator.industries, 1_000)}` : '',
      creator.preferred_content ? `Formate: ${sanitizePublicSearchSnippet(creator.preferred_content, 1_000)}` : '',
      creator.special_traits ? `Besondere Merkmale: ${sanitizePublicSearchSnippet(creator.special_traits, 800)}` : '',
      creator.equipment ? `Equipment: ${sanitizePublicSearchSnippet(creator.equipment, 600)}` : '',
      creator.pet_context ? `Tiere: ${sanitizePublicSearchSnippet(creator.pet_context, 500)}` : '',
      creator.children_context ? `Kinder/Familie: ${sanitizePublicSearchSnippet(creator.children_context, 500)}` : '',
      creator.skin_type ? `Hauttyp: ${sanitizePublicSearchSnippet(creator.skin_type, 200)}` : '',
    ].filter(Boolean).join('\n');

    const sourceHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ publicProfileText, socialLinks, portfolioLinks }))
      .digest('hex');

    const draft = await generateAiProfileDraft({
      publicProfileText,
      channels: extracted.snapshots,
      imageDataUrls: imageDataUrls.slice(0, 6),
      model: options.model,
    });

    const sourceSnapshot = {
      channelsChecked: extracted.snapshots.map((s) => `${s.platform}:${s.url}`),
      imagesAnalyzed: Math.min(imageDataUrls.length, 6),
      model: options.model || DEFAULT_ANALYZER_MODEL,
    };

    try {
      await sql.query(
        `INSERT INTO creator_ai_profiles (
           creator_id, status, draft_summary, inferred_niches, visual_signals,
           content_style, source_snapshot, source_hash, analyzed_at,
           raw_expires_at, next_refresh_at, last_attempt_at, fail_count, last_error, updated_at
         ) VALUES (
           $1, 'draft_ready', $2, $3::text[], $4::jsonb,
           $5::jsonb, $6::jsonb, $7, now(),
           now() + interval '30 days', now() + interval '90 days', now(), 0, NULL, now()
         )
         ON CONFLICT (creator_id) DO UPDATE SET
           status = CASE
             WHEN creator_ai_profiles.status = 'approved' THEN 'approved'
             ELSE 'draft_ready'
           END,
           draft_summary = EXCLUDED.draft_summary,
           inferred_niches = EXCLUDED.inferred_niches,
           visual_signals = EXCLUDED.visual_signals,
           content_style = EXCLUDED.content_style,
           source_snapshot = EXCLUDED.source_snapshot,
           source_hash = EXCLUDED.source_hash,
           analyzed_at = now(),
           raw_expires_at = now() + interval '30 days',
           next_refresh_at = now() + interval '90 days',
           last_attempt_at = now(),
           fail_count = 0,
           last_error = NULL,
           updated_at = now()`,
        [
          creatorId,
          draft.draft_summary,
          draft.inferred_niches,
          JSON.stringify(draft.visual_signals),
          JSON.stringify(draft.content_style),
          JSON.stringify(sourceSnapshot),
          sourceHash,
        ],
      );
    } catch (err: any) {
      if (err?.code !== '42703') throw err;
      await sql.query(
        `INSERT INTO creator_ai_profiles (
           creator_id, status, draft_summary, inferred_niches, visual_signals,
           content_style, source_snapshot, source_hash, analyzed_at,
           last_attempt_at, fail_count, last_error, updated_at
         ) VALUES (
           $1, 'draft_ready', $2, $3::text[], $4::jsonb,
           $5::jsonb, $6::jsonb, $7, now(),
           now(), 0, NULL, now()
         )
         ON CONFLICT (creator_id) DO UPDATE SET
           status = CASE
             WHEN creator_ai_profiles.status = 'approved' THEN 'approved'
             ELSE 'draft_ready'
           END,
           draft_summary = EXCLUDED.draft_summary,
           inferred_niches = EXCLUDED.inferred_niches,
           visual_signals = EXCLUDED.visual_signals,
           content_style = EXCLUDED.content_style,
           source_snapshot = EXCLUDED.source_snapshot,
           source_hash = EXCLUDED.source_hash,
           analyzed_at = now(),
           last_attempt_at = now(),
           fail_count = 0,
           last_error = NULL,
           updated_at = now()`,
        [
          creatorId,
          draft.draft_summary,
          draft.inferred_niches,
          JSON.stringify(draft.visual_signals),
          JSON.stringify(draft.content_style),
          JSON.stringify(sourceSnapshot),
          sourceHash,
        ],
      );
    }

    return (await loadCreatorAiProfile(sql, creatorId))!;
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 300) : 'Analyse fehlgeschlagen';
    await sql.query(
      `UPDATE creator_ai_profiles
       SET status = CASE WHEN status = 'approved' THEN 'approved' ELSE 'failed' END,
           fail_count = fail_count + 1,
           last_error = $2,
           last_attempt_at = now(),
           updated_at = now()
       WHERE creator_id = $1`,
      [creatorId, message],
    ).catch(() => {});
    throw error;
  }
}

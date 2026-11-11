import { normalizeGenderValue } from '@/app/lib/normalize-gender';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { isValidInternalSearchToken } from '@/app/lib/internal-search-token';
import { logSearch } from '@/app/lib/search-log';
import { isUsableCustomImageUrl } from '@/app/lib/social-avatar';

type ProcessedCreator = {
  id: string;
  name: string;
  image: string;
  reach: string;
  totalReach: number;
  hasCustomImage: boolean;
  networks: string[];
  priceRange: string;
  contactReachable: boolean;
  city: string;
  topics: string;
  preferredContent: string;
  gender: string | undefined;
  score: number;
};

type CachedCreatorEntry = {
  id: string;
  fullName: string;
  firstName: string;
  gender: string;
  normalizedGender: 'male' | 'female' | 'any';
  socialLinks: string;
  networksList: string[];
  platforms: {
    tiktok: boolean;
    instagram: boolean;
    youtube: boolean;
    facebook: boolean;
    twitch: boolean;
    snapchat: boolean;
  };
  reachText: string;
  totalReach: number;
  priceRange: string;
  priceValue: number | null;
  age: number | null;
  location: string;
  locationLower: string;
  topicsText: string;
  formatsText: string;
  portfolioText: string;
  equipmentText: string;
  searchableText: string;
  contactReachable: boolean;
  finalImage: string;
  hasCustomImage: boolean;
};

export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_SEARCH_BODY_BYTES = 8_192;
const MAX_QUERY_CHARS = 500;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const CACHE_DURATION = 300_000; // 5 minutes

type RateLimitEntry = { count: number; resetAt: number };

const globalSearchState = globalThis as typeof globalThis & {
  __ugcSearchRateLimit?: Map<string, RateLimitEntry>;
};

const searchRateLimitStore = globalSearchState.__ugcSearchRateLimit
  ?? (globalSearchState.__ugcSearchRateLimit = new Map<string, RateLimitEntry>());

let cachedNeonRecords: CachedCreatorEntry[] | null = null;
let lastNeonFetch = 0;
let localCreatorImageIds: Set<string> | null = null;

const BLOCKED_CREATOR_IMAGE_RECORD_IDS = new Set([
  // Cached image does not match the creator profile (Nadine).
  'recBkIwtksvVWVeaL',
]);

function getLocalCreatorImageSet(): Set<string> {
  if (localCreatorImageIds) return localCreatorImageIds;
  try {
    const dir = path.join(process.cwd(), 'public', 'creator-images');
    const files = fs.readdirSync(dir);
    localCreatorImageIds = new Set(
      files
        .filter((f) => f.endsWith('.jpg'))
        .map((f) => f.slice(0, -4)),
    );
  } catch {
    localCreatorImageIds = new Set();
  }
  return localCreatorImageIds;
}

const getLocalCreatorImage = (recordId: string): string | null => {
  if (BLOCKED_CREATOR_IMAGE_RECORD_IDS.has(recordId)) return null;
  return getLocalCreatorImageSet().has(recordId) ? `/creator-images/${recordId}.jpg` : null;
};

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return (forwarded?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown').trim().slice(0, 80);
}

function consumeSearchRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  if (searchRateLimitStore.size > 5_000) {
    for (const [key, entry] of searchRateLimitStore.entries()) {
      if (entry.resetAt <= now) searchRateLimitStore.delete(key);
    }
  }

  const current = searchRateLimitStore.get(ip);
  if (!current || current.resetAt <= now) {
    searchRateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

const parsePriceValue = (priceText: string): number | null => {
  const match = priceText.replace(/\./g, '').match(/(\d{2,5})/);
  return match ? Number(match[1]) : null;
};

const TOPIC_KEYWORDS: Record<string, string[]> = {
  beauty: ['beauty', 'kosmetik', 'make-up', 'makeup', 'schminke'],
  fashion: ['mode', 'fashion', 'kleidung', 'style'],
  travel: ['reise', 'travel', 'urlaub', 'vacation'],
  fitness: ['fitness', 'sport', 'workout', 'training'],
  food: ['essen', 'food', 'kochen', 'cooking', 'rezepte'],
  lifestyle: ['lifestyle', 'leben'],
  tech: ['tech', 'technologie', 'gadgets', 'software', 'app', 'saas'],
  family: ['family', 'familie', 'mama', 'papa', 'eltern', 'baby', 'kids'],
  gaming: ['gaming', 'games', 'zocken', 'streaming'],
  business: ['business', 'b2b', 'karriere', 'office', 'linkedin'],
  finance: ['finance', 'finanzen', 'versicherung', 'bank', 'geld'],
  health: ['health', 'gesundheit', 'wellness', 'pflege'],
  home: ['home', 'wohnen', 'interior', 'diy', 'haushalt'],
  automotive: ['auto', 'automotive', 'mobilität', 'car'],
};

const fetchNeonCreatorRecords = async (): Promise<CachedCreatorEntry[]> => {
  const sql = getDatabase();
  const rows = await sql.query(`
    SELECT
      public_id, display_name, birth_year, gender, city, special_traits,
      industries, topics, preferred_content, equipment, rate_text, reach_text,
      total_reach, profile_image_url, social_links, portfolio_links, networks,
      has_social_avatar, contact_reachable
    FROM creator_search_public
    ORDER BY profile_quality_score DESC, total_reach DESC, display_name ASC
    LIMIT 1000
  `);
  const currentYear = new Date().getFullYear();

  return rows.map((row: any) => {
    const id = String(row.public_id);
    const fullName = String(row.display_name || '').trim();
    const firstName = fullName.split(' ')[0] || 'Creator';
    const gender = String(row.gender || '').trim();
    const normalizedGender = normalizeGenderValue(gender);
    const socialLinks = String(row.social_links || '').trim();
    const socialLower = socialLinks.toLowerCase();
    const reachText = String(row.reach_text || '').trim();
    const totalReach = calculateTotalReach(reachText);
    const priceRange = String(row.rate_text || '').trim();
    const rawAge = row.birth_year ? currentYear - Number(row.birth_year) : null;
    const age = rawAge !== null && rawAge >= 16 && rawAge <= 70 ? rawAge : null;
    const location = String(row.city || '').trim();
    const topicsText = [row.topics, row.industries, row.special_traits]
      .map((v) => String(v || '').trim())
      .filter(Boolean)
      .join(' ');
    const formatsText = String(row.preferred_content || '').trim();
    const portfolioText = String(row.portfolio_links || '').trim();
    const equipmentText = String(row.equipment || '').trim();
    const cachedImageUrl = String(row.profile_image_url || '').trim();
    const hasSocialAvatar = Boolean(row.has_social_avatar);

    // Bild-Prioritaet:
    // 1. vom Creator gesetzter direkter Bildlink (keine Social-Seiten-URLs,
    //    keine ablaufenden CDN-Links aus dem Airtable-Altbestand)
    // 2. automatisch geholtes Social-Profilbild (/api/avatar/..., eigene Domain)
    // 3. lokal vorgerendertes Legacy-Bild
    // 4. Placeholder nach Geschlecht
    let finalImage: string;
    let hasCustomImage: boolean;

    if (isUsableCustomImageUrl(cachedImageUrl) && !BLOCKED_CREATOR_IMAGE_RECORD_IDS.has(id)) {
      finalImage = cachedImageUrl;
      hasCustomImage = true;
    } else if (hasSocialAvatar) {
      finalImage = `/api/avatar/${id}`;
      hasCustomImage = true;
    } else {
      const localCreatorImage = getLocalCreatorImage(id);
      if (localCreatorImage) {
        finalImage = localCreatorImage;
        hasCustomImage = true;
      } else {
        finalImage = gender === 'Weiblich' ? '/female-placeholder.webp' : '/placeholder.jpg';
        hasCustomImage = false;
      }
    }

    const searchableText = [
      fullName,
      socialLinks,
      reachText,
      location,
      topicsText,
      formatsText,
      portfolioText,
      priceRange,
      equipmentText,
    ].join(' ').toLowerCase();

    return {
      id,
      fullName,
      firstName,
      gender,
      normalizedGender,
      socialLinks,
      networksList: socialLinks.split('\n').filter(Boolean),
      platforms: {
        tiktok: socialLower.includes('tiktok'),
        instagram: socialLower.includes('instagram'),
        youtube: socialLower.includes('youtube'),
        facebook: socialLower.includes('facebook'),
        twitch: socialLower.includes('twitch'),
        snapchat: socialLower.includes('snapchat'),
      },
      reachText,
      totalReach,
      priceRange,
      priceValue: parsePriceValue(priceRange),
      age,
      location,
      locationLower: location.toLowerCase(),
      topicsText,
      formatsText,
      portfolioText,
      equipmentText,
      searchableText,
      contactReachable: Boolean(row.contact_reachable),
      finalImage,
      hasCustomImage,
    };
  });
};

const applyDeterministicQueryOverrides = (analysis: QueryAnalysis, query: string): QueryAnalysis => {
  const queryLower = query.toLowerCase();
  const malePattern = /\b(männer|maenner|männlich|maennlich|mann|male|herren|jungs)\b/i;
  const femalePattern = /\b(frauen|weiblich|frau|female|damen|mädchen|maedchen)\b/i;

  if (malePattern.test(queryLower)) {
    return { ...analysis, gender: 'male' };
  }

  if (femalePattern.test(queryLower)) {
    return { ...analysis, gender: 'female' };
  }

  return analysis;
};

function scoreCreator(profile: CachedCreatorEntry, analysis: QueryAnalysis): number {
  let score = 0;

  // 1. Gender match (highest priority)
  if (analysis.gender === 'male' && profile.normalizedGender === 'male') {
    score += 100;
  } else if (analysis.gender === 'female' && profile.normalizedGender === 'female') {
    score += 100;
  } else if (analysis.gender === 'any') {
    score += 50;
  } else if (analysis.gender === 'male' && profile.normalizedGender !== 'male') {
    return 0;
  } else if (analysis.gender === 'female' && profile.normalizedGender !== 'female') {
    return 0;
  } else {
    score += 30;
  }

  // 2. Platform match
  if (analysis.platforms.length > 0) {
    let hasPlatformMatch = false;
    for (const platform of analysis.platforms) {
      if (profile.platforms[platform as keyof typeof profile.platforms]) {
        score += 50;
        hasPlatformMatch = true;
      }
    }
    if (!hasPlatformMatch) {
      score += 5;
    }
  } else {
    score += 20;
  }

  // 3. Reach/follower count match
  const totalReach = profile.totalReach;
  if (analysis.minFollowers > 0 && totalReach < analysis.minFollowers) {
    score += 5;
  } else if (analysis.maxFollowers && totalReach > analysis.maxFollowers) {
    score += 5;
  }

  if (analysis.minFollowers > 0 && analysis.maxFollowers) {
    const idealReach = (analysis.minFollowers + analysis.maxFollowers) / 2;
    const distanceFromIdeal = Math.abs(totalReach - idealReach) / idealReach;
    score += 50 * (1 - Math.min(distanceFromIdeal, 1));
  } else if (analysis.minFollowers > 0) {
    score += Math.min(30 * (totalReach / analysis.minFollowers), 50);
  } else if (analysis.maxFollowers) {
    score += 50 * (1 - Math.min(totalReach / analysis.maxFollowers, 1));
  } else {
    // Reichweite 0 heisst hier "keine auslesbare Angabe", nicht "irrelevant":
    // Math.log10(0) ist -Infinity und hat den Gesamtscore vernichtet, wodurch
    // jedes Profil ohne Reichweitenangabe an der Schwelle score < 5 aus der
    // Suche fiel (92 von 495 aktiven Profilen).
    score += totalReach > 0 ? Math.min(Math.log10(totalReach) * 5, 30) : 0;
  }

  // 4. Topic/niche match
  if (analysis.topics.length > 0) {
    for (const topic of analysis.topics) {
      const keywords = TOPIC_KEYWORDS[topic] || [];
      for (const keyword of keywords) {
        if (profile.searchableText.includes(keyword)) {
          score += 40;
          break;
        }
      }
    }
  }

  // 5. Age match
  if (analysis.ageRange.min !== null || analysis.ageRange.max !== null) {
    if (profile.age === null) {
      score -= 10;
    } else if (
      (analysis.ageRange.min !== null && profile.age < analysis.ageRange.min) ||
      (analysis.ageRange.max !== null && profile.age > analysis.ageRange.max)
    ) {
      score -= 60;
    } else {
      score += 45;
    }
  }

  // 6. Location match
  if (analysis.location) {
    if (profile.locationLower.includes(analysis.location)) {
      score += 35;
    } else if (profile.location) {
      score -= 15;
    }
  }

  // 7. Price match
  if (profile.priceValue !== null && (analysis.priceRange.min !== null || analysis.priceRange.max !== null)) {
    if (
      (analysis.priceRange.min !== null && profile.priceValue < analysis.priceRange.min) ||
      (analysis.priceRange.max !== null && profile.priceValue > analysis.priceRange.max)
    ) {
      score -= 25;
    } else {
      score += 20;
    }
  }

  // 8. Quality signals from the canonical creator profile
  if (profile.portfolioText) score += 18;
  if (profile.formatsText) score += 12;

  // 9. Per Mail erreichbare Creator zuerst: Anfragen an nicht erreichbare
  // Profile enden bei der Brand sonst in einem manuellen DM-Versuch.
  if (profile.contactReachable) score += 25;

  return score;
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  const requestId = req.headers.get('x-request-id') || startedAt.toString();
  const isTestRequest = req.headers.get('x-test-request') === 'true';
  const isInternalAgentCall = isValidInternalSearchToken(req.headers.get('x-internal-search-token'));

  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_SEARCH_BODY_BYTES) {
    return NextResponse.json({
      success: false,
      error: 'Request body too large',
      message: 'Die Suchanfrage ist zu lang.',
    }, { status: 413 });
  }

  // Rate-Limit fuer direkte Browser-/Bot-Aufrufe (Agent-Routen pruefen ihr
  // eigenes Web-Bot-Auth-Limit bereits vor dem internen Aufruf).
  if (!isInternalAgentCall && !isTestRequest) {
    const rateLimit = consumeSearchRateLimit(getClientIp(req));
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Zu viele Suchanfragen in kurzer Zeit. Bitte warte einen Moment und versuche es erneut.',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfter) },
        },
      );
    }
  }

  try {
    const TIMEOUT_MS = 25_000;
    let query: string;
    let reqBody: Record<string, any>;

    try {
      const rawText = await req.text();
      if (Buffer.byteLength(rawText, 'utf8') > MAX_SEARCH_BODY_BYTES) {
        return NextResponse.json({
          success: false,
          error: 'Request body too large',
          message: 'Die Suchanfrage ist zu lang.',
        }, { status: 413 });
      }
      reqBody = JSON.parse(rawText);
      if (!reqBody || typeof reqBody.query !== 'string' || !reqBody.query.trim()) {
        throw new Error('Invalid query parameter');
      }
      query = reqBody.query.trim().slice(0, MAX_QUERY_CHARS);
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body',
        message: 'Could not parse request body',
        details: parseError instanceof Error ? parseError.message : String(parseError),
      }, { status: 400 });
    }

    if (isTestRequest || reqBody.isTest) {
      return NextResponse.json({
        success: true,
        message: 'Test request received successfully',
        query,
        timestamp: new Date().toISOString(),
        requestId,
      });
    }

    if (Date.now() - startedAt > TIMEOUT_MS) {
      return NextResponse.json({
        success: false,
        error: 'Request timeout',
        message: 'Request took too long to process',
      }, { status: 504 });
    }

    if (!isDatabaseConfigured()) {
      console.error(`[${requestId}] Creator database is not configured`);
      return NextResponse.json({
        success: false,
        error: 'Creator database unavailable',
        message: 'Die Creator-Suche ist vorübergehend nicht verfügbar.',
      }, { status: 503 });
    }

    let initialAnalysis: QueryAnalysis;
    if (process.env.OPENROUTER_API_KEY) {
      try {
        initialAnalysis = await analyzeQueryWithOpenRouter(query, requestId);
      } catch (openRouterError) {
        console.warn(`[${requestId}] OpenRouter failed, using deterministic fallback:`, openRouterError instanceof Error ? openRouterError.message : openRouterError);
        initialAnalysis = analyzeQueryWithAI(query);
      }
    } else {
      initialAnalysis = analyzeQueryWithAI(query);
    }

    initialAnalysis = applyDeterministicQueryOverrides(initialAnalysis, query);
    const reasoning = generateReasoning(initialAnalysis);

    const now = Date.now();
    try {
      if (!cachedNeonRecords || now - lastNeonFetch > CACHE_DURATION) {
        cachedNeonRecords = await fetchNeonCreatorRecords();
        lastNeonFetch = now;
      }
    } catch (databaseError) {
      console.error(`[${requestId}] Neon creator search failed`, databaseError);
      return NextResponse.json({
        success: false,
        error: 'Creator database unavailable',
        message: 'Die Creator-Suche ist vorübergehend nicht verfügbar.',
      }, { status: 503 });
    }

    const searchRecords = cachedNeonRecords;
    const validCreators: ProcessedCreator[] = [];
    let droppedLowScore = 0;
    let droppedError = 0;

    for (const profile of searchRecords) {
      try {
        const score = scoreCreator(profile, initialAnalysis);
        if (score < 5) {
          droppedLowScore += 1;
          continue;
        }
        validCreators.push({
          id: profile.id,
          name: profile.firstName,
          image: profile.finalImage,
          reach: profile.reachText,
          totalReach: profile.totalReach,
          hasCustomImage: profile.hasCustomImage,
          networks: profile.networksList,
          priceRange: profile.priceRange,
          contactReachable: profile.contactReachable,
          city: profile.location,
          topics: profile.topicsText,
          preferredContent: profile.formatsText,
          gender: profile.gender,
          score,
        });
      } catch (error) {
        droppedError += 1;
        console.error(`[${requestId}] Error scoring creator ${profile.id}:`, error);
      }
    }

    validCreators.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.hasCustomImage !== b.hasCustomImage) return a.hasCustomImage ? -1 : 1;
      return b.totalReach - a.totalReach;
    });

    const genderFilteredCreators = initialAnalysis.gender === 'any'
      ? validCreators
      : validCreators.filter((creator) => normalizeGenderValue(creator.gender) === initialAnalysis.gender);

    // Harte Filter der Agenten-Schnittstellen (app/lib/agent-gateway.ts). Muessen
    // VOR der 24er-Kappung greifen: danach blieb von 12 Berliner Profilen nur
    // uebrig, wer zufaellig schon in den Top 24 stand.
    const cityFilter = typeof reqBody.city === 'string' ? reqBody.city.trim().toLowerCase() : '';
    const topicFilter: string[] = Array.isArray(reqBody.topics)
      ? reqBody.topics.filter((t: unknown) => typeof t === 'string' && t.trim()).map((t: string) => t.trim().toLowerCase())
      : [];
    const matchedCreators = genderFilteredCreators.filter((creator) => {
      if (cityFilter && !String(creator.city || '').toLowerCase().includes(cityFilter)) return false;
      if (topicFilter.length && !topicFilter.some((t) => String(creator.topics || '').toLowerCase().includes(t))) return false;
      return true;
    });

    const displayCreators = matchedCreators.slice(0, 24);
    const finalCreators = displayCreators.map(({ hasCustomImage, totalReach, score, ...rest }) => rest);
    const processingTime = Date.now() - startedAt;

    console.log(`[${requestId}] Search done in ${processingTime}ms: matched=${matchedCreators.length}/${searchRecords.length} returned=${finalCreators.length}`);

    // Header setzt nur app/lib/agent-gateway.ts (MCP/A2A); Statistik, kein Zugriffsschutz.
    await logSearch(query, matchedCreators.length, req.headers.get('x-search-source') === 'agent' ? 'agent' : 'web');

    return NextResponse.json({
      success: true,
      creators: finalCreators,
      totalCount: matchedCreators.length,
      pool: {
        size: searchRecords.length,
        scored: validCreators.length,
        droppedLowScore,
        droppedError,
        droppedGenderFilter: validCreators.length - genderFilteredCreators.length,
      },
      query,
      reasoning,
      analysis: {
        gender: initialAnalysis.gender,
        platforms: initialAnalysis.platforms,
        topics: initialAnalysis.topics,
        followerRange: {
          min: initialAnalysis.minFollowers,
          max: initialAnalysis.maxFollowers,
        },
        ageRange: initialAnalysis.ageRange,
        keywords: initialAnalysis.keywords,
      },
      timestamp: new Date().toISOString(),
      processingTime,
    });
  } catch (error: any) {
    console.error(`[${requestId}] Search error:`, error);

    return NextResponse.json({
      success: false,
      error: 'Search failed',
      message: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      requestId,
    }, {
      status: 500,
    });
  }
}

interface QueryAnalysis {
  gender: 'male' | 'female' | 'any';
  platforms: string[];
  topics: string[];
  minFollowers: number;
  maxFollowers: number | null;
  ageRange: {
    min: number | null;
    max: number | null;
  };
  location: string | null;
  priceRange: {
    min: number | null;
    max: number | null;
  };
  keywords: string[];
}

// Bewusst nur kleine, guenstige Modelle: die Query-Analyse ist ein kurzer
// JSON-Extraktionsjob. Obergrenze ist DeepSeek V4 Flash (0731 = gepinnte
// Version, ohne Suffix = Alias als Fallback).
const OPENROUTER_ANALYSIS_MODELS = [
  'deepseek/deepseek-v4-flash-0731',
  'deepseek/deepseek-v4-flash',
];

async function analyzeQueryWithOpenRouter(query: string, requestId: string): Promise<QueryAnalysis> {
  let lastError: unknown;

  for (const model of OPENROUTER_ANALYSIS_MODELS) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://ugc-vz.de',
          'X-Title': 'UGC VZ Creator Search',
          'X-Request-ID': requestId,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: `Du bist ein Experte für Creator-Suche. Analysiere die Suchanfrage und extrahiere strukturierte Informationen.

Antworte NUR mit einem JSON-Objekt in diesem exakten Format (keine zusätzlichen Erklärungen):
{
  "gender": "male" | "female" | "any",
  "platforms": ["tiktok", "instagram", "youtube", "facebook", "twitch", "snapchat"],
  "topics": ["beauty", "fashion", "travel", "fitness", "food", "lifestyle", "tech", "family", "gaming", "business", "finance", "health", "home", "pets", "automotive"],
  "minFollowers": 0,
  "maxFollowers": null,
  "ageRange": {"min": null, "max": null},
  "location": null,
  "priceRange": {"min": null, "max": null},
  "keywords": ["relevante", "begriffe"]
}

Regeln:
- Erkenne Synonyme: "Insta" = "instagram", "YT" = "youtube"
- Interpretiere Kontext: "Beauty/Kosmetik" impliziert meist "female"
- Extrahiere Reichweiten intelligent: "10k" = 10000, "1m" = 1000000
- Extrahiere Alter: "ab 30" = {"min":30,"max":null}, "unter 25" = {"min":null,"max":25}
- Extrahiere Orte: "Berlin", "Hamburg", "Deutschland", "NRW"
- Extrahiere Budget/Preis: "bis 500 Euro" = {"min":null,"max":500}
- WICHTIG: Explizite Geschlechts-Keywords haben IMMER Vorrang vor Topic-Defaults`,
            },
            {
              role: 'user',
              content: `Analysiere diese Creator-Suchanfrage: "${query}"`,
            },
          ],
          temperature: 0.3,
          max_tokens: 300,
          // DeepSeek V4 Flash ist ein Reasoning-Modell: ohne diese Option
          // verbraucht es die 300 Tokens fuers Denken und liefert content: null.
          reasoning: { enabled: false },
        }),
        signal: AbortSignal.timeout(12_000),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API failed with status ${response.status}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) {
        throw new Error('OpenRouter returned empty content');
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        gender: parsed.gender || 'any',
        platforms: Array.isArray(parsed.platforms) ? parsed.platforms : [],
        topics: Array.isArray(parsed.topics) ? parsed.topics : [],
        minFollowers: Number(parsed.minFollowers) || 0,
        maxFollowers: parsed.maxFollowers || null,
        ageRange: {
          min: parsed.ageRange?.min || null,
          max: parsed.ageRange?.max || null,
        },
        location: parsed.location || null,
        priceRange: {
          min: parsed.priceRange?.min || null,
          max: parsed.priceRange?.max || null,
        },
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      };
    } catch (error) {
      lastError = error;
      console.error(`[${requestId}] OpenRouter analysis failed for ${model}:`, error instanceof Error ? error.message : error);
    }
  }

  throw lastError || new Error('OpenRouter analysis failed for all models');
}

function analyzeQueryWithAI(query: string): QueryAnalysis {
  const analysis: QueryAnalysis = {
    gender: 'any',
    platforms: [],
    topics: [],
    minFollowers: 0,
    maxFollowers: null,
    ageRange: { min: null, max: null },
    location: null,
    priceRange: { min: null, max: null },
    keywords: [],
  };

  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/[\s,.;:!?()/"'-]+/).filter((w) => w.length >= 4);

  const hasMaleKeywords = queryLower.includes('männer') || queryLower.includes('männlich') || queryLower.includes('mann');
  const hasFemaleKeywords = queryLower.includes('frauen') || queryLower.includes('weiblich') || queryLower.includes('frau');
  const hasBeautyKeywords = queryLower.includes('kosmetik') || queryLower.includes('beauty') || queryLower.includes('make-up');

  if (hasMaleKeywords) {
    analysis.gender = 'male';
  } else if (hasFemaleKeywords) {
    analysis.gender = 'female';
  } else if (hasBeautyKeywords) {
    analysis.gender = 'female';
  }

  if (queryLower.includes('tiktok')) analysis.platforms.push('tiktok');
  if (queryLower.includes('instagram') || queryLower.includes('insta')) analysis.platforms.push('instagram');
  if (queryLower.includes('youtube') || /\byt\b/.test(queryLower)) analysis.platforms.push('youtube');
  if (queryLower.includes('facebook') || /\bfb\b/.test(queryLower)) analysis.platforms.push('facebook');
  if (queryLower.includes('twitch')) analysis.platforms.push('twitch');
  if (queryLower.includes('snapchat')) analysis.platforms.push('snapchat');

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const hasMatch = keywords.some((keyword) =>
      queryLower.includes(keyword) ||
      (keyword.length >= 4 && queryWords.some((word) => Math.abs(word.length - keyword.length) <= 2 && isSimilar(word, keyword, 2))),
    );
    if (hasMatch) analysis.topics.push(topic);
  }

  const minFollowerPatterns = [
    /mehr als (\d+(?:\.\d+)?(?:k|m)?)/i,
    /mindestens (\d+(?:\.\d+)?(?:k|m)?)/i,
    /(\d+(?:\.\d+)?(?:k|m)?) follower oder mehr/i,
    /über (\d+(?:\.\d+)?(?:k|m)?)/i,
  ];

  for (const pattern of minFollowerPatterns) {
    const match = queryLower.match(pattern);
    if (match && match[1]) {
      let value = match[1].toLowerCase();
      let multiplier = 1;
      if (value.includes('k')) {
        multiplier = 1000;
        value = value.replace('k', '');
      } else if (value.includes('m')) {
        multiplier = 1000000;
        value = value.replace('m', '');
      }
      analysis.minFollowers = parseFloat(value) * multiplier;
      break;
    }
  }

  const maxFollowerPatterns = [
    /weniger als (\d+(?:\.\d+)?(?:k|m)?)/i,
    /maximal (\d+(?:\.\d+)?(?:k|m)?)/i,
    /höchstens (\d+(?:\.\d+)?(?:k|m)?)/i,
    /unter (\d+(?:\.\d+)?(?:k|m)?)/i,
  ];

  for (const pattern of maxFollowerPatterns) {
    const match = queryLower.match(pattern);
    if (match && match[1]) {
      let value = match[1].toLowerCase();
      let multiplier = 1;
      if (value.includes('k')) {
        multiplier = 1000;
        value = value.replace('k', '');
      } else if (value.includes('m')) {
        multiplier = 1000000;
        value = value.replace('m', '');
      }
      analysis.maxFollowers = parseFloat(value) * multiplier;
      break;
    }
  }

  const agePatterns = [
    { type: 'min', pattern: /(?:ab|über|ueber|mindestens)\s*(\d{2})/i },
    { type: 'max', pattern: /(?:unter|bis|maximal|höchstens|hoechstens)\s*(\d{2})/i },
    { type: 'range', pattern: /(?:zwischen\s*)?(\d{2})\s*(?:-|bis|und)\s*(\d{2})/i },
  ];

  for (const { type, pattern } of agePatterns) {
    const match = queryLower.match(pattern);
    if (match) {
      if (type === 'range') {
        analysis.ageRange.min = Number(match[1]);
        analysis.ageRange.max = Number(match[2]);
      } else if (type === 'min') {
        analysis.ageRange.min = Number(match[1]);
      } else if (type === 'max') {
        analysis.ageRange.max = Number(match[1]);
      }
      break;
    }
  }

  const knownLocations = ['berlin', 'hamburg', 'münchen', 'muenchen', 'köln', 'koeln', 'frankfurt', 'stuttgart', 'düsseldorf', 'duesseldorf', 'leipzig', 'nrw', 'deutschland', 'österreich', 'oesterreich', 'schweiz'];
  analysis.location = knownLocations.find((location) => queryLower.includes(location)) || null;

  const priceMaxMatch = queryLower.match(/(?:bis|maximal|unter)\s*(\d{2,5})\s*(?:€|euro|eur)?/i);
  const priceMinMatch = queryLower.match(/(?:ab|mindestens|über|ueber)\s*(\d{2,5})\s*(?:€|euro|eur)/i);
  if (priceMaxMatch) analysis.priceRange.max = Number(priceMaxMatch[1]);
  if (priceMinMatch) analysis.priceRange.min = Number(priceMinMatch[1]);

  const commonWords = ['ich', 'suche', 'nach', 'für', 'mit', 'und', 'oder', 'der', 'die', 'das', 'ein', 'eine', 'auf', 'in', 'bei'];
  const words = queryLower.split(/\s+/).filter((word) =>
    word.length > 3 && !commonWords.includes(word) && !/^\d+$/.test(word),
  );
  analysis.keywords = [...new Set(words)];

  return analysis;
}

function generateReasoning(analysis: QueryAnalysis): string {
  const topicsMap: Record<string, string> = {
    beauty: 'Beauty/Kosmetik',
    fashion: 'Mode/Fashion',
    travel: 'Reisen',
    fitness: 'Fitness/Sport',
    food: 'Essen/Kochen',
    lifestyle: 'Lifestyle',
    tech: 'Technologie',
  };

  let reasoning = '1. Verständnis der Anfrage\nDie KI analysiert die Schlüsselwörter und Kriterien:\n\n';

  if (analysis.gender === 'male') {
    reasoning += '• Geschlecht: Männliche Creator werden gesucht.\n\n';
  } else if (analysis.gender === 'female') {
    reasoning += '• Geschlecht: Weibliche Creator werden gesucht.\n\n';
  }

  if (analysis.platforms.length > 0) {
    const platformsFormatted = analysis.platforms.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(', ');
    reasoning += `• Plattformen: ${platformsFormatted}.\n\n`;
  }

  if (analysis.topics.length > 0) {
    const topicsFormatted = analysis.topics.map((t) => topicsMap[t] || t).join(', ');
    reasoning += `• Themen: ${topicsFormatted}.\n\n`;
  }

  if (analysis.minFollowers > 0) {
    reasoning += `• Mindestreichweite: ${analysis.minFollowers.toLocaleString('de-DE')} Follower.\n\n`;
  }

  if (analysis.maxFollowers) {
    reasoning += `• Maximale Reichweite: ${analysis.maxFollowers.toLocaleString('de-DE')} Follower.\n\n`;
  }

  if (analysis.ageRange.min !== null || analysis.ageRange.max !== null) {
    if (analysis.ageRange.min !== null && analysis.ageRange.max !== null) {
      reasoning += `• Alter: Zwischen ${analysis.ageRange.min} und ${analysis.ageRange.max} Jahren.\n\n`;
    } else if (analysis.ageRange.min !== null) {
      reasoning += `• Alter: Über ${analysis.ageRange.min} Jahre.\n\n`;
    } else if (analysis.ageRange.max !== null) {
      reasoning += `• Alter: Unter ${analysis.ageRange.max} Jahre.\n\n`;
    }
  }

  reasoning += '2. Datenbankabfrage\nDie KI durchsucht die Datenbank nach Creators, die folgende Kriterien erfüllen:\n\n';

  if (analysis.gender !== 'any') {
    reasoning += `• Geschlecht: ${analysis.gender === 'male' ? 'Männlich' : 'Weiblich'}.\n\n`;
  }

  if (analysis.platforms.length > 0) {
    const platformsFormatted = analysis.platforms.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(', ');
    reasoning += `• Aktiv auf: ${platformsFormatted}.\n\n`;
  }

  if (analysis.topics.length > 0) {
    const topicsFormatted = analysis.topics.map((t) => topicsMap[t] || t).join(', ');
    reasoning += `• Content-Nische: ${topicsFormatted}.\n\n`;
  }

  if (analysis.minFollowers > 0 || analysis.maxFollowers) {
    let reachText = '• Reichweite: ';
    if (analysis.minFollowers > 0 && analysis.maxFollowers) {
      reachText += `Zwischen ${analysis.minFollowers.toLocaleString('de-DE')} und ${analysis.maxFollowers.toLocaleString('de-DE')} Follower.`;
    } else if (analysis.minFollowers > 0) {
      reachText += `Mindestens ${analysis.minFollowers.toLocaleString('de-DE')} Follower.`;
    } else if (analysis.maxFollowers) {
      reachText += `Maximal ${analysis.maxFollowers.toLocaleString('de-DE')} Follower.`;
    }
    reasoning += reachText + '\n\n';
  }

  reasoning += '3. Filterung und Priorisierung\nDie KI filtert die Ergebnisse und priorisiert Creators nach:\n\n';
  reasoning += '• Relevanz: Passende Inhalte in den gesuchten Nischen.\n\n';

  if (analysis.minFollowers > 0 || analysis.maxFollowers) {
    reasoning += '• Reichweite: Innerhalb der angegebenen Grenzen.\n\n';
  } else {
    reasoning += '• Reichweite: Höhere Reichweite wird bevorzugt.\n\n';
  }

  reasoning += '• Bildqualität: Creators mit professionellen Profilbildern werden bevorzugt angezeigt.\n\n';

  if (analysis.platforms.length > 1) {
    reasoning += '• Multi-Plattform: Creator, die auf mehreren der gewünschten Plattformen aktiv sind, werden bevorzugt.\n\n';
  }

  return reasoning;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function isSimilar(word: string, keyword: string, threshold = 2): boolean {
  return levenshteinDistance(word.toLowerCase(), keyword.toLowerCase()) <= threshold;
}

function calculateTotalReach(reachText: string): number {
  const platforms = reachText.split(/(?:Instagram|Insta|TikTok|YouTube|Facebook|LinkedIn|FB|YT):\s*/i).filter(Boolean);
  let total = 0;

  platforms.forEach((platform) => {
    const numbers = platform.trim().match(/\d+(?:[.,]\d+)?(?:\s*[kKmM])?/g) || [];
    numbers.forEach((num) => {
      const cleanNum = num.trim().replace(/[.,]/g, '');
      let value = parseFloat(cleanNum);
      if (num.toLowerCase().includes('k')) {
        value *= 1000;
      } else if (num.toLowerCase().includes('m')) {
        value *= 1000000;
      }
      if (!isNaN(value)) {
        total += value;
      }
    });
  });

  return Math.round(total);
}

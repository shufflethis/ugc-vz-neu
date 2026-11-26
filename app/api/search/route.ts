import { normalizeGenderValue } from '@/app/lib/normalize-gender';
import {
  castingFilters,
  directorySearchWords,
  matchCasting,
  relatedCasting,
  type CastingEvidence,
  type CastingFilter,
} from '@/app/lib/casting';
import { portfolioForCasting, reviewedCapHash, reviewedCapImage } from '@/app/lib/casting-portfolio';
import { deriveVerificationLevel } from '@/app/lib/agent-verification';
import {
  analyzeQueryDeterministically,
  calculateTotalReach,
  detectTopicsInText,
  evaluateCreatorRelevance,
  extractMeaningfulKeywords,
  generateReasoning,
  parsePriceValue,
  TOPIC_RULES,
  type CreatorRelevanceEvaluation,
  type QueryAnalysis,
  type SearchableCreatorProfile,
} from '@/app/lib/search-scoring';
import {
  buildAiHeaders,
  buildChatRequestBody,
  isAiProviderConfigured,
  resolveAiProvider,
  resolveChatModels,
} from '@/app/lib/ai-provider';
import {
  embedSingleText,
  loadIndexedSearchData,
  queryFullTextRanks,
} from '@/app/lib/search-index';
import {
  buildRerankPayload,
  fuseHybridCandidates,
  rerankCandidatesWithLLM,
  SEMANTIC_EXACT_SIMILARITY,
} from '@/app/lib/search-rerank';
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
  relevanceScore: number;
  evidence?: CastingEvidence[];
  matchReason?: string;
  relatedPriority: number;
  verificationLevel: 0 | 1;
  topicSearchText: string;
};

type CachedSearchPool = {
  records: SearchableCreatorProfile[];
  embeddings: Map<string, number[]>;
};

export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_SEARCH_BODY_BYTES = 8_192;
const MAX_QUERY_CHARS = 500;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const CACHE_DURATION = 300_000; // 5 minutes
const MAX_RERANK_CANDIDATES = 20;

type RateLimitEntry = { count: number; resetAt: number };

const globalSearchState = globalThis as typeof globalThis & {
  __ugcSearchRateLimit?: Map<string, RateLimitEntry>;
};

const searchRateLimitStore = globalSearchState.__ugcSearchRateLimit
  ?? (globalSearchState.__ugcSearchRateLimit = new Map<string, RateLimitEntry>());

let cachedSearchPool: CachedSearchPool | null = null;
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

const fetchNeonCreatorPool = async (withWorkSamples = false): Promise<CachedSearchPool> => {
  const sql = getDatabase();
  const [rows, indexedData] = await Promise.all([
    sql.query(`
      SELECT
        public_id, display_name, stage_name, birth_year, gender, city, height_cm,
        special_traits, experience_since, industries, topics, skin_type,
        pet_context, children_context, preferred_content, equipment, rate_text,
        reach_text, total_reach, profile_image_url, social_links, portfolio_links,
        networks, has_social_avatar, contact_reachable,
        ${withWorkSamples ? portfolioForCasting : "'[]'::jsonb"} AS works,
        ${withWorkSamples ? reviewedCapHash : 'NULL'} AS cap_hash
      FROM creator_search_public p
      ORDER BY profile_quality_score DESC, total_reach DESC, display_name ASC
    `),
    loadIndexedSearchData(sql),
  ]);
  const currentYear = new Date().getFullYear();

  const records: SearchableCreatorProfile[] = rows.map((row: any) => {
    const id = String(row.public_id);
    const fullName = String(row.display_name || '').trim();
    const stageName = String(row.stage_name || '').trim();
    const firstName = fullName.split(' ')[0] || 'Creator';
    const gender = String(row.gender || '').trim();
    const normalizedGender = normalizeGenderValue(gender);
    const socialLinks = String(row.social_links || '').trim();
    const socialLower = socialLinks.toLowerCase();
    const reachText = String(row.reach_text || '').trim();
    const parsedReach = calculateTotalReach(reachText);
    const totalReach = parsedReach > 0 ? parsedReach : Math.max(0, Number(row.total_reach) || 0);
    const priceRange = String(row.rate_text || '').trim();
    const rawAge = row.birth_year ? currentYear - Number(row.birth_year) : null;
    const age = rawAge !== null && rawAge >= 16 && rawAge <= 80 ? rawAge : null;
    const location = String(row.city || '').trim();
    const petContext = String(row.pet_context || '').trim();
    const childrenContext = String(row.children_context || '').trim();
    const skinType = String(row.skin_type || '').trim();
    const experienceSince = String(row.experience_since || '').trim();
    const heightCm = row.height_cm ? Number(row.height_cm) : null;
    const topicsText = [row.topics, row.industries, row.special_traits]
      .map((v) => String(v || '').trim())
      .filter(Boolean)
      .join(' · ');
    const formatsText = String(row.preferred_content || '').trim();
    const portfolioText = String(row.portfolio_links || '').trim();
    const equipmentText = String(row.equipment || '').trim();
    const cachedImageUrl = String(row.profile_image_url || '').trim();
    const hasSocialAvatar = Boolean(row.has_social_avatar);
    const networksList = socialLinks.split('\n').filter(Boolean);
    const works = Array.isArray(row.works) ? row.works : [];
    const workTitles = works.map((w: any) => String(w?.title || '').trim()).filter(Boolean).join(' ');
    const aiProfile = indexedData.aiProfiles.get(id);

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
        finalImage = normalizedGender === 'female' ? '/female-placeholder.webp' : '/placeholder.jpg';
        hasCustomImage = false;
      }
    }

    // Topic-focused text intentionally excludes display_name and rate_text so creator names
    // (e.g. "Carina") or price descriptions ("Preise auf Anfrage") never cause false topic hits.
    const topicSearchText = [
      topicsText,
      formatsText,
      equipmentText,
      petContext,
      childrenContext,
      skinType,
      experienceSince,
      workTitles,
      aiProfile?.summary || '',
      aiProfile?.niches?.join(' ') || '',
      aiProfile?.visualSignalsText || '',
    ].filter(Boolean).join(' · ').toLowerCase();

    const searchableText = [
      fullName,
      stageName,
      location,
      topicSearchText,
      socialLinks,
      portfolioText,
    ].filter(Boolean).join(' ').toLowerCase();

    const verificationLevel = deriveVerificationLevel({
      portfolioCount: portfolioText ? 1 : 0,
      socialCount: networksList.length,
    }).level;

    return {
      id,
      fullName,
      firstName,
      stageName,
      gender,
      normalizedGender,
      socialLinks,
      networksList,
      platforms: {
        tiktok: socialLower.includes('tiktok'),
        instagram: socialLower.includes('instagram'),
        youtube: socialLower.includes('youtube') || socialLower.includes('youtu.be'),
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
      works,
      capAvatar: reviewedCapImage(id, row.cap_hash),
      equipmentText,
      petContext,
      childrenContext,
      skinType,
      experienceSince,
      heightCm,
      aiSummary: aiProfile?.summary,
      aiNiches: aiProfile?.niches,
      aiVisualSignalsText: aiProfile?.visualSignalsText,
      topicSearchText,
      searchableText,
      contactReachable: Boolean(row.contact_reachable),
      finalImage,
      hasCustomImage,
      verificationLevel,
    };
  });

  return { records, embeddings: indexedData.embeddings };
};

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

    const requestedFilters = castingFilters(query);
    const removedFilters: CastingFilter[] = Array.isArray(reqBody.removedFilters)
      ? reqBody.removedFilters.filter((f: unknown): f is CastingFilter => typeof f === 'string')
      : [];
    const fullyUnderstood = requestedFilters.length > 0 && directorySearchWords(query).length === 0;

    let initialAnalysis: QueryAnalysis;
    if (!fullyUnderstood && isAiProviderConfigured()) {
      try {
        initialAnalysis = await analyzeQueryWithOpenRouter(query, requestId);
      } catch (openRouterError) {
        console.warn(`[${requestId}] LLM query analysis failed, using deterministic fallback:`, openRouterError instanceof Error ? openRouterError.message : openRouterError);
        initialAnalysis = analyzeQueryDeterministically(query);
      }
    } else {
      initialAnalysis = analyzeQueryDeterministically(query);
    }

    const deterministicTopics = detectTopicsInText(query);
    const validTopics = new Set<string>(deterministicTopics);
    const extraKeywords: string[] = [];
    for (const rawTopic of initialAnalysis.topics) {
      const normalizedTopic = String(rawTopic || '').trim().toLowerCase();
      if (normalizedTopic in TOPIC_RULES) validTopics.add(normalizedTopic);
      else if (normalizedTopic.length >= 3) extraKeywords.push(normalizedTopic);
    }
    for (const removed of removedFilters) {
      if (removed in TOPIC_RULES) validTopics.delete(removed);
    }
    initialAnalysis.topics = [...validTopics];
    initialAnalysis.keywords = [...new Set([...initialAnalysis.keywords, ...extraKeywords])];

    const filters = requestedFilters.filter((filter) => !removedFilters.includes(filter));
    const genderWasRemoved = removedFilters.includes('male') || removedFilters.includes('female');
    const castingGender = filters.find((filter) => filter === 'male' || filter === 'female');
    const aiGender = initialAnalysis.gender === 'male' || initialAnalysis.gender === 'female' ? initialAnalysis.gender : null;
    const effectiveGender: 'male' | 'female' | 'any' = genderWasRemoved ? 'any' : (castingGender || aiGender || 'any');
    initialAnalysis.gender = effectiveGender;

    const effectiveCastingFilters: CastingFilter[] = [...filters];
    if (effectiveGender !== 'any' && !effectiveCastingFilters.includes(effectiveGender)) {
      effectiveCastingFilters.unshift(effectiveGender);
    }

    const hasNonGenderCasting = effectiveCastingFilters.some((f) => f !== 'male' && f !== 'female');
    const meaningfulKeywords = extractMeaningfulKeywords(query, initialAnalysis, requestedFilters, removedFilters);
    const hasThematicQuery = !fullyUnderstood && (initialAnalysis.topics.length > 0 || meaningfulKeywords.length > 0);
    const reasoning = generateReasoning(initialAnalysis, meaningfulKeywords);

    const now = Date.now();
    const bypassCache = hasNonGenderCasting || Boolean(process.env.DATABASE_URL?.includes('.invalid'));
    let pool: CachedSearchPool;
    try {
      if (bypassCache) {
        pool = await fetchNeonCreatorPool(hasNonGenderCasting);
      } else {
        if (!cachedSearchPool || now - lastNeonFetch > CACHE_DURATION) {
          cachedSearchPool = await fetchNeonCreatorPool(false);
          lastNeonFetch = now;
        }
        pool = cachedSearchPool;
      }
    } catch (databaseError) {
      console.error(`[${requestId}] Neon creator search failed`, databaseError);
      return NextResponse.json({
        success: false,
        error: 'Creator database unavailable',
        message: 'Die Creator-Suche ist vorübergehend nicht verfügbar.',
      }, { status: 503 });
    }

    const searchRecords = pool.records;

    // Stage A: Hard casting/gender filter + deterministic relevance evaluation
    let droppedGenderFilter = 0;
    let droppedEvidenceFilter = 0;
    let droppedRelevanceFilter = 0;
    let droppedLowScore = 0;
    let droppedError = 0;

    type EvaluatedEntry = {
      profile: SearchableCreatorProfile;
      exactCasting: CastingEvidence[] | null;
      relatedCastingMatch: { priority: number; evidence: CastingEvidence[] } | null;
      evidence: CastingEvidence[];
      evaluation: CreatorRelevanceEvaluation;
    };

    const castingPassed: EvaluatedEntry[] = [];

    for (const profile of searchRecords) {
      try {
        const exact = matchCasting(profile, effectiveCastingFilters);
        const related = exact ? null : relatedCasting(profile, effectiveCastingFilters);
        const evidence = exact || related?.evidence;
        if (!evidence) {
          if (effectiveGender !== 'any' && profile.normalizedGender !== effectiveGender) droppedGenderFilter++;
          else droppedEvidenceFilter++;
          continue;
        }

        const evaluation = evaluateCreatorRelevance(
          profile,
          initialAnalysis,
          meaningfulKeywords,
          hasNonGenderCasting && Boolean(exact),
        );

        // Age exclusion always remains hard
        if (evaluation.hardExcluded && evaluation.exclusionReason === 'age') {
          droppedLowScore += 1;
          continue;
        }

        castingPassed.push({
          profile,
          exactCasting: exact,
          relatedCastingMatch: related,
          evidence,
          evaluation,
        });
      } catch (error) {
        droppedError += 1;
        console.error(`[${requestId}] Error scoring creator ${profile.id}:`, error);
      }
    }

    // Stage B: Hybrid retrieval (Postgres German Full-Text + Vector Embeddings via RRF)
    const sql = getDatabase();
    let ftsRanks = new Map<string, number>();
    let queryEmbedding: number[] | null = null;
    if (hasThematicQuery && castingPassed.length > 0) {
      const ftsQueryText = [
        query,
        ...meaningfulKeywords.slice(0, 6),
      ].join(' ');
      const [ftsRes, embRes] = await Promise.all([
        queryFullTextRanks(sql, ftsQueryText, 80),
        pool.embeddings.size > 0 ? embedSingleText(query) : Promise.resolve(null),
      ]);
      ftsRanks = ftsRes;
      queryEmbedding = embRes;
    }

    const hybridEntries = fuseHybridCandidates({
      entries: castingPassed.map((e) => ({ profile: e.profile, evaluation: e.evaluation })),
      ftsRanks,
      embeddings: pool.embeddings,
      queryEmbedding,
    });
    const hybridById = new Map(hybridEntries.map((h) => [h.profile.id, h]));

    // Build candidate list eligible for reranking or direct deterministic+hybrid output
    const candidatesForRanking: Array<EvaluatedEntry & {
      ftsRank: number;
      vectorSimilarity: number;
      rrfScore: number;
      hybridPromoted: boolean;
      prelimScore: number;
    }> = [];

    for (const entry of castingPassed) {
      const hybrid = hybridById.get(entry.profile.id)!;
      const keep = !entry.evaluation.hardExcluded || hybrid.hybridPromoted;
      if (!keep) {
        droppedRelevanceFilter += 1;
        continue;
      }

      const prelimScore =
        entry.evaluation.totalScore +
        Math.round(hybrid.rrfScore * 3_500) +
        (hybrid.vectorSimilarity > 0 ? Math.round(hybrid.vectorSimilarity * 120) : 0);

      candidatesForRanking.push({
        ...entry,
        ftsRank: hybrid.ftsRank,
        vectorSimilarity: hybrid.vectorSimilarity,
        rrfScore: hybrid.rrfScore,
        hybridPromoted: hybrid.hybridPromoted,
        prelimScore,
      });
    }

    candidatesForRanking.sort((a, b) => b.prelimScore - a.prelimScore);

    // Pre-filter agent hard constraints (city, topics, verification level) BEFORE rerank & 24-cap
    const cityFilter = typeof reqBody.city === 'string' ? reqBody.city.trim().toLowerCase() : '';
    const topicFilter: string[] = Array.isArray(reqBody.topics)
      ? reqBody.topics.filter((t: unknown) => typeof t === 'string' && t.trim()).map((t: string) => t.trim().toLowerCase())
      : [];
    const minVerificationLevel =
      typeof reqBody.humanVerificationLevelMin === 'number' && Number.isFinite(reqBody.humanVerificationLevelMin)
        ? reqBody.humanVerificationLevelMin
        : undefined;

    const agentFiltered = candidatesForRanking.filter(({ profile }) => {
      if (cityFilter && !profile.locationLower.includes(cityFilter)) return false;
      if (
        topicFilter.length &&
        !topicFilter.some((t) => profile.topicSearchText.includes(t) || profile.topicsText.toLowerCase().includes(t))
      ) {
        return false;
      }
      if (minVerificationLevel !== undefined && profile.verificationLevel < minVerificationLevel) return false;
      return true;
    });

    // Stage C: Grounded LLM Reranking on Top N candidates (only for thematic searches, with strict timeout & fallback)
    let rerankVerdicts: Map<string, { fit: 'exact' | 'related' | 'reject'; score: number; reason: string }> | null = null;
    if (hasThematicQuery && !hasNonGenderCasting && agentFiltered.length > 0 && Date.now() - startedAt < TIMEOUT_MS - 6_000) {
      const topCandidates = agentFiltered.slice(0, MAX_RERANK_CANDIDATES);
      rerankVerdicts = await rerankCandidatesWithLLM({
        query,
        analysis: initialAnalysis,
        candidates: topCandidates.map((c) => buildRerankPayload(c.profile)),
        requestId,
        timeoutMs: 8_000,
      });
    }

    const validCreators: ProcessedCreator[] = [];

    for (const item of agentFiltered) {
      const { profile, evaluation, relatedCastingMatch, evidence } = item;
      const verdict = rerankVerdicts?.get(profile.id);

      if (verdict) {
        if (verdict.fit === 'reject') {
          droppedRelevanceFilter += 1;
          continue;
        }
        const isAlternative = Boolean(relatedCastingMatch) || verdict.fit === 'related';
        const relatedPriority = relatedCastingMatch
          ? relatedCastingMatch.priority + 10
          : isAlternative
            ? 1
            : 0;
        const score = verdict.score * 10 + Math.round(evaluation.qualityScore);
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
          ...(evidence.length ? { evidence } : {}),
          ...(verdict.reason
            ? { matchReason: verdict.reason }
            : isAlternative
              ? (evaluation.relatedReason ? { matchReason: evaluation.relatedReason } : {})
              : (evaluation.matchReason ? { matchReason: evaluation.matchReason } : {})),
          relatedPriority,
          score,
          relevanceScore: verdict.score * 10,
          verificationLevel: profile.verificationLevel,
          topicSearchText: profile.topicSearchText,
        });
        continue;
      }

      // Deterministic + Hybrid RRF fallback (used when no LLM rerank ran or for tail beyond top N)
      // When the LLM reranker ran on top candidates, do NOT promote un-reranked tail profiles solely
      // on raw vector similarity into primary creators.
      const strongSemanticExact =
        !rerankVerdicts &&
        item.hybridPromoted &&
        item.vectorSimilarity >= SEMANTIC_EXACT_SIMILARITY;
      const isPrimaryMatch =
        Boolean(item.exactCasting) &&
        (!evaluation.hasThematicRequirement || evaluation.hasThematicMatch || strongSemanticExact);

      // If the LLM reranker already evaluated the top candidates, demote un-reranked tail items to alternatives
      // when we already have reranker-confirmed matches, preventing unverified low-rank profiles from leaking in.
      if (rerankVerdicts && !isPrimaryMatch) {
        continue;
      }

      const isAlternative = Boolean(relatedCastingMatch) || !isPrimaryMatch;
      const relatedPriority = relatedCastingMatch
        ? relatedCastingMatch.priority + 10
        : isAlternative
          ? 1
          : 0;

      const semanticReason = item.hybridPromoted
        ? strongSemanticExact
          ? 'Semantisch passendes Profil zur Anfrage'
          : 'Thematisch verwandtes Profil'
        : undefined;

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
        ...(evidence.length ? { evidence } : {}),
        ...(isAlternative
          ? (evaluation.relatedReason || semanticReason ? { matchReason: evaluation.relatedReason || semanticReason } : {})
          : (evaluation.matchReason || semanticReason ? { matchReason: evaluation.matchReason || semanticReason } : {})),
        relatedPriority,
        score: item.prelimScore,
        relevanceScore: evaluation.relevanceScore + Math.round(item.rrfScore * 3_500),
        verificationLevel: profile.verificationLevel,
        topicSearchText: profile.topicSearchText,
      });
    }

    validCreators.sort((a, b) => {
      if (a.relatedPriority !== b.relatedPriority) return b.relatedPriority - a.relatedPriority;
      if (a.score !== b.score) return b.score - a.score;
      if (a.relevanceScore !== b.relevanceScore) return b.relevanceScore - a.relevanceScore;
      if (a.hasCustomImage !== b.hasCustomImage) return a.hasCustomImage ? -1 : 1;
      return b.totalReach - a.totalReach;
    });

    const matchedCreators = validCreators.filter((creator) => creator.relatedPriority === 0);
    const alternatives = validCreators.filter((creator) => creator.relatedPriority > 0);
    const publicCard = ({
      hasCustomImage,
      totalReach,
      score,
      relevanceScore,
      relatedPriority,
      verificationLevel,
      topicSearchText,
      ...rest
    }: ProcessedCreator) => rest;
    const finalCreators = matchedCreators.slice(0, 24).map(publicCard);
    const processingTime = Date.now() - startedAt;

    console.log(
      `[${requestId}] Search done in ${processingTime}ms: matched=${matchedCreators.length}/${searchRecords.length} alt=${alternatives.length} returned=${finalCreators.length} hybrid=${Boolean(queryEmbedding || ftsRanks.size)} reranked=${Boolean(rerankVerdicts)}`,
    );

    await logSearch(query, matchedCreators.length, req.headers.get('x-search-source') === 'agent' ? 'agent' : 'web');

    return NextResponse.json({
      success: true,
      creators: finalCreators,
      totalCount: matchedCreators.length,
      alternatives: alternatives.slice(0, 6).map(publicCard),
      pool: {
        size: searchRecords.length,
        scored: validCreators.length,
        droppedLowScore,
        droppedRelevanceFilter,
        droppedError,
        droppedGenderFilter,
        droppedEvidenceFilter,
        hybridUsed: Boolean(queryEmbedding || ftsRanks.size > 0),
        reranked: Boolean(rerankVerdicts),
      },
      query,
      reasoning,
      analysis: {
        gender: initialAnalysis.gender,
        castingFilters: effectiveCastingFilters,
        platforms: initialAnalysis.platforms,
        topics: initialAnalysis.topics,
        location: initialAnalysis.location,
        priceRange: initialAnalysis.priceRange,
        followerRange: {
          min: initialAnalysis.minFollowers,
          max: initialAnalysis.maxFollowers,
        },
        ageRange: initialAnalysis.ageRange,
        keywords: meaningfulKeywords,
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

async function analyzeQueryWithOpenRouter(query: string, requestId: string): Promise<QueryAnalysis> {
  const resolved = resolveAiProvider();
  if (!resolved) {
    throw new Error('AI provider key is not configured');
  }

  let lastError: unknown;
  const models = resolveChatModels(resolved, 'query_analysis');

  for (const model of models) {
    try {
      const response = await fetch(`${resolved.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: buildAiHeaders(resolved, { title: 'UGC VZ Creator Search', requestId }),
        body: JSON.stringify(
          buildChatRequestBody(resolved, {
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
  "keywords": ["relevante", "fachbegriffe", "synonyme"]
}

Regeln:
- Erkenne Synonyme: "Insta" = "instagram", "YT" = "youtube"
- Geschlecht nur aus ausdrücklichen oder eindeutigen Angaben (z. B. "Mama" = "female", "Papa" = "male", "Creatorin" = "female"); sonst "any"
- Wähle topics NUR aus der obigen Liste und NUR wenn inhaltlich wirklich passend
- Gib in "keywords" die wichtigsten konkreten Fachbegriffe / Nischenwörter (ohne Füllwörter wie "ich", "suche", "creator", "video") zurück
- Extrahiere Reichweiten intelligent: "10k" = 10000, "1m" = 1000000
- Extrahiere Alter des Creators (nicht der Kinder): "ab 30" = {"min":30,"max":null}, "unter 25" = {"min":null,"max":25}
- Extrahiere Orte: "Berlin", "Hamburg", "NRW", "Wien"
- Extrahiere Budget/Preis in Euro: "bis 500 Euro" = {"min":null,"max":500}`,
              },
              {
                role: 'user',
                content: `Analysiere diese Creator-Suchanfrage: "${query}"`,
              },
            ],
            temperature: 0.2,
            maxTokens: 300,
            expectJson: true,
          }),
        ),
        signal: AbortSignal.timeout(12_000),
      });

      if (!response.ok) {
        throw new Error(`${resolved.provider} API failed with status ${response.status}`);
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
        gender: parsed.gender === 'male' || parsed.gender === 'female' ? parsed.gender : 'any',
        platforms: Array.isArray(parsed.platforms)
          ? parsed.platforms.map((p: unknown) => String(p).toLowerCase()).filter(Boolean)
          : [],
        topics: Array.isArray(parsed.topics)
          ? parsed.topics.map((t: unknown) => String(t).toLowerCase()).filter(Boolean)
          : [],
        minFollowers: Number(parsed.minFollowers) || 0,
        maxFollowers: parsed.maxFollowers ? Number(parsed.maxFollowers) : null,
        ageRange: {
          min: parsed.ageRange?.min ? Number(parsed.ageRange.min) : null,
          max: parsed.ageRange?.max ? Number(parsed.ageRange.max) : null,
        },
        location: typeof parsed.location === 'string' && parsed.location.trim() ? parsed.location.trim().toLowerCase() : null,
        priceRange: {
          min: parsed.priceRange?.min ? Number(parsed.priceRange.min) : null,
          max: parsed.priceRange?.max ? Number(parsed.priceRange.max) : null,
        },
        keywords: Array.isArray(parsed.keywords)
          ? parsed.keywords.map((k: unknown) => String(k).trim().toLowerCase()).filter(Boolean)
          : [],
      };
    } catch (error) {
      lastError = error;
      console.error(`[${requestId}] OpenRouter analysis failed for ${model}:`, error instanceof Error ? error.message : error);
    }
  }

  throw lastError || new Error('OpenRouter analysis failed for all models');
}

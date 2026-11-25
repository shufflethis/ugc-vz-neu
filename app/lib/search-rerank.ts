import { z } from 'zod';
import { cosineSimilarity, sanitizePublicSearchSnippet } from './search-index';
import type { CreatorRelevanceEvaluation, QueryAnalysis, SearchableCreatorProfile } from './search-scoring';

export type HybridCandidate = {
  profile: SearchableCreatorProfile;
  evaluation: CreatorRelevanceEvaluation;
  ftsRank: number;
  vectorSimilarity: number;
  rrfScore: number;
  hybridPromoted: boolean;
};

export type RerankCandidatePayload = {
  id: string;
  name: string;
  city: string;
  gender: string;
  age: number | null;
  priceRange: string;
  platforms: string[];
  profileSnippet: string;
};

export type RerankVerdict = {
  id: string;
  fit: 'exact' | 'related' | 'reject';
  score: number;
  reason: string;
};

type RerankFn = (input: {
  query: string;
  analysis: QueryAnalysis;
  candidates: RerankCandidatePayload[];
  requestId: string;
}) => Promise<RerankVerdict[] | null>;

let testReranker: RerankFn | null = null;

/** Test hook (used only by automated test suites; never exported from route.ts). */
export function setRerankerForTests(fn: RerankFn | null) {
  testReranker = fn;
}

const RerankResponseSchema = z.object({
  results: z.array(
    z.object({
      id: z.string().min(1),
      fit: z.enum(['exact', 'related', 'reject']),
      score: z.number().min(0).max(100),
      reason: z.string().max(180).default(''),
    }),
  ),
});

/**
 * Thresholds for semantic promotion:
 * A creator without an exact deterministic keyword match can still be promoted into hybrid
 * candidates when their embedding cosine similarity or Postgres FTS rank is genuinely strong.
 */
export const SEMANTIC_EXACT_SIMILARITY = 0.48;
export const SEMANTIC_CANDIDATE_SIMILARITY = 0.36;
export const FTS_PROMOTION_THRESHOLD = 0.04;

/**
 * Combines deterministic relevance, Postgres German full-text search, and embedding cosine similarity
 * via weighted Reciprocal Rank Fusion (RRF).
 */
export function fuseHybridCandidates(input: {
  entries: Array<{
    profile: SearchableCreatorProfile;
    evaluation: CreatorRelevanceEvaluation;
  }>;
  ftsRanks: Map<string, number>;
  embeddings: Map<string, number[]>;
  queryEmbedding: number[] | null;
}): HybridCandidate[] {
  const { entries, ftsRanks, embeddings, queryEmbedding } = input;
  const k = 60;

  // Compute raw signals for every entry
  const enriched = entries.map(({ profile, evaluation }) => {
    const ftsRank = ftsRanks.get(profile.id) || 0;
    const vec = embeddings.get(profile.id);
    const vectorSimilarity = queryEmbedding && vec ? cosineSimilarity(queryEmbedding, vec) : 0;
    const semanticStrong = vectorSimilarity >= SEMANTIC_CANDIDATE_SIMILARITY;
    const ftsStrong = ftsRank >= FTS_PROMOTION_THRESHOLD;
    const hybridPromoted =
      evaluation.hasThematicRequirement &&
      !evaluation.hasThematicMatch &&
      (semanticStrong || ftsStrong);

    return {
      profile,
      evaluation,
      ftsRank,
      vectorSimilarity,
      rrfScore: 0,
      hybridPromoted,
    };
  });

  // Deterministic rank (only entries with real deterministic thematic match or no thematic requirement)
  const detOrder = enriched
    .filter((item) => !item.evaluation.hardExcluded && (!item.evaluation.hasThematicRequirement || item.evaluation.hasThematicMatch))
    .sort((a, b) => b.evaluation.totalScore - a.evaluation.totalScore);
  const detRankMap = new Map(detOrder.map((item, idx) => [item.profile.id, idx + 1]));

  // FTS rank
  const ftsOrder = enriched
    .filter((item) => item.ftsRank > 0)
    .sort((a, b) => b.ftsRank - a.ftsRank);
  const ftsRankMap = new Map(ftsOrder.map((item, idx) => [item.profile.id, idx + 1]));

  // Vector similarity rank (only meaningful cosine similarity >= threshold)
  const vecOrder = enriched
    .filter((item) => item.vectorSimilarity >= SEMANTIC_CANDIDATE_SIMILARITY)
    .sort((a, b) => b.vectorSimilarity - a.vectorSimilarity);
  const vecRankMap = new Map(vecOrder.map((item, idx) => [item.profile.id, idx + 1]));

  for (const item of enriched) {
    const detRank = detRankMap.get(item.profile.id);
    const ftsRankPos = ftsRankMap.get(item.profile.id);
    const vecRankPos = vecRankMap.get(item.profile.id);

    let rrf = 0;
    if (detRank !== undefined) rrf += 1.4 / (k + detRank);
    if (vecRankPos !== undefined) rrf += 1.25 / (k + vecRankPos);
    if (ftsRankPos !== undefined) rrf += 0.9 / (k + ftsRankPos);
    // Boost strong vector similarity directly as a tie-breaker
    if (item.vectorSimilarity >= SEMANTIC_CANDIDATE_SIMILARITY) {
      rrf += item.vectorSimilarity * 0.015;
    }
    item.rrfScore = rrf;
  }

  return enriched;
}

/**
 * Builds strictly PII-free, compact candidate payloads for LLM reranking.
 * Never includes email, phone, legal_name, social URLs with handles that might contain personal info, or consent.
 */
export function buildRerankPayload(profile: SearchableCreatorProfile): RerankCandidatePayload {
  const platforms = Object.entries(profile.platforms)
    .filter(([, active]) => active)
    .map(([name]) => name);

  const snippetParts = [
    profile.topicsText ? `Themen/Branchen: ${profile.topicsText}` : '',
    profile.formatsText ? `Formate: ${profile.formatsText}` : '',
    profile.equipmentText ? `Equipment: ${profile.equipmentText}` : '',
    profile.petContext ? `Tiere: ${profile.petContext}` : '',
    profile.childrenContext ? `Kinder/Familie: ${profile.childrenContext}` : '',
    profile.aiSummary ? `Steckbrief: ${profile.aiSummary}` : '',
    profile.aiNiches?.length ? `Nischen: ${profile.aiNiches.join(', ')}` : '',
    profile.aiVisualSignalsText ? `Kanal-Signale: ${profile.aiVisualSignalsText}` : '',
  ]
    .filter(Boolean)
    .join(' | ');

  return {
    id: profile.id,
    name: sanitizePublicSearchSnippet(profile.firstName, 40),
    city: sanitizePublicSearchSnippet(profile.location, 60),
    gender: sanitizePublicSearchSnippet(profile.gender, 30),
    age: profile.age,
    priceRange: sanitizePublicSearchSnippet(profile.priceRange, 80),
    platforms,
    profileSnippet: sanitizePublicSearchSnippet(snippetParts, 420),
  };
}

const OPENROUTER_RERANK_MODELS = [
  process.env.SEARCH_RERANK_MODEL || 'deepseek/deepseek-v4-flash-0731',
  'deepseek/deepseek-v4-flash',
];

export async function rerankCandidatesWithLLM(input: {
  query: string;
  analysis: QueryAnalysis;
  candidates: RerankCandidatePayload[];
  requestId: string;
  timeoutMs?: number;
}): Promise<Map<string, RerankVerdict> | null> {
  if (input.candidates.length === 0) return null;

  if (testReranker) {
    try {
      const verdicts = await testReranker({
        query: input.query,
        analysis: input.analysis,
        candidates: input.candidates,
        requestId: input.requestId,
      });
      if (!verdicts) return null;
      return new Map(verdicts.map((v) => [v.id, v]));
    } catch (error) {
      console.warn(`[${input.requestId}] Test reranker failed, falling back:`, error instanceof Error ? error.message : 'unknown');
      return null;
    }
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const timeoutMs = input.timeoutMs ?? 8_000;
  const allowedIds = new Set(input.candidates.map((c) => c.id));

  for (const model of [...new Set(OPENROUTER_RERANK_MODELS)]) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://ugc-vz.de',
          'X-Title': 'UGC VZ Creator Search Rerank',
          'X-Request-ID': input.requestId,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: `Du bist ein strenger Casting-Kurator für ein deutschsprachiges UGC-Creator-Verzeichnis.
Bewerte für JEDEN gelieferten Creator-Kandidaten ehrlich, wie gut das Profil zur Suchanfrage passt.

Antworte NUR mit validem JSON:
{
  "results": [
    { "id": "UGC-...", "fit": "exact" | "related" | "reject", "score": 0-100, "reason": "Kurzer faktischer Grund auf Deutsch (max. 14 Wörter)" }
  ]
}

Strenge Regeln:
- "exact" (score 65-100): Profil belegt die gesuchte Nische / das Thema / den Kontext direkt (auch über Synonyme wie KFZ/Tuning/Werkstatt für Auto).
- "related" (score 35-64): Verwandtes Umfeld (z. B. Camping/Outdoor/Technik bei Auto), aber kein direkter Treffer.
- "reject" (score 0-34): Thema passt NICHT (z. B. Beauty/Skincare/Fashion bei Auto-Suche, oder nur generisches Lifestyle ohne Bezug). Lieber ablehnen als unpassende Profile durchlassen!
- ANTI-HALLUZINATION: "reason" darf AUSSCHLIESSLICH Fakten aus dem gelieferten profileSnippet nennen. Erfinde nichts hinzu.
- Gib für jede übergebene id genau einen Eintrag zurück.`,
            },
            {
              role: 'user',
              content: JSON.stringify({
                query: input.query,
                constraints: {
                  gender: input.analysis.gender,
                  topics: input.analysis.topics,
                  location: input.analysis.location,
                  ageRange: input.analysis.ageRange,
                  priceRange: input.analysis.priceRange,
                  platforms: input.analysis.platforms,
                },
                candidates: input.candidates,
              }),
            },
          ],
          temperature: 0.1,
          max_tokens: 1_200,
          reasoning: { enabled: false },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter rerank HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) {
        throw new Error('Empty rerank content');
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON object in rerank response');

      const parsed = RerankResponseSchema.safeParse(JSON.parse(jsonMatch[0]));
      if (!parsed.success) {
        throw new Error(`Invalid rerank schema: ${parsed.error.message}`);
      }

      const verdictMap = new Map<string, RerankVerdict>();
      for (const item of parsed.data.results) {
        if (!allowedIds.has(item.id)) continue;
        verdictMap.set(item.id, {
          id: item.id,
          fit: item.fit,
          score: Math.round(item.score),
          reason: sanitizePublicSearchSnippet(item.reason, 160),
        });
      }

      if (verdictMap.size > 0) return verdictMap;
    } catch (error) {
      console.warn(
        `[${input.requestId}] Reranker failed for ${model}, falling back:`,
        error instanceof Error ? error.message : 'unknown',
      );
    }
  }

  return null;
}

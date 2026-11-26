import crypto from 'node:crypto';
import { buildAiHeaders, resolveAiProvider, resolveEmbeddingModel } from './ai-provider';

export type SqlClient = { query: (query: string, params?: unknown[]) => Promise<any[]> };

export type CreatorSearchDocumentInput = {
  displayName?: string | null;
  stageName?: string | null;
  city?: string | null;
  gender?: string | null;
  topics?: string | null;
  industries?: string | null;
  specialTraits?: string | null;
  preferredContent?: string | null;
  equipment?: string | null;
  petContext?: string | null;
  childrenContext?: string | null;
  skinType?: string | null;
  experienceSince?: string | null;
  networks?: string[] | null;
  portfolioTitles?: string[] | null;
  approvedAiSummary?: string | null;
  approvedAiNiches?: string[] | null;
  approvedVisualSignals?: Array<{ signal?: string; category?: string; evidence?: string }> | null;
};

export const DEFAULT_EMBEDDING_MODEL =
  process.env.SEARCH_EMBEDDING_MODEL || 'openai/text-embedding-3-small';

type EmbeddingProvider = (texts: string[]) => Promise<Array<number[] | null>>;

let testEmbeddingProvider: EmbeddingProvider | null = null;

/** Test hook (used only by automated test suites; never exported from route.ts). */
export function setEmbeddingProviderForTests(provider: EmbeddingProvider | null) {
  testEmbeddingProvider = provider;
}

/** Strips accidentally entered private contact strings (email/phone) from public search text. */
export function sanitizePublicSearchSnippet(value: string | null | undefined, maxLen = 1_200): string {
  return String(value || '')
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '')
    .replace(/\+?\d[\d\s/().-]{7,}\d/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

/**
 * Builds the canonical German search document for a creator.
 * Strictly public fields only (never email, phone, legal_name, or consent).
 */
export function buildCreatorSearchDocument(input: CreatorSearchDocumentInput): string {
  const lines: string[] = [];

  const displayName = sanitizePublicSearchSnippet(input.displayName, 120);
  const stageName = sanitizePublicSearchSnippet(input.stageName, 120);
  if (displayName) lines.push(`Name: ${displayName}`);
  if (stageName && stageName.toLowerCase() !== displayName.toLowerCase()) {
    lines.push(`Künstlername: ${stageName}`);
  }

  const city = sanitizePublicSearchSnippet(input.city, 120);
  if (city) lines.push(`Region: ${city}`);

  const gender = sanitizePublicSearchSnippet(input.gender, 40);
  if (gender) lines.push(`Geschlecht: ${gender}`);

  const topics = sanitizePublicSearchSnippet(input.topics, 1_200);
  if (topics) lines.push(`Themen: ${topics}`);

  const industries = sanitizePublicSearchSnippet(input.industries, 1_200);
  if (industries) lines.push(`Branchen: ${industries}`);

  const preferredContent = sanitizePublicSearchSnippet(input.preferredContent, 1_200);
  if (preferredContent) lines.push(`Formate: ${preferredContent}`);

  const specialTraits = sanitizePublicSearchSnippet(input.specialTraits, 1_000);
  if (specialTraits) lines.push(`Merkmale: ${specialTraits}`);

  const equipment = sanitizePublicSearchSnippet(input.equipment, 800);
  if (equipment) lines.push(`Ausrüstung: ${equipment}`);

  const petContext = sanitizePublicSearchSnippet(input.petContext, 700);
  if (petContext) lines.push(`Haustiere: ${petContext}`);

  const childrenContext = sanitizePublicSearchSnippet(input.childrenContext, 700);
  if (childrenContext) lines.push(`Familie & Kinder: ${childrenContext}`);

  const skinType = sanitizePublicSearchSnippet(input.skinType, 200);
  if (skinType) lines.push(`Hauttyp: ${skinType}`);

  const experienceSince = sanitizePublicSearchSnippet(input.experienceSince, 120);
  if (experienceSince) lines.push(`Erfahrung seit: ${experienceSince}`);

  const networks = (input.networks || []).map((n) => sanitizePublicSearchSnippet(n, 40)).filter(Boolean);
  if (networks.length) lines.push(`Plattformen: ${networks.join(', ')}`);

  const titles = (input.portfolioTitles || []).map((t) => sanitizePublicSearchSnippet(t, 160)).filter(Boolean);
  if (titles.length) lines.push(`Arbeitsproben: ${titles.join(' · ')}`);

  // Approved creator AI profile enrichment (Phase 3)
  const aiSummary = sanitizePublicSearchSnippet(input.approvedAiSummary, 1_500);
  if (aiSummary) lines.push(`KI-Steckbrief: ${aiSummary}`);

  const aiNiches = (input.approvedAiNiches || []).map((n) => sanitizePublicSearchSnippet(n, 80)).filter(Boolean);
  if (aiNiches.length) lines.push(`Bestätigte Nischen: ${aiNiches.join(', ')}`);

  const visualSignals = (input.approvedVisualSignals || [])
    .map((item) => {
      const sig = sanitizePublicSearchSnippet(item?.signal, 100);
      const ev = sanitizePublicSearchSnippet(item?.evidence, 180);
      if (!sig) return '';
      return ev ? `${sig} (${ev})` : sig;
    })
    .filter(Boolean);
  if (visualSignals.length) lines.push(`Sichtbare Kanal-Signale: ${visualSignals.join(' · ')}`);

  return lines.join('\n').trim();
}

export function hashSearchDocument(documentText: string): string {
  return crypto.createHash('sha256').update(documentText, 'utf8').digest('hex');
}

export function normalizeVector(values: number[]): number[] {
  let normSq = 0;
  for (let i = 0; i < values.length; i += 1) normSq += values[i] * values[i];
  const norm = Math.sqrt(normSq);
  if (!Number.isFinite(norm) || norm <= 0) return values;
  return values.map((v) => v / norm);
}

export function cosineSimilarity(a: number[] | null | undefined, b: number[] | null | undefined): number {
  if (!a || !b || a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const av = a[i];
    const bv = b[i];
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (!Number.isFinite(denom) || denom <= 0) return 0;
  return dot / denom;
}

export async function embedTexts(
  texts: string[],
  options: { apiKey?: string; model?: string; timeoutMs?: number } = {},
): Promise<Array<number[] | null>> {
  if (texts.length === 0) return [];
  if (testEmbeddingProvider) {
    const raw = await testEmbeddingProvider(texts);
    return raw.map((vec) => (vec && vec.length ? normalizeVector(vec) : null));
  }

  const resolved = resolveAiProvider(options.apiKey);
  if (!resolved) return texts.map(() => null);

  const model = resolveEmbeddingModel(resolved, options.model);
  const timeoutMs = options.timeoutMs ?? 8_000;

  try {
    const response = await fetch(`${resolved.baseUrl}/embeddings`, {
      method: 'POST',
      headers: buildAiHeaders(resolved, { title: 'UGC VZ Hybrid Search Embeddings' }),
      body: JSON.stringify({
        model,
        input: texts.map((t) => t.slice(0, 6_000)),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      console.warn(`${resolved.provider} embeddings failed with status ${response.status}`);
      return texts.map(() => null);
    }

    const data = await response.json();
    const items: Array<{ index?: number; embedding?: unknown }> = Array.isArray(data?.data) ? data.data : [];
    const results: Array<number[] | null> = texts.map(() => null);
    items.forEach((item, fallbackIdx) => {
      const idx = typeof item.index === 'number' ? item.index : fallbackIdx;
      if (idx >= 0 && idx < results.length && Array.isArray(item.embedding)) {
        const numeric = item.embedding.map(Number);
        if (numeric.length > 0 && numeric.every(Number.isFinite)) {
          results[idx] = normalizeVector(numeric);
        }
      }
    });
    return results;
  } catch (error) {
    console.warn('OpenRouter embeddings error:', error instanceof Error ? error.message : 'unknown');
    return texts.map(() => null);
  }
}

export async function embedSingleText(
  text: string,
  options: { apiKey?: string; model?: string; timeoutMs?: number } = {},
): Promise<number[] | null> {
  const [vec] = await embedTexts([text], options);
  return vec ?? null;
}

/**
 * Loads public creator data (plus approved AI profile if table exists) and updates creator_search_index.
 * Always writes document_text + German search_tsv; updates embedding only if hash changed or missing.
 */
export async function upsertCreatorSearchIndex(
  sql: SqlClient,
  creatorId: string,
  options: { forceEmbedding?: boolean; skipEmbedding?: boolean; model?: string } = {},
): Promise<{ updated: boolean; embedded: boolean; documentHash?: string }> {
  const profileRows = await sql.query(
    `SELECT
       p.id, p.display_name, p.stage_name, p.city, p.gender,
       p.topics, p.industries, p.special_traits, p.preferred_content,
       p.equipment, p.pet_context, p.children_context, p.skin_type,
       p.experience_since,
       COALESCE((
         SELECT array_agg(DISTINCT a.platform ORDER BY a.platform)
         FROM creator_social_accounts a WHERE a.creator_id = p.id
       ), ARRAY[]::text[]) AS networks,
       COALESCE((
         SELECT array_agg(f.title ORDER BY f.sort_order, f.created_at)
         FROM creator_portfolio_items f
         WHERE f.creator_id = p.id AND NULLIF(TRIM(f.title), '') IS NOT NULL
       ), ARRAY[]::text[]) AS portfolio_titles
     FROM creator_profiles p
     WHERE p.id = $1 AND p.status = 'active'
     LIMIT 1`,
    [creatorId],
  );

  const row = profileRows[0];
  if (!row) return { updated: false, embedded: false };

  // Optional Phase 3 approved AI profile enrichment (graceful if migration 021 not yet applied)
  let approvedAiSummary: string | null = null;
  let approvedAiNiches: string[] = [];
  let approvedVisualSignals: Array<{ signal?: string; category?: string; evidence?: string }> = [];
  try {
    const aiRows = await sql.query(
      `SELECT approved_summary, approved_niches, visual_signals
       FROM creator_ai_profiles
       WHERE creator_id = $1 AND status = 'approved'
       LIMIT 1`,
      [creatorId],
    );
    const ai = aiRows[0];
    if (ai) {
      approvedAiSummary = ai.approved_summary || null;
      approvedAiNiches = Array.isArray(ai.approved_niches) ? ai.approved_niches : [];
      approvedVisualSignals = Array.isArray(ai.visual_signals) ? ai.visual_signals : [];
    }
  } catch {
    // Migration 021 may not exist yet in Phase 2 deployments/tests.
  }

  const documentText = buildCreatorSearchDocument({
    displayName: row.display_name,
    stageName: row.stage_name,
    city: row.city,
    gender: row.gender,
    topics: row.topics,
    industries: row.industries,
    specialTraits: row.special_traits,
    preferredContent: row.preferred_content,
    equipment: row.equipment,
    petContext: row.pet_context,
    childrenContext: row.children_context,
    skinType: row.skin_type,
    experienceSince: row.experience_since,
    networks: Array.isArray(row.networks) ? row.networks : [],
    portfolioTitles: Array.isArray(row.portfolio_titles) ? row.portfolio_titles : [],
    approvedAiSummary,
    approvedAiNiches,
    approvedVisualSignals,
  });

  if (!documentText) return { updated: false, embedded: false };
  const documentHash = hashSearchDocument(documentText);
  const model = options.model || DEFAULT_EMBEDDING_MODEL;

  let existingHash: string | null = null;
  let hasExistingEmbedding = false;
  try {
    const existingRows = await sql.query(
      `SELECT document_hash, embedding_values IS NOT NULL AS has_embedding
       FROM creator_search_index
       WHERE creator_id = $1
       LIMIT 1`,
      [creatorId],
    );
    if (existingRows[0]) {
      existingHash = String(existingRows[0].document_hash || '');
      hasExistingEmbedding = Boolean(existingRows[0].has_embedding);
    }
  } catch {
    // creator_search_index table does not exist yet
    return { updated: false, embedded: false };
  }

  const needsEmbedding =
    !options.skipEmbedding &&
    (options.forceEmbedding || existingHash !== documentHash || !hasExistingEmbedding);

  let embedding: number[] | null = null;
  if (needsEmbedding) {
    embedding = await embedSingleText(documentText, { model });
  }

  if (embedding) {
    await sql.query(
      `INSERT INTO creator_search_index (
         creator_id, document_text, document_hash, search_tsv,
         embedding_model, embedding_dim, embedding_values, updated_at
       ) VALUES (
         $1, $2, $3, to_tsvector('german', $2),
         $4, $5, $6::real[], now()
       )
       ON CONFLICT (creator_id) DO UPDATE SET
         document_text = EXCLUDED.document_text,
         document_hash = EXCLUDED.document_hash,
         search_tsv = EXCLUDED.search_tsv,
         embedding_model = EXCLUDED.embedding_model,
         embedding_dim = EXCLUDED.embedding_dim,
         embedding_values = EXCLUDED.embedding_values,
         updated_at = now()`,
      [creatorId, documentText, documentHash, model, embedding.length, embedding],
    );
  } else {
    await sql.query(
      `INSERT INTO creator_search_index (
         creator_id, document_text, document_hash, search_tsv, updated_at
       ) VALUES (
         $1, $2, $3, to_tsvector('german', $2), now()
       )
       ON CONFLICT (creator_id) DO UPDATE SET
         document_text = EXCLUDED.document_text,
         document_hash = EXCLUDED.document_hash,
         search_tsv = EXCLUDED.search_tsv,
         updated_at = now()`,
      [creatorId, documentText, documentHash],
    );
  }

  return { updated: true, embedded: Boolean(embedding), documentHash };
}

/**
 * Runs Postgres German Full-Text Search against creator_search_index.
 * Returns a map of public_id -> ts_rank_cd score. Gracefully returns empty map if index table is absent.
 */
export async function queryFullTextRanks(
  sql: SqlClient,
  queryText: string,
  limit = 80,
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  const cleaned = queryText.trim().slice(0, 300);
  if (!cleaned) return result;

  try {
    const rows = await sql.query(
      `WITH q AS (
         SELECT COALESCE(
           NULLIF(websearch_to_tsquery('german', $1), ''::tsquery),
           plainto_tsquery('german', $1)
         ) AS tsq
       )
       SELECT p.public_id, ts_rank_cd(idx.search_tsv, q.tsq) AS fts_rank
       FROM creator_search_index idx
       JOIN creator_profiles p ON p.id = idx.creator_id
       CROSS JOIN q
       WHERE p.status = 'active'
         AND q.tsq <> ''::tsquery
         AND idx.search_tsv @@ q.tsq
       ORDER BY fts_rank DESC
       LIMIT $2`,
      [cleaned, limit],
    );

    for (const row of rows) {
      const rank = Number(row.fts_rank);
      if (row.public_id && Number.isFinite(rank) && rank > 0) {
        result.set(String(row.public_id), rank);
      }
    }
  } catch {
    // Graceful degradation when migration 020 has not been applied yet.
  }

  return result;
}

export async function loadIndexedSearchData(
  sql: SqlClient,
): Promise<{
  embeddings: Map<string, number[]>;
  aiProfiles: Map<string, { summary: string; niches: string[]; visualSignalsText: string }>;
}> {
  const embeddings = new Map<string, number[]>();
  const aiProfiles = new Map<string, { summary: string; niches: string[]; visualSignalsText: string }>();

  try {
    const rows = await sql.query(
      `SELECT p.public_id, idx.embedding_values
       FROM creator_search_index idx
       JOIN creator_profiles p ON p.id = idx.creator_id
       WHERE p.status = 'active' AND idx.embedding_values IS NOT NULL`,
    );
    for (const row of rows) {
      if (row.public_id && Array.isArray(row.embedding_values) && row.embedding_values.length > 0) {
        embeddings.set(String(row.public_id), row.embedding_values.map(Number));
      }
    }
  } catch {
    // Migration 020 not yet applied.
  }

  try {
    const aiRows = await sql.query(
      `SELECT p.public_id, ai.approved_summary, ai.approved_niches, ai.visual_signals
       FROM creator_ai_profiles ai
       JOIN creator_profiles p ON p.id = ai.creator_id
       WHERE p.status = 'active' AND ai.status = 'approved'`,
    );
    for (const row of aiRows) {
      if (!row.public_id) continue;
      const summary = String(row.approved_summary || '').trim();
      const niches = Array.isArray(row.approved_niches) ? row.approved_niches.map(String) : [];
      const signals = Array.isArray(row.visual_signals)
        ? row.visual_signals
            .map((s: any) => [s?.signal, s?.evidence].filter(Boolean).join(' '))
            .filter(Boolean)
            .join(' · ')
        : '';
      if (summary || niches.length || signals) {
        aiProfiles.set(String(row.public_id), { summary, niches, visualSignalsText: signals });
      }
    }
  } catch {
    // Migration 021 not yet applied.
  }

  return { embeddings, aiProfiles };
}

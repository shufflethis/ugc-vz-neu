import crypto from 'node:crypto';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { deriveVerificationLevel, VERIFICATION_LEVELS } from './agent-verification';

const CREATOR_PUBLIC_ID_RE = /^UGC-[A-F0-9]{10}$/;

function gatewayError(code: string, message: string) {
  const error: any = new Error(message);
  error.code = code;
  return error;
}

// ---------- Lifecycle (pure, testbar) ----------
// Zwei Quellen fuer email_events.event_type bei audience='brand':
// 1) Sendezeitpunkt (app/api/submit-request/route.ts persistInitialDelivery,
//    DeliveryResult['status']): unpraefigiert -- 'queued' | 'failed' |
//    'not_configured'. 'failed' und 'not_configured' sind beides
//    Sende-Fehlschlaege ohne Aussicht auf einen spaeteren Webhook (bei
//    'not_configured' wurde nie ein Versand versucht) und zaehlen deshalb als
//    Failure. 'queued' ist kein Failure/Completed-Event und faellt bewusst
//    durch auf den 'working'-Zweig unten.
// 2) Resend-Webhook (app/api/webhooks/resend/route.ts persistEmailEvent):
//    praefigiert mit 'email.'.
const FAILURE_EVENTS = new Set(['failed', 'not_configured', 'email.bounced', 'email.failed', 'email.suppressed']);
const COMPLETED_EVENTS = new Set(['email.delivered']);
const STALE_MS = 48 * 60 * 60 * 1000;

export function mapOutreachState(input: { createdAt: string; brandEvents: string[]; now: Date }): 'submitted' | 'working' | 'completed' | 'failed' {
  const { brandEvents } = input;
  if (brandEvents.some((e) => FAILURE_EVENTS.has(e))) return 'failed';
  if (brandEvents.some((e) => COMPLETED_EVENTS.has(e))) return 'completed';
  const age = input.now.getTime() - new Date(input.createdAt).getTime();
  if (brandEvents.length > 0) return 'working';
  return age > STALE_MS ? 'failed' : 'submitted';
}

// ---------- Kanonischer Hash (AP2-Vorbereitung) ----------
// Sortiert nur Top-Level-Keys. Payloads, die ueber diese Funktion gehasht
// werden (lead_agent_events.payload), muessen deshalb flach bleiben -- keine
// verschachtelten Objekte, nur Primitives/Arrays als Werte. Arrays sind davon
// nicht betroffen, weil Object.keys() auf einem Array ohnehin aufsteigend
// sortierte Indizes liefert.
export function canonicalHash(value: unknown): string {
  const canonical = JSON.stringify(value, Object.keys(value as object).sort());
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

// ---------- searchCreators ----------
type SearchCreatorsParams = {
  query: string;
  maxResults?: number;
  humanVerificationLevelMin?: number;
  city?: string;
  topics?: string[];
};

type SearchCreatorsCtx = { origin: string; requestId: string };

type PublicCreatorResult = {
  id: string;
  name: string;
  reach: string;
  totalReach: number;
  networks: string[];
  priceRange: string;
  city: string;
  humanVerification: { level: 0 | 1; name: string };
};

export async function searchCreators(params: SearchCreatorsParams, ctx: SearchCreatorsCtx) {
  const response = await fetch(`${ctx.origin}/api/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': ctx.requestId,
    },
    body: JSON.stringify({ query: params.query }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || data.error || 'Creator search failed');
  }

  const rawCreators: any[] = Array.isArray(data.creators) ? data.creators : [];
  // Niemals andere Felder aus der Such-API durchreichen als die hier gelisteten.
  let enriched: Array<PublicCreatorResult & { __topics: string }> = rawCreators.map((creator) => ({
    id: String(creator.id),
    name: creator.name,
    reach: creator.reach,
    totalReach: creator.totalReach,
    networks: creator.networks || [],
    priceRange: creator.priceRange || '',
    city: '',
    humanVerification: { level: 0, name: VERIFICATION_LEVELS[0].name },
    __topics: '',
  }));

  if (enriched.length) {
    const sql = getDatabase();
    const ids = enriched.map((c) => c.id);
    // Dynamische Platzhalter statt ANY($1) -- gleiches Muster wie
    // app/api/submit-request/route.ts:337 (fetchSelectedCreators), das
    // einzige im Repo bereits gegen die echte Neon-Verbindung erprobte
    // Mehrfach-ID-Query-Muster.
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
    const rows = await sql.query(
      `SELECT
         p.public_id,
         p.city,
         p.topics,
         p.total_reach,
         COALESCE(portfolio.cnt, 0) AS portfolio_count,
         COALESCE(social.cnt, 0) AS social_count
       FROM creator_profiles p
       LEFT JOIN LATERAL (
         SELECT count(*)::int AS cnt FROM creator_portfolio_items WHERE creator_id = p.id
       ) portfolio ON true
       LEFT JOIN LATERAL (
         SELECT count(*)::int AS cnt FROM creator_social_accounts WHERE creator_id = p.id
       ) social ON true
       WHERE p.public_id IN (${placeholders}) AND p.status = 'active'`,
      ids,
    );

    const byId = new Map((rows as any[]).map((row) => [String(row.public_id), row]));
    enriched = enriched
      .filter((creator) => byId.has(creator.id))
      .map((creator) => {
        const row = byId.get(creator.id);
        const verification = deriveVerificationLevel({
          portfolioCount: Number(row.portfolio_count) || 0,
          socialCount: Number(row.social_count) || 0,
        });
        return {
          ...creator,
          // /api/search entfernt totalReach aus finalCreators (siehe dortiges
          // finalCreators-Mapping) -- die kanonische Zahl kommt deshalb aus
          // creator_profiles statt aus der Such-API-Antwort.
          totalReach: Number(row.total_reach) || 0,
          city: String(row.city || ''),
          __topics: String(row.topics || ''),
          humanVerification: { level: verification.level, name: verification.name },
        };
      });
  }

  const filtered = enriched.filter((creator) => {
    if (params.city && !creator.city.toLowerCase().includes(params.city.toLowerCase())) return false;
    if (params.topics && params.topics.length) {
      const topicsLower = creator.__topics.toLowerCase();
      if (!params.topics.some((topic) => topicsLower.includes(topic.toLowerCase()))) return false;
    }
    if (params.humanVerificationLevelMin !== undefined && creator.humanVerification.level < params.humanVerificationLevelMin) {
      return false;
    }
    return true;
  });

  const rawMax = Number(params.maxResults);
  const maxResults = Number.isFinite(rawMax) ? Math.min(Math.max(rawMax, 1), 24) : 6;
  const creators: PublicCreatorResult[] = filtered.slice(0, maxResults).map(({ __topics, ...rest }) => rest);

  return {
    query: params.query,
    totalCount: filtered.length,
    returnedCount: creators.length,
    creators,
  };
}

// ---------- getCreator ----------
export async function getCreator(publicId: string) {
  if (!CREATOR_PUBLIC_ID_RE.test(publicId)) {
    throw gatewayError('invalid_public_id', 'Creator-ID hat ein ungueltiges Format');
  }

  const sql = getDatabase();
  const rows = await sql.query(
    `SELECT
       p.public_id,
       p.display_name,
       p.stage_name,
       p.city,
       p.country_code,
       p.gender,
       p.topics,
       p.industries,
       p.preferred_content,
       p.equipment,
       p.special_traits,
       p.experience_since,
       p.rate_text,
       p.reach_text,
       p.total_reach,
       p.profile_image_url,
       p.profile_quality_score,
       COALESCE(social.accounts, '[]'::json) AS socials,
       COALESCE(portfolio.items, '[]'::json) AS portfolio
     FROM creator_profiles p
     LEFT JOIN LATERAL (
       SELECT json_agg(json_build_object(
         'platform', a.platform,
         'handle', a.handle,
         'url', a.url
       ) ORDER BY a.is_primary DESC, a.created_at) AS accounts
       FROM creator_social_accounts a
       WHERE a.creator_id = p.id
     ) social ON true
     LEFT JOIN LATERAL (
       SELECT json_agg(f.url ORDER BY f.sort_order, f.created_at) AS items
       FROM creator_portfolio_items f
       WHERE f.creator_id = p.id
     ) portfolio ON true
     WHERE p.public_id = $1 AND p.status = 'active'
     LIMIT 1`,
    [publicId],
  );

  const row = (rows as any[])[0];
  if (!row) {
    throw gatewayError('not_found', 'Creator-Profil nicht gefunden');
  }

  const socials = typeof row.socials === 'string' ? JSON.parse(row.socials) : row.socials || [];
  const portfolio = typeof row.portfolio === 'string' ? JSON.parse(row.portfolio) : row.portfolio || [];

  const verification = deriveVerificationLevel({
    portfolioCount: Array.isArray(portfolio) ? portfolio.length : 0,
    socialCount: Array.isArray(socials) ? socials.length : 0,
  });

  // Ausdruecklich nicht: legal_name, birth_year, import_key, alles aus
  // creator_private_contacts -- diese Tabelle wird von dieser Funktion nicht
  // gelesen.
  return {
    public_id: row.public_id,
    display_name: row.display_name,
    stage_name: row.stage_name,
    city: row.city,
    country_code: row.country_code,
    gender: row.gender,
    topics: row.topics,
    industries: row.industries,
    preferred_content: row.preferred_content,
    equipment: row.equipment,
    special_traits: row.special_traits,
    experience_since: row.experience_since,
    rate_text: row.rate_text,
    reach_text: row.reach_text,
    total_reach: row.total_reach,
    profile_image_url: row.profile_image_url,
    profile_quality_score: row.profile_quality_score,
    socials,
    portfolio,
    humanVerification: { level: verification.level, name: verification.name },
  };
}

// ---------- requestOutreach ----------
type RequestOutreachParams = {
  creatorPublicIds: string[];
  brand: { name: string; email: string; message?: string; searchQuery?: string };
};

type RequestOutreachCtx = { origin: string; protocol: 'mcp' | 'a2a' };

export async function requestOutreach(params: RequestOutreachParams, ctx: RequestOutreachCtx): Promise<{ requestId: string }> {
  // Gleiche Deckelung wie app/a2a/route.ts:271 (submitCreatorRequest).
  const creatorPublicIds = (Array.isArray(params.creatorPublicIds) ? params.creatorPublicIds : []).slice(0, 10);
  if (!creatorPublicIds.length || creatorPublicIds.some((id) => !CREATOR_PUBLIC_ID_RE.test(id))) {
    throw gatewayError('invalid_creator_public_ids', 'creatorPublicIds muss 1-10 gueltige UGC-IDs enthalten');
  }

  const sourcePath = ctx.protocol === 'mcp' ? '/api/mcp' : '/a2a';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Referer: `${ctx.origin}/brands?source=${ctx.protocol}`,
  };
  if (process.env.SUBMIT_REQUEST_API_KEY) {
    headers['x-api-key'] = process.env.SUBMIT_REQUEST_API_KEY;
  }

  // Gleiche Feldlaengen wie app/a2a/route.ts:298-301 (submitCreatorRequest).
  const brandName = String(params.brand.name || '').slice(0, 100);
  const brandEmail = String(params.brand.email || '').slice(0, 120);
  const defaultMessage = `${ctx.protocol.toUpperCase()} Agent Anfrage ueber UGC VZ`;
  const brandMessageForApi = String(params.brand.message || defaultMessage).slice(0, 1000);
  const brandSearchQuery = String(params.brand.searchQuery || '').slice(0, 500);

  const response = await fetch(`${ctx.origin}/api/submit-request`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      creatorIds: creatorPublicIds,
      clientInfo: {
        name: brandName,
        email: brandEmail,
        message: brandMessageForApi,
        searchQuery: brandSearchQuery,
        sourcePath,
        sourceUrl: `${ctx.origin}${sourcePath}`,
      },
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || 'Submit request failed');
  }

  const leadId = String(data.leadId);
  const agentRequestId = `${ctx.protocol}_${leadId}`;

  // Kanonisches Brief-Objekt ohne E-Mail-Adresse im Klartext -- die E-Mail
  // fliesst nur als sha256-Hash in das unveraenderliche Log.
  const payload = {
    requestId: leadId,
    protocol: ctx.protocol,
    creatorPublicIds: [...creatorPublicIds].sort(),
    brandName,
    brandEmailHash: crypto.createHash('sha256').update(brandEmail.toLowerCase()).digest('hex'),
    message: params.brand.message ? brandMessageForApi : null,
    searchQuery: params.brand.searchQuery ? brandSearchQuery : null,
  };
  const payloadHash = canonicalHash(payload);

  if (isDatabaseConfigured()) {
    try {
      const sql = getDatabase();
      await sql.query(
        `UPDATE brand_leads SET agent_request_id = $2, brief_hash = $3 WHERE public_id = $1`,
        [leadId, agentRequestId, payloadHash],
      );
      await sql.query(
        `INSERT INTO lead_agent_events (lead_id, event_type, payload, payload_hash)
         SELECT id, 'outreach.submitted', $2::jsonb, $3
         FROM brand_leads WHERE public_id = $1`,
        [leadId, JSON.stringify(payload), payloadHash],
      );
    } catch (error) {
      // Additiv: das Metadaten-Log darf den erfolgreich erstellten Lead nicht
      // rueckwirkend zu einem Fehlschlag machen.
      console.error(`[${agentRequestId}] Konnte Agent-Layer-Metadaten nicht persistieren`, error);
    }
  }

  return { requestId: leadId };
}

// ---------- getOutreachStatus ----------
type OutreachStatus = {
  requestId: string;
  state: 'submitted' | 'working' | 'completed' | 'failed';
  submittedAt: string;
  updatedAt: string;
};

export async function getOutreachStatus(requestId: string): Promise<OutreachStatus> {
  const sql = getDatabase();
  const leadRows = await sql.query(
    `SELECT id, created_at, updated_at FROM brand_leads WHERE public_id = $1 LIMIT 1`,
    [requestId],
  );
  const lead = (leadRows as any[])[0];
  if (!lead) {
    throw gatewayError('not_found', 'Keine Anfrage mit dieser requestId gefunden');
  }

  const eventRows = await sql.query(
    `SELECT event_type FROM email_events WHERE lead_id = $1 AND audience = 'brand' ORDER BY occurred_at ASC`,
    [lead.id],
  );
  const brandEvents = (eventRows as any[]).map((row) => String(row.event_type));

  const createdAtIso = new Date(lead.created_at).toISOString();
  const state = mapOutreachState({ createdAt: createdAtIso, brandEvents, now: new Date() });

  // Kein DESC im Index (lead_id, occurred_at) -- deshalb hier explizit sortieren.
  const lastLoggedRows = await sql.query(
    `SELECT payload FROM lead_agent_events
     WHERE lead_id = $1 AND event_type = 'status.observed'
     ORDER BY occurred_at DESC
     LIMIT 1`,
    [lead.id],
  );
  const lastLoggedRow = (lastLoggedRows as any[])[0];
  const lastLoggedPayload = lastLoggedRow
    ? (typeof lastLoggedRow.payload === 'string' ? JSON.parse(lastLoggedRow.payload) : lastLoggedRow.payload)
    : null;

  if (!lastLoggedPayload || lastLoggedPayload.state !== state) {
    const payload = { requestId, state };
    const payloadHash = canonicalHash(payload);
    try {
      await sql.query(
        `INSERT INTO lead_agent_events (lead_id, event_type, payload, payload_hash) VALUES ($1, 'status.observed', $2::jsonb, $3)`,
        [lead.id, JSON.stringify(payload), payloadHash],
      );
    } catch (error) {
      console.error(`[${requestId}] Konnte status.observed nicht loggen`, error);
    }
  }

  return {
    requestId,
    state,
    submittedAt: createdAtIso,
    updatedAt: new Date(lead.updated_at).toISOString(),
  };
}

// ---------- getVocab ----------
const VOCAB_TTL_MS = 60 * 60 * 1000;
let vocabCache: { data: Record<string, unknown>; expiresAt: number } | null = null;

function splitFreeText(value: unknown): string[] {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function topN(counts: Map<string, number>, n: number): string[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([value]) => value);
}

export async function getVocab() {
  const now = Date.now();
  if (vocabCache && vocabCache.expiresAt > now) {
    return vocabCache.data;
  }

  const sql = getDatabase();
  const rows = await sql.query(
    `SELECT topics, industries, city FROM creator_profiles WHERE status = 'active'`,
  );

  const topicCounts = new Map<string, number>();
  const industryCounts = new Map<string, number>();
  const cityCounts = new Map<string, number>();

  for (const row of rows as any[]) {
    for (const topic of splitFreeText(row.topics)) {
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    }
    for (const industry of splitFreeText(row.industries)) {
      industryCounts.set(industry, (industryCounts.get(industry) || 0) + 1);
    }
    const city = String(row.city || '').trim();
    if (city) cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
  }

  const data = {
    topics: topN(topicCounts, 50),
    industries: topN(industryCounts, 50),
    cities: topN(cityCounts, 100),
    humanVerificationLevels: VERIFICATION_LEVELS,
    pricing: 'kostenlos fuer Brands, Honorar direkt mit dem Creator vereinbart',
  };

  vocabCache = { data, expiresAt: now + VOCAB_TTL_MS };
  return data;
}

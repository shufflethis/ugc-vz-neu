import { NextResponse } from 'next/server';
import { ugcVzAgentCard } from '@/app/lib/a2a-agent-card';
import {
  getCreator,
  getOutreachStatus,
  requestOutreach,
  mapFlatOutreachParams,
  searchCreators as gatewaySearchCreators,
} from '@/app/lib/agent-gateway';
import { verifyWebBotAuth, checkRateLimit, peekRateLimit, getRateLimitKey } from '@/app/lib/web-bot-auth';

export const dynamic = 'force-dynamic';

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: any;
};

type AgentTier = 'guest' | 'starter' | 'pro' | 'internal';

type AgentAccess = {
  keyId: string;
  tier: AgentTier;
  monthlySearchLimit: number | null;
  authenticated: boolean;
};

// Temporary in-memory quota guard. This is useful for early validation, but it resets
// on serverless cold starts and deploys. Before selling A2A access, replace it with
// a persistent store such as Vercel KV, Supabase, Airtable, or Stripe-metered billing.
const usageCounters = new Map<string, { period: string; searches: number }>();

const getCurrentPeriod = () => new Date().toISOString().slice(0, 7);

const getPlanConfig = (tier: AgentTier) => {
  if (tier === 'starter') {
    return {
      tier,
      name: 'Agent Starter',
      monthlySearchLimit: 10,
      priceEur: 29,
    };
  }

  if (tier === 'pro' || tier === 'internal') {
    return {
      tier,
      name: tier === 'internal' ? 'Internal Agent Access' : 'Agent Pro',
      monthlySearchLimit: null,
      priceEur: tier === 'internal' ? 0 : 100,
    };
  }

  return {
    tier,
    name: 'Guest Agent',
    monthlySearchLimit: Number(process.env.A2A_GUEST_MONTHLY_SEARCH_LIMIT || '0'),
    priceEur: 0,
  };
};

const parseAgentApiKeys = () => {
  const entries = (process.env.A2A_AGENT_API_KEYS || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  const keys = new Map<string, AgentTier>();
  entries.forEach((entry) => {
    const [key, tier = 'starter'] = entry.split(':').map((part) => part.trim());
    if (key && ['starter', 'pro'].includes(tier)) {
      keys.set(key, tier as AgentTier);
    }
  });

  return keys;
};

const getApiKeyFromRequest = (request: Request) => {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  return request.headers.get('x-api-key') || request.headers.get('x-a2a-api-key') || '';
};

const getAgentAccess = (request: Request): AgentAccess => {
  const apiKey = getApiKeyFromRequest(request);
  const internalKey = process.env.A2A_INTERNAL_API_KEY;

  if (apiKey && internalKey && apiKey === internalKey) {
    return {
      keyId: 'internal',
      authenticated: true,
      ...getPlanConfig('internal'),
    };
  }

  const knownKeys = parseAgentApiKeys();
  const tier = apiKey ? knownKeys.get(apiKey) : undefined;

  if (tier) {
    return {
      keyId: apiKey.slice(0, 12),
      authenticated: true,
      ...getPlanConfig(tier),
    };
  }

  return {
    keyId: apiKey ? 'unknown' : 'guest',
    authenticated: false,
    ...getPlanConfig('guest'),
  };
};

const assertPaidAccess = (access: AgentAccess) => {
  if (access.tier === 'guest' || !access.authenticated) {
    const checkoutBase = 'https://ugc-vz.de/api/a2a/checkout';
    const error: any = new Error('A2A paid access required');
    error.code = 'PAYMENT_REQUIRED';
    error.data = {
      pricing: {
        starter: {
          price: '29 EUR / Monat',
          monthlySearchLimit: 10,
          checkoutUrl: `${checkoutBase}?plan=starter`,
        },
        pro: {
          price: '100 EUR / Monat',
          monthlySearchLimit: 'unlimited',
          checkoutUrl: `${checkoutBase}?plan=pro`,
        },
      },
      auth: 'Send your A2A API key as Authorization: Bearer <key> or x-a2a-api-key.',
    };
    throw error;
  }
};

const consumeSearchQuota = (access: AgentAccess) => {
  assertPaidAccess(access);

  if (access.monthlySearchLimit === null) {
    return {
      tier: access.tier,
      remainingSearches: null,
      monthlySearchLimit: null,
    };
  }

  const period = getCurrentPeriod();
  const counterKey = `${access.keyId}:${period}`;
  const counter = usageCounters.get(counterKey) || { period, searches: 0 };

  if (counter.searches >= access.monthlySearchLimit) {
    const error: any = new Error('A2A monthly search limit reached');
    error.code = 'QUOTA_EXCEEDED';
    error.data = {
      tier: access.tier,
      period,
      monthlySearchLimit: access.monthlySearchLimit,
      usedSearches: counter.searches,
      upgradeUrl: 'https://ugc-vz.de/api/a2a/checkout?plan=pro',
    };
    throw error;
  }

  counter.searches += 1;
  usageCounters.set(counterKey, counter);

  return {
    tier: access.tier,
    period,
    monthlySearchLimit: access.monthlySearchLimit,
    usedSearches: counter.searches,
    remainingSearches: Math.max(access.monthlySearchLimit - counter.searches, 0),
  };
};

const clampResults = (value: unknown) => {
  const parsed = Number(value || 6);
  if (Number.isNaN(parsed)) return 6;
  return Math.min(Math.max(parsed, 1), 10);
};

const getOrigin = (request: Request) => {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
};

const getMessageText = (params: any) => {
  if (!params) return '';
  if (typeof params.query === 'string') return params.query;
  if (typeof params.text === 'string') return params.text;
  if (typeof params.message === 'string') return params.message;
  if (typeof params.message?.content === 'string') return params.message.content;

  const parts = params.message?.parts;
  if (Array.isArray(parts)) {
    return parts
      .map((part) => part?.text || part?.content || '')
      .filter(Boolean)
      .join('\n');
  }

  return '';
};

const jsonRpcResult = (id: JsonRpcRequest['id'], result: unknown) =>
  NextResponse.json({
    jsonrpc: '2.0',
    id: id ?? null,
    result,
  });

const jsonRpcError = (id: JsonRpcRequest['id'], code: number, message: string, data?: unknown, status = 400) =>
  NextResponse.json(
    {
      jsonrpc: '2.0',
      id: id ?? null,
      error: { code, message, data },
    },
    { status }
  );

async function searchCreators(request: Request, params: any, access: AgentAccess) {
  const query = getMessageText(params);
  if (!query.trim()) {
    throw new Error('Missing query. Provide params.query or a text message.');
  }

  // ---- Quota/Auth-Block: unveraendert, exakt an derselben Stelle wie vorher
  // (Blocker 1c, Fix-Wave-Review) -- muss vor jedem Delegations-Aufruf stehen
  // bleiben, sonst wuerde eine Suche das Kontingent umgehen. ----
  const quota = consumeSearchQuota(access);

  const origin = getOrigin(request);

  // Blocker 1c (Fix-Wave-Review): die Card wirbt fuer
  // /api/agent-schemas/search_creators.json (city/topics/
  // human_verification_level_min) -- die Route ignorierte diese Filter bisher
  // still. Jetzt Delegation an dieselbe Gateway-Funktion, die auch MCP nutzt
  // (app/lib/agent-gateway.ts searchCreators), statt eines eigenen
  // fetch+Mapping-Blocks direkt auf /api/search. clampResults() bleibt VOR
  // der Uebergabe angewandt: das Gateway selbst clamped 1-24 (MCP-Bereich),
  // A2A ist mit 1-10 bereits live -- ungeclamped durchreichen wuerde die
  // Obergrenze einer bereits ausgelieferten API stillschweigend anheben.
  // params.maxResults (bestehender A2A-Parametername) hat Vorrang;
  // params.max_results als Fallback, weil beide A2A- und MCP-Skill in der
  // Card auf dasselbe abgeleitete Schema verweisen und dieses seit Finding 6
  // max_results heisst -- ein Aufrufer, der sich strikt an das beworbene
  // Schema haelt, darf nicht ins Leere laufen.
  const maxResults = clampResults(params?.maxResults ?? params?.max_results);

  // Robustheit gegen Fehlformen von aussen (kein zod auf A2A-Seite): ein
  // falsch typisiertes topics/city/human_verification_level_min darf nach
  // bereits verbrauchtem Kontingent (quota oben) nicht zu einem harten
  // 500 im Gateway fuehren (dort z. B. params.topics.some(...) ohne
  // Array-Pruefung).
  const topics = Array.isArray(params?.topics)
    ? params.topics.filter((t: unknown) => typeof t === 'string')
    : undefined;
  const city = typeof params?.city === 'string' ? params.city : undefined;
  const rawLevel = params?.human_verification_level_min;
  const humanVerificationLevelMin = Number.isInteger(rawLevel) ? rawLevel : undefined;

  const result = await gatewaySearchCreators(
    { query, maxResults, city, topics, humanVerificationLevelMin },
    { origin, requestId: `a2a-${Date.now()}` },
  );

  return {
    query: result.query,
    totalCount: result.totalCount,
    returnedCount: result.returnedCount,
    creators: result.creators,
    billing: quota,
    policy:
      'A2A ist ein bezahlter Agent-Zugang. Ergebnisse enthalten Creator-Vorschlaege ohne private Kontaktinfos. Kontaktinfos werden erst nach bewusster Anfrage an die angegebene Brand-E-Mail gesendet.',
    nextStep:
      'Rufe ugc.submit_creator_request mit creatorIds und clientInfo.name/clientInfo.email auf, wenn die Brand diese Creator anfragen moechte.',
  };
}

async function submitCreatorRequest(request: Request, params: any, access: AgentAccess) {
  assertPaidAccess(access);

  // Blocker 1b (Fix-Wave-Review): faellt nur ein, wenn creator_public_ids
  // vorhanden UND creatorIds abwesend ist (siehe mapFlatOutreachParams) --
  // die bestehende verschachtelte Form bleibt unveraendert der Standardpfad
  // und gewinnt, falls beide Formen gemischt uebergeben werden. Die
  // Deckelung/Validierung unten (slice(0, 10), email/name-Pflicht) greift in
  // jedem Fall unveraendert, unabhaengig davon, welche Form reinkam.
  const flatMapped = mapFlatOutreachParams(params);
  const effectiveParams = flatMapped ?? params;

  const creatorIds = Array.isArray(effectiveParams?.creatorIds) ? effectiveParams.creatorIds.slice(0, 10) : [];
  const clientInfo = effectiveParams?.clientInfo || {};

  if (!creatorIds.length) {
    throw new Error('Missing creatorIds. Select at least one creator from ugc.search_creators first.');
  }

  if (!clientInfo.email || !clientInfo.name) {
    throw new Error('Missing clientInfo.name or clientInfo.email.');
  }

  const origin = getOrigin(request);

  // Additiv: der eigentliche Outreach-Aufruf laeuft jetzt durch das Gateway
  // statt eines eigenen internen fetch auf /api/submit-request, damit
  // agent_request_id/brief_hash/lead_agent_events auch fuer A2A geschrieben
  // werden (siehe app/lib/agent-gateway.ts requestOutreach). Die Quota-/
  // Auth-Pruefung oben (assertPaidAccess) bleibt unveraendert davor stehen.
  const { requestId } = await requestOutreach(
    {
      creatorPublicIds: creatorIds,
      brand: {
        name: clientInfo.name,
        email: clientInfo.email,
        message: clientInfo.message,
        searchQuery: clientInfo.searchQuery || params?.searchQuery,
      },
    },
    { origin, protocol: 'a2a' },
  );

  return {
    success: true,
    taskId: requestId,
    billing: {
      tier: access.tier,
      note: 'Creator-Anfragen sind fuer bezahlte A2A Keys freigeschaltet. Suchlimits werden nur bei ugc.search_creators verbraucht.',
    },
    note:
      'Brand-Anfrage erstellt. Die Brand bekommt die verfuegbaren Kontaktinfos per E-Mail. Creator werden nicht ungeprueft automatisiert angeschrieben. Status per tasks/get (taskId) abrufbar.',
  };
}

export async function GET() {
  return NextResponse.json(ugcVzAgentCard, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

export async function POST(request: Request) {
  let body: JsonRpcRequest;

  try {
    body = await request.json();
  } catch {
    return jsonRpcError(null, -32700, 'Invalid JSON', undefined, 400);
  }

  const id = body.id ?? null;
  const method = body.method || body.params?.skill || body.params?.skillId;
  const access = getAgentAccess(request);
  const isSearchMethod = method === 'ugc.search_creators' || method === 'message/send' || method === 'tasks/send';

  // Task 6 (Web Bot Auth, Spec §4.4) + Fix-Runde (Sicherheitsreview,
  // Finding B -- SSRF/Fetch-Amplification): verifyWebBotAuth() kann fuer
  // signierte Anfragen einen ausgehenden JWKS-Fetch ausloesen (siehe
  // app/lib/web-bot-auth.ts). Der Aufruf unten laeuft in dieser Route fuer
  // JEDEN Request (auch mit gueltigem Bezahl-Key), weil das
  // Verdikt-Logging alle Aufrufe abdecken soll -- deshalb peeken wir IMMER
  // zuerst, rein lesend, IP-Key, unsigned-Tier ("check-only" statt
  // "reserve+refund", siehe Fix-Report), UNABHAENGIG vom Auth-Status: eine
  // bereits gesperrte IP wird abgelehnt, BEVOR verifyWebBotAuth (und damit
  // ein moeglicher Fetch) ueberhaupt aufgerufen wird. Randfall: teilt sich
  // ein bezahlter Key ausnahmsweise eine IP mit missbrauchter Guest-Nutzung,
  // kann dieser Vor-Check theoretisch auch ihn treffen -- das ist bewusst in
  // Kauf genommen (fuehrt hoechstens zu einem 429 mit Retry, nie zu einem
  // Datenverlust), weil die SSRF-Absicherung sonst fuer bezahlte Keys
  // luecken haette.
  //
  // Die tatsaechliche ABRECHNUNG (Phase C unten, mutierend, kann eine
  // Anfrage final blockieren) bleibt weiterhin auf `!access.authenticated`
  // beschraenkt: bezahlte Keys haben ihre eigene monatliche Quota
  // (assertPaidAccess/consumeSearchQuota unten, exakt unveraendert) und
  // werden hier bewusst NICHT zusaetzlich gedrosselt -- nur der
  // SSRF-Vor-Check (peekRateLimit) gilt fuer alle, nicht das Rate-Limit
  // selbst.
  const ipKey = getRateLimitKey({ verdict: 'unsigned' }, request);
  const preCheck = peekRateLimit(ipKey, 'unsigned', isSearchMethod ? 3 : 1);
  if (!preCheck.allowed) {
    return jsonRpcError(id, -32029, 'Rate limit exceeded', { verdict: 'unsigned', retryAfterSeconds: preCheck.retryAfterSeconds }, 429);
  }

  const webBotAuth = await verifyWebBotAuth(request);
  console.log('[a2a:web-bot-auth]', { verdict: webBotAuth.verdict, agent: webBotAuth.agent });

  if (!access.authenticated) {
    const rateLimit = checkRateLimit(getRateLimitKey(webBotAuth, request), webBotAuth.verdict, isSearchMethod ? 3 : 1);
    if (!rateLimit.allowed) {
      return jsonRpcError(
        id,
        -32029,
        'Rate limit exceeded',
        { verdict: webBotAuth.verdict, retryAfterSeconds: rateLimit.retryAfterSeconds },
        429,
      );
    }
  }

  try {
    if (method === 'ugc.search_creators' || method === 'message/send' || method === 'tasks/send') {
      const result = await searchCreators(request, body.params || {}, access);
      return jsonRpcResult(id, {
        task: {
          id: `ugc-search-${Date.now()}`,
          status: { state: 'completed' },
          artifacts: [{ name: 'creator-search-results', mimeType: 'application/json', data: result }],
        },
      });
    }

    if (method === 'ugc.submit_creator_request') {
      const result = await submitCreatorRequest(request, body.params || {}, access);
      return jsonRpcResult(id, {
        task: {
          // Identisch mit result.taskId (= requestId aus dem Gateway), damit
          // dieser Task ueber tasks/get nachschlagbar ist, statt einer
          // unaufloesbaren Pseudo-ID.
          id: result.taskId,
          status: { state: 'completed' },
          artifacts: [{ name: 'creator-request', mimeType: 'application/json', data: result }],
        },
      });
    }

    if (method === 'tasks/get' || method === 'ugc.get_outreach_status') {
      const requestId = String(body.params?.taskId || body.params?.requestId || '');
      const status = await getOutreachStatus(requestId);
      return jsonRpcResult(id, {
        id: status.requestId,
        status: { state: status.state, timestamp: status.updatedAt },
        kind: 'task',
      });
    }

    if (method === 'ugc.get_creator' || method === 'creator_get') {
      // Blocker 1a (Fix-Wave-Review): die Card wirbt fuer
      // /api/agent-schemas/get_creator.json (MCP-foermig: creator_public_id),
      // die Route akzeptierte das bisher nicht -- creator_public_id ist jetzt
      // gleichrangig zu den bestehenden Aliasen, keiner der bestehenden faellt weg.
      return jsonRpcResult(
        id,
        await getCreator(String(body.params?.creator_public_id || body.params?.publicId || body.params?.id || '')),
      );
    }

    if (method === 'agent.card' || method === 'agent/getCard') {
      return jsonRpcResult(id, ugcVzAgentCard);
    }

    return jsonRpcError(id, -32601, 'Method not found', {
      supportedMethods: [
        'ugc.search_creators',
        'ugc.submit_creator_request',
        'ugc.get_creator',
        'ugc.get_outreach_status',
        'creator_get',
        'tasks/get',
        'message/send',
        'tasks/send',
        'agent.card',
      ],
    });
  } catch (error: any) {
    if (error.code === 'PAYMENT_REQUIRED') {
      return jsonRpcError(id, -32001, error.message, error.data, 402);
    }

    if (error.code === 'QUOTA_EXCEEDED') {
      return jsonRpcError(id, -32002, error.message, error.data, 429);
    }

    // Gateway-Fehler (app/lib/agent-gateway.ts gatewayError): not_found fuer
    // unbekannte requestId/publicId, invalid_* fuer Formatfehler. -32001 ist
    // hier zugleich A2A-Standardcode fuer TaskNotFoundError (HTTP 404) --
    // kollidiert numerisch mit dem bestehenden PAYMENT_REQUIRED-Code oben,
    // der aus einem hausgemachten Schema stammt und nicht angetastet wird
    // (siehe Report, Concerns).
    if (error.code === 'not_found') {
      return jsonRpcError(id, -32001, error.message, undefined, 404);
    }

    if (error.code === 'invalid_public_id' || error.code === 'invalid_creator_public_ids') {
      return jsonRpcError(id, -32602, error.message, undefined, 400);
    }

    return jsonRpcError(id, -32000, error.message || 'A2A request failed', undefined, 500);
  }
}

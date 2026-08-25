// MCP-Server (Streamable HTTP, stateless) auf Basis des Agent-Gateways aus
// app/lib/agent-gateway.ts. Werkzeug-Registry (Namen, Beschreibungen,
// zod-Schemas, Handler-Bindungen) liegt in app/lib/agent-tools.ts -- diese
// Route registriert daraus nur noch, siehe dortige Kommentare zur
// Begruendung (keine Modul-Ebenen-Seiteneffekte, Wiederverwendung durch den
// Schema-Endpunkt aus Task 5 und scripts/validate-agent-layer.ts).
//
// mcp-handler-Version: 2.1.1 (gepinnt), aufbauend auf
// @modelcontextprotocol/server@2 -- spricht die MCP-Spezifikation
// 2026-07-28 nativ (mit Fallback auf die 2025er Streamable-HTTP-Aera fuer
// aeltere Clients). Das urspruenglich im Task-Briefing skizzierte
// Route-Skeleton ging von mcp-handler 1.x aus (3-Parameter-Signatur,
// variadic server.tool(...), drittes config-Objekt mit basePath/maxDuration)
// -- diese API existiert in 2.1.1 nicht mehr. Siehe
// .superpowers/sdd/2026-08-15-agent-layer/task-3-report.md fuer den vollen
// Befund und die Controller-Entscheidung fuer 2.x.
import { createMcpHandler } from 'mcp-handler';
import { MCP_TOOLS } from '@/app/lib/agent-tools';
import { verifyWebBotAuth, checkRateLimit, peekRateLimit, getRateLimitKey } from '@/app/lib/web-bot-auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Fallback nur fuer den (im Streamable-HTTP-Stateless-Betrieb praktisch nie
// eintretenden) Fall, dass ctx.http.req fehlt -- gleiche kanonische Domain
// wie an anderen Stellen im Repo (z. B. app/layout.tsx, app/llms.txt/route.ts).
const FALLBACK_ORIGIN = 'https://ugc-vz.de';

const SERVER_INSTRUCTIONS = [
  'UGC VZ ist ein kostenloses Verzeichnis realer UGC-Creator (DACH) mit Portfolio- und',
  'Social-Nachweisen - kein KI-Avatar-Content. Brands suchen kostenlos, waehlen bewusst aus',
  'und erhalten Kontaktdaten per E-Mail; UGC VZ nimmt keine Provision.',
  'Typischer Ablauf: search_creators -> get_creator -> request_outreach -> get_outreach_status.',
  'get_vocab liefert Themen, Staedte und die Definition der human_verification-Stufen.',
].join(' ');

const handler = createMcpHandler(
  (server) => {
    for (const tool of MCP_TOOLS) {
      server.registerTool(
        tool.name,
        {
          title: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        },
        async (args, ctx) => {
          const req = ctx.http?.req;
          // Blocker 2 (Fix-Wave-Review): NICHT mehr getPublicOrigin() aus
          // mcp-handler -- die vertraut X-Forwarded-Host/-Proto, die ein
          // Client beliebig setzen kann. Diese Origin bestimmt, wohin
          // requestOutreach() (app/lib/agent-gateway.ts) den internen Fetch
          // inkl. SUBMIT_REQUEST_API_KEY schickt -- ein manipulierter
          // Forwarded-Host wuerde diesen Key an einen fremden Host senden.
          // Gleiches Muster wie app/a2a/route.ts:184 (getOrigin): new
          // URL(request.url).origin ist auf Vercel plattformgebunden (Next.js
          // setzt die Request-URL selbst korrekt), nicht aus einem vom Client
          // kontrollierbaren Header abgeleitet. AGENT_INTERNAL_ORIGIN als
          // expliziter Override, falls eine Deployment-Umgebung das je
          // braucht; FALLBACK_ORIGIN bleibt der letzte Ausweg fuer den
          // (praktisch nie eintretenden) Fall ohne ctx.http.req.
          const origin = process.env.AGENT_INTERNAL_ORIGIN || (req ? new URL(req.url).origin : FALLBACK_ORIGIN);
          const requestId = `mcp:${String(ctx.mcpReq.id)}`;
          return tool.handler(args, { origin, requestId });
        },
      );
    }
  },
  {
    serverInfo: { name: 'ugc-vz', version: '1.0.0' },
    instructions: SERVER_INSTRUCTIONS,
  },
);

// ---------- Task 6: Web Bot Auth + Rate-Limit, VOR dem Handler ----------
// Spec §4.4: "differenzieren, nie blockieren". Jede Anfrage bekommt ein
// Verdikt (verified/invalid/unsigned aus app/lib/web-bot-auth.ts), das ihr
// Rate-Limit-Tier bestimmt -- ein Mensch-aehnlicher, unsignierter Client
// funktioniert unveraendert weiter, nur mit dem niedrigeren Tier.
//
// Bei Ueberschreitung antworten wir mit HTTP 429 VOR dem eigentlichen
// mcp-handler-Aufruf, statt einen JSON-RPC-Fehler mit der passenden
// Request-id ueber den Handler-Pfad zu schleusen: an dieser Stelle ist die
// id nur durch Body-Parsing bekannt, und mcp-handler (server-seitig,
// Streamable HTTP) erwartet den Original-Request-Stream unangetastet. Ein
// HTTP-429-Pre-Handler-Response ist laut Briefing ausdruecklich zulaessig
// ("wenn die Transport-Schicht das erlaubt") -- hier trifft das zu, weil
// `handler` schlicht eine `(Request) => Promise<Response>`-Funktion ist
// (siehe mcp-handler/dist/index.d.ts), also ohnehin an der Next.js-
// Route-Handler-Grenze abgefangen werden kann, ohne den mcp-handler-internen
// JSON-RPC-Envelope nachzubauen. Der Fehlerkoerper ist trotzdem JSON-RPC-
// foermig (jsonrpc/id/error), damit MCP-Clients ihn als solchen erkennen,
// nur mit id: null, da wir den Body bewusst nicht zusaetzlich parsen wollen,
// nur um eine id zu extrahieren, die der Client bei einem 429 ohnehin selbst
// aus dem HTTP-Status ableiten kann.
//
// Fix-Runde (Sicherheitsreview nach Task 6, Finding B -- SSRF/Fetch-
// Amplification): verifyWebBotAuth() kann fuer signierte Anfragen einen
// ausgehenden JWKS-Fetch ausloesen (siehe app/lib/web-bot-auth.ts). Vorher
// lief hier IMMER erst die Verifikation, DANACH das Rate-Limit -- eine
// bereits gesperrte IP konnte also durch beliebig viele (oder wiederholte,
// noch nicht negativ gecachte) Signature-Agent-URLs beliebig viele Fetches
// ausloesen, ganz ohne je eine Antwort zu bekommen. Jetzt zweiphasig:
// Phase A prueft NUR (peekRateLimit, keine Mutation) den IP-Key gegen das
// unsigned-Tier -- blockiert, BEVOR verifyWebBotAuth ueberhaupt aufgerufen
// wird, also bevor irgendein Fetch passieren kann. Phase B verifiziert erst
// danach. Phase C belastet (checkRateLimit, mutierend) den nach dem Verdikt
// tatsaechlich zutreffenden Key/Tier genau einmal -- ein verifizierter Agent
// wird dadurch NICHT doppelt (einmal in Phase A als "unsigned", einmal in
// Phase C als "verified") verbucht, weil Phase A nur peekt statt zu
// verbrauchen ("check-only, dann einmal abrechnen", siehe Fix-Report).

const SEARCH_TOOL_NAMES = new Set(['search_creators']);

// Ermittelt die Rate-Limit-Kosten (Suche zaehlt 3x, Lesen 1x), OHNE den
// Original-Request-Body fuer den nachfolgenden Handler zu verbrauchen --
// request.clone() dupliziert den Stream, das Original bleibt fuer
// createMcpHandler() lesbar.
async function costForRequest(request: Request): Promise<number> {
  if (request.method !== 'POST') return 1;
  try {
    const body = await request.clone().json();
    if (body?.method === 'tools/call' && SEARCH_TOOL_NAMES.has(body?.params?.name)) {
      return 3;
    }
  } catch {
    // Kaputtes/kein JSON -- der eigentliche Handler beantwortet das ohnehin
    // als JSON-RPC-Parse-Fehler; hier zaehlen wir es als normale Kosten (1).
  }
  return 1;
}

function rateLimitResponse(verdict: string, retryAfterSeconds: number | undefined): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32029,
        message: 'Rate limit exceeded',
        data: { verdict, retryAfterSeconds },
      },
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds ?? 60),
      },
    },
  );
}

// Streamable-HTTP verlangt "Accept: application/json, text/event-stream" --
// naive Clients und Discovery-Scanner schicken das oft nicht und bekaemen vom
// SDK ein 406 ("kein MCP-Server hier"). Der Shim ergaenzt fehlende Accept-
// Werte, bevor der SDK-Handler prueft; spec-konforme Clients bleiben unberuehrt.
async function withCompatibleAccept(request: Request): Promise<Request> {
  // Exakt der SDK-Check (server/dist: handlePostRequest): verlangt BEIDE
  // Literale im Accept-Header - "*/*" (curl-Default!) genuegt dem SDK nicht.
  const accept = (request.headers.get('accept') || '').toLowerCase();
  if (accept.includes('application/json') && accept.includes('text/event-stream')) return request;
  const headers = new Headers(request.headers);
  headers.set('accept', 'application/json, text/event-stream');
  // Body puffern statt Stream durchreichen: new Request(request, init) verlangt
  // in undici sonst die duplex-Option und ist versionsabhaengig fragil.
  const body = request.method === 'GET' || request.method === 'HEAD'
    ? undefined
    : await request.arrayBuffer();
  return new Request(request.url, { method: request.method, headers, body });
}

async function withWebBotAuthGate(request: Request): Promise<Response> {
  const cost = await costForRequest(request);

  // Phase A: nur peeken, NICHT verbrauchen -- IP-Key, immer 'unsigned'-Tier,
  // weil wir das Verdikt an dieser Stelle noch nicht kennen (und es noch
  // nicht ermitteln wollen, siehe Kopfkommentar oben).
  const ipKey = getRateLimitKey({ verdict: 'unsigned' }, request);
  const preCheck = peekRateLimit(ipKey, 'unsigned', cost);
  if (!preCheck.allowed) {
    return rateLimitResponse('unsigned', preCheck.retryAfterSeconds);
  }

  // Phase B: erst jetzt verifizieren (kann einen JWKS-Fetch ausloesen, aber
  // nur fuer IPs, die Phase A passiert haben).
  const authResult = await verifyWebBotAuth(request);
  console.log('[mcp:web-bot-auth]', { verdict: authResult.verdict, agent: authResult.agent });

  // Phase C: jetzt einmal wirklich abrechnen, gegen den nach dem Verdikt
  // zutreffenden Key/Tier (verified -> Agent-URL/verified-Tier, sonst
  // weiterhin IP-Key/unsigned-Tier -- invalid zaehlt wie unsigned).
  const finalKey = getRateLimitKey(authResult, request);
  const rateLimit = checkRateLimit(finalKey, authResult.verdict, cost);
  if (!rateLimit.allowed) {
    return rateLimitResponse(authResult.verdict, rateLimit.retryAfterSeconds);
  }

  const originalAccept = (request.headers.get('accept') || '').toLowerCase();
  const response = await handler(await withCompatibleAccept(request));

  // Clients, die nur application/json akzeptieren (typisch: einfache
  // JSON-RPC-Prober), koennen die SSE-Antwort des SDK nicht parsen. Fuer sie
  // wird die gepufferte SSE-Antwort in die letzte JSON-RPC-Message
  // zurueckuebersetzt. Spec-konforme Streamable-HTTP-Clients (Accept enthaelt
  // text/event-stream) bekommen weiterhin unveraendert SSE.
  const wantsSse = originalAccept.includes('text/event-stream') || originalAccept.includes('*/*');
  const isSse = (response.headers.get('content-type') || '').includes('text/event-stream');
  if (!wantsSse && isSse && response.status === 200) {
    // Body ist nach text() verbraucht - deshalb wird IMMER eine neue Antwort
    // gebaut (JSON der letzten Message oder notfalls der Rohtext).
    const text = await response.text();
    const dataLines = text
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())
      .filter(Boolean);
    const last = dataLines[dataLines.length - 1];
    return new Response(last || text, {
      status: 200,
      headers: {
        'Content-Type': last ? 'application/json' : response.headers.get('content-type') || 'text/plain',
        'Cache-Control': 'no-store',
      },
    });
  }
  return response;
}

export { withWebBotAuthGate as GET, withWebBotAuthGate as POST, withWebBotAuthGate as DELETE };

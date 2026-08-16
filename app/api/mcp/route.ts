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
import { createMcpHandler, getPublicOrigin } from 'mcp-handler';
import { MCP_TOOLS } from '@/app/lib/agent-tools';

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
          // getPublicOrigin (aus mcp-handler) statt eigener Header-Auswertung
          // -- respektiert X-Forwarded-Host/-Proto hinter einem Proxy/Vercel.
          const origin = req ? getPublicOrigin(req) : FALLBACK_ORIGIN;
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

export { handler as GET, handler as POST, handler as DELETE };

// Werkzeug-Registry fuer den Agent-Layer (MCP unter app/api/mcp, spaeter auch
// den Schema-Endpunkt aus Task 5 und das Validierungsskript). Bewusst ohne
// Modul-Ebenen-Seiteneffekte: nur Schema-/Beschreibungs-Konstanten und
// Funktionsreferenzen -- keine DB-/Handler-Initialisierung beim Import, damit
// scripts/validate-agent-layer.ts diese Datei ohne Umgebungsvariablen laden
// kann. Die eigentlichen Gateway-Aufrufe passieren ausschliesslich innerhalb
// der handler-Funktionen (lazy), nicht beim Registrieren.
import { z } from 'zod';
import {
  searchCreators,
  getCreator,
  requestOutreach,
  getOutreachStatus,
  getVocab,
} from '@/app/lib/agent-gateway';

// Gleiches Format wie CREATOR_PUBLIC_ID_RE in app/lib/agent-gateway.ts.
// Dort nicht exportiert -- deshalb hier dupliziert statt eines Exports quer
// durch eine reine Server-Datei, die von einer Route UND einem env-freien
// Skript importiert wird.
const CREATOR_PUBLIC_ID_RE = /^UGC-[A-F0-9]{10}$/;

export type ToolRequestCtx = { origin: string; requestId: string };

type ToolTextContent = { type: 'text'; text: string };
export type ToolResult = { content: ToolTextContent[]; isError?: boolean };

function toolResult(value: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(value) }] };
}

// MCP-Tool-Fehlerform: niemals einen Stacktrace nach aussen geben, immer eine
// fuer ein Sprachmodell lesbare deutsche Meldung. Server-seitig wird der volle
// Fehler geloggt.
function toolError(toolName: string, error: unknown): ToolResult {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[mcp:${toolName}]`, error);
  return {
    content: [{ type: 'text', text: `Fehler bei ${toolName}: ${message}` }],
    isError: true,
  };
}

export type McpToolDefinition = {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  handler: (args: any, ctx: ToolRequestCtx) => Promise<ToolResult>;
};

// ---------- search_creators ----------
// Beschreibung wortgleich aus dem Task-3-Briefing uebernommen (der Text IST
// der Prompt fuer das aufrufende Sprachmodell).
const SEARCH_CREATORS_DESCRIPTION = [
  'Durchsucht das UGC-VZ-Verzeichnis realer UGC-Creator im deutschsprachigen Raum.',
  'query ist Freitext und der Hauptpfad (z. B. "Fitness-Creatorin ab 30 fuer TikTok-Produktvideo");',
  'ein Sprachmodell strukturiert die Anfrage serverseitig. Optional: city (Substring),',
  'topics (mind. ein Treffer), human_verification_level_min (0 = self_reported,',
  '1 = self_reported_with_portfolio; Stufen sind aus Profildaten abgeleitet, siehe get_vocab).',
  'Ergebnis enthaelt NIEMALS private Kontaktdaten. Fuer Details zu einem Treffer get_creator',
  'verwenden; fuer eine Kontaktanfrage request_outreach.',
].join(' ');

const searchCreatorsSchema = z.object({
  query: z.string().min(3).max(500),
  maxResults: z.number().int().min(1).max(10).optional(),
  city: z.string().max(80).optional(),
  topics: z.array(z.string().max(60)).max(10).optional(),
  human_verification_level_min: z.number().int().min(0).max(2).optional(),
});

// ---------- get_creator ----------
const GET_CREATOR_DESCRIPTION = [
  'Liefert das oeffentliche Profil eines einzelnen UGC-Creators zu einer creator_public_id aus',
  'einem vorherigen search_creators-Ergebnis: Name, Stadt, Themen, Branchen, bevorzugter Content,',
  'Ausruestung, Erfahrung seit, Honorar- und Reichweitentext, Portfolio-Links, Social-Accounts',
  'sowie die human_verification-Stufe. Gibt NIEMALS private Kontaktdaten wie E-Mail oder echten',
  'Namen zurueck - diese erhaelt die Brand erst nach request_outreach per E-Mail von UGC VZ.',
  'Vor request_outreach verwenden, um einen Treffer aus search_creators naeher zu pruefen.',
].join(' ');

const getCreatorSchema = z.object({
  creator_public_id: z.string().regex(CREATOR_PUBLIC_ID_RE, 'muss dem Format UGC-XXXXXXXXXX entsprechen'),
});

// ---------- request_outreach ----------
// Pflichttext aus dem Briefing wortgleich integriert (erste zwei Saetze +
// "Pflicht:"-Satz + "Gibt request_id..."-Satz), eingebettet in eine volle
// Beschreibung im selben Register wie die anderen vier Tools.
const REQUEST_OUTREACH_DESCRIPTION = [
  'Loest eine bewusste Brand-Anfrage aus. UGC VZ gibt daraufhin die Kontaktdaten der ausgewaehlten',
  'Creator per E-Mail an die Brand weiter. Pflicht: name, email, creator_public_ids aus vorheriger',
  'Suche. Gibt request_id fuer get_outreach_status zurueck. Vor diesem Aufruf muessen die Creator',
  'ueber search_creators oder get_creator ermittelt worden sein; request_outreach selbst liefert',
  'keine Creator-Details und keine privaten Kontaktdaten zurueck, sondern nur die request_id.',
  'message und search_query sind optionale Freitextfelder mit Kontext fuer UGC VZ. Typischer',
  'Ablauf: search_creators -> get_creator -> request_outreach -> get_outreach_status.',
].join(' ');

const requestOutreachSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().max(120).email(),
  creator_public_ids: z
    .array(z.string().regex(CREATOR_PUBLIC_ID_RE, 'muss dem Format UGC-XXXXXXXXXX entsprechen'))
    .min(1)
    .max(10),
  message: z.string().max(1000).optional(),
  search_query: z.string().max(500).optional(),
});

// ---------- get_outreach_status ----------
const GET_OUTREACH_STATUS_DESCRIPTION = [
  'Liefert den aktuellen Status einer zuvor mit request_outreach ausgeloesten Kontaktanfrage anhand',
  'der request_id: submitted (eingegangen, noch nicht bearbeitet), working (E-Mail-Versand laeuft),',
  'completed (Kontaktdaten wurden per E-Mail zugestellt) oder failed (Versand fehlgeschlagen oder',
  '48 Stunden ohne Zustellung). Gibt NIEMALS private Kontaktdaten selbst zurueck, nur den',
  'Lebenszyklus-Status samt Zeitstempeln. Nach request_outreach wiederholt aufrufen, bis der Status',
  'completed oder failed ist.',
].join(' ');

const getOutreachStatusSchema = z.object({
  request_id: z.string().min(1).max(80),
});

// ---------- get_vocab ----------
const GET_VOCAB_DESCRIPTION = [
  'Liefert das aktuell gueltige Vokabular fuer search_creators: haeufigste Themen (topics),',
  'Branchen und Staedte aus aktiven Creator-Profilen sowie die Definition der',
  'human_verification-Stufen (0 = self_reported, 1 = self_reported_with_portfolio, 2 = reserviert,',
  'wird derzeit nicht vergeben) und einen Hinweis zur Preisgestaltung. Enthaelt keine Creator- oder',
  'Kontaktdaten. Vor einer ersten search_creators-Anfrage oder bei Unsicherheit ueber gueltige',
  'Filterwerte (city, topics, human_verification_level_min) aufrufen.',
].join(' ');

const getVocabSchema = z.object({});

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'search_creators',
    description: SEARCH_CREATORS_DESCRIPTION,
    inputSchema: searchCreatorsSchema,
    handler: async (args, ctx) => {
      try {
        const result = await searchCreators(
          {
            query: args.query,
            maxResults: args.maxResults,
            city: args.city,
            topics: args.topics,
            humanVerificationLevelMin: args.human_verification_level_min,
          },
          ctx,
        );
        return toolResult(result);
      } catch (error) {
        return toolError('search_creators', error);
      }
    },
  },
  {
    name: 'get_creator',
    description: GET_CREATOR_DESCRIPTION,
    inputSchema: getCreatorSchema,
    handler: async (args) => {
      try {
        const result = await getCreator(args.creator_public_id);
        return toolResult(result);
      } catch (error) {
        return toolError('get_creator', error);
      }
    },
  },
  {
    name: 'request_outreach',
    description: REQUEST_OUTREACH_DESCRIPTION,
    inputSchema: requestOutreachSchema,
    handler: async (args, ctx) => {
      try {
        const result = await requestOutreach(
          {
            creatorPublicIds: args.creator_public_ids,
            brand: {
              name: args.name,
              email: args.email,
              message: args.message,
              searchQuery: args.search_query,
            },
          },
          { origin: ctx.origin, protocol: 'mcp' },
        );
        return toolResult(result);
      } catch (error) {
        return toolError('request_outreach', error);
      }
    },
  },
  {
    name: 'get_outreach_status',
    description: GET_OUTREACH_STATUS_DESCRIPTION,
    inputSchema: getOutreachStatusSchema,
    handler: async (args) => {
      try {
        const result = await getOutreachStatus(args.request_id);
        return toolResult(result);
      } catch (error) {
        return toolError('get_outreach_status', error);
      }
    },
  },
  {
    name: 'get_vocab',
    description: GET_VOCAB_DESCRIPTION,
    inputSchema: getVocabSchema,
    handler: async () => {
      try {
        const result = await getVocab();
        return toolResult(result);
      } catch (error) {
        return toolError('get_vocab', error);
      }
    },
  },
];

// ---------- AGENT_SCHEMAS (Task 5: /api/agent-schemas/<name>.json) ----------
// Nicht von Hand gepflegt, sondern aus MCP_TOOLS[*].inputSchema abgeleitet ueber
// den Standard-Schema-JSON-Schema-Konverter, den zod@4.4.3 selbst implementiert
// (zod/v4/classic/schemas.d.ts: "~standard": ZodStandardSchemaWithJSON<this>,
// siehe node_modules/zod/v4/classic/schemas.js:56-63 fuer die Laufzeit-Zuweisung).
// Das ist dieselbe Konvertierungsroutine, die @modelcontextprotocol/server beim
// tools/list-Handshake aus app/api/mcp/route.ts zieht (Tool-Registrierung dort
// reicht tool.inputSchema unveraendert an server.registerTool durch) -- MCP-
// Inputs und UCP-/Skill-Schemas koennen dadurch nicht auseinanderlaufen, ganz
// ohne zod-to-json-schema (bewusst nicht installiert, siehe Task-5-Briefing).
// target 'draft-2020-12' pinnt das Ausgabeformat explizit (matcht den
// $schema-Wert, den .input() sonst ohnehin waehlt) statt sich auf das
// Default-Verhalten von .input({}) zu verlassen.
// Rein, ohne I/O, zur Modul-Ladezeit einmalig berechnet -- unveraendert
// importierbar durch app/api/agent-schemas/[name]/route.ts und
// scripts/validate-agent-layer.ts.
const JSON_SCHEMA_TARGET = { target: 'draft-2020-12' } as const;

export const AGENT_SCHEMAS: Record<string, Record<string, unknown>> = Object.fromEntries(
  MCP_TOOLS.map((tool) => [tool.name, tool.inputSchema['~standard'].jsonSchema.input(JSON_SCHEMA_TARGET)]),
);

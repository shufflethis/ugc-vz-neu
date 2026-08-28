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

// MCP-Tool-Annotationen (Spec: ToolAnnotations). ChatGPT-Apps-Submissions
// verlangen alle drei Hints explizit pro Tool -- fehlende/null-Werte sind
// dort Blocker, Protokoll-Defaults reichen nicht.
export type McpToolAnnotations = {
  readOnlyHint: boolean;
  openWorldHint: boolean;
  destructiveHint: boolean;
};

export type McpToolDefinition = {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  annotations: McpToolAnnotations;
  handler: (args: any, ctx: ToolRequestCtx) => Promise<ToolResult>;
};

// Reine Lesetools: holen Daten, veraendern nichts, kein externer Effekt.
const READ_ONLY_ANNOTATIONS: McpToolAnnotations = {
  readOnlyHint: true,
  openWorldHint: false,
  destructiveHint: false,
};

// ---------- search_creators ----------
// Beschreibung wortgleich aus dem Task-3-Briefing uebernommen (der Text IST
// der Prompt fuer das aufrufende Sprachmodell).
const SEARCH_CREATORS_DESCRIPTION = [
  'Searches the UGC-VZ directory of real, verified UGC creators in the German-speaking region',
  '(DACH). query is free text and the main path (e.g. "fitness creator 30+ for a TikTok product',
  'video"); a language model structures the request server-side. Optional: city (substring),',
  'topics (at least one match), human_verification_level_min (0 = self_reported,',
  '1 = self_reported_with_portfolio; levels are derived from profile data, see get_vocab).',
  'Results NEVER contain private contact details. Use get_creator for details on a match;',
  'request_outreach for a contact request. [DE]',
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
  max_results: z.number().int().min(1).max(10).optional(),
  city: z.string().max(80).optional(),
  topics: z.array(z.string().max(60)).max(10).optional(),
  human_verification_level_min: z.number().int().min(0).max(2).optional(),
});

// ---------- get_creator ----------
const GET_CREATOR_DESCRIPTION = [
  'Returns the public profile of a single UGC creator for a creator_public_id from a previous',
  'search_creators result: name, city, topics, industries, preferred content, equipment,',
  'experience since, fee and reach text, portfolio links, social accounts and the',
  'human_verification level. NEVER returns private contact details such as e-mail or real name -',
  'the brand receives those from UGC VZ by e-mail only after request_outreach. Use before',
  'request_outreach to inspect a match more closely. [DE]',
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
  'Triggers a deliberate brand request. UGC VZ then forwards the contact details of the selected',
  'creators to the brand by e-mail. Required: name, email, creator_public_ids from a previous',
  'search. Returns request_id for get_outreach_status. Creators must have been found via',
  'search_creators or get_creator before this call; request_outreach itself returns no creator',
  'details and no private contact data, only the request_id. message and search_query are',
  'optional free-text context for UGC VZ. Typical flow: search_creators -> get_creator ->',
  'request_outreach -> get_outreach_status. Call only for serious, genuine requests: the call',
  'triggers a real e-mail, and name and email must actually belong to the requesting brand.',
  'No bulk requests, no test calls. The terms of use at https://ugc-vz.de/agb (section 10)',
  'apply. [DE]',
  'Loest eine bewusste Brand-Anfrage aus. UGC VZ gibt daraufhin die Kontaktdaten der ausgewaehlten',
  'Creator per E-Mail an die Brand weiter. Pflicht: name, email, creator_public_ids aus vorheriger',
  'Suche. Gibt request_id fuer get_outreach_status zurueck. Vor diesem Aufruf muessen die Creator',
  'ueber search_creators oder get_creator ermittelt worden sein; request_outreach selbst liefert',
  'keine Creator-Details und keine privaten Kontaktdaten zurueck, sondern nur die request_id.',
  'message und search_query sind optionale Freitextfelder mit Kontext fuer UGC VZ. Typischer',
  'Ablauf: search_creators -> get_creator -> request_outreach -> get_outreach_status.',
  'Nur fuer ernsthafte, eigene Anfragen aufrufen: der Aufruf loest einen echten E-Mail-Versand aus,',
  'name und email muessen der anfragenden Brand tatsaechlich gehoeren. Keine Massenanfragen, keine',
  'Testaufrufe. Es gelten die Nutzungsbedingungen unter https://ugc-vz.de/agb (Ziffer 10).',
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
  'Returns the current status of a contact request previously triggered with request_outreach,',
  'by request_id: submitted (received, not yet processed), working (e-mail delivery in',
  'progress), completed (contact details delivered by e-mail) or failed (delivery failed or',
  '48 hours without delivery). NEVER returns private contact details itself, only the lifecycle',
  'status with timestamps. Call repeatedly after request_outreach until the status is completed',
  'or failed. [DE]',
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
  'Returns the currently valid vocabulary for search_creators: most common topics, industries',
  'and cities from active creator profiles, the definition of the human_verification levels',
  '(0 = self_reported, 1 = self_reported_with_portfolio, 2 = reserved, currently not assigned)',
  'and a note on pricing. Contains no creator or contact data. Call before a first',
  'search_creators request or when unsure about valid filter values (city, topics,',
  'human_verification_level_min). [DE]',
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
    annotations: READ_ONLY_ANNOTATIONS,
    handler: async (args, ctx) => {
      try {
        const result = await searchCreators(
          {
            query: args.query,
            maxResults: args.max_results,
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
    annotations: READ_ONLY_ANNOTATIONS,
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
    // Loest echten E-Mail-Versand aus (openWorld), legt aber nur additiv eine
    // Anfrage an -- loescht/ueberschreibt nichts (nicht destructive).
    annotations: { readOnlyHint: false, openWorldHint: true, destructiveHint: false },
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
    annotations: READ_ONLY_ANNOTATIONS,
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
    annotations: READ_ONLY_ANNOTATIONS,
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

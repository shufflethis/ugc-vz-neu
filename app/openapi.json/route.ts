// OpenAPI-3.1-Spezifikation der oeffentlichen REST-API /api/v1.
// Request-Schemas sind aus denselben zod-Definitionen abgeleitet wie die
// MCP-Tools (app/lib/agent-tools.ts, AGENT_SCHEMAS) - eine Quelle der
// Wahrheit, REST und MCP koennen nicht auseinanderlaufen.
import { NextResponse } from 'next/server';
import { AGENT_SCHEMAS, MCP_TOOLS } from '@/app/lib/agent-tools';

export const dynamic = 'force-static';

const BASE = 'https://ugc-vz.de';

const description = (toolName: string) =>
  MCP_TOOLS.find((tool) => tool.name === toolName)?.description || '';

// $schema-Metafelder stoeren in OpenAPI-Komponenten nicht, sind aber unnoetig.
const cleanSchema = (schema: Record<string, unknown>) => {
  const { $schema: _drop, ...rest } = schema;
  return rest;
};

const PROBLEM_SCHEMA = {
  type: 'object',
  description: 'Fehlerantwort nach RFC 7807 (application/problem+json).',
  properties: {
    type: { type: 'string', format: 'uri' },
    title: { type: 'string' },
    status: { type: 'integer' },
    detail: { type: 'string' },
    code: { type: 'string', description: 'Maschinenlesbarer Fehlercode, z. B. validation_failed, not_found, rate_limited.' },
    resolution: { type: 'string', description: 'Hinweis, wie der Fehler behoben werden kann.' },
    documentation_url: { type: 'string', format: 'uri' },
  },
  required: ['type', 'title', 'status', 'detail'],
};

const problemResponses = (includeNotFound = false) => ({
  '400': {
    description: 'Ungueltige Anfrage (Validierungsfehler).',
    content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/Problem' } } },
  },
  ...(includeNotFound
    ? {
        '404': {
          description: 'Ressource nicht gefunden.',
          content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/Problem' } } },
        },
      }
    : {}),
  '429': {
    description: 'Rate-Limit erreicht. Retry-After beachten.',
    content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/Problem' } } },
  },
  '500': {
    description: 'Interner Fehler.',
    content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/Problem' } } },
  },
});

const CREATOR_SUMMARY_SCHEMA = {
  type: 'object',
  description: 'Oeffentliches Kurzprofil eines Creators aus der Suche. Enthaelt niemals private Kontaktdaten.',
  properties: {
    id: { type: 'string', description: 'Oeffentliche Creator-ID im Format UGC-XXXXXXXXXX.' },
    name: { type: 'string' },
    city: { type: 'string' },
    reach: { type: 'string', description: 'Reichweite als Freitext je Netzwerk.' },
    totalReach: { type: 'integer' },
    networks: { type: 'array', items: { type: 'string' } },
    priceRange: { type: 'string' },
    humanVerification: {
      type: 'object',
      properties: { level: { type: 'integer' }, name: { type: 'string' } },
    },
  },
  required: ['id', 'name'],
};

const spec = {
  openapi: '3.1.0',
  info: {
    title: 'UGC VZ Public API',
    version: '1.0.0',
    description: [
      'Oeffentliche REST-API des UGC-VZ-Creator-Verzeichnisses (DACH). Kein API-Key noetig.',
      'Gleiche Faehigkeiten wie der MCP-Server unter /api/mcp und der A2A-Endpunkt unter /a2a.',
      'Suchergebnisse und Profile enthalten NIEMALS private Kontaktdaten - Kontaktdaten erhaelt',
      'die Brand erst nach einer bewussten Kontaktanfrage (requestOutreach) per E-Mail.',
      'Dokumentation: https://ugc-vz.de/developers',
    ].join(' '),
    contact: { name: 'UGC VZ', email: 'hi@ugc-vz.de', url: `${BASE}/developers` },
    termsOfService: `${BASE}/agb`,
  },
  servers: [{ url: BASE }],
  paths: {
    '/api/v1/creators/search': {
      post: {
        operationId: 'searchCreators',
        summary: 'Creator-Verzeichnis durchsuchen',
        description: description('search_creators'),
        tags: ['creators'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: cleanSchema(AGENT_SCHEMAS.search_creators) } },
        },
        responses: {
          '200': {
            description: 'Suchergebnis mit oeffentlichen Kurzprofilen.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    creators: { type: 'array', items: { $ref: '#/components/schemas/CreatorSummary' } },
                    totalCount: { type: 'integer' },
                    reasoning: { type: 'string' },
                  },
                },
              },
            },
          },
          ...problemResponses(),
        },
      },
    },
    '/api/v1/creators/{publicId}': {
      get: {
        operationId: 'getCreator',
        summary: 'Oeffentliches Creator-Profil abrufen',
        description: description('get_creator'),
        tags: ['creators'],
        parameters: [
          {
            name: 'publicId',
            in: 'path',
            required: true,
            description: 'Oeffentliche Creator-ID im Format UGC-XXXXXXXXXX (10 Hex-Zeichen), aus einem Suchergebnis.',
            schema: { type: 'string', pattern: '^UGC-[A-F0-9]{10}$' },
          },
        ],
        responses: {
          '200': {
            description: 'Oeffentliches Creator-Profil (ohne private Kontaktdaten).',
            content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } },
          },
          ...problemResponses(true),
        },
      },
    },
    '/api/v1/outreach': {
      post: {
        operationId: 'requestOutreach',
        summary: 'Kontaktanfrage ausloesen (sendet echte E-Mails!)',
        description: [
          'ACHTUNG: Dieser Endpunkt loest eine ECHTE Kontaktanfrage aus - UGC VZ versendet daraufhin',
          'E-Mails mit Creator-Kontaktdaten an die angegebene Brand-Adresse. KEIN Test-Endpunkt;',
          'nicht spekulativ oder zu Testzwecken aufrufen.',
          description('request_outreach'),
        ].join(' '),
        tags: ['outreach'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: cleanSchema(AGENT_SCHEMAS.request_outreach) } },
        },
        responses: {
          '202': {
            description: 'Anfrage angenommen. Status ueber status_url abrufbar.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    request_id: { type: 'string' },
                    status_url: { type: 'string' },
                  },
                  required: ['request_id'],
                },
              },
            },
          },
          ...problemResponses(),
        },
      },
    },
    '/api/v1/outreach/{requestId}': {
      get: {
        operationId: 'getOutreachStatus',
        summary: 'Status einer Kontaktanfrage abrufen',
        description: description('get_outreach_status'),
        tags: ['outreach'],
        parameters: [
          {
            name: 'requestId',
            in: 'path',
            required: true,
            description: 'request_id aus der Antwort von requestOutreach.',
            schema: { type: 'string', maxLength: 80 },
          },
        ],
        responses: {
          '200': {
            description: 'Lebenszyklus-Status der Anfrage.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    requestId: { type: 'string' },
                    state: { type: 'string', enum: ['submitted', 'working', 'completed', 'failed'] },
                    submittedAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                  required: ['requestId', 'state'],
                },
              },
            },
          },
          ...problemResponses(true),
        },
      },
    },
    '/api/v1/vocab': {
      get: {
        operationId: 'getVocab',
        summary: 'Gueltiges Suchvokabular abrufen',
        description: description('get_vocab'),
        tags: ['meta'],
        responses: {
          '200': {
            description: 'Themen, Branchen, Staedte und human_verification-Stufen.',
            content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } },
          },
          ...problemResponses(),
        },
      },
    },
  },
  components: {
    schemas: {
      Problem: PROBLEM_SCHEMA,
      CreatorSummary: CREATOR_SUMMARY_SCHEMA,
    },
  },
  tags: [
    { name: 'creators', description: 'Oeffentliche Creator-Suche und -Profile.' },
    { name: 'outreach', description: 'Kontaktanfragen (loesen echte E-Mails aus).' },
    { name: 'meta', description: 'Vokabular und Hilfsendpunkte.' },
  ],
  externalDocs: { description: 'Developer-Portal mit MCP-/A2A-Anbindung', url: `${BASE}/developers` },
};

export function GET() {
  return NextResponse.json(spec, {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

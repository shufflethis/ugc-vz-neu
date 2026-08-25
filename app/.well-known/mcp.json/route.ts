// MCP-Discovery-Manifest unter /.well-known/mcp.json. Beschreibt den
// Streamable-HTTP-Server unter /api/mcp (Registrierung/Tools in
// app/api/mcp/route.ts bzw. app/lib/agent-tools.ts). Tool-Liste wird aus
// MCP_TOOLS abgeleitet - kann nicht vom Server abweichen.
import { NextResponse } from 'next/server';
import { MCP_TOOLS } from '@/app/lib/agent-tools';

export const dynamic = 'force-static';

const BASE = 'https://ugc-vz.de';

const manifest = {
  name: 'ugc-vz',
  displayName: 'UGC VZ Creator-Verzeichnis',
  description: [
    'Kostenloses Verzeichnis realer UGC-Creator (DACH) mit Portfolio- und Social-Nachweisen.',
    'Suche, Profilabruf und Kontaktanfragen fuer Brands - ohne API-Key, ohne Provision.',
  ].join(' '),
  version: '1.0.0',
  endpoint: `${BASE}/api/mcp`,
  transport: 'streamable-http',
  protocolVersion: '2026-07-28',
  authentication: { type: 'none', note: 'Web-Bot-Auth-signierte Agenten erhalten hoehere Rate-Limits.' },
  tools: MCP_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    schema: `${BASE}/api/agent-schemas/${tool.name}.json`,
  })),
  documentation: `${BASE}/developers`,
  openapi: `${BASE}/openapi.json`,
  related: {
    a2a: `${BASE}/.well-known/agent-card.json`,
    ucp: `${BASE}/.well-known/ucp`,
    llms: `${BASE}/llms.txt`,
  },
  contact: 'hi@ugc-vz.de',
};

export function GET() {
  return NextResponse.json(manifest, {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

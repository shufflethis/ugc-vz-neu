// GET /api - maschinenlesbarer API-Index (Discovery-Einstieg fuer Agenten).
import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

const BASE = 'https://ugc-vz.de';

export function GET() {
  return NextResponse.json(
    {
      name: 'UGC VZ Public API',
      version: 'v1',
      openapi: `${BASE}/openapi.json`,
      documentation: `${BASE}/developers`,
      endpoints: `${BASE}/api/v1`,
      mcp: `${BASE}/api/mcp`,
      mcp_manifest: `${BASE}/.well-known/mcp.json`,
      a2a: `${BASE}/.well-known/agent-card.json`,
      llms: `${BASE}/llms.txt`,
      authentication: 'none',
      errors: 'application/problem+json (RFC 7807)',
      versioning_policy: 'URL-Versionierung (/api/v1). Abkuendigungen werden mindestens 6 Monate vorher per Deprecation- und Sunset-Header sowie unter /developers angekuendigt.',
    },
    { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400', 'Access-Control-Allow-Origin': '*' } },
  );
}

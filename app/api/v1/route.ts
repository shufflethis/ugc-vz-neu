// GET /api/v1 - Endpunkt-Index der Version 1 (maschinenlesbare API-Surface).
import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

const BASE = 'https://ugc-vz.de';

export function GET() {
  return NextResponse.json(
    {
      version: 'v1',
      openapi: `${BASE}/openapi.json`,
      documentation: `${BASE}/developers`,
      endpoints: [
        { operationId: 'searchCreators', method: 'POST', path: '/api/v1/creators/search' },
        { operationId: 'getCreator', method: 'GET', path: '/api/v1/creators/{publicId}' },
        { operationId: 'requestOutreach', method: 'POST', path: '/api/v1/outreach', warning: 'Loest echte E-Mails aus - kein Test-Endpunkt.' },
        { operationId: 'getOutreachStatus', method: 'GET', path: '/api/v1/outreach/{requestId}' },
        { operationId: 'getVocab', method: 'GET', path: '/api/v1/vocab' },
      ],
      authentication: 'none',
      rate_limits: 'IP-basiert, RateLimit-Header in jeder Antwort; hoehere Limits via Web Bot Auth.',
      versioning_policy: 'URL-Versionierung (/api/v1). Abkuendigungen werden mindestens 6 Monate vorher per Deprecation- und Sunset-Header sowie unter /developers angekuendigt.',
    },
    { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400', 'Access-Control-Allow-Origin': '*' } },
  );
}

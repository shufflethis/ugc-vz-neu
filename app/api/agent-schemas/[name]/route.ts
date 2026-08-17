// Schema-Endpunkt fuer den Agent-Layer (Task 5, design-doc.md §4.3): liefert je
// MCP-Tool aus app/lib/agent-tools.ts (AGENT_SCHEMAS) das dazugehoerige
// JSON-Schema unter /api/agent-schemas/<name>.json aus -- verlinkt aus dem
// UCP-Manifest (app/.well-known/ucp/route.ts) und aus den A2A-Skills
// (app/lib/a2a-agent-card.ts, dortiges `schema`-Feld). AGENT_SCHEMAS wird aus
// den zod-Schemas ABGELEITET (siehe Kommentar dort), nicht von Hand gepflegt.
import { NextResponse } from 'next/server';
import { AGENT_SCHEMAS } from '@/app/lib/agent-tools';

export const dynamic = 'force-static';

// Next 14 App Router: der dynamische Segmentwert kommt roh aus der URL, also
// literal "search_creators.json" -- nicht "search_creators". generateStaticParams
// muss deshalb bereits die ".json"-Suffixe liefern, damit die generierten
// statischen Routen mit den tatsaechlich angefragten Pfaden uebereinstimmen.
export function generateStaticParams() {
  return Object.keys(AGENT_SCHEMAS).map((name) => ({ name: `${name}.json` }));
}

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=3600, s-maxage=3600',
  'X-Robots-Tag': 'index, follow',
};

export async function GET(_request: Request, { params }: { params: { name: string } }) {
  const toolName = params.name.endsWith('.json') ? params.name.slice(0, -'.json'.length) : params.name;
  const schema = AGENT_SCHEMAS[toolName];

  if (!schema) {
    return NextResponse.json({ error: 'unknown schema', name: params.name }, { status: 404 });
  }

  // Bewusst kein NextResponse.json(): dessen Content-Type ist fest
  // application/json; application/schema+json (RFC-Draft fuer JSON-Schema-
  // Dokumente, siehe Task-5-Briefing) braucht eine eigene Response.
  return new NextResponse(JSON.stringify(schema), {
    headers: { 'Content-Type': 'application/schema+json', ...CACHE_HEADERS },
  });
}

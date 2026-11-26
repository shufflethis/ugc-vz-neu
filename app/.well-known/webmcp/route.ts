import { NextResponse } from 'next/server';
import { AGENT_SCHEMAS, MCP_TOOLS } from '@/app/lib/agent-tools';
import { AGENT_LAYER_VERSION } from '@/app/lib/agent-version';

export const dynamic = 'force-static';

const BASE = 'https://ugc-vz.de';
const REGISTRY_TOOLS = ['search_creators', 'get_creator', 'get_outreach_status', 'get_vocab'] as const;
const BROWSER_ONLY_TOOLS = ['select_creators', 'get_last_outreach', 'get_human_selection'] as const;

const manifest = {
  version: AGENT_LAYER_VERSION,
  name: 'ugc-vz-webmcp',
  displayName: 'UGC VZ WebMCP Site Tools',
  description:
    'Browser-seitige WebMCP-Site-Tools für UGC VZ (Creator-Kampagnen nach Views im DACH-Raum). Registriert über navigator.modelContext / document.modelContext ohne automatischen Versand von E-Mails (Human-in-the-loop).',
  homepage: BASE,
  documentation: `${BASE}/developers#webmcp`,
  toolCount: REGISTRY_TOOLS.length + BROWSER_ONLY_TOOLS.length,
  tools: [
    ...REGISTRY_TOOLS.map((name) => {
      const tool = MCP_TOOLS.find((item) => item.name === name);
      return {
        name,
        scope: 'registry',
        description: tool?.description || '',
        schema: AGENT_SCHEMAS[name] ? `${BASE}/api/agent-schemas/${name}.json` : undefined,
      };
    }),
    ...BROWSER_ONLY_TOOLS.map((name) => ({
      name,
      scope: 'browser',
      description: `Browser-seitiges Interaktions-Tool "${name}" auf ugc-vz.de.`,
    })),
  ],
  related: {
    auth: `${BASE}/auth.md`,
    oauthProtectedResource: `${BASE}/.well-known/oauth-protected-resource`,
    mcp: `${BASE}/.well-known/mcp.json`,
    openapi: `${BASE}/openapi.json`,
    llms: `${BASE}/llms.txt`,
    llmsFull: `${BASE}/llms-full.txt`,
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

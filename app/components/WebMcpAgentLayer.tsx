// Server-Wrapper fuer den WebMCP-Layer: reicht Name, Beschreibung und
// JSON-Schema der Registry-Tools (app/lib/agent-tools.ts) serialisiert an die
// Client-Komponente weiter. agent-tools importiert das Agent-Gateway
// (node:crypto, DB) und darf deshalb nicht ins Client-Bundle.
import { MCP_TOOLS, AGENT_SCHEMAS } from '@/app/lib/agent-tools';
import WebMcpProvider from './WebMcpProvider';

// request_outreach fehlt bewusst: im Browser sendet der Mensch die Anfrage
// selbst ueber das CreatorSelectionPopup (Human-in-the-loop). Wird von
// scripts/validate-agent-layer.ts gegen MCP_TOOLS geprueft.
export const WEBMCP_REGISTRY_TOOLS = ['search_creators', 'get_creator', 'get_outreach_status', 'get_vocab'];

export default function WebMcpAgentLayer() {
  const tools = MCP_TOOLS.filter((tool) => WEBMCP_REGISTRY_TOOLS.includes(tool.name)).map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: AGENT_SCHEMAS[tool.name],
  }));
  return <WebMcpProvider tools={tools} />;
}

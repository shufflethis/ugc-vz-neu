// Domain-Verifizierung fuer das offizielle MCP-Registry
// (registry.modelcontextprotocol.io): beweist Kontrolle ueber ugc-vz.de und
// schaltet den Namespace de.ugc-vz/* frei. Der zugehoerige private Schluessel
// (ed25519) liegt NICHT im Repo - nur der oeffentliche Teil steht hier.
// Publish-Ablauf: mcp-publisher login http --domain ugc-vz.de --private-key <seed>.
import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function GET() {
  return new NextResponse('v=MCPv1; k=ed25519; p=3ifYGY3cFr1ODumW6kesCP/sc8oBZshV9KW3QnB1QNg=\n', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
}

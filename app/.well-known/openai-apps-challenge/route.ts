// Domain-Verifizierung fuer die ChatGPT-Apps-Submission (OpenAI Apps SDK):
// beweist Kontrolle ueber ugc-vz.de fuer den MCP-Server unter /api/mcp.
// Token stammt aus dem Submission-Formular (developers.openai.com) --
// gleiches Muster wie ../mcp-registry-auth/route.ts.
import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function GET() {
  return new NextResponse('zkucrCnzT0vJuWu9JiLWTTRiHemQ4HAIfhjebflpjyU\n', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
}

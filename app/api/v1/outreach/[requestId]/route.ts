// GET /api/v1/outreach/{requestId} - Lebenszyklus-Status einer Kontaktanfrage
// (submitted | working | completed | failed). Gibt niemals Kontaktdaten
// zurueck. REST-Spiegel des MCP-Tools get_outreach_status.
// OpenAPI: /openapi.json, operationId getOutreachStatus.
import { NextRequest, NextResponse } from 'next/server';
import { getOutreachStatus } from '@/app/lib/agent-gateway';
import { badRequest, notFound, serverError } from '@/app/lib/api-problem';
import { restRateLimit } from '@/app/lib/rest-v1';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { requestId: string } }) {
  const limited = restRateLimit(request, 1);
  if (limited) return limited;

  const requestId = String(params.requestId || '');
  if (!requestId || requestId.length > 80) {
    return badRequest('requestId fehlt oder ist zu lang (max. 80 Zeichen).', 'invalid_request_id');
  }

  try {
    const result = await getOutreachStatus(requestId);
    return NextResponse.json(result);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'not_found') {
      return notFound(`Keine Kontaktanfrage mit der requestId ${requestId.slice(0, 40)}.`, 'outreach_not_found');
    }
    console.error('REST v1 outreach status failed', error instanceof Error ? error.message : 'unknown');
    return serverError('Der Anfrage-Status ist voruebergehend nicht abrufbar.', 'status_unavailable');
  }
}

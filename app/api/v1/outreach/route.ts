// POST /api/v1/outreach - loest eine ECHTE Kontaktanfrage aus: UGC VZ sendet
// daraufhin E-Mails an die Brand (Kontaktdaten der Creator) und ggf. an
// Creator. Kein Test-Endpunkt. REST-Spiegel des MCP-Tools request_outreach.
// OpenAPI: /openapi.json, operationId requestOutreach.
import { NextRequest, NextResponse } from 'next/server';
import { requestOutreach } from '@/app/lib/agent-gateway';
import { badRequest, serverError } from '@/app/lib/api-problem';
import { requestOrigin, restRateLimit, toolSchema, zodProblem } from '@/app/lib/rest-v1';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const { limited, headers: rateHeaders } = restRateLimit(request, 3);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Request-Body muss gueltiges JSON sein.', 'invalid_json');
  }

  const parsed = toolSchema('request_outreach').safeParse(body);
  if (!parsed.success) return zodProblem(parsed.error);
  // ZodObject<ZodRawShape> tippt data als Record<string, unknown>; die
  // konkreten Feldtypen garantiert das Schema selbst (app/lib/agent-tools.ts).
  const data = parsed.data as {
    name: string;
    email: string;
    creator_public_ids: string[];
    message?: string;
    search_query?: string;
  };

  try {
    const result = await requestOutreach(
      {
        creatorPublicIds: data.creator_public_ids,
        brand: {
          name: data.name,
          email: data.email,
          message: data.message,
          searchQuery: data.search_query,
        },
      },
      { origin: requestOrigin(request), protocol: 'rest' },
    );
    return NextResponse.json({ request_id: result.requestId, status_url: `/api/v1/outreach/${result.requestId}` }, { status: 202, headers: rateHeaders });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code) return badRequest(error instanceof Error ? error.message : 'Ungueltige Anfrage.', code);
    console.error('REST v1 outreach failed', error instanceof Error ? error.message : 'unknown');
    return serverError('Die Kontaktanfrage konnte nicht angenommen werden.', 'outreach_failed');
  }
}

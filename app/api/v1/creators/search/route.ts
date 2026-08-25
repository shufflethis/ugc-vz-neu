// POST /api/v1/creators/search - oeffentliche Creator-Suche (REST-Spiegel des
// MCP-Tools search_creators). OpenAPI: /openapi.json, operationId searchCreators.
import { NextRequest, NextResponse } from 'next/server';
import { searchCreators } from '@/app/lib/agent-gateway';
import { badRequest, serverError } from '@/app/lib/api-problem';
import { requestOrigin, restRateLimit, toolSchema, zodProblem } from '@/app/lib/rest-v1';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const limited = restRateLimit(request, 3);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Request-Body muss gueltiges JSON sein.', 'invalid_json');
  }

  const parsed = toolSchema('search_creators').safeParse(body);
  if (!parsed.success) return zodProblem(parsed.error);
  // ZodObject<ZodRawShape> tippt data als Record<string, unknown>; die
  // konkreten Feldtypen garantiert das Schema selbst (app/lib/agent-tools.ts).
  const data = parsed.data as {
    query: string;
    max_results?: number;
    city?: string;
    topics?: string[];
    human_verification_level_min?: number;
  };

  try {
    const result = await searchCreators(
      {
        query: data.query,
        maxResults: data.max_results,
        city: data.city,
        topics: data.topics,
        humanVerificationLevelMin: data.human_verification_level_min,
      },
      { origin: requestOrigin(request), requestId: `rest_${Date.now().toString(36)}` },
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error('REST v1 search failed', error instanceof Error ? error.message : 'unknown');
    return serverError('Die Creator-Suche ist voruebergehend nicht verfuegbar.', 'search_unavailable');
  }
}

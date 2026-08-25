// GET /api/v1/vocab - gueltiges Suchvokabular (Themen, Branchen, Staedte,
// human_verification-Stufen). REST-Spiegel des MCP-Tools get_vocab.
// OpenAPI: /openapi.json, operationId getVocab.
import { NextRequest, NextResponse } from 'next/server';
import { getVocab } from '@/app/lib/agent-gateway';
import { serverError } from '@/app/lib/api-problem';
import { restRateLimit } from '@/app/lib/rest-v1';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = restRateLimit(request, 1);
  if (limited) return limited;

  try {
    const result = await getVocab();
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (error) {
    console.error('REST v1 vocab failed', error instanceof Error ? error.message : 'unknown');
    return serverError('Das Vokabular ist voruebergehend nicht abrufbar.', 'vocab_unavailable');
  }
}

// GET /api/v1/creators/{publicId} - oeffentliches Creator-Profil (REST-Spiegel
// des MCP-Tools get_creator). Gibt niemals private Kontaktdaten zurueck.
// OpenAPI: /openapi.json, operationId getCreator.
import { NextRequest, NextResponse } from 'next/server';
import { getCreator } from '@/app/lib/agent-gateway';
import { notFound, badRequest, serverError } from '@/app/lib/api-problem';
import { restRateLimit } from '@/app/lib/rest-v1';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { publicId: string } }) {
  const { limited, headers: rateHeaders } = restRateLimit(request, 1);
  if (limited) return limited;

  const publicId = String(params.publicId || '');
  if (!/^UGC-[A-F0-9]{10}$/.test(publicId)) {
    return badRequest('publicId muss dem Format UGC-XXXXXXXXXX (10 Hex-Zeichen) entsprechen.', 'invalid_public_id');
  }

  try {
    const result = await getCreator(publicId);
    return NextResponse.json(result, { headers: rateHeaders });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'not_found') {
      return notFound(`Kein aktiver Creator mit der ID ${publicId}.`, 'creator_not_found');
    }
    console.error('REST v1 getCreator failed', error instanceof Error ? error.message : 'unknown');
    return serverError('Creator-Profil ist voruebergehend nicht abrufbar.', 'creator_unavailable');
  }
}

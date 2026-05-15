import { NextResponse } from 'next/server';
import { ugcVzAgentCard } from '@/app/lib/a2a-agent-card';

export const dynamic = 'force-dynamic';

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: any;
};

const clampResults = (value: unknown) => {
  const parsed = Number(value || 6);
  if (Number.isNaN(parsed)) return 6;
  return Math.min(Math.max(parsed, 1), 10);
};

const getOrigin = (request: Request) => {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
};

const getMessageText = (params: any) => {
  if (!params) return '';
  if (typeof params.query === 'string') return params.query;
  if (typeof params.text === 'string') return params.text;
  if (typeof params.message === 'string') return params.message;
  if (typeof params.message?.content === 'string') return params.message.content;

  const parts = params.message?.parts;
  if (Array.isArray(parts)) {
    return parts
      .map((part) => part?.text || part?.content || '')
      .filter(Boolean)
      .join('\n');
  }

  return '';
};

const jsonRpcResult = (id: JsonRpcRequest['id'], result: unknown) =>
  NextResponse.json({
    jsonrpc: '2.0',
    id: id ?? null,
    result,
  });

const jsonRpcError = (id: JsonRpcRequest['id'], code: number, message: string, data?: unknown, status = 400) =>
  NextResponse.json(
    {
      jsonrpc: '2.0',
      id: id ?? null,
      error: { code, message, data },
    },
    { status }
  );

async function searchCreators(request: Request, params: any) {
  const query = getMessageText(params);
  if (!query.trim()) {
    throw new Error('Missing query. Provide params.query or a text message.');
  }

  const origin = getOrigin(request);
  const response = await fetch(`${origin}/api/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': `a2a-${Date.now()}`,
    },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || data.error || 'Creator search failed');
  }

  const maxResults = clampResults(params?.maxResults);
  const creators = (data.creators || []).slice(0, maxResults).map((creator: any) => ({
    id: creator.id,
    name: creator.name,
    reach: creator.reach,
    totalReach: creator.totalReach,
    networks: creator.networks || [],
    priceRange: creator.priceRange || '',
  }));

  return {
    query,
    totalCount: data.totalCount || creators.length,
    returnedCount: creators.length,
    creators,
    policy:
      'A2A liefert Creator-Vorschlaege ohne private Kontaktinfos. Kontaktinfos werden erst nach bewusster Anfrage an die angegebene Brand-E-Mail gesendet.',
    nextStep:
      'Rufe ugc.submit_creator_request mit creatorIds und clientInfo.name/clientInfo.email auf, wenn die Brand diese Creator anfragen moechte.',
  };
}

async function submitCreatorRequest(request: Request, params: any) {
  const creatorIds = Array.isArray(params?.creatorIds) ? params.creatorIds.slice(0, 10) : [];
  const clientInfo = params?.clientInfo || {};

  if (!creatorIds.length) {
    throw new Error('Missing creatorIds. Select at least one creator from ugc.search_creators first.');
  }

  if (!clientInfo.email || !clientInfo.name) {
    throw new Error('Missing clientInfo.name or clientInfo.email.');
  }

  const origin = getOrigin(request);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Referer: `${origin}/brands?source=a2a`,
  };

  if (process.env.SUBMIT_REQUEST_API_KEY) {
    headers['x-api-key'] = process.env.SUBMIT_REQUEST_API_KEY;
  }

  const response = await fetch(`${origin}/api/submit-request`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      creatorIds,
      clientInfo: {
        name: String(clientInfo.name).slice(0, 100),
        email: String(clientInfo.email).slice(0, 120),
        message: String(clientInfo.message || 'A2A Agent Anfrage ueber UGC VZ').slice(0, 1000),
        searchQuery: String(clientInfo.searchQuery || params?.searchQuery || '').slice(0, 500),
        sourcePath: '/a2a',
        sourceUrl: `${origin}/a2a`,
      },
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || 'Submit request failed');
  }

  return {
    success: true,
    note:
      'Brand-Anfrage erstellt. Die Brand bekommt die verfuegbaren Kontaktinfos per E-Mail. Creator werden nicht ungeprueft automatisiert angeschrieben.',
    upstream: data,
  };
}

export async function GET() {
  return NextResponse.json(ugcVzAgentCard, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

export async function POST(request: Request) {
  let body: JsonRpcRequest;

  try {
    body = await request.json();
  } catch {
    return jsonRpcError(null, -32700, 'Invalid JSON', undefined, 400);
  }

  const id = body.id ?? null;
  const method = body.method || body.params?.skill || body.params?.skillId;

  try {
    if (method === 'ugc.search_creators' || method === 'message/send' || method === 'tasks/send') {
      const result = await searchCreators(request, body.params || {});
      return jsonRpcResult(id, {
        task: {
          id: `ugc-search-${Date.now()}`,
          status: { state: 'completed' },
          artifacts: [{ name: 'creator-search-results', mimeType: 'application/json', data: result }],
        },
      });
    }

    if (method === 'ugc.submit_creator_request') {
      const result = await submitCreatorRequest(request, body.params || {});
      return jsonRpcResult(id, {
        task: {
          id: `ugc-request-${Date.now()}`,
          status: { state: 'completed' },
          artifacts: [{ name: 'creator-request', mimeType: 'application/json', data: result }],
        },
      });
    }

    if (method === 'agent.card' || method === 'agent/getCard') {
      return jsonRpcResult(id, ugcVzAgentCard);
    }

    return jsonRpcError(id, -32601, 'Method not found', {
      supportedMethods: ['ugc.search_creators', 'ugc.submit_creator_request', 'message/send', 'tasks/send', 'agent.card'],
    });
  } catch (error: any) {
    return jsonRpcError(id, -32000, error.message || 'A2A request failed', undefined, 500);
  }
}

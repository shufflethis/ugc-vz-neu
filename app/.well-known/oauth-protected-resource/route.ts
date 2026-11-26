import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

/**
 * RFC 9728 — OAuth 2.0 Protected Resource Metadata
 * Documents machine-client authentication & rate-limit tiers for UGC VZ endpoints.
 */
const metadata = {
  resource: 'https://ugc-vz.de/api/mcp',
  resource_name: 'UGC VZ Creator Directory & Campaign API',
  resource_documentation: 'https://ugc-vz.de/auth.md',
  authorization_servers: [],
  bearer_methods_supported: [],
  scopes_supported: [
    'creators:read',
    'vocab:read',
    'outreach:status',
    'outreach:request',
  ],
  authentication_methods: [
    {
      type: 'anonymous',
      applies_to: ['search_creators', 'get_creator', 'get_vocab', 'GET /api/v1/*'],
      rate_limit: '30 requests / minute per IP',
      description: 'Public read-only discovery endpoints require no authentication.',
    },
    {
      type: 'web_bot_auth',
      spec: 'RFC 9421 (Ed25519 HTTP Message Signatures, tag="web-bot-auth")',
      headers: ['Signature-Input', 'Signature', 'Signature-Agent'],
      applies_to: ['POST /api/mcp', 'POST /a2a'],
      rate_limit: '120 requests / minute per verified Signature-Agent',
      description: 'Cryptographically verified agents receive higher rate limits via Ed25519 JWKS verification.',
    },
    {
      type: 'human_session_otp',
      applies_to: ['/brand/*', '/konto/*', '/api/brand/*', '/api/creator/*'],
      description: 'Passwordless 6-digit email OTP / Magic Link session cookies for Brands and Creators.',
    },
    {
      type: 'webhook_shared_secret',
      header: 'X-UGCVZ-Affiliate-Secret',
      applies_to: ['POST /api/webhooks/affiliate/{campaignPublicId}'],
      description: 'Per-campaign timing-safe shared secret for shop conversion webhooks.',
    },
  ],
  related: {
    auth_guide: 'https://ugc-vz.de/auth.md',
    mcp: 'https://ugc-vz.de/.well-known/mcp.json',
    webmcp: 'https://ugc-vz.de/.well-known/webmcp',
    openapi: 'https://ugc-vz.de/openapi.json',
    a2a: 'https://ugc-vz.de/.well-known/agent-card.json',
  },
};

export function GET() {
  return NextResponse.json(metadata, {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

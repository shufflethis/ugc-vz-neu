import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

const AUTH_MD = `# Authentication & Machine Access — UGC VZ (ugc-vz.de)

This document explains how AI agents, MCP clients, integrations, and human users authenticate against **UGC VZ** (\`https://ugc-vz.de\`).

- Protected Resource Metadata (RFC 9728): \`https://ugc-vz.de/.well-known/oauth-protected-resource\`
- MCP Manifest: \`https://ugc-vz.de/.well-known/mcp.json\`
- WebMCP Manifest: \`https://ugc-vz.de/.well-known/webmcp\`
- OpenAPI 3.1 Spec: \`https://ugc-vz.de/openapi.json\`

## 1. Public Read-Only Access (No Authentication Required)

The following discovery capabilities are publicly accessible without tokens or OAuth credentials:

- **MCP Tools:** \`search_creators\`, \`get_creator\`, \`get_vocab\`, \`get_outreach_status\` via \`POST https://ugc-vz.de/api/mcp\`
- **REST API:** \`GET /api/v1/creators\`, \`GET /api/v1/creators/{publicId}\`, \`GET /api/v1/vocab\`
- **WebMCP Browser Tools:** Registered on public pages via \`navigator.modelContext\` / \`document.modelContext\` (read-only & human-in-the-loop selection; no automated email sending)
- **Rate Limit (unsigned):** 30 weighted requests / minute per IP (\`search\` = cost 3, \`read\` = cost 1).

## 2. Verified AI Agent Identity (Web Bot Auth — RFC 9421)

Machine clients calling \`POST /api/mcp\` or \`POST /a2a\` can cryptographically authenticate using **Web Bot Auth** (RFC 9421 HTTP Message Signatures with \`alg="ed25519"\` and \`tag="web-bot-auth"\`):

- Required headers:
  - \`Signature-Agent\`: HTTPS origin or JWKS URI hosting the agent's Ed25519 public key (RFC 7638 / RFC 8037 JWK thumbprint)
  - \`Signature-Input\`: \`sig1=("@authority" ...);created=...;expires=...;keyid="...";alg="ed25519";tag="web-bot-auth"\`
  - \`Signature\`: \`sig1=:<base64-ed25519-signature>:\`
- Verified agents receive **120 weighted requests / minute** keyed by \`Signature-Agent\`.

## 3. Brand & Creator Workspace Sessions (Human-in-the-Loop)

Write operations inside the UGC VZ SaaS Portal (creating campaigns, reserving Stripe budgets, approving clips, sending portal messages, requesting payouts) require an authenticated human session:

- **Brands:** Passwordless 6-digit email OTP or Magic Link at \`https://ugc-vz.de/brand\` (sets \`HttpOnly; Secure; SameSite=Lax\` session cookie).
- **Creators:** Passwordless 6-digit email OTP or Magic Link at \`https://ugc-vz.de/konto\`.
- Browser WebMCP tools deliberately omit \`request_outreach\` and budget release actions to guarantee human confirmation before spending funds or triggering emails.

## 4. Shop Affiliate Webhook Authentication

E-commerce systems (Shopify, Shopware, WooCommerce, Custom) reporting confirmed affiliate sales to \`POST https://ugc-vz.de/api/webhooks/affiliate/{campaignPublicId}\` authenticate via:

- Header: \`X-UGCVZ-Affiliate-Secret: <campaign-specific-secret>\` (generated per campaign inside the Brand Workspace, verified with constant-time comparison).

## 5. Error Format & Rate Limits

- \`400 Bad Request\`: JSON \`{ "success": false, "error": "<human-readable message>" }\`
- \`401 Unauthorized\`: Missing/invalid session cookie, CSRF origin, or webhook secret.
- \`403 Forbidden\`: Action restricted (e.g. Stripe blocked for High-Risk / Restricted Businesses).
- \`429 Too Many Requests\`: Includes \`Retry-After\` header in seconds.

Contact: \`hi@ugc-vz.de\` · Operator: track by track GmbH, Berlin.
`;

export function GET() {
  return new NextResponse(AUTH_MD, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

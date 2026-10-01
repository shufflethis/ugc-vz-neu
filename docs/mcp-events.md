# UGC VZ MCP Events

## Production status — 2026-09-30

Deployed to `https://ugc-vz.de` as `dpl_DJM62ggjPCMAx2ZGzPijG3sxBBXk`.
Migration 008 is applied; 109 existing eligible profiles were seeded without
deliveries. Production has an encryption key, the provisioned account's token
hash and the existing cron secret. The five-minute delivery cron is included.
Live checks passed for discovery, authenticated catalog, denial of unauthenticated
catalog access, private callback rejection and the authenticated empty worker.
The article, cover image, footer SVG and ChatGPT plugin link return HTTP 200.

The initial account's raw bearer token and encryption key are stored only in
the git-ignored `.env.mcp-events.local`, mode 0600. Use
`MCP_EVENTS_ACCESS_TOKEN` as the bearer token when configuring that account's
MCP connection. The published ChatGPT plugin still needs an authenticated
connection, a rescan and a subscription lifecycle test in ChatGPT; no ChatGPT
subscription has been claimed or created automatically.

`scripts/setup-mcp-events-production.mjs` provisions production from a protected
env file, applies only migration 008 in a transaction, and preserves existing
keys on repeated setup. It never prints secret values.

`creator.verified` announces the first time a public creator has an active profile,
a confirmed email and at least one social and portfolio link. This does not mean
identity verification. Payloads contain only public name, public ID, city, topics,
verification level 1 and the public profile read URL. Filters match city substrings
and any supplied topic substring, case-insensitively.

## Setup

1. Apply `db/migrations/008_mcp_events.sql` with the existing migration runner.
   Existing eligible profiles are seeded as the baseline and never announced.
   Database triggers atomically record eligibility and matching deliveries.
2. Provision a separate random bearer token for each connected account. Put only
   their SHA-256 hex hashes in `MCP_EVENTS_TOKEN_HASHES`, comma-separated. Supply
   that account's token as `Authorization: Bearer …` in its MCP connection.
   Public tools remain available without this token. Events require the token.
3. Set `MCP_EVENTS_ENCRYPTION_KEY` to 32 random bytes encoded as hex. Keep this
   key stable: stored webhook secrets are encrypted with AES-256-GCM.
4. Set `CRON_SECRET`. Vercel calls `/api/cron/mcp-events` every five minutes.
   The hosting plan must support that frequency. Each run handles four due
   deliveries; increase capacity deliberately if monitoring volume grows.
5. Rescan the configured plugin and test the complete lifecycle in ChatGPT.

Server discovery advertises `events` only when database, token hashes and encryption
key are configured. `events/list`, `events/subscribe` and `events/unsubscribe`
share `/api/mcp`. Subscription ownership is the authenticated token hash, never
a caller-supplied account ID. Removing a hash revokes event methods and prevents
future deliveries. These provisioned tokens are an initial authenticated integration;
self-service account linking/OAuth is not implemented by this feature.

Subscriptions default to seven days; requested shorter TTLs are honored. Unlimited
lifetimes are not granted. Canonical arguments make refresh idempotent. Callback
verification precedes storage. Signing-key rotation keeps the previous key for
five minutes. Callbacks require HTTPS on port 443, no credentials, no redirects,
and public IPv4 addresses resolved and pinned per connection. IPv6-only destinations
are currently unsupported. Bodies are capped at 256 KiB and responses at 16 KiB.

Transient network failures, HTTP 429 and 5xx retry with exponential backoff, at most
six attempts. Event IDs remain stable; timestamps and signatures are fresh. HTTP
410 disables the subscription; HTTP 413 and other non-transient failures stop that
delivery. Queue leases recover after crashes. There is no protocol replay: cursor
is null, and profiles first qualifying during expiration/disconnection are not replayed.
Unsubscribe prevents future delivery; an HTTP request already in flight can finish.

## Verification

Run `node --import tsx --test scripts/test-mcp-events.ts`, TypeScript and the content
audit. Database trigger tests use an isolated PostgreSQL engine:

```sh
npm install --prefix /tmp/ugc-vz-event-test --ignore-scripts @electric-sql/pglite
PGLITE_MODULE=/tmp/ugc-vz-event-test/node_modules/@electric-sql/pglite/dist/index.js node scripts/test-mcp-events-db.mjs
```

In a configured test account verify discovery, filtered creation, callback
challenge, repeated subscribe, delivery, rotation, expiration, restart, account
revocation and unsubscribe. Verify that nonmatching profiles produce no deliveries.
No identity checks, contact emails or automated outreach are triggered by events.

Reference: https://developers.openai.com/plugins/build/mcp-events

## Blog cover

Generated with the built-in imagegen tool, saved as
`public/images/ugc-vz-agenten-creator-suche.webp`.
Prompt: "Landscape editorial illustration of a real human creator filming a product
with a smartphone on a compact tripod, connected by subtle flowing lines to a laptop
with abstract creator profile cards and a small search assistant symbol. Warm
contemporary studio, lavender, coral and cream, polished magazine illustration.
Human creativity and digital discovery; no text, logos, watermarks or robots."

The footer links to the UGC VZ ChatGPT plugin. Its SVG mark is sourced from
https://github.com/lobehub/lobe-icons/blob/master/packages/static-svg/icons/openai.svg
and identifies ChatGPT. OpenAI owns the mark; https://openai.com/brand/ applies.

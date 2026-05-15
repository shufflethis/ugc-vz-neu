# A2A Agent Access

UGC-VZ exposes an Agent-to-Agent entrypoint so external agents can discover the service, search for UGC creator matches, and submit a brand request with selected creators.

This is intentionally prepared but not fully monetized yet. Do not treat the current runtime quota as billing-grade enforcement.

## Public Endpoints

- `GET /.well-known/agent-card.json`
- `GET /.well-known/agent.json`
- `GET /a2a`
- `POST /a2a`
- `GET /api/a2a/checkout?plan=starter`
- `GET /api/a2a/checkout?plan=pro`

## A2A Skills

### `ugc.search_creators`

Input:

```json
{
  "query": "sport maennlich ab 30",
  "maxResults": 3
}
```

Output contains creator suggestions without private contact data.

### `ugc.submit_creator_request`

Input:

```json
{
  "creatorIds": ["rec123", "rec456"],
  "clientInfo": {
    "name": "Brand Name",
    "email": "marketing@example.com",
    "message": "Kampagnenbriefing",
    "searchQuery": "sport maennlich ab 30"
  }
}
```

This creates the normal UGC-VZ brand request flow. Contact details are sent to the brand email when available. Creator outreach remains gated by `SEND_CREATOR_OUTREACH_EMAILS=true`.

## Pricing Plan Draft

- Agent Starter: `29 EUR / month`, `10` A2A searches per month.
- Agent Pro: `100 EUR / month`, unlimited A2A searches.

The website UI remains free. The paid layer is only for automated A2A/agent usage.

## Environment Variables

Required for paid production rollout:

```txt
STRIPE_SECRET_KEY=sk_live_...
STRIPE_A2A_STARTER_PRICE_ID=price_...
STRIPE_A2A_PRO_PRICE_ID=price_...
A2A_AGENT_API_KEYS=key1:starter,key2:pro
```

Optional:

```txt
A2A_INTERNAL_API_KEY=...
A2A_GUEST_MONTHLY_SEARCH_LIMIT=0
NEXT_PUBLIC_SITE_URL=https://ugc-vz.de
SITE_URL=https://ugc-vz.de
```

## Current Limitations

- Quota tracking uses in-memory runtime state in `app/a2a/route.ts`.
- In-memory counters reset on Vercel cold starts, scale-out, and deploys.
- Checkout can create Stripe subscription sessions only when Stripe env vars are configured.
- API-key provisioning after payment is not automated yet.
- Stripe webhook handling is not implemented yet.

## Before Turning Payments On

1. Create Stripe products and recurring prices:
   - `A2A Agent Starter`, 29 EUR/month.
   - `A2A Agent Pro`, 100 EUR/month.
2. Add the Stripe env vars in Vercel.
3. Replace in-memory quota with persistent storage:
   - Vercel KV, Supabase, Airtable, or Stripe-metered billing.
4. Add a Stripe webhook for `checkout.session.completed` and subscription lifecycle events.
5. Generate/store API keys automatically after successful payment.
6. Add admin visibility for key owner, plan, usage, and subscription status.
7. Decide whether `ugc.submit_creator_request` should consume quota or stay included.

## Safety Policy

- A2A search returns suggestions only, not bulk private contact data.
- Direct creator outreach must stay opt-in and controlled.
- Brand email/name are required before contact details are sent.
- Agents should not be allowed to mass-message creators without explicit consent and auditability.

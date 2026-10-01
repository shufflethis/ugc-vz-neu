import { createHash, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { getDatabase } from './database';
import { callbackUrl, encryptSecret, signingKey, verifyCallback } from './mcp-event-webhook';

export const CREATOR_EVENT = 'creator.verified';
export const eventFilters = z.object({
  city: z.string().trim().min(1).max(100).optional(),
  topics: z.array(z.string().trim().min(1).max(100)).min(1).max(10).optional(),
}).strict();
export const eventDefinition = {
  name: CREATOR_EVENT,
  description: 'A newly eligible public UGC creator: active profile, confirmed email, and at least one social and portfolio link. This is not an identity check. City is a case-insensitive substring; topics match any supplied substring. Existing profiles are not replayed.',
  delivery: ['webhook'],
  inputSchema: z.toJSONSchema(eventFilters),
  payloadSchema: {
    type: 'object', properties: {
      creator_public_id: { type: 'string' }, display_name: { type: 'string' },
      city: { type: 'string' }, topics: { type: 'string' },
      human_verification_level: { type: 'integer', const: 1 }, url: { type: 'string' },
    }, required: ['creator_public_id', 'display_name', 'city', 'topics', 'human_verification_level', 'url'], additionalProperties: false,
  },
};
export function configuredTokenHashes() {
  return (process.env.MCP_EVENTS_TOKEN_HASHES || '').split(',').map(value => value.trim()).filter(value => /^[a-f0-9]{64}$/.test(value));
}
export function eventsEnabled() {
  return configuredTokenHashes().length > 0 && /^[a-f0-9]{64}$/i.test(process.env.MCP_EVENTS_ENCRYPTION_KEY || '') && Boolean(process.env.DATABASE_URL);
}
export function eventOwner(request: Request): string | null {
  const token = request.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1];
  if (!token) return null;
  const hash = createHash('sha256').update(token).digest('hex');
  return configuredTokenHashes().some(value => timingSafeEqual(Buffer.from(value), Buffer.from(hash))) ? hash : null;
}
export function canonicalFilters(input: z.infer<typeof eventFilters>) {
  return JSON.stringify({ ...(input.city ? { city: input.city.toLowerCase() } : {}),
    ...(input.topics ? { topics: Array.from(new Set(input.topics.map(topic => topic.toLowerCase()))).sort() } : {}) });
}
export function subscriptionId(owner: string, url: string, filters: string) {
  return `sub_${createHash('sha256').update(JSON.stringify([owner, url, CREATOR_EVENT, filters])).digest('hex')}`;
}
const deliverySchema = z.object({ mode: z.literal('webhook'), url: z.string().max(2048), secret: z.string().optional() }).strict();
const subscriptionSchema = z.object({
  name: z.literal(CREATOR_EVENT), arguments: eventFilters, delivery: deliverySchema,
  cursor: z.null().optional(), ttlMs: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable().optional(),
  _meta: z.record(z.string(), z.unknown()).optional(),
}).strict();

export async function handleEventRequest(request: Request): Promise<Response | null> {
  if (request.method !== 'POST') return null;
  let body: any;
  try { body = await request.clone().json(); } catch { return null; }
  if (!['events/list', 'events/subscribe', 'events/unsubscribe'].includes(body?.method)) return null;
  const reply = (result: unknown, status = 200) => Response.json({ jsonrpc: '2.0', id: body.id ?? null, result }, { status });
  const error = (code: number, message: string, status = 200, data?: unknown) => Response.json({ jsonrpc: '2.0', id: body.id ?? null, error: { code, message, ...(data ? { data } : {}) } }, { status });
  if (body.jsonrpc !== '2.0' || (typeof body.id !== 'string' && typeof body.id !== 'number')) return error(-32600, 'Invalid request');
  if (!eventsEnabled()) return error(-32601, 'MCP Events are not configured');
  const owner = eventOwner(request);
  if (!owner) return error(-32001, 'A provisioned account bearer token is required', 401);
  if (body.method === 'events/list') return reply({ events: [eventDefinition] });
  try {
    const params = subscriptionSchema.parse(body.params);
    const url = callbackUrl(params.delivery.url).toString();
    const args = canonicalFilters(params.arguments);
    const id = subscriptionId(owner, url, args);
    const sql = getDatabase();
    if (body.method === 'events/unsubscribe') {
      await sql.query(`WITH stopped AS (
        UPDATE mcp_event_subscriptions SET active = false WHERE id = $1 AND owner_hash = $2 RETURNING id
      ) UPDATE mcp_event_deliveries SET finished_at = now()
        WHERE subscription_id IN (SELECT id FROM stopped) AND finished_at IS NULL`, [id, owner]);
      return reply({});
    }
    const secret = params.delivery.secret;
    if (!secret) return error(-32602, 'Signing secret is required');
    signingKey(secret);
    const encrypted = encryptSecret(secret);
    try { await verifyCallback(url, id, secret); }
    catch (failure) { return error(-32015, 'Callback verification failed', 200, { reason: failure instanceof Error && failure.message === 'challenge_failed' ? 'challenge_failed' : 'connection_failed' }); }
    // Recheck access after the outbound verification and before persisting.
    if (!eventOwner(request)) return error(-32001, 'Access revoked', 401);
    const lifetime = Math.min(params.ttlMs ?? 7 * 86400000, 7 * 86400000);
    const expires = new Date(Date.now() + lifetime).toISOString();
    await sql.query(`INSERT INTO mcp_event_subscriptions(id, owner_hash, event_name, arguments, callback_url, secret_encrypted, expires_at)
      VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7)
      ON CONFLICT(id) DO UPDATE SET
        previous_secret_encrypted = mcp_event_subscriptions.secret_encrypted,
        rotate_until = now() + interval '5 minutes',
        secret_encrypted = EXCLUDED.secret_encrypted, expires_at = EXCLUDED.expires_at, active = true`,
      [id, owner, CREATOR_EVENT, args, url, encrypted, expires]);
    return reply({ id, refreshBefore: expires, cursor: null, truncated: false });
  } catch (failure) {
    if (failure instanceof z.ZodError || (failure instanceof Error && /Invalid (callback URL|signing secret)/.test(failure.message))) return error(-32602, 'Invalid event arguments or delivery');
    console.error('[mcp:events] Subscription operation failed');
    return error(-32603, 'Event subscription could not be stored');
  }
}

export async function advertiseEvents(request: Request, response: Response) {
  if (!eventsEnabled() || request.method !== 'POST' || !(response.headers.get('content-type') || '').includes('application/json')) return response;
  let body: any;
  try { body = await request.clone().json(); } catch { return response; }
  if (body.method !== 'server/discover') return response;
  const result = await response.clone().json();
  if (result.result?.capabilities) {
    result.result.capabilities.events = {};
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    return new Response(JSON.stringify(result), { status: response.status, headers });
  }
  return response;
}

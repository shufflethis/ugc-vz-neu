import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { callbackUrl, decryptSecret, encryptSecret, isPublicAddress, signingKey, signWebhook } from '../app/lib/mcp-event-webhook';
import { advertiseEvents, canonicalFilters, eventFilters, eventOwner, handleEventRequest, subscriptionId } from '../app/lib/mcp-events';

test('Standard Webhooks signs exact UTF-8 body bytes', () => {
  const key = Buffer.alloc(32, 7);
  const secret = `whsec_${key.toString('base64')}`;
  const body = '{"text":"Grüße"}';
  assert.equal(signWebhook('evt_1', 123, body, secret), `v1,${createHmac('sha256', key).update(`evt_1.123.${body}`).digest('base64')}`);
  assert.notEqual(signWebhook('evt_1', 124, body, secret), signWebhook('evt_1', 123, body, secret));
  for (const value of ['bad', 'whsec_YQ==', `whsec_${Buffer.alloc(65).toString('base64')}`]) assert.throws(() => signingKey(value));
});

test('callback validation blocks local, private, reserved and IPv6 destinations', () => {
  for (const address of ['127.0.0.1','10.0.0.1','172.16.0.1','192.168.0.1','169.254.169.254','100.64.0.1','198.18.0.1','192.0.2.1','198.51.100.1','203.0.113.1','224.0.0.1','::1','::ffff:127.0.0.1','2001:db8::1']) assert.equal(isPublicAddress(address), false, address);
  assert.equal(isPublicAddress('8.8.8.8'), true);
  for (const url of ['http://example.com','https://user:password@example.com','https://example.com:8443','https://example.com/#secret']) assert.throws(() => callbackUrl(url));
  assert.equal(callbackUrl('https://example.com/callback').hostname, 'example.com');
});

test('secrets are encrypted and authenticated', () => {
  process.env.MCP_EVENTS_ENCRYPTION_KEY = 'ab'.repeat(32);
  const value = encryptSecret('whsec_private');
  assert.equal(decryptSecret(value), 'whsec_private');
  const tampered = Buffer.from(value, 'base64'); tampered[20] ^= 1;
  assert.throws(() => decryptSecret(tampered.toString('base64')));
  assert.notEqual(value, encryptSecret('whsec_private'));
});

test('filters have stable semantic identity and reject unknown inputs', () => {
  const a = canonicalFilters(eventFilters.parse({ city: ' Berlin ', topics: ['Beauty','FOOD','beauty'] }));
  const b = canonicalFilters(eventFilters.parse({ topics: ['food','beauty'], city: 'berlin' }));
  assert.equal(a, b);
  assert.equal(subscriptionId('accountA','https://example.com/',a), subscriptionId('accountA','https://example.com/',b));
  assert.notEqual(subscriptionId('accountA','https://example.com/',a), subscriptionId('accountB','https://example.com/',a));
  assert.equal(eventFilters.safeParse({ city: '' }).success, false);
  assert.equal(eventFilters.safeParse({ email: 'private' }).success, false);
});

test('events require provisioned account access, support discovery, and honor revocation', async () => {
  const token = 'test-account-token';
  process.env.MCP_EVENTS_TOKEN_HASHES = createHash('sha256').update(token).digest('hex');
  process.env.MCP_EVENTS_ENCRYPTION_KEY = 'ab'.repeat(32);
  process.env.DATABASE_URL = 'postgresql://unused-in-this-test';
  const request = (method: string, auth?: string, params?: unknown) => new Request('https://ugc-vz.de/api/mcp', {
    method: 'POST', headers: { 'content-type':'application/json', ...(auth ? { authorization:`Bearer ${auth}` } : {}) },
    body: JSON.stringify({ jsonrpc:'2.0',id:1,method,params }),
  });
  assert.equal((await handleEventRequest(request('events/list')))?.status, 401);
  assert.equal((await handleEventRequest(request('events/list', 'incorrect')))?.status, 401);
  const listing = await (await handleEventRequest(request('events/list', token)))!.json();
  assert.equal(listing.result.events[0].name, 'creator.verified');
  assert.equal(listing.result.events[0].payloadSchema.additionalProperties, false);
  const invalid = await (await handleEventRequest(request('events/subscribe', token, { name:'creator.verified',arguments:{private:true} })))!.json();
  assert.equal(invalid.error.code, -32602);
  const discovery = await advertiseEvents(request('server/discover'), Response.json({ jsonrpc:'2.0',id:1,result:{capabilities:{tools:{}}} }));
  assert.deepEqual((await discovery.json()).result.capabilities.events, {});
  assert.ok(eventOwner(request('events/list',token)));
  process.env.MCP_EVENTS_TOKEN_HASHES = '';
  assert.equal(eventOwner(request('events/list',token)), null);
  assert.equal(await handleEventRequest(request('tools/list')), null);
});

test('real MCP route advertises events after the SDK consumes the discovery body', async () => {
  process.env.MCP_EVENTS_TOKEN_HASHES = 'ab'.repeat(32);
  process.env.MCP_EVENTS_ENCRYPTION_KEY = 'cd'.repeat(32);
  process.env.DATABASE_URL = 'postgresql://unused-in-this-test';
  const { POST } = await import('../app/api/mcp/route');
  const response = await POST(new Request('https://ugc-vz.de/api/mcp', {
    method: 'POST', headers: {
      'content-type': 'application/json', accept: 'application/json, text/event-stream',
      'MCP-Protocol-Version': '2026-07-28', 'Mcp-Method': 'server/discover', 'Mcp-Name': '-',
    }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'server/discover', params: {
      _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28', 'io.modelcontextprotocol/clientCapabilities': {} },
    } }),
  }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.result.capabilities.events, {});
  assert.ok(body.result.capabilities.tools);
});

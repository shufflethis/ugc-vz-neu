import { createHmac, randomBytes, timingSafeEqual, createCipheriv, createDecipheriv } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import https from 'node:https';
import { isIP } from 'node:net';

export function signingKey(secret: string): Buffer {
  if (!/^whsec_[A-Za-z0-9+/]+={0,2}$/.test(secret)) throw new Error('Invalid signing secret');
  const key = Buffer.from(secret.slice(6), 'base64');
  if (key.length < 24 || key.length > 64 || key.toString('base64') !== secret.slice(6)) throw new Error('Invalid signing secret');
  return key;
}

export function signWebhook(id: string, timestamp: number, body: string, secret: string) {
  return `v1,${createHmac('sha256', signingKey(secret)).update(`${id}.${timestamp}.${body}`).digest('base64')}`;
}

// Conservative public-address allowlist. IPv6 callbacks are intentionally refused
// until the complete special-purpose IPv6 ranges can be supported safely.
export function isPublicAddress(address: string): boolean {
  if (isIP(address) !== 4) return false;
  const [a, b, c] = address.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) ||
    (a === 192 && b === 2) || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113));
}

export function callbackUrl(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('Invalid callback URL'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || (url.port && url.port !== '443')) throw new Error('Invalid callback URL');
  return url;
}

export async function postSigned(urlValue: string, subscriptionId: string, id: string, body: string, secrets: string[]) {
  if (Buffer.byteLength(body) > 262144) throw new Error('Payload exceeds 256 KiB');
  const url = callbackUrl(urlValue);
  const addresses = await lookup(url.hostname, { all: true, family: 4 });
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) throw new Error('Callback address blocked');
  const pinned = addresses[0];
  const timestamp = Math.floor(Date.now() / 1000);
  return await new Promise<{ status: number; body: string }>((resolve, reject) => {
    const request = https.request(url, {
      method: 'POST', agent: false,
      lookup: (_hostname, _options, done) => done(null, pinned.address, 4),
      headers: {
        'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body),
        'webhook-id': id, 'webhook-timestamp': String(timestamp),
        'webhook-signature': secrets.map(secret => signWebhook(id, timestamp, body, secret)).join(' '),
        'X-MCP-Subscription-Id': subscriptionId,
      },
    }, response => {
      let output = '';
      response.on('data', chunk => {
        output += chunk.toString();
        if (Buffer.byteLength(output) > 16384) response.destroy(new Error('Callback response too large'));
      });
      response.on('error', reject);
      response.on('end', () => resolve({ status: response.statusCode || 500, body: output }));
    });
    const timer = setTimeout(() => request.destroy(new Error('Callback timeout')), 10000);
    request.on('close', () => clearTimeout(timer));
    request.on('error', reject);
    request.end(body);
  });
}

export async function verifyCallback(url: string, subscriptionId: string, secret: string) {
  const challenge = randomBytes(32).toString('hex');
  const result = await postSigned(url, subscriptionId, `msg_verification_${randomBytes(16).toString('hex')}`,
    JSON.stringify({ type: 'verification', challenge }), [secret]);
  let echoed: unknown;
  try { echoed = JSON.parse(result.body).challenge; } catch { throw new Error('challenge_failed'); }
  if (result.status < 200 || result.status >= 300 || typeof echoed !== 'string' ||
    Buffer.byteLength(echoed) !== Buffer.byteLength(challenge) || !timingSafeEqual(Buffer.from(echoed), Buffer.from(challenge))) throw new Error('challenge_failed');
}

function encryptionKey() {
  const value = process.env.MCP_EVENTS_ENCRYPTION_KEY || '';
  if (!/^[a-f0-9]{64}$/i.test(value)) throw new Error('MCP_EVENTS_ENCRYPTION_KEY must be 32 bytes in hex');
  return Buffer.from(value, 'hex');
}
export function encryptSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
}
export function decryptSecret(value: string) {
  const data = Buffer.from(value, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString('utf8');
}

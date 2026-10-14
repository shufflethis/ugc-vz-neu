import crypto from 'node:crypto';
import { z } from 'zod';
export const enabled = () => process.env.COLLABORATIONS_ENABLED === 'true';
export const sha256 = (value:string) => crypto.createHash('sha256').update(value).digest('hex');
export const newToken = () => crypto.randomBytes(32).toString('base64url');
export const validToken = (value:unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
export const baseUrl = () => new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://ugc-vz.de').origin;
export function trustedMutation(request:Request) {
  const origin = request.headers.get('origin');
  if (!origin || request.headers.get('sec-fetch-site') === 'cross-site') return false;
  const allowed = new Set([baseUrl()]);
  if (process.env.NODE_ENV !== 'production') allowed.add(new URL(request.url).origin);
  return allowed.has(origin) && request.headers.get('content-type')?.startsWith('application/json') === true;
}
function encryptionKey() {
  const value = process.env.COLLAB_TOKEN_SECRET;
  if (!value || !/^[a-f0-9]{64}$/.test(value)) throw new Error('Collaboration encryption is not configured');
  return Buffer.from(value,'hex');
}
export function encryptToken(token:string) {
  const iv=crypto.randomBytes(12); const cipher=crypto.createCipheriv('aes-256-gcm',encryptionKey(),iv);
  const data=Buffer.concat([cipher.update(token,'utf8'),cipher.final()]);
  return Buffer.concat([iv,cipher.getAuthTag(),data]).toString('base64url');
}
export function decryptToken(value:string) {
  const b=Buffer.from(value,'base64url'); const cipher=crypto.createDecipheriv('aes-256-gcm',encryptionKey(),b.subarray(0,12));
  cipher.setAuthTag(b.subarray(12,28)); return Buffer.concat([cipher.update(b.subarray(28)),cipher.final()]).toString('utf8');
}
const line = (max:number) => z.string().trim().max(max).refine(s=>!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s));
const httpsUrl = z.url().refine(s=>new URL(s).protocol === 'https:','Bitte einen HTTPS-Link verwenden.');
export const campaignSchema = z.object({
  slug:z.string().regex(/^[a-z0-9][a-z0-9-]{1,59}$/), version:z.number().int().nonnegative(),
  state:z.enum(['draft','live','paused']), approvalNote:line(2000),
  content:z.object({brand:line(80).min(2),title:line(180).min(5),summary:line(1500).min(20),benefit:line(2000).min(20),task:line(3000).min(20),requirements:line(2000).min(10),reward:line(200).min(3),terms:line(6000).min(30),guideUrl:httpsUrl,contactName:line(100).min(2),contactEmail:z.email().max(254)}),
}).refine(c=>c.state!=='live'||c.approvalNote.length>=10,'Bitte bestätigte Konditionen und Kundenfreigabe dokumentieren.');
export const detailsSchema = z.object({name:line(120),language:line(80),availability:line(160),socialUrl:z.union([z.literal(''),httpsUrl]),discord:line(120)});

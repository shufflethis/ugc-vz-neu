import { randomUUID, timingSafeEqual } from 'node:crypto';

const globalToken = globalThis as typeof globalThis & {
  __ugcvzInternalSearchToken?: string;
};

export function getInternalSearchToken(): string {
  const configured = process.env.SUBMIT_REQUEST_API_KEY;
  if (configured) return configured;
  if (!globalToken.__ugcvzInternalSearchToken) {
    globalToken.__ugcvzInternalSearchToken = randomUUID();
  }
  return globalToken.__ugcvzInternalSearchToken;
}

export function isValidInternalSearchToken(supplied: string | null): boolean {
  if (!supplied) return false;
  const expected = getInternalSearchToken();
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

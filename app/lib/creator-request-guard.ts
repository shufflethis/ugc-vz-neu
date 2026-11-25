import { NextRequest } from 'next/server';

const globalLimiter = globalThis as typeof globalThis & {
  __ugcCreatorAiRateLimit?: Map<string, number[]>;
};

const buckets =
  globalLimiter.__ugcCreatorAiRateLimit ??
  (globalLimiter.__ugcCreatorAiRateLimit = new Map<string, number[]>());

export function isTrustedCreatorRequest(request: NextRequest): boolean {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const parsedOrigin = new URL(origin).origin;
    const allowed = new Set([
      request.nextUrl.origin,
      'https://ugc-vz.de',
      'https://www.ugc-vz.de',
      ...(process.env.NEXT_PUBLIC_BASE_URL ? [new URL(process.env.NEXT_PUBLIC_BASE_URL).origin] : []),
    ]);
    return allowed.has(parsedOrigin);
  } catch {
    return false;
  }
}

export function consumeCreatorAiRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const recent = (buckets.get(key) || []).filter((ts) => now - ts < windowMs);
  if (recent.length >= limit) {
    const oldest = recent[0] ?? now;
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }
  recent.push(now);
  buckets.set(key, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}

// Gemeinsame Bausteine der oeffentlichen REST-API /api/v1 (OpenAPI:
// /openapi.json). Die Endpunkte sind duenne HTTP-Wrapper ueber das
// Agent-Gateway (app/lib/agent-gateway.ts) - dieselben Funktionen, die auch
// MCP (/api/mcp) und A2A (/a2a) bedienen. Kein API-Key noetig; Missbrauch
// begrenzt dasselbe Rate-Limit wie beim MCP-Endpunkt.
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { MCP_TOOLS } from '@/app/lib/agent-tools';
import { checkRateLimit, getRateLimitKey } from '@/app/lib/web-bot-auth';
import { problemResponse } from '@/app/lib/api-problem';

export const FALLBACK_ORIGIN = 'https://ugc-vz.de';

export const requestOrigin = (request: NextRequest): string => {
  try {
    return new URL(request.url).origin || FALLBACK_ORIGIN;
  } catch {
    return FALLBACK_ORIGIN;
  }
};

/** zod-Inputschema eines MCP-Tools wiederverwenden - eine Quelle der Wahrheit. */
export const toolSchema = (name: string) => {
  const tool = MCP_TOOLS.find((entry) => entry.name === name);
  if (!tool) throw new Error(`Unbekanntes Tool-Schema: ${name}`);
  return tool.inputSchema;
};

/** IP-basiertes Rate-Limit (unsigned-Tier, wie /api/mcp fuer anonyme Clients). */
export const restRateLimit = (request: NextRequest, cost: number): Response | null => {
  const key = getRateLimitKey({ verdict: 'unsigned' }, request);
  const verdictCheck = checkRateLimit(key, 'unsigned', cost);
  if (verdictCheck.allowed) return null;
  return problemResponse({
    status: 429,
    title: 'Rate limit exceeded',
    detail: `Zu viele Anfragen. Bitte in ${verdictCheck.retryAfterSeconds ?? 60} Sekunden erneut versuchen.`,
    code: 'rate_limited',
    resolution: 'Web-Bot-Auth-signierte Agenten erhalten ein hoeheres Limit, siehe https://ugc-vz.de/developers.',
  });
};

export const zodProblem = (error: z.ZodError) =>
  problemResponse({
    status: 400,
    title: 'Invalid request',
    detail: error.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`).join('; ').slice(0, 500),
    code: 'validation_failed',
    resolution: 'Request-Schema unter https://ugc-vz.de/openapi.json pruefen.',
  });

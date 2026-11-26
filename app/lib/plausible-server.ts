const PLAUSIBLE_EVENT_ENDPOINT =
  process.env.PLAUSIBLE_API_URL?.trim() || 'https://analytics.polymarkt.de/api/event';
const PLAUSIBLE_DOMAIN = process.env.PLAUSIBLE_DOMAIN?.trim() || 'ugc-vz.de';
const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://ugc-vz.de').replace(/\/$/, '');

export interface PlausibleServerEventInput {
  name: string;
  path?: string;
  props?: Record<string, string | number | boolean>;
  revenue?: { currency: 'EUR'; amount: number };
  userAgent?: string | null;
  clientIp?: string | null;
}

/**
 * Serverseitiges Plausible Event Tracking (Official Events API v1) fuer:
 * - Stripe-Webhook Revenue Attribution (wallet_topup_paid)
 * - Affiliate-Kurzlinks (/r/[code] -> affiliate_link_click)
 * - Authentifizierte Portal-Events ohne Client-JS-Abhaengigkeit (clip_submitted, clip_approved, portal_message_sent)
 *
 * Nur aktiv in Produktion (VERCEL=1) oder wenn PLAUSIBLE_SERVER_ENABLED=true,
 * damit lokale Tests/Dev niemals Live-Analytics verschmutzen.
 * Best-effort mit kurzem Timeout, blockiert niemals die API-Antwort.
 */
export async function sendPlausibleServerEvent(input: PlausibleServerEventInput): Promise<boolean> {
  const enabled =
    process.env.PLAUSIBLE_SERVER_ENABLED === 'true'
    || (process.env.VERCEL === '1' && process.env.PLAUSIBLE_SERVER_ENABLED !== 'false');
  if (!enabled) return false;

  const cleanPath = input.path && input.path.startsWith('/') ? input.path : '/';
  const payload: Record<string, unknown> = {
    name: input.name,
    url: `${BASE_URL}${cleanPath}`,
    domain: PLAUSIBLE_DOMAIN,
  };
  if (input.props && Object.keys(input.props).length > 0) {
    payload.props = input.props;
  }
  if (input.revenue && Number.isFinite(input.revenue.amount) && input.revenue.amount > 0) {
    payload.revenue = {
      currency: input.revenue.currency,
      amount: Math.round(input.revenue.amount * 100) / 100,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(PLAUSIBLE_EVENT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': (input.userAgent || 'Mozilla/5.0 (compatible; UGCVZ-Server/1.0)').slice(0, 240),
        'X-Forwarded-For': (input.clientIp || '127.0.0.1').split(',')[0].trim().slice(0, 64),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

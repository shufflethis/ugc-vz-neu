import crypto from 'node:crypto';
import { IncomingWebhook } from '@slack/webhook';
import { Resend } from 'resend';

export const AUTH_RESEND_COOLDOWN_MS = 60 * 1000;
export const AUTH_HOURLY_WINDOW_MS = 60 * 60 * 1000;
export const AUTH_EMAIL_HOURLY_LIMIT = 8;
export const AUTH_IP_HOURLY_LIMIT = 20;
export const AUTH_ALERT_WINDOW_MS = 5 * 60 * 1000;
export const AUTH_ALERT_THRESHOLD = 3; // Alert when strictly more than 3 5xx errors occur within 5 minutes

export const AUTH_ERROR_RATE_LIMIT =
  'Du hast gerade mehrere Codes angefordert. Warte bitte 60 Sekunden, dann kannst du einen neuen anfordern.';
export const AUTH_ERROR_PROVIDER_UNAVAILABLE =
  'Gerade klappt der Versand bei uns nicht. Versuch es in ein paar Minuten noch mal oder schreib uns an hi@ugc-vz.de.';

export type AuthFlow = 'creator' | 'brand' | 'brand_campaign';

export interface AuthEmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  tags: Array<{ name: string; value: string }>;
}

export interface ProviderSendResult {
  id?: string | null;
  error?: {
    name?: string;
    message?: string;
    statusCode?: number | null;
  } | null;
}

export type AuthEmailSender = (params: {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
  tags: Array<{ name: string; value: string }>;
}) => Promise<ProviderSendResult>;

export type AuthAlertNotifier = (payload: {
  flow: AuthFlow;
  errorCountInWindow: number;
  windowMinutes: number;
  lastErrorCode: string;
  occurredAt: string;
}) => Promise<void>;

export interface AuthDeliveryResult {
  ok: boolean;
  status: number;
  errorCode: string | null;
  providerStatus: number | null;
  userMessage?: string;
  retryAfterSec?: number;
  attempts: number;
}

const hourlyBuckets = new Map<string, number[]>();
const cooldownMap = new Map<string, number>();
let recentFiveXxTimestamps: number[] = [];
let lastAlertSentAt = 0;

let testSenderOverride: AuthEmailSender | null = null;
let testAlertOverride: AuthAlertNotifier | null = null;
let testSleepOverride: ((ms: number) => Promise<void>) | null = null;

export function setAuthDeliveryOverridesForTests(overrides: {
  sender?: AuthEmailSender | null;
  alertNotifier?: AuthAlertNotifier | null;
  sleep?: ((ms: number) => Promise<void>) | null;
}) {
  if ('sender' in overrides) testSenderOverride = overrides.sender ?? null;
  if ('alertNotifier' in overrides) testAlertOverride = overrides.alertNotifier ?? null;
  if ('sleep' in overrides) testSleepOverride = overrides.sleep ?? null;
}

export function resetAuthDeliveryStateForTests() {
  hourlyBuckets.clear();
  cooldownMap.clear();
  recentFiveXxTimestamps = [];
  lastAlertSentAt = 0;
  testSenderOverride = null;
  testAlertOverride = null;
  testSleepOverride = null;
}

export function hashAuthKey(value: string): string {
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex').slice(0, 20);
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown'
  );
}

export function checkAuthRateLimit(input: {
  flow: AuthFlow;
  email: string;
  ip: string;
  now?: number;
}): { allowed: true } | { allowed: false; retryAfterSec: number; reason: 'cooldown' | 'hourly_email' | 'hourly_ip'; error: string } {
  const now = input.now ?? Date.now();
  const emailHash = hashAuthKey(`${input.flow}:email:${input.email}`);
  const ipHash = hashAuthKey(`${input.flow}:ip:${input.ip}`);

  // 1. 60-second resend cooldown per email
  const lastSent = cooldownMap.get(emailHash);
  if (lastSent && now - lastSent < AUTH_RESEND_COOLDOWN_MS) {
    const retryAfterSec = Math.max(1, Math.ceil((AUTH_RESEND_COOLDOWN_MS - (now - lastSent)) / 1000));
    return {
      allowed: false,
      retryAfterSec,
      reason: 'cooldown',
      error: AUTH_ERROR_RATE_LIMIT,
    };
  }

  // 2. Hourly email cap
  const emailTimestamps = (hourlyBuckets.get(emailHash) || []).filter((ts) => now - ts < AUTH_HOURLY_WINDOW_MS);
  if (emailTimestamps.length >= AUTH_EMAIL_HOURLY_LIMIT) {
    const oldest = emailTimestamps[0] ?? now;
    const retryAfterSec = Math.max(60, Math.ceil((AUTH_HOURLY_WINDOW_MS - (now - oldest)) / 1000));
    return {
      allowed: false,
      retryAfterSec,
      reason: 'hourly_email',
      error: AUTH_ERROR_RATE_LIMIT,
    };
  }

  // 3. Hourly IP cap
  const ipTimestamps = (hourlyBuckets.get(ipHash) || []).filter((ts) => now - ts < AUTH_HOURLY_WINDOW_MS);
  if (ipTimestamps.length >= AUTH_IP_HOURLY_LIMIT) {
    const oldest = ipTimestamps[0] ?? now;
    const retryAfterSec = Math.max(60, Math.ceil((AUTH_HOURLY_WINDOW_MS - (now - oldest)) / 1000));
    return {
      allowed: false,
      retryAfterSec,
      reason: 'hourly_ip',
      error: AUTH_ERROR_RATE_LIMIT,
    };
  }

  cooldownMap.set(emailHash, now);
  emailTimestamps.push(now);
  ipTimestamps.push(now);
  hourlyBuckets.set(emailHash, emailTimestamps);
  hourlyBuckets.set(ipHash, ipTimestamps);

  return { allowed: true };
}

export function logAuthEvent(event: {
  flow: AuthFlow;
  email: string;
  mode?: 'login' | 'signup';
  profileFound: boolean;
  profileStatus?: string | null;
  emailSent: boolean;
  providerStatus?: number | null;
  errorCode?: string | null;
}) {
  // Never log raw email addresses or PII.
  const payload = {
    tag: 'AUTH_LOGIN_AUDIT',
    flow: event.flow,
    mode: event.mode ?? null,
    emailHash: hashAuthKey(event.email),
    profileFound: event.profileFound,
    profileStatus: event.profileStatus ?? null,
    emailSent: event.emailSent,
    providerStatus: event.providerStatus ?? null,
    errorCode: event.errorCode ?? null,
    ts: new Date().toISOString(),
  };
  if (event.errorCode) {
    console.warn(JSON.stringify(payload));
  } else {
    console.info(JSON.stringify(payload));
  }
}

async function defaultAlertNotifier(payload: {
  flow: AuthFlow;
  errorCountInWindow: number;
  windowMinutes: number;
  lastErrorCode: string;
  occurredAt: string;
}) {
  console.error(
    '[AUTH_ALERT_5XX]',
    JSON.stringify({
      ...payload,
      message: `Auth mail delivery exceeded ${AUTH_ALERT_THRESHOLD} server errors in ${payload.windowMinutes} minutes.`,
    }),
  );

  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackUrl) return;
  try {
    const webhook = new IncomingWebhook(slackUrl);
    await webhook.send({
      text: `🚨 UGC VZ Auth Alert (${payload.flow}): ${payload.errorCountInWindow} Versandfehler (5xx) in ${payload.windowMinutes} Min. Letzter Code: ${payload.lastErrorCode}`,
    });
  } catch (err) {
    console.error('[AUTH_ALERT_5XX_SLACK_FAILED]', err instanceof Error ? err.message : 'unknown');
  }
}

async function recordFiveXxFailure(flow: AuthFlow, errorCode: string, now = Date.now()) {
  recentFiveXxTimestamps = recentFiveXxTimestamps.filter((ts) => now - ts < AUTH_ALERT_WINDOW_MS);
  recentFiveXxTimestamps.push(now);

  if (recentFiveXxTimestamps.length > AUTH_ALERT_THRESHOLD && now - lastAlertSentAt >= AUTH_ALERT_WINDOW_MS) {
    lastAlertSentAt = now;
    const notifier = testAlertOverride || defaultAlertNotifier;
    try {
      await notifier({
        flow,
        errorCountInWindow: recentFiveXxTimestamps.length,
        windowMinutes: Math.round(AUTH_ALERT_WINDOW_MS / 60_000),
        lastErrorCode: errorCode,
        occurredAt: new Date(now).toISOString(),
      });
    } catch {
      // Monitoring must never crash auth responses.
    }
  }
}

function classifyProviderError(error: { name?: string; message?: string; statusCode?: number | null } | unknown): {
  kind: 'rate_limit' | 'transient_5xx' | 'client_4xx';
  providerStatus: number | null;
  errorCode: string;
} {
  if (error && typeof error === 'object') {
    const rec = error as { name?: unknown; message?: unknown; statusCode?: unknown };
    const name = typeof rec.name === 'string' ? rec.name : 'unknown_error';
    const message = typeof rec.message === 'string' ? rec.message.toLowerCase() : '';
    const statusCode = typeof rec.statusCode === 'number' ? rec.statusCode : null;

    if (
      statusCode === 429 ||
      name === 'rate_limit_exceeded' ||
      name === 'daily_quota_exceeded' ||
      name === 'monthly_quota_exceeded' ||
      message.includes('rate limit') ||
      message.includes('too many requests')
    ) {
      return { kind: 'rate_limit', providerStatus: 429, errorCode: name };
    }

    if (
      statusCode !== null &&
      statusCode >= 400 &&
      statusCode < 500 &&
      statusCode !== 408 &&
      statusCode !== 429
    ) {
      return { kind: 'client_4xx', providerStatus: statusCode, errorCode: name };
    }

    return {
      kind: 'transient_5xx',
      providerStatus: statusCode ?? 503,
      errorCode: name,
    };
  }

  return { kind: 'transient_5xx', providerStatus: 503, errorCode: 'network_error' };
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function sendTransactionalAuthEmail(input: {
  flow: AuthFlow;
  message: AuthEmailMessage;
}): Promise<AuthDeliveryResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey && !testSenderOverride) {
    await recordFiveXxFailure(input.flow, 'resend_not_configured');
    return {
      ok: false,
      status: 503,
      errorCode: 'resend_not_configured',
      providerStatus: null,
      userMessage: AUTH_ERROR_PROVIDER_UNAVAILABLE,
      attempts: 0,
    };
  }

  const sender: AuthEmailSender =
    testSenderOverride ||
    (async (params) => {
      const resend = new Resend(resendApiKey!);
      const res = await resend.emails.send(params);
      return {
        id: res.data?.id ?? null,
        error: res.error
          ? {
              name: res.error.name,
              message: res.error.message,
              statusCode: (res.error as { statusCode?: number | null }).statusCode ?? null,
            }
          : null,
      };
    });

  const sleep = testSleepOverride || defaultSleep;
  const from = process.env.RESEND_FROM || 'UGC VZ <hi@ugc-vz.de>';
  const replyTo = process.env.UGC_INTERNAL_EMAIL || 'hi@ugc-vz.de';

  const maxAttempts = 2;
  let lastClassification: ReturnType<typeof classifyProviderError> = {
    kind: 'transient_5xx',
    providerStatus: 503,
    errorCode: 'unknown',
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await sender({
        from,
        to: input.message.to,
        replyTo,
        subject: input.message.subject,
        html: input.message.html,
        text: input.message.text,
        tags: input.message.tags,
      });

      if (!result.error) {
        return {
          ok: true,
          status: 200,
          errorCode: null,
          providerStatus: 200,
          attempts: attempt,
        };
      }

      lastClassification = classifyProviderError(result.error);
    } catch (err) {
      lastClassification = classifyProviderError(err);
    }

    if (lastClassification.kind === 'rate_limit') {
      return {
        ok: false,
        status: 429,
        errorCode: lastClassification.errorCode,
        providerStatus: 429,
        userMessage: AUTH_ERROR_RATE_LIMIT,
        retryAfterSec: 60,
        attempts: attempt,
      };
    }

    if (lastClassification.kind === 'client_4xx') {
      return {
        ok: false,
        status: 503,
        errorCode: lastClassification.errorCode,
        providerStatus: lastClassification.providerStatus,
        userMessage: AUTH_ERROR_PROVIDER_UNAVAILABLE,
        attempts: attempt,
      };
    }

    if (attempt < maxAttempts) {
      await sleep(600);
    }
  }

  await recordFiveXxFailure(input.flow, lastClassification.errorCode);
  return {
    ok: false,
    status: 503,
    errorCode: lastClassification.errorCode,
    providerStatus: lastClassification.providerStatus,
    userMessage: AUTH_ERROR_PROVIDER_UNAVAILABLE,
    attempts: maxAttempts,
  };
}

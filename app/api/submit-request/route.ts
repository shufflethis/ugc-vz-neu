import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { IncomingWebhook } from '@slack/webhook';
import { Resend } from 'resend';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import {
  type DeliveryResult,
  type LeadClientInfo,
  type LeadKind,
  type RenderedEmail,
  type SelectedCreator,
  renderBrandMatchEmail,
  renderContactAcknowledgementEmail,
  renderCreatorOutreachEmail,
  renderInternalLeadEmail,
  renderNoResultsEmail,
  isInternalRequest,
} from '@/app/lib/lead-email';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_CREATORS_PER_REQUEST = 10;
const MAX_BODY_BYTES = 30_000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

type RateLimitEntry = { count: number; resetAt: number };
type CreatorOutreachSummary = {
  enabled: boolean;
  eligible: number;
  queued: number;
  failed: number;
  skippedNoEmail: number;
  skippedDaily: number;
  skippedLimit: number;
};
type EmailDispatchResult = {
  brand: DeliveryResult;
  internal: DeliveryResult;
  creators: DeliveryResult[];
  creatorOutreach: CreatorOutreachSummary;
};

const globalRateLimit = globalThis as typeof globalThis & {
  __ugcLeadRateLimit?: Map<string, RateLimitEntry>;
  __ugcCreatorOutreachDay?: Map<string, string>;
};

const rateLimitStore = globalRateLimit.__ugcLeadRateLimit
  ?? (globalRateLimit.__ugcLeadRateLimit = new Map<string, RateLimitEntry>());
const creatorOutreachDays = globalRateLimit.__ugcCreatorOutreachDay
  ?? (globalRateLimit.__ugcCreatorOutreachDay = new Map<string, string>());

const allowedOrigins = new Set([
  'https://ugc-vz.de',
  'https://www.ugc-vz.de',
  'http://localhost:3000',
  'http://localhost:3001',
]);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const plainText = (value: unknown, maxLength = 500) =>
  String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength);

const multilineText = (value: unknown, maxLength = 1_500) =>
  String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .trim()
    .slice(0, maxLength);

const slackEscape = (value: unknown) =>
  plainText(value, 1_000)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

function isValidApiKey(supplied: string | null, expected: string | undefined) {
  if (!supplied || !expected) return false;
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  return suppliedBuffer.length === expectedBuffer.length
    && timingSafeEqual(suppliedBuffer, expectedBuffer);
}

function getOrigin(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isTrustedBrowserRequest(req: Request) {
  const originHeader = req.headers.get('origin');
  const origin = getOrigin(originHeader);
  const refererOrigin = getOrigin(req.headers.get('referer'));
  const requestOrigin = getOrigin(req.url);
  const fetchSite = req.headers.get('sec-fetch-site');
  const isAllowed = (candidate: string | null) => Boolean(
    candidate
    && (allowedOrigins.has(candidate) || candidate === requestOrigin),
  );

  if (fetchSite === 'cross-site') return false;
  if (originHeader) return isAllowed(origin);
  return isAllowed(refererOrigin);
}

function consumeRateLimit(key: string, limit: number) {
  const now = Date.now();

  if (rateLimitStore.size > 5_000) {
    for (const [storedKey, entry] of rateLimitStore.entries()) {
      if (entry.resetAt <= now) rateLimitStore.delete(storedKey);
    }
  }

  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function hashRateLimitValue(value: string) {
  return createHash('sha256').update(value).digest('hex').slice(0, 24);
}

function getClientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for');
  return plainText(forwarded?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown', 80);
}

function createLeadId(submissionId?: string) {
  const safeSubmissionId = plainText(submissionId, 100);
  const source = /^[a-zA-Z0-9_-]{8,100}$/.test(safeSubmissionId)
    ? safeSubmissionId
    : randomUUID();
  const digest = createHash('sha256').update(source).digest('hex').slice(0, 12).toUpperCase();
  return `UGC-${digest}`;
}

function normalizeRequestBody(rawBody: unknown) {
  const body = asRecord(rawBody);
  const rawClient = Object.keys(asRecord(body.clientInfo)).length
    ? asRecord(body.clientInfo)
    : body.type === 'contact'
      ? { ...body, requestType: 'general_contact' }
      : {};

  const requestType = plainText(rawClient.requestType, 40);
  const kind: LeadKind = requestType === 'no_results_found'
    ? 'no_results'
    : requestType === 'general_contact' || body.type === 'contact'
      ? 'general_contact'
      : 'creator_match';

  const clientInfo: LeadClientInfo = {
    name: plainText(rawClient.name, 100),
    email: plainText(rawClient.email, 160).toLowerCase(),
    company: plainText(rawClient.company, 120),
    subject: plainText(rawClient.subject, 160),
    message: multilineText(rawClient.message, 1_500),
    searchQuery: multilineText(rawClient.searchQuery, 500),
    noResultsQuery: multilineText(rawClient.noResultsQuery, 500),
    sourceUrl: plainText(rawClient.sourceUrl, 500),
    sourcePath: plainText(rawClient.sourcePath, 200),
    submissionId: plainText(rawClient.submissionId, 100),
    website: plainText(rawClient.website, 200),
  };

  const creatorIds = Array.isArray(body.creatorIds)
    ? [...new Set(body.creatorIds.map((id) => plainText(id, 50)).filter(Boolean))]
    : [];

  return { kind, clientInfo, creatorIds };
}

async function fetchSelectedCreators(creatorIds: string[]): Promise<SelectedCreator[]> {
  const neonIds = creatorIds.filter((id) => /^UGC-[A-F0-9]{10}$/.test(id));
  if (neonIds.length !== creatorIds.length) {
    throw new Error('Invalid creator ID format');
  }

  const creatorsById = new Map<string, SelectedCreator>();

  if (neonIds.length) {
    if (!isDatabaseConfigured()) throw new Error('Creator database is not configured');
    const sql = getDatabase();
    const placeholders = neonIds.map((_, index) => `$${index + 1}`).join(', ');
    const rows = await sql.query(`
      SELECT
        v.public_id,
        v.display_name,
        v.reach_text,
        v.rate_text,
        v.social_links,
        array_to_string(v.networks, ', ') AS network_names,
        CASE
          WHEN c.project_notifications_enabled AND c.notification_paused_at IS NULL THEN c.email
          ELSE NULL
        END AS contact_email
      FROM creator_search_public v
      LEFT JOIN creator_private_contacts c ON c.creator_id = v.id
      WHERE v.public_id IN (${placeholders})
    `, neonIds);

    for (const row of rows as any[]) {
      creatorsById.set(String(row.public_id), {
        id: String(row.public_id),
        name: plainText(row.display_name, 100) || 'UGC Creator',
        reach: multilineText(row.reach_text, 300),
        networks: plainText(row.network_names, 300),
        priceRange: multilineText(row.rate_text, 200),
        contactEmail: emailRegex.test(String(row.contact_email || '')) ? String(row.contact_email).slice(0, 160) : '',
        socialLinks: multilineText(row.social_links, 500),
      });
    }

    if (rows.length !== neonIds.length) throw new Error('One or more creator profiles are unavailable');
  }

  return creatorIds.map((id) => {
    const creator = creatorsById.get(id);
    if (!creator) throw new Error('Creator profile not found');
    return creator;
  });
}

async function persistLead({
  leadId,
  kind,
  clientInfo,
  selectedCreators,
  isInternal,
}: {
  leadId: string;
  kind: LeadKind;
  clientInfo: LeadClientInfo;
  selectedCreators: SelectedCreator[];
  isInternal: boolean;
}) {
  if (!isDatabaseConfigured()) throw new Error('Lead database is not configured');

  const sql = getDatabase();
  const [lead] = await sql.query(`
      INSERT INTO brand_leads (
        public_id, name, email, company, search_query, message, source_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'submitted')
      ON CONFLICT (public_id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        company = EXCLUDED.company,
        search_query = EXCLUDED.search_query,
        message = EXCLUDED.message,
        source_url = EXCLUDED.source_url,
        updated_at = now()
      RETURNING id
    `, [
      leadId,
      clientInfo.name,
      clientInfo.email,
      clientInfo.company || null,
      clientInfo.searchQuery || clientInfo.noResultsQuery || clientInfo.subject || kind,
      clientInfo.message || null,
      clientInfo.sourceUrl || null,
    ]);

  // is_internal stammt aus Migration 004. Läuft ein Deploy der Migration voraus,
  // degradiert das Feature hier zu einem fehlenden Marker statt zu einer
  // fehlgeschlagenen Anfrage – der Lead selbst darf dadurch nie verloren gehen.
  try {
    await sql.query(
      `UPDATE brand_leads SET is_internal = $2 WHERE id = $1`,
      [lead.id, isInternal],
    );
  } catch (error) {
    console.error(`Konnte is_internal für Lead ${lead.id} nicht setzen:`, error);
  }

  if (selectedCreators.length) {
    const matches = selectedCreators.map((creator, index) => ({
      public_id: creator.id,
      snapshot: {
        name: creator.name,
        reach: creator.reach,
        networks: creator.networks,
        priceRange: creator.priceRange,
        socialLinks: creator.socialLinks,
        hasContactEmail: Boolean(creator.contactEmail),
      },
      rank: index + 1,
    }));

    await sql.query(`
        INSERT INTO lead_creator_matches (
          lead_id, creator_id, creator_public_id, creator_snapshot, rank
        )
        SELECT $1, profile.id, match.public_id, match.snapshot, match.rank
        FROM jsonb_to_recordset($2::jsonb)
          AS match(public_id text, snapshot jsonb, rank smallint)
        LEFT JOIN creator_profiles profile ON profile.public_id = match.public_id
        ON CONFLICT (lead_id, creator_public_id) DO UPDATE SET
          creator_id = EXCLUDED.creator_id,
          creator_snapshot = EXCLUDED.creator_snapshot,
          rank = EXCLUDED.rank
      `, [lead.id, JSON.stringify(matches)]);
  }

  return String(lead.id);
}

async function persistInitialDelivery({
  databaseLeadId,
  leadId,
  clientInfo,
  delivery,
}: {
  databaseLeadId: string | null;
  leadId: string;
  clientInfo: LeadClientInfo;
  delivery: EmailDispatchResult;
}) {
  if (!databaseLeadId || !isDatabaseConfigured()) return;

  try {
    const sql = getDatabase();
    const recipientHash = createHash('sha256').update(clientInfo.email.toLowerCase()).digest('hex');
    const events = ([
      ['brand', delivery.brand, recipientHash],
      ['internal', delivery.internal, null],
    ] as const).map(([audience, result, hash]) => ({
      resend_email_id: result.id || null,
      audience,
      event_type: result.status,
      recipient_hash: hash,
      metadata: { lead_id: leadId, error: result.error || null },
    }));

    await sql.query(`
      WITH updated_lead AS (
        UPDATE brand_leads
        SET status = $2, updated_at = now()
        WHERE id = $1
        RETURNING id
      )
      INSERT INTO email_events (
        lead_id, resend_email_id, audience, event_type, recipient_hash, metadata
      )
      SELECT
        updated_lead.id,
        event.resend_email_id,
        event.audience,
        event.event_type,
        event.recipient_hash,
        event.metadata
      FROM updated_lead
      CROSS JOIN jsonb_to_recordset($3::jsonb) AS event(
        resend_email_id text,
        audience text,
        event_type text,
        recipient_hash text,
        metadata jsonb
      )
    `, [
      databaseLeadId,
      delivery.brand.status === 'queued' ? 'brand_email_queued' : 'brand_email_failed',
      JSON.stringify(events),
    ]);
  } catch (error) {
    console.error(`[${leadId}] Could not persist initial email status`, error instanceof Error ? error.message : 'unknown error');
  }
}

function emailTags(
  kind: LeadKind,
  audience: 'brand' | 'internal' | 'creator',
  leadId: string,
  creatorId?: string,
) {
  return [
    { name: 'category', value: kind },
    { name: 'audience', value: audience },
    { name: 'lead_id', value: leadId },
    ...(creatorId ? [{ name: 'creator_id', value: creatorId }] : []),
  ];
}

async function sendEmail({
  resend,
  from,
  to,
  replyTo,
  email,
  tags,
  idempotencyKey,
}: {
  resend: Resend;
  from: string;
  to: string;
  replyTo: string;
  email: RenderedEmail;
  tags: { name: string; value: string }[];
  idempotencyKey: string;
}): Promise<DeliveryResult> {
  try {
    const response = await resend.emails.send({
      from,
      to,
      replyTo,
      subject: email.subject,
      html: email.html,
      text: email.text,
      tags,
    }, { idempotencyKey });

    if (response.error) {
      return {
        status: 'failed',
        error: `${response.error.name}: ${plainText(response.error.message, 180)}`,
      };
    }

    return { status: 'queued', id: response.data.id };
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? plainText(error.message, 180) : 'Unbekannter Resend-Fehler',
    };
  }
}

async function dispatchLeadEmails({
  leadId,
  kind,
  clientInfo,
  selectedCreators,
}: {
  leadId: string;
  kind: LeadKind;
  clientInfo: LeadClientInfo;
  selectedCreators: SelectedCreator[];
}): Promise<EmailDispatchResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return {
      brand: { status: 'not_configured', error: 'RESEND_API_KEY fehlt' },
      internal: { status: 'not_configured', error: 'RESEND_API_KEY fehlt' },
      creators: [],
      creatorOutreach: {
        enabled: false,
        eligible: 0,
        queued: 0,
        failed: 0,
        skippedNoEmail: selectedCreators.length,
        skippedDaily: 0,
        skippedLimit: 0,
      },
    };
  }

  const resend = new Resend(resendApiKey);
  const from = process.env.RESEND_FROM || 'UGC VZ <hi@ugc-vz.de>';
  const internalEmail = process.env.UGC_INTERNAL_EMAIL || 'hi@ugc-vz.de';
  const brandEmail = kind === 'creator_match'
    ? renderBrandMatchEmail({ leadId, clientInfo, selectedCreators, internalEmail })
    : kind === 'no_results'
      ? renderNoResultsEmail({ leadId, clientInfo })
      : renderContactAcknowledgementEmail({ leadId, clientInfo });

  const brand = await sendEmail({
    resend,
    from,
    to: clientInfo.email,
    replyTo: internalEmail,
    email: brandEmail,
    tags: emailTags(kind, 'brand', leadId),
    idempotencyKey: `ugc-vz/brand/${leadId}`,
  });

  // Brand and internal lead reporting have priority over optional growth mails,
  // especially while the Resend free quota is shared by all recipients.
  const internal = await sendEmail({
    resend,
    from,
    to: internalEmail,
    replyTo: clientInfo.email,
    email: renderInternalLeadEmail({
      leadId,
      kind,
      clientInfo,
      selectedCreators,
      brandDelivery: brand,
    }),
    tags: emailTags(kind, 'internal', leadId),
    idempotencyKey: `ugc-vz/internal/${leadId}`,
  });

  const shouldEmailCreators = process.env.SEND_CREATOR_OUTREACH_EMAILS === 'true'
    && kind === 'creator_match';
  const configuredMax = Number.parseInt(process.env.CREATOR_OUTREACH_MAX_PER_LEAD || '8', 10);
  const maxPerLead = Number.isFinite(configuredMax)
    ? Math.max(0, Math.min(MAX_CREATORS_PER_REQUEST, configuredMax))
    : 8;
  const withEmail = selectedCreators.filter((creator) => creator.contactEmail);
  const limitedCreators = withEmail.slice(0, maxPerLead);
  const today = new Date().toISOString().slice(0, 10);

  if (creatorOutreachDays.size > 5_000) {
    for (const [creatorId, notifiedDay] of creatorOutreachDays.entries()) {
      if (notifiedDay !== today) creatorOutreachDays.delete(creatorId);
    }
  }

  const creators: DeliveryResult[] = [];
  let skippedDaily = 0;
  if (shouldEmailCreators) {
    for (const creator of limitedCreators) {
      if (creatorOutreachDays.get(creator.id) === today) {
        skippedDaily += 1;
        continue;
      }

      const result = await sendEmail({
        resend,
        from,
        to: creator.contactEmail as string,
        replyTo: clientInfo.email,
        email: renderCreatorOutreachEmail({
          leadId,
          creator,
          clientInfo,
          internalEmail,
        }),
        tags: emailTags(kind, 'creator', leadId, creator.id),
        // Resend provides the durable second layer for the one-mail-per-day
        // frequency cap when separate Vercel instances handle requests.
        idempotencyKey: `ugc-vz/creator/${creator.id}/${today}`,
      });
      creators.push(result);
      if (result.status === 'queued') creatorOutreachDays.set(creator.id, today);

      // Resend starts at five API requests/second. Keep optional outreach below
      // that rate without delaying the customer-facing message.
      await new Promise((resolve) => setTimeout(resolve, 225));
    }
  }

  const creatorOutreach: CreatorOutreachSummary = {
    enabled: shouldEmailCreators,
    eligible: limitedCreators.length,
    queued: creators.filter((result) => result.status === 'queued').length,
    failed: creators.filter((result) => result.status === 'failed').length,
    skippedNoEmail: selectedCreators.length - withEmail.length,
    skippedDaily,
    skippedLimit: Math.max(0, withEmail.length - limitedCreators.length),
  };

  return { brand, internal, creators, creatorOutreach };
}

async function sendSlackNotification({
  leadId,
  kind,
  clientInfo,
  selectedCreators,
  delivery,
}: {
  leadId: string;
  kind: LeadKind;
  clientInfo: LeadClientInfo;
  selectedCreators: SelectedCreator[];
  delivery: EmailDispatchResult;
}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return false;

  const webhook = new IncomingWebhook(webhookUrl);
  const kindLabel = kind === 'creator_match'
    ? 'Creator-Anfrage'
    : kind === 'no_results'
      ? 'Anfrage ohne Treffer'
      : 'Kontaktanfrage';
  const brandStatus = delivery.brand.status === 'queued'
    ? `✅ Brand-Mail von Resend angenommen${delivery.brand.id ? ` (${delivery.brand.id})` : ''}`
    : `❌ Brand-Mail ${delivery.brand.status}${delivery.brand.error ? `: ${delivery.brand.error}` : ''}`;
  const outreach = delivery.creatorOutreach;
  const creatorMailStatus = outreach.enabled
    ? `📨 Creator-Mails: ${outreach.queued} angenommen, ${outreach.failed} fehlgeschlagen, ${outreach.skippedNoEmail} ohne E-Mail, ${outreach.skippedDaily} heute bereits informiert${outreach.skippedLimit ? `, ${outreach.skippedLimit} wegen Versandlimit zurückgestellt` : ''}`
    : `⏸️ Creator-Mails deaktiviert · ${outreach.eligible} mit E-Mail versandfähig, ${outreach.skippedNoEmail} ohne hinterlegte E-Mail`;
  const creatorSummary = selectedCreators.length
    ? selectedCreators.map((creator) => `• *${slackEscape(creator.name)}* · ${slackEscape(creator.priceRange || 'Preis offen')}\n  ${slackEscape(creator.contactEmail || creator.socialLinks || 'kein direkter Kontakt')}`).join('\n')
    : 'Keine Creator ausgewählt.';
  const query = clientInfo.searchQuery || clientInfo.noResultsQuery || clientInfo.subject || 'Nicht angegeben';

  await webhook.send({
    text: `UGC VZ ${kindLabel} ${leadId}: ${brandStatus}`,
    blocks: [
      {
        type: 'header' as const,
        text: {
          type: 'plain_text' as const,
          text: `🎯 UGC VZ ${kindLabel} ${leadId}`,
          emoji: true,
        },
      },
      {
        type: 'section' as const,
        text: { type: 'mrkdwn' as const, text: `*Versandstatus*\n${slackEscape(brandStatus)}\n${slackEscape(creatorMailStatus)}` },
      },
      {
        type: 'section' as const,
        fields: [
          { type: 'mrkdwn' as const, text: `*Kontakt*\n${slackEscape(clientInfo.name)}\n${slackEscape(clientInfo.email)}` },
          { type: 'mrkdwn' as const, text: `*Quelle*\n${slackEscape(clientInfo.sourceUrl || 'Nicht angegeben')}` },
        ],
      },
      {
        type: 'section' as const,
        text: { type: 'mrkdwn' as const, text: `*Suche/Thema*\n${slackEscape(query)}\n\n*Nachricht*\n${slackEscape(clientInfo.message || 'Keine Nachricht')}` },
      },
      {
        type: 'section' as const,
        text: { type: 'mrkdwn' as const, text: `*Creator*\n${creatorSummary.slice(0, 2_800)}` },
      },
      {
        type: 'context' as const,
        elements: [{
          type: 'mrkdwn' as const,
          text: delivery.brand.status === 'queued'
            ? 'Die finale Zustellung bzw. ein Bounce wird über den Resend-Webhook gemeldet.'
            : 'Bitte Resend-Konfiguration bzw. Empfängeradresse prüfen.',
        }],
      },
    ],
  });

  return true;
}

export async function POST(req: Request) {
  const expectedApiKey = process.env.SUBMIT_REQUEST_API_KEY;
  const suppliedApiKey = req.headers.get('x-api-key');
  const authorized = isValidApiKey(suppliedApiKey, expectedApiKey) || isTrustedBrowserRequest(req);

  if (!authorized) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ success: false, error: 'Request body too large' }, { status: 413 });
  }

  try {
    const rawBodyText = await req.text();
    if (Buffer.byteLength(rawBodyText, 'utf8') > MAX_BODY_BYTES) {
      return NextResponse.json({ success: false, error: 'Request body too large' }, { status: 413 });
    }

    let rawBody: unknown;
    try {
      rawBody = JSON.parse(rawBodyText);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const { kind, clientInfo, creatorIds } = normalizeRequestBody(rawBody);

    if (clientInfo.website) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }

    if (!clientInfo.name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    if (!emailRegex.test(clientInfo.email)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }

    if (kind === 'creator_match' && (creatorIds.length === 0 || creatorIds.length > MAX_CREATORS_PER_REQUEST)) {
      return NextResponse.json({ success: false, error: 'Select between 1 and 10 creators' }, { status: 400 });
    }

    const ipKey = `ip:${hashRateLimitValue(getClientIp(req))}`;
    const emailKey = `email:${hashRateLimitValue(clientInfo.email)}`;
    const ipLimit = consumeRateLimit(ipKey, 20);
    const emailLimit = consumeRateLimit(emailKey, 5);
    if (!ipLimit.allowed || !emailLimit.allowed) {
      const retryAfter = Math.max(ipLimit.retryAfter, emailLimit.retryAfter);
      return NextResponse.json(
        { success: false, error: 'Zu viele Anfragen. Bitte später erneut versuchen.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      );
    }

    const leadId = createLeadId(clientInfo.submissionId);
    const selectedCreators = kind === 'creator_match'
      ? await fetchSelectedCreators(creatorIds)
      : [];

    const isInternal = isInternalRequest(clientInfo.email);

    const databaseLeadId = await persistLead({
      leadId,
      kind,
      clientInfo,
      selectedCreators,
      isInternal,
    });

    const delivery = await dispatchLeadEmails({
      leadId,
      kind,
      clientInfo,
      selectedCreators,
    });

    await persistInitialDelivery({
      databaseLeadId,
      leadId,
      clientInfo,
      delivery,
    });

    try {
      await sendSlackNotification({
        leadId,
        kind,
        clientInfo,
        selectedCreators,
        delivery,
      });
    } catch (error) {
      console.error(`[${leadId}] Slack notification failed`, error);
    }

    if (delivery.internal.status !== 'queued') {
      console.error(`[${leadId}] Internal email notification failed: ${delivery.internal.error || delivery.internal.status}`);
    }

    if (delivery.brand.status !== 'queued') {
      console.error(`[${leadId}] Brand email failed: ${delivery.brand.error || delivery.brand.status}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Die Bestätigungs-E-Mail konnte nicht versendet werden. Bitte erneut versuchen.',
          leadId,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      leadId,
      delivery: 'queued',
    });
  } catch (error) {
    console.error('UGC VZ submit-request failed', error);
    return NextResponse.json(
      { success: false, error: 'Anfrage konnte nicht verarbeitet werden' },
      { status: 500 },
    );
  }
}

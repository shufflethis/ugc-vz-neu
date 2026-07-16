import { NextResponse } from 'next/server';
import { IncomingWebhook } from '@slack/webhook';
import { Resend } from 'resend';
import { createHash } from 'crypto';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const globalWebhookState = globalThis as typeof globalThis & {
  __ugcResendWebhookIds?: Set<string>;
};

const processedWebhookIds = globalWebhookState.__ugcResendWebhookIds
  ?? (globalWebhookState.__ugcResendWebhookIds = new Set<string>());

function rememberWebhookId(webhookId: string) {
  if (processedWebhookIds.size >= 1_000) {
    processedWebhookIds.clear();
  }
  processedWebhookIds.add(webhookId);
}

const plainText = (value: unknown, maxLength = 300) =>
  String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength);

const brandEventLabels: Record<string, string> = {
  'email.delivered': '✅ Brand-Mail am Empfänger-Mailserver zugestellt',
  'email.delivery_delayed': '⚠️ Zustellung der Brand-Mail verzögert',
  'email.bounced': '❌ Brand-Mail zurückgewiesen (Bounce)',
  'email.failed': '❌ Versand der Brand-Mail fehlgeschlagen',
  'email.suppressed': '❌ Brand-Mail von Resend unterdrückt',
  'email.complained': '⚠️ Brand-Mail als Spam gemeldet',
};

const creatorFailureLabels: Record<string, string> = {
  'email.bounced': '❌ Creator-Mail zurückgewiesen (Bounce)',
  'email.failed': '❌ Versand der Creator-Mail fehlgeschlagen',
  'email.suppressed': '❌ Creator-Mail von Resend unterdrückt',
  'email.complained': '⚠️ Creator-Mail als Spam gemeldet',
};

function getEventReason(event: Record<string, any>) {
  const data = event.data || {};
  return plainText(
    data.failed?.reason
      || data.bounce?.message
      || data.suppressed?.message
      || '',
    500,
  );
}

async function persistEmailEvent({
  webhookId,
  event,
  audience,
  leadId,
  creatorId,
}: {
  webhookId: string;
  event: Record<string, any>;
  audience: string;
  leadId: string;
  creatorId: string;
}) {
  if (!isDatabaseConfigured()) return true;
  const normalizedAudience = ['brand', 'creator', 'internal', 'verification'].includes(audience)
    ? audience
    : 'internal';
  const data = event.data || {};
  const recipient = Array.isArray(data.to) ? String(data.to[0] || '') : String(data.to || '');
  const recipientHash = recipient
    ? createHash('sha256').update(recipient.toLowerCase()).digest('hex')
    : null;
  const reason = getEventReason(event);

  try {
    const sql = getDatabase();
    await sql.query(`
      INSERT INTO email_events (
        lead_id, creator_id, resend_email_id, audience, event_type,
        recipient_hash, metadata, occurred_at
      ) VALUES (
        (SELECT id FROM brand_leads WHERE public_id = $1 LIMIT 1),
        (SELECT id FROM creator_profiles WHERE public_id = $2 LIMIT 1),
        $3, $4, $5, $6, $7::jsonb, COALESCE($8::timestamptz, now())
      )
      ON CONFLICT ((metadata ->> 'webhook_id')) WHERE metadata ? 'webhook_id' DO NOTHING
    `, [
      leadId === 'unbekannt' ? null : leadId,
      creatorId || null,
      plainText(data.email_id, 160) || null,
      normalizedAudience,
      plainText(event.type, 80) || 'unknown',
      recipientHash,
      JSON.stringify({ webhook_id: webhookId, reason: reason || null }),
      data.created_at || null,
    ]);

    if (audience === 'brand' && leadId !== 'unbekannt') {
      await sql.query(`
        UPDATE brand_leads
        SET status = $2, updated_at = now()
        WHERE public_id = $1
      `, [leadId, event.type]);
    }

    if (
      audience === 'creator'
      && creatorId
      && ['email.bounced', 'email.failed', 'email.suppressed', 'email.complained'].includes(event.type)
    ) {
      await sql.query(`
        UPDATE creator_private_contacts
        SET notification_paused_at = now(), updated_at = now()
        WHERE creator_id = (SELECT id FROM creator_profiles WHERE public_id = $1 LIMIT 1)
      `, [creatorId]);
    }
    return true;
  } catch (error) {
    console.error(`[${leadId}] Could not persist Resend webhook`, error instanceof Error ? error.message : 'unknown error');
    return false;
  }
}

export async function POST(req: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('RESEND_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const webhookId = req.headers.get('svix-id');
  const timestamp = req.headers.get('svix-timestamp');
  const signature = req.headers.get('svix-signature');
  if (!webhookId || !timestamp || !signature) {
    return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 });
  }

  const payload = await req.text();
  let event: Record<string, any>;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: webhookId,
        timestamp,
        signature,
      },
      webhookSecret,
    }) as Record<string, any>;
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  if (processedWebhookIds.has(webhookId)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const data = event.data || {};
  const tags = data.tags || {};
  const audience = plainText(tags.audience, 40);
  const leadId = plainText(tags.lead_id, 80) || 'unbekannt';
  const creatorId = plainText(tags.creator_id, 80);
  const label = audience === 'brand'
    ? brandEventLabels[event.type]
    : audience === 'creator'
      ? creatorFailureLabels[event.type]
      : undefined;

  const persisted = await persistEmailEvent({
    webhookId,
    event,
    audience,
    leadId,
    creatorId,
  });
  if (!persisted) {
    return NextResponse.json({ error: 'Event persistence failed' }, { status: 500 });
  }

  // Creator-Erfolgsereignisse erzeugen bewusst keine Einzelmeldungen. Der
  // initiale Lead-Report enthält die Zahl der angenommenen Creator-Mails;
  // Bounce, Suppression, Complaint und Fehler werden hier separat gemeldet.
  if (!label) {
    rememberWebhookId(webhookId);
    return NextResponse.json({ received: true, ignored: true });
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn(`[${leadId}] Resend event ${event.type}; Slack is not configured`);
    rememberWebhookId(webhookId);
    return NextResponse.json({ received: true, notified: false });
  }

  const reason = getEventReason(event);
  try {
    const webhook = new IncomingWebhook(webhookUrl);
    await webhook.send({
      text: `${label} · Lead ${leadId}`,
      blocks: [
        {
          type: 'header' as const,
          text: {
            type: 'plain_text' as const,
            text: label,
            emoji: true,
          },
        },
        {
          type: 'section' as const,
          fields: [
            { type: 'mrkdwn' as const, text: `*Lead-ID*\n${leadId}` },
            { type: 'mrkdwn' as const, text: `*Resend-ID*\n${plainText(data.email_id, 120) || 'nicht angegeben'}` },
            ...(creatorId ? [{ type: 'mrkdwn' as const, text: `*Creator-ID*\n${creatorId}` }] : []),
          ],
        },
        ...(reason ? [{
          type: 'section' as const,
          text: { type: 'mrkdwn' as const, text: `*Hinweis*\n${plainText(reason).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}` },
        }] : []),
        {
          type: 'context' as const,
          elements: [{
            type: 'mrkdwn' as const,
            text: audience === 'creator'
              ? 'Bitte Creator-Adresse im Profil prüfen oder Benachrichtigungen für dieses Profil pausieren.'
              : event.type === 'email.delivered'
              ? 'Resend bestätigt die Annahme durch den Mailserver des Empfängers.'
              : 'Bitte Empfängeradresse und Resend-Status prüfen; Kundendaten stehen in der ursprünglichen Lead-Nachricht.',
          }],
        },
      ],
    });
  } catch (error) {
    console.error(`[${leadId}] Resend webhook Slack notification failed`, error);
    return NextResponse.json({ error: 'Notification failed' }, { status: 500 });
  }

  rememberWebhookId(webhookId);
  return NextResponse.json({ received: true, notified: true });
}

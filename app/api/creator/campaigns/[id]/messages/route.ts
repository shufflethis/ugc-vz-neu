import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import { isTrustedSameOrigin } from '@/app/lib/brand-session';
import { cleanMultiline, cleanText } from '@/app/lib/brand-workspace';
import {
  buildPortalMessageNotification,
  sendCampaignNotificationEmail,
} from '@/app/lib/campaign-notification-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const creatorId = verifySession(request.cookies.get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ success: false, error: 'Datenbank nicht verfügbar.' }, { status: 503 });

  const sql = getDatabase();
  const [app] = (await sql.query(
    `SELECT a.id AS application_id, c.id AS campaign_id
     FROM brand_campaign_applications a
     JOIN brand_campaigns c ON c.id = a.campaign_id
     WHERE c.public_id = $1 AND a.creator_id = $2
     LIMIT 1`,
    [cleanText(params.id, 30), creatorId],
  )) as unknown as Array<any>;

  if (!app) {
    return NextResponse.json({ success: true, messages: [] });
  }

  try {
    const rows = (await sql.query(
      `SELECT id, sender_role, sender_name, body, created_at
       FROM campaign_messages
       WHERE campaign_id = $1 AND application_id = $2
       ORDER BY created_at ASC
       LIMIT 100`,
      [app.campaign_id, app.application_id],
    )) as unknown as Array<any>;

    return NextResponse.json({
      success: true,
      messages: rows.map((r) => ({
        id: String(r.id),
        senderRole: String(r.sender_role) as 'brand' | 'creator',
        senderName: String(r.sender_name || ''),
        body: String(r.body),
        createdAt: new Date(String(r.created_at)).toISOString(),
      })),
    });
  } catch (err: any) {
    if (err?.code === '42P01') {
      return NextResponse.json({ success: true, messages: [], migrationPending: true });
    }
    return NextResponse.json({ success: false, error: 'Nachrichten konnten nicht geladen werden.' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!isTrustedSameOrigin(request)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const creatorId = verifySession(request.cookies.get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ success: false, error: 'Datenbank nicht verfügbar.' }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const text = cleanMultiline(body.body, 2000);
  if (!text) {
    return NextResponse.json({ success: false, error: 'Bitte gib eine Nachricht ein.' }, { status: 400 });
  }

  const sql = getDatabase();
  const [ctx] = (await sql.query(
    `SELECT a.id AS application_id, c.id AS campaign_id, c.public_id, c.title,
            b.email AS brand_email, b.contact_name AS brand_contact_name,
            COALESCE(NULLIF(p.display_name, ''), 'Creator') AS creator_name
     FROM brand_campaign_applications a
     JOIN brand_campaigns c ON c.id = a.campaign_id
     JOIN brand_accounts b ON b.id = c.brand_id
     JOIN creator_profiles p ON p.id = a.creator_id
     WHERE c.public_id = $1 AND a.creator_id = $2
     LIMIT 1`,
    [cleanText(params.id, 30), creatorId],
  )) as unknown as Array<any>;

  if (!ctx) {
    return NextResponse.json(
      { success: false, error: 'Bewirb dich zuerst auf diese Kampagne, um Nachrichten zu schreiben.' },
      { status: 403 },
    );
  }

  const senderName = String(ctx.creator_name || 'Creator');

  try {
    const [created] = (await sql.query(
      `INSERT INTO campaign_messages (campaign_id, application_id, sender_role, sender_name, body)
       VALUES ($1, $2, 'creator', $3, $4)
       RETURNING id, sender_role, sender_name, body, created_at`,
      [ctx.campaign_id, ctx.application_id, senderName, text],
    )) as unknown as Array<any>;

    if (ctx.brand_email) {
      const mail = buildPortalMessageNotification({
        recipientName: String(ctx.brand_contact_name || 'Team'),
        senderName,
        senderRole: 'creator',
        campaignPublicId: String(ctx.public_id),
        campaignTitle: String(ctx.title),
        messagePreview: text,
      });
      await sendCampaignNotificationEmail({
        to: String(ctx.brand_email),
        ...mail,
        category: 'portal_message_to_brand',
        audience: 'brand',
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: {
          id: String(created.id),
          senderRole: 'creator' as const,
          senderName: String(created.sender_name),
          body: String(created.body),
          createdAt: new Date(String(created.created_at)).toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err: any) {
    if (err?.code === '42P01') {
      return NextResponse.json(
        { success: false, error: 'Nachrichten-Tabelle wird gerade eingerichtet (Migration 027 ausführen).' },
        { status: 503 },
      );
    }
    return NextResponse.json({ success: false, error: 'Nachricht konnte nicht gesendet werden.' }, { status: 500 });
  }
}

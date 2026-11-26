import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { BRAND_SESSION_COOKIE, isTrustedSameOrigin, verifyBrandSession } from '@/app/lib/brand-session';
import { cleanMultiline, cleanText } from '@/app/lib/brand-workspace';
import {
  buildPortalMessageNotification,
  sendCampaignNotificationEmail,
} from '@/app/lib/campaign-notification-email';
import { sendPlausibleServerEvent } from '@/app/lib/plausible-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const brandId = verifyBrandSession(request.cookies.get(BRAND_SESSION_COOKIE)?.value);
  if (!brandId) return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ success: false, error: 'Datenbank nicht verfügbar.' }, { status: 503 });

  const applicationId = cleanText(request.nextUrl.searchParams.get('applicationId'), 60);
  if (!applicationId) {
    return NextResponse.json({ success: false, error: 'applicationId fehlt.' }, { status: 400 });
  }

  const sql = getDatabase();
  const [app] = (await sql.query(
    `SELECT a.id, c.id AS campaign_id
     FROM brand_campaign_applications a
     JOIN brand_campaigns c ON c.id = a.campaign_id
     WHERE c.brand_id = $1 AND c.public_id = $2 AND a.id = $3
     LIMIT 1`,
    [brandId, cleanText(params.id, 30), applicationId],
  )) as unknown as Array<any>;

  if (!app) {
    return NextResponse.json({ success: false, error: 'Zuordnung nicht gefunden.' }, { status: 404 });
  }

  try {
    const rows = (await sql.query(
      `SELECT id, sender_role, sender_name, body, created_at
       FROM campaign_messages
       WHERE campaign_id = $1 AND application_id = $2
       ORDER BY created_at ASC
       LIMIT 100`,
      [app.campaign_id, app.id],
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
  const brandId = verifyBrandSession(request.cookies.get(BRAND_SESSION_COOKIE)?.value);
  if (!brandId) return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ success: false, error: 'Datenbank nicht verfügbar.' }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const applicationId = cleanText(body.applicationId, 60);
  const text = cleanMultiline(body.body, 2000);
  if (!applicationId || !text) {
    return NextResponse.json({ success: false, error: 'Bitte gib eine Nachricht ein.' }, { status: 400 });
  }

  const sql = getDatabase();
  const [ctx] = (await sql.query(
    `SELECT a.id AS application_id, c.id AS campaign_id, c.public_id, c.title,
            c.brand_display_name, b.contact_name,
            COALESCE(NULLIF(p.display_name, ''), 'Creator') AS creator_name,
            pc.email AS creator_email
     FROM brand_campaign_applications a
     JOIN brand_campaigns c ON c.id = a.campaign_id
     JOIN brand_accounts b ON b.id = c.brand_id
     JOIN creator_profiles p ON p.id = a.creator_id
     LEFT JOIN creator_private_contacts pc ON pc.creator_id = p.id
     WHERE c.brand_id = $1 AND c.public_id = $2 AND a.id = $3
     LIMIT 1`,
    [brandId, cleanText(params.id, 30), applicationId],
  )) as unknown as Array<any>;

  if (!ctx) {
    return NextResponse.json({ success: false, error: 'Creator-Zuordnung nicht gefunden.' }, { status: 404 });
  }

  const senderName = String(ctx.brand_display_name || ctx.contact_name || 'Marke');

  try {
    const [created] = (await sql.query(
      `INSERT INTO campaign_messages (campaign_id, application_id, sender_role, sender_name, body)
       VALUES ($1, $2, 'brand', $3, $4)
       RETURNING id, sender_role, sender_name, body, created_at`,
      [ctx.campaign_id, ctx.application_id, senderName, text],
    )) as unknown as Array<any>;

    if (ctx.creator_email) {
      const mail = buildPortalMessageNotification({
        recipientName: String(ctx.creator_name || 'Creator'),
        senderName,
        senderRole: 'brand',
        campaignPublicId: String(ctx.public_id),
        campaignTitle: String(ctx.title),
        messagePreview: text,
      });
      await sendCampaignNotificationEmail({
        to: String(ctx.creator_email),
        ...mail,
        category: 'portal_message_to_creator',
        audience: 'creator',
      });
    }

    await sendPlausibleServerEvent({
      name: 'portal_message_sent',
      path: '/brand/kampagnen',
      props: { role: 'brand' },
      userAgent: request.headers.get('user-agent'),
      clientIp: request.headers.get('x-forwarded-for'),
    });

    return NextResponse.json(
      {
        success: true,
        message: {
          id: String(created.id),
          senderRole: 'brand' as const,
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

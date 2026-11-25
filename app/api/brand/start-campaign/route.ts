import { NextRequest, NextResponse } from 'next/server';
import { IncomingWebhook } from '@slack/webhook';
import { Resend } from 'resend';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { BRAND_SESSION_COOKIE, isTrustedSameOrigin, verifyBrandSession } from '@/app/lib/brand-session';
import { buildBrandLoginEmail } from '@/app/lib/brand-login-email';
import {
  cleanMultiline,
  cleanText,
  createBrandCampaign,
  createBrandLoginToken,
  getBrandAccount,
  toPositiveIntOrNull,
  upsertBrandAccount,
  type CampaignVisibility,
  type CompensationModel,
} from '@/app/lib/brand-workspace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

/**
 * Nahtloser Uebergang von der offenen Suche in den Brand-Workspace:
 * - Ist die Brand schon eingeloggt: legt die Kampagne direkt an und leitet in /brand/kampagnen/[publicId].
 * - Ist die Brand noch nicht eingeloggt: legt Konto + Kampagne + Creator-Einladungen an und schickt
 *   den Magic-Link direkt in die fertige Kampagne (kein Datenverlust, kein Passwort-Abbruch).
 */
export async function POST(request: NextRequest) {
  if (!isTrustedSameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Datenbank gerade nicht verfügbar.' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  if (cleanText(body.website, 200)) {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const sql = getDatabase();
  const sessionBrandId = verifyBrandSession(request.cookies.get(BRAND_SESSION_COOKIE)?.value);

  try {
    let brand = sessionBrandId ? await getBrandAccount(sql, sessionBrandId) : null;
    const authenticated = Boolean(brand);

    if (!brand) {
      const email = cleanText(body.email, 254).toLowerCase();
      const name = cleanText(body.name, 120);
      if (!name) {
        return NextResponse.json({ success: false, error: 'Bitte gib deinen Namen an.' }, { status: 400 });
      }
      if (!emailRegex.test(email)) {
        return NextResponse.json({ success: false, error: 'Bitte gib eine gültige E-Mail-Adresse an.' }, { status: 400 });
      }
      brand = await upsertBrandAccount(sql, {
        email,
        contactName: name,
        companyName: cleanText(body.company, 140) || name,
      });
    }

    const title = cleanText(body.title, 140)
      || cleanText(body.searchQuery, 90)
      || `UGC-Kampagne (${brand.companyName || brand.contactName || 'Brand'})`;

    const creatorPublicIds = Array.isArray(body.creatorIds)
      ? body.creatorIds.map((id) => cleanText(id, 40)).filter(Boolean)
      : [];

    const visibility: CampaignVisibility = body.visibility === 'invite_only' ? 'invite_only' : 'open';
    const compensationModel: CompensationModel = ['fixed', 'tkp', 'hybrid', 'barter'].includes(String(body.compensationModel))
      ? (body.compensationModel as CompensationModel)
      : 'fixed';

    const created = await createBrandCampaign(sql, brand, {
      title,
      brandDisplayName: cleanText(body.company, 120) || brand.companyName || brand.contactName || 'Brand',
      description: cleanMultiline(body.description || body.message, 3000),
      niche: cleanText(body.niche, 80),
      platforms: Array.isArray(body.platforms) ? body.platforms.map(String) : ['tiktok', 'instagram'],
      deliverables: cleanText(body.deliverables, 240),
      compensationModel,
      budgetPerVideoEur: toPositiveIntOrNull(body.budgetPerVideoEur, 50_000),
      totalBudgetEur: toPositiveIntOrNull(body.totalBudgetEur, 1_000_000),
      tkpEurCents: toPositiveIntOrNull(body.tkpEurCents, 50_000),
      usageRights: cleanText(body.usageRights, 160),
      deadline: cleanText(body.deadline, 120),
      visibility,
      creatorPublicIds,
    });

    const campaignPath = `/brand/kampagnen/${created.publicId}`;

    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);
        await webhook.send({
          text: `🚀 Neue Brand-Kampagne ${created.publicId}: ${title} (${brand.companyName || brand.email}) · ${created.invitedCount} eingeladen · ${visibility === 'open' ? 'Offen ausgeschrieben' : 'Nur Einladung'}`,
        });
      } catch (slackErr) {
        console.error('Brand campaign Slack ping failed', slackErr instanceof Error ? slackErr.message : 'unknown');
      }
    }

    if (authenticated) {
      return NextResponse.json({
        success: true,
        authenticated: true,
        campaignPublicId: created.publicId,
        invitedCount: created.invitedCount,
        redirectTo: campaignPath,
      });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json(
        { success: false, error: 'Kampagne angelegt, aber E-Mail-Versand ist nicht konfiguriert.' },
        { status: 503 },
      );
    }

    const token = await createBrandLoginToken(sql, brand.id, campaignPath);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const loginUrl = new URL('/brand/verify', baseUrl);
    loginUrl.searchParams.set('token', token);

    const emailPayload = buildBrandLoginEmail({
      name: brand.contactName,
      company: brand.companyName,
      loginUrl: loginUrl.toString(),
      campaignTitle: title,
      invitedCount: created.invitedCount,
    });

    const resend = new Resend(resendApiKey);
    const sendRes = await resend.emails.send({
      from: process.env.RESEND_FROM || 'UGC VZ <hi@ugc-vz.de>',
      to: brand.email,
      replyTo: process.env.UGC_INTERNAL_EMAIL || 'hi@ugc-vz.de',
      subject: emailPayload.subject,
      html: emailPayload.html,
      text: emailPayload.text,
      tags: [
        { name: 'category', value: 'brand_campaign_login' },
        { name: 'audience', value: 'brand' },
      ],
    });

    if (sendRes.error) {
      console.error('Brand campaign login mail failed', sendRes.error.name);
      return NextResponse.json({ success: false, error: 'Anmeldelink konnte nicht versendet werden.' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      authenticated: false,
      campaignPublicId: created.publicId,
      invitedCount: created.invitedCount,
      message: 'Kampagne angelegt! Wir haben dir den direkten Zugangslink zu deinem Brand-Workspace per E-Mail geschickt.',
    });
  } catch (error) {
    console.error('start-campaign failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'Kampagne konnte nicht erstellt werden.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { IncomingWebhook } from '@slack/webhook';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { BRAND_SESSION_COOKIE, isTrustedSameOrigin, verifyBrandSession } from '@/app/lib/brand-session';
import { cleanMultiline, cleanText, getBrandAccount, toPositiveIntOrNull } from '@/app/lib/brand-workspace';
import {
  getHighRiskFeeBps,
  INDUSTRY_CATEGORIES,
  isHighRiskCategory,
  normalizeIndustryCategory,
  type PreferredHighRiskPsp,
} from '@/app/lib/high-risk-compliance';
import {
  buildHighRiskComplianceBrandConfirmation,
  buildHighRiskComplianceTeamNotification,
  sendCampaignNotificationEmail,
} from '@/app/lib/campaign-notification-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_PSPS = new Set<PreferredHighRiskPsp>(['invoice_sepa', 'high_risk_psp', 'crypto_usdc']);

const PSP_LABELS: Record<PreferredHighRiskPsp, string> = {
  invoice_sepa: 'SEPA-Vorkasse / Rechnung (Geschäftskonto)',
  high_risk_psp: 'High-Risk-PSP (Karte / SEPA Sonderanbieter)',
  crypto_usdc: 'Stablecoin / USDC-Settlement (Krypto-Partner)',
};

export async function POST(request: NextRequest) {
  if (!isTrustedSameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const brandId = verifyBrandSession(request.cookies.get(BRAND_SESSION_COOKIE)?.value);
  if (!brandId) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Datenbank nicht verfügbar.' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const sql = getDatabase();
  const brand = await getBrandAccount(sql, brandId);
  if (!brand) {
    return NextResponse.json({ success: false, error: 'Marken-Konto nicht gefunden.' }, { status: 404 });
  }

  const category = normalizeIndustryCategory(body.industryCategory);
  const effectiveCategory = isHighRiskCategory(category) ? category : 'other_high_risk';
  const meta = INDUSTRY_CATEGORIES[effectiveCategory];
  const feeBps = getHighRiskFeeBps(effectiveCategory);
  const feePercent = Math.round(feeBps / 100);
  const preferredContact: 'call' | 'email' = body.preferredContact === 'email' ? 'email' : 'call';
  const phoneOrHandle = cleanText(body.phoneOrHandle, 120);
  const preferredPsp: PreferredHighRiskPsp = ALLOWED_PSPS.has(String(body.preferredPsp) as PreferredHighRiskPsp)
    ? (String(body.preferredPsp) as PreferredHighRiskPsp)
    : 'invoice_sepa';
  const estimatedMonthlyBudgetEur = toPositiveIntOrNull(body.estimatedMonthlyBudgetEur, 1_000_000);
  const websiteUrl = cleanText(body.websiteUrl || brand.website, 300);
  const message = cleanMultiline(body.message, 2000);

  let requestId = '';
  try {
    await sql.query(
      `UPDATE brand_accounts
       SET industry_category = $2,
           billing_tier = 'high_risk_custom',
           compliance_status = 'review_required',
           high_risk_fee_bps = $3,
           compliance_notes = $4,
           compliance_requested_at = now(),
           website = COALESCE(NULLIF($5, ''), website),
           updated_at = now()
       WHERE id = $1`,
      [brandId, effectiveCategory, feeBps, message.slice(0, 500), websiteUrl],
    );

    const [created] = (await sql.query(
      `INSERT INTO brand_compliance_requests (
         brand_id, industry_category, preferred_contact, phone_or_handle,
         preferred_psp, estimated_monthly_budget_eur, website_url, message
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      [
        brandId,
        effectiveCategory,
        preferredContact,
        phoneOrHandle,
        preferredPsp,
        estimatedMonthlyBudgetEur,
        websiteUrl,
        message,
      ],
    )) as unknown as Array<any>;
    requestId = String(created?.id || '');
  } catch (err: any) {
    // Graceful degradation falls Migration 027 in einer Umgebung noch aussteht: E-Mail & Slack gehen trotzdem raus!
    if (err?.code !== '42703' && err?.code !== '42P01') {
      console.error('High-risk compliance request DB error:', err instanceof Error ? err.message : 'unknown');
      return NextResponse.json({ success: false, error: 'Anfrage konnte nicht gespeichert werden.' }, { status: 500 });
    }
  }

  const teamEmail = process.env.ADMIN_NOTIFY_EMAIL?.trim() || 'hi@ugc-vz.de';
  const teamMail = buildHighRiskComplianceTeamNotification({
    brandCompany: brand.companyName || brand.contactName || brand.email,
    brandContact: brand.contactName || 'Ansprechpartner',
    brandEmail: brand.email,
    industryLabel: meta.label,
    feePercent,
    preferredContact,
    phoneOrHandle,
    preferredPsp: PSP_LABELS[preferredPsp],
    estimatedMonthlyBudgetEur,
    websiteUrl,
    message,
  });

  const brandMail = buildHighRiskComplianceBrandConfirmation({
    contactName: brand.contactName || brand.companyName || 'Team',
    companyName: brand.companyName || brand.email,
    industryLabel: meta.shortLabel,
    feePercent,
    preferredContact,
  });

  await Promise.allSettled([
    sendCampaignNotificationEmail({
      to: teamEmail,
      ...teamMail,
      category: 'high_risk_compliance_internal',
      audience: 'brand',
    }),
    sendCampaignNotificationEmail({
      to: brand.email,
      ...brandMail,
      category: 'high_risk_compliance_confirm',
      audience: 'brand',
    }),
    process.env.SLACK_WEBHOOK_URL
      ? new IncomingWebhook(process.env.SLACK_WEBHOOK_URL).send({
          text: `🛡️ High-Risk / Sonderbranche Compliance-Anfrage: *${brand.companyName || brand.email}* (${meta.shortLabel} · ${feePercent} % Fee)\nKontakt: ${preferredContact.toUpperCase()} ${phoneOrHandle || brand.email} · Zahlungsweg: ${PSP_LABELS[preferredPsp]} · Budget: ${estimatedMonthlyBudgetEur ? `${estimatedMonthlyBudgetEur} €/Monat` : 'offen'}\n${message ? `Hinweis: ${message.slice(0, 260)}` : ''}`,
        })
      : Promise.resolve(),
  ]);

  return NextResponse.json(
    {
      success: true,
      requestId,
      billingProfile: {
        industryCategory: effectiveCategory,
        billingTier: 'high_risk_custom',
        complianceStatus: 'review_required',
        highRiskFeeBps: feeBps,
      },
      message: `Compliance- & Abrechnungsanfrage eingegangen! Unser Team meldet sich innerhalb von 24h per ${preferredContact === 'call' ? 'Call' : 'E-Mail'}.`,
    },
    { status: 201 },
  );
}

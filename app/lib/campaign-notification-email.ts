import { Resend } from 'resend';
import { emailShell, htmlEscape } from './email-shell';

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://ugc-vz.de').replace(/\/$/, '');
const DEFAULT_FROM = 'UGC VZ <hi@ugc-vz.de>';

export interface CampaignNotificationPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  category: string;
  audience: 'brand' | 'creator';
}

const formatEurDe = (cents: number) =>
  `${(Math.max(0, cents) / 100).toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;

export function buildCreatorInvitedNotification({
  creatorName,
  brandName,
  campaignTitle,
  compensationSummary,
  deliverables,
}: {
  creatorName: string;
  brandName: string;
  campaignTitle: string;
  compensationSummary: string;
  deliverables?: string;
}) {
  const firstName = creatorName.trim().split(/\s+/)[0] || 'Creator';
  const portalUrl = `${BASE_URL}/konto/kampagnen`;
  const e = htmlEscape;

  const body = `<tr>
    <td class="email-pad" style="padding:8px 42px 32px;">
      <p style="margin:0;font-size:16px;line-height:26px;color:#202124;">Hallo ${e(firstName)},</p>
      <p style="margin:14px 0 0;font-size:15px;line-height:25px;color:#5C6470;">
        <strong style="color:#202124;">${e(brandName)}</strong> hat dich persönlich zu einer Kampagne im UGC VZ Portal eingeladen.
      </p>
      <div style="margin:22px 0;padding:18px 20px;border-radius:12px;background:#F5F7FA;border:1px solid #DCE2EA;font-size:14px;line-height:22px;">
        <div style="font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#06458F;">Kampagne</div>
        <div style="margin-top:4px;font-size:17px;font-weight:800;color:#202124;">${e(campaignTitle)}</div>
        <div style="margin-top:10px;color:#202124;"><strong>Vergütung:</strong> <span style="color:#06458F;font-weight:700;">${e(compensationSummary)}</span></div>
        ${deliverables ? `<div style="margin-top:6px;color:#5C6470;"><strong style="color:#202124;">Umfang:</strong> ${e(deliverables)}</div>` : ''}
        <div style="margin-top:8px;font-size:12px;color:#157347;font-weight:700;">✓ 0 % Plattformgebühr für Creator · Auszahlung direkt im Portal</div>
      </div>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0;">
        <tr>
          <td style="border-radius:8px;background:#06458F;">
            <a href="${e(portalUrl)}" style="display:inline-block;padding:14px 24px;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;">Einladung im Konto ansehen &rarr;</a>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:13px;line-height:20px;color:#5C6470;">
        Du kannst dir das komplette Briefing im Creator-Konto ansehen und mit einem Klick annehmen oder ablehnen.
      </p>
    </td>
  </tr>`;

  return {
    subject: `${firstName}, Einladung von ${brandName}: ${campaignTitle}`,
    html: emailShell({
      preheader: `${brandName} lädt dich ein (${compensationSummary}). Im Creator-Konto ansehen.`,
      eyebrow: 'Neue Einladung',
      title: 'Du wurdest eingeladen',
      headerTagline: 'Creator-Konto',
      children: body,
      footerNote: 'Du erhältst diese Nachricht, weil eine Marke dich über das UGC VZ Portal eingeladen hat.',
    }),
    text: `Hallo ${firstName},\n\n${brandName} hat dich zu einer Kampagne auf UGC VZ eingeladen:\n\nKampagne: ${campaignTitle}\nVergütung: ${compensationSummary}${deliverables ? `\nUmfang: ${deliverables}` : ''}\n0 % Gebühr für Creator.\n\nEinladung im Creator-Konto ansehen:\n${portalUrl}\n\nUGC VZ · track by track GmbH · Berlin`,
  };
}

export function buildCreatorSelectedNotification({
  creatorName,
  brandName,
  campaignTitle,
  compensationSummary,
  affiliateCode,
}: {
  creatorName: string;
  brandName: string;
  campaignTitle: string;
  compensationSummary: string;
  affiliateCode?: string | null;
}) {
  const firstName = creatorName.trim().split(/\s+/)[0] || 'Creator';
  const portalUrl = `${BASE_URL}/konto/kampagnen`;
  const affiliateLink = affiliateCode ? `${BASE_URL}/r/${affiliateCode}` : '';
  const e = htmlEscape;

  const affiliateBlock = affiliateCode
    ? `<div style="margin:18px 0;padding:16px 18px;border-radius:12px;background:#EBF2FA;border:1px solid #C4D7EF;font-size:14px;line-height:22px;">
         <div style="font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#06458F;">Dein persönlicher Affiliate-Code &amp; Link</div>
         <div style="margin-top:6px;color:#202124;"><strong>Code:</strong> <span style="font-family:monospace;font-size:16px;font-weight:800;color:#06458F;">${e(affiliateCode)}</span></div>
         <div style="margin-top:4px;color:#5C6470;">Tracking-Link: <a href="${e(affiliateLink)}" style="color:#06458F;font-weight:700;">${e(affiliateLink)}</a></div>
       </div>`
    : '';

  const body = `<tr>
    <td class="email-pad" style="padding:8px 42px 32px;">
      <p style="margin:0;font-size:16px;line-height:26px;color:#202124;">Hallo ${e(firstName)},</p>
      <p style="margin:14px 0 0;font-size:15px;line-height:25px;color:#5C6470;">
        <strong style="color:#202124;">${e(brandName)}</strong> hat dich für die Kampagne <strong style="color:#202124;">„${e(campaignTitle)}“</strong> ausgewählt (${e(compensationSummary)}). Du kannst jetzt starten und deinen fertigen Beitrag direkt im Creator-Konto einreichen.
      </p>
      ${affiliateBlock}
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0;">
        <tr>
          <td style="border-radius:8px;background:#06458F;">
            <a href="${e(portalUrl)}" style="display:inline-block;padding:14px 24px;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;">Briefing öffnen &amp; Content einreichen &rarr;</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

  return {
    subject: `Ausgewählt: ${campaignTitle} (${brandName})`,
    html: emailShell({
      preheader: `${brandName} hat dich ausgewählt. Jetzt Briefing öffnen und Video im Konto einreichen.`,
      eyebrow: 'Kampagne gestartet',
      title: 'Du bist dabei',
      headerTagline: 'Creator-Konto',
      children: body,
      footerNote: 'Status-Benachrichtigung zu deiner aktiven Kampagne im UGC VZ Creator-Konto.',
    }),
    text: `Hallo ${firstName},\n\n${brandName} hat dich für "${campaignTitle}" ausgewählt (${compensationSummary}).${affiliateCode ? `\n\nDein persönlicher Affiliate-Code: ${affiliateCode}\nTracking-Link: ${affiliateLink}` : ''}\n\nBriefing öffnen & Content einreichen:\n${portalUrl}\n\nUGC VZ · track by track GmbH · Berlin`,
  };
}

export function buildBrandApplicationNotification({
  brandContactName,
  campaignPublicId,
  campaignTitle,
  creatorName,
  proposedFeeEur,
  pitch,
}: {
  brandContactName: string;
  campaignPublicId: string;
  campaignTitle: string;
  creatorName: string;
  proposedFeeEur?: number | null;
  pitch?: string;
}) {
  const firstName = brandContactName.trim().split(/\s+/)[0] || 'Team';
  const campaignUrl = `${BASE_URL}/brand/kampagnen/${encodeURIComponent(campaignPublicId)}`;
  const e = htmlEscape;

  const body = `<tr>
    <td class="email-pad" style="padding:8px 42px 32px;">
      <p style="margin:0;font-size:16px;line-height:26px;color:#202124;">Hallo ${e(firstName)},</p>
      <p style="margin:14px 0 0;font-size:15px;line-height:25px;color:#5C6470;">
        <strong style="color:#202124;">${e(creatorName)}</strong> hat sich auf deine Kampagne <strong style="color:#202124;">„${e(campaignTitle)}“</strong> beworben.
      </p>
      <div style="margin:20px 0;padding:16px 18px;border-radius:12px;background:#F5F7FA;border:1px solid #DCE2EA;font-size:14px;line-height:22px;">
        <div><strong>Creator:</strong> ${e(creatorName)}</div>
        ${proposedFeeEur ? `<div style="margin-top:4px;"><strong>Honorarvorschlag:</strong> <span style="color:#06458F;font-weight:700;">${proposedFeeEur.toLocaleString('de-DE')} €</span></div>` : ''}
        ${pitch ? `<div style="margin-top:8px;color:#5C6470;">„${e(pitch.slice(0, 280))}“</div>` : ''}
      </div>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0;">
        <tr>
          <td style="border-radius:8px;background:#06458F;">
            <a href="${e(campaignUrl)}" style="display:inline-block;padding:14px 24px;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;">Bewerbung im Workspace prüfen &rarr;</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

  return {
    subject: `Neue Bewerbung für „${campaignTitle}“: ${creatorName}`,
    html: emailShell({
      preheader: `${creatorName} hat sich auf deine Kampagne beworben. Im Brand-Workspace ansehen.`,
      eyebrow: 'Neue Bewerbung',
      title: 'Neuer Creator im Funnel',
      headerTagline: 'Marken-Konto',
      children: body,
      footerNote: 'Du erhältst diese Benachrichtigung zu deiner aktiven Kampagne im UGC VZ Marken-Konto.',
    }),
    text: `Hallo ${firstName},\n\n${creatorName} hat sich auf "${campaignTitle}" beworben.${proposedFeeEur ? ` Honorarvorschlag: ${proposedFeeEur} €.` : ''}\n\nIm Brand-Workspace prüfen:\n${campaignUrl}\n\nUGC VZ · track by track GmbH · Berlin`,
  };
}

export function buildBrandSubmissionNotification({
  brandContactName,
  campaignPublicId,
  campaignTitle,
  creatorName,
  submissionTitle,
  platform,
}: {
  brandContactName: string;
  campaignPublicId: string;
  campaignTitle: string;
  creatorName: string;
  submissionTitle: string;
  platform: string;
}) {
  const firstName = brandContactName.trim().split(/\s+/)[0] || 'Team';
  const campaignUrl = `${BASE_URL}/brand/kampagnen/${encodeURIComponent(campaignPublicId)}`;
  const e = htmlEscape;

  const body = `<tr>
    <td class="email-pad" style="padding:8px 42px 32px;">
      <p style="margin:0;font-size:16px;line-height:26px;color:#202124;">Hallo ${e(firstName)},</p>
      <p style="margin:14px 0 0;font-size:15px;line-height:25px;color:#5C6470;">
        <strong style="color:#202124;">${e(creatorName)}</strong> hat einen neuen Beitrag für <strong style="color:#202124;">„${e(campaignTitle)}“</strong> eingereicht.
      </p>
      <div style="margin:20px 0;padding:16px 18px;border-radius:12px;background:#F5F7FA;border:1px solid #DCE2EA;font-size:14px;line-height:22px;">
        <div><strong>Beitrag:</strong> ${e(submissionTitle)} (${e(platform.toUpperCase())})</div>
        <div style="margin-top:6px;color:#5C6470;">Prüfe den Clip im Workspace gegen deine Briefing-Checkliste, gib ihn frei oder frage eine kurze Korrektur an.</div>
      </div>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0;">
        <tr>
          <td style="border-radius:8px;background:#06458F;">
            <a href="${e(campaignUrl)}" style="display:inline-block;padding:14px 24px;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;">Beitrag prüfen &amp; freigeben &rarr;</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

  return {
    subject: `Neuer Beitrag eingereicht: ${creatorName} (${campaignTitle})`,
    html: emailShell({
      preheader: `${creatorName} hat einen Clip eingereicht. Jetzt im Brand-Workspace prüfen.`,
      eyebrow: 'Beitrag eingereicht',
      title: 'Neuer Content wartet auf Prüfung',
      headerTagline: 'Marken-Konto',
      children: body,
      footerNote: 'Status-Meldung zu deiner aktiven Kampagne im UGC VZ Marken-Konto.',
    }),
    text: `Hallo ${firstName},\n\n${creatorName} hat einen Beitrag für "${campaignTitle}" eingereicht (${submissionTitle}).\n\nIm Brand-Workspace prüfen & freigeben:\n${campaignUrl}\n\nUGC VZ · track by track GmbH · Berlin`,
  };
}

export function buildCreatorPayoutApprovedNotification({
  creatorName,
  brandName,
  campaignTitle,
  creditedCents,
  reasonLabel,
}: {
  creatorName: string;
  brandName: string;
  campaignTitle: string;
  creditedCents: number;
  reasonLabel: string;
}) {
  const firstName = creatorName.trim().split(/\s+/)[0] || 'Creator';
  const walletUrl = `${BASE_URL}/konto`;
  const amountStr = formatEurDe(creditedCents);
  const e = htmlEscape;

  const body = `<tr>
    <td class="email-pad" style="padding:8px 42px 32px;">
      <p style="margin:0;font-size:16px;line-height:26px;color:#202124;">Hallo ${e(firstName)},</p>
      <p style="margin:14px 0 0;font-size:15px;line-height:25px;color:#5C6470;">
        gute Nachrichten: <strong style="color:#202124;">${e(brandName)}</strong> hat deine Leistung für <strong style="color:#202124;">„${e(campaignTitle)}“</strong> freigegeben.
      </p>
      <div style="margin:22px 0;padding:20px 22px;border-radius:12px;background:#E8F7EE;border:1px solid #B7E4C7;text-align:center;">
        <div style="font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#157347;">${e(reasonLabel)}</div>
        <div style="margin-top:8px;font-size:32px;line-height:38px;font-weight:800;color:#157347;">${e(amountStr)}</div>
        <div style="margin-top:6px;font-size:12px;color:#157347;">0 % Creator-Gebühr · direkt in deinem Guthaben verfügbar</div>
      </div>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0;">
        <tr>
          <td style="border-radius:8px;background:#06458F;">
            <a href="${e(walletUrl)}" style="display:inline-block;padding:14px 24px;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;">Guthaben im Konto ansehen &rarr;</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

  return {
    subject: `${amountStr} gutgeschrieben: ${campaignTitle} | UGC VZ`,
    html: emailShell({
      preheader: `${amountStr} wurden deinem UGC VZ Guthaben gutgeschrieben (${reasonLabel}).`,
      eyebrow: 'Guthaben gutgeschrieben',
      title: `${amountStr} für dich freigegeben`,
      headerTagline: 'Creator-Konto',
      children: body,
      footerNote: 'Automatische Abrechnungs-Benachrichtigung aus deinem UGC VZ Creator-Konto.',
    }),
    text: `Hallo ${firstName},\n\n${brandName} hat deine Leistung für "${campaignTitle}" freigegeben (${reasonLabel}).\nGutgeschrieben: ${amountStr} (0 % Creator-Gebühr).\n\nGuthaben im Konto ansehen & auszahlen:\n${walletUrl}\n\nUGC VZ · track by track GmbH · Berlin`,
  };
}

export function buildCreatorRevisionNotification({
  creatorName,
  brandName,
  campaignTitle,
  reviewNote,
}: {
  creatorName: string;
  brandName: string;
  campaignTitle: string;
  reviewNote: string;
}) {
  const firstName = creatorName.trim().split(/\s+/)[0] || 'Creator';
  const portalUrl = `${BASE_URL}/konto/kampagnen`;
  const e = htmlEscape;

  const body = `<tr>
    <td class="email-pad" style="padding:8px 42px 32px;">
      <p style="margin:0;font-size:16px;line-height:26px;color:#202124;">Hallo ${e(firstName)},</p>
      <p style="margin:14px 0 0;font-size:15px;line-height:25px;color:#5C6470;">
        <strong style="color:#202124;">${e(brandName)}</strong> hat zu deinem eingereichten Beitrag für <strong style="color:#202124;">„${e(campaignTitle)}“</strong> eine kurze Rückmeldung hinterlassen:
      </p>
      <div style="margin:20px 0;padding:16px 18px;border-radius:12px;background:#F5F7FA;border-left:4px solid #F2072A;font-size:14px;line-height:22px;color:#202124;">
        ${e(reviewNote || 'Bitte prüfe die Hinweise im Briefing und lade eine angepasste Version hoch.')}
      </div>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0;">
        <tr>
          <td style="border-radius:8px;background:#06458F;">
            <a href="${e(portalUrl)}" style="display:inline-block;padding:14px 24px;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;">Im Creator-Konto ansehen &rarr;</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

  return {
    subject: `Kurze Rückmeldung zu deinem Beitrag (${campaignTitle})`,
    html: emailShell({
      preheader: `${brandName} hat eine Rückmeldung zu deinem Beitrag hinterlassen.`,
      eyebrow: 'Rückmeldung',
      title: 'Kleine Anpassung angefragt',
      headerTagline: 'Creator-Konto',
      children: body,
      footerNote: 'Status-Meldung zu deiner aktiven Kampagne im UGC VZ Creator-Konto.',
    }),
    text: `Hallo ${firstName},\n\n${brandName} hat eine Rückmeldung zu deinem Beitrag für "${campaignTitle}" hinterlassen:\n${reviewNote}\n\nIm Creator-Konto ansehen:\n${portalUrl}\n\nUGC VZ · track by track GmbH · Berlin`,
  };
}

/**
 * Best-effort Versand fuer Portal-Benachrichtigungen (blockiert niemals die API-Antwort).
 */
export async function sendCampaignNotificationEmail(payload: CampaignNotificationPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || !payload.to || !payload.to.includes('@')) return false;
  try {
    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;
    await resend.emails.send({
      from,
      to: payload.to.trim(),
      replyTo: 'hi@ugc-vz.de',
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      tags: [
        { name: 'category', value: payload.category },
        { name: 'audience', value: payload.audience },
      ],
    });
    return true;
  } catch (err) {
    console.error('Campaign notification email failed:', payload.category, err instanceof Error ? err.message : 'unknown');
    return false;
  }
}

import { emailShell, htmlEscape } from './email-shell';

export const BRAND_LOGIN_TTL_MINUTES = 30;

/**
 * Reine Transaktionsmail fuer den Marken-Login (kein Werbeblock, klarer Code im Betreff),
 * damit Mailanbieter wie Gmail sie im primaeren Posteingang zustellen.
 */
export function buildBrandLoginEmail({
  name,
  company,
  loginUrl,
  otpCode,
  campaignTitle,
  invitedCount = 0,
}: {
  name?: string;
  company?: string;
  loginUrl: string;
  otpCode?: string;
  campaignTitle?: string;
  invitedCount?: number;
}) {
  const greetingName = (name || company || '').trim().split(/\s+/)[0] || 'Team';
  const safeUrl = htmlEscape(loginUrl);
  const safeCode = otpCode ? htmlEscape(otpCode) : '';
  const hasCampaign = Boolean(campaignTitle);

  const intro = hasCampaign
    ? `deine Kampagne <strong style="color:#202124;">„${htmlEscape(campaignTitle!)}“</strong> ist in deinem Marken-Konto bei UGC VZ angelegt${invitedCount > 0 ? ` (${invitedCount} Creator direkt eingeladen)` : ''}. Gib den Code im Browser ein oder klicke auf den Link.`
    : 'hier ist dein Anmeldecode für dein Marken-Konto bei UGC VZ. Gib den 6-stelligen Code direkt im Browser ein oder öffne den Link.';

  const ctaLabel = hasCampaign ? 'Kampagne öffnen' : 'Jetzt anmelden';

  const codeBlock = safeCode
    ? `<div style="margin:22px 0;padding:18px 20px;border-radius:12px;background:#F5F7FA;border:1px solid #DCE2EA;text-align:center;">
         <div style="font-size:12px;font-weight:700;color:#5C6470;">Dein 6-stelliger Anmeldecode</div>
         <div style="margin-top:8px;font-size:32px;line-height:38px;font-weight:800;letter-spacing:.26em;color:#06458F;font-family:monospace;">${safeCode}</div>
       </div>`
    : '';

  const body = `<tr>
    <td class="email-pad" style="padding:8px 42px 30px;">
      <p style="margin:0;font-size:16px;line-height:26px;color:#202124;">Hallo ${htmlEscape(greetingName)},</p>
      <p style="margin:14px 0 0;font-size:16px;line-height:26px;color:#5C6470;">${intro}</p>
      ${codeBlock}
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0;">
        <tr>
          <td style="border-radius:8px;background:#06458F;">
            <a href="${safeUrl}" style="display:inline-block;padding:14px 24px;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;">${ctaLabel}</a>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:13px;line-height:20px;color:#5C6470;">Code und Link sind ${BRAND_LOGIN_TTL_MINUTES} Minuten gültig. Falls du diesen Code nicht angefordert hast, ignoriere diese E-Mail einfach.</p>
    </td>
  </tr>`;

  return {
    subject: safeCode
      ? hasCampaign
        ? `${otpCode} ist dein UGC VZ Code (${campaignTitle})`
        : `${otpCode} ist dein UGC VZ Anmeldecode`
      : hasCampaign
        ? `Deine Kampagne „${campaignTitle}“ bei UGC VZ öffnen`
        : 'Dein Anmeldelink für UGC VZ',
    html: emailShell({
      preheader: safeCode
        ? `Dein Anmeldecode lautet ${otpCode}. Gültig für ${BRAND_LOGIN_TTL_MINUTES} Minuten.`
        : 'Dein persönlicher Anmeldelink für UGC VZ.',
      eyebrow: 'Anmeldung',
      title: hasCampaign ? 'Deine Kampagne ist bereit' : 'Dein Anmeldecode',
      headerTagline: 'Anmeldung',
      children: body,
      footerNote: 'Diese transaktionale E-Mail erhältst du, weil für deine Adresse eine Anmeldung bei UGC VZ angefordert wurde.',
    }),
    text: `Hallo ${greetingName},\n\n${otpCode ? `dein 6-stelliger Anmeldecode für UGC VZ lautet: ${otpCode}\n\n` : ''}${hasCampaign ? `Deine Kampagne "${campaignTitle}" ist in deinem Marken-Konto bei UGC VZ angelegt.` : 'Hier ist dein Zugang für dein Marken-Konto bei UGC VZ.'}\n\nAlternativ per Link öffnen:\n${loginUrl}\n\nCode und Link sind ${BRAND_LOGIN_TTL_MINUTES} Minuten gültig. Falls du das nicht warst, ignoriere diese Nachricht einfach.\n\nUGC VZ · track by track GmbH · Schliemannstr. 23, 10437 Berlin · hi@ugc-vz.de`,
  };
}

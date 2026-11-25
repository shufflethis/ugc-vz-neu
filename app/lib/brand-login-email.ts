import { emailShell, htmlEscape } from './email-shell';

export const BRAND_LOGIN_TTL_MINUTES = 30;

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
    ? `deine Kampagne <strong style="color:#21172a;">„${htmlEscape(campaignTitle!)}“</strong> ist in deinem UGC-VZ Brand-Workspace angelegt${invitedCount > 0 ? ` (${invitedCount} Creator direkt eingeladen)` : ''}. Öffne jetzt dein Dashboard, um Bewerbungen zu prüfen, Beiträge freizugeben und Views zentral zu tracken.`
    : 'hier ist dein persönlicher Zugang für dein UGC-VZ Brand-Konto. Gib einfach den 6-stelligen Code direkt auf der Seite ein oder klicke auf den Button.';

  const ctaLabel = hasCampaign ? 'Kampagne & Workspace öffnen' : 'Brand-Workspace öffnen';

  const codeBlock = safeCode
    ? `<div style="margin:22px 0;padding:18px 20px;border-radius:14px;background:#f7f2fc;border:1px solid #d9c3f0;text-align:center;">
         <div style="font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6f2fa9;">Dein 6-stelliger Anmeldecode</div>
         <div style="margin-top:8px;font-size:32px;line-height:38px;font-weight:800;letter-spacing:.26em;color:#17121f;font-family:monospace;">${safeCode}</div>
         <div style="margin-top:6px;font-size:12px;color:#5f5666;">Einfach direkt im Browser eintippen (funktioniert auch, wenn Mailprogramme Links blockieren).</div>
       </div>`
    : '';

  const body = `<tr>
    <td class="email-pad" style="padding:8px 42px 30px;">
      <p style="margin:0;font-size:16px;line-height:26px;color:#4a4052;">Hallo ${htmlEscape(greetingName)},</p>
      <p style="margin:14px 0 0;font-size:16px;line-height:26px;color:#4a4052;">${intro}</p>
      ${codeBlock}
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0;">
        <tr>
          <td style="border-radius:12px;background:#8b3fca;">
            <a href="${safeUrl}" style="display:inline-block;padding:15px 26px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;">${ctaLabel}</a>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:13px;line-height:20px;color:#746b7c;">Code und Link sind ${BRAND_LOGIN_TTL_MINUTES} Minuten gültig und gegen automatische Mail-Scanner geschützt. Kein Passwort nötig.</p>
      <div style="margin:24px 0 0;padding:18px 20px;border-radius:12px;background:#f4effa;border:1px solid #e0d2f2;">
        <div style="font-size:14px;line-height:22px;font-weight:800;color:#21172a;">Das erledigst du direkt im Brand-Workspace:</div>
        <ul style="margin:8px 0 0;padding-left:18px;font-size:13px;line-height:22px;color:#4a4052;">
          <li>View-Kampagnen (TKP) mit optionalem Budget-Limit oder Produkt-Tests anlegen</li>
          <li>Creator-Bewerbungen mit Zielplattformen &amp; verifizierten Social-Badges prüfen</li>
          <li>Eingereichte Clips gegen deine Checkliste freigeben &amp; Report als CSV oder Link teilen</li>
        </ul>
      </div>
    </td>
  </tr>`;

  return {
    subject: safeCode
      ? hasCampaign
        ? `Dein Code für UGC VZ: ${otpCode} (Kampagne „${campaignTitle}“)`
        : `Dein Code für UGC VZ: ${otpCode} (Brand-Workspace)`
      : hasCampaign
        ? `Deine Kampagne „${campaignTitle}“ im Brand-Workspace öffnen | UGC VZ`
        : 'Dein Anmeldelink für das UGC-VZ Brand-Konto',
    html: emailShell({
      preheader: safeCode
        ? `Dein Anmeldecode: ${otpCode}. Direkt im Browser eintippen oder per Klick anmelden.`
        : 'Ein Klick in deinen UGC-VZ Brand-Workspace (kein Passwort nötig)',
      eyebrow: 'Brand-Workspace',
      title: hasCampaign ? 'Deine Kampagne ist bereit' : 'Brand-Workspace öffnen',
      children: body,
      footerNote: 'Diese E-Mail erhältst du, weil für diese Adresse ein Zugang zum UGC-VZ Brand-Workspace angefordert wurde.',
    }),
    text: `Hallo ${greetingName},\n\n${otpCode ? `dein 6-stelliger Anmeldecode für UGC VZ lautet: ${otpCode}\n\n` : ''}${hasCampaign ? `Deine Kampagne "${campaignTitle}" ist im UGC-VZ Brand-Workspace angelegt.` : 'Hier ist dein persönlicher Zugang für dein UGC-VZ Brand-Konto.'}\n\nAlternativ per Link öffnen:\n${loginUrl}\n\nCode und Link sind ${BRAND_LOGIN_TTL_MINUTES} Minuten gültig.\n\nViele Grüße\nUGC VZ`,
  };
}

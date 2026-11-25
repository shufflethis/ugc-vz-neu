import { emailShell, htmlEscape } from './email-shell';

export const BRAND_LOGIN_TTL_MINUTES = 30;

export function buildBrandLoginEmail({
  name,
  company,
  loginUrl,
  campaignTitle,
  invitedCount = 0,
}: {
  name?: string;
  company?: string;
  loginUrl: string;
  campaignTitle?: string;
  invitedCount?: number;
}) {
  const greetingName = (name || company || '').trim().split(/\s+/)[0] || 'Team';
  const safeUrl = htmlEscape(loginUrl);
  const hasCampaign = Boolean(campaignTitle);

  const intro = hasCampaign
    ? `deine Kampagne <strong style="color:#21172a;">„${htmlEscape(campaignTitle!)}“</strong> ist in deinem kostenlosen UGC-VZ Brand-Workspace angelegt${invitedCount > 0 ? ` (${invitedCount} Creator direkt eingeladen)` : ''}. Öffne jetzt dein Dashboard, um Bewerbungen zu prüfen, Creator auszuwählen, Content freizugeben und die Performance zentral zu tracken.`
    : 'hier ist dein persönlicher Anmeldelink für dein UGC-VZ Brand-Konto. Im Workspace kannst du Kampagnen ausschreiben, ausgewählte Creator verwalten, eingereichte Clips freigeben und Performance-Reports exportieren.';

  const ctaLabel = hasCampaign ? 'Kampagne & Workspace öffnen' : 'Brand-Workspace öffnen';

  const body = `<tr>
    <td class="email-pad" style="padding:8px 42px 30px;">
      <p style="margin:0;font-size:16px;line-height:26px;color:#4a4052;">Hallo ${htmlEscape(greetingName)},</p>
      <p style="margin:14px 0 0;font-size:16px;line-height:26px;color:#4a4052;">${intro}</p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0;">
        <tr>
          <td style="border-radius:12px;background:#8b3fca;">
            <a href="${safeUrl}" style="display:inline-block;padding:15px 26px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;">${ctaLabel}</a>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:13px;line-height:20px;color:#746b7c;">Der Link ist ${BRAND_LOGIN_TTL_MINUTES} Minuten gültig und für deinen Klick geschützt (Mail-Scanner verbrauchen ihn nicht vorab). Kein Passwort nötig.</p>
      <div style="margin:24px 0 0;padding:18px 20px;border-radius:12px;background:#f4effa;border:1px solid #e0d2f2;">
        <div style="font-size:14px;line-height:22px;font-weight:800;color:#21172a;">Das kannst du direkt im Brand-Workspace erledigen:</div>
        <ul style="margin:8px 0 0;padding-left:18px;font-size:13px;line-height:22px;color:#4a4052;">
          <li>Creator direkt einladen oder Kampagne für 750+ Profile ausschreiben</li>
          <li>Angebote, Verfügbarkeiten &amp; verifizierte Social-Accounts (IG/TikTok) vergleichen</li>
          <li>Eingereichte Clips freigeben &amp; Views, Engagement und TKP/CPM reporten</li>
        </ul>
      </div>
    </td>
  </tr>`;

  return {
    subject: hasCampaign
      ? `Deine Kampagne „${campaignTitle}“ im Brand-Workspace öffnen | UGC VZ`
      : 'Dein Anmeldelink für das UGC-VZ Brand-Konto',
    html: emailShell({
      preheader: hasCampaign
        ? `Kampagne „${campaignTitle}“ verwalten, Creator auswählen & Performance tracken`
        : 'Ein Klick in deinen UGC-VZ Brand-Workspace (kein Passwort nötig)',
      eyebrow: 'Brand-Workspace',
      title: hasCampaign ? 'Deine Kampagne ist bereit' : 'Willkommen im Brand-Workspace',
      children: body,
      footerNote: 'Diese E-Mail erhältst du, weil für diese Adresse ein Zugang zum UGC-VZ Brand-Workspace angefordert wurde.',
    }),
    text: `Hallo ${greetingName},\n\n${hasCampaign ? `deine Kampagne "${campaignTitle}" ist im UGC-VZ Brand-Workspace angelegt.` : 'hier ist dein persönlicher Anmeldelink für dein UGC-VZ Brand-Konto:'}\n\nWorkspace öffnen:\n${loginUrl}\n\nDer Link ist ${BRAND_LOGIN_TTL_MINUTES} Minuten gültig.\n\nViele Grüße\nUGC VZ`,
  };
}

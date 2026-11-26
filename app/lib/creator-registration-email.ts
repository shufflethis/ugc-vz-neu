import { emailShell, htmlEscape } from './email-shell';

export const buildCreatorVerificationEmail = ({
  name,
  verificationUrl,
  otpCode,
}: {
  name: string;
  verificationUrl: string;
  otpCode?: string;
}) => {
  const firstName = name.trim().split(/\s+/)[0] || 'Creator';
  const safeUrl = htmlEscape(verificationUrl);
  const cleanCode = otpCode ? otpCode.replace(/\D/g, '').slice(0, 6) : '';
  const subject = cleanCode
    ? `${cleanCode} ist dein UGC VZ Bestätigungscode`
    : 'Bestätige dein kostenloses UGC VZ Konto';

  const codeBlockHtml = cleanCode
    ? `<div style="margin:22px 0;padding:20px 22px;border-radius:12px;background:#F5F7FA;border:1px solid #C4D7EF;text-align:center;">
        <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#5C6470;font-weight:700;">Dein 6-stelliger Bestätigungscode</div>
        <div style="margin-top:8px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:34px;line-height:40px;letter-spacing:8px;font-weight:800;color:#06458F;">${htmlEscape(cleanCode)}</div>
        <div style="margin-top:8px;font-size:12px;color:#5C6470;">Gültig für 20 Minuten. Direkt im Browser auf ugc-vz.de eingeben.</div>
      </div>`
    : '';

  const codeBlockText = cleanCode
    ? `\nDein 6-stelliger Bestätigungscode (gültig 20 Minuten):\n${cleanCode}\n\nOder aktiviere dein Konto direkt über diesen Link:\n`
    : '\nKlicke auf diesen Link, um dein Konto zu aktivieren:\n';

  const body = `<tr>
    <td class="email-pad" style="padding:8px 42px 32px;">
      <p style="margin:0;font-size:16px;line-height:26px;color:#202124;">Hallo ${htmlEscape(firstName)},</p>
      <p style="margin:14px 0 0;font-size:15px;line-height:25px;color:#5C6470;">
        bestätige kurz dein kostenloses Creator-Konto bei UGC VZ. Danach siehst du direkt alle offenen Kampagnen und kannst dein Profil verwalten.
      </p>
      ${codeBlockHtml}
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0;">
        <tr>
          <td style="border-radius:8px;background:#06458F;">
            <a href="${safeUrl}" style="display:inline-block;padding:14px 24px;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;">Konto direkt bestätigen &rarr;</a>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:13px;line-height:20px;color:#5C6470;">
        Der Bestätigungslink ist 24 Stunden gültig. Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br />
        <a href="${safeUrl}" style="color:#06458F;word-break:break-all;">${safeUrl}</a>
      </p>
    </td>
  </tr>`;

  return {
    subject,
    html: emailShell({
      preheader: cleanCode
        ? `Dein Bestätigungscode lautet ${cleanCode}. Direkt eingeben oder per Klick bestätigen.`
        : 'Ein Klick genügt, dann ist dein kostenloses Creator-Konto bei UGC VZ aktiv.',
      eyebrow: 'Registrierung',
      title: 'Konto bestätigen',
      headerTagline: 'Creator-Konto',
      children: body,
      footerNote: 'Diese transaktionale E-Mail erhältst du, weil diese Adresse gerade bei UGC VZ als Creator angemeldet wurde.',
    }),
    text: `Hallo ${firstName},\n\nbestätige kurz dein kostenloses Creator-Konto bei UGC VZ. Danach siehst du direkt alle offenen Kampagnen und kannst dein Profil verwalten.${codeBlockText}${verificationUrl}\n\nDer Bestätigungslink ist 24 Stunden gültig. Wenn du Fragen hast, antworte einfach auf diese E-Mail.\n\nUGC VZ ist ein Service der track by track GmbH, Schliemannstr. 23, 10437 Berlin.\nImpressum: https://ugc-vz.de/impressum · Datenschutz: https://ugc-vz.de/datenschutz · hi@ugc-vz.de`,
  };
};

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

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
  const safeUrl = escapeHtml(verificationUrl);
  const cleanCode = otpCode ? otpCode.replace(/\D/g, '').slice(0, 6) : '';
  const subject = cleanCode
    ? `Bestätige dein UGC VZ Konto: Code ${cleanCode}`
    : 'Bestätige dein kostenloses UGC VZ Konto';

  const codeBlockHtml = cleanCode
    ? `<div style="margin:22px 0;padding:18px 20px;border-radius:12px;background:#F5F7FA;border:1px solid #DCE2EA;text-align:center;">
        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#5C6470;font-weight:700;">Dein 6-stelliger Bestätigungscode</div>
        <div style="margin-top:8px;font-family:monospace;font-size:34px;letter-spacing:8px;font-weight:800;color:#06458F;">${escapeHtml(cleanCode)}</div>
        <div style="margin-top:6px;font-size:12px;color:#5C6470;">Gültig für 20 Minuten. Direkt auf ugc-vz.de eingeben.</div>
      </div>`
    : '';

  const codeBlockText = cleanCode
    ? `\nDein 6-stelliger Bestätigungscode (gültig 20 Minuten):\n${cleanCode}\n\nOder aktiviere dein Konto direkt über diesen Link:\n`
    : '\nKlicke auf diesen Link, um dein Konto zu aktivieren:\n';

  return {
    subject,
    html: `<!doctype html>
<html lang="de">
  <body style="margin:0;background:#F5F7FA;font-family:Inter,Arial,Helvetica,sans-serif;color:#202124;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F7FA;padding:28px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #DCE2EA;border-radius:12px;overflow:hidden;">
          <tr><td style="height:4px;background:#06458F;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr><td style="padding:22px 28px;background:#ffffff;border-bottom:1px solid #DCE2EA;">
            <img src="https://ugc-vz.de/brand/ugcvz-logo-header.png" alt="UGC VZ" height="32" style="display:block;height:32px;width:auto;border:0;" />
            <div style="margin-top:14px;font-size:24px;line-height:30px;font-weight:800;color:#202124;">Konto bestätigen</div>
          </td></tr>
          <tr><td style="padding:28px;">
            <p style="margin:0;font-size:16px;line-height:24px;color:#202124;">Hallo ${escapeHtml(firstName)},</p>
            <p style="margin:14px 0 0;font-size:15px;line-height:24px;color:#5C6470;">bestätige dein kostenloses Creator-Konto bei UGC VZ, dann siehst du direkt alle offenen Kampagnen.</p>
            ${codeBlockHtml}
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0;">
              <tr><td style="border-radius:8px;background:#06458F;">
                <a href="${safeUrl}" style="display:inline-block;padding:13px 24px;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;">Konto direkt bestätigen</a>
              </td></tr>
            </table>
            <p style="margin:18px 0 0;font-size:13px;line-height:20px;color:#5C6470;">Der Link ist 24 Stunden gültig. Wenn du Fragen hast, antworte einfach auf diese E-Mail.</p>
          </td></tr>
          <tr><td style="padding:18px 28px;border-top:1px solid #DCE2EA;background:#F5F7FA;font-size:12px;line-height:18px;color:#5C6470;">UGC VZ ist ein Produkt der track by track GmbH, Schliemannstr. 23, 10437 Berlin.<br /><a href="https://ugc-vz.de/impressum" style="color:#06458F;text-decoration:none;font-weight:600;">Impressum</a> · <a href="https://ugc-vz.de/datenschutz" style="color:#06458F;text-decoration:none;font-weight:600;">Datenschutz</a> · <a href="mailto:hi@ugc-vz.de" style="color:#06458F;text-decoration:none;font-weight:600;">hi@ugc-vz.de</a></td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
    text: `Hallo ${firstName},\n\nbestätige dein kostenloses Creator-Konto bei UGC VZ, dann siehst du direkt alle offenen Kampagnen.${codeBlockText}${verificationUrl}\n\nDer Link ist 24 Stunden gültig. Wenn du Fragen hast, antworte einfach auf diese E-Mail.\n\nUGC VZ ist ein Produkt der track by track GmbH, Schliemannstr. 23, 10437 Berlin.\nImpressum: https://ugc-vz.de/impressum · Datenschutz: https://ugc-vz.de/datenschutz · hi@ugc-vz.de`,
  };
};

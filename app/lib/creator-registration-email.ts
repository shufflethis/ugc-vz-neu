const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export const buildCreatorVerificationEmail = ({
  name,
  verificationUrl,
}: {
  name: string;
  verificationUrl: string;
}) => {
  const firstName = name.trim().split(/\s+/)[0] || 'Creator';
  const safeUrl = escapeHtml(verificationUrl);

  return {
    subject: 'Bestätige dein kostenloses UGC-VZ-Profil',
    html: `<!doctype html>
<html lang="de">
  <body style="margin:0;background:#f2f1ee;font-family:Arial,Helvetica,sans-serif;color:#21172a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Ein Klick, dann kann dein Creator-Profil für passende Brand-Anfragen berücksichtigt werden.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f1ee;padding:28px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e5e1e8;border-radius:18px;overflow:hidden;">
          <tr><td style="padding:26px 30px;background:#17121d;color:#ffffff;">
            <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#a8e06a;font-weight:800;">UGC VZ · kostenlos</div>
            <div style="margin-top:8px;font-size:28px;line-height:34px;font-weight:800;">Dein Creator-Profil ist fast bereit</div>
          </td></tr>
          <tr><td style="padding:32px 30px;">
            <p style="margin:0;font-size:18px;line-height:28px;">Hallo ${escapeHtml(firstName)},</p>
            <p style="margin:18px 0 0;font-size:16px;line-height:26px;color:#5f5666;">bestätige jetzt deine E-Mail-Adresse. Danach wird dein Profil im kostenlosen UGC-Verzeichnis aktiviert und kann bei passenden Brand-Anfragen vorgeschlagen werden.</p>
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0;">
              <tr><td style="border-radius:10px;background:#8b3fca;">
                <a href="${safeUrl}" style="display:inline-block;padding:15px 24px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;">Profil bestätigen</a>
              </td></tr>
            </table>
            <div style="padding:17px 18px;border-radius:12px;background:#f7f7f5;border:1px solid #e8e8e4;font-size:14px;line-height:22px;color:#5f5666;">
              <strong style="color:#21172a;">Was danach passiert:</strong><br />
              Brands können dein öffentliches Profil finden. Private Kontaktdaten werden nur für konkrete Anfragen verwendet. UGC VZ bleibt für dich kostenlos und verlangt keine Provision.
            </div>
            <p style="margin:22px 0 0;font-size:13px;line-height:20px;color:#7a717f;">Der Link ist 24 Stunden gültig. Falls du dich nicht angemeldet hast, kannst du diese E-Mail ignorieren.</p>
          </td></tr>
          <tr><td style="padding:20px 30px;border-top:1px solid #ece8ee;font-size:12px;line-height:19px;color:#817887;">UGC VZ ist ein Service der track by track GmbH · Schliemannstr. 23, 10437 Berlin<br /><a href="https://ugc-vz.de/impressum" style="color:#6f2fa9;text-decoration:none;">Impressum</a> · <a href="https://ugc-vz.de/datenschutz" style="color:#6f2fa9;text-decoration:none;">Datenschutz</a> · Kontakt: <a href="mailto:hi@ugc-vz.de" style="color:#6f2fa9;text-decoration:none;">hi@ugc-vz.de</a></td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
    text: `Hallo ${firstName},\n\nbestätige deine E-Mail-Adresse, damit dein kostenloses UGC-VZ-Profil aktiviert werden kann:\n${verificationUrl}\n\nBrands können danach dein öffentliches Profil finden. Private Kontaktdaten verwenden wir nur für konkrete Anfragen. UGC VZ bleibt kostenlos und verlangt keine Provision.\n\nDer Link ist 24 Stunden gültig. Falls du dich nicht angemeldet hast, ignoriere diese E-Mail.\n\nUGC VZ ist ein Service der track by track GmbH · Schliemannstr. 23, 10437 Berlin\nImpressum: https://ugc-vz.de/impressum · Datenschutz: https://ugc-vz.de/datenschutz · Kontakt: hi@ugc-vz.de`,
  };
};

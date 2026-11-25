import crypto from 'node:crypto';
import { htmlEscape, emailShell } from './email-shell';

export const CREATOR_LOGIN_TTL_MINUTES = 20;

export const hashCreatorOtp = (email: string, code: string) =>
  crypto.createHash('sha256').update(`creator_otp:${email.toLowerCase().trim()}:${code.trim()}`).digest('hex');

/**
 * Aktivierungs- und Login-Mail fuer Creator:
 * 6-stelliger Einmal-Code direkt im Betreff und oben im Text (funktioniert unabhaengig
 * von In-App-Browsern und Mail-Scannern) plus geschuetzter Bestaetigungs-Button.
 */
export const buildCreatorLoginEmail = ({
  name,
  loginUrl,
  otpCode,
  isActivation = false,
}: {
  name: string;
  loginUrl: string;
  otpCode?: string;
  isActivation?: boolean;
}) => {
  const firstName = name.trim().split(/\s+/)[0] || 'Creator';
  const safeUrl = htmlEscape(loginUrl);
  const safeCode = otpCode ? htmlEscape(otpCode) : '';

  const codeBlock = safeCode
    ? `<div style="margin:22px 0;padding:18px 20px;border-radius:14px;background:#f7f2fc;border:1px solid #d9c3f0;text-align:center;">
         <div style="font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6f2fa9;">Dein 6-stelliger Code</div>
         <div style="margin-top:8px;font-size:32px;line-height:38px;font-weight:800;letter-spacing:.26em;color:#17121f;font-family:monospace;">${safeCode}</div>
         <div style="margin-top:6px;font-size:12px;color:#5f5666;">Einfach direkt auf ugc-vz.de/konto eingeben.</div>
       </div>`
    : '';

  const introText = isActivation
    ? 'dein Profil bei UGC VZ ist fast startklar. Gib diesen Code auf der Seite ein oder klicke auf den Button, um dein Konto zu aktivieren und direkt zu öffnen.'
    : 'hier ist dein persönlicher Zugang zu deinem UGC-VZ Creator-Konto. Gib den 6-stelligen Code direkt im Browser ein oder klicke auf den Button.';

  const body = `<tr>
    <td class="email-pad" style="padding:8px 42px 30px;">
      <p style="margin:0;font-size:16px;line-height:26px;">Hallo ${htmlEscape(firstName)},</p>
      <p style="margin:14px 0 0;font-size:16px;line-height:26px;">${introText}</p>
      ${codeBlock}
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0;">
        <tr>
          <td style="border-radius:12px;background:#8b3fca;">
            <a href="${safeUrl}" style="display:inline-block;padding:15px 26px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;">${isActivation ? 'Konto jetzt bestätigen' : 'Creator-Konto öffnen'}</a>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:13px;line-height:20px;color:#746b7c;">Code und Link sind ${CREATOR_LOGIN_TTL_MINUTES} Minuten gültig und gegen automatische Mail-Scanner geschützt. Falls du dich nicht angemeldet hast, ignoriere diese E-Mail einfach.</p>

      <div style="margin:24px 0 0;padding:18px 20px;border-radius:12px;background:#f4effa;border:1px solid #e0d2f2;">
        <div style="font-size:15px;line-height:22px;font-weight:800;color:#17121f;">Direkt danach empfohlen: Social-Kanäle verifizieren</div>
        <p style="margin:8px 0 0;font-size:14px;line-height:22px;color:#5f5666;">Verifizierte TikTok- und Instagram-Profile werden bei Brands zuerst angezeigt und sind direkt für offene View-Kampagnen sowie feste Creator-Programme freigeschaltet.</p>
      </div>
    </td>
  </tr>`;

  return {
    subject: safeCode
      ? `Dein Code für UGC VZ: ${otpCode} (Creator-Konto)`
      : 'Dein Anmeldelink für dein UGC-VZ-Profil',
    html: emailShell({
      preheader: safeCode
        ? `Dein Code: ${otpCode}. Direkt eingeben und dein Creator-Konto sowie offene Kampagnen öffnen.`
        : 'Ein Klick und du kannst dein Creator-Profil und offene Kampagnen öffnen.',
      eyebrow: 'Creator-Konto',
      title: isActivation ? 'Konto jetzt aktivieren' : 'Dein Creator-Zugang',
      children: body,
      footerNote: 'Diese E-Mail erhältst du, weil über deine Adresse ein Zugang für das UGC-VZ Creator-Konto angefordert wurde.',
    }),
    text: `Hallo ${firstName},\n\n${otpCode ? `dein 6-stelliger Code für UGC VZ lautet: ${otpCode}\n\n` : ''}${introText}\n\nAlternativ per Button/Link öffnen:\n${loginUrl}\n\nDirekt danach empfehlen wir dir, deinen TikTok- oder Instagram-Account in deinem Konto zu verifizieren. Verifizierte Profile werden bei Brands zuerst angezeigt und sind sofort für offene View-Kampagnen und Creator-Programme freigeschaltet.\n\nCode und Link sind ${CREATOR_LOGIN_TTL_MINUTES} Minuten gültig. Wenn du Fragen hast, antworte einfach direkt auf diese Mail.\n\nUGC VZ ist ein Service der track by track GmbH · Schliemannstr. 23, 10437 Berlin\nImpressum: https://ugc-vz.de/impressum · Datenschutz: https://ugc-vz.de/datenschutz · Kontakt: hi@ugc-vz.de`,
  };
};

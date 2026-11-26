import crypto from 'node:crypto';
import { htmlEscape, emailShell } from './email-shell';

export const CREATOR_LOGIN_TTL_MINUTES = 20;

export const hashCreatorOtp = (email: string, code: string) =>
  crypto.createHash('sha256').update(`creator_otp:${email.toLowerCase().trim()}:${code.trim()}`).digest('hex');

/**
 * Reine Transaktionsmail fuer den Creator-Login (Code im Betreff, keine Werbebloecke),
 * damit Gmail und Outlook die Nachricht direkt im Posteingang zustellen.
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
    ? `<div style="margin:22px 0;padding:18px 20px;border-radius:12px;background:#F5F7FA;border:1px solid #DCE2EA;text-align:center;">
         <div style="font-size:12px;font-weight:700;color:#5C6470;">Dein 6-stelliger Anmeldecode</div>
         <div style="margin-top:8px;font-size:32px;line-height:38px;font-weight:800;letter-spacing:.26em;color:#06458F;font-family:monospace;">${safeCode}</div>
       </div>`
    : '';

  const introText = isActivation
    ? 'dein Creator-Profil bei UGC VZ ist fast bereit. Gib diesen Code auf ugc-vz.de/konto ein oder klicke auf den Button, um dein Konto zu bestätigen und zu öffnen.'
    : 'hier ist dein Anmeldecode für dein Creator-Konto bei UGC VZ. Gib den 6-stelligen Code direkt im Browser ein oder klicke auf den Button.';

  const body = `<tr>
    <td class="email-pad" style="padding:8px 42px 30px;">
      <p style="margin:0;font-size:16px;line-height:26px;color:#202124;">Hallo ${htmlEscape(firstName)},</p>
      <p style="margin:14px 0 0;font-size:16px;line-height:26px;color:#5C6470;">${introText}</p>
      ${codeBlock}
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0;">
        <tr>
          <td style="border-radius:8px;background:#06458F;">
            <a href="${safeUrl}" style="display:inline-block;padding:14px 24px;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;">${isActivation ? 'Konto bestätigen' : 'Creator-Konto öffnen'}</a>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:13px;line-height:20px;color:#5C6470;">Code und Link sind ${CREATOR_LOGIN_TTL_MINUTES} Minuten gültig. Falls du dich nicht angemeldet hast, ignoriere diese E-Mail einfach.</p>
    </td>
  </tr>`;

  return {
    subject: safeCode
      ? `${otpCode} ist dein UGC VZ Code (Creator-Konto)`
      : 'Dein Anmeldelink für dein UGC VZ Creator-Konto',
    html: emailShell({
      preheader: safeCode
        ? `Dein Anmeldecode lautet ${otpCode}. Gültig für ${CREATOR_LOGIN_TTL_MINUTES} Minuten.`
        : 'Dein persönlicher Anmeldelink für dein Creator-Konto bei UGC VZ.',
      eyebrow: 'Creator-Konto',
      title: isActivation ? 'Konto bestätigen' : 'Dein Anmeldecode',
      headerTagline: 'Anmeldung',
      children: body,
      footerNote: 'Diese transaktionale E-Mail erhältst du, weil für deine Adresse eine Anmeldung im UGC VZ Creator-Konto angefordert wurde.',
    }),
    text: `Hallo ${firstName},\n\n${otpCode ? `dein 6-stelliger Anmeldecode für UGC VZ lautet: ${otpCode}\n\n` : ''}${introText}\n\nAlternativ per Link öffnen:\n${loginUrl}\n\nCode und Link sind ${CREATOR_LOGIN_TTL_MINUTES} Minuten gültig. Falls du dich nicht angemeldet hast, ignoriere diese Nachricht einfach.\n\nUGC VZ · track by track GmbH · Schliemannstr. 23, 10437 Berlin · hi@ugc-vz.de`,
  };
};

/**
 * Willkommensmail nach bestaetigter Registrierung (ugcVZ Rot-Blau CI).
 *
 * Bewusst getrennt von der Double-Opt-In-Bestaetigung: Die DOI-Mail bleibt rein
 * transaktional. Diese Willkommensmail geht erst nach erfolgreicher Aktivierung
 * raus und fuehrt Creator direkt in offene View-Kampagnen und ein starkes Profil.
 */
import { emailShell, htmlEscape } from './email-shell';

export const CREATOR_REFERRAL_URL = 'https://ugc-vz.de/brands?ref=creator-empfehlung';
export const CREATOR_INVITE_URL = 'https://ugc-vz.de/creator?ref=creator-einladung';
export const CREATOR_KONTO_URL = 'https://ugc-vz.de/konto';
export const CREATOR_CAMPAIGNS_URL = 'https://ugc-vz.de/konto/kampagnen';

const INVITE_SUBJECT = 'UGC VZ: Creator-Kampagnen mit 0 % Gebühr';
const INVITE_BODY = `Hey, ich bin bei UGC VZ aktiv. Anmeldung, Profil und Teilnahme an Creator-Kampagnen sind für Creator kostenlos (0 % Gebühr, du behältst 100 % vom View-Satz). Schau mal rein: ${CREATOR_INVITE_URL}`;
const INVITE_MAILTO = `mailto:?subject=${encodeURIComponent(INVITE_SUBJECT)}&body=${encodeURIComponent(INVITE_BODY)}`;

export const buildCreatorWelcomeEmail = ({
  name,
  publicId,
}: {
  name: string;
  publicId: string;
}) => {
  const firstName = name.trim().split(/\s+/)[0] || 'Creator';
  const safeName = htmlEscape(firstName);
  const safeId = htmlEscape(publicId);

  const body = `<tr>
    <td class="email-pad" style="padding:8px 42px 32px;">
      <p style="margin:0;font-size:17px;line-height:27px;color:#202124;">Hallo ${safeName},</p>
      <p style="margin:14px 0 0;font-size:15px;line-height:25px;color:#5C6470;">
        dein Creator-Profil <strong style="color:#202124;">${safeId}</strong> ist bestätigt und live. Ab sofort kannst du bei offenen View-Kampagnen mitmachen und wirst Marken aus Deutschland, Österreich und der Schweiz vorgeschlagen.
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 6px;">
        <tr>
          <td style="border-radius:8px;background:#06458F;">
            <a href="${CREATOR_CAMPAIGNS_URL}" style="display:inline-block;padding:14px 24px;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;">Offene Kampagnen ansehen &rarr;</a>
          </td>
        </tr>
      </table>

      <div style="margin:24px 0 0;padding:18px 20px;border-radius:12px;background:#F5F7FA;border:1px solid #DCE2EA;font-size:14px;line-height:22px;color:#5C6470;">
        <div style="font-size:12px;font-weight:800;letter-spacing:.9px;text-transform:uppercase;color:#06458F;">So startest du am schnellsten</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
          <tr>
            <td width="26" valign="top" style="font-weight:800;color:#06458F;padding-bottom:8px;">1.</td>
            <td style="padding-bottom:8px;color:#202124;"><strong>TikTok oder Instagram verbinden:</strong> Im Konto mit einem Klick verknüpfen, damit deine Views automatisch gezählt werden.</td>
          </tr>
          <tr>
            <td width="26" valign="top" style="font-weight:800;color:#06458F;padding-bottom:8px;">2.</td>
            <td style="padding-bottom:8px;color:#202124;"><strong>Offene Kampagne wählen:</strong> Du siehst vorher exakt, was pro 1.000 Views gezahlt wird. Für Creator fallen <strong>0 % Gebühren</strong> an.</td>
          </tr>
          <tr>
            <td width="26" valign="top" style="font-weight:800;color:#06458F;">3.</td>
            <td style="color:#202124;"><strong>Profil schärfen:</strong> Stadt, konkrete Themen (z. B. Skincare, Tech, Food) und Portfolio-Links erhöhen deine Chancen auf direkte Brand-Anfragen.</td>
          </tr>
        </table>
      </div>

      <div style="margin:22px 0 0;padding:20px 22px;border-radius:12px;background:#EBF2FA;border:1px solid #C4D7EF;">
        <div style="font-size:16px;line-height:23px;font-weight:800;color:#06458F;">Sag es weiter: Für Creator 0 % Gebühr</div>
        <p style="margin:8px 0 0;font-size:14px;line-height:22px;color:#202124;">
          Kennst du andere Creator, die faire View-Kampagnen und direkte Brand-Aufträge suchen? Leite ihnen den Link weiter. Anmeldung, Profil und Teilnahme bleiben für Creator dauerhaft kostenlos.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin:16px 0 0;">
          <tr>
            <td style="border-radius:8px;background:#06458F;">
              <a href="${htmlEscape(INVITE_MAILTO)}" style="display:inline-block;padding:11px 18px;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;">Anderen Creatorn weiterleiten</a>
            </td>
          </tr>
        </table>
        <p style="margin:14px 0 0;padding-top:12px;border-top:1px solid #C4D7EF;font-size:13px;line-height:20px;color:#5C6470;">
          Du sprichst gerade mit einer Marke, die UGC braucht? Über <a href="${CREATOR_REFERRAL_URL}" style="color:#06458F;font-weight:700;text-decoration:none;">UGC VZ für Marken</a> kann sie direkt ihre erste Kampagne starten.
        </p>
      </div>

      <p style="margin:22px 0 0;font-size:14px;line-height:22px;color:#5C6470;">
        Dein Profil kannst du jederzeit in deinem <a href="${CREATOR_KONTO_URL}" style="color:#06458F;font-weight:700;text-decoration:none;">Creator-Konto</a> bearbeiten. Fragen oder Feedback? Antworte einfach direkt auf diese E-Mail.
      </p>
    </td>
  </tr>`;

  return {
    subject: 'Willkommen bei UGC VZ: Dein Creator-Profil ist live',
    html: emailShell({
      preheader: 'Dein Profil ist aktiv. Schau dir jetzt offene View-Kampagnen an (0 % Gebühr für Creator).',
      eyebrow: 'Profil aktiv',
      title: `Willkommen bei UGC VZ, ${firstName}`,
      headerTagline: 'Creator-Konto',
      children: body,
      footerNote: 'Du erhältst diese Willkommensmail, weil du dein Creator-Konto bei UGC VZ bestätigt hast.',
    }),
    text: `Hallo ${firstName},

dein Creator-Profil ${publicId} ist bestätigt und live. Ab sofort kannst du bei offenen View-Kampagnen mitmachen und wirst Marken aus DACH vorgeschlagen.

Offene Kampagnen ansehen:
${CREATOR_CAMPAIGNS_URL}

So startest du am schnellsten:
1. TikTok oder Instagram verbinden: Im Konto mit einem Klick verknüpfen, damit deine Views automatisch gezählt werden.
2. Offene Kampagne wählen: Du siehst vorher exakt, was pro 1.000 Views gezahlt wird. Für Creator fallen 0 % Gebühren an.
3. Profil schärfen: Stadt, konkrete Themen (z. B. Skincare, Tech, Food) und Portfolio-Links erhöhen deine Chancen auf direkte Brand-Anfragen.

Sag es weiter: Für Creator 0 % Gebühr
Kennst du andere Creator, die faire Kampagnen suchen? Schick ihnen diesen Link:
${CREATOR_INVITE_URL}

Du sprichst gerade mit einer Marke, die UGC braucht? Hier kann sie direkt starten:
${CREATOR_REFERRAL_URL}

Dein Profil bearbeiten (Anmeldung per 6-stelligem Code, gültig 20 Minuten):
${CREATOR_KONTO_URL}

Fragen oder Profil löschen lassen? Antworte einfach direkt auf diese E-Mail.

UGC VZ ist ein Service der track by track GmbH · Schliemannstr. 23, 10437 Berlin
Impressum: https://ugc-vz.de/impressum · Datenschutz: https://ugc-vz.de/datenschutz · Kontakt: hi@ugc-vz.de`,
  };
};

import { htmlEscape, emailShell } from './email-shell';

export const CREATOR_LOGIN_TTL_MINUTES = 15;

/**
 * Magic-Link-E-Mail fuer den Login ins Creator-Dashboard.
 *
 * Enthaelt bewusst den Weiterempfehlungs-Hinweis: "Hier ist es kostenlos" ist
 * ein Satz, den Creator beilaeufig weitergeben. Der Login ist transaktional,
 * der Empfehlungsteil steht klar abgesetzt unterhalb der eigentlichen Handlung.
 */
export const buildCreatorLoginEmail = ({ name, loginUrl }: { name: string; loginUrl: string }) => {
  const firstName = name.trim().split(/\s+/)[0] || 'Creator';
  const safeUrl = htmlEscape(loginUrl);

  const body = `<tr>
    <td class="email-pad" style="padding:8px 42px 30px;">
      <p style="margin:0;font-size:16px;line-height:26px;">Hallo ${htmlEscape(firstName)},</p>
      <p style="margin:16px 0 0;font-size:16px;line-height:26px;">hier ist dein persönlicher Anmeldelink zu deinem UGC-VZ-Profil. Mit einem Klick siehst du deine hinterlegten Angaben und kannst sie jederzeit ändern — zum Beispiel Portfolio-Links ergänzen oder Preise anpassen.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0;">
        <tr>
          <td style="border-radius:12px;background:#8b3fca;">
            <a href="${safeUrl}" style="display:inline-block;padding:15px 26px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;">Profil öffnen und bearbeiten</a>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:13px;line-height:20px;color:#746b7c;">Der Link ist ${CREATOR_LOGIN_TTL_MINUTES} Minuten gültig und kann nur einmal verwendet werden. Falls du dich nicht angemeldet hast, ignoriere diese E-Mail einfach.</p>

      <div style="margin:26px 0 0;padding:20px 20px;border-radius:12px;background:#f4effa;border:1px solid #e0d2f2;">
        <div style="font-size:16px;line-height:24px;font-weight:800;color:#17121f;">Sag es weiter: Hier ist es kostenlos</div>
        <p style="margin:10px 0 0;font-size:14px;line-height:22px;color:#746b7c;">Kennst du andere Creator, die noch nach Aufträgen suchen? Anmeldung, Profil und Vermittlung kosten nichts — und es gibt keine Provision auf das Honorar.</p>
      </div>
    </td>
  </tr>`;

  return {
    subject: 'Dein Anmeldelink für dein UGC-VZ-Profil',
    html: emailShell({
      preheader: 'Ein Klick und du kannst dein Creator-Profil ansehen und bearbeiten.',
      eyebrow: 'Creator-Login',
      title: 'Dein Profil, deine Kontrolle',
      children: body,
      footerNote: 'Diese E-Mail erhältst du, weil über deine Adresse ein Login für das UGC-VZ-Creator-Verzeichnis angefragt wurde.',
    }),
    text: `Hallo ${firstName},\n\nhier ist dein persönlicher Anmeldelink zu deinem UGC-VZ-Profil:\n${loginUrl}\n\nMit einem Klick siehst du deine hinterlegten Angaben und kannst sie jederzeit ändern — zum Beispiel Portfolio-Links ergänzen oder Preise anpassen.\n\nDer Link ist ${CREATOR_LOGIN_TTL_MINUTES} Minuten gültig. Falls du dich nicht angemeldet hast, ignoriere diese E-Mail.\n\nSag es weiter: Anmeldung, Profil und Vermittlung bei UGC VZ sind für Creator kostenlos.\n\nUGC VZ ist ein Service der track by track GmbH · Schliemannstr. 23, 10437 Berlin\nImpressum: https://ugc-vz.de/impressum · Datenschutz: https://ugc-vz.de/datenschutz · Kontakt: hi@ugc-vz.de`,
  };
};

/**
 * Willkommensmail nach bestaetigter Registrierung.
 *
 * Bewusst getrennt von der Double-Opt-In-Bestaetigung: Die DOI-Mail muss rein
 * transaktional bleiben, ein Empfehlungsaufruf darin waere Werbung in der
 * Bestaetigungsmail und damit angreifbar. Diese Mail geht erst nach der
 * Bestaetigung raus, wenn das Profil tatsaechlich aktiv ist.
 *
 * Zwei Empfehlungswege, bewusst in dieser Reihenfolge. Zuerst andere Creator:
 * "Hier ist es kostenlos" ist ein Satz, den man beilaeufig weitergibt, und der
 * Creator-Pool ist die schwaechste Spalte im Anbietervergleich (400 gegenueber
 * 10.000 bis 140.000). Danach Marken: hoehere Huerde, weil es ein beruflicher
 * Akt ist, dafuer direkt auf der Nachfrageseite - und es nuetzt dem Creator
 * selbst, weil die Marke ihn ueber das Verzeichnis buchen kann.
 *
 * Kein Aufruf zu Backlinks: incentivierte und massenhaft gleichfoermige Links
 * zaehlen bei Google zu den Link-Schemes, der Ertrag waere gering und das
 * Risiko real.
 */

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

/**
 * Der ref-Parameter macht Empfehlungen messbar. /brands traegt ein
 * Self-Canonical, die Parameter-Variante konsolidiert also sauber auf die
 * Hauptseite und erzeugt kein Indexierungsproblem.
 */
export const CREATOR_REFERRAL_URL = 'https://ugc-vz.de/brands?ref=creator-empfehlung';
/** Weiterempfehlung an andere Creator - eigener ref-Wert, damit sich beide Wege getrennt messen lassen. */
export const CREATOR_INVITE_URL = 'https://ugc-vz.de/creator?ref=creator-einladung';

export const buildCreatorWelcomeEmail = ({
  name,
  publicId,
}: {
  name: string;
  publicId: string;
}) => {
  const firstName = name.trim().split(/\s+/)[0] || 'Creator';
  const safeName = escapeHtml(firstName);
  const safeId = escapeHtml(publicId);

  return {
    subject: 'Dein Creator-Profil ist aktiv',
    html: `<!doctype html>
<html lang="de">
  <body style="margin:0;background:#f2f1ee;font-family:Arial,Helvetica,sans-serif;color:#21172a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Dein Profil ist im Verzeichnis aktiv und kann ab sofort bei Brand-Anfragen vorgeschlagen werden.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f1ee;padding:28px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e5e1e8;border-radius:18px;overflow:hidden;">
          <tr><td style="padding:26px 30px;background:#17121d;color:#ffffff;">
            <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#a8e06a;font-weight:800;">UGC VZ · Profil aktiv</div>
            <div style="margin-top:8px;font-size:28px;line-height:34px;font-weight:800;">Willkommen im Verzeichnis, ${safeName}</div>
          </td></tr>
          <tr><td style="padding:32px 30px;">
            <p style="margin:0;font-size:18px;line-height:28px;">Hallo ${safeName},</p>
            <p style="margin:18px 0 0;font-size:16px;line-height:26px;color:#5f5666;">dein Profil <strong style="color:#21172a;">${safeId}</strong> ist bestätigt und aktiv. Ab jetzt kann es Marken vorgeschlagen werden, die zu deinen Themen passende Creator suchen.</p>

            <div style="margin:26px 0;padding:17px 18px;border-radius:12px;background:#f7f7f5;border:1px solid #e8e8e4;font-size:14px;line-height:22px;color:#5f5666;">
              <strong style="color:#21172a;">Wie es weitergeht:</strong><br />
              Marken beschreiben ihre Kampagne, wir schlagen passende Profile vor. Erst wenn eine Marke dich bewusst auswählt, geben wir deine Kontaktdaten weiter. In der öffentlichen Suche stehen sie nie. Für dich bleibt das kostenlos, und wir nehmen keine Provision auf dein Honorar.
            </div>

            <div style="margin:26px 0 0;padding:20px 20px;border-radius:12px;background:#f4effa;border:1px solid #e0d2f2;">
              <div style="font-size:17px;line-height:25px;font-weight:800;color:#21172a;">Sag es weiter: Hier ist es kostenlos</div>
              <p style="margin:10px 0 0;font-size:15px;line-height:24px;color:#5f5666;">Kennst du andere Creator, die noch nach Aufträgen suchen? Schick ihnen den Link. Anmeldung, Profil und Vermittlung kosten nichts, und es gibt keine Provision auf das Honorar. Je größer und vielfältiger das Verzeichnis wird, desto eher finden Marken hier, was sie suchen — und desto mehr Anfragen kommen bei allen an.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:18px 0 0;">
                <tr><td style="border-radius:10px;background:#8b3fca;">
                  <a href="${CREATOR_INVITE_URL}" style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;">Anderen Creatorn weiterleiten</a>
                </td></tr>
              </table>
              <p style="margin:16px 0 0;padding-top:14px;border-top:1px solid #e0d2f2;font-size:14px;line-height:22px;color:#5f5666;">Und falls du gerade mit einer Marke im Gespräch bist, die Content braucht: <a href="${CREATOR_REFERRAL_URL}" style="color:#8b3fca;font-weight:700;">Die Creator-Suche</a> ist für Marken ebenfalls kostenlos — und sie kann dich darüber direkt finden.</p>
            </div>

            <p style="margin:26px 0 0;font-size:14px;line-height:22px;color:#7a717f;">Du willst etwas an deinem Profil ändern oder es löschen lassen? Antworte einfach auf diese E-Mail.</p>
          </td></tr>
          <tr><td style="padding:20px 30px;border-top:1px solid #ece8ee;font-size:12px;line-height:19px;color:#817887;">UGC VZ ist ein Service der track by track GmbH · Schliemannstr. 23, 10437 Berlin<br /><a href="https://ugc-vz.de/impressum" style="color:#6f2fa9;text-decoration:none;">Impressum</a> · <a href="https://ugc-vz.de/datenschutz" style="color:#6f2fa9;text-decoration:none;">Datenschutz</a> · Kontakt: <a href="mailto:hi@ugc-vz.de" style="color:#6f2fa9;text-decoration:none;">hi@ugc-vz.de</a></td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
    text: `Hallo ${firstName},

dein Profil ${publicId} ist bestätigt und aktiv. Ab jetzt kann es Marken vorgeschlagen werden, die zu deinen Themen passende Creator suchen.

Wie es weitergeht:
Marken beschreiben ihre Kampagne, wir schlagen passende Profile vor. Erst wenn eine Marke dich bewusst auswählt, geben wir deine Kontaktdaten weiter. In der öffentlichen Suche stehen sie nie. Für dich bleibt das kostenlos, und wir nehmen keine Provision auf dein Honorar.

Sag es weiter: Hier ist es kostenlos
Kennst du andere Creator, die noch nach Aufträgen suchen? Schick ihnen diesen Link:
${CREATOR_INVITE_URL}

Anmeldung, Profil und Vermittlung kosten nichts, und es gibt keine Provision auf das Honorar. Je größer und vielfältiger das Verzeichnis wird, desto eher finden Marken hier, was sie suchen - und desto mehr Anfragen kommen bei allen an.

Und falls du gerade mit einer Marke im Gespräch bist, die Content braucht: Die Creator-Suche ist für Marken ebenfalls kostenlos, und sie kann dich darüber direkt finden:
${CREATOR_REFERRAL_URL}

Du willst etwas an deinem Profil ändern oder es löschen lassen? Antworte einfach auf diese E-Mail.

UGC VZ ist ein Service der track by track GmbH · Schliemannstr. 23, 10437 Berlin
Impressum: https://ugc-vz.de/impressum · Datenschutz: https://ugc-vz.de/datenschutz · Kontakt: hi@ugc-vz.de`,
  };
};

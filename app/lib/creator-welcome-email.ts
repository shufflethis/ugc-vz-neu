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
 * Creator-Pool ist die schwaechste Spalte im Anbietervergleich (490 gegenueber
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
/** Login-Seite: schickt einen Einmal-Anmeldelink (15 Min, nur einmal gueltig). */
export const CREATOR_KONTO_URL = 'https://ugc-vz.de/konto';

/**
 * "Weiterleiten" oeffnet das Mailprogramm mit vorformuliertem Text, statt auf
 * die Anmeldeseite zu fuehren (die bei bereits angemeldeten Creatorn verwirrt).
 */
const INVITE_SUBJECT = 'Kostenloses Creator-Verzeichnis für UGC';
const INVITE_BODY = `Hey, ich bin bei UGC VZ gelistet, einem Verzeichnis für UGC-Creator. Anmeldung, Profil und Vermittlung sind kostenlos, und es gibt keine Provision auf das Honorar. Schau mal: ${CREATOR_INVITE_URL}`;
const INVITE_MAILTO = `mailto:?subject=${encodeURIComponent(INVITE_SUBJECT)}&body=${encodeURIComponent(INVITE_BODY)}`;

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
  <body style="margin:0;background:#F5F7FA;font-family:Inter,Arial,Helvetica,sans-serif;color:#202124;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Dein Profil ist im Verzeichnis aktiv und kann ab sofort bei Brand-Anfragen vorgeschlagen werden.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F7FA;padding:28px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #DCE2EA;border-radius:12px;overflow:hidden;">
          <tr><td style="height:4px;background:#06458F;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr><td style="padding:24px 30px;background:#ffffff;border-bottom:1px solid #DCE2EA;color:#202124;">
            <img src="https://ugc-vz.de/brand/ugcvz-logo-header.png" alt="UGC VZ" height="32" style="display:block;height:32px;width:auto;border:0;" />
            <div style="margin-top:14px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#D10523;font-weight:700;">Profil aktiv</div>
            <div style="margin-top:6px;font-size:26px;line-height:32px;font-weight:800;color:#202124;">Willkommen im Verzeichnis, ${safeName}</div>
          </td></tr>
          <tr><td style="padding:30px;">
            <p style="margin:0;font-size:18px;line-height:28px;color:#202124;">Hallo ${safeName},</p>
            <p style="margin:18px 0 0;font-size:16px;line-height:26px;color:#5C6470;">dein Profil <strong style="color:#202124;">${safeId}</strong> ist bestätigt und aktiv. Ab jetzt kann es Marken vorgeschlagen werden, die zu deinen Themen passende Creator suchen.</p>

            <div style="margin:26px 0;padding:17px 18px;border-radius:12px;background:#F5F7FA;border:1px solid #DCE2EA;font-size:14px;line-height:22px;color:#5C6470;">
              <strong style="color:#202124;">Wie es weitergeht:</strong><br />
              Marken beschreiben ihre Kampagne, wir schlagen passende Profile vor. Erst wenn eine Marke dich bewusst auswählt, geben wir deine Kontaktdaten weiter. In der öffentlichen Suche stehen sie nie. Für dich bleibt das kostenlos, und wir nehmen 0 % Gebühr auf dein Honorar.
            </div>

            <div style="margin:26px 0 0;padding:20px 20px;border-radius:12px;background:#EBF2FA;border:1px solid #C4D7EF;">
              <div style="font-size:17px;line-height:25px;font-weight:800;color:#06458F;">Sag es weiter: Für Creator 0 % Gebühr</div>
              <p style="margin:10px 0 0;font-size:15px;line-height:24px;color:#202124;">Kennst du andere Creator, die noch nach Aufträgen suchen? Schick ihnen den Link. Anmeldung, Profil und Teilnahme an Kampagnen sind für Creator kostenlos, ohne Provision auf dein Honorar.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:18px 0 0;">
                <tr><td style="border-radius:8px;background:#06458F;">
                  <a href="${escapeHtml(INVITE_MAILTO)}" style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">Anderen Creatorn weiterleiten</a>
                </td></tr>
              </table>
              <p style="margin:16px 0 0;padding-top:14px;border-top:1px solid #C4D7EF;font-size:14px;line-height:22px;color:#5C6470;">Und falls du gerade mit einer Marke im Gespräch bist, die Content braucht: Über <a href="${CREATOR_REFERRAL_URL}" style="color:#06458F;font-weight:700;">UGC VZ für Marken</a> kann sie dich direkt finden.</p>
            </div>

            <div style="margin:26px 0 0;padding:17px 18px;border-radius:12px;background:#F5F7FA;border:1px solid #DCE2EA;font-size:14px;line-height:22px;color:#5C6470;">
              <strong style="color:#202124;">So wirst du von Marken gefunden</strong><br />
              Marken suchen nach Thema, Stadt, Plattform, Alter und Preis. Je genauer dein Profil das beantwortet, desto öfter wirst du vorgeschlagen:
              <ul style="margin:10px 0 0;padding-left:20px;">
                <li style="margin:0 0 6px;"><strong style="color:#202124;">Konkrete Themen statt „Content“:</strong> „Skincare, Haarpflege, Mama von zwei Kita-Kindern“ wird gefunden, „Lifestyle“ allein kaum.</li>
                <li style="margin:0 0 6px;"><strong style="color:#202124;">Stadt eintragen:</strong> Viele Marken suchen regional, ohne Stadt fällst du da raus.</li>
                <li style="margin:0 0 6px;"><strong style="color:#202124;">Portfolio-Link, Formate und Preis ergänzen:</strong> Diese Angaben zählen mit, und Marken sehen sofort, was du lieferst.</li>
                <li style="margin:0;"><strong style="color:#202124;">Social-Links angeben:</strong> Daran erkennen wir TikTok, Instagram und YouTube.</li>
              </ul>
            </div>

            <div style="margin:26px 0 0;padding:17px 18px;border-radius:12px;background:#F5F7FA;border:1px solid #DCE2EA;font-size:14px;line-height:22px;color:#5C6470;">
              <strong style="color:#202124;">Profil ergänzen oder ändern</strong><br />
              Du willst Portfolio-Links ergänzen, Social-Konten verbinden oder Preise anpassen? Dann <a href="${CREATOR_KONTO_URL}" style="color:#06458F;font-weight:700;">melde dich hier in deinem Creator-Konto an</a>.
            </div>

            <p style="margin:18px 0 0;font-size:14px;line-height:22px;color:#5C6470;">Du willst dein Profil löschen lassen oder hast eine Frage? Antworte einfach auf diese E-Mail.</p>
          </td></tr>
          <tr><td style="padding:20px 30px;border-top:1px solid #DCE2EA;background:#F5F7FA;font-size:12px;line-height:19px;color:#5C6470;">UGC VZ ist ein Service der track by track GmbH · Schliemannstr. 23, 10437 Berlin<br /><a href="https://ugc-vz.de/impressum" style="color:#06458F;text-decoration:none;font-weight:600;">Impressum</a> · <a href="https://ugc-vz.de/datenschutz" style="color:#06458F;text-decoration:none;font-weight:600;">Datenschutz</a> · Kontakt: <a href="mailto:hi@ugc-vz.de" style="color:#06458F;text-decoration:none;font-weight:600;">hi@ugc-vz.de</a></td></tr>
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

So wirst du von Marken gefunden:
Marken suchen nach Thema, Stadt, Plattform, Alter und Preis. Je genauer dein Profil das beantwortet, desto öfter wirst du vorgeschlagen:
- Konkrete Themen statt "Content": "Skincare, Haarpflege, Mama von zwei Kita-Kindern" wird gefunden, "Lifestyle" allein kaum.
- Stadt eintragen: Viele Marken suchen regional, ohne Stadt fällst du da raus.
- Portfolio-Link, Formate und Preis ergänzen: Diese Angaben zählen mit, und Marken sehen sofort, was du lieferst.
- Social-Links angeben: Daran erkennen wir TikTok, Instagram und YouTube.

Profil ergänzen oder ändern:
Du willst Portfolio-Links ergänzen oder Preise anpassen? Fordere hier einen Anmeldelink an: ${CREATOR_KONTO_URL}
Nur dafür musst du dich anmelden, dein Profil ist auch ohne Login schon aktiv. Klicke den Link bitte gleich nach dem Eintreffen an: Er gilt 15 Minuten und lässt sich nur einmal verwenden.

Du willst dein Profil löschen lassen oder hast eine Frage? Antworte einfach auf diese E-Mail.

UGC VZ ist ein Service der track by track GmbH · Schliemannstr. 23, 10437 Berlin
Impressum: https://ugc-vz.de/impressum · Datenschutz: https://ugc-vz.de/datenschutz · Kontakt: hi@ugc-vz.de`,
  };
};

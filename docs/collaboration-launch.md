# Kooperationen: Vorbereitung des ersten Live-Piloten

Stand: 14.10.2026. Die echte Anwendung und die interne Demo sind getrennt.
FOMO bleibt zunächst ein **Entwurf**, `COLLAB_SEND_ENABLED=false`. Die Einrichtung
versendet keine E-Mails und erstellt keine Einladungen für echte Creator.

## Zugänge

| Zweck | Adresse |
| --- | --- |
| Geschützte Demo mit Beispieldaten | https://ugc-vz.de/demo/kooperationen |
| Persönlichen Link demonstrieren | https://ugc-vz.de/demo/kooperationen/einladung |
| Gespeicherte Zusage demonstrieren | https://ugc-vz.de/demo/kooperationen/konto |
| Abstimmung mit Flo | https://ugc-vz.de/demo/kooperationen/praesentation |
| Echte interne Verwaltung | https://ugc-vz.de/admin/kooperationen |
| Eigene Kooperationen für Creator | https://ugc-vz.de/konto/kooperationen |
| FOMO nach ausdrücklicher Veröffentlichung | https://ugc-vz.de/kooperationen/fomo |

Demo und Verwaltung haben jeweils Benutzername `ugc-vz`, aber **verschiedene
Passwörter**. Die Verwaltung enthält echte Kontaktdaten und darf nicht mit dem
Demo-Zugang geteilt werden. Secrets liegen ausschließlich in Vercel und lokal in
gitignorierten Dateien `.env.demo.local` bzw. `.env.collaborations.local` mit Modus
600. Sie gehören weder in Git noch in die Präsentation oder Creator-Mails.

## Was der Creator erlebt

1. Eine persönliche Einladung nennt den Bezug zu seinem Content und führt auf
   das freigegebene Briefing. Der Link gilt **14 Tage ab Versand**.
2. Das Briefing zeigt noch keine privaten Profildaten. Erst „Weiter zum Start“
   löst den Link einmalig ein. Mail-Scanner verbrauchen ihn durch einen GET nicht.
3. Eine auf diese Kooperation begrenzte Sitzung zeigt vorhandenen Namen, E-Mail
   und Social-Link. Sie eröffnet keinen Zugriff auf die allgemeine Profilverwaltung.
4. Die ausdrückliche Zustimmung speichert die Zusage, Bedingungen und Zustimmung
   zur Weitergabe. Sprache und Verfügbarkeit dürfen später ergänzt werden.
5. Unter „Meine Kooperationen“ sieht der Creator den Status und fehlende Angaben.
   Nach Ablauf oder Einlösen des Links führt die normale E-Mail-Anmeldung wieder
   dorthin. Gespeicherte Zusagen verschwinden nicht mit dem Einladungslink.
6. Bei vollständigen Angaben bereitet Flo die Übergabe vor. Dokumentierte Übergabe
   und bestätigte Kundenaufnahme sind getrennte Status. Der vorhandene Kundenguide
   bleibt die operative Quelle; UGC VZ kopiert dessen Onboarding nicht.

Die begrenzte Sitzung endet spätestens nach sieben Tagen bzw. mit dem Ablauf der
Einladung. Zurückziehen des Links beendet auch diese Sitzung. Das normale Konto
behält die bereits versandte Kooperation. Für externe Creator ohne bestehendes
UGC-VZ-Profil ist zunächst die reguläre Registrierung nötig; kein automatischer Import.

## Vor der ersten Zehnergruppe

- Flo/fomo bestätigt individuell gültige Creator-Konditionen: Honorar, Leistung,
  Testphase, Abbruch/Abnahme, Auszahlung, Laufzeit und Provision einschließlich
  Fortbestand nach Ausstieg. Entwurfshinweise im FOMO-Datensatz ersetzen.
- Ansprechpartner, Antwortadresse, Kundenguide und akzeptierter Vermittlungsnachweis
  vereinbaren. Die Vermittlungs-ID von UGC VZ ist nicht der Trading-Referral-Link.
- Agenturvereinbarung separat klären: Fixbetrag, Zeitraum, Zahlungsauslöser und
  Bezugsgröße der 10 %. Die Chatbeträge sind keine bestätigten Verträge.
- Absenderdomain in Resend sowie gemeinsames Antwortpostfach prüfen. Domainseitiges
  Öffnungs- und Klicktracking deaktiviert lassen, damit der persönliche Link nicht
  umgeschrieben wird. Die Anwendung selbst fügt keinen Tracking-Pixel hinzu.
- Den vorhandenen signierten Resend-Webhook auf Zustellung, Bounce, Beschwerde,
  Suppression und Fehler prüfen. `RESEND_WEBHOOK_SECRET` muss gesetzt sein.
- Finalen Datenschutztext zur Kampagnenvermittlung und Datenweitergabe abstimmen.
  Das Formular protokolliert die Zustimmung, ersetzt aber keine inhaltliche Freigabe.
- In der Verwaltung den bestätigten Inhalt speichern, die konkrete Kundenfreigabe
  dokumentieren und erst dann den Status „Freigegeben“ setzen.
- Erst zum vereinbarten Versandstart `COLLAB_SEND_ENABLED=true` in Vercel setzen
  und neu deployen. Ohne den zusätzlichen Klick „Geprüfte Gruppe jetzt versenden“
  werden weiterhin keine Mails ausgelöst.

## Ablauf für Flo

1. Eine Kampagne auswählen. Für weitere Kunden „Neue Kampagne“ mit eigenen
   Konditionen, Ansprechpartner und Guide anlegen.
2. Höchstens zehn passende Profile auswählen. Die Suche zeigt nur aktive Profile
   mit aktivierten und nicht pausierten Projektanfragen. Die persönliche Passung
   beurteilt der Mensch; zu jedem Profil einen konkreten Satz für die Mail ergänzen.
3. Mailvorschau vorbereiten und jede Mail prüfen. Dieser Schritt versendet nichts.
4. Die geprüfte Gruppe ausdrücklich senden. Bereits beanspruchte Einladungen werden
   nicht erneut versendet. Änderungen an den Bedingungen machen die alte Versand-
   freigabe ungültig. Bereits angenommene Bedingungen bleiben als Momentaufnahme erhalten.
5. Antworten im gemeinsamen Postfach bearbeiten. Fehlende Angaben stehen im
   Creator-Konto. Es gibt noch keine automatische Verarbeitung von Mailantworten,
   kein Discord-Bot-Onboarding und keine automatischen Erinnerungen.
6. Übergabe mit Ansprechpartner und Nachweis dokumentieren. Erst nach tatsächlicher
   Rückmeldung „Kundenaufnahme bestätigen“. Dies ist eine dokumentierte manuelle
   Bestätigung, keine technische Bestätigung durch Discord oder fomo.
7. Nach fünf bis sieben Tagen Zustellung, eingelöste Einladungen, Zusagen,
   vollständige Angaben, Übergaben und bestätigte Aufnahmen auswerten. Bei zehn
   Kontakten absolute Zahlen verwenden. Die nächste Gruppe erst danach starten.

Ein „eingelöster Link“ bezeichnet den aktiven Klick auf „Weiter zum Start“; es ist
keine Messung jeder Seitenansicht. Öffnungsraten sind kein Erfolgsmaß. Antworten
bleiben im Postfach. Kampagnendaten und Protokoll sind in der Verwaltung sichtbar.

## Störungen und Wiederaufnahme

- Abgelaufener/eingelöster Link: Creator über `/konto` anmelden; vorhandene
  Kooperation unter „Meine Kooperationen“ fortsetzen. Kein verlorener Zwischenstand.
- Vor einer Zusage kann eine neue Einladung vorbereitet werden. Der vorherige
  Link wird dabei zurückgezogen. Nach einer Zusage ist keine neue Einladung nötig.
- `sending` / `unknown`: **nicht erneut senden**. In Resend nach Empfänger und
  Zeit suchen und „Versandstatus abgleichen“ mit der Resend-Mail-ID verwenden.
  Der Server prüft Empfänger und Einladungstag; es wird keine Mail versendet.
  Falls Resend keinen Vorgang kennt, muss Technik anhand des Provider-Protokolls
  den Nichtversand prüfen und dokumentiert bereinigen. Auch das Zurückziehen
  eines unklaren Links hebt diese Sperre nicht auf.
- Bounce/Beschwerde/Suppression/Fehler pausieren weitere Projektanfragen und sperren
  den betreffenden Link. Nicht durch erneutes Anlegen umgehen.
- Bei paralleler Bearbeitung verhindert die Versionsprüfung das Überschreiben
  neuer Angaben. Neu laden und den aktuellen Stand prüfen.
- Kampagne pausieren stoppt neue Annahmen und das Ergänzen von Daten. Die Daten
  bleiben lesbar. Für einen technischen Rückzug `COLLABORATIONS_ENABLED=false`
  und `COLLAB_SEND_ENABLED=false` setzen und deployen; keine Tabellen löschen.

## Technik und Einrichtung

Die Anwendung läuft mit Next.js auf Vercel und speichert Kooperationen in der
bestehenden Neon-Datenbank. Nur Migration `013_collaborations.sql` wird ergänzt;
die Einrichtung importiert oder überschreibt keine Creator-Datensätze.

```sh
node --env-file=.env.local --import tsx scripts/setup-collaborations.ts
```

Zusätzlich zur bestehenden Datenbank-/Creator-Login-/Resend-Konfiguration:

```text
COLLABORATIONS_ENABLED=true
COLLAB_ADMIN_PASSWORD=<eigenes zufälliges Secret, mindestens 20 Zeichen>
COLLAB_TOKEN_SECRET=<32 zufällige Bytes als 64 Hex-Zeichen>
COLLAB_SEND_ENABLED=false
COLLAB_FROM=<optional: sonst bestehender RESEND_FROM-Absender>
```

Token werden serverseitig gehasht; nur für den späteren Versand ist eine mit einem
separaten Secret verschlüsselte Kopie gespeichert. Links tragen den Token im
URL-Fragment, das beim Laden entfernt wird; keine Token in Server-URL-Logs oder
Referrern. API-Schreibzugriffe prüfen Herkunft, Authentifizierung, Eigentümer und
Version. Admin-Authentifizierung wird in Middleware und Server wiederholt.
Öffentliche Analytics sind in Kooperationen und im privaten Konto deaktiviert.

Eine Rotation des Token-Secrets erfordert die kontrollierte Neuerstellung noch
nicht versandter Links. Bestehende Sessions widerruft man über ihre Einladungen.
Die Verwaltung verwendet einen separaten gemeinsamen internen Zugang; sie enthält
noch keine individuellen Mitarbeiterrollen oder SSO. Zugang deshalb eng begrenzen.

## Prüfung ohne echte Empfänger

```sh
node --import tsx scripts/test-collaborations.ts
npm run test:creator-dashboard
node --import tsx scripts/test-collab-demo-auth.ts
./node_modules/.bin/tsc --noEmit --incremental false
```

Der Datenbanktest verwendet PGlite mit synthetischen Profilen. Für HTTP-/Browsertests
stellt `scripts/collaboration-test-proxy.ts` eine ausschließlich lokale Testdatenbank
auf Port 3143 bereit. `scripts/collaboration-test-fetch.mjs` blockiert externe
Serverzugriffe und darf nur mit `postgresql://test:test@collab-test.invalid/test`
geladen werden. Der Next-Testserver benötigt eine separate `.env.collab-test.local`,
`NEXT_PUBLIC_BASE_URL=http://127.0.0.1:3142`, `UGCVZ_BUILD_DIR=.next-demo`, deaktivierten
Versand und ausschließlich Test-Secrets. Keine Produktionszugänge übernehmen.

Die Demo bleibt separat unter `/demo/kooperationen`, mit `sessionStorage` und
fiktiven Angaben. Ihr Passwort gewährt ausdrücklich keinen Verwaltungszugriff.

## Abnahme der vorbereiteten Fassung

- Produktion am 14.10.2026: `dpl_3tBZJvDFjZDDzWXFrHszak5jm97S`, Alias `ugc-vz.de`.
- Additive Migration erfolgreich, FOMO `draft`, keine echten Einladungen angelegt,
  Versand ausgeschaltet. Bestehender Absender, Resend und Webhook sind konfiguriert;
  dies ersetzt keinen tatsächlichen Zustelltest an eine autorisierte Testadresse.
- PGlite-Tests: Ablauf, einmalige Einlösung, Eigentümerprüfung, Teilangaben,
  Versionierung, Bedingungssnapshot, Übergaben, Widerruf, Suppression und Klärung
  eines ungewissen Versands bestanden. Creator-Login-Helfertests bestanden.
- Isolierte HTTP-/Browsertests mit fiktiven Profilen: persönliche Einladung,
  Konto-Wiederaufnahme, Datenweitergabe-Zustimmung, getrennte Admin-Anmeldung,
  Versandstopp, dokumentierte Übergabe und Kundenaufnahme bestanden. Null Mails.
- TypeScript, ESLint und Produktionsbuild erfolgreich. Nur zwei bereits vorhandene
  `img`-Warnungen in PreferredSourceBadge und YouTubeEmbed.
- Live-Demo mit acht geschützten Routen, ungültigen Zugangsdaten, Markdown/RSC,
  simuliertem Ablauf, grauen Zukunftsangeboten, 390-px-Mobilansicht und achtseitigem
  PDF geprüft. Keine externen Demo-Anfragen, keine Netzwerkmutationen, keine
  Browser-Ausnahmen. Öffentliche Startseite und Sitemap weiterhin erreichbar.
- Live-Prüfung der Verwaltung ausschließlich lesend: getrennte Passwörter,
  FOMO-Entwurf, deaktivierter Versand und leere Einladungsliste bestätigt.

Für den tatsächlichen Pilot bleiben die unter „Vor der ersten Zehnergruppe“
genannten geschäftlichen Freigaben und der abgestimmte Versandstart offen.

# Brand-Lead-Automation

## Zielbild

Wenn eine Brand in UGC VZ Creator auswählt und das Formular absendet, läuft der
Versand ohne manuelle Weiterleitung:

1. Der Server lädt die ausgewählten Creator direkt aus Airtable.
2. Die Brand erhält über Resend eine gestaltete E-Mail mit Kontakten,
   Preisangaben, Reichweite und Netzwerken.
3. `UGC_INTERNAL_EMAIL` erhält einen separaten Lead-Report mit Lead-ID,
   Resend-ID und dem initialen Versandstatus.
4. Slack meldet den neuen Lead und den initialen Versandstatus.
5. Ein signierter Resend-Webhook meldet anschließend Zustellung, Verzögerung,
   Bounce, Suppression oder Versandfehler in Slack.
6. Creator werden nur bei `SEND_CREATOR_OUTREACH_EMAILS=true` und vorhandener
   E-Mail-Adresse direkt angeschrieben. Der sichere Standard ist `false`.
   Pro Creator wird höchstens eine Auswahlbenachrichtigung pro UTC-Tag erzeugt;
   pro Lead gilt zusätzlich `CREATOR_OUTREACH_MAX_PER_LEAD` (Standard: 8).

Die Gmail-MOCO-Bridge ist für diesen Ausgangsversand nicht erforderlich. Ihr
Google-Zugang ist `gmail.readonly` und eignet sich zum Beobachten und späteren
Klassifizieren von Antworten, nicht zum Versenden.

## Benötigte Umgebungsvariablen

Die vollständige Liste steht in `.env.example`. Für den Lead-Flow sind wichtig:

- `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_NAME`
- `RESEND_API_KEY`
- `RESEND_FROM`, zum Beispiel `UGC VZ <hi@ugc-vz.de>`
- `UGC_INTERNAL_EMAIL`
- `SLACK_WEBHOOK_URL`
- `SUBMIT_REQUEST_API_KEY` für interne/A2A-Aufrufe
- `RESEND_WEBHOOK_SECRET` für verifizierte Delivery-Events
- `SEND_CREATOR_OUTREACH_EMAILS=false` als globaler Creator-Schalter
- `CREATOR_OUTREACH_MAX_PER_LEAD=8` als Quoten-/Missbrauchsschutz

Secret-Werte gehören ausschließlich in Vercel bzw. eine lokale, nicht
versionierte `.env.local`.

## Resend-Webhook aktivieren

Nach dem Deployment in Resend einen Webhook mit diesem Endpoint anlegen:

```text
https://ugc-vz.de/api/webhooks/resend
```

Folgende Events auswählen:

- `email.delivered`
- `email.delivery_delayed`
- `email.bounced`
- `email.failed`
- `email.suppressed`
- `email.complained`

Das von Resend erzeugte Signing Secret als `RESEND_WEBHOOK_SECRET` in Vercel
hinterlegen und erneut deployen. Der Endpoint liest den unveränderten Request
Body und verifiziert `svix-id`, `svix-timestamp` und `svix-signature`.

## Bedeutung der Statusmeldungen

- `queued` / „von Resend angenommen“: Die Resend-API hat die Nachricht
  akzeptiert und eine E-Mail-ID zurückgegeben.
- `email.delivered`: Der Empfänger-Mailserver hat die Nachricht angenommen.
  Das bedeutet nicht zwingend, dass sie im Posteingang statt im Spam-Ordner
  gelandet oder gelesen wurde.
- `email.bounced`, `email.failed`, `email.suppressed`: Die Nachricht wurde nicht
  regulär zugestellt und muss geprüft werden.

## Schutzmaßnahmen

- Exakte Origin-/Referer-Prüfung statt Teilstring-Match
- Ablehnung von Browser-Requests mit `Sec-Fetch-Site: cross-site`
- API-Key-Zugang für serverseitige/A2A-Aufrufe
- Maximal zehn Creator pro Anfrage
- Größen- und Längenlimits für alle Eingaben
- Honeypot-Feld in den öffentlichen Formularen
- In-Memory-Limit pro IP und Empfängeradresse als erste Schutzschicht
- Resend-Idempotency-Keys auf Basis einer stabilen Submission-/Lead-ID
- Creator-Outreach standardmäßig deaktiviert
- Brand- und interne Statusmail werden vor optionalen Creator-Mails versendet
- höchstens eine Creator-Benachrichtigung pro Creator/Tag (Runtime-Deduplizierung
  plus Resend-Idempotency-Key)
- standardmäßig maximal acht Creator-Mails pro Lead
- Signaturprüfung für alle Resend-Webhooks

Das In-Memory-Limit gilt je Vercel-Instanz. Für belastbaren Schutz über mehrere
Instanzen hinweg sollte zusätzlich eine Vercel-Firewall-Regel oder ein
persistentes Rate-Limit (zum Beispiel Upstash/Vercel KV) eingerichtet werden.

## Voraussetzung für Creator-Benachrichtigungen

Im aktuellen Tally-Formular gibt es bereits das optionale Feld `Deine Email`
und eine separate Frage zu Updates/Newsletter. In der Airtable-Creator-Tabelle
werden diese Felder derzeit jedoch nicht gespeichert; alle vorhandenen 164
Datensätze haben deshalb keine versandfähige Creator-E-Mail.

Vor dem Aktivieren des Schalters in Tally unter **Integrations → Airtable →
Fields** mindestens diese Zuordnung ergänzen:

1. `Deine Email` → Airtable-Feld `E-Mail` vom Typ E-Mail
2. Preisfrage ergänzen/zuordnen → `Preisvorstellung`
3. Projektbenachrichtigungen klar von Newsletter-/Marketing-Einwilligung
   trennen; Newsletter darf nicht Voraussetzung für das kostenlose Profil sein
4. Bestehende Tally-Antworten nach erfolgreichem Mapping erneut synchronisieren
   und stichprobenartig prüfen

Die heutige Updates-/Newsletter-Frage verwendet zwei unabhängige Checkboxen
`Ja` und `Nein`; dadurch sind widersprüchliche Antworten möglich. In Tally
besser eine einzelne optionale Einwilligungs-Checkbox oder eine
Single-Choice-Frage verwenden. Die Projektbenachrichtigung sollte separat als
Teil der Profilfunktion erklärt werden.

Das aktuell in Vercel hinterlegte `TALLY_API_KEY` wird von der Tally API mit
HTTP 401 abgelehnt. Für einen automatischen Backfill muss es durch einen neuen
Tally-API-Key ersetzt werden. Der Key darf nicht per Chat geteilt werden.

## Sichere Abnahme

1. TypeScript, Lint und Production Build ausführen.
2. E-Mail-HTML lokal mit anonymisierten Beispieldaten prüfen.
3. Preview-Deployment mit Resend-Testempfänger testen.
4. Erst danach Produktion deployen.
5. Einen gekennzeichneten Test-Lead an eine eigene Adresse senden.
6. Prüfen: Brand-Mail, interner Report, Slack-Lead und Delivery-Webhook.

Keine echte Creator-Outreach-Automation aktivieren, bevor Einwilligung,
Absendertext und operativer Antwortprozess geprüft wurden.

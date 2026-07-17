# Brand-Lead-Automation

## Ablauf

1. Eine Brand sucht aktive Creator aus `creator_search_public` in Neon.
2. Die Auswahl wird serverseitig erneut aus Neon geladen. Private E-Mail-
   Adressen werden nur bei aktivierter Projektbenachrichtigung berücksichtigt.
3. Der Lead und alle Match-Snapshots werden vor dem Versand persistent gespeichert.
4. Resend erhält zuerst die gestaltete Brand-Mail, danach den internen Report.
5. Slack meldet Lead-ID, Match-Auswahl und initialen Versandstatus.
6. Der signierte Resend-Webhook speichert Delivery-, Bounce- und Fehlerstatus.
7. Creator-Outreach bleibt standardmäßig deaktiviert und wird nur bei expliziter
   Freigabe über `SEND_CREATOR_OUTREACH_EMAILS=true` aktiv.

Der normale Persistenzpfad benötigt höchstens drei Neon-Roundtrips: Lead,
gebündelte Matches und gebündelte Versandereignisse mit Statusupdate. Stabile
Resend-Idempotency-Keys verhindern Doppelversand bei Wiederholungen.

## Variablen

- `DATABASE_URL`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `UGC_INTERNAL_EMAIL`
- `RESEND_WEBHOOK_SECRET`
- `SLACK_WEBHOOK_URL`
- `SUBMIT_REQUEST_API_KEY`
- `SEND_CREATOR_OUTREACH_EMAILS=false`
- `CREATOR_OUTREACH_MAX_PER_LEAD=8`

## Resend-Webhook

Endpoint: `https://ugc-vz.de/api/webhooks/resend`

Aktivierte Events: `email.delivered`, `email.delivery_delayed`, `email.bounced`,
`email.failed`, `email.suppressed` und `email.complained`. Der Endpoint prüft
den unveränderten Body gegen `RESEND_WEBHOOK_SECRET`.

## Schutz

- exakte Origin-/Referer-Prüfung und API-Key-Zugang für Serveraufrufe
- Größen-, Feldlängen- und Creator-Limits
- Honeypot und Rate-Limit pro IP- und E-Mail-Hash
- keine erfundenen Profile oder externe Datenbank-Fallbacks
- Brand- und interne Mail vor optionalen Wachstumsmails
- höchstens eine Creator-Auswahlmail pro Creator und UTC-Tag
- private Kontakte nie in öffentlichen Suchantworten oder Exports

## Abnahme

```bash
node --import tsx scripts/test-lead-email.ts
node --env-file=.env.local scripts/audit-neon.mjs
node --env-file=.env.local --import tsx scripts/test-creator-export.ts
node --env-file=.env.local --import tsx scripts/test-private-creator-export.ts
```

Ein echter Test-Lead darf nur an eine kontrollierte eigene Adresse gehen. Danach
Brand-Mail, internen Report, Slack und das zugehörige Resend-Delivery-Event prüfen.

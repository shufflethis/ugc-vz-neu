# Creator-Datenbank und Tally-Ablösung

Stand: 16. Juli 2026

## Umsetzungsstand

- Neon-Ressource `ugc-vz-db` im Tarif `free_v3`, Region Frankfurt, ist mit Vercel verbunden.
- Drei Migrationen sind ausgerollt; die bestehenden Quelltabs in Google Sheets bleiben unverändert und wurden um getrennte Arbeitstabs ergänzt.
- Der Audit vom 17. Juli 2026 weist 469 Quellzeilen und 437 deduplizierte Profile aus: 418 aktiv, 19 quarantänisiert.
- 254 private Kontaktzeilen und 128 Newsletter-Freigaben sind getrennt gespeichert.
- Vollständige Privatanschriften und vollständige Geburtsdaten wurden nicht in Neon importiert.
- Die öffentliche Such-View enthält 26 Profilspalten und keine E-Mail-, Telefon-, Einwilligungs- oder Tokenfelder.
- Native dreistufige Creator-Anmeldung mit Entwurfsspeicherung, E-Mail-Verifikation und getrennten Einwilligungen ist implementiert.
- Die Suche liest ausschließlich Neon und zeigt maximal 24 Top-Treffer. Es gibt keinen Mock- oder Airtable-Fallback.
- Brand-Leads, Match-Snapshots und Resend-Zustellereignisse werden dauerhaft in Neon protokolliert.
- Creator-Benachrichtigungen bleiben über `SEND_CREATOR_OUTREACH_EMAILS` kontrolliert; historische Kontakte werden ohne explizite Projektbenachrichtigungs-Freigabe nicht automatisch angeschrieben.
- Im bestehenden Kunden-Sheet gibt es `Creator Vorschläge` für Mitarbeitende und einen automatisch aktualisierten `Neon Sync`-Tab mit allen 418 aktiven Profilen. Die bestehende Datentabelle wurde nicht verändert.
- Der token-geschützte CSV-Export für den automatischen Neon-Spiegel ist auf `ugc-vz.de` live. Er exportiert ausschließlich Felder aus `creator_search_public`; die einmalige Google-Freigabe ist erfolgt und die Importformel läuft fehlerfrei in `Neon Sync!A2`.
- Im nur dem Eigentümer freigegebenen Rohdaten-Spreadsheet gibt es zusätzlich `Intern – Kontakte` mit allen 437 Neon-Profilen und den operativen Kontaktdaten sowie Einwilligungsständen. Der getrennt token-geschützte Export enthält keine Anschrift und kein vollständiges Geburtsdatum.

## Bestandsaufnahme

| Quelle | Zeilen | Spalten | Besonderheiten |
| --- | ---: | ---: | --- |
| Google Sheet `UGC-VZ Creator Datenbank` | 281 | 33 | Tally-Rohdaten inklusive Submission-ID, Zeitstempel, E-Mail, Telefon, Anschrift und Einwilligungen |
| Google Sheet `UGC-Creator-Datenbank für Kunden` | 188 | 21 | älterer Profilbestand ohne E-Mail-, Kontakt- und Einwilligungsfelder |
| historischer Airtable-Teilbestand | 164 | 23 | nicht mehr Teil der produktiven Laufzeit |

Die zwei Sheets enthalten zusammen 469 Zeilen. 15 Zeilen des älteren Sheets
lassen sich bereits über normalisierte Namen einem aktuellen Tally-Datensatz
zuordnen. Vor fuzzy Matching und manueller Prüfung ergeben sich damit rund 454
Profile.

Im aktuellen Tally-Sheet:

- 270 Zeilen mit syntaktisch gültiger E-Mail
- 254 eindeutige E-Mail-Adressen
- 249 eindeutige E-Mail-Adressen mit gesetzter Datenschutz-Einwilligung
- 130 eindeutige E-Mail-Adressen mit Newsletter-Einwilligung
- 16 doppelte E-Mail-Zeilen
- 18 doppelte Namenszeilen
- mindestens 9 offensichtlich verdächtige/Test-Zeilen
- neueste Submission: 16. Juli 2026, 13:37:28

Datenschutz- und Newsletter-Einwilligung bleiben getrennte Zwecke. Ein Profil
mit Datenschutz-Einwilligung darf nicht automatisch als Newsletter-Abonnent
behandelt werden.

## Zielarchitektur

Google Sheets und Tally werden nicht mehr als Produktionsdatenbank verwendet.
Zentrale Quelle ist PostgreSQL über Neon im Vercel Marketplace:

- verifizierte Creator-Anmeldungen über zeitlich begrenzte E-Mail-Links
- Postgres als kanonische Creator-, Lead- und Versanddatenbank
- Row Level Security für private Kontakte, Einwilligungen, Quellzeilen und Verifikationstokens
- öffentliche Views enthalten keine privaten Kontakt-, Adress- oder
  Einwilligungsdaten
- Portfolio wird zunächst über externe Links abgebildet; dadurch entstehen keine zusätzlichen Speicherkosten
- Resend für Auth-, Brand- und Creator-E-Mails
- Vercel/Next.js für Onboarding, Profilverwaltung, Suche und Admin-Oberfläche

## Datenmodell

### `creator_profiles`

- `id`, `user_id`, `slug`, `status`
- `display_name`, `legal_name`, `stage_name`
- `birth_year`/`age_band` statt öffentlich nutzbarem exaktem Geburtsdatum
- `gender`, `city`, `country`, `height_cm`, `skin_type`
- `topics`, `preferred_content`, `industries`, `equipment`, `special_traits`
- `children_context`, `pet_context`, `experience_since`
- `rate_text`, `rate_min_cents`, `rate_max_cents`, `currency`
- `profile_quality_score`, `last_reviewed_at`, Zeitstempel

### `creator_private_contacts`

- `creator_id`, `email`, `phone`
- `email_verified_at`
- `project_notifications_enabled`, `notification_paused_at`
- keine exakte Privatanschrift, sofern sie nicht für einen klaren operativen
  Zweck erforderlich ist

### `creator_social_accounts`

- `creator_id`, `platform`, `handle`, `url`, `followers`, `is_primary`

### `creator_portfolio_items`

- `creator_id`, `kind`, `url`, `title`, `sort_order`

### `consent_events`

- unveränderliches Event mit `creator_id`, `purpose`, `granted`, `text_version`,
  `source`, `occurred_at` und optional gehashter technischer Referenz

### `creator_source_records`

- Zuordnung zur ursprünglichen Sheet-/Tally-/Airtable-Zeile
- `source`, `source_id`, `submitted_at`, Importstatus
- Rohdaten nur in einem geschützten Schema und mit definierter Löschfrist

### `brand_leads`, `lead_creator_matches`, `email_events`

- Brand-Anfrage und interner Status
- ausgewählte Creator inklusive Snapshot der beim Versand sichtbaren Daten
- Resend-ID, Zielgruppe, queued/delivered/bounced/failed und Zeitstempel

## Deduplizierung

Reihenfolge der sicheren Schlüssel:

1. normalisierte E-Mail-Adresse
2. kanonische Social-URL bzw. Platform + Handle
3. Tally Respondent-/Submission-ID
4. exakter normalisierter Name plus weitere übereinstimmende Merkmale
5. fuzzy Name plus Geburtsjahr nur als Vorschlag für manuelle Prüfung

Bei einer Zusammenführung gewinnt die neueste Tally-Submission. Fehlende Werte
werden aus dem älteren Kunden-Sheet ergänzt. Abweichende E-Mails, Social-Handles,
Preise oder Einwilligungen werden nie automatisch überschrieben, sondern in
eine Review-Queue gestellt.

## Neues Creator-Onboarding

1. E-Mail verifizieren und Magic-Link-Konto anlegen
2. Name, Künstlername, Region und Sprachen
3. Themen, Content-Arten, Branchen und besondere Merkmale
4. Plattformen, Handles und Reichweiten jeweils als strukturierte Felder
5. Portfolio und Preisbausteine
6. öffentliche Profilvorschau
7. getrennte Einwilligungen für Plattformbetrieb/Projektbenachrichtigungen und
   optionalen Newsletter

Das Formular speichert schrittweise, zeigt einen Fortschrittsbalken und kann
später jederzeit fortgesetzt werden. Exakte Privatanschrift und vollständiges
Geburtsdatum werden nicht mehr standardmäßig abgefragt.

## Migration und Rollout

1. Neon-Free-Projekt ist an Vercel angebunden und das RLS-Schema ist ausgerollt.
2. Beide historischen Sheets sind importiert und dedupliziert.
3. Unsichere Fälle liegen in der Review-Queue, Test-/Spam-Zeilen sind quarantänisiert.
4. Website-Suche und natives Onboarding verwenden Neon produktiv.
5. Google Sheets bleiben getrennte, token-geschützte Arbeitsansichten.
6. Creator-Auswahlmails werden erst nach operativer Freigabe aktiviert; Bounce-
   und Complaint-Rate sind dann zu überwachen.

## LLM-Einsatz

Ein LLM darf optionale Profiltexte zusammenfassen, Kategorien vorschlagen und
unsichere Dubletten für eine menschliche Review markieren. Es entscheidet nicht
über Einwilligungen, E-Mail-Versand, Kontaktdaten, Preise oder automatische
Zusammenführungen. Private Rohdaten werden nicht unnötig an ein Modell gesendet.

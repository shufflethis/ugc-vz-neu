# Konzept: Abgesicherte Projektabwicklung (Monetarisierung)

Stand: 01.10.2026. Status: **Konzept, nicht beauftragt.** Auslöser für den Bau
ist eine Größenordnung von rund 1.000 Creatorn (Live-Suche am 01.10.2026: 572).

## Idee

Suche, Auswahl und Kontaktdaten bleiben kostenlos. Zusätzlich kann eine Brand
ein Projekt freiwillig über UGC VZ abwickeln: Creator ins Projekt holen,
Zahlung absichern, Abgabe und Freigabe dokumentieren. Es ist ein „Kann“, nie
ein „Muss“; die Einstiegshürde soll niedrig sein.

Heute wird diese Rolle händisch angeboten: als famefact-Block in der Brand-Mail
(`app/lib/lead-email.ts`).

## Vorbild: Makeity (makeity.com, Recherche 01.10.2026)

| Punkt | Makeity |
| --- | --- |
| Ablauf | Projekt mit Briefing, Creator einladen oder ausschreiben, Versand, Deadlines, Nachrichten, Abgabe, Revision, Freigabe |
| Preis | ab 99 $ pro Projekt, kein Abo; Credit-Pakete mit Bonus für Agenturen |
| Geldfluss | Brand zahlt an Makeity; Auszahlung nach Freigabe am 15. und 30. per PayPal |
| Lieferung | fünf Werktage, bei physischen Produkten ab Wareneingang |
| Rechte | weltweite, unbefristete Lizenz nach US-Recht |
| Lock-in | Kontakt oder Zahlung außerhalb führt zur Sperre |

Übernehmen: den Ablauf. Nicht übernehmen: den Lock-in. Wir geben Kontakte frei
heraus, also muss die Gebühr über Mehrwert getragen werden: Zahlungssicherheit
für beide Seiten, Rechnung, dokumentierte Nutzungsrechte, Freigabe-Workflow.

## Einstiegspunkte

1. **Brand-Mail** mit den Kontaktdaten: Button „Projekt abgesichert abwickeln“
   neben dem bestehenden famefact-Block.
2. **Auswahl-Dialog** auf der Website, in dem die Brand ihre Creator auswählt
   und die Kontaktanfrage abschickt: dieselbe Option direkt dort, als
   zusätzliche Wahl neben der kostenlosen Kontaktanfrage.

## Ausbaustufen

**Stufe 0, manuell (Test der Zahlungsbereitschaft):** Stripe-Zahlungslink pro
Projekt, Statusfeld am Lead, Auszahlung von Hand. Kein Brand-Login, kein
Dashboard.

**Stufe 1, Plattform:** Brand-Accounts per Magic-Link (gleicher Mechanismus wie
`app/lib/creator-session.ts`), Projektseite mit Briefing, eingeladenen
Creatorn, Abgabe und Freigabe, Zahlung über einen Marktplatz-Zahlungsdienst.

## Vorhandene Anknüpfungspunkte im Code

- `brand_leads` und `lead_creator_matches`: praktisch schon Projekt plus
  eingeladene Creator.
- `lead_agent_events`: unveränderliches Status-Log, für spätere Zahlungen
  vorbereitet (Spec 2026-08-15, §4.5).
- `app/api/a2a/checkout/route.ts`: Stripe-Checkout, noch nicht aktiviert.
- `/brands/ugc-vertrag-vorlage`: Basis für Nutzungsrechte nach deutschem Recht.

## Offene Punkte vor dem Bau

- **ZAG:** Geld für Dritte annehmen und weiterleiten ist potenziell
  erlaubnispflichtig (BaFin). Gilt auch für Stufe 0. Geld nicht selbst halten;
  Stripe Connect oder Mangopay prüfen und rechtlich klären lassen.
- **Gebührenmodell:** Aufschlag für die Brand, Abzug beim Creator oder Fixpreis
  pro Projekt. Noch nicht entschieden.
- **Wording:** „kostenlos / keine Provision“ in Mails und Seiten präzisieren
  („Suche und Kontakt kostenlos“), nicht streichen.
- **Rechnung und Umsatzsteuer:** wer stellt wem die Rechnung.

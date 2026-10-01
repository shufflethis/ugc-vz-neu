# UGC-VZ: Creator-Auswahl und GSC-Einstiege

Stand: 30. September 2026. Lokale Änderungen; kein Deployment.

Die Positionierung, beide GSC-Quellen und der eng begrenzte Folgeauftrag stehen
in [ugc-vz-positioning.md](ugc-vz-positioning.md). Der zweite Export enthält
dieselben täglichen Performance-Werte; er belegt keine neue Entwicklung.

## Ausgangspunkt

GSC-Export: 28. Juni bis 27. September 2026, Suchtyp Web.
402 Klicks und 14.184 Impressionen insgesamt; die Suchanfrage „ugc vz“ liefert
143 Klicks. „ugc creator finden“ hat 224 Impressionen, keine Klicks und eine
durchschnittliche Position von 25,37. Portfolio und Verdienst haben bereits
Sichtbarkeit und bieten Ansatzpunkte für Creator-Anmeldungen.

Die Summen von Suchanfragen, Seiten und der Gesamtansicht sind nicht identisch
und dürfen nicht als ein gemeinsamer Funnel verrechnet werden. Als Datum
formatierte Positionswerte wurden nicht interpretiert. GSC liefert keine
Anmelde-, Anfrage- oder Creator-Verfügbarkeitsdaten. Ein Creator-Mangel ist
damit nicht nachgewiesen.

## SEO-Prüfung

Am 30.09.2026 wurden die öffentlichen Seiten `/brands`, `/creator` und
`/brands/ugc-creator-finden` geprüft. Alle antworteten mit HTTP 200, hatten
passende eigene Canonicals und `index, follow`, keinen X-Robots-Tag und standen
in der Sitemap. `/brands` und `/creator` waren von der Startseite verlinkt.
Die spezifische Finden-Seite ist über den Brand-Einstieg erreichbar.
Die robots.txt sperrt diese Produktseiten nicht für Googlebot.

Es wurde deshalb kein Canonical oder Redirect auf Verdacht geändert.
HTTP-Zugänglichkeit beweist keine Google-Indexierung. Noch erforderlich ist
die GSC-URL-Prüfung einschließlich ausgewähltem Google-Canonical, letztem
Crawl und gegebenenfalls Begründung für Nichtindexierung. Das Fehlen der
Produktseiten im Performance-Export allein reicht nicht für eine Diagnose.

Wiederholbare reine Leseprüfung: `node scripts/audit-product-seo.mjs`.
Mit `SEO_AUDIT_BASE_URL` kann auch eine lokale Instanz geprüft werden.

## Umsetzung

- Kompaktere Startseite, frühere Suche, mobile Einstiege für beide Zielgruppen.
  Unbelegte Superlative, 8x-Glaubwürdigkeitsbehauptung und der bisherige
  Marketingblock mit 95%-Erfolgsquote wurden aus der Startseite entfernt.
  Ein sachlicher Ablauf erklärt die Kontaktanfrage und direkte Vereinbarung.
- Drei Beispiel-Briefings befüllen die Suche ohne automatischen Suchstart.
- Ergebnis-Karten zeigen vorhandene Region, Themen, Formate und Preistext.
  Die vorhandene Suchantwort wurde ausschließlich um öffentliche Felder
  erweitert. Die Agent-Protokollverträge bleiben bestehen.
- „Profil ansehen“ öffnet eine fokussierte, per Escape schließbare Detailansicht
  über den vorhandenen öffentlichen REST-Endpunkt. Sie zeigt Portfolio-Links,
  Social-Profile, Angebot und eine präzise Erklärung der Prüfstufe.
  Die Auswahl bleibt erhalten. Externe Links werden auf HTTP/HTTPS ohne
  Zugangsdaten begrenzt; Medien werden nicht automatisch eingebettet.
- Technische Suchfehler haben einen eigenen Zustand mit Wiederholung und
  werden nicht als Nulltreffer angezeigt. Der Anfragebereich erklärt vor
  dem Absenden: Kontaktinfos per E-Mail, keine automatische Buchung.
- Fünf bestehende Ratgeber wurden inhaltlich überarbeitet: Portfolio,
  Verdienst, Pitch und die zwei priorisierten Preisartikel. Unbelegte
  Statistikbehauptungen und pauschale Einkommensversprechen wurden ersetzt.
  Titel, Excerpts, HTML, FAQs, Änderungsdatum, Wortzahl und Checksums sind
  synchronisiert. URLs und Veröffentlichungsdaten bleiben erhalten.
- Diese Artikel haben vor dem Titelbild eine praktische Kurzantwort und
  eine passende Handlungsaufforderung. Preisartikel führen zu einem
  vorbereiteten Briefing in `/brands#q=...`; die Suche startet erst nach
  Nutzeraktion. Eine fragmentbasierte Vorbefüllung erzeugt keine zusätzliche
  Query-URL für Crawler. Bestehende Zielgruppen-CTAs bleiben erhalten.

## Messung

Bestehendes Plausible-System, keine neue Analytics-Integration:

| Ereignis | Bedeutung |
| --- | --- |
| `article_cta` | Artikel-Slug, Zielgruppe und Platzierung der Handlungsaufforderung |
| `creator_view` | Tatsächlich geöffnete Profilansicht |
| `creator_selected` / `creator_deselected` | Auswahl und Abwahl über die UI |
| `request_success` | Vom Server bestätigte Anfrageeinreichung, keine Buchung oder Zustellbestätigung |
| `creator_registration_start` | Erste aktive Bearbeitung eines Formularfeldes |
| `creator_registration_step` | Einstieg bzw. erfolgreich weitergeschalteter Formularschritt |
| `creator_registration_submitted` | Registrierung eingereicht; E-Mail-Bestätigung steht noch aus |
| `creator_registration_confirmed` | Anzeige der Erfolgsseite nach einer neu abgeschlossenen Bestätigung |
| `creator_registration_error` | Technischer Fehler beim Einreichen |
| `search_error` | Technischer Suchfehler, getrennt von `search_no_results` |

Suchbegriffe und vollständige Briefings werden nicht mehr in Event-Properties
gesendet. Die neuen Events enthalten keine Namen oder E-Mail-Adressen.
Ein bereits bestätigter Link setzt den neuen Bestätigungsmarker nicht erneut;
die Erfolgsseite entfernt diesen Marker aus der URL, um Reloads nicht als neue
Bestätigung zu zählen. Browser-Analytics ist dennoch keine autoritative
Registrierungsstatistik: Blocker, geschlossene Fenster und manipulierte
URLs können die Messung beeinflussen. Bestätigte Registrierungen sind bei
Bedarf anhand der Datenbank zu zählen.

Neue Events müssen im Plausible-Dashboard gegebenenfalls als Ziele angelegt
werden. Der Code allein richtet diese Dashboard-Ziele nicht ein.

## Prüfungen und Grenzen

Content-Audit, Typecheck, Produktionsbuild, Registrierungshelfer und
Agent-Layer-Prüfung sowie E-Mail-Template-Test wurden erfolgreich ausgeführt. Der Build meldet bestehende
Warnungen zu normalen img-Tags. Keine echten Registrierungen oder Anfragen
wurden zum Test versendet.

Zusätzlicher Datenschutz-/Link-Test:
`node --import tsx scripts/test-discovery-helpers.ts`.

Browserprüfung: `scripts/test-discovery-ui.mjs` nutzt Playwright optional,
simuliert alle API-Antworten und sperrt externe Requests. Zusätzlich startet
sie den lokalen Produktionsserver mit deaktivierter Datenbank und Mail.
Sie benötigt einen vorherigen Build und einen installierten Chromium.
Playwright wurde für diese Arbeit ausschließlich unter `/tmp` installiert.
Mit `PLAYWRIGHT_MODULE_PATH` und `PLAYWRIGHT_BROWSERS_PATH` lassen sich externe
temporäre Installationen verwenden; das Projekt erhält keine neue Abhängigkeit.

Die vollständige Browserprüfung hat bei 1280 × 900 und 375 × 812 Pixeln
bestanden: Beispiel-Briefings, Profildetails mit Wiederholung nach Fehler,
sichere Portfolio-Links, Fokusbegrenzung im Dialog und Escape mit Fokus-Rückgabe,
Auswahl-Erhalt, simulierte Anfrage, technische Fehler versus Nulltreffer,
Artikel-CTA, Registrierungsablauf, getrennte Bestätigung und Reload-Deduplizierung.
Startseite, Suchergebnisse, Registrierungsseite und die geprüften Artikel
zeigten keinen horizontalen Überlauf. Ein überbreiter Mikrofon-Hinweis und
die aus dem Bildschirm verschobene minimierte Anfrageleiste wurden korrigiert.
Screenshots liegen unter `/tmp/ugc-vz-{home,profile,registration}-{1280,375}.png`.

Noch offen: tatsächlicher Indexstatus in GSC, echte Conversion-Baseline,
Creator-Verfügbarkeit und Abdeckung nach Briefing. Die vorhandene Begrenzung
der Kandidaten vor manchen strukturierten Agent-Filtern wurde in diesem
Durchlauf nicht verändert. Dafür ist eine eigene, isolierte Suchkorrektur
mit passenden Datenfixtures nötig. Ein modellgesteuerter Agententest ist
ebenfalls kein Bestandteil dieses Durchlaufs.

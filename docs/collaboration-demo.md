# Private Kooperationsdemo

**Aktueller Stand zur Live-Vorbereitung:** Die getrennte produktive Anwendung ist
inzwischen implementiert. Einrichtung, Zugangstrennung, Freigaben und erster
Versand sind in [collaboration-launch.md](collaboration-launch.md) beschrieben.
Die folgenden Abnahmeabschnitte dokumentieren die Entwicklung der Demo; ältere
Aussagen „noch nicht implementiert“ beziehen sich auf den damaligen Stand.
Die Demo selbst verwendet weiterhin ausschließlich Beispieldaten. Neu sind
`/demo/kooperationen/einladung` (gültig, abgelaufen, eingelöst) und
`/demo/kooperationen/konto` (gespeicherte Zusage und fehlende Angaben).

Die Demo unter `/demo/kooperationen` ist ein geschützter Prototyp zur Abstimmung
mit Flo. FOMO ist die einzige aktive Kampagne. Weitere Angebotsarten erscheinen
als graue, nicht klickbare Platzhalter. Fiktive Kampagnen bleiben Datenmodell-
Vorlagen; ihre Detail-, Bewerbungs- und Guide-Routen liefern 404. Es gibt keinen Live-Versand, keine Live-Creator-Abfrage und keine
Datenbankmutation. Bewerbungen, Checklisten und Status werden nur im aktuellen
Browser-Tab in `sessionStorage` unter `ugcvz-collab-demo-v3:` gespeichert.

## Zugang und Grenzen

- HTTP Basic Auth: Benutzername `ugc-vz`, Passwort aus `COLLAB_DEMO_PASSWORD`.
- Mindestens 20 Zeichen. Ohne Konfiguration bleibt der gesamte Bereich gesperrt.
- Passwort ausschließlich als Secret konfigurieren, niemals mit `NEXT_PUBLIC_`.
- Middleware authentifiziert vor Markdown-Negotiation; die Server-Seite prüft
  unabhängig noch einmal. RSC- und Prefetch-Aufrufe sind ebenfalls geschützt.
- Antworten sind `private, no-store` und `noindex, nofollow, noarchive`.
- Keine Aufnahme in Navigation, Sitemap oder öffentliche Markdown-Ansichten.
- Kampagneninhalte und Folien liegen in einem `server-only`-Modul und werden erst
  nach Authentifizierung als Props übergeben. Keine privaten Assets in `public/`.
- Öffentliche Navigation, Analytics und WebMCP-UI werden in der Demo nicht
  eingebunden. Die Demo verwendet normale Seitenwechsel.
- Ein gemeinsames Demo-Passwort ist kein späteres Rollen-/Rechtesystem. Alle
  Personen mit dem Zugang sehen auch das interne Board und die Präsentation.
- Der Browser merkt sich Basic-Auth-Zugänge. Zum Ende einer Präsentation das
  verwendete private Browserfenster schließen; Passwortrotation sperrt alte Zugänge.

## Routen

| Route relativ zu `/demo/kooperationen` | Inhalt |
| --- | --- |
| `/` | FOMO-Pilot und zwei deaktivierte Ausblick-Plätze |
| `/fomo` | Briefing und noch zu bestätigende Bedingungen |
| `/fomo/bewerben` | Zweistufige, rein lokale Demo-Bewerbung |
| `/fomo/guide` | Übergabe-Checkliste, Ticket-Vorlage und Link zum Notion-Kundenguide |
| `/studio-skin`, `/everyday` | Deaktivierte Vorlagen, 404 auch mit Zugang |
| `/tracking` | Kampagnenfilter, Status, Übergabe und Mailentwurf |
| `/praesentation` | Acht Folien; Pfeiltasten, Navigation und PDF über Drucken |

## Wiederverwendung

`app/demo/kooperationen/model.ts` definiert das Kampagnenmodell.
`data.ts` hält Kampagnen, fiktive Kontakte und Folien. Eine weitere Kampagne
benötigt einen eindeutigen Slug, Angebotsart, Bedingungen, Bewerbungsfragen und
Guide-Schritte. Die Catch-all-Route rendert dieselben Komponenten dafür.
Unbekannte Routen geben 404 zurück. Layout und Farben folgen dem UGC-VZ-Brand-Kit.

Vor einem echten Pilot sind persistente Kampagnen/Bewerbungen, Creator-Login,
Kontaktfreigaben, Versandwarteschlange, Events und bestätigte Kundenübergaben
anzubinden. Der bestehende Live-Outreach wird von dieser Demo nicht verwendet.

## Beratung und Quellenstatus

Am 14.10.2026 über das famefact-Vertriebstrainer-MCP konsultiert:
`ueberblick`, `positionierung`, `revenue_architecture`, `pitch`, `wissenstransfer`.
Übernommen wurden verständliche Angebotskategorien, sachlicher Alternativenvergleich,
getrennte Fakten/Annahmen sowie überprüfbare Übergaben. Die Anwendung auf Creator-
Vermittlung ist ein Pilotvorschlag und kein belegter Wirkungsnachweis.

FOMO-Inhalte stammen aus den bereitgestellten Live-Briefings und dem Chat;
die Repo-Struktur aus der vom Nutzer eingefügten README. Die Notion-Startseite
wurde am 14.10.2026 im Browser gelesen (genannter Stand September 2026); sie
ordnet Account-Einrichtung, Content, Posting, Testphase und Bezahlung ein und
nennt Bia als Kontakt. Die Unterseiten ließen sich nicht zuverlässig auslesen.
Keine Behauptung, der private Repo-Code oder alle Notion-Konditionen seien geprüft.
Die 2.000 USD + 10 % sind Gesprächsstand; 2.500 USD sind ein Verhandlungswunsch.
Bezugsgröße, Zeitraum und Vergütungsbedingungen sind offen.

Die Rolle von UGC VZ ist jetzt ausdrücklich Passung, Bewerbung und dokumentierte
Übergabe. Das operative Onboarding bleibt beim fomo-Team und im Kundenguide.
Der Tickettext „UGC VZ / Florian Runge + Vermittlungs-ID“ ist ein noch mit fomo
abzustimmender Zuordnungsvorschlag. Creator-Referral-Links für App-Nutzer sind
eine separate Zuordnung und kein Beleg für die Agenturvermittlung.

## Lokal prüfen

In einer gitignorierten `.env.demo.local` ein zufälliges Passwort sowie
`UGCVZ_BUILD_DIR=.next-demo` hinterlegen. Anschließend:

```sh
node --env-file=.env.demo.local node_modules/next/dist/bin/next dev --hostname 127.0.0.1 -p 3142
node --import tsx scripts/test-collab-demo-auth.ts
./node_modules/.bin/tsc --noEmit --incremental false
./node_modules/.bin/eslint app/demo/kooperationen app/components/PublicOnly.tsx app/components/SiteAnalytics.tsx app/lib/collab-demo-auth.ts app/lib/collab-demo-path.ts middleware.ts
```

Der getrennte Build-Ordner schützt die auf dem VPS laufende `.next`-Instanz.
Zusätzlich im Browser prüfen: Zugriff ohne/falsches Passwort, alle Unterrouten,
Bewerbung → Board, persistierte Checkliste, Kampagnenwechsel, simulierte
Kundenbestätigung, alle acht Folien, PDF, mobile Überläufe und keine externen
Requests oder POSTs. Danach Preview-Build und geschützte Produktionsroute prüfen.

## Abnahme am 14.10.2026

- TypeScript, ESLint der geänderten Dateien und Authentifizierungstests bestanden.
- Vercel-Preview und Produktionsbuild erfolgreich. Produktionsdeployment:
  `dpl_Eir2CvCTdd6sDb3ikfCTC6RtJu5f`.
- Browserprüfung auf `https://ugc-vz.de`: sechs geschützte Routen, ungültige
  Zugangsdaten, Markdown/RSC und Middleware-Bypass-Header, kein öffentlicher Zugriff.
- Bewerbung, Checklisten-Persistenz, Kampagnenwechsel und Kundenbestätigung
  erfolgreich simuliert. Keine externen Requests oder Netzwerkmutationen.
- Mobile Ansichten bei 390 px ohne Dokumentüberlauf; keine Browser-Ausnahmen.
- Präsentation als achtseitiges PDF geprüft; Export liegt neben dieser Dokumentation.
- Öffentliche Startseite und Sitemap erreichbar; kein öffentlicher Demo-Link.
- Zwei bereits bestehende Build-Warnungen zu `img` in PreferredSourceBadge und
  YouTubeEmbed; keine neuen Lint-Warnungen durch diese Änderung.

## Nachprüfung: ein Pilot und bestehender Kundenguide

- Produktionsdeployment `dpl_6czaDh5guLYQfkaMR8Kpm73Neke1` am 14.10.2026
  erfolgreich auf `https://ugc-vz.de` veröffentlicht.
- Nur FOMO ist aktiv. Zwei graue Zukunftsplätze enthalten keine Links oder
  Schaltflächen. Die früheren Beispielkampagnen liefern auch angemeldet 404;
  das Tracking bietet ausschließlich FOMO an.
- Übergabeseite verlinkt den ursprünglichen Notion-Guide und enthält den noch
  abzustimmenden Ticketvorschlag mit UGC VZ / Florian Runge und Vermittlungs-ID.
- Authentifizierungstests und vollständige Browserprüfung gegen die Live-Domain
  bestanden: Passwortschutz, Bewerbung, persistierte Checkliste, bestätigte
  Übergabe, inaktive Kampagnen, mobile Ansichten und acht Präsentationsfolien.
- Keine externen Requests, Netzwerkmutationen oder Browser-Ausnahmen im Demo-Test.
  Öffentliche Startseite und Sitemap weiterhin erreichbar, ohne Demo-Verlinkung.
- Präsentations-PDF aus der aktualisierten Live-Fassung neu exportiert.

## Aktueller Vorschlag: persönliche Einladung, zehn Creator je Gruppe

Die Demo ist ein interner Prototyp, noch kein produktives Bewerbungsportal.
Die gemeinsame Demo-Anmeldung öffnet auch das interne Board und die Präsentation.
Diese Zugangsdaten gehören deshalb nicht in Creator-Einladungen.

Vor einem echten Versand fehlen insbesondere:

- Ein separater Creator-Zugang ohne Zugriff auf interne Ansichten; Berechtigungen
  müssen serverseitig gelten, das Ausblenden von Menüpunkten reicht nicht.
- Dauerhaft gespeicherte Bewerbungen, eindeutige IDs, Herkunft und eine für Flo
  sichtbare Bearbeitung; aktuell liegen nur simulierte Daten im Browser-Tab.
- Bestätigung und Kontaktweg nach der Bewerbung, abgestimmte Antwortfrist,
  Datenschutzinformation und Freigabe der Weitergabe an fomo.
- Bestätigte Angebotsbedingungen, Zuständigkeit bei fomo und akzeptierter
  Vermittlungsnachweis. Die Details aller Notion-Unterseiten sind nicht verifiziert.
- Geprüfte Kontaktfreigaben, Ausschluss bereits kontaktierter/abgemeldeter Profile,
  zuverlässige Antworten im gemeinsamen Postfach und nachvollziehbarer Versandstatus.

Vorgeschlagener Ablauf:

1. Zehn fachlich passende, kontaktierbare Profile auswählen. Je Profil eine
   konkrete Begründung, warum der Content zum Angebot passt, hinterlegen.
2. Individuell von Florian Runge / UGC VZ anschreiben. Ein Link führt direkt zur
   freigegebenen FOMO-Kampagnenseite, nicht zur Übersicht oder internen Demo.
3. Creator sieht Aufgabe, tägliche Frequenz, Plattformen, vereinbarte Vergütung,
   Testphase und Ansprechpartner. Primäre Aktion: „Weiter zum Start“.
4. Ein einziger Schritt bestätigt vorhandene Profildaten und Verfügbarkeit.
   Keine erneute Bewerbung oder Arbeitsprobe: UGC VZ hat bereits ausgewählt.
   Danach folgt direkt die Vorbereitung der Übergabe; die Aufnahme ist noch offen.
5. Flo klärt nur noch offene Startdetails. Nach Abstimmung erfolgt die Übergabe zum
   vorhandenen fomo-Guide/Discord; fomo bestätigt Aufnahme und Vermittlungs-ID.
6. Nach fünf bis sieben Tagen erste Gruppe auswerten: zugestellt, Antworten,
   Interesse, qualifiziert, Aufnahme bestätigt sowie häufige Fragen und Absagen.
   Bei nur zehn Kontakten absolute Zahlen betrachten. Die nächste Gruppe startet
   nach Auswertung und Verbesserung, nicht automatisch nach Kalender.

Eine freundliche Erinnerung nach vier bis fünf Werktagen ist eine optionale
Pilotregel, keine bestehende Automatisierung. Bei Antwort, Bewerbung, Absage,
Abmeldung oder Unzustellbarkeit stoppen. Öffnungen nicht als Erfolgsmaß verwenden.

Mailentwurf für den freigegebenen Pilot (nicht versendet):

> Betreff: [Name], passt diese Creator-Kooperation zu dir?
>
> Hi [Name],
>
> ich bin Flo von UGC VZ. Dein [konkretes Video/Format] ist uns aufgefallen,
> weil [ehrlicher Bezug zur Aufgabe].
>
> Wir möchten dich zur Creator-Kooperation mit fomo, einer Social-Trading-App,
> einladen. Dabei veröffentlichst du kurze Videos auf Projektaccounts. Geplant ist
> ein Video pro Tag für TikTok, Instagram und Facebook. Die Zusammenarbeit
> sieht ein vereinbartes Fixhonorar und eine variable Beteiligung vor.
>
> Hier findest du die Aufgabe, Voraussetzungen und Konditionen:
> [Deine Einladung ansehen – freigegebene FOMO-Kampagnenseite]
>
> Schau dir deine Einladung an. Wenn das für dich passt, bestätige direkt deine
> Angaben und Verfügbarkeit. Danach bereiten wir die Übergabe an das fomo-Team vor.
> Bei Fragen antworte einfach auf diese Mail.
>
> Viele Grüße
> Flo · UGC VZ
>
> Falls du solche Anfragen nicht möchtest, gib mir kurz Bescheid.

Keine konkrete Vergütung versprechen, bevor fomo Betrag und Bedingungen bestätigt
hat. Platzhalter vor Versand ersetzen. Der Entwurf selbst löst keinen Versand aus.

Lesbarkeitsprüfung am 14.10.2026: Fließtext der Creator-Ansichten auf Mobilgeräten
auf 16 px angehoben, Hinweise und Navigation vergrößert, zentrale Touch-Flächen
auf mindestens 44 px erweitert und mobile Zukunftskarten kompakter gestaltet.
Build und Browserprüfungen lokal sowie nach Veröffentlichung auf ugc-vz.de
bestanden; mobile Ansichten ohne Dokumentüberlauf, PDF weiterhin acht Seiten.
Deployment: `dpl_9TL28PinGa5oWsc4oh7E7YBAFgHa`. Keine Nutzertests mit echten
Creatorn durchgeführt; keine Aussage über vollständige Barrierefreiheit.

## Einladung statt erneuter Bewerbung

Auf Nutzerwunsch am 14.10.2026 auf den Ablauf für bereits ausgewählte Creator
umgestellt. Die Auswahl findet vor der Mail statt. Die Demo zeigt vorausgefüllte
Beispieldaten und einen einzigen Schritt unter `/demo/kooperationen/fomo/start`.
Der alte Pfad `/bewerben` bleibt als kompatibler Zugang zur gleichen Ansicht
bestehen. Die gemeinsamen Demo-Zugangsdaten bleiben ausschließlich intern.

„Weiter zum Start“ → Angaben und Verfügbarkeit bestätigen → Übergabe an fomo.
Die Arbeitsprobe muss nicht erneut eingereicht werden. Der Status „Einladung
angenommen“ bezeichnet die Zustimmung des Creators, „Start geklärt“ die
abgestimmten Startdetails; erst „Bestätigt“ bezeichnet die Kundenaufnahme.
Die Präsentation beschreibt denselben Ablauf. Frühere Abnahmeabschnitte dieser
Dokumentation mit „Bewerbung“ beziehen sich auf die vorherige Demo-Fassung.

Das Vorbefüllen echter Creator-Daten über geschützte persönliche Einladungslinks
ist noch nicht implementiert. Die Demo liest keine echten Profile und sendet
keine Nachrichten. Kundenaufnahme, individuelle Konditionen und Vermittlungs-
zuordnung sind weiterhin vor dem produktiven Pilot mit fomo abzustimmen.

Abnahme: TypeScript und ESLint bestanden. Browserprüfung lokal und auf ugc-vz.de
bestanden, einschließlich Einladungslink, verpflichtender Bestätigung, fehlender
erneuter Portfolio-Abfrage, gespeichertem Status, Übergabe, Mobilansicht und
Passwortschutz. Achtseitiges PDF aktualisiert. Produktionsdeployment:
`dpl_78AzWsu9h3PntLpUQVLwczZBxUZV`.

## Vertriebsprüfung: laufende Einnahmen als Nutzen

Am 14.10.2026 erneut die MCP-Playbooks des famefact-Vertriebstrainers gelesen:
`ueberblick`, `positionierung`, `pitch`, `nutzenargumentation`. Die folgende
Bewertung ist die Anwendung dieser Arbeitskarten durch den Coding-Agenten,
keine unabhängige Kundenbefragung oder Freigabe durch fomo.

Ergebnis vor Änderung: Die Handlung „Weiter zum Start“ war klar, die bisherige
Überschrift „Deine Einladung zur fomo-Kooperation“ erklärte aber vor allem den
Prozess. „Fixhonorar + Provision“ nannte das Modell, ohne die Perspektive gegenüber
einem einzelnen UGC-Auftrag verständlich zu machen.

Positionierung nach Alternative → Unterschied → Wert:

| Feld | Bewertung und Belegstatus |
| --- | --- |
| Kategorie | Laufende Creator-Partnerschaft für eine Social-Trading-App. |
| Alternative | Einzelne UGC-Content-Aufträge; vom Nutzer als Vergleich vorgegeben. Ob dies die tatsächliche Hauptalternative der eingeladenen Creator ist, bleibt im Pilot zu prüfen. |
| Unterschied 1 | Vereinbartes Honorar für regelmäßiges Posten. Eine länger laufende Zusammenarbeit kann die Planung erleichtern; Fortsetzung nach der Testphase ist nicht zugesagt. |
| Unterschied 2 | Beteiligung an provisionsfähigen Trading-Gebühren geworbener Nutzer. Sie kann über das einzelne Video hinaus Einnahmen erzeugen. |
| Passende Creator | Können täglich Kurzvideos produzieren, Projektaccounts führen und wollen Inhalte über eine Social-Trading-App erstellen. |
| Grenze | Kein garantiertes dauerhaftes Einkommen; Fixhonorar verlangt die vereinbarte Leistung, Provision hängt von Aktivität und gültigen Bedingungen ab. |
| Nachweis | Bereitgestelltes Creator-Briefing und Flo-Aufbereitung der Bezahlungsseite, am 14.10.2026 erneut gelesen. Keine unabhängige Prüfung von Einnahmen oder vertraglicher Durchsetzbarkeit. |

Gelesene Quellen:
- https://fomo-creator-briefing.vercel.app
- https://fomo-kommandozentrale.vercel.app/bezahlung/

Das Briefing nennt einen monatlichen Retainer und eine auch nach Ausstieg
weiterlaufende Beteiligung für bereits geworbene Nutzer zum Basissatz von 25 %.
Es verwendet „lebenslang“. Die Demo macht daraus keine eigene Garantie und
übernimmt keine Top-Einnahmen als Erwartungswert. Stattdessen erklärt sie den
Mechanismus und verweist auf individuell zu bestätigende Programmbedingungen.

Umgesetzt: Überschrift „Dein Content. Die Chance auf laufende Einnahmen.“,
Nutzenabschnitt mit Vergleich zum Einzelauftrag, Trennung von Fixhonorar und
variabler Beteiligung, konkrete Aufgabe „ein Video, drei Posts“ und eigener
Empfehlungslink. Der kurze Einladungsablauf bleibt bestehen; Folien aktualisiert.

Drei entscheidende offene Fragen:
1. fomo/Flo bestätigt Fixhonorar, Anspruch nach der Testphase, weitere Laufzeit
   und Zahlungsauslöser anhand der tatsächlich geltenden Vereinbarung.
2. fomo bestätigt Zuordnung, provisionsfähige Gebühren, Staffel und Fortbestand
   nach Ausstieg oder Programmende. Die widersprüchlichen Zeitangaben zur
   Provisionsstaffel im Guide werden nicht als feste Zusage übernommen.
3. Mit den ersten zehn eingeladenen Creatorn prüfen: Können sie in eigenen
   Worten Aufgabe, Einnahmemechanismus und nächsten Schritt wiedergeben?
   Verständnis und tatsächliche Zusagen messen; keine Erfolgsquote erfinden.

Verifikation: ESLint und Produktionsbuild einschließlich TypeScript bestanden.
Lokale und Live-Browserprüfung mit Nutzenabschnitt, Desktop-/Mobilansicht,
Bestätigungsschritt, Passwortschutz und achtseitigem Präsentations-PDF bestanden.
Produktionsdeployment: `dpl_8CFXV5vGfVQ6nZxpzLpi8pt1RfqB`.

## Ergänzung: Live-Vorbereitung bei fortbestehender Demo

Aktuelles Produktionsdeployment: `dpl_3tBZJvDFjZDDzWXFrHszak5jm97S`.
Die getrennte Anwendung, private Kontoseiten und interne Verwaltung sind
bereitgestellt. FOMO bleibt ein Entwurf; echter Versand ist deaktiviert.
Die Demo enthält jetzt zusätzlich die 14-Tage-Linkzustände und eine private
Kontoansicht mit gespeicherter Zusage und später ergänzbaren Angaben.
Live-Browserprüfung einschließlich acht geschützter Routen und Mobilansichten
bestanden. Präsentations-PDF erneut aus der Live-Fassung exportiert, acht Seiten.
Der vollständige Übergabestand steht in [collaboration-launch.md](collaboration-launch.md).

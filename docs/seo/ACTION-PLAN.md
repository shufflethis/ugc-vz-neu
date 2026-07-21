# SEO-Aktionsplan ugc-vz.de

**Stand:** 21.07.2026 · Basis: [FULL-AUDIT-REPORT.md](./FULL-AUDIT-REPORT.md) · Health Score: 61/100

Reihenfolge nach Wirkung pro Aufwand. Die Sofortmaßnahmen sind zusammen an einem halben Tag erledigt und heben den Score spürbar.

---

## Sofort (diese Woche)

### 1. Video-Preload abschalten — 31,7 MB pro Seitenaufruf

**Wirkung:** höchste im gesamten Audit. Betrifft jeden Besucher der Startseite.
**Aufwand:** 2 Minuten für den Sofortfix.

In `app/page.tsx:246`:

```diff
  <video
    className="w-full h-auto"
    controls
-   preload="auto"
+   preload="none"
+   poster="/ugc-creator-finden-poster.webp"
    playsInline
    controlsList="nodownload"
  >
```

`preload="none"` lädt das Video erst beim Klick auf Play. Das `poster`-Bild verhindert, dass an der Stelle vorher eine leere Fläche steht — es muss allerdings erst erzeugt werden, sonst läuft das Attribut in einen 404:

```bash
ffmpeg -i public/ugc-creator-finden.mp4 -vf "select=eq(n\,0)" -frames:v 1 \
  -q:v 3 public/ugc-creator-finden-poster.webp
```

**Nachgelagert (eigenes Ticket):** Die Datei mit 31,7 MB ist auch für den Abruf nach dem Klick zu groß. Zielgröße für ein Web-Demo-Video: 2–4 MB.

```bash
ffmpeg -i public/ugc-creator-finden.mp4 -vcodec libx264 -crf 28 -preset slow \
  -vf "scale='min(1280,iw)':-2" -acodec aac -b:a 96k -movflags +faststart \
  public/ugc-creator-finden-web.mp4
```

`-movflags +faststart` schiebt die Metadaten an den Dateianfang, damit die Wiedergabe startet, bevor alles geladen ist.

### 2. Titel-Template-Bug

6 Seiten tragen „… | UGC VZ | UGC VZ". Ursache: Seiten-Titel und Layout-Template hängen das Suffix beide an. Betroffen: `/about`, `/agb`, `/cookies`, `/datenschutz`, `/faq`, `/impressum`.

Fix: In den betroffenen `generateMetadata`/`metadata`-Exports das Suffix entfernen und ausschließlich über `title.template` im Root-Layout setzen.

### 3. `og:url` auf dynamischen Templates

`/wissen/seite/N`, `/brands/*` und `/creator/*` melden die Startseite als `og:url`. In `generateMetadata()` jeweils `openGraph.url` auf den tatsächlichen Pfad setzen. (Canonical ist bereits korrekt — es geht nur um Social-Vorschauen.)

### 4. ~~Jahreszahl-Widerspruch~~ — entfällt

Gemeldet war eine H1 „Strategie-Guide 2024" bei Titel „2026". Nachprüfung an
Live-HTML und Repo-Content: Beide lauten „2026". Der Befund war falsch, es ist
nichts zu tun.

---

## Hoch (nächste 2–4 Wochen)

### 5. Interne Verlinkung der 64 Artikel

**Der strukturell wichtigste Punkt des Audits.** Aktuell verlinkt kein Artikel auf einen anderen. Ohne Navigation und Footer wären 73 der 87 Seiten von der Startseite aus nicht erreichbar.

Vorgehen:
1. Die vorhandenen Themencluster nutzen — Preise, Recht/DSGVO, Briefing, Creator finden, Plattformvergleich
2. Pro Artikel 3–5 kontextuelle Links im Fließtext auf verwandte Artikel setzen
3. Zusätzlich ein „Weiterführende Artikel"-Modul am Artikelende, gespeist aus demselben Cluster
4. Ankertexte: Artikeltitel statt „Weiterlesen" (betrifft auch die 64 Hub-Links)

### 6. Money-Pages inhaltlich ausbauen

13 Seiten mit 117–588 Wörtern. Priorität nach Conversion-Nähe:

| Seite | aktuell | Ziel |
|---|---|---|
| `/creator` (Signup Creator) | 343 | 800+ — Verdienstbeispiele, Ablauf, FAQ |
| `/brands` (Signup Brands) | 588 | 800+ — Case Study mit Zahlen, Preisrahmen des Agentur-Supports |
| `/brands/ugc-creator-preise` | 193 | 800+ — die kanonische Preisquelle (siehe Punkt 7) |
| `/brands/ugc-creator-finden` | ~200 | 800+ |
| übrige `/brands/*`, `/creator/*` | 117–279 | 800+ |

Auf `/creator` fehlen numerische Belege vollständig, obwohl im Artikel `ugc-verdienst-…` passende Zahlen vorliegen.

### 7. Preisangaben konsolidieren

Vier Seiten nennen unterschiedliche Preisspannen für dieselbe Frage:

| Seite | Spanne |
|---|---|
| `ugc-video-preise-komplette-kosten-uebersicht-2025` | 150–2.500 € |
| `ugc-video-preise-2026-was-kostet-ugc-wirklich` | 200–5.000 €+ |
| `ugc-creator-preise-in-deutschland-realistische-ranges-2024` | 150–500 € / 2.500–5.000 € |
| `/brands/ugc-creator-preise` | eigene Angabe |

Das schadet doppelt: Google verteilt die Signale auf konkurrierende URLs, und AI-Systeme finden widersprüchliche Fakten in derselben Quelle. **Eine** gepflegte Preisseite als Referenz festlegen, die übrigen darauf verweisen lassen.

### 8. Navigation auf den 11 isolierten Seiten

9 `/brands/*`- und 2 `/creator/*`-Seiten rendern serverseitig weder `<header>` noch `<nav>`. Globale Navigation dort serverseitig ausgeben und Kontextlinks zu passenden Artikeln und Geschwisterseiten ergänzen.

### 9. Titel und Meta-Descriptions kürzen

- 57 Titel über 60 Zeichen (bis 94) — Keyword nach vorn, Suffix ggf. weglassen
- 38 Meta-Descriptions über 155 Zeichen (bis 193) — auf 120–155 kürzen

### 10. Quellenbelege ergänzen

41 von 64 Artikeln zitieren Statistiken — 141 Nennungen im Muster „Laut X (Jahr)", 336 bei weiter gefasster Zählung — und **keine einzige ist verlinkt**.

Die Quellen selbst sind überwiegend seriös (Nielsen, Gartner, HubSpot, Forrester, McKinsey). Das Problem ist nicht ihre Herkunft, sondern dass sich keine Zahl nachprüfen lässt — weder von Lesern noch von AI-Systemen, die Belegketten zunehmend gewichten.

Vorgehen: Zitate mit Quellenlink versehen, nicht zuordenbare Einzelfälle streichen. Wo möglich durch **eigene Plattformdaten** ersetzen — 370+ Creator-Profile sind ein Beleg, den kein Wettbewerber zitieren kann. Das ist zugleich der wirksamste Hebel für den Experience-Anteil der E-E-A-T-Bewertung, der aktuell bei 25/100 liegt.

### 11. Kundenlogos klarstellen

Die Logos stehen unter „Folgende Partner vertrauen auf unsere Agenturarbeit" und belegen die Mutteragentur famefact, nicht die Plattform. Ein klarstellender Zusatz („Kunden unserer Mutteragentur famefact") beugt Fehlinterpretation vor.

---

## Mittel (nächstes Quartal)

### 12. Antwort vor Erzählung

Alle geprüften Artikel öffnen mit „[Wochentag], [Uhrzeit] Uhr: …" und beantworten die Titelfrage erst nach 150–300 Wörtern. Einen Direktantwort-Absatz von 40–60 Wörtern voranstellen, die Erzählung danach. Das ist die Struktur, aus der AI-Systeme zitieren — und der einzige Punkt, an dem die sonst gute Artikelstruktur scheitert.

### 13. Structured Data auf den 11 Landingpages

`BreadcrumbList` plus `Service` ergänzen. Fertige Snippets mit echten Seitendaten liegen im Schema-Abschnitt des Audit-Reports.

**Kein FAQPage-Schema neu ausrollen.** Google zeigt FAQ-Rich-Results seit August 2023 nur für Behörden- und Gesundheitsseiten. Die bestehenden ~530 markierten Fragen schaden nicht, bringen aber nichts.

### 14. Schema-Entitäten verknüpfen

- `publisher` der 64 Artikel: `@id` auf `https://ugc-vz.de/#organization` setzen statt eines abweichenden Namens-Strings
- Person-Objekt für den Artikelautor auf `/about` ergänzen und per `@id` referenzieren — die Autor-URL zeigt derzeit auf eine Seite ohne passende Entität

### 15. `/creator` und `/brands` cachebar machen

Beide Seiten sind wegen `searchParams` als Server-Component-Prop bei jedem Request dynamisch (TTFB 175–254 ms statt 47–65 ms). Statusflags und Suchanfrage in einer Client-Komponente über `useSearchParams()` lesen, damit die Seiten-Shell statisch bleibt.

### 16. Städteseiten

Berlin, Hamburg und München sind zu 50 % wortgleich bei 123–140 Wörtern. Entweder echten lokalen Inhalt je Stadt (lokale Creator, örtliches Preisniveau, regionale Beispiele) oder auf eine Seite konsolidieren.

> **Vor einem Ausbau auf weitere Städte:** Ohne substanziellen eigenen Inhalt je Seite ist davon abzuraten. Ab etwa 30 Standortseiten wird ein Mindestanteil von 60 % einzigartigem Inhalt je Seite zur harten Voraussetzung.

### 17. `llms.txt` spezifikationskonform

Von `URL: Titel` auf `- [Titel](URL): Beschreibung` umstellen, echte Ein-Satz-Beschreibungen statt Titel-Duplikaten, nach Themen gruppieren.

---

## Niedrig (Backlog)

| # | Maßnahme |
|---|---|
| 18 | Polyfill-Bundle über `browserslist` reduzieren (41 KB, 21 % des JS-Budgets) |
| 19 | `/wissen/seite/2`: fehlendes `<meta name="robots">` ergänzen |
| 20 | 404-Seite: doppeltes `<title>` und `<meta robots>` bereinigen (HTTP-Status ist korrekt, daher unkritisch) |
| 21 | `www`-Redirect von 2 Hops auf 1 Hop verkürzen |
| 22 | `hreflang` konsistent auf allen Seiten setzen oder ganz entfernen |
| 23 | Schreibweise „track by track GmbH" vs. „Track by Track GmbH" vereinheitlichen |
| 24 | `dateModified` bei inhaltlichen Überarbeitungen tatsächlich aktualisieren |
| 25 | A2A-Investition nicht weiter priorisieren, bis Such-Assistenten A2A tatsächlich nutzen |

---

## Was ausdrücklich nicht angefasst werden sollte

Diese Bereiche sind überdurchschnittlich gelöst — Änderungen bergen mehr Risiko als Nutzen:

| Bereich | Warum |
|---|---|
| WordPress-Migration | 614 entfernte URLs mit `410 Gone`, Duplikate mit `308` — die saubere Variante |
| Security-Header | HSTS mit Preload, strikte CSP, `frame-ancestors: none` |
| Bildpipeline | 312 Bilder, alle mit Alt-Text, alle über `next/image`, keines über 200 KB, CLS = 0 |
| LCP-Priorisierung | Hero-Bild korrekt mit `fetchPriority="high"`, nicht lazy — der häufigste Performance-Fehler wurde vermieden |
| Kanonisierung | `https`/non-www/ohne Trailing Slash konsistent über alle 87 URLs |
| Artikellänge | 2.098–3.667 Wörter, keine Duplikate über 25 % Ähnlichkeit |
| Entity-Konsistenz | Firmendaten über alle Quellen hinweg widerspruchsfrei |

---

## Messbarkeit

Der Audit konnte ohne Search-Console-Zugriff keine Ranking- oder Traffic-Daten einbeziehen. Für die Erfolgskontrolle sinnvoll:

1. **Search Console** — Feld-CWV (insbesondere INP, das im Labor nicht messbar ist), Indexierungsstatus der 87 URLs, tatsächliche Kannibalisierung über die Abfrage-Seiten-Zuordnung
2. **Nach dem Video-Fix** — Feld-LCP der Startseite über 28 Tage beobachten
3. **Nach der internen Verlinkung** — Impressionen der Artikel, die bisher nur über den Hub erreichbar waren

# Goal: SEO Health Score von 61 auf 85

## Zielprompt

Hebe den SEO Health Score von ugc-vz.de von 61 auf mindestens 85, ohne die
bereits überdurchschnittlich gelösten Bereiche zu beschädigen. Erhalte die
410-Behandlung der 614 entfernten Artikel, die Security-Header, die
next/image-Pipeline, die Kanonisierung und die CLS von 0 unverändert. Führe
keine neue kostenpflichtige Infrastruktur und keine neue Dependency ein.

Beseitige zuerst das Ladeproblem der Startseite: Liefere das Demo-Video erst auf
Nutzerinteraktion aus und reduziere seine Dateigröße um mindestens eine
Größenordnung. Verbinde anschließend die 64 Ratgeber-Artikel untereinander zu
thematischen Clustern, sodass die Seitenstruktur nicht länger allein von
Navigation und Footer getragen wird. Gib den elf isolierten Landingpages eine
serverseitig gerenderte Navigation und strukturierte Daten. Baue die dreizehn
inhaltsleeren Conversion-Seiten redaktionell aus, löse die widersprüchlichen
Preisangaben zu einer gepflegten Referenz auf und belege oder entferne die
unverlinkten Statistiken. Kürze Titel und Meta-Descriptions auf die in den
Suchergebnissen darstellbare Länge und stelle jedem Artikel eine direkte Antwort
auf seine Titelfrage voran. Prüfe jede Maßnahme gegen die Messwerte aus dem
Audit, nicht gegen Annahmen.

## Ausgangslage

Ermittelt am 21.07.2026 über eine Vollerhebung aller 87 URLs, dokumentiert in
[seo/FULL-AUDIT-REPORT.md](./seo/FULL-AUDIT-REPORT.md), Maßnahmen in
[seo/ACTION-PLAN.md](./seo/ACTION-PLAN.md).

| Kategorie | Gewicht | Ist | Ziel |
|---|---|---|---|
| Technical SEO | 25 % | 78 | 92 |
| Content-Qualität | 25 % | 45 | 78 |
| On-Page SEO | 20 % | 55 | 85 |
| Schema | 10 % | 68 | 88 |
| Performance | 10 % | 48 | 85 |
| Bilder | 5 % | 92 | 95 |
| AI Search Readiness | 5 % | 55 | 80 |
| **Gesamt** | | **61** | **≈86** |

Der Engpass ist Content, nicht Technik. Rund die Hälfte des Score-Gewinns
erfordert redaktionelle Arbeit, die sich nicht durch Code ersetzen lässt.

## Abnahmekriterien

### Performance

- Die Startseite fordert im initialen Seitenaufruf weniger als 1 MB an; das
  Demo-Video wird erst nach Nutzerinteraktion geladen.
- Das Demo-Video ist kleiner als 4 MB und startet progressiv (`faststart`).
- Ein Poster-Bild existiert als Datei und liefert HTTP 200.
- Gemessenes LCP der Startseite liegt im Mobilprofil unter 2.500 ms, CLS bleibt
  bei 0.
- `/creator` und `/brands` liefern `x-vercel-cache: HIT` und ein TTFB unter
  100 ms.

### Interne Struktur

- Jeder der 64 Artikel verlinkt auf mindestens drei thematisch verwandte
  Artikel; kein Artikel bleibt ohne ausgehenden Artikel-Link.
- Ohne Navigation und Footer sind mindestens 60 der 87 Seiten von der Startseite
  aus über redaktionelle Links erreichbar (heute: 14).
- Die elf `/brands/*`- und `/creator/*`-Seiten rendern serverseitig `<header>`
  und `<nav>`.
- Kein Link trägt mehr den Ankertext „Weiterlesen"; Artikeltitel ersetzen ihn.

### Content

- Keine Seite unterhalb von 800 Wörtern außer den Rechtsseiten und der
  Pagination.
- Die drei Städteseiten unterscheiden sich zu mindestens 60 % im Wortbestand und
  enthalten je ortsspezifische Inhalte.
- Jede Statistikangabe trägt einen funktionierenden Quellenlink oder ist
  entfernt; nicht zuordenbare Quellen sind gestrichen.
- Eine einzige Seite ist die gepflegte Referenz für Preisangaben; alle weiteren
  Preisnennungen stimmen mit ihr überein oder verweisen auf sie.
- Mindestens ein Artikel je Themencluster belegt eine Aussage mit eigenen
  Plattformdaten statt mit Drittquellen.
- Die Kundenlogos auf der Startseite tragen eine Zuordnung, die sie eindeutig der
  Mutteragentur zuweist.

### On-Page

- Kein Titel überschreitet 60 Zeichen, keine Meta-Description 155 Zeichen.
- Kein Titel enthält das Markensuffix mehr als einmal.
- Jede Seite hat mindestens zwei H2-Überschriften.

### Schema und AI-Sichtbarkeit

- Alle 87 Seiten tragen mindestens `BreadcrumbList`; die elf Landingpages
  zusätzlich `Service`.
- Der `publisher` aller Artikel referenziert die Organisation per `@id`; die
  Autorenangabe zeigt auf eine existierende Person-Entität.
- Kein neues `FAQPage`-Markup wird ergänzt.
- Jeder Artikel beantwortet seine Titelfrage in den ersten 60 Wörtern.
- `llms.txt` folgt dem Format `- [Titel](URL): Beschreibung` mit eigenständigen
  Beschreibungen.

### Nicht verändern

- HTTP 410 für die 614 entfernten Artikel, 308 für Duplikat-Slugs.
- HSTS, CSP und die übrigen Security-Header.
- Auslieferung aller Bilder über `next/image`; `fetchPriority` des LCP-Bildes.
- Kanonisierung auf `https`, non-www, ohne Trailing Slash.

## Nachweis

- Erneuter Audit-Lauf über alle 87 URLs mit dokumentiertem Score je Kategorie.
- Browser-Messung der Startseite im Mobilprofil vor und nach dem Video-Fix.
- Linkgraph-Auswertung ohne Navigation und Footer als Beleg der internen
  Verlinkung.
- Wortzahlerhebung aller Seiten als Beleg der Content-Kriterien.
- Search Console nach vier Wochen für Feld-INP und Indexierungsstatus — im Labor
  nicht messbar.

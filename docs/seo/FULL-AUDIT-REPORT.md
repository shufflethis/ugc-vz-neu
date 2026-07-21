# SEO-Audit ugc-vz.de

**Datum:** 21.07.2026
**Umfang:** 87 URLs (vollständige Sitemap), Live-Site-Analyse
**Methodik:** curl-basierte Vollerhebung aller 87 Seiten, Browser-Messung der Core Web Vitals via CDP (chrome-headless-shell), Abgleich mit dem lokalen Repository
**Geschäftsmodell:** Zweiseitiger B2B-Marktplatz (Brands ↔ UGC-Creator), deutschsprachig, Next.js App Router auf Vercel

---

## SEO Health Score: 61 / 100

| Kategorie | Gewicht | Score | Beitrag |
|---|---|---|---|
| Technical SEO | 25 % | 78 | 19,5 |
| Content-Qualität | 25 % | 45 | 11,3 |
| On-Page SEO | 20 % | 55 | 11,0 |
| Schema / Structured Data | 10 % | 68 | 6,8 |
| Performance (CWV) | 10 % | 48 | 4,8 |
| Bilder | 5 % | 92 | 4,6 |
| AI Search Readiness | 5 % | 55 | 2,8 |
| **Gesamt** | | | **60,7 → 61** |

Die Bewertung fällt auseinander: Das **technische Fundament ist überdurchschnittlich** (Migration, Security, Bildpipeline, Rendering), während **Inhalt und interne Struktur** deutlich zurückliegen. Es ist eine solide gebaute Site mit einem Content- und Verlinkungsproblem — nicht umgekehrt.

---

## Die 5 kritischsten Probleme

1. **31,7 MB Video mit `preload="auto"` auf der Startseite** — 99,4 % des Seitengewichts, wird geladen, bevor jemand auf Play drückt
2. **Kein einziger Querverweis zwischen den 64 Ratgeber-Artikeln** — jeder Artikel hängt isoliert am Hub, kein Themencluster
3. **13 Money-Pages mit 117–588 Wörtern** — genau die Seiten mit der höchsten Conversion-Relevanz sind inhaltsleer
4. **11 dieser Seiten rendern serverseitig weder `<header>` noch `<nav>`** — sie haben 1–3 interne Links und kein Structured Data
5. **Statistik-Zitate ohne eine einzige Quellenangabe** — 141 Nennungen im Muster „Laut X (Jahr)", 336 bei weiter gefasster Zählung, dabei **null externe Quellenlinks**

## Die 5 schnellsten Gewinne

1. `preload="auto"` → `preload="none"` + `poster`-Bild (eine Zeile in `app/page.tsx:253`)
2. Doppeltes Titel-Suffix „| UGC VZ | UGC VZ" auf 6 Seiten (Template-Bug)
3. `og:url` auf dynamischen Templates zeigt auf die Startseite statt auf die eigene URL
4. 57 Titel über 60 Zeichen kürzen, 38 Meta-Descriptions über 155 Zeichen
5. Antwortsatz vor die Erzähl-Einleitung setzen (8/8 geprüfte Artikel beantworten die Titelfrage nicht im ersten Absatz)

---

## 1. Technical SEO — 78/100

### Was nachweislich funktioniert

| Prüfung | Ergebnis |
|---|---|
| Indexierbarkeit | 87 von 87 Sitemap-URLs liefern HTTP 200 — keine 404, keine Redirect-Ketten |
| Kanonisierung | `http` → `https` (308), `www` → non-www (301), Trailing Slash konsistent entfernt |
| Canonical-Tags | 12 Stichproben: je genau ein self-referenzielles Canonical, kein Mismatch |
| Soft-404 | Nicht existierende URLs liefern echten 404, `/wissen/seite/99` ebenfalls |
| Rendering | Alle Seitentypen liefern Fließtext im initialen HTML — Crawler brauchen kein JavaScript |
| Security-Header | HSTS (2 Jahre, `includeSubDomains`, `preload`), strikte CSP, `X-Frame-Options: DENY`, `nosniff`, Referrer- und Permissions-Policy |
| TTFB | 47–65 ms auf statischen Seiten |

### WordPress-Migration — vorbildlich gelöst

Im Repository liegen 679 Artikel, von denen nur 64 veröffentlicht sind. Die 614 entfernten URLs wurden korrekt behandelt:

| URL-Typ | Statuscode | Bewertung |
|---|---|---|
| Entfernte Artikel (614) | `410 Gone` | Korrekt — signalisiert endgültige Entfernung, Google deindexiert schnell |
| Duplikat-Slugs (`…-2`) | `308` auf das Original | Korrekt — Linkkraft bleibt erhalten |
| Unbekannte URLs | `404` | Korrekt |

Das ist die saubere Variante. Ein `404` statt `410` hätte Google monatelang weitercrawlen lassen, ein `301` auf die Startseite wäre ein Soft-404-Fehler gewesen.

### Befunde

| Priorität | Fund | Beleg |
|---|---|---|
| **Critical** | 11 Seiten (9× `/brands/*`, 2× `/creator/*`) rendern serverseitig weder `<header>` noch `<nav>`; ihr Hauptinhalt enthält nur 1–3 interne Links | HTML-Analyse aller 87 Seiten |
| High | `/creator` und `/brands` sind bei jedem Request dynamisch (`cache-control: private, no-store`, `x-vercel-cache: MISS`), TTFB 175–254 ms statt 47–65 ms | Ursache im Repo verifiziert: `searchParams` als Server-Component-Prop in `app/creator/page.tsx` und `app/brands/page.tsx` |
| Medium | `/wissen/seite/2` hat als einzige Seite kein `<meta name="robots">` | 11 von 12 Stichproben haben es explizit |
| Low | 404-Seite liefert zweimal `<title>` und zweimal `<meta robots>` (`noindex` + `index, follow`) | HTTP-Status ist korrekt 404, daher kein Indexierungsrisiko |
| Low | `og:url` zeigt auf die Startseite statt auf die eigene URL bei `/wissen/seite/N`, `/brands/*`, `/creator/*` | Canonical ist korrekt — betrifft nur Social-Sharing-Vorschauen |
| Low | `http://www` → Ziel braucht 2 Redirect-Hops (308 → 301) | Ein Hop wäre möglich |
| Low | `hreflang` nur auf der Startseite, auf Unterseiten fehlend | Bei einer rein deutschsprachigen Site ohne Wirkung — entfernen oder konsistent setzen |

---

## 2. Content-Qualität — 45/100

### Die Ausgangshypothese war falsch

Vor der Messung lag der Verdacht nahe, dass 67 von 87 URLs im `/wissen`-Hub auf Thin Content hindeuten. **Die Vollerhebung widerlegt das:**

| Segment | Anzahl | Min | Median | Max |
|---|---|---|---|---|
| Ratgeber-Artikel | 64 | 2.098 | 2.667 | 3.667 Wörter |

Kein einziger Artikel liegt unter 2.098 Wörtern. Auch die Duplikatsprüfung ist unauffällig: 5-Gramm-Jaccard-Ähnlichkeit maximal 0,025 — **kein Paar über 60 %**, nicht einmal über 25 %.

### Das Problem liegt woanders

Die inhaltsleeren Seiten sind ausgerechnet die conversion-relevanten:

| Seite | Wörter | Minimum für Service-Pages |
|---|---|---|
| `/creator/ugc-creator-werden` | 117 | 800 |
| `/brands/ugc-agentur-muenchen` | 123 | 800 |
| `/creator/ugc-creator-jobs` | 133 | 800 |
| `/brands/ugc-plattform-deutschland` | 133 | 800 |
| `/brands/ugc-agentur-hamburg` | 135 | 800 |
| `/brands/ugc-agentur-berlin` | 140 | 800 |
| `/creator` (Signup Creator) | 343 | 800 |
| `/brands` (Signup Brands) | 588 | 800 |

Die drei Städteseiten sind zusätzlich zu **50 % wortgleich** (Bag-of-Words-Jaccard) — Templating mit ausgetauschtem Städtenamen. Bei nur 123–140 Wörtern Gesamtlänge ist das für Google schwer von automatisch generiertem Content zu unterscheiden.

> **Hinweis zur Skalierung:** Aktuell sind es 3 Städteseiten. Das liegt unter der Warnschwelle von 30 Standortseiten. Ein Ausbau auf weitere Städte ist ohne echten lokalen Inhalt je Seite nicht zu empfehlen.

### E-E-A-T-Bewertung: ≈ 37/100

| Faktor | Score | Kernbefund |
|---|---|---|
| Experience | 25 | Alle 64 Artikel öffnen mit demselben Muster „[Wochentag], [Uhrzeit] Uhr: …". Kein Artikel nutzt die eigene Plattformdatenbasis („370+ Profile") als Beleg. |
| Expertise | 35 | Ein einziger Autor für alle 64 Artikel, dessen Nachname auf `/about` nirgends auftaucht. Das ausführliche Person-Schema gehört einer anderen Person (Geschäftsführer). |
| Authoritativeness | 30 | Statistik-Zitate in 41 von 64 Artikeln, **null** Quellenlinks (Details unten). Kundenlogos (Rewe, Autohero, Vattenfall …) stehen unter „Folgende Partner vertrauen auf unsere **Agenturarbeit**" — sie belegen die Mutteragentur famefact, nicht die Plattform. |
| Trustworthiness | 60 | Impressum vollständig (HRB, USt-ID, ladungsfähige Adresse). FAQ beantwortet transparent, wie die Plattform Geld verdient. Abzug für unbelegte Superlative. |

### Zu den Statistik-Zitaten — eigens nachgeprüft

Der Content-Agent meldete „262 Zitate, teils mit nicht auffindbaren Publikationsnamen". Diese Aussage wurde wegen ihrer Tragweite gegen das Repository nachgemessen und **teilweise korrigiert**:

| Prüfung | Ergebnis |
|---|---|
| Muster „Laut X (Jahr)" | 141 Nennungen |
| Weiter gefasst (inkl. „Studie von", „Daten von") | 336 Nennungen |
| Artikel mit mindestens einem Zitat | 41 von 64 |
| **Externe Quellenlinks** | **0** |
| Meistgenannte Quellen | Nielsen (77×), Gartner (61×), HubSpot (61×), Stackla (60×), Bazaarvoice (32×), Forrester (29×), McKinsey (21×) |
| „Content Moderation Quarterly" | 1 Vorkommen |

**Einordnung:** Die genannten Quellen sind ganz überwiegend reale, etablierte Marktforschungsinstitute. Der Vorwurf frei erfundener Statistiken ist **nicht belastbar** — die eine schwer zuzuordnende Publikation ist ein Einzelfall, kein Muster. Der belegbare Befund lautet: Keine dieser Zahlen ist verlinkt, damit ist keine für Leser oder AI-Systeme nachprüfbar. Das ist ein Belegproblem, keine Frage der Wahrhaftigkeit.

### Befunde

| Priorität | Fund | Fix |
|---|---|---|
| **Critical** | 13 Money-Pages mit 117–588 Wörtern | Auf 800+ Wörter ausbauen: Preisbeispiele, Prozessdetails, FAQ, Proof-Points |
| **Critical** | 3 Städteseiten zu 50 % textidentisch bei 123–140 Wörtern | Echten lokalen Inhalt ergänzen oder Seiten konsolidieren |
| High | Statistik-Zitate in 41 von 64 Artikeln ohne einen einzigen Quellenlink — nicht nachprüfbar | Quellen verlinken oder Zahlen durch eigene Plattformdaten ersetzen |
| High | Ein Autor ohne Expertise-Profil für alle 64 Artikel | Autorenprofile mit Qualifikationsnachweis; eigene Plattformdaten als Beleg nutzen |
| High | Kundenlogos suggerieren Plattform-Referenzen, belegen aber Agenturarbeit | Klarstellender Zusatz („Kunden unserer Mutteragentur famefact") |
| Medium | Keyword-Kannibalisierung: 4–6 URLs pro Kern-Keyword bei identischer Suchintention | Pillar-Struktur je Cluster, Sekundärartikel auf Long-Tail ausrichten |
| Medium | `/creator` ohne jeden numerischen Social Proof, obwohl Verdienstdaten in einem Artikel vorliegen | Zahlen auf die Signup-Seite holen |

---

## 3. On-Page SEO — 55/100

### Sauber

Keine fehlenden oder doppelten Title-Tags, keine fehlenden Meta-Descriptions, keine fehlende oder mehrfache H1, **keine Hierarchiesprünge** über alle 87 Seiten. Artikel haben im Schnitt 13,7 H2-Überschriften.

### Befunde

| Priorität | Fund | Zahl |
|---|---|---|
| **Critical** | **Kein einziger der 64 Artikel verlinkt auf einen anderen Artikel** — weder im Fließtext noch als „Verwandte Artikel" | 0 Cross-Links |
| High | Titel über 60 Zeichen (Abschneidegefahr in den Suchergebnissen) | 57 von 64 Artikeln, bis 94 Zeichen |
| High | Meta-Descriptions über 155 Zeichen | 38 von 64, bis 193 Zeichen |
| High | Seiten mit weniger als 2 H2 — identisch mit den inhaltsleeren Money-Pages | 4 |
| Medium | Doppeltes Marken-Suffix „… \| UGC VZ \| UGC VZ" | 6 Seiten |
| Medium | Generischer Ankertext „Weiterlesen" statt Artikeltitel | 64 Links |
| Medium | Keine externen Quellenverweise in den Artikeln | 1 externer Link sitewide (Footer-Credit) |

### Zur Klicktiefe

Alle 87 Seiten sind in maximal 3 Klicks erreichbar — **aber nur dank Footer und Navigation**. Klammert man diese aus und betrachtet nur redaktionelle Links, wären **73 von 87 Seiten von der Startseite aus gar nicht erreichbar**. Die Site trägt ihre Struktur vollständig über globale Navigationselemente, nicht über inhaltliche Verlinkung. Das ist die strukturelle Ursache hinter dem Cross-Link-Befund.

---

## 4. Schema / Structured Data — 68/100

**0 Parse-Fehler** über alle 87 URLs — jedes JSON-LD-Objekt ist valides JSON.

| Seitentyp | Anzahl | Structured Data |
|---|---|---|
| Artikel `/wissen/*` | 64 | BlogPosting + FAQPage + BreadcrumbList — 100 % einheitlich |
| Hubs (`/wissen`, Pagination) | 3 | ItemList + BreadcrumbList |
| Startseite, `/about` | 2 | Organization, Person, Service, WebSite (+ SearchAction) |
| `/faq`, `/brands`, `/creator` | 3 | FAQPage + BreadcrumbList (+ Service) |
| **`/brands/*`, `/creator/*`** | **11** | **keines** |

### Befunde

| Priorität | Fund | Fix |
|---|---|---|
| High | 11 kommerzielle Landingpages ohne jedes Markup, nicht einmal BreadcrumbList | `BreadcrumbList` + `Service` ergänzen |
| Medium | `publisher` der 64 Artikel ohne `@id`; Name „UGC VZ" statt „Track by Track GmbH" wie in der globalen Organization | `publisher.@id` auf `https://ugc-vz.de/#organization` setzen |
| Medium | Autor-Referenz zeigt auf `/about`, wo für diese Person kein Person-Objekt existiert | Person-Entity auf `/about` ergänzen und per `@id` referenzieren |
| Info | FAQPage-Markup auf ~530 Fragen (alle 64 Artikel, `/faq`, beide Hubs) | **Bringt keine Rich Results.** Google zeigt FAQ-Snippets seit August 2023 nur noch für Behörden- und Gesundheitsseiten. Kein Fehler, keine Abstrafung — aber nicht weiter ausrollen. |

---

## 5. Performance — 48/100

Gemessen mit Mobile-Emulation, 4× CPU-Drosselung, Slow-4G-Profil (entspricht dem Lighthouse-Mobilprofil).

| Metrik | Messwert | Bewertung |
|---|---|---|
| **CLS** | **0** | Ausgezeichnet |
| TTFB | 52 ms | Ausgezeichnet |
| FCP | 1.896 ms | In Ordnung |
| **LCP** | **3.132 ms** | Verbesserungsbedürftig (Ziel < 2.500 ms) |
| TBT (Näherung) | ≈ 488 ms | Verbesserungsbedürftig |
| JS komprimiert | 195 KB (13 Dateien) | In Ordnung |
| CSS komprimiert | 14 KB | Gut |
| Third-Party-Skripte | 0 | Ausgezeichnet |

> **Messhinweis:** LCP und CLS stammen aus einer **Labormessung** an einem einzelnen Seitenabruf, nicht aus CrUX-Felddaten (die PageSpeed-Insights-API war kontingentiert). **INP wurde nicht gemessen** — die Metrik erfordert echte Nutzerinteraktionen und lässt sich im Labor nicht sinnvoll erheben. Für belastbare Feldwerte ist die Search Console heranzuziehen.

### Der 31,7-MB-Befund

| Fakt | Beleg |
|---|---|
| Dateigröße | `content-length: 33.232.506` = 31,7 MB |
| Einbindung | `<video controls preload="auto" playsInline>` in `app/page.tsx:253` |
| Poster-Bild | fehlt |
| Restliche Seite | ~183 KB (HTML + 12 JS-Dateien + 14 Bilder + 2 Fonts) |

`preload="auto"` weist den Browser an, das Video sofort zu laden — unabhängig davon, ob es je abgespielt wird. Das Video ist **99,4 % des Seitengewichts**. Zur Einordnung: Über eine Slow-4G-Leitung (1,6 Mbit/s) entspricht diese Datenmenge rechnerisch rund 166 Sekunden Übertragungszeit. *(Arithmetische Herleitung aus Dateigröße und Bandbreite, keine Messung — der reale Wert hängt vom progressiven Ladeverhalten des Browsers ab.)*

**Fix:** `preload="none"` plus `poster`-Bild. Zusätzlich sollte die Datei komprimiert werden — 31,7 MB sind für ein Web-Demo-Video um mindestens eine Größenordnung zu viel.

### Weiteres

- **41 KB Polyfills** (21 % des JS-Budgets) für Browser, die praktisch nicht mehr im Einsatz sind — über `browserslist` reduzierbar
- LCP-Element ist das Hero-Bild `ugc-tool.webp` — korrekt mit `fetchPriority="high"` priorisiert und nicht lazy geladen

---

## 6. Bilder — 92/100

Der stärkste Bereich des Audits. Vollerhebung über 312 `<img>`-Elemente:

| Prüfung | Ergebnis |
|---|---|
| Ohne Alt-Attribut | 0 |
| Generischer Alt-Text („image", „logo", Dateiname) | 0 |
| Über `next/image` ausgeliefert | 312 (100 %) |
| Roh ausgelieferte PNG/JPG | 0 |
| Größer als 200 KB | 0 (größtes Bild: 107 KB) |
| LCP-Bild fälschlich lazy geladen | nein — korrekt `fetchpriority="high"` |
| CLS-Risiko durch fehlende Dimensionen | keines — 169 Bilder mit expliziten Maßen, 143 im `fill`-Modus mit CSS-seitig fixiertem Seitenverhältnis |

Der häufigste und teuerste Bildfehler — ein lazy geladenes LCP-Bild — tritt hier **nicht** auf. Die gemessene CLS von 0 bestätigt die Analyse unabhängig.

Einziger Restbefund (Priorität niedrig): 2 von 6 Partnerlogos bleiben PNG statt WebP — bei 1,4–2,5 KB ohne messbare Wirkung.

---

## 7. AI Search Readiness — 55/100

| Prüfung | Ergebnis |
|---|---|
| AI-Crawler in robots.txt | GPTBot, ClaudeBot, PerplexityBot, ChatGPT-User, Google-Extended — alle erlaubt |
| `llms.txt` | vorhanden, inhaltlich aktuell, alle 64 Artikel gelistet |
| Entity-Konsistenz | Firmenname, Adresse, Geschäftsführer, USt-ID über Homepage, `/about`, Impressum, FAQ und llms.txt hinweg **widerspruchsfrei** |
| Strukturierte Extrahierbarkeit | Artikel mit 12–15 H2, Tabellen, Vergleichsmatrizen — gut extrahierbar |
| Answer-First-Struktur | **8 von 8 geprüften Artikeln scheitern** |

### Befunde

| Priorität | Fund |
|---|---|
| High | **Widersprüchliche Preisangaben derselben Domain:** „Was kostet UGC?" wird auf vier Seiten mit unterschiedlichen Spannen beantwortet — 150–2.500 €, 200–5.000 €+, 150–500 € / 2.500–5.000 €. Ein AI-System, das mehrere Seiten crawlt, erhält widersprüchliche Fakten aus einer Quelle. |
| ~~High~~ **entfällt** | Gemeldet war ein Widerspruch „Titel 2026 / H1 2024". Nachprüfung an Live-HTML und Repo-Content: H1 und Titel lauten beide „Strategie-Guide 2026". **Befund war falsch.** |
| High | Die kommerziell wertvollsten Seiten sind schema-frei und inhaltsarm — zitierfähige Substanz liegt ausschließlich im `/wissen`-Bereich. AI-Systeme werden eher Ratgeber als Conversion-Seiten zitieren. |
| Medium | Alle Artikel öffnen narrativ statt mit einer Antwort; die Titelfrage wird erst nach 150–300 Wörtern beantwortet |
| Medium | `llms.txt` nutzt `URL: Titel` statt des spezifikationskonformen `- [Titel](URL): Beschreibung`; Beschreibungen sind Titel-Duplikate |
| Medium | Der A2A-Endpunkt ist technisch echt implementiert (JSON-RPC, valide Agent-Card), liegt aber hinter einer Bezahlschranke (29–100 €/Monat, HTTP 402). **Kein Consumer-AI-Produkt ruft derzeit bezahlte A2A-APIs im Suchfluss auf** — aktuell kein messbarer Sichtbarkeitshebel. |

---

## Methodische Einschränkungen

Damit die Zahlen richtig eingeordnet werden:

1. **Keine Felddaten.** Alle Performance-Werte sind Labormessungen eines einzelnen Abrufs. Die PageSpeed-Insights-API war kontingentiert, CrUX-Daten liegen nicht vor.
2. **INP nicht gemessen.** Die Metrik erfordert echte Nutzerinteraktionen. Der ausgewiesene TBT-Wert ist ein Laborindikator, kein INP-Ersatz.
3. **Keine Ranking- oder Traffic-Daten.** Ohne Search-Console-Zugriff lässt sich nicht sagen, welche Seiten tatsächlich Sichtbarkeit haben. Die Kannibalisierungsbefunde sind aus Suchintention abgeleitet, nicht aus Performance-Daten belegt.
4. **Drei Agent-Befunde wurden nach eigener Nachprüfung korrigiert:**
   - „H1 lautet 2024 statt 2026" ließ sich weder im Live-HTML noch im Repo-Content
     reproduzieren — beide sagen 2026. Befund **verworfen**.
   - „Kein Article-Schema" beruhte auf einer Textsuche nach „Article", die den Subtyp `BlogPosting` übersah. Nachprüfung bestätigt vollständiges BlogPosting-Markup inklusive aller Pflichtfelder — Befund **verworfen**.
   - „262 Zitate, teils nicht auffindbare Publikationen" wurde auf 141 (enges Muster) bzw. 336 (weites Muster) präzisiert; die Quellen sind überwiegend etablierte Institute. Der Vorwurf möglicher Erfindung ist **entfernt**, der belegbare Kern (0 Quellenlinks) bleibt.

   Beide Korrekturen betrafen denselben Agent. Die übrigen Abweichungen zwischen den Agents (Wort- vs. Zeichenzählung, `dateModified`-Stichproben) sind Methodenunterschiede, keine Widersprüche, und verändern keinen Befund.
5. Die Video-Gegenprobe (Messung ohne das 31,7-MB-Video) konnte aus Speichermangel auf dem Testsystem nicht durchgeführt werden.

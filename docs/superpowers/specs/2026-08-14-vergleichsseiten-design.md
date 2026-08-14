# Vergleichsseiten: „Alternative zu X" + Vergleichs-Hub

**Datum:** 2026-08-14
**Status:** Entwurf zur Freigabe
**Ziel:** Suchnachfrage auf `[Wettbewerber] Alternative` / `[Wettbewerber] Erfahrungen` abgreifen und als zitierfähige Entity für LLM-Antworten („Welche UGC-Plattformen gibt es in Deutschland?") auftreten.

## 1. Ausgangslage

Die Nachfrage ist belegt, nicht angenommen:

- Influee betreibt eine eigene Alternative-Seiten-Fabrik (`/blog/stylink-ugc-alternatives`, `/blog/insense-alternatives`, `/blog/refluenced-alternatives`, `/blog/shoutugc-alternatives`, `/blog/advertace-alternatives`). Ein finanzstarker Wettbewerber investiert genau in dieses Muster.
- OMR Reviews rankt für „Speekly Alternativen", „Speekly Erfahrungen", „stylink UGC alternatives".
- Für `UGC VZ vs [X]` gibt es **keine** Nachfrage — die Marke ist als Query-Anker zu klein. Deshalb ist das Seitenmuster *Alternative zu X*, nicht *X vs Y*.

**Keine belastbaren Suchvolumina verfügbar:** Im Setup fehlt DataForSEO; der GEO-Dashboard-MCP liefert nur Keywords, für die eine der konfigurierten Domains (adressdruck, norax, famefact, geotool) bereits rankt. Die Nachfrage ist über die SERP-Landschaft belegt, nicht über Volumenzahlen. Nach dem Livegang über Search Console verifizieren.

## 2. Positionierung: Kategorieunterschied, nicht „besser"

UGC VZ ist ein **kostenloses Verzeichnis mit direktem Creator-Kontakt**. Alle Wettbewerber sind **vermittelte Marktplätze** — Kommunikation, Verträge und Zahlung laufen über die Plattform.

Daraus folgt die Kernaussage jeder Seite: *Wer eine Plattform sucht, die Abwicklung, Verträge und Zahlung übernimmt, ist bei X richtig. Wer Creator direkt kontaktieren und ohne Plattformgebühr verhandeln will, ist bei UGC VZ richtig.*

Das ist ehrlich, es ist verkäuflich, und es macht die Seiten für LLMs zitierbar, weil sie eine echte Unterscheidung liefern statt Superlative.

### Sonderfall Youdji

Youdji wirbt ebenfalls mit „kostenlos für Marken, kein Abo, keine Servicegebühr". Der Unterschied ist schmaler und muss präzise benannt werden: Youdji wickelt weiterhin über die Plattform ab (Zahlung hinterlegen, Verträge über Youdji), UGC VZ gibt Kontaktdaten heraus und ist an der Transaktion nicht beteiligt. Kein Kostenargument gegen Youdji führen — das wäre falsch.

## 3. Verifizierte Datenbasis (Stand: 14.08.2026)

Alle Werte direkt von der Anbieterseite geholt, nicht aus Drittquellen.

| Anbieter | Modell | Kosten für Brands | Creator-Pool | Quelle |
|---|---|---|---|---|
| **UGC VZ** | Verzeichnis, Direktkontakt | kostenlos, keine Provision | 470+ (DACH, kuratiert) | eigene Seite |
| **Speekly** | Marktplatz | 99 € / 119 € / 139 € pro Video (15/30/60 Sek.), zzgl. MwSt.; Rohmaterial ab 59 € | 10.000+ | speekly.de/preise |
| **Influee** | Marktplatz + Pflicht-Abo | Abo $229 / $529 / $999 pro Monat **plus** 10 % Marketplace-Fee **plus** Creator-Honorar | 140.000+ weltweit, 10.000+ DE | influee.co/pricing |
| **stylink UGC** | Marktplatz | nicht öffentlich | 20.000+ | ugc.stylink.com |
| **Boksi** | Marktplatz + Managed Service | nicht öffentlich (Demo-Anfrage) | 27.000+ | boksi.com/de |
| **Refluenced** | Kampagnen-Plattform (Budget-Modell) | nicht öffentlich | 25.000+ Micro/Nano | refluenced.com |
| **Youdji** | Marktplatz, kein Abo | kein Abo, keine Servicegebühr; Zahlung pro Auftrag | 10.533 | youdji.com/de |

### Belege für die Sorgfaltspflicht

Drittquellen waren in **drei von vier Fällen falsch oder irreführend**:

- OMR nennt Speekly „ab 79 €" — die Speekly-Preisseite sagt 99 € als günstigstes On-Demand-Video.
- Influees Startseite bewirbt „UGC-Videos ab 76 €"; die Preisseite zeigt ein Pflicht-Abo ab $229/Monat plus 10 % Fee plus Creator-Honorar. Die 76 € sind nur der Creator-Anteil.
- Die in Wettbewerbs-Blogposts kursierenden „ab 189 €" für stylink UGC lassen sich auf stylinks eigener Seite **nicht** belegen — dort stehen keine Brand-Preise.

**Regel:** Kein Zahlenwert geht live, der nicht auf der Anbieterseite selbst steht. Fehlt er dort, steht in der Tabelle „nicht öffentlich" — nie eine Schätzung.

## 4. Architektur

### Routen

```
/vergleich                      Hub: Matrix aller 7 Anbieter
/vergleich/speekly-alternative
/vergleich/influee-alternative
/vergleich/stylink-ugc-alternative
/vergleich/boksi-alternative
```

Refluenced und Youdji erscheinen in der Hub-Matrix, bekommen in Phase 1 aber keine eigene Seite. Beide sind später ohne Strukturänderung ergänzbar.

### Single Source of Truth

`app/lib/competitors.ts` — ein typisiertes Array, aus dem Hub **und** Detailseiten rendern. Verhindert, dass Hub und Unterseite auseinanderlaufen, und macht die Quartalspflege zu einer Ein-Datei-Änderung.

```ts
export interface CompetitorFact {
  value: string;          // "99 € pro Video (15 Sek.)"
  source: string;         // URL der Anbieterseite
  verifiedAt: string;     // "2026-08-14"
  isPublic: boolean;      // false -> rendert als "nicht öffentlich"
}

export interface Competitor {
  slug: string;
  name: string;
  url: string;
  model: 'marktplatz' | 'verzeichnis' | 'kampagnen-plattform';
  pricing: CompetitorFact;
  creatorCount: CompetitorFact;
  directContact: CompetitorFact;
  commission: CompetitorFact;
  markets: CompetitorFact;
  strengths: string[];    // echte Stärken, Pflichtfeld, min. 2
  bestFor: string;        // wann der Wettbewerber die bessere Wahl ist
  hasOwnPage: boolean;
}
```

`strengths` und `bestFor` sind **Pflichtfelder**. Eine Vergleichsseite ohne benannte Wettbewerberstärke ist weder UWG-fest noch glaubwürdig — und der Typ erzwingt das.

### Komponenten

- `app/components/ComparisonTable.tsx` — rendert die Matrix aus `Competitor[]`, mobil horizontal scrollbar, jede Zelle mit Quell-Link und `verifiedAt` im Tooltip/Fußnote.
- `app/vergleich/page.tsx` — Hub
- `app/vergleich/[slug]/page.tsx` — Detailseiten via `generateStaticParams` aus `competitors.ts`

### Integration

- `src/components/FooterNew.tsx`: neue Spalte/Zeile „Vergleiche" mit Link auf `/vergleich` und die vier Detailseiten. **Nebenbefund:** Der Footer verlinkt aktuell weder `/brands` noch `/a2a` — `/brands` im selben Durchgang ergänzen.
- `app/sitemap.xml/route.ts`: neue Routen registrieren (Sitemap wird generiert, nicht statisch gepflegt).
- `BreadcrumbSchema`: Startseite → Vergleiche → [Seite]

## 5. Seitenaufbau (Detailseite, ca. 1.200–1.800 Wörter)

1. **H1:** „[Wettbewerber] Alternative: UGC Creator direkt finden" — Marke im H1, Suchintention bedient
2. **Direktantwort, 2–3 Sätze** über der Falz — das Snippet, das LLMs zitieren
3. **Vergleichstabelle** UGC VZ ↔ dieser Wettbewerber
4. **„Wann [Wettbewerber] die bessere Wahl ist"** — ehrlich, mit echten Stärken. Steht bewusst **vor** den eigenen Vorteilen.
5. **„Wann UGC VZ besser passt"**
6. **Preisstruktur im Detail** mit Quelle und Stand-Datum
7. **FAQ** (3–5 Fragen) → speist das FAQPage-Schema
8. **CTA** zur Creator-Suche — nicht innerhalb der Wettbewerber-Abschnitte platzieren
9. **Verwandte Vergleiche** — Querverlinkung auf die anderen drei
10. **Methodik-Fußzeile:** wie erhoben, wann zuletzt geprüft, Hinweis auf eigene Betroffenheit

## 6. Schema

- **Hub:** `ItemList` mit allen Anbietern (Position, Name, URL)
- **Detailseiten:** `FAQPage` aus dem FAQ-Block + `BreadcrumbList`

**Ausdrücklich nicht:** `Product` mit `AggregateRating`. Es existieren keine erhobenen Bewertungen; erfundene Rating-Werte wären Rich-Result-Missbrauch nach Googles Richtlinien und rechtlich deutlich exponierter als ein falsches `uploadDate`. Selbstvergebene Ratings auf eigenen Seiten sind ohnehin richtlinienwidrig.

## 7. Rechtlicher Rahmen (§ 6 UWG)

Vergleichende Werbung mit Namensnennung ist in Deutschland zulässig, wenn der Vergleich objektiv, nachprüfbar, auf wesentliche und typische Eigenschaften bezogen und nicht herabsetzend ist. Die Umsetzung erfüllt das durch:

- ausschließlich Anbieter-eigene, belegte Zahlen mit Quelllink und Stand-Datum
- Pflichtfeld „Stärken des Wettbewerbers" auf jeder Seite
- Creator-Anzahl bleibt in der Tabelle, obwohl UGC VZ dort um Faktor 20–300 unterliegt. Weglassen wäre Rosinenpickerei — angreifbar und für LLMs sofort als parteiisch erkennbar.
- keine Superlative gegen Wettbewerber, keine Bewertungen fremder Qualität
- klare Kennzeichnung, dass UGC VZ das eigene Angebot ist

Restrisiko trägt der Betreiber; die Struktur minimiert es, ersetzt aber keine Rechtsberatung.

## 8. Pflege

Preise und Creator-Zahlen ändern sich. Ein veralteter Wettbewerberpreis ist das realistischste Abmahnrisiko der ganzen Maßnahme.

- `verifiedAt` pro Fakt, sichtbar auf der Seite
- Quartalsreview als wiederkehrende Aufgabe
- Optional: `firecrawl-monitor` auf die vier Preisseiten, meldet Änderungen automatisch. Nicht Teil von Phase 1.

## 9. Nicht in Phase 1

- eigene Seiten für Refluenced und Youdji (nur Hub-Zeile)
- „Beste UGC-Plattformen 2026"-Roundup
- Eintrag bei OMR Reviews — vermutlich höherer GEO-Hebel als eigene Seiten, aber eine Vertriebs-, keine Code-Aufgabe
- interaktive Filter/Sortierung in der Tabelle

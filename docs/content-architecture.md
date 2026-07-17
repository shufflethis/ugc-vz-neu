# Content-Architektur

## Ist-Stand

Der Wissensbereich ist vollständig dateibasiert. Zur Laufzeit gibt es keinen
Abruf und keine Authentifizierung gegen WordPress. Der Next.js-Build liest das
Manifest `content/wissen/index.json`, erzeugt die paginierten Übersichten und
rendert jeden veröffentlichbaren Artikel als statisches HTML.

Der Migrationsreport `content/wordpress-export-report.json` weist 678 frühere
Datensätze aus. 64 Datensätze enthalten belastbare Langform-Inhalte. 614
Datensätze enthielten ausschließlich eine frühere 404-Platzhalterantwort und
stehen in `content/gone-slugs.json`. Sie werden nicht als Artikel veröffentlicht.

## Dateien

- `content/wissen/<slug>.json`: vollständiger, bereinigter Artikel
- `content/wissen/index.json`: kompaktes Build- und Listing-Manifest
- `content/published-slugs.json`: erlaubte Artikelpfade
- `content/gone-slugs.json`: dauerhaft entfernte Altpfade
- `content/authors.json`: zentrale Autorenidentität
- `public/wp-content/uploads/`: archivierte Originalmedien
- `scripts/export-wordpress-content.mjs`: reproduzierbarer Einmal-Exporter

## Rendering und SEO

- `/wissen`: erste 30 Artikel
- `/wissen/seite/2` und `/wissen/seite/3`: weitere Artikel
- `/wissen/<slug>`: SSG-Artikel mit genau einem sichtbaren H1
- ein primäres `BlogPosting`-Schema pro Artikel
- optional ein getrenntes `FAQPage`-Schema bei echten FAQ-Daten
- selbstreferenzierender Canonical und stabile `datePublished`/`dateModified`
- `/sitemap.xml`: nur erreichbare, indexierbare URLs
- entfernte Wissenspfade: HTTP 410 und `X-Robots-Tag: noindex, follow`

## Inhalte bearbeiten

Artikel werden direkt im passenden JSON-Dokument geändert. Danach muss das
zugehörige Objekt in `index.json` synchron bleiben. Titel, Beschreibung,
Datumswerte, Autor, Bildpfad und `contentStatus` dürfen nicht voneinander
abweichen. Vor einem Merge mindestens ausführen:

```bash
npx tsc --noEmit
npm run build
```

Bei neuen Artikeln zusätzlich Slug in `published-slugs.json` aufnehmen. Bei
dauerhaft entfernten Artikeln den Slug aus der Published-Liste entfernen und in
`gone-slugs.json` aufnehmen. Neue Medien werden unter `public/` versioniert.

## Alt-Host

Nach dem DNS-Cutover nimmt dasselbe Vercel-Projekt auch `wp.ugc-vz.de` an.
Veröffentlichte alte Slugs leiten permanent auf `/wissen/<slug>` weiter,
Upload-Pfade bleiben direkt abrufbar und alle übrigen Backend-/Platzhalterpfade
liefern 410. Das frühere WordPress darf erst nach dieser Live-Prüfung abgeschaltet
werden.

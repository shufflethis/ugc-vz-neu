# Goal: WordPress-freier Betrieb von UGC VZ

## Zielprompt

Betreibe UGC VZ vollständig WordPress-frei auf GitHub und Vercel. Migriere alle
678 früher veröffentlichten Datensätze und ihre Medien verlustfrei in das
Repository. Veröffentliche nur belastbare Artikel statisch, liefere frühere
Platzhalterinhalte mit HTTP 410 aus und erhalte funktionierende Alt-URLs und
Medienpfade. Entferne WordPress-, Tally- und Airtable-Abhängigkeiten aus der
produktiven Laufzeit und lösche ihre Secrets erst nach geprüftem Cutover.

Betreibe Creator-Suche, Registrierung, Brand-Leads und Versand effizient und
idempotent über Neon und Resend. Erhalte die geschützten Google-Sheets-
Arbeitsansichten, einschließlich privater Kontaktdaten für berechtigte
Mitarbeitende. Nutze ausschließlich cookielose Plausible-Reichweitenmessung. Führe
TypeScript-, Datenbank-, Export-, E-Mail-, Build-, Crawl- und Live-Tests aus,
dokumentiere den Ist-Stand und deploye nach erfolgreicher Prüfung auf das
bestehende Vercel-Projekt. Nutze keine neue kostenpflichtige Infrastruktur und
keine neue Dependency.

## Abnahmekriterien

- Alle 678 Quelldatensätze sind versioniert und per Prüfreport nachvollziehbar.
- Alle 64 echten Artikel sind SSG, selbstkanonisch und in der Sitemap.
- Die 614 reinen 404-Platzhalter sind nicht indexierbar und liefern HTTP 410.
- Pro Artikel existieren genau ein H1 und ein primäres Article-Schema.
- Sitemap, Canonicals und Artikel-HTML enthalten keine `wp.ugc-vz.de`-Leaks.
- Alle 638 referenzierten Medien liegen unter ihrem bisherigen Upload-Pfad vor.
- Suche und Lead-Auswahl verwenden ausschließlich aktive Neon-Profile.
- Ein Lead wird vor dem Versand gespeichert, Resend-Aufrufe sind idempotent.
- Öffentlicher Export enthält keine privaten Felder; geschützter interner Export
  enthält operative Kontaktdaten und Einwilligungsstände.
- Plausible ist die einzige aktive Analytics-Integration und setzt keine Cookies.
- Preview- und Produktionsbuild sind erfolgreich, die Live-Routen sind geprüft.

# Security-Header

`next.config.js` setzt die Header auf statischen und dynamischen Antworten.
`middleware.ts` setzt dieselbe Grundlinie zusätzlich auf Alt-Host-, Redirect-
und 410-Antworten.

## Aktive Regeln

- Content Security Policy mit `default-src 'self'`
- `frame-ancestors 'none'` und `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- restriktive `Permissions-Policy`
- HSTS auf HTTPS-Antworten
- API-Antworten standardmäßig ohne Cache

Für die cookielose Reichweitenmessung ist ausschließlich
`https://analytics.polymarkt.de` in `script-src` und `connect-src` erlaubt. Es
gibt keine Browser-Freigaben für Google Analytics, WordPress, Airtable, Tally
oder Klaro.

Nach Änderungen mindestens Homepage, einen Artikel, ein Bild, eine API-Antwort
und eine 410-URL im Preview auf Header und Funktion prüfen.

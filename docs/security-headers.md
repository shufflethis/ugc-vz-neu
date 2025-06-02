# Sicherheits-Header Implementierung UGC-VZ

## Übersicht

Dieses Dokument beschreibt die implementierten HTTP-Sicherheits-Header für die UGC-VZ Anwendung.

## Implementierte Sicherheits-Header

### 1. Content Security Policy (CSP) ✅

**Header:** `Content-Security-Policy`

**Zweck:** Verhindert XSS-Angriffe durch Kontrolle der erlaubten Ressourcen-Quellen.

**Konfiguration:**
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' 
  https://www.googletagmanager.com 
  https://www.google-analytics.com 
  https://cdn.kiprotect.com;
style-src 'self' 'unsafe-inline' 
  https://fonts.googleapis.com 
  https://cdn.kiprotect.com;
img-src 'self' data: blob: 
  https://wp.ugc-vz.de 
  https://p16-sign-va.tiktokcdn.com 
  [weitere erlaubte Domains];
connect-src 'self' 
  https://wp.ugc-vz.de 
  https://www.google-analytics.com 
  https://hooks.slack.com 
  https://api.airtable.com;
frame-src 'none';
object-src 'none';
```

**Begründung für 'unsafe-inline':**
- Google Analytics und Klaro Cookie Consent benötigen Inline-Scripts
- Alternative: Nonce-basierte CSP (komplexere Implementierung)

### 2. X-Frame-Options ✅

**Header:** `X-Frame-Options: DENY`

**Zweck:** Verhindert Clickjacking-Angriffe durch Verbot des Einbettens in Frames.

**Alternative:** `frame-ancestors 'none'` in CSP (moderne Browser)

### 3. X-Content-Type-Options ✅

**Header:** `X-Content-Type-Options: nosniff`

**Zweck:** Verhindert MIME-Type-Sniffing, das zu Code-Injection führen kann.

**Anwendung:** Alle Responses (Pages + API)

### 4. Referrer-Policy ✅

**Header:** `Referrer-Policy: strict-origin-when-cross-origin`

**Zweck:** Kontrolliert, welche Referrer-Informationen an externe Domains gesendet werden.

**Verhalten:**
- Same-Origin: Vollständige URL
- Cross-Origin HTTPS→HTTPS: Nur Origin
- Cross-Origin HTTPS→HTTP: Keine Referrer

### 5. X-XSS-Protection ✅

**Header:** `X-XSS-Protection: 1; mode=block`

**Zweck:** Aktiviert XSS-Filter in älteren Browsern (Legacy-Support).

**Hinweis:** Moderne Browser verwenden CSP statt XSS-Protection.

### 6. Strict-Transport-Security (HSTS) ✅

**Header:** `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

**Zweck:** Erzwingt HTTPS-Verbindungen für 1 Jahr.

**Anwendung:** Nur bei HTTPS-Verbindungen

### 7. Permissions-Policy ✅

**Header:** `Permissions-Policy: camera=(), microphone=(), geolocation=()`

**Zweck:** Deaktiviert nicht benötigte Browser-APIs.

## Implementierung

### Middleware (middleware.ts)
```typescript
// Setzt Header für alle Seiten
response.headers.set('Content-Security-Policy', cspHeader)
response.headers.set('X-Frame-Options', 'DENY')
response.headers.set('X-Content-Type-Options', 'nosniff')
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
```

### Next.js Config (next.config.js)
```javascript
// Zusätzliche Header für API-Routen
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
      ],
    },
  ]
}
```

### API-Routen
```typescript
// Explizite Header-Setzung in kritischen APIs
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('Cache-Control', 'public, max-age=120');
```

## Sicherheitsbewertung

### Vor der Implementierung ❌
- Fehlende Content Security Policy
- Fehlende X-Frame-Options
- Fehlende X-Content-Type-Options
- Fehlende Referrer-Policy

### Nach der Implementierung ✅
- Umfassende CSP mit erlaubten Domains
- Clickjacking-Schutz aktiviert
- MIME-Sniffing verhindert
- Kontrollierte Referrer-Übertragung
- HSTS für HTTPS-Erzwingung
- Deaktivierte Browser-APIs

## Testing

### Sicherheits-Header prüfen
```bash
# Lokale Entwicklung
curl -I http://localhost:3000

# Produktion
curl -I https://ugc-vz.de
```

### Online-Tools
- [Security Headers](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

### Erwartete Bewertung
- Security Headers: A+ Rating
- Mozilla Observatory: A+ Rating
- CSP Evaluator: Grün (mit Hinweis auf 'unsafe-inline')

## Monitoring

### CSP Violation Reporting
```javascript
// Optional: CSP Violation Reporting
report-uri /api/csp-report;
report-to csp-endpoint;
```

### Log-Überwachung
- Browser-Konsole auf CSP-Violations prüfen
- Server-Logs auf blockierte Requests überwachen
- Performance-Impact der Header messen

## Wartung

### Regelmäßige Überprüfung
- [ ] Monatliche Sicherheits-Header-Tests
- [ ] CSP-Policy bei neuen externen Services aktualisieren
- [ ] Browser-Kompatibilität prüfen
- [ ] Performance-Impact bewerten

### Bei neuen Features
- [ ] CSP für neue externe Domains erweitern
- [ ] Cache-Control für neue API-Endpunkte konfigurieren
- [ ] Permissions-Policy bei neuen Browser-APIs anpassen

## Troubleshooting

### CSP-Violations
```
Refused to load script from 'https://example.com/script.js' 
because it violates the following Content Security Policy directive
```

**Lösung:** Domain zu `script-src` in CSP hinzufügen

### Blocked Frames
```
Refused to display in a frame because it set 'X-Frame-Options' to 'deny'
```

**Lösung:** Gewollt - verhindert Clickjacking

### MIME-Type Errors
```
The resource was blocked due to MIME type mismatch
```

**Lösung:** Korrekte Content-Type Header setzen

## Compliance

### OWASP Top 10
- ✅ A03:2021 – Injection (CSP verhindert XSS)
- ✅ A05:2021 – Security Misconfiguration (Header konfiguriert)
- ✅ A06:2021 – Vulnerable Components (CSP begrenzt externe Ressourcen)

### GDPR/DSGVO
- ✅ Referrer-Policy schützt Benutzer-Privacy
- ✅ CSP verhindert Tracking ohne Consent
- ✅ Sichere Cookie-Übertragung durch HSTS

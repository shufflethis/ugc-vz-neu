# Google Analytics Implementation für UGC-VZ

## Übersicht

Die Google Analytics Implementierung für UGC-VZ ist vollständig GDPR-konform und integriert sich nahtlos in das bestehende Klaro Cookie Consent System.

## Tracking ID

**Google Analytics Tracking ID:** `G-CE33NMGRD2`

## Implementierung

### 1. Google Tag Integration

Der Google Analytics Code wurde in `app/layout.tsx` implementiert:

- **Google Tag Script:** Lädt asynchron das gtag.js Script
- **Consent Mode:** Implementiert Google Consent Mode für GDPR-Konformität
- **Anonymisierung:** IP-Adressen werden automatisch anonymisiert
- **Cookie-Flags:** Sichere Cookie-Einstellungen mit SameSite=None;Secure

### 2. Cookie Consent Integration

Die Analytics werden nur aktiviert, wenn der Benutzer den Analytics-Cookies zugestimmt hat:

- **Klaro Integration:** Vollständig in das bestehende Klaro Cookie Consent System integriert
- **Consent Management:** Automatische Aktivierung/Deaktivierung basierend auf Benutzereinstellungen
- **Fallback Support:** Unterstützt sowohl Klaro als auch das Simple Cookie Banner System

### 3. Analytics Utility (`app/lib/analytics.ts`)

Eine umfassende Utility-Bibliothek für Analytics-Tracking:

#### Hauptfunktionen:
- `isAnalyticsEnabled()`: Prüft ob Analytics-Cookies akzeptiert wurden
- `trackEvent()`: Sendet benutzerdefinierte Events
- `trackPageView()`: Verfolgt Seitenaufrufe
- `trackUGCEvents`: Spezifische UGC-VZ Events

#### UGC-VZ Spezifische Events:
- **Suche:** `search(query, resultsCount)`
- **Creator Interaktionen:** `creatorView()`, `creatorContact()`
- **Navigation:** `ctaClick()`, `footerClick()`
- **Formulare:** `contactForm()`
- **Sprachsuche:** `voiceSearchStart()`, `voiceSearchEnd()`
- **Cookie Events:** `cookieAccept()`, `cookieDecline()`

### 4. Implementierte Tracking Events

#### SearchBox Component (`app/components/SearchBox.tsx`):
- **Suchvorgänge:** Verfolgt manuelle und Sprachsuchen
- **Creator-Auswahl:** Trackt welche Creator angesehen werden
- **Kontaktformular:** Verfolgt erfolgreiche Anfragen
- **Spracherkennung:** Trackt Nutzung der Sprachsuche

#### CTA Button (`src/components/ResponsiveCTAButton.tsx`):
- **Header CTA:** Verfolgt Klicks auf "Jetzt mitmachen" Button

## GDPR-Konformität

### Google Consent Mode
```javascript
gtag('consent', 'default', {
  'analytics_storage': 'denied',
  'ad_storage': 'denied',
  'wait_for_update': 500
});
```

### Automatische Consent-Updates
- **Bei Zustimmung:** `analytics_storage: 'granted'`
- **Bei Ablehnung:** `analytics_storage: 'denied'`

### Cookie-Kategorien
Die folgenden Google Analytics Cookies werden verfolgt:
- `_ga*` - Google Analytics Hauptcookies
- `_gid` - Google Analytics Session ID
- `_gat` - Google Analytics Throttling
- `_gtag` - Google Tag Manager Cookies

## Verwendung

### Event Tracking in Komponenten
```typescript
import { trackUGCEvents } from '../lib/analytics';

// Beispiel: Suche tracken
trackUGCEvents.search('kosmetik tiktok', 5);

// Beispiel: Creator Kontakt tracken
trackUGCEvents.creatorContact('creator123', 'instagram');

// Beispiel: CTA Klick tracken
trackUGCEvents.ctaClick('header');
```

### Analytics Hook
```typescript
import { useAnalytics } from '../lib/analytics';

const { trackEvent, trackPageView, trackUGCEvents, isEnabled } = useAnalytics();
```

## Konfiguration

### Klaro Cookie Consent
Die Analytics-Konfiguration ist in mehreren Dateien definiert:
- `app/layout.tsx` - Hauptkonfiguration
- `app/lib/klaro-config.js` - Klaro Konfiguration
- `public/js/klaro-config.js` - Public Klaro Konfiguration

### Analytics Service Konfiguration
```javascript
{
  name: 'analytics',
  title: 'Analyse & Performance',
  description: 'Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren.',
  purposes: ['analytics'],
  cookies: [/^_ga(_.*)?/, /^_gid/, /^_gat/, /^_gtag/],
  required: false,
  optOut: false,
  onAccept: `// Google Analytics aktivieren`,
  onDecline: `// Google Analytics deaktivieren`
}
```

## Testing

### Entwicklungsumgebung
1. Starte den Development Server: `npm run dev`
2. Öffne http://localhost:3000
3. Öffne Browser Developer Tools → Network Tab
4. Akzeptiere Analytics Cookies
5. Führe Aktionen aus (Suche, Creator-Auswahl, etc.)
6. Überprüfe Google Analytics Requests in Network Tab

### Produktionsumgebung
1. Besuche https://ugc-vz.de
2. Verwende Google Analytics Real-Time Reports
3. Teste verschiedene User Journeys
4. Überprüfe Event-Tracking in GA4

## Datenschutz

### IP-Anonymisierung
```javascript
gtag('config', 'G-CE33NMGRD2', {
  anonymize_ip: true,
  cookie_flags: 'SameSite=None;Secure'
});
```

### Cookie-Einstellungen
- **Sichere Cookies:** SameSite=None;Secure
- **Ablaufzeit:** 365 Tage (Klaro Standard)
- **Domain-Beschränkung:** Nur ugc-vz.de

### Benutzerrechte
- **Opt-out:** Jederzeit über Cookie-Einstellungen möglich
- **Datenportabilität:** Über Google Analytics verfügbar
- **Löschung:** Automatisch nach Ablaufzeit oder manuell

## Wartung

### Regelmäßige Aufgaben
1. **Monatlich:** Überprüfung der Analytics-Daten
2. **Quartalsweise:** Review der Event-Tracking Implementierung
3. **Jährlich:** Aktualisierung der Datenschutzerklärung

### Monitoring
- **Console Logs:** Entwicklungsumgebung zeigt Analytics-Events
- **GA4 Real-Time:** Produktionsumgebung Live-Monitoring
- **Error Tracking:** Fehler werden in Browser Console geloggt

## Support

Bei Fragen zur Google Analytics Implementierung:
- **Entwickler:** Siehe Code-Kommentare in `app/lib/analytics.ts`
- **Datenschutz:** Siehe Cookie-Richtlinien auf der Website
- **Google Analytics:** Siehe GA4 Dokumentation

# Google Analytics und Einwilligung

UGC VZ verwendet GA4 mit der Mess-ID `G-CE33NMGRD2`. Das Google-Script ist nicht
im Server-HTML enthalten. `SimpleCookieBanner` lädt `gtag.js` erst, nachdem eine
Person Analyse ausdrücklich aktiviert hat.

## Zustände

- keine Entscheidung: kein Google-Request und kein Analyse-Cookie
- abgelehnt: kein Loader, bestehende `_ga*`-Cookies werden entfernt
- akzeptiert: Loader wird dynamisch ergänzt und Analytics-Events sind erlaubt
- spätere Änderung: über `/cookies` oder `window.showCookieSettings()`

Der Zustand liegt lokal unter `ugc-vz-cookie-consent`. Es gibt keinen Klaro-
Fallback und kein paralleles Plausible-Tracking.

## Prüfung

1. Browserdaten für die Domain löschen.
2. Seite laden und im Netzwerk-Tab nach `google-analytics` und `googletagmanager`
   filtern. Vor einer Entscheidung darf kein Request erscheinen.
3. Analyse ablehnen und erneut laden. Es darf weiterhin kein Request erscheinen.
4. Analyse aktivieren. Erst jetzt darf `gtag/js?id=G-CE33NMGRD2` geladen werden.
5. Einstellungen wieder öffnen, Analyse deaktivieren und `_ga*`-Cookies prüfen.

Die Datenschutzerklärung beschreibt Zweck, Anbieter, Speicherdauer,
Drittlandtransfer und Widerrufsmöglichkeit. Änderungen am Tracking erfordern
eine erneute technische und rechtliche Prüfung.

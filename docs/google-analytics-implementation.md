# Plausible Analytics

UGC VZ verwendet ausschließlich die cookielose Plausible-Integration über
`analytics.polymarkt.de`. Das globale Layout lädt das bereitgestellte Script und
initialisiert die Plausible-Queue direkt im `<head>`.

Es gibt keine GA4-Mess-ID, keinen Google-Loader und keinen Analyse-Consent im
lokalen Speicher. Interaktionsereignisse werden über `window.plausible` als
Plausible Custom Events gesendet.

## Prüfung

1. Seite laden und im Netzwerk-Tab nach `analytics.polymarkt.de` filtern.
2. Der Script-Request und anschließend ein Pageview-Request müssen erfolgreich sein.
3. Nach `google-analytics`, `googletagmanager`, `gtag` und `_ga` suchen; es darf
   keine aktive Integration oder Analyse-Cookies geben.
4. Ein getracktes UI-Element auslösen und den passenden Plausible-Event-Request prüfen.

Änderungen am Tracking erfordern eine erneute technische und rechtliche Prüfung.

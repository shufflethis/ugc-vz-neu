# Fix für verzögerte Blog-Veröffentlichung auf UGC-VZ

Dieses Dokument beschreibt die implementierte Lösung für das Problem der verzögerten Blog-Veröffentlichung auf der UGC-VZ Website.

## Implementierte Lösung

Die Lösung besteht aus mehreren Komponenten, die zusammenarbeiten, um eine sofortige Aktualisierung der Blog-Inhalte zu gewährleisten:

1. **Next.js On-Demand Revalidation API**: Ein neuer Endpunkt, der die sofortige Aktualisierung von statisch generierten Seiten ermöglicht.
2. **Verbesserte Blog-Sync Webhook**: Der bestehende Webhook wurde erweitert, um die Revalidation API zu triggern.
3. **Reduzierte Revalidierungszeiten**: Die Standard-Revalidierungszeit wurde von 1 Stunde auf 5 Minuten reduziert.
4. **WordPress Integration**: Ein PHP-Snippet für WordPress, das automatisch die Revalidierung bei Post-Änderungen auslöst.

## Dateien und Änderungen

### 1. Neue Revalidation API

**Datei**: `app/api/revalidate/route.ts`

Dieser neue API-Endpunkt ermöglicht die sofortige Aktualisierung von statisch generierten Seiten durch Next.js's `revalidatePath` Funktion. Er unterstützt sowohl GET- als auch POST-Anfragen und kann mehrere Pfade gleichzeitig aktualisieren.

### 2. Verbesserte Blog-Sync Webhook

**Datei**: `app/api/blog/sync/route.ts`

Der bestehende Webhook wurde erweitert, um die neue Revalidation API zu nutzen. Anstatt nur einen verzögerten Cache-Invalidierungszeitpunkt zu setzen, ruft er nun aktiv die Revalidation API auf, um eine sofortige Aktualisierung zu erreichen. Die verzögerte Cache-Invalidierung bleibt als Fallback erhalten.

### 3. Reduzierte Revalidierungszeiten

**Dateien**:
- `app/wissen/page.tsx`
- `app/wissen/[slug]/page.tsx`

Die Revalidierungszeit wurde von 3600 Sekunden (1 Stunde) auf 300 Sekunden (5 Minuten) reduziert, um auch ohne Webhook-Trigger eine häufigere Aktualisierung zu gewährleisten.

### 4. WordPress Integration

**Datei**: `wordpress-webhook-setup.php`

Dieses PHP-Snippet kann in die `functions.php` des WordPress-Themes eingefügt werden. Es registriert Hooks für Post-Veröffentlichungen und -Aktualisierungen und sendet automatisch Webhook-Anfragen an den Blog-Sync-Endpunkt.

## Konfiguration

### Umgebungsvariablen

Folgende Umgebungsvariablen sollten in der `.env`-Datei des Next.js-Projekts konfiguriert werden:

```
# Für die Revalidation API
REVALIDATION_SECRET=dein_geheimer_schluessel

# Für den Blog-Sync Webhook (falls noch nicht vorhanden)
BLOG_SYNC_SECRET=dein_geheimer_schluessel

# Basis-URL der Website
NEXT_PUBLIC_BASE_URL=https://ugc-vz.de
```

### WordPress-Konfiguration

1. Kopiere den Inhalt von `wordpress-webhook-setup.php` in die `functions.php` deines WordPress-Themes oder erstelle ein eigenes Plugin.
2. Aktualisiere die Konstanten am Anfang der Datei:
   ```php
   define('NEXTJS_REVALIDATE_URL', 'https://ugc-vz.de/api/blog/sync');
   define('NEXTJS_REVALIDATE_SECRET', 'dein_geheimer_schluessel'); // Muss mit BLOG_SYNC_SECRET übereinstimmen
   ```

## Testen

### Manueller Test der Revalidation API

```bash
# GET-Anfrage
curl "https://ugc-vz.de/api/revalidate?secret=dein_geheimer_schluessel&path=/wissen"

# POST-Anfrage
curl -X POST "https://ugc-vz.de/api/revalidate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dein_geheimer_schluessel" \
  -d '{"paths":["/wissen","/wissen/beispiel-slug"]}'
```

### WordPress Webhook-Test

Nach der Installation des WordPress-Snippets kann der Webhook über folgenden URL getestet werden:

```
https://wp.ugc-vz.de/wp-admin/admin-ajax.php?action=test_nextjs_revalidation
```

## Fehlerbehebung

### Logs überprüfen

Bei Problemen sollten die Logs sowohl auf der Next.js-Seite als auch in WordPress überprüft werden:

- **Next.js**: Vercel-Logs oder lokale Entwicklungsserver-Logs
- **WordPress**: PHP-Fehlerlog (`error_log` Einträge)

### Cache-Header prüfen

Überprüfe die Cache-Header der API-Antworten:

```bash
curl -I "https://ugc-vz.de/api/blog"
```

### Webhook-Anfragen überprüfen

Überprüfe, ob die Webhook-Anfragen korrekt gesendet werden:

```php
// In WordPress functions.php temporär hinzufügen
add_action('http_api_debug', function($response, $context, $transport, $request, $url) {
    if (strpos($url, 'ugc-vz.de') !== false) {
        error_log('WordPress HTTP Request: ' . print_r($request, true));
        error_log('WordPress HTTP Response: ' . print_r($response, true));
    }
}, 10, 5);
```

## Zusammenfassung

Die implementierte Lösung kombiniert mehrere Ansätze, um das Problem der verzögerten Blog-Veröffentlichung zu beheben:

1. **On-Demand Revalidation**: Sofortige Aktualisierung durch Next.js's native Revalidierungsfunktion
2. **Webhooks**: Automatische Benachrichtigung bei WordPress-Änderungen
3. **Reduzierte Cache-Zeiten**: Häufigere automatische Aktualisierungen
4. **Fallback-Mechanismus**: Die bestehende verzögerte Cache-Invalidierung bleibt als Sicherheit erhalten

Diese mehrschichtige Lösung sollte sicherstellen, dass neue Blog-Artikel nahezu sofort auf der Website erscheinen, selbst wenn einer der Mechanismen fehlschlägt.
# WordPress Webhook Setup für automatische Blog-Synchronisation

## Übersicht

Um sicherzustellen, dass neue Blog-Artikel sofort auf der UGC-VZ Website angezeigt werden, kann ein WordPress-Webhook konfiguriert werden, der bei Änderungen an Artikeln automatisch den Cache invalidiert.

## Webhook-Endpunkt

**URL:** `https://ugc-vz.de/api/blog/sync`
**Methode:** POST
**Authentifizierung:** Bearer Token oder Query Parameter (ERFORDERLICH)

⚠️ **Sicherheitshinweis:** Die Authentifizierung ist zwingend erforderlich. Der Endpunkt funktioniert nicht ohne gültiges `BLOG_SYNC_SECRET`.

### Authentifizierung

Option 1 - Header:
```
Authorization: Bearer ugc-vz-sync-2025-secure
```

Option 2 - Query Parameter:
```
https://ugc-vz.de/api/blog/sync?auth=ugc-vz-sync-2025-secure
```

## WordPress Plugin Code

Füge folgenden Code in die `functions.php` deines WordPress-Themes oder als Plugin hinzu:

```php
<?php
/**
 * UGC-VZ Blog Sync Webhook
 * Sendet Benachrichtigungen an die UGC-VZ Website wenn Artikel veröffentlicht/aktualisiert werden
 */

function ugc_vz_sync_webhook($post_id, $post, $update) {
    // Nur für veröffentlichte Posts
    if ($post->post_status !== 'publish' || $post->post_type !== 'post') {
        return;
    }
    
    $webhook_url = 'https://ugc-vz.de/api/blog/sync';
    $auth_token = 'ugc-vz-sync-2025-secure';
    
    $data = array(
        'post_id' => $post_id,
        'action' => $update ? 'update' : 'publish',
        'title' => $post->post_title,
        'slug' => $post->post_name,
        'timestamp' => current_time('timestamp')
    );
    
    $args = array(
        'body' => json_encode($data),
        'headers' => array(
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $auth_token,
            'User-Agent' => 'WordPress UGC-VZ Sync/1.0'
        ),
        'timeout' => 15,
        'method' => 'POST'
    );
    
    // Asynchroner Request um WordPress nicht zu verlangsamen
    wp_remote_post($webhook_url, $args);
    
    error_log("UGC-VZ Sync: Webhook sent for post {$post_id} ({$post->post_title})");
}

// Hook für neue und aktualisierte Posts
add_action('wp_insert_post', 'ugc_vz_sync_webhook', 10, 3);

// Hook für gelöschte Posts
function ugc_vz_sync_webhook_delete($post_id) {
    $post = get_post($post_id);
    if ($post && $post->post_type === 'post') {
        $webhook_url = 'https://ugc-vz.de/api/blog/sync';
        $auth_token = 'ugc-vz-sync-2025-secure';
        
        $data = array(
            'post_id' => $post_id,
            'action' => 'delete',
            'timestamp' => current_time('timestamp')
        );
        
        $args = array(
            'body' => json_encode($data),
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $auth_token,
                'User-Agent' => 'WordPress UGC-VZ Sync/1.0'
            ),
            'timeout' => 15,
            'method' => 'POST'
        );
        
        wp_remote_post($webhook_url, $args);
        
        error_log("UGC-VZ Sync: Delete webhook sent for post {$post_id}");
    }
}

add_action('before_delete_post', 'ugc_vz_sync_webhook_delete');
?>
```

## Manuelle Cache-Invalidierung

Für manuelle Tests oder Notfälle kann der Cache auch manuell invalidiert werden:

```bash
curl -X GET "https://ugc-vz.de/api/blog/sync?auth=ugc-vz-sync-2025-secure"
```

## Lokale Entwicklung

Für lokale Tests verwende:

```bash
curl -X GET "http://localhost:3000/api/blog/sync?auth=ugc-vz-sync-2025-secure"
```

## Konfiguration

Die Webhook-Authentifizierung wird über die Umgebungsvariable `BLOG_SYNC_SECRET` konfiguriert:

```env
BLOG_SYNC_SECRET=ugc-vz-sync-2025-secure
```

## Cache-Verhalten

- **Cache-Dauer:** 2 Minuten
- **Automatische Invalidierung:** Bei Webhook-Aufruf
- **Fallback:** Bei API-Fehlern wird der letzte Cache verwendet

## Monitoring

Die Sync-Aktivitäten werden in den Server-Logs protokolliert. Überprüfe die Logs für:

- Webhook-Empfang
- Cache-Invalidierung
- WordPress API-Aufrufe
- Fehlerbehandlung

## Troubleshooting

### Problem: Neue Artikel erscheinen nicht sofort

1. Überprüfe WordPress-Logs auf Webhook-Fehler
2. Teste manuelle Cache-Invalidierung
3. Überprüfe Netzwerk-Verbindung zwischen WordPress und UGC-VZ

### Problem: Webhook-Authentifizierung fehlgeschlagen

1. Überprüfe `BLOG_SYNC_SECRET` in `.env.local`
2. Stelle sicher, dass der Token in WordPress korrekt konfiguriert ist
3. Teste mit curl-Befehl

### Problem: Cache wird nicht invalidiert

1. Überprüfe Server-Logs auf Sync-Aktivitäten
2. Teste API-Endpunkt direkt
3. Überprüfe Cache-Logik in `app/api/blog/route.ts`

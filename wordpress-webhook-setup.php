<?php
/**
 * WordPress Webhook Setup für UGC-VZ Blog Revalidation
 * 
 * Diesen Code in die functions.php des WordPress-Themes einfügen
 * oder als Plugin verwenden.
 * 
 * Triggert automatisch Next.js Revalidation bei Post-Veröffentlichung
 */

// Webhook-URL und Secret konfigurieren
define('NEXTJS_REVALIDATE_URL', 'https://ugc-vz.de/api/blog/sync');
define('NEXTJS_REVALIDATE_SECRET', 'YOUR_BLOG_SYNC_SECRET_HERE'); // Aus .env Datei

/**
 * Webhook bei Post-Veröffentlichung triggern
 */
function trigger_nextjs_revalidation($post_id, $post, $update = false) {
    // Nur für normale Blog-Posts
    if ($post->post_type !== 'post') {
        return;
    }
    
    // Nur für veröffentlichte Posts
    if ($post->post_status !== 'publish') {
        return;
    }
    
    // Webhook-Daten vorbereiten
    $webhook_data = [
        'post_id' => $post_id,
        'post_slug' => $post->post_name,
        'action' => $update ? 'update' : 'publish',
        'post_title' => $post->post_title,
        'post_url' => get_permalink($post_id),
        'timestamp' => current_time('timestamp')
    ];
    
    // Webhook senden
    $response = wp_remote_post(NEXTJS_REVALIDATE_URL, [
        'method' => 'POST',
        'timeout' => 10,
        'headers' => [
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . NEXTJS_REVALIDATE_SECRET,
            'User-Agent' => 'WordPress/' . get_bloginfo('version') . '; ' . home_url()
        ],
        'body' => json_encode($webhook_data),
        'sslverify' => true
    ]);
    
    // Logging für Debug-Zwecke
    if (is_wp_error($response)) {
        error_log('NextJS Revalidation Webhook Error: ' . $response->get_error_message());
    } else {
        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);
        
        if ($response_code === 200) {
            error_log("NextJS Revalidation successful for post {$post_id} ({$post->post_title})");
        } else {
            error_log("NextJS Revalidation failed for post {$post_id}. Response: {$response_code} - {$response_body}");
        }
    }
}

// Hook für neue Post-Veröffentlichung
add_action('publish_post', function($post_id, $post) {
    trigger_nextjs_revalidation($post_id, $post, false);
}, 10, 2);

// Hook für Post-Updates
add_action('post_updated', function($post_id, $post_after, $post_before) {
    // Nur triggern wenn der Post veröffentlicht ist
    if ($post_after->post_status === 'publish') {
        trigger_nextjs_revalidation($post_id, $post_after, true);
    }
}, 10, 3);

// Hook für Status-Änderungen (z.B. von Draft zu Published)
add_action('transition_post_status', function($new_status, $old_status, $post) {
    // Nur für normale Blog-Posts
    if ($post->post_type !== 'post') {
        return;
    }
    
    // Wenn Post neu veröffentlicht wird
    if ($new_status === 'publish' && $old_status !== 'publish') {
        trigger_nextjs_revalidation($post->ID, $post, false);
    }
    // Wenn Post von veröffentlicht zu anderem Status wechselt
    elseif ($old_status === 'publish' && $new_status !== 'publish') {
        // Auch bei Depublizierung revalidieren
        trigger_nextjs_revalidation($post->ID, $post, true);
    }
}, 10, 3);

/**
 * REST API Cache Headers deaktivieren für Posts
 * Verhindert Browser-Caching der WordPress REST API
 */
add_filter('rest_post_dispatch', function($result, $server, $request) {
    $route = $request->get_route();
    
    // Für Posts-Endpoints Cache deaktivieren
    if (strpos($route, '/wp/v2/posts') !== false) {
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');
    }
    
    return $result;
}, 10, 3);

/**
 * Admin-Notice für Konfiguration
 */
add_action('admin_notices', function() {
    if (NEXTJS_REVALIDATE_SECRET === 'YOUR_BLOG_SYNC_SECRET_HERE') {
        echo '<div class="notice notice-warning is-dismissible">';
        echo '<p><strong>NextJS Revalidation:</strong> Bitte konfigurieren Sie das NEXTJS_REVALIDATE_SECRET in der functions.php!</p>';
        echo '</div>';
    }
});

/**
 * Debug-Funktion: Manueller Revalidation-Test
 * Aufruf über: /wp-admin/admin-ajax.php?action=test_nextjs_revalidation
 */
add_action('wp_ajax_test_nextjs_revalidation', function() {
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }
    
    $test_data = [
        'action' => 'manual_test',
        'timestamp' => current_time('timestamp')
    ];
    
    $response = wp_remote_post(NEXTJS_REVALIDATE_URL, [
        'method' => 'POST',
        'timeout' => 10,
        'headers' => [
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . NEXTJS_REVALIDATE_SECRET
        ],
        'body' => json_encode($test_data)
    ]);
    
    if (is_wp_error($response)) {
        wp_die('Error: ' . $response->get_error_message());
    } else {
        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);
        echo "Response Code: {$response_code}<br>";
        echo "Response Body: {$response_body}";
    }
    
    wp_die();
});

/**
 * Zusätzliche Sicherheit: Rate Limiting für Webhooks
 */
function nextjs_webhook_rate_limit($post_id) {
    $transient_key = 'nextjs_webhook_' . $post_id;
    
    if (get_transient($transient_key)) {
        return false; // Rate limit aktiv
    }
    
    // Rate limit für 30 Sekunden setzen
    set_transient($transient_key, true, 30);
    return true;
}

// Rate Limiting in die Webhook-Funktion integrieren
add_filter('pre_post_update', function($check, $post_id) {
    if (!nextjs_webhook_rate_limit($post_id)) {
        // Rate limit aktiv, Webhook überspringen
        remove_action('post_updated', 'trigger_nextjs_revalidation');
    }
    return $check;
}, 10, 2);
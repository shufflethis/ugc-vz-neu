# UGC-VZ Blog Integration Setup

## Übersicht

Die UGC-VZ Website integriert automatisch Blog-Artikel vom WordPress Backend (wp.ugc-vz.de) und zeigt sie auf der `/wissen` Route an. Das System unterstützt ACF (Advanced Custom Fields) und bietet automatische Synchronisation.

## Features

- ✅ **Automatischer Import** von WordPress-Artikeln über REST API
- ✅ **ACF-Unterstützung** für strukturierte Inhalte (Text-Blöcke, FAQ-Akkordeons)
- ✅ **Intelligente Content-Extraktion** aus ACF-Feldern
- ✅ **Featured Images** mit Fallback-Handling
- ✅ **Responsive Design** mit Dark Theme
- ✅ **Caching-System** für bessere Performance
- ✅ **Webhook-Synchronisation** für automatische Updates
- ✅ **SEO-optimiert** mit strukturierten Daten

## API-Endpunkte

### Blog-Übersicht
```
GET /api/blog
```
Liefert alle Blog-Artikel mit Metadaten.

### Einzelner Artikel
```
GET /api/blog/[slug]
```
Liefert vollständigen Artikel-Inhalt inklusive ACF-Daten.

### Cache-Synchronisation
```
GET /api/blog/sync?auth=SECRET
POST /api/blog/sync
```
Invalidiert den Blog-Cache für sofortige Updates.

## WordPress Backend Integration

### ACF-Struktur
Das System erwartet folgende ACF-Struktur:

```php
// Flexible Content Field: page_content
- Text Block (acf_fc_layout: 'text_block')
  - text (WYSIWYG Editor)
  
- FAQ Accordion (acf_fc_layout: 'faq_accordion')
  - faqs (Repeater)
    - question (Text)
    - answer (Textarea)
```

### Webhook-Setup (Optional)
Für automatische Synchronisation können Sie einen WordPress-Hook einrichten:

```php
// In functions.php oder Plugin
add_action('publish_post', 'ugc_vz_sync_blog');
add_action('post_updated', 'ugc_vz_sync_blog');

function ugc_vz_sync_blog($post_id) {
    $post = get_post($post_id);
    if ($post->post_type !== 'post') return;
    
    $webhook_url = 'https://ugc-vz.de/api/blog/sync';
    $secret = 'ugc-vz-sync-2025-secure'; // Aus .env.local
    
    wp_remote_post($webhook_url, [
        'headers' => [
            'Authorization' => 'Bearer ' . $secret,
            'Content-Type' => 'application/json'
        ],
        'body' => json_encode([
            'post_id' => $post_id,
            'action' => 'publish'
        ])
    ]);
}
```

## Umgebungsvariablen

```env
# WordPress API configuration
WORDPRESS_API_URL=https://wp.ugc-vz.de/wp-json/wp/v2
WORDPRESS_JWT_TOKEN=your_jwt_token_here

# Blog sync webhook secret
BLOG_SYNC_SECRET=ugc-vz-sync-2025-secure
```

## Artikel-Struktur

### Metadaten
- **Titel**: Aus WordPress title field
- **Excerpt**: Automatisch aus ACF text_block oder WordPress excerpt
- **Featured Image**: Aus WordPress featured media
- **Kategorien**: Aus WordPress categories
- **Datum**: WordPress publish date
- **Lesezeit**: Automatisch berechnet

### Content-Verarbeitung
1. **ACF-Priorität**: System versucht zuerst ACF page_content zu verwenden
2. **Fallback**: Bei fehlenden ACF-Daten wird WordPress content verwendet
3. **HTML-Styling**: Automatische CSS-Klassen für Dark Theme
4. **Link-Konvertierung**: WordPress-Links werden zu relativen /wissen/ Links
5. **Bild-Optimierung**: Lazy loading und responsive Klassen

## Styling

### CSS-Klassen (automatisch angewendet)
```css
/* Überschriften */
h1, h2, h3, h4, h5, h6 {
  @apply font-bold mb-4 mt-8 text-white;
}

/* Paragraphen */
p {
  @apply mb-4 text-gray-200 leading-relaxed;
}

/* Listen */
ul, ol {
  @apply list-disc list-inside mb-4 text-gray-200;
}

/* Links */
a {
  @apply text-emerald-400 hover:text-emerald-300 underline;
}

/* FAQ-Sektion */
.faq-item {
  @apply mb-6 p-6 bg-gray-900/30 rounded-lg border border-gray-800/50;
}
```

## Troubleshooting

### Artikel werden nicht angezeigt
1. Prüfen Sie die WordPress API-Verbindung: `/api/blog`
2. Überprüfen Sie ACF-Feldnamen in WordPress
3. Cache manuell invalidieren: `/api/blog/sync?auth=SECRET`

### Bilder laden nicht
1. Überprüfen Sie WordPress Media-Einstellungen
2. Prüfen Sie CORS-Einstellungen für wp.ugc-vz.de
3. Fallback auf placeholder-blog.svg

### Performance-Optimierung
- Cache-Duration anpassen (Standard: 5 Minuten)
- Webhook für sofortige Updates einrichten
- CDN für WordPress-Bilder verwenden

## Deployment

### Produktions-Umgebung
Stellen Sie sicher, dass folgende Umgebungsvariablen gesetzt sind:
- `WORDPRESS_API_URL`
- `WORDPRESS_JWT_TOKEN` 
- `BLOG_SYNC_SECRET`

### Monitoring
- Blog-API-Logs in Vercel/Server-Logs überwachen
- Cache-Hit-Rate beobachten
- WordPress-API-Response-Zeiten prüfen

## Zukünftige Erweiterungen

- [ ] Volltext-Suche in Artikeln
- [ ] Artikel-Kategorien-Filter
- [ ] Related Posts Empfehlungen
- [ ] Social Media Sharing
- [ ] Kommentar-System
- [ ] Newsletter-Integration

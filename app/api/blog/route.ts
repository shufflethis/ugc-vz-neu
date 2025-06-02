import { NextRequest, NextResponse } from 'next/server';
import { getLastSyncTime } from '../../lib/blog-sync';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  date: string;
  featuredImage: string;
  author: string;
  categories: string[];
}

// Cache für Blog-Posts (in Produktion sollte Redis oder ähnliches verwendet werden)
let blogCache: BlogPost[] = [];
let lastFetch = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 Minuten für schnellere Updates

async function fetchWordPressPosts(): Promise<BlogPost[]> {
  try {
    // Verwende WordPress REST API mit ACF-Feldern für bessere Datenqualität
    // Sortiere nach Datum absteigend, um neueste Artikel zuerst zu bekommen
    const response = await fetch('http://wp.ugc-vz.de/wp-json/wp/v2/posts?per_page=50&_embed&acf_format=standard&orderby=date&order=desc', {
      headers: {
        'User-Agent': 'UGC-VZ Blog Sync/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const wpPosts = await response.json();
    console.log(`WordPress API returned ${wpPosts.length} posts`);
    const posts: BlogPost[] = [];

    // WordPress REST API-Daten verarbeiten
    for (const wpPost of wpPosts) {
      // Titel extrahieren und HTML-Entitäten dekodieren
      let title = wpPost.title?.rendered || '';
      if (!title) continue;

      // HTML-Entitäten dekodieren
      title = title.replace(/&#038;/g, '&').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

      // Slug extrahieren
      const slug = wpPost.slug || `post-${wpPost.id}`;

      // Excerpt aus ACF oder Standard-Feldern extrahieren
      let excerpt = '';

      // Versuche zuerst ACF-Daten zu verwenden
      if (wpPost.acf && wpPost.acf.page_content && Array.isArray(wpPost.acf.page_content)) {
        // Extrahiere Text aus ACF-Blöcken
        for (const block of wpPost.acf.page_content) {
          if (block.acf_fc_layout === 'text_block' && block.text) {
            excerpt = block.text;
            break;
          }
        }
      }

      // Fallback auf Standard-Excerpt oder Content
      if (!excerpt) {
        excerpt = wpPost.excerpt?.rendered || wpPost.content?.rendered || '';
      }

      if (excerpt) {
        // HTML-Tags entfernen
        excerpt = excerpt.replace(/<[^>]*>/g, '').trim();
        // WordPress-spezifische Zeichen bereinigen
        excerpt = excerpt.replace(/\[&hellip;\]/g, '...');
        // Markdown-Formatierung entfernen
        excerpt = excerpt.replace(/\*\*/g, '');
        // Zeilenumbrüche durch Leerzeichen ersetzen
        excerpt = excerpt.replace(/\n+/g, ' ');

        if (excerpt.length > 250) {
          excerpt = excerpt.substring(0, 250) + '...';
        }
      }

      // Prüfe auf Platzhalter-Content und verwende Fallback-Excerpt
      if (!excerpt || excerpt.length < 10 || excerpt.includes('UGC VZ 404') || excerpt.includes('404')) {
        console.log(`Post "${title}" has placeholder content - using fallback excerpt`);
        excerpt = 'Entdecke die neuesten Insights und Strategien für erfolgreiches User Generated Content Marketing.';
      }

      // Fallback-Excerpt für sehr kurze Excerpts
      if (excerpt.length < 20) {
        excerpt = 'Entdecke die neuesten Insights und Strategien für erfolgreiches User Generated Content Marketing.';
      }

      // Featured Image extrahieren
      let featuredImage = '/placeholder-blog.svg';

      // Versuche Featured Media aus _embedded zu extrahieren
      if (wpPost._embedded && wpPost._embedded['wp:featuredmedia'] && wpPost._embedded['wp:featuredmedia'][0]) {
        const media = wpPost._embedded['wp:featuredmedia'][0];
        if (media.source_url) {
          featuredImage = media.source_url;
        } else if (media.media_details && media.media_details.sizes) {
          // Versuche verschiedene Bildgrößen
          const sizes = media.media_details.sizes;
          if (sizes.large) {
            featuredImage = sizes.large.source_url;
          } else if (sizes.medium_large) {
            featuredImage = sizes.medium_large.source_url;
          } else if (sizes.medium) {
            featuredImage = sizes.medium.source_url;
          }
        }
      }

      // Konvertiere relative URLs zu absoluten URLs
      if (featuredImage && !featuredImage.startsWith('http') && !featuredImage.startsWith('/placeholder')) {
        featuredImage = `http://wp.ugc-vz.de${featuredImage}`;
      }

      // Datum extrahieren und formatieren
      const date = wpPost.date || new Date().toISOString();

      // Kategorien extrahieren
      let categories = ['UGC', 'Creator Marketing'];
      if (wpPost._embedded && wpPost._embedded['wp:term'] && wpPost._embedded['wp:term'][0]) {
        const wpCategories = wpPost._embedded['wp:term'][0];
        if (Array.isArray(wpCategories) && wpCategories.length > 0) {
          categories = wpCategories.map(cat => cat.name).filter(name => name && name !== 'Uncategorized');
          if (categories.length === 0) {
            categories = ['UGC', 'Creator Marketing'];
          }
        }
      }

      // Debug-Ausgabe für jeden gefundenen Post
      console.log(`Found post: "${title}" with slug: "${slug}" and ${excerpt.length} chars excerpt`);

      posts.push({
        id: slug,
        title,
        excerpt,
        content: '', // Wird beim einzelnen Artikel geladen
        slug,
        date,
        featuredImage,
        author: 'UGC VZ Team',
        categories
      });
    }

    console.log(`Total posts found: ${posts.length}`);

    // Debug: Zeige alle gefundenen Posts
    posts.forEach((post, index) => {
      console.log(`${index + 1}. "${post.title}" (${post.slug}) - Categories: ${post.categories.join(', ')}`);
    });

    return posts.filter(post => post.title.length > 0);
  } catch (error) {
    console.error('Error fetching WordPress posts:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    const lastSyncTime = getLastSyncTime();

    // Cache prüfen - invalidieren wenn Sync-Webhook ausgelöst wurde
    const cacheValid = blogCache.length > 0 &&
                      (now - lastFetch) < CACHE_DURATION &&
                      lastSyncTime <= lastFetch;

    if (cacheValid) {
      return NextResponse.json({
        success: true,
        posts: blogCache,
        cached: true,
        lastFetch: new Date(lastFetch).toISOString(),
        lastSync: lastSyncTime > 0 ? new Date(lastSyncTime).toISOString() : null
      });
    }

    // Neue Daten laden
    const posts = await fetchWordPressPosts();

    if (posts.length > 0) {
      blogCache = posts;
      lastFetch = now;
    }

    return NextResponse.json({
      success: true,
      posts: posts.length > 0 ? posts : blogCache,
      cached: false,
      lastFetch: new Date(lastFetch).toISOString(),
      lastSync: lastSyncTime > 0 ? new Date(lastSyncTime).toISOString() : null,
      totalPosts: posts.length
    });
  } catch (error) {
    console.error('Blog API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch blog posts',
        posts: blogCache // Fallback auf Cache
      },
      { status: 500 }
    );
  }
}

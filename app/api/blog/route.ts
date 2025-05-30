import { NextRequest, NextResponse } from 'next/server';

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
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten

async function fetchWordPressPosts(): Promise<BlogPost[]> {
  try {
    // Verwende WordPress REST API für bessere Datenqualität
    const response = await fetch('http://wp.ugc-vz.de/wp-json/wp/v2/posts?per_page=20&_embed', {
      headers: {
        'User-Agent': 'UGC-VZ Blog Sync/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const wpPosts = await response.json();
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

      // Excerpt extrahieren und bereinigen
      let excerpt = wpPost.excerpt?.rendered || '';
      if (excerpt) {
        // HTML-Tags entfernen
        excerpt = excerpt.replace(/<[^>]*>/g, '').trim();
        // WordPress-spezifische Zeichen bereinigen
        excerpt = excerpt.replace(/\[&hellip;\]/g, '...');

        if (excerpt.length > 200) {
          excerpt = excerpt.substring(0, 200) + '...';
        }
      }

      if (!excerpt || excerpt.length < 10) {
        excerpt = 'Lesen Sie mehr über diesen interessanten Artikel...';
      }

      // Featured Image extrahieren
      let featuredImage = '/placeholder-blog.svg';

      // Versuche Featured Media aus _embedded zu extrahieren
      if (wpPost._embedded && wpPost._embedded['wp:featuredmedia'] && wpPost._embedded['wp:featuredmedia'][0]) {
        const media = wpPost._embedded['wp:featuredmedia'][0];
        featuredImage = media.source_url || media.guid?.rendered || '/placeholder-blog.svg';
      }

      // Konvertiere relative URLs zu absoluten URLs
      if (featuredImage && !featuredImage.startsWith('http') && !featuredImage.startsWith('/placeholder')) {
        featuredImage = `http://wp.ugc-vz.de${featuredImage}`;
      }

      // Datum extrahieren
      const date = wpPost.date || new Date().toISOString();

      // Debug-Ausgabe für jeden gefundenen Post
      console.log(`Found post: "${title}" with slug: "${slug}"`);

      posts.push({
        id: slug,
        title,
        excerpt,
        content: '', // Wird beim einzelnen Artikel geladen
        slug,
        date,
        featuredImage,
        author: 'UGC VZ Team',
        categories: ['UGC', 'Creator Marketing']
      });
    }

    console.log(`Total posts found: ${posts.length}`);

    // Debug: Zeige alle gefundenen Posts
    posts.forEach((post, index) => {
      console.log(`${index + 1}. "${post.title}" (${post.slug})`);
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

    // Cache prüfen
    if (blogCache.length > 0 && (now - lastFetch) < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        posts: blogCache,
        cached: true
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
      cached: false
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

import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

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
    const response = await fetch('http://wp.ugc-vz.de/', {
      headers: {
        'User-Agent': 'UGC-VZ Blog Sync/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const posts: BlogPost[] = [];

    // WordPress-Artikel aus der HTML-Struktur extrahieren
    $('article, .post, .blog-post').each((index, element) => {
      const $post = $(element);

      // Titel extrahieren
      const titleElement = $post.find('h1, h2, h3, .entry-title, .post-title').first();
      const title = titleElement.text().trim();

      if (!title) return; // Skip wenn kein Titel gefunden

      // Link/Slug extrahieren
      const linkElement = $post.find('a[href*="wp.ugc-vz.de"]').first();
      const fullUrl = linkElement.attr('href') || '';
      const slug = fullUrl.split('/').filter(Boolean).pop() || `post-${index}`;

      // Excerpt extrahieren
      const excerptElement = $post.find('.excerpt, .entry-summary, p').first();
      let excerpt = excerptElement.text().trim();
      if (excerpt.length > 200) {
        excerpt = excerpt.substring(0, 200) + '...';
      }

      // Featured Image extrahieren
      const imageElement = $post.find('img').first();
      const featuredImage = imageElement.attr('src') || '/placeholder-blog.svg';

      // Datum extrahieren
      const dateElement = $post.find('.date, .post-date, time').first();
      const dateText = dateElement.text().trim();
      let date = new Date().toISOString();

      // Deutsches Datum parsen (z.B. "27. Mai 2025")
      if (dateText) {
        const germanMonths: { [key: string]: number } = {
          'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 'Mai': 4, 'Juni': 5,
          'Juli': 6, 'August': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
        };

        const dateMatch = dateText.match(/(\d{1,2})\.\s*(\w+)\s*(\d{4})/);
        if (dateMatch) {
          const [, day, month, year] = dateMatch;
          const monthIndex = germanMonths[month];
          if (monthIndex !== undefined) {
            date = new Date(parseInt(year), monthIndex, parseInt(day)).toISOString();
          }
        }
      }

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

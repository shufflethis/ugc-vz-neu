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
  readingTime: number;
}

// Cache für einzelne Artikel
const articleCache = new Map<string, BlogPost>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 Minuten

function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

function cleanContent(html: string): string {
  const $ = cheerio.load(html);

  // Entferne Navigation, Footer, Sidebar etc.
  $('nav, footer, .sidebar, .widget, .navigation, .menu, header').remove();

  // Entferne WordPress-spezifische Elemente
  $('.wp-block-navigation, .wp-site-blocks, .wp-block-group').remove();

  // Entferne Kommentar-Bereiche und andere unwichtige Elemente
  $('#comments, .comments, .comment-form, .further-posts, .navigation').remove();

  // Finde den Hauptinhalt
  let content = '';

  // Versuche verschiedene Content-Selektoren
  const contentSelectors = [
    '.entry-content',
    '.post-content',
    '.content',
    'article .content',
    'main article',
    '.post-body',
    'main',
    'article',
    '.wp-block-post-content',
    '.post'
  ];

  for (const selector of contentSelectors) {
    const element = $(selector);
    if (element.length > 0 && element.text().trim().length > 100) {
      content = element.html() || '';
      break;
    }
  }

  // Fallback: Suche nach dem längsten Text-Block
  if (!content) {
    let longestText = '';
    $('div, section, article, p').each((_, element) => {
      const $element = $(element);
      const text = $element.text().trim();

      // Ignoriere Navigation, Footer, etc.
      if ($element.closest('nav, footer, .navigation, .menu, .sidebar').length > 0) {
        return;
      }

      if (text.length > longestText.length && text.length > 200) {
        longestText = text;
        content = $element.html() || '';
      }
    });
  }

  // Letzter Fallback: Nimm den Haupttext-Content
  if (!content) {
    // Entferne alle unwichtigen Elemente
    $('script, style, nav, footer, .navigation, .menu, .sidebar, header, #comments, .comments').remove();

    // Suche nach dem größten zusammenhängenden Text-Block
    let bestElement = null;
    let maxTextLength = 0;

    $('*').each((_, element) => {
      const $element = $(element);
      const text = $element.text().trim();

      // Prüfe ob Element genug Text hat und nicht zu viele Child-Elemente
      if (text.length > maxTextLength && text.length > 500) {
        const childElements = $element.children().length;
        // Bevorzuge Elemente mit weniger verschachtelten Kindern
        if (childElements < 20 || text.length > maxTextLength * 1.5) {
          maxTextLength = text.length;
          bestElement = element;
        }
      }
    });

    if (bestElement) {
      content = $(bestElement).html() || '';
    }
  }

  if (content) {
    const $content = cheerio.load(content);

    // Bereinige Links
    $content('a').each((_, link) => {
      const $link = $content(link);
      const href = $link.attr('href');
      if (href && href.startsWith('http://wp.ugc-vz.de/')) {
        // Konvertiere zu relativen Links
        const slug = href.split('/').filter(Boolean).pop();
        $link.attr('href', `/wissen/${slug}`);
      }
    });

    // Bereinige Bilder
    $content('img').each((_, img) => {
      const $img = $content(img);
      $img.addClass('max-w-full h-auto rounded-lg my-4');

      // Füge lazy loading hinzu
      $img.attr('loading', 'lazy');
    });

    // Füge Styling zu Überschriften hinzu
    $content('h1, h2, h3, h4, h5, h6').each((_, heading) => {
      const $heading = $content(heading);
      $heading.addClass('font-bold mb-4 mt-8 text-white');

      const tagName = (heading as any).name || (heading as any).tagName || '';
      if (tagName === 'h1') $heading.addClass('text-3xl');
      else if (tagName === 'h2') $heading.addClass('text-2xl');
      else if (tagName === 'h3') $heading.addClass('text-xl');
      else $heading.addClass('text-lg');
    });

    // Füge Styling zu Paragraphen hinzu
    $content('p').addClass('mb-4 text-gray-200 leading-relaxed');

    // Füge Styling zu Listen hinzu
    $content('ul').addClass('list-disc list-inside mb-4 text-gray-200');
    $content('ol').addClass('list-decimal list-inside mb-4 text-gray-200');
    $content('li').addClass('mb-2');

    return $content.html() || '';
  }

  return '';
}

async function fetchSinglePost(slug: string): Promise<BlogPost | null> {
  try {
    // Prüfe Cache
    const cached = articleCache.get(slug);
    if (cached) {
      return cached;
    }

    // Konstruiere URL für einzelnen Artikel
    const articleUrl = `http://wp.ugc-vz.de/${slug}/`;

    const response = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'UGC-VZ Blog Sync/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Titel extrahieren
    const title = $('h1, .entry-title, .post-title').first().text().trim() ||
                  $('title').text().replace(' - Meine Webseite', '').trim();

    // Content extrahieren und bereinigen
    let content = cleanContent(html);

    // Fallback: Wenn kein Content gefunden, versuche direkten Text-Extraktion
    if (!content || content.trim().length < 100) {
      const $ = cheerio.load(html);

      // Entferne unwichtige Elemente
      $('script, style, nav, footer, header, .navigation, .menu, .sidebar, #comments, .comments, .comment-form').remove();

      // Extrahiere den gesamten Body-Text und strukturiere ihn
      const bodyText = $('body').text();
      const paragraphs = bodyText.split('\n\n').filter(p => p.trim().length > 50);

      // Konvertiere zu HTML
      content = paragraphs.map(p => `<p class="mb-4 text-gray-200 leading-relaxed">${p.trim()}</p>`).join('\n');
    }

    // Excerpt aus Content generieren
    const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const excerpt = textContent.length > 200 ?
                   textContent.substring(0, 200) + '...' :
                   textContent;

    // Featured Image
    const featuredImage = $('img').first().attr('src') || '/placeholder-blog.svg';

    // Datum extrahieren
    let date = new Date().toISOString();
    const dateText = $('.date, .post-date, time').first().text().trim();

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

    const post: BlogPost = {
      id: slug,
      title,
      excerpt,
      content,
      slug,
      date,
      featuredImage,
      author: 'UGC VZ Team',
      categories: ['UGC', 'Creator Marketing'],
      readingTime: estimateReadingTime(textContent)
    };

    // Cache speichern
    articleCache.set(slug, post);

    return post;
  } catch (error) {
    console.error(`Error fetching post ${slug}:`, error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug is required' },
        { status: 400 }
      );
    }

    const post = await fetchSinglePost(slug);

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Single post API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

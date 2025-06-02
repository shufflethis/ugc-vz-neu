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

    // Verwende WordPress REST API mit ACF-Feldern für bessere Datenqualität
    const response = await fetch(`http://wp.ugc-vz.de/wp-json/wp/v2/posts?slug=${slug}&_embed&acf_format=standard`, {
      headers: {
        'User-Agent': 'UGC-VZ Blog Sync/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const wpPosts = await response.json();

    if (!wpPosts || wpPosts.length === 0) {
      return null; // Post nicht gefunden
    }

    const wpPost = wpPosts[0]; // Erstes (und einziges) Ergebnis

    // Titel extrahieren und HTML-Entitäten dekodieren
    let title = wpPost.title?.rendered || '';
    if (!title) {
      return null;
    }

    // HTML-Entitäten dekodieren
    title = title.replace(/&#038;/g, '&').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

    // Content aus ACF oder Standard-Feldern extrahieren
    let content = '';

    // Versuche zuerst ACF-Daten zu verwenden
    if (wpPost.acf && wpPost.acf.page_content && Array.isArray(wpPost.acf.page_content)) {
      // Konvertiere ACF-Blöcke zu HTML
      const contentBlocks = [];

      for (const block of wpPost.acf.page_content) {
        if (block.acf_fc_layout === 'text_block' && block.text) {
          contentBlocks.push(block.text);
        } else if (block.acf_fc_layout === 'faq_accordion' && block.faqs) {
          // FAQ-Sektion hinzufügen
          contentBlocks.push('<div class="faq-section mt-8">');
          contentBlocks.push('<h2 class="text-2xl font-bold mb-6 text-white">Häufig gestellte Fragen</h2>');

          for (const faq of block.faqs) {
            if (faq.question && faq.answer) {
              contentBlocks.push(`
                <div class="faq-item mb-6 p-6 bg-gray-900/30 rounded-lg border border-gray-800/50">
                  <h3 class="text-lg font-semibold mb-3 text-emerald-300">${faq.question}</h3>
                  <div class="text-gray-200 leading-relaxed">${faq.answer}</div>
                </div>
              `);
            }
          }

          contentBlocks.push('</div>');
        }
      }

      content = contentBlocks.join('\n\n');
    }

    // Fallback auf Standard-Content
    if (!content) {
      content = wpPost.content?.rendered || '';
    }

    // Prüfe auf Platzhalter-Content und verwende Fallback
    const cleanTextContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!content || cleanTextContent.length < 50 || cleanTextContent.includes('UGC VZ 404') || cleanTextContent.includes('404')) {
      console.log(`Post "${title}" has placeholder content - using fallback content`);
      // Verwende Fallback-Content für Artikel ohne echten Inhalt
      content = `
        <div class="placeholder-content">
          <p class="text-lg mb-6">Dieser Artikel wird derzeit überarbeitet und bald mit umfassenden Inhalten gefüllt.</p>
          <p class="mb-4">In der Zwischenzeit empfehlen wir Ihnen, unsere anderen Artikel zu entdecken:</p>
          <ul class="list-disc list-inside mb-6">
            <li><a href="/wissen/ugc-qualitaet-vs-quantitaet-was-ist-wichtiger" class="text-emerald-400 hover:text-emerald-300 underline">UGC-Qualität vs. Quantität: Was ist wichtiger?</a></li>
            <li><a href="/wissen" class="text-emerald-400 hover:text-emerald-300 underline">Alle Artikel im Überblick</a></li>
          </ul>
          <p class="text-sm text-gray-400">Haben Sie Fragen zu diesem Thema? <a href="mailto:hi@ugc-vz.de" class="text-emerald-400 hover:text-emerald-300 underline">Kontaktieren Sie uns gerne!</a></p>
        </div>
      `;
    }

    // Content bereinigen und stylen
    if (content) {
      const $ = cheerio.load(content);

      // Bereinige Links
      $('a').each((_, link) => {
        const $link = $(link);
        const href = $link.attr('href');
        if (href && href.includes('ugc-vz.de')) {
          // Konvertiere zu relativen Links
          const slug = href.split('/').filter(Boolean).pop();
          $link.attr('href', `/wissen/${slug}`);
        }
      });

      // Bereinige Bilder
      $('img').each((_, img) => {
        const $img = $(img);
        $img.addClass('max-w-full h-auto rounded-lg my-4');
        $img.attr('loading', 'lazy');

        // Konvertiere relative URLs zu absoluten URLs
        const src = $img.attr('src');
        if (src && !src.startsWith('http') && !src.startsWith('/placeholder')) {
          $img.attr('src', `http://wp.ugc-vz.de${src}`);
        }
      });

      // Füge Styling zu Überschriften hinzu
      $('h1, h2, h3, h4, h5, h6').each((_, heading) => {
        const $heading = $(heading);
        $heading.addClass('font-bold mb-4 mt-8 text-white');

        const tagName = (heading as any).name || (heading as any).tagName || '';
        if (tagName === 'h1') $heading.addClass('text-3xl');
        else if (tagName === 'h2') $heading.addClass('text-2xl');
        else if (tagName === 'h3') $heading.addClass('text-xl');
        else $heading.addClass('text-lg');
      });

      // Füge Styling zu Paragraphen hinzu
      $('p').addClass('mb-4 text-gray-200 leading-relaxed');

      // Füge Styling zu Listen hinzu
      $('ul').addClass('list-disc list-inside mb-4 text-gray-200');
      $('ol').addClass('list-decimal list-inside mb-4 text-gray-200');
      $('li').addClass('mb-2');

      // Füge Styling zu starken Texten hinzu
      $('strong, b').addClass('text-white font-semibold');

      // Füge Styling zu Links hinzu
      $('a').addClass('text-emerald-400 hover:text-emerald-300 underline');

      content = $.html();
    }

    // Excerpt aus ACF oder Standard-Feldern extrahieren
    let excerpt = '';

    // Versuche zuerst ACF-Daten zu verwenden
    if (wpPost.acf && wpPost.acf.page_content && Array.isArray(wpPost.acf.page_content)) {
      // Extrahiere Text aus ACF-Blöcken für Excerpt
      for (const block of wpPost.acf.page_content) {
        if (block.acf_fc_layout === 'text_block' && block.text) {
          excerpt = block.text;
          break;
        }
      }
    }

    // Fallback auf Standard-Excerpt
    if (!excerpt) {
      excerpt = wpPost.excerpt?.rendered || '';
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

    if (!excerpt || excerpt.length < 10) {
      // Fallback: Excerpt aus Content generieren
      const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      excerpt = textContent.length > 250 ? textContent.substring(0, 250) + '...' : textContent;

      if (!excerpt || excerpt.length < 10) {
        excerpt = 'Entdecke die neuesten Insights und Strategien für erfolgreiches User Generated Content Marketing.';
      }
    }

    // Featured Image extrahieren
    let featuredImage = '/placeholder-blog.svg';

    // Versuche Featured Media aus _embedded zu extrahieren
    if (wpPost._embedded && wpPost._embedded['wp:featuredmedia'] && wpPost._embedded['wp:featuredmedia'][0]) {
      const media = wpPost._embedded['wp:featuredmedia'][0];
      featuredImage = media.source_url || media.guid?.rendered || '/placeholder-blog.svg';
    }

    // Datum extrahieren
    const date = wpPost.date || new Date().toISOString();

    // Lesezeit berechnen
    const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const readingTime = estimateReadingTime(textContent);

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
      readingTime
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

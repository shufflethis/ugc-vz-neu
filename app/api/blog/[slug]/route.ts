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
  schemaOrg?: string; // Schema.org JSON-LD als optionales Feld
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
      if (href && (href.startsWith('http://wp.ugc-vz.de/') || href.startsWith('https://wp.ugc-vz.de/'))) {
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
    const response = await fetch(`https://wp.ugc-vz.de/wp-json/wp/v2/posts?slug=${slug}&_embed&acf_format=standard`, {
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
    let isPlaceholderContent = false;
    if (!content || cleanTextContent.length < 50 || cleanTextContent.includes('UGC VZ 404') || cleanTextContent.includes('404')) {
      console.log(`Post "${title}" has placeholder content - using fallback content`);
      isPlaceholderContent = true;
      // Verwende Fallback-Content für Artikel ohne echten Inhalt (mit Titel für Einzigartigkeit)
      content = `
        <div class="placeholder-content">
          <p class="text-lg mb-6">Unser Artikel zu "${title}" wird derzeit überarbeitet und in Kürze mit umfassenden Inhalten aktualisiert.</p>
          <p class="mb-4">In der Zwischenzeit empfehlen wir Ihnen, unsere anderen Artikel zu entdecken:</p>
          <ul class="list-disc list-inside mb-6">
            <li><a href="/wissen/ugc-qualitaet-vs-quantitaet-was-ist-wichtiger" class="text-emerald-400 hover:text-emerald-300 underline">UGC-Qualität vs. Quantität: Was ist wichtiger?</a></li>
            <li><a href="/wissen" class="text-emerald-400 hover:text-emerald-300 underline">Alle Artikel im Überblick</a></li>
          </ul>
          <p class="text-sm text-gray-400">Haben Sie Fragen zu diesem Thema? <a href="mailto:hi@ugc-vz.de" class="text-emerald-400 hover:text-emerald-300 underline">Kontaktieren Sie uns gerne!</a></p>
        </div>
      `;
    }

    // Redirect-Mapping für interne Links (vermeidet Weiterleitungsketten)
    const linkRedirectMap: Record<string, string> = {
      // Duplicate Content → Original
      'ugc-success-stories-2': 'ugc-success-stories',
      'ugc-success-stories-3': 'ugc-success-stories',
      'ugc-trends-2025-2': 'ugc-trends-2025',
      'ugc-recht-was-ist-zu-beachten-2': 'ugc-recht-was-ist-zu-beachten',
      'warum-ugc-guenstiger-als-influencer-marketing-ist-2': 'warum-ugc-guenstiger-als-influencer-marketing-ist',
      'ugc-in-der-beauty-branche-2': 'ugc-in-der-beauty-branche',
      'ugc-in-der-beauty-branche-3': 'ugc-in-der-beauty-branche',
      'ugc-bewertungen-so-werden-sie-authentisch-2': 'ugc-bewertungen-so-werden-sie-authentisch',
      'ugc-bewertungen-so-werden-sie-authentisch-3': 'ugc-bewertungen-so-werden-sie-authentisch',
      'ugc-bewertungen-so-werden-sie-authentisch-4': 'ugc-bewertungen-so-werden-sie-authentisch',
      'ugc-bewertungen-so-werden-sie-authentisch-5': 'ugc-bewertungen-so-werden-sie-authentisch',
      // Thematische Redirects
      'ugc-creator-finden': 'ugc-creator-finden-17-wege-ohne-agentur-fuer-erfolgreiches-marketing',
      'creator-finden': 'ugc-creator-finden-17-wege-ohne-agentur-fuer-erfolgreiches-marketing',
      'ugc-agentur': 'ugc-agentur-vs-plattform-was-ist-besser',
      'preise': 'ugc-preise-was-kostet-ugc',
      'ugc-creator-kosten': 'ugc-preise-was-kostet-ugc',
      'trends': 'ugc-trends-2025',
      'ugc-trends': 'ugc-trends-2025',
      'ugc-entwicklung-trends-2023': 'ugc-trends-2025',
      'rechtliches-ugc': 'ugc-recht-was-ist-zu-beachten',
      'creator-werden': 'ugc-faqs-fuer-creator',
      'ugc-creator-werden': 'ugc-faqs-fuer-creator',
      'ugc-creator-werden-anleitung': 'ugc-faqs-fuer-creator',
      'creator-guide': 'ugc-faqs-fuer-creator',
      'ugc-academy': 'ugc-faqs-fuer-creator',
      'ugc-creator-academy': 'ugc-faqs-fuer-creator',
      'creator-academy': 'ugc-faqs-fuer-creator',
      'ugc-creator-ressourcen': 'ugc-faqs-fuer-creator',
      'ressourcen-fuer-creator': 'ugc-faqs-fuer-creator',
      'erfolgsgeheimnisse-top-ugc-creator': 'ugc-faqs-fuer-creator',
      'was-ist-ugc': 'ugc-faqs-fuer-brands',
      'ugc-marketing-definition-vorteile-best-practices': 'ugc-faqs-fuer-brands',
      'erfolgreiche-ugc-kampagnen': 'ugc-success-stories',
      'erfolgsgeschichten': 'ugc-success-stories',
      'case-studies': 'ugc-success-stories',
      'creator-portfolio': 'ugc-creator-portfolio-so-baust-du-es-auf',
      'creator-profil-erstellen': 'ugc-creator-portfolio-so-baust-du-es-auf',
      'ugc-strategie-aufbauen': 'ugc-content-strategie-entwickeln',
      'ugc-marketing-strategie-aufbauen': 'ugc-content-strategie-entwickeln',
      'erfolgreiche-ugc-strategien': 'ugc-content-strategie-entwickeln',
      'lifestyle': 'ugc-content-strategie-entwickeln',
      'podcaster': 'ugc-content-repurposing',
      'plattform-vergleich': 'ugc-plattformen-im-vergleich',
      'ugc-monetarisierung': 'ugc-preise-was-kostet-ugc',
      'erfolgsmetriken-fuer-content-creators': 'wie-messe-ich-ugc-roi',
      'creator-erfolgsstatistiken-2023': 'wie-messe-ich-ugc-roi',
      'ugc-vs-influencer-marketing-unterschiede-und-gemeinsamkeiten': 'warum-ugc-guenstiger-als-influencer-marketing-ist',
      'warum-micro-influencer-die-zukunft-des-influencer-marketings-sind': 'warum-ugc-guenstiger-als-influencer-marketing-ist',
      'nano-influencer': 'warum-ugc-guenstiger-als-influencer-marketing-ist',
      'warum-ugc-das-vertrauen-in-marken-staerkt': 'ugc-und-social-proof',
      'user-generated-content-erstellen-lassen': 'ugc-briefing-so-briefest-du-creator-richtig',
    };

    // Liste der kaputten externen Links (404s), die entfernt werden sollen
    const brokenExternalLinks: string[] = [
      // TikTok Business Blog (redirects/broken)
      'tiktok.com/business/en/blog/ugc-on-tiktok',
      'tiktok.com/business/en/blog',
      // Later.com (404)
      'later.com/blog/user-generated-content-marketing',
      'later.com/blog/user-generated-content',
      // Nielsen (404)
      'nielsen.com',
      // Tintup (404)
      'tintup.com/blog/user-generated-content-statistics',
      'tintup.com/blog/user-generated-content',
      // The Drum (404)
      'thedrum.com',
      // eMarketer (404)
      'emarketer.com',
      // Brandwatch (404)
      'brandwatch.com',
    ];

    // Content bereinigen und stylen
    if (content) {
      const $ = cheerio.load(content);

      // Entferne kaputte externe Links (ersetze durch Text)
      $('a').each((_, link) => {
        const $link = $(link);
        const href = $link.attr('href');
        if (href) {
          // Prüfe ob der Link zu einer kaputten externen Seite führt
          const isBrokenExternal = brokenExternalLinks.some(brokenUrl =>
            href.toLowerCase().includes(brokenUrl.toLowerCase())
          );

          if (isBrokenExternal) {
            // Ersetze den Link durch seinen Text (entferne nur das <a>-Tag, behalte den Inhalt)
            const linkText = $link.text();
            $link.replaceWith(`<span class="text-gray-300">${linkText}</span>`);
          }
        }
      });

      // Bereinige Links und wende Redirect-Mapping an
      $('a').each((_, link) => {
        const $link = $(link);
        let href = $link.attr('href');
        if (href) {
          // Extrahiere Slug aus der URL
          let linkSlug = '';
          if (href.includes('ugc-vz.de')) {
            linkSlug = href.split('/').filter(Boolean).pop() || '';
          } else if (href.startsWith('/wissen/')) {
            linkSlug = href.replace('/wissen/', '');
          }

          // Wende Redirect-Mapping an
          if (linkSlug && linkRedirectMap[linkSlug]) {
            $link.attr('href', `/wissen/${linkRedirectMap[linkSlug]}`);
          } else if (href.includes('ugc-vz.de')) {
            // Konvertiere zu relativen Links
            $link.attr('href', `/wissen/${linkSlug}`);
          }
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
          $img.attr('src', `https://wp.ugc-vz.de${src}`);
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

    // Prüfe auf ungültige/Platzhalter-Excerpts
    const invalidExcerpts = ['SearchGPT 404', '404', 'UGC VZ 404', 'placeholder', 'coming soon', 'wird derzeit überarbeitet'];
    const isInvalidExcerpt = !excerpt ||
                             excerpt.length < 10 ||
                             isPlaceholderContent ||
                             invalidExcerpts.some(invalid => excerpt.toLowerCase().includes(invalid.toLowerCase()));

    if (isInvalidExcerpt) {
      // Für Platzhalter-Content: Generiere einzigartige Description basierend auf Titel
      if (isPlaceholderContent) {
        // Erstelle einzigartige Meta-Descriptions basierend auf dem Slug/Titel
        const descriptionMap: Record<string, string> = {
          'ugc-success-stories': 'Entdecke inspirierende Erfolgsgeschichten von UGC Creators und Brands. Lerne aus realen Kampagnen und Best Practices.',
          'ugc-trends-2025': 'Die wichtigsten UGC-Trends für 2025: Von AI-Content bis Micro-Influencer. So bleibst du als Creator relevant.',
          'warum-ugc-guenstiger-als-influencer-marketing-ist': 'UGC vs. Influencer-Marketing: Warum User Generated Content oft kosteneffizienter ist und bessere Ergebnisse liefert.',
          'ugc-recht-was-ist-zu-beachten': 'Rechtliche Grundlagen für UGC: Urheberrecht, Nutzungsrechte und Verträge. Was Creator und Brands wissen müssen.',
          'ugc-bewertungen-so-werden-sie-authentisch': 'Authentische Bewertungen sammeln: So nutzt du User Generated Content für mehr Vertrauen und Conversions.',
        };
        excerpt = descriptionMap[slug] || `${title}: Tipps, Strategien und Insights für erfolgreiches UGC-Marketing. Jetzt mehr erfahren.`;
      } else {
        // Fallback: Excerpt aus Content generieren
        const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

        // Versuche einen sinnvollen ersten Satz zu extrahieren
        const firstSentence = textContent.match(/^[^.!?]+[.!?]/);
        if (firstSentence && firstSentence[0].length > 50 && firstSentence[0].length < 200) {
          excerpt = firstSentence[0].trim();
        } else {
          excerpt = textContent.length > 250 ? textContent.substring(0, 250) + '...' : textContent;
        }

        // Letzter Fallback: Generiere Excerpt basierend auf Titel
        if (!excerpt || excerpt.length < 20) {
          excerpt = `${title}: Praktische Tipps und Strategien für erfolgreiches Content Marketing.`;
        }
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

    // Schema.org JSON-LD aus ACF extrahieren oder automatisch generieren
    let schemaOrg: string | undefined = undefined;
    if (wpPost.acf && wpPost.acf.schema_org_json) {
      try {
        // Verwende das Schema.org JSON-LD direkt aus dem ACF-Feld
        schemaOrg = wpPost.acf.schema_org_json;
      } catch (error) {
        console.error('Error processing Schema.org JSON-LD:', error);
      }
    }
    
    // Fallback: Generiere Schema.org JSON-LD automatisch, wenn es nicht im ACF-Feld vorhanden ist
    if (!schemaOrg) {
      try {
        // Generiere BlogPosting Schema
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ugc-vz.de';
        const postUrl = `${baseUrl}/wissen/${slug}`;
        
        // Extrahiere Bild-Dimensionen (Fallback-Werte, wenn nicht verfügbar)
        let imageWidth = 1200;
        let imageHeight = 630;
        
        // Extrahiere Wortanzahl für wordCount
        const wordCount = textContent.split(/\s+/).length;
        
        // Extrahiere Keywords aus Kategorien
        const keywords = wpPost.categories ? 
          wpPost._embedded?.['wp:term']?.[0]?.map((term: any) => term.name).join(', ') : 
          'UGC, Creator Marketing';
        
        const blogPostSchema = {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": postUrl
          },
          "headline": title,
          "description": excerpt,
          "image": {
            "@type": "ImageObject",
            "url": featuredImage,
            "width": imageWidth,
            "height": imageHeight
          },
          "datePublished": date,
          "dateModified": wpPost.modified || date,
          "author": {
            "@type": "Person",
            "name": "UGC VZ Team",
            "url": baseUrl
          },
          "publisher": {
            "@type": "Organization",
            "name": "UGC VZ",
            "logo": {
              "@type": "ImageObject",
              "url": `${baseUrl}/ugc-vz-logo-600x60.svg`,
              "width": 600,
              "height": 60
            }
          },
          "articleBody": textContent,
          "wordCount": wordCount,
          "keywords": keywords
        };
        
        schemaOrg = JSON.stringify(blogPostSchema);
      } catch (error) {
        console.error('Error generating Schema.org JSON-LD:', error);
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
      readingTime,
      schemaOrg // Schema.org JSON-LD hinzufügen
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

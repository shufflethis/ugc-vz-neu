import { NextRequest, NextResponse } from 'next/server';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  readTime: string;
  image: string;
  slug: string;
  categories: string[];
}

export async function fetchWordPressPosts(): Promise<BlogPost[]> {
  try {
    const timestamp = Date.now();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const beforeDate = tomorrow.toISOString();
    
    const response = await fetch(`https://wp.ugc-vz.de/wp-json/wp/v2/posts?per_page=50&_embed&acf_format=standard&orderby=date&order=desc&_t=${timestamp}&before=${beforeDate}&status=publish`, {
      headers: {
        'User-Agent': 'UGC-VZ Blog Sync/1.0',
      },
      next: {
        revalidate: 300, // Revalidate every 5 minutes
        tags: ['blog-posts']
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const wpPosts = await response.json();
    console.log(`WordPress API returned ${wpPosts.length} posts`);

    const posts: BlogPost[] = [];

    for (const wpPost of wpPosts) {
      let title = wpPost.title?.rendered || '';
      if (!title) continue;

      title = title.replace(/&#038;/g, '&').replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');

      const slug = wpPost.slug || `post-${wpPost.id}`;

      let excerpt = '';
      if (wpPost.acf && wpPost.acf.page_content && Array.isArray(wpPost.acf.page_content)) {
        for (const block of wpPost.acf.page_content) {
          if (block.acf_fc_layout === 'text_block' && block.text) {
            excerpt = block.text;
            break;
          }
        }
      }

      if (!excerpt) {
        excerpt = wpPost.excerpt?.rendered || wpPost.content?.rendered || '';
      }

      if (excerpt) {
        excerpt = excerpt.replace(/<[^>]*>/g, '').trim();
        excerpt = excerpt.replace(/\[&hellip;\]/g, '...');
        excerpt = excerpt.replace(/\*\*/g, '');
        excerpt = excerpt.replace(/\n+/g, ' ');

        if (excerpt.length > 250) {
          excerpt = excerpt.substring(0, 250) + '...';
        }
      }

      if (!excerpt || excerpt.length < 10 || excerpt.includes('UGC VZ 404') || excerpt.includes('404')) {
        console.log(`Post "${title}" has placeholder content - using fallback excerpt`);
        excerpt = 'Entdecke die neuesten Insights und Strategien für erfolgreiches User Generated Content Marketing.';
      }

      if (excerpt.length < 20) {
        excerpt = 'Entdecke die neuesten Insights und Strategien für erfolgreiches User Generated Content Marketing.';
      }

      let image = '/placeholder-blog.svg';
      if (wpPost._embedded && wpPost._embedded['wp:featuredmedia'] && wpPost._embedded['wp:featuredmedia'][0]) {
        const media = wpPost._embedded['wp:featuredmedia'][0];
        if (media.source_url) {
          image = media.source_url;
        } else if (media.media_details && media.media_details.sizes) {
          const sizes = media.media_details.sizes;
          if (sizes.large) {
            image = sizes.large.source_url;
          } else if (sizes.medium_large) {
            image = sizes.medium_large.source_url;
          } else if (sizes.medium) {
            image = sizes.medium.source_url;
          }
        }
      }

      if (image && !image.startsWith('http') && !image.startsWith('/placeholder')) {
        image = `https://wp.ugc-vz.de${image}`;
      }

      const date = wpPost.date || new Date().toISOString();

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

      // Dummy readTime for now, will need to calculate this based on content length
      const readTime = `${Math.ceil((wpPost.content?.rendered?.length || 0) / 200)} min Lesezeit`;

      console.log(`Found post: "${title}" with slug: "${slug}" and ${excerpt.length} chars excerpt`);

      posts.push({
        id: wpPost.id, // Use WordPress post ID as number
        title,
        excerpt,
        content: '', // Will be loaded for individual articles
        slug,
        date,
        image, // Renamed from featuredImage
        author: 'UGC VZ Team',
        readTime,
        categories
      });
    }

    console.log(`Total posts found: ${posts.length}`);

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
    const posts = await fetchWordPressPosts();

    const response = NextResponse.json({
      success: true,
      posts: posts,
      cached: true, // Next.js fetch caching handles this
      lastFetch: new Date().toISOString(),
      totalPosts: posts.length
    });

    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60'); // 5 minutes cache

    return response;
  } catch (error) {
    console.error('Blog API error:', error);
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch blog posts',
        posts: [] // Return empty array on error
      },
      { status: 500 }
    );

    errorResponse.headers.set('X-Content-Type-Options', 'nosniff');

    return errorResponse;
  }
}

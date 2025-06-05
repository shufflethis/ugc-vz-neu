// WordPress API utility functions for UGC VZ

export interface WordPressPost {
  id?: number;
  title: string;
  content: string;
  status: 'draft' | 'publish' | 'private';
  excerpt?: string;
  slug?: string;
  categories?: number[];
  tags?: number[];
  featured_media?: number;
  author?: number;
  date?: string;
}

export interface WordPressApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
}

export interface BlogPost {
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

export async function fetchAndProcessWordPressPosts(): Promise<BlogPost[]> {
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

      const readTime = `${Math.ceil((wpPost.content?.rendered?.length || 0) / 200)} min Lesezeit`;

      console.log(`Found post: "${title}" with slug: "${slug}" and ${excerpt.length} chars excerpt`);

      posts.push({
        id: wpPost.id,
        title,
        excerpt,
        content: '',
        slug,
        date,
        image,
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

class WordPressAPI {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.WORDPRESS_API_URL || 'https://wp.searchgptagentur.de/wp-json/wp/v2';
    this.token = process.env.WORDPRESS_JWT_TOKEN || '';
    
    if (!this.token) {
      console.warn('WordPress JWT token not found in environment variables');
    }
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      'User-Agent': 'UGC-VZ WordPress Integration/1.0'
    };
  }

  /**
   * Create a new WordPress post
   */
  async createPost(post: WordPressPost): Promise<WordPressApiResponse> {
    try {
      if (!this.token) {
        return {
          success: false,
          error: 'WordPress JWT token not configured'
        };
      }

      const response = await fetch(`${this.baseUrl}/posts`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          title: post.title,
          content: post.content,
          status: post.status,
          excerpt: post.excerpt || '',
          slug: post.slug || '',
          categories: post.categories || [],
          tags: post.tags || [],
          featured_media: post.featured_media || 0,
          author: post.author || undefined,
          date: post.date || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('WordPress API Error:', data);
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          data
        };
      }

      return {
        success: true,
        data,
        status: response.status
      };
    } catch (error) {
      console.error('WordPress API Request Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update an existing WordPress post
   */
  async updatePost(postId: number, post: Partial<WordPressPost>): Promise<WordPressApiResponse> {
    try {
      if (!this.token) {
        return {
          success: false,
          error: 'WordPress JWT token not configured'
        };
      }

      const response = await fetch(`${this.baseUrl}/posts/${postId}`, {
        method: 'POST', // WordPress uses POST for updates
        headers: this.getHeaders(),
        body: JSON.stringify(post)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('WordPress API Error:', data);
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          data
        };
      }

      return {
        success: true,
        data,
        status: response.status
      };
    } catch (error) {
      console.error('WordPress API Request Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get WordPress post by ID
   */
  async getPost(postId: number): Promise<WordPressApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${postId}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'UGC-VZ WordPress Integration/1.0'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          data
        };
      }

      return {
        success: true,
        data,
        status: response.status
      };
    } catch (error) {
      console.error('WordPress API Request Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Delete a WordPress post
   */
  async deletePost(postId: number): Promise<WordPressApiResponse> {
    try {
      if (!this.token) {
        return {
          success: false,
          error: 'WordPress JWT token not configured'
        };
      }

      const response = await fetch(`${this.baseUrl}/posts/${postId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          data
        };
      }

      return {
        success: true,
        data,
        status: response.status
      };
    } catch (error) {
      console.error('WordPress API Request Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get WordPress categories
   */
  async getCategories(): Promise<WordPressApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/categories?per_page=100`, {
        method: 'GET',
        headers: {
          'User-Agent': 'UGC-VZ WordPress Integration/1.0'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          data
        };
      }

      return {
        success: true,
        data,
        status: response.status
      };
    } catch (error) {
      console.error('WordPress API Request Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Test the WordPress API connection
   */
  async testConnection(): Promise<WordPressApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/posts?per_page=1`, {
        method: 'GET',
        headers: {
          'User-Agent': 'UGC-VZ WordPress Integration/1.0'
        }
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        };
      }

      return {
        success: true,
        data: { message: 'WordPress API connection successful' },
        status: response.status
      };
    } catch (error) {
      console.error('WordPress API Connection Test Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }
}

// Export a singleton instance
export const wordpressAPI = new WordPressAPI();
export default wordpressAPI;

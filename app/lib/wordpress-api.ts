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

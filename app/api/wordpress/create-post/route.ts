import { NextRequest, NextResponse } from 'next/server';
import { wordpressAPI, WordPressPost } from '../../../lib/wordpress-api';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface CreatePostRequest {
  title: string;
  content: string;
  status?: 'draft' | 'publish' | 'private';
  excerpt?: string;
  slug?: string;
  categories?: number[];
  tags?: number[];
  featured_media?: number;
  author?: number;
  date?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePostRequest = await request.json();
    
    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title and content are required fields'
        },
        { status: 400 }
      );
    }

    // Prepare the post data
    const postData: WordPressPost = {
      title: body.title,
      content: body.content,
      status: body.status || 'draft',
      excerpt: body.excerpt || '',
      slug: body.slug || '',
      categories: body.categories || [],
      tags: body.tags || [],
      featured_media: body.featured_media || 0,
      author: body.author || undefined,
      date: body.date || undefined
    };

    console.log('Creating WordPress post:', {
      title: postData.title,
      status: postData.status,
      contentLength: postData.content.length
    });

    // Create the post using the WordPress API
    const result = await wordpressAPI.createPost(postData);

    if (!result.success) {
      console.error('WordPress post creation failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to create WordPress post',
          details: result.data
        },
        { status: result.status || 500 }
      );
    }

    console.log('WordPress post created successfully:', {
      id: result.data?.id,
      title: result.data?.title?.rendered,
      status: result.data?.status,
      link: result.data?.link
    });

    return NextResponse.json({
      success: true,
      message: 'Post created successfully',
      data: {
        id: result.data?.id,
        title: result.data?.title?.rendered,
        slug: result.data?.slug,
        status: result.data?.status,
        link: result.data?.link,
        date: result.data?.date,
        modified: result.data?.modified
      }
    });

  } catch (error) {
    console.error('WordPress post creation API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to test the WordPress API connection
export async function GET(request: NextRequest) {
  try {
    console.log('Testing WordPress API connection...');
    
    const result = await wordpressAPI.testConnection();
    
    if (!result.success) {
      console.error('WordPress API connection test failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'WordPress API connection failed',
          status: result.status
        },
        { status: result.status || 500 }
      );
    }

    console.log('WordPress API connection test successful');
    
    return NextResponse.json({
      success: true,
      message: 'WordPress API connection successful',
      baseUrl: process.env.WORDPRESS_API_URL,
      hasToken: !!process.env.WORDPRESS_JWT_TOKEN
    });

  } catch (error) {
    console.error('WordPress API connection test error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Connection test failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

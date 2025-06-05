import { NextRequest, NextResponse } from 'next/server';
import { fetchAndProcessWordPressPosts, BlogPost } from '../../lib/wordpress-api';

export async function GET(request: NextRequest) {
  try {
    const posts = await fetchAndProcessWordPressPosts();

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

import { NextRequest, NextResponse } from 'next/server';
import { wordpressAPI, WordPressPost } from '../../../../lib/wordpress-api';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface UpdatePostRequest {
  title?: string;
  content?: string;
  status?: 'draft' | 'publish' | 'private';
  excerpt?: string;
  slug?: string;
  categories?: number[];
  tags?: number[];
  featured_media?: number;
  author?: number;
  date?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = parseInt(params.id);
    
    if (isNaN(postId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid post ID'
        },
        { status: 400 }
      );
    }

    const body: UpdatePostRequest = await request.json();
    
    // Validate that at least one field is provided for update
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one field must be provided for update'
        },
        { status: 400 }
      );
    }

    console.log('Updating WordPress post:', {
      id: postId,
      fields: Object.keys(body)
    });

    // Update the post using the WordPress API
    const result = await wordpressAPI.updatePost(postId, body);

    if (!result.success) {
      console.error('WordPress post update failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to update WordPress post',
          details: result.data
        },
        { status: result.status || 500 }
      );
    }

    console.log('WordPress post updated successfully:', {
      id: result.data?.id,
      title: result.data?.title?.rendered,
      status: result.data?.status,
      modified: result.data?.modified
    });

    return NextResponse.json({
      success: true,
      message: 'Post updated successfully',
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
    console.error('WordPress post update API error:', error);
    
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

// GET endpoint to retrieve a specific post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = parseInt(params.id);
    
    if (isNaN(postId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid post ID'
        },
        { status: 400 }
      );
    }

    console.log('Retrieving WordPress post:', postId);
    
    const result = await wordpressAPI.getPost(postId);
    
    if (!result.success) {
      console.error('WordPress post retrieval failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to retrieve WordPress post',
          details: result.data
        },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('WordPress post retrieval API error:', error);
    
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

// DELETE endpoint to delete a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = parseInt(params.id);
    
    if (isNaN(postId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid post ID'
        },
        { status: 400 }
      );
    }

    console.log('Deleting WordPress post:', postId);
    
    const result = await wordpressAPI.deletePost(postId);
    
    if (!result.success) {
      console.error('WordPress post deletion failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to delete WordPress post',
          details: result.data
        },
        { status: result.status || 500 }
      );
    }

    console.log('WordPress post deleted successfully:', postId);

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
      data: result.data
    });

  } catch (error) {
    console.error('WordPress post deletion API error:', error);
    
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

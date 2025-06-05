import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { setLastSyncTime, setPendingSyncTime } from '../../../lib/blog-sync';
import { fetchAndProcessWordPressPosts } from '../../../lib/wordpress-api'; // Import the fetch function

export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Authenticates the request based on BLOG_SYNC_SECRET or CRON_SECRET.
 * @param request - The NextRequest object.
 * @returns {boolean} True if authenticated, false otherwise.
 */
function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const authQuery = request.nextUrl.searchParams.get('auth');
  const cronHeader = request.headers.get('x-vercel-cron-auth');

  const blogSyncSecret = process.env.BLOG_SYNC_SECRET;
  const cronSecret = process.env.CRON_SECRET;

  // Check for BLOG_SYNC_SECRET (for manual syncs/webhooks)
  if (blogSyncSecret && (authHeader === `Bearer ${blogSyncSecret}` || authQuery === blogSyncSecret)) {
    return true;
  }

  // Check for CRON_SECRET (for automated cron jobs like GitHub Actions)
  if (cronSecret && cronHeader === cronSecret) {
    return true;
  }

  return false;
}

/**
 * Performs the core blog synchronization logic: fetches posts and triggers revalidation.
 * @param postSlug - Optional slug of a specific post to revalidate.
 */
async function syncBlogPosts(postSlug?: string) {
  console.log('Starting blog synchronization...');
  try {
    // Fetch posts to ensure they are available for the revalidation process
    // This also ensures the fetchAndProcessWordPressPosts function is called, which updates the Next.js cache
    const posts = await fetchAndProcessWordPressPosts();
    console.log(`Fetched ${posts.length} posts from WordPress.`);

    // Revalidate the 'blog-posts' tag to invalidate the cache for the /api/blog route
    revalidateTag('blog-posts');
    console.log('Revalidated cache tag: blog-posts');

    // Revalidate specific paths for immediate page updates
    const pathsToRevalidate = ['/wissen'];
    if (postSlug) {
      pathsToRevalidate.push(`/wissen/${postSlug}`);
    }

    for (const path of pathsToRevalidate) {
      // Using revalidatePath directly is generally preferred over calling /api/revalidate
      // if you are within the same Next.js application.
      // However, if /api/revalidate has additional logic (e.g., logging, external calls),
      // then calling it via fetch might still be desired.
      // For simplicity and directness, I'll use revalidatePath here.
      // If /api/revalidate is strictly necessary, we'd need to ensure it's properly authenticated.
      // For now, assuming revalidatePath is sufficient for cache invalidation.
      // If the user's /api/revalidate route has specific logic, we might need to adjust.
      // Given the previous code called /api/revalidate, I will stick to that pattern for now,
      // but will simplify the internal call to avoid re-authenticating within the same app.

      // Re-using the existing revalidation logic from the original file,
      // but making it a direct call to the revalidate function if it were exposed,
      // or keeping the fetch call if /api/revalidate has specific side effects.
      // For now, I'll simulate the revalidation call as it was, but simplify the secret handling.
      
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ugc-vz.de';
      const revalidateUrl = `${baseUrl}/api/revalidate`;
      const revalidateSecret = process.env.REVALIDATION_SECRET || process.env.BLOG_SYNC_SECRET || process.env.CRON_SECRET; // Use any available secret

      const revalidateResponse = await fetch(revalidateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${revalidateSecret}`
        },
        body: JSON.stringify({
          paths: [path]
        })
      });

      if (revalidateResponse.ok) {
        console.log(`Revalidation triggered successfully for path: ${path}`);
      } else {
        console.error(`Revalidation failed for path ${path}:`, await revalidateResponse.text());
        throw new Error(`Revalidation failed for path ${path}`);
      }
    }

    setLastSyncTime(Date.now());
    console.log('Blog synchronization completed successfully.');
    return { success: true, message: 'Blog synchronization completed.' };
  } catch (error) {
    console.error('Error during blog synchronization:', error);
    const delayMinutes = 1.5;
    const pendingTimestamp = Date.now() + (delayMinutes * 60 * 1000);
    setPendingSyncTime(pendingTimestamp);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

/**
 * POST-Endpunkt für manuelle Synchronisierung oder WordPress-Webhook
 */
export async function POST(request: NextRequest) {
  console.log('POST /api/blog/sync triggered');
  if (!isAuthenticated(request)) {
    console.log('Unauthorized POST /api/blog/sync attempt');
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const postSlug = body.post_slug;

  const result = await syncBlogPosts(postSlug);

  if (result.success) {
    return NextResponse.json({
      success: true,
      message: 'Blog synchronization triggered successfully.',
      timestamp: Date.now(),
      post_slug: postSlug
    });
  } else {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
        message: 'Blog synchronization failed. A delayed sync might be scheduled.'
      },
      { status: 500 }
    );
  }
}

/**
 * GET-Endpunkt zum manuellen Triggern der Synchronisierung
 */
export async function GET(request: NextRequest) {
  console.log('GET /api/blog/sync triggered');
  if (!isAuthenticated(request)) {
    console.log('Unauthorized GET /api/blog/sync attempt');
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const result = await syncBlogPosts();

  if (result.success) {
    return NextResponse.json({
      success: true,
      message: 'Blog synchronization triggered successfully.',
      timestamp: Date.now()
    });
  } else {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
        message: 'Blog synchronization failed. A delayed sync might be scheduled.'
      },
      { status: 500 }
    );
  }
}

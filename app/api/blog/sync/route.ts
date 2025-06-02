import { NextRequest, NextResponse } from 'next/server';
import { setLastSyncTime } from '../../../lib/blog-sync';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Webhook-Endpunkt für WordPress, um den Blog-Cache zu invalidieren
 * Kann von WordPress aus aufgerufen werden, wenn neue Artikel veröffentlicht werden
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Blog sync webhook triggered');

    // Starke Authentifizierung - erfordert BLOG_SYNC_SECRET
    const authHeader = request.headers.get('authorization');
    const authQuery = request.nextUrl.searchParams.get('auth');
    const expectedAuth = process.env.BLOG_SYNC_SECRET;

    // Fehler wenn kein Secret konfiguriert ist
    if (!expectedAuth) {
      console.error('BLOG_SYNC_SECRET not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Authentifizierung prüfen
    if (authHeader !== `Bearer ${expectedAuth}` && authQuery !== expectedAuth) {
      console.log('Unauthorized blog sync attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Cache invalidieren durch Setzen der letzten Sync-Zeit
    const timestamp = Date.now();
    setLastSyncTime(timestamp);

    // Optional: Spezifische Cache-Invalidierung
    const body = await request.json().catch(() => ({}));
    const postId = body.post_id;
    const action = body.action; // 'publish', 'update', 'delete'

    console.log(`Blog sync: ${action || 'cache_invalidation'} for post ${postId || 'all'}`);

    // Hier könnte man spezifische Cache-Invalidierung implementieren
    // Für jetzt invalidieren wir einfach den gesamten Cache

    return NextResponse.json({
      success: true,
      message: 'Blog cache invalidated successfully',
      timestamp: timestamp,
      post_id: postId,
      action: action
    });

  } catch (error) {
    console.error('Blog sync webhook error:', error);

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

/**
 * GET-Endpunkt zum manuellen Triggern der Cache-Invalidierung
 */
export async function GET(request: NextRequest) {
  try {
    const authQuery = request.nextUrl.searchParams.get('auth');
    const expectedAuth = process.env.BLOG_SYNC_SECRET;

    // Fehler wenn kein Secret konfiguriert ist
    if (!expectedAuth) {
      console.error('BLOG_SYNC_SECRET not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authQuery !== expectedAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Cache invalidieren
    const timestamp = Date.now();
    setLastSyncTime(timestamp);

    console.log('Manual blog cache invalidation triggered');

    return NextResponse.json({
      success: true,
      message: 'Blog cache invalidated manually',
      timestamp: timestamp
    });

  } catch (error) {
    console.error('Manual blog sync error:', error);

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



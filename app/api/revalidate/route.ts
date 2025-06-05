import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * On-Demand Revalidation API für Next.js
 * Ermöglicht sofortige Aktualisierung von statisch generierten Seiten
 */
export async function POST(request: NextRequest) {
  try {
    // Authentifizierung prüfen
    const authHeader = request.headers.get('authorization');
    const authQuery = request.nextUrl.searchParams.get('secret');
    const expectedAuth = process.env.REVALIDATION_SECRET || process.env.BLOG_SYNC_SECRET;

    // Fehler wenn kein Secret konfiguriert ist
    if (!expectedAuth) {
      console.error('REVALIDATION_SECRET not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Authentifizierung prüfen
    if (authHeader !== `Bearer ${expectedAuth}` && authQuery !== expectedAuth) {
      console.log('Unauthorized revalidation attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Pfade aus dem Request-Body oder Query-Parameter extrahieren
    let paths: string[] = [];
    
    // Aus Body extrahieren, falls vorhanden
    try {
      const body = await request.json();
      if (body.paths && Array.isArray(body.paths)) {
        paths = body.paths;
      } else if (body.path && typeof body.path === 'string') {
        paths = [body.path];
      }
    } catch (e) {
      // Kein JSON-Body oder ungültiges Format
    }
    
    // Aus Query-Parameter extrahieren, falls vorhanden
    const pathQuery = request.nextUrl.searchParams.get('path');
    if (pathQuery && !paths.includes(pathQuery)) {
      paths.push(pathQuery);
    }
    
    // Standardpfad, falls keine Pfade angegeben wurden
    if (paths.length === 0) {
      paths = ['/wissen'];
    }

    // Alle angegebenen Pfade revalidieren
    for (const path of paths) {
      console.log(`Revalidating path: ${path}`);
      revalidatePath(path);
    }

    return NextResponse.json({
      revalidated: true,
      paths,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Revalidation error:', error);
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
 * GET-Endpunkt für einfache Revalidierung über URL-Parameter
 */
export async function GET(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get('secret');
    const path = request.nextUrl.searchParams.get('path') || '/wissen';
    const expectedSecret = process.env.REVALIDATION_SECRET || process.env.BLOG_SYNC_SECRET;

    // Fehler wenn kein Secret konfiguriert ist
    if (!expectedSecret) {
      console.error('REVALIDATION_SECRET not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Authentifizierung prüfen
    if (secret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Pfad revalidieren
    console.log(`Revalidating path: ${path}`);
    revalidatePath(path);

    return NextResponse.json({
      revalidated: true,
      path,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Revalidation error:', error);
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
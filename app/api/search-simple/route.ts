import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 25; // Reduced for Vercel
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Simple mock data for testing
const mockCreators = [
  {
    id: 'rec1',
    name: 'Anna',
    image: '/female-placeholder.webp',
    reach: 'Instagram: 25k\nTikTok: 40k',
    totalReach: 65000,
    networks: ['Instagram', 'TikTok'],
    priceRange: '500-1000€',
    gender: 'Weiblich'
  },
  {
    id: 'rec2',
    name: 'Max',
    image: '/placeholder.jpg',
    reach: 'Instagram: 15k\nYouTube: 50k',
    totalReach: 65000,
    networks: ['Instagram', 'YouTube'],
    priceRange: '1000-2000€',
    gender: 'Männlich'
  },
  {
    id: 'rec3',
    name: 'Sophie',
    image: '/female-placeholder.webp',
    reach: 'TikTok: 100k\nInstagram: 35k',
    totalReach: 135000,
    networks: ['TikTok', 'Instagram'],
    priceRange: '2000-3000€',
    gender: 'Weiblich'
  },
  {
    id: 'rec4',
    name: 'Luca',
    image: '/placeholder.jpg',
    reach: 'TikTok: 80k\nInstagram: 30k',
    totalReach: 110000,
    networks: ['TikTok', 'Instagram'],
    priceRange: '800-1500€',
    gender: 'Männlich'
  },
  {
    id: 'rec5',
    name: 'René',
    image: '/placeholder.jpg',
    reach: 'TikTok: 120k\nYouTube: 45k',
    totalReach: 165000,
    networks: ['TikTok', 'YouTube'],
    priceRange: '1500-2500€',
    gender: 'Männlich'
  }
];

export async function POST(req: Request) {
  const requestId = Date.now().toString();

  try {
    // Log device and browser information for debugging
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    console.log(`[${requestId}] Simple search API called`);
    console.log(`[${requestId}] User Agent: ${userAgent}`);
    console.log(`[${requestId}] iOS Device: ${isIOSDevice}, Mobile Device: ${isMobileDevice}`);

    const body = await req.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Query is required'
      }, { status: 400 });
    }

    console.log(`[${requestId}] Processing query: "${query}"`);

    // Simple query analysis with improved gender filtering
    const queryLower = query.toLowerCase();
    let filteredCreators = [...mockCreators];

    console.log(`[${requestId}] Analyzing gender preferences in query: "${query}"`);

    // Check for explicit gender keywords first - these ALWAYS take precedence
    const hasMaleKeywords = queryLower.includes('männer') || queryLower.includes('männlich') || queryLower.includes('mann');
    const hasFemaleKeywords = queryLower.includes('frauen') || queryLower.includes('weiblich') || queryLower.includes('frau');
    const hasBeautyKeywords = queryLower.includes('kosmetik') || queryLower.includes('beauty') || queryLower.includes('make-up');

    console.log(`[${requestId}] Gender keyword analysis: male=${hasMaleKeywords}, female=${hasFemaleKeywords}, beauty=${hasBeautyKeywords}`);

    // Gender filtering with explicit precedence
    if (hasMaleKeywords) {
      filteredCreators = filteredCreators.filter(c => c.gender === 'Männlich');
      console.log(`[${requestId}] Filtered for male creators (explicit keyword): ${filteredCreators.length} results`);
    } else if (hasFemaleKeywords) {
      filteredCreators = filteredCreators.filter(c => c.gender === 'Weiblich');
      console.log(`[${requestId}] Filtered for female creators (explicit keyword): ${filteredCreators.length} results`);
    } else if (hasBeautyKeywords) {
      // Only default to female for beauty/cosmetics if NO explicit gender is specified
      filteredCreators = filteredCreators.filter(c => c.gender === 'Weiblich');
      console.log(`[${requestId}] Beauty query - filtered for female creators (no explicit gender): ${filteredCreators.length} results`);
    }

    // Platform filtering
    if (queryLower.includes('tiktok')) {
      filteredCreators = filteredCreators.filter(c =>
        c.networks.some(n => n.toLowerCase().includes('tiktok'))
      );
      console.log(`[${requestId}] Filtered for TikTok creators: ${filteredCreators.length} results`);
    }

    if (queryLower.includes('instagram') || queryLower.includes('insta')) {
      filteredCreators = filteredCreators.filter(c =>
        c.networks.some(n => n.toLowerCase().includes('instagram'))
      );
      console.log(`[${requestId}] Filtered for Instagram creators: ${filteredCreators.length} results`);
    }

    if (queryLower.includes('youtube') || queryLower.includes('yt')) {
      filteredCreators = filteredCreators.filter(c =>
        c.networks.some(n => n.toLowerCase().includes('youtube'))
      );
      console.log(`[${requestId}] Filtered for YouTube creators: ${filteredCreators.length} results`);
    }

    // Sort by total reach (highest first)
    filteredCreators.sort((a, b) => b.totalReach - a.totalReach);

    // Generate reasoning based on the improved filtering logic
    let reasoning = `Für die Suche "${query}" haben wir ${filteredCreators.length} passende UGC Creator gefunden.`;

    if (hasMaleKeywords) {
      reasoning += ' Wir haben speziell nach männlichen Creatorn gefiltert (explizite Geschlechtsangabe).';
    } else if (hasFemaleKeywords) {
      reasoning += ' Wir haben speziell nach weiblichen Creatorn gefiltert (explizite Geschlechtsangabe).';
    } else if (hasBeautyKeywords) {
      reasoning += ' Da es sich um Beauty/Kosmetik handelt und kein spezifisches Geschlecht angegeben wurde, haben wir hauptsächlich weibliche Creator ausgewählt.';
    }

    if (queryLower.includes('tiktok')) {
      reasoning += ' Alle Ergebnisse sind auf TikTok aktiv.';
    }
    if (queryLower.includes('instagram')) {
      reasoning += ' Alle Ergebnisse sind auf Instagram aktiv.';
    }
    if (queryLower.includes('youtube')) {
      reasoning += ' Alle Ergebnisse sind auf YouTube aktiv.';
    }

    reasoning += ' Die Creator sind nach Reichweite sortiert.';

    console.log(`[${requestId}] Returning ${filteredCreators.length} creators`);

    return NextResponse.json({
      success: true,
      creators: filteredCreators,
      query: query,
      reasoning: reasoning,
      totalCount: filteredCreators.length,
      isDemo: true,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - parseInt(requestId)
    });

  } catch (error: any) {
    console.error(`[${requestId}] Simple search error:`, error);

    return NextResponse.json({
      success: false,
      error: 'Search failed',
      message: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      requestId: requestId
    }, {
      status: 500
    });
  }
}

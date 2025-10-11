import { NextResponse } from 'next/server';
import { getProfileImage } from '@/utils/profileImage';

export const maxDuration = 60; // Allow up to 60 seconds for image fetching
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const requestId = Date.now().toString();
  
  try {
    const body = await req.json();
    const { creatorId, socialLinks, gender } = body;
    
    if (!socialLinks) {
      return NextResponse.json({
        success: false,
        error: 'Missing socialLinks parameter'
      }, { status: 400 });
    }
    
    console.log(`[${requestId}] Fetching profile image for creator ${creatorId}`);
    
    // Fetch the profile image using existing utility
    const imageUrl = await getProfileImage(socialLinks, gender);
    
    console.log(`[${requestId}] Profile image fetched: ${imageUrl}`);
    
    return NextResponse.json({
      success: true,
      creatorId,
      imageUrl,
      isPlaceholder: imageUrl.includes('placeholder')
    });
    
  } catch (error) {
    console.error(`[${requestId}] Error fetching creator image:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch image',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

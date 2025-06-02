import { NextRequest, NextResponse } from 'next/server';
import { wordpressAPI } from '../../../lib/wordpress-api';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('Retrieving WordPress categories...');
    
    const result = await wordpressAPI.getCategories();
    
    if (!result.success) {
      console.error('WordPress categories retrieval failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to retrieve WordPress categories',
          details: result.data
        },
        { status: result.status || 500 }
      );
    }

    console.log(`Retrieved ${result.data?.length || 0} WordPress categories`);

    return NextResponse.json({
      success: true,
      data: result.data,
      count: result.data?.length || 0
    });

  } catch (error) {
    console.error('WordPress categories API error:', error);
    
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

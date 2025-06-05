import { NextRequest, NextResponse } from 'next/server';
import { getLastSyncTime, getPendingSyncTime } from '../../../lib/blog-sync';

export const dynamic = 'force-dynamic'; // Ensure this API route is dynamic

export async function GET(request: NextRequest) {
  try {
    const lastSyncTime = getLastSyncTime();
    const pendingSyncTime = getPendingSyncTime();

    return NextResponse.json({
      success: true,
      lastSyncTime: lastSyncTime > 0 ? new Date(lastSyncTime).toISOString() : null,
      pendingSyncTime: pendingSyncTime !== undefined ? new Date(pendingSyncTime).toISOString() : null,
      message: 'Blog sync status retrieved successfully.'
    });
  } catch (error) {
    console.error('Error fetching blog sync status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve blog sync status',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

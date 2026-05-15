import { NextResponse } from 'next/server';
import { ugcVzAgentCard } from '@/app/lib/a2a-agent-card';

export async function GET() {
  return NextResponse.json(ugcVzAgentCard, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Robots-Tag': 'index, follow',
    },
  });
}

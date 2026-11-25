import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { restRateLimit } from '@/app/lib/rest-v1';
import type { SearchCreator } from '@/app/lib/creator-public';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** A small public preview. No search model, private contacts, or mail calls. */
export async function GET(request: NextRequest) {
  const { limited, headers } = restRateLimit(request, 1);
  if (limited) return limited;
  if (!isDatabaseConfigured()) return NextResponse.json({ creators: [] }, { status: 503 });

  try {
    const sql = getDatabase();
    const rows = await sql.query(`
      SELECT public_id, display_name, city, topics,
             preferred_content, rate_text, reach_text,
             networks, contact_reachable
      FROM creator_search_public
      WHERE has_social_avatar = true
        AND NULLIF(TRIM(portfolio_links), '') IS NOT NULL
      ORDER BY contact_reachable DESC,
               profile_quality_score DESC NULLS LAST,
               (NULLIF(TRIM(rate_text), '') IS NOT NULL) DESC,
               public_id
      LIMIT 3
    `);
    // Explicit allowlist: never serialize a database row directly.
    const creators: SearchCreator[] = rows.map(row => ({
      id: String(row.public_id),
      name: String(row.display_name || 'Creator'),
      image: `/api/avatar/${row.public_id}`,
      city: String(row.city || ''),
      topics: String(row.topics || ''),
      preferredContent: String(row.preferred_content || ''),
      priceRange: String(row.rate_text || ''),
      reach: String(row.reach_text || ''),
      networks: Array.isArray(row.networks) ? row.networks.map(String) : [],
      contactReachable: Boolean(row.contact_reachable),
    }));
    return NextResponse.json({ creators }, { headers: { ...headers, 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Featured creators unavailable', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ creators: [] }, { status: 503 });
  }
}

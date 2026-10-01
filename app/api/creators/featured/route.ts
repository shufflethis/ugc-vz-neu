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
      SELECT p.public_id, p.display_name, p.city, p.topics,
             p.preferred_content, p.rate_text, p.reach_text,
             ARRAY(SELECT DISTINCT s.platform FROM creator_social_accounts s
                   WHERE s.creator_id = p.id ORDER BY s.platform) AS networks
      FROM creator_profiles p
      WHERE p.status = 'active'
        AND EXISTS (SELECT 1 FROM creator_social_avatars a WHERE a.creator_id = p.id AND a.image IS NOT NULL)
        AND EXISTS (SELECT 1 FROM creator_portfolio_items f WHERE f.creator_id = p.id AND f.url ~* '^https?://')
      ORDER BY p.profile_quality_score DESC NULLS LAST,
               (NULLIF(TRIM(p.rate_text), '') IS NOT NULL) DESC, p.public_id
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
    }));
    return NextResponse.json({ creators }, { headers: { ...headers, 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Featured creators unavailable', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ creators: [] }, { status: 503 });
  }
}

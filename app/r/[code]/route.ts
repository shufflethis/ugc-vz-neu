import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Affiliate-Redirect & Klick-Tracking:
 * GET /r/MIA-8F2A -> zaehlt Klick auf brand_campaign_applications.affiliate_clicks
 * und leitet per 302 mit sauberen UTM-Parametern zur Ziel-URL der Marke weiter.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { code: string } },
) {
  const code = String(params.code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (!code || code.length < 3 || code.length > 40 || !isDatabaseConfigured()) {
    return NextResponse.redirect('https://ugc-vz.de', 302);
  }

  try {
    const sql = getDatabase();
    const rows = (await sql.query(
      `UPDATE brand_campaign_applications a
       SET affiliate_clicks = a.affiliate_clicks + 1,
           updated_at = now()
       FROM brand_campaigns c
       WHERE a.campaign_id = c.id
         AND UPPER(a.affiliate_code) = $1
         AND c.affiliate_enabled = true
         AND c.status IN ('active', 'paused')
       RETURNING c.public_id, c.affiliate_target_url, a.affiliate_code`,
      [code],
    )) as unknown as Array<any>;

    const targetRaw = String(rows[0]?.affiliate_target_url || '').trim();
    if (!targetRaw) {
      return NextResponse.redirect('https://ugc-vz.de', 302);
    }

    const parsed = new URL(/^https?:\/\//i.test(targetRaw) ? targetRaw : `https://${targetRaw}`);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.redirect('https://ugc-vz.de', 302);
    }

    if (!parsed.searchParams.has('utm_source')) parsed.searchParams.set('utm_source', 'ugcvz');
    if (!parsed.searchParams.has('utm_medium')) parsed.searchParams.set('utm_medium', 'creator_affiliate');
    if (!parsed.searchParams.has('utm_campaign')) parsed.searchParams.set('utm_campaign', String(rows[0].public_id || ''));
    if (!parsed.searchParams.has('utm_content')) parsed.searchParams.set('utm_content', String(rows[0].affiliate_code || code));

    return NextResponse.redirect(parsed.toString(), {
      status: 302,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('Affiliate redirect error:', err instanceof Error ? err.message : 'unknown');
    return NextResponse.redirect('https://ugc-vz.de', 302);
  }
}

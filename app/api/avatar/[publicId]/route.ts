// Liefert das automatisch geholte Social-Profilbild eines Creators von der
// eigenen Domain aus (CSP 'self', keine ablaufenden Instagram-CDN-Links).
// Befuellt wird creator_social_avatars durch scripts/fetch-social-avatars.mjs
// (VPS-Cron) und best-effort beim Speichern (app/lib/social-avatar.ts).
import { NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { publicId: string } }) {
  const publicId = String(params.publicId || '');
  if (!/^UGC-[A-Z0-9]{6,20}$/.test(publicId) || !isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const sql = getDatabase();
    const [row] = await sql.query(
      `SELECT a.image, a.content_type
       FROM creator_social_avatars a
       JOIN creator_profiles p ON p.id = a.creator_id
       WHERE p.public_id = $1 AND p.status = 'active' AND a.image IS NOT NULL
       LIMIT 1`,
      [publicId],
    );

    if (!row?.image) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'public, max-age=300' } });
    }

    const bytes = Buffer.isBuffer(row.image) ? row.image : Buffer.from(row.image);
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': row.content_type || 'image/jpeg',
        'Content-Length': String(bytes.length),
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Avatar delivery failed', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Unavailable' }, { status: 503 });
  }
}

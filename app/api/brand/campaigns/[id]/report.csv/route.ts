import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { BRAND_SESSION_COOKIE, verifyBrandSession } from '@/app/lib/brand-session';
import { buildCampaignReportCsv, cleanText, getBrandCampaignDetail } from '@/app/lib/brand-workspace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const brandId = verifyBrandSession(request.cookies.get(BRAND_SESSION_COOKIE)?.value);
  if (!brandId) return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ success: false, error: 'Datenbank nicht verfügbar.' }, { status: 503 });

  const publicId = cleanText(params.id, 30);
  const detail = await getBrandCampaignDetail(getDatabase(), brandId, publicId);
  if (!detail) return NextResponse.json({ success: false, error: 'Kampagne nicht gefunden.' }, { status: 404 });

  const csv = buildCampaignReportCsv(detail);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="ugc-vz-report-${publicId.toLowerCase()}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
}

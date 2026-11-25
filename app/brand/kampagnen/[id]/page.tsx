import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { BRAND_SESSION_COOKIE, verifyBrandSession } from '@/app/lib/brand-session';
import { getBrandCampaignDetail } from '@/app/lib/brand-workspace';
import CampaignDetailClient from './CampaignDetailClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Kampagne & Performance-Reporting',
  robots: { index: false, follow: false },
};

export default async function BrandCampaignDetailPage({ params }: { params: { id: string } }) {
  const token = cookies().get(BRAND_SESSION_COOKIE)?.value;
  const brandId = verifyBrandSession(token);
  if (!brandId) redirect('/brand');
  if (!isDatabaseConfigured()) redirect('/brand');

  const detail = await getBrandCampaignDetail(getDatabase(), brandId, params.id);
  if (!detail) {
    return (
      <div className="min-h-screen bg-white px-4 py-20 text-center text-ink">
        <h1 className="text-2xl font-bold">Kampagne nicht gefunden</h1>
        <p className="mt-2 text-sm text-ink-soft">Diese Kampagne gehört nicht zu diesem Brand-Konto oder existiert nicht.</p>
        <Link href="/brand" className="mt-6 inline-flex rounded-full bg-geo-violet px-6 py-3 text-sm font-semibold text-white">
          Zurück zum Brand-Workspace
        </Link>
      </div>
    );
  }

  return <CampaignDetailClient initialDetail={detail} />;
}

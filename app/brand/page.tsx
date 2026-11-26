import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { BRAND_SESSION_COOKIE, verifyBrandSession } from '@/app/lib/brand-session';
import { getBrandAccount, listBrandCampaigns } from '@/app/lib/brand-workspace';
import BrandWorkspaceClient from './BrandWorkspaceClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Marken-Login',
  description: 'Melde dich in deinem UGC VZ Marken-Konto an oder lege ein Konto für deine nächste Kampagne an.',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://ugc-vz.de/brands' },
};

export default async function BrandWorkspacePage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const initialTab = searchParams?.tab === 'signup' ? 'signup' : 'login';
  const token = cookies().get(BRAND_SESSION_COOKIE)?.value;
  const brandId = verifyBrandSession(token);

  if (!brandId || !isDatabaseConfigured()) {
    return <BrandWorkspaceClient brand={null} initialCampaigns={[]} initialTab={initialTab} />;
  }

  try {
    const sql = getDatabase();
    const brand = await getBrandAccount(sql, brandId);
    if (!brand) return <BrandWorkspaceClient brand={null} initialCampaigns={[]} initialTab={initialTab} />;
    const campaigns = await listBrandCampaigns(sql, brand.id);
    return <BrandWorkspaceClient brand={brand} initialCampaigns={campaigns} initialTab={initialTab} />;
  } catch {
    return <BrandWorkspaceClient brand={null} initialCampaigns={[]} initialTab={initialTab} />;
  }
}

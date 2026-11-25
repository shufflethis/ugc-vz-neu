import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { BRAND_SESSION_COOKIE, verifyBrandSession } from '@/app/lib/brand-session';
import { getBrandAccount, listBrandCampaigns } from '@/app/lib/brand-workspace';
import BrandWorkspaceClient from './BrandWorkspaceClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Brand-Workspace & Kampagnen',
  description: 'Kampagnen ausschreiben, Creator auswählen, Content freigeben und Performance tracken im kostenlosen UGC-VZ Brand-Workspace.',
  robots: { index: false, follow: false },
};

export default async function BrandWorkspacePage() {
  const token = cookies().get(BRAND_SESSION_COOKIE)?.value;
  const brandId = verifyBrandSession(token);

  if (!brandId || !isDatabaseConfigured()) {
    return <BrandWorkspaceClient brand={null} initialCampaigns={[]} />;
  }

  try {
    const sql = getDatabase();
    const brand = await getBrandAccount(sql, brandId);
    if (!brand) return <BrandWorkspaceClient brand={null} initialCampaigns={[]} />;
    const campaigns = await listBrandCampaigns(sql, brand.id);
    return <BrandWorkspaceClient brand={brand} initialCampaigns={campaigns} />;
  } catch {
    return <BrandWorkspaceClient brand={null} initialCampaigns={[]} />;
  }
}

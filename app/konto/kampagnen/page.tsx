import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import {
  listCreatorCampaigns,
  listCreatorSocialConnections,
  type CreatorCampaignItem,
  type CreatorSocialConnection,
} from '@/app/lib/brand-workspace';
import CreatorCampaignsClient from './CreatorCampaignsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Brand-Kampagnen & Ausschreibungen',
  description: 'Einladungen annehmen, auf offene Brand-Kampagnen bewerben und fertige UGC-Clips zur Auswertung einreichen.',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://ugc-vz.de/konto/kampagnen' },
};

export default async function CreatorCampaignsPage() {
  const token = cookies().get(CREATOR_SESSION_COOKIE)?.value;
  const creatorId = verifySession(token);
  if (!creatorId) {
    redirect('/konto');
  }

  let myCampaigns: CreatorCampaignItem[] = [];
  let openCampaigns: CreatorCampaignItem[] = [];
  let socialConnections: CreatorSocialConnection[] = [];
  let unavailable = false;

  if (isDatabaseConfigured()) {
    try {
      const sql = getDatabase();
      const [campaigns, socials] = await Promise.all([
        listCreatorCampaigns(sql, creatorId),
        listCreatorSocialConnections(sql, creatorId),
      ]);
      myCampaigns = campaigns.myCampaigns;
      openCampaigns = campaigns.openCampaigns;
      socialConnections = socials;
    } catch {
      unavailable = true;
    }
  } else {
    unavailable = true;
  }

  return (
    <CreatorCampaignsClient
      initialMyCampaigns={myCampaigns}
      initialOpenCampaigns={openCampaigns}
      hasVerifiedSocial={socialConnections.some((s) => Boolean(s.verifiedAt))}
      unavailable={unavailable}
    />
  );
}

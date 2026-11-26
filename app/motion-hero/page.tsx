import type { Metadata } from 'next';
import EditorialMotionHero from '../components/home/EditorialMotionHero';
import TrustElements from '../components/TrustElements';
import QuickBriefCard from '../components/home/QuickBriefCard';
import CampaignHowTabs from '../components/home/CampaignHowTabs';
import VerificationProofSection from '../components/home/VerificationProofSection';
import FloFounderCard from '../components/home/FloFounderCard';
import { getHomepageLiveStats } from '../lib/homepage-stats';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Editorial Motion Hero Vorschau | UGC VZ',
  description: 'Interne Vorschau des Orla-inspirierten Editorial Motion Heroes für UGC VZ.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function MotionHeroPreviewPage() {
  const stats = await getHomepageLiveStats();

  return (
    <div className="home-page min-h-screen bg-white text-[#202124]">
      <EditorialMotionHero
        stats={{
          liveCreatorCount: stats.liveCreatorCount,
          heroCampaign: stats.heroCampaign,
        }}
        showUpgradeGuideBar
      />
      <TrustElements compact />
      <QuickBriefCard />
      <CampaignHowTabs />
      <VerificationProofSection />
      <FloFounderCard />
    </div>
  );
}

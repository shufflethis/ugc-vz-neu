import type { Metadata } from 'next';
import WissenListingPage from './WissenListingPage';

export const metadata: Metadata = {
  title: 'Creator-Wissen, Tipps & Strategien',
  description: 'Fundierte UGC-Guides für Creator, Brands und Marketing-Teams: Strategie, Preise, Briefing, Rechte und Kampagnenpraxis.',
  alternates: { canonical: 'https://ugc-vz.de/wissen' },
  openGraph: {
    title: 'Creator-Wissen, Tipps & Strategien',
    description: 'Fundierte Guides und Strategien rund um User Generated Content.',
    type: 'website',
    url: 'https://ugc-vz.de/wissen',
    images: [{
      url: 'https://ugc-vz.de/og-image-wissen.jpg',
      width: 1200,
      height: 630,
      alt: 'UGC VZ Wissen',
    }],
  },
};

export default function WissenPage() {
  return <WissenListingPage page={1} />;
}

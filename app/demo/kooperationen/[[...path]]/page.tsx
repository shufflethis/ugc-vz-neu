import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { authorizeCollabDemo } from '@/app/lib/collab-demo-auth';
import { campaigns, candidates, slides } from '../data';
import DemoWorkspace from '../DemoWorkspace';
import { fomoVariant } from '../../../components/FomoBriefing';
import '../demo.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata: Metadata = {
  title: 'Kooperationen · Private Vorschau',
  description: 'Geschützter Entwurf zur internen Abstimmung.',
  robots: { index: false, follow: false, noarchive: true, googleBot: { index: false, follow: false, noimageindex: true } },
  alternates: { canonical: null, languages: {} },
  openGraph: { title: 'UGC VZ · Private Vorschau', description: 'Geschützter Entwurf zur internen Abstimmung.', url: undefined, images: [] },
  twitter: { title: 'UGC VZ · Private Vorschau', description: 'Geschützter Entwurf.', images: [] },
};

export default async function CollaborationDemo({ params, searchParams }: { params: { path?: string[] }; searchParams: { fuer?: string } }) {
  // Defense in depth: authenticate the page itself, even if middleware is bypassed.
  if (!await authorizeCollabDemo(headers().get('authorization'))) notFound();
  const path = params.path || [];
  const campaign = campaigns.find(item => item.slug === path[0] && !item.fictional);
  const view = path[0] === 'konto' && path.length === 1 ? 'account' : path[0] === 'einladung' && path.length === 1 ? 'invitation' : !path.length ? 'overview' : path[0] === 'tracking' && path.length === 1 ? 'tracking'
    : path[0] === 'praesentation' && path.length === 1 ? 'presentation'
      : campaign && path.length === 1 ? 'campaign'
        : campaign && path.length === 2 && ['start', 'bewerben'].includes(path[1]) ? 'apply'
          : campaign && path.length === 2 && path[1] === 'guide' ? 'guide' : null;
  if (!view) notFound();
  return <DemoWorkspace key={path.join('/') || 'overview'} view={view} campaigns={view === 'overview' ? campaigns : campaigns.filter(c => !c.fictional)} campaign={campaign} candidates={view === 'tracking' ? candidates.filter(c => campaigns.some(campaign => campaign.slug === c.campaign && !campaign.fictional)) : []} slides={view === 'presentation' ? slides : []} variant={fomoVariant(searchParams.fuer)} />;
}

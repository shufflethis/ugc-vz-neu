import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import NichePage, { loadNicheData } from '@/app/components/NichePage';
import { nicheBySlug, nichePath } from '@/app/lib/niches';
import { pageMetadata } from '@/utils/seo-metadata';

export const dynamic = 'force-dynamic';

// Unter ~20 passenden Profilen waere die Seite zu duenn: noindex.
const MIN_INDEXABLE = 20;

export async function generateMetadata({ params }: { params: { nische: string } }): Promise<Metadata> {
  const niche = nicheBySlug(params.nische);
  if (!niche) return {};
  const { stats } = await loadNicheData(niche);
  return {
    ...pageMetadata({ path: nichePath(niche), title: niche.title, description: niche.description }),
    ...(stats.count < MIN_INDEXABLE ? { robots: { index: false, follow: true } } : {}),
  };
}

export default function NicheRoute({ params }: { params: { nische: string } }) {
  const niche = nicheBySlug(params.nische);
  if (!niche) notFound();
  // Beauty lebt unter dem bestehenden Pfad weiter, kein Duplikat.
  if (niche.path) permanentRedirect(niche.path);
  return <NichePage niche={niche} />;
}

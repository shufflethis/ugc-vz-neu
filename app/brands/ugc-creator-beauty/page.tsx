import type { Metadata } from 'next';
import NichePage from '@/app/components/NichePage';
import { nicheBySlug, nichePath } from '@/app/lib/niches';
import { pageMetadata } from '@/utils/seo-metadata';

export const dynamic = 'force-dynamic';

const niche = nicheBySlug('beauty')!;

export const metadata: Metadata = pageMetadata({ path: nichePath(niche), title: niche.title, description: niche.description });

export default function UGCCreatorBeautyPage() {
  return <NichePage niche={niche} />;
}

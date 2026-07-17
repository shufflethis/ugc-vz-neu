import type { Metadata } from 'next';
import { getPageCount } from '@/app/lib/content-repository';
import WissenListingPage from '../../WissenListingPage';

export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: Math.max(0, getPageCount() - 1) }, (_, index) => ({ page: String(index + 2) }));
}

export function generateMetadata({ params }: { params: { page: string } }): Metadata {
  const page = Number(params.page);
  return {
    title: `Creator-Wissen, Tipps & Strategien, Seite ${page}`,
    description: `UGC-Guides für Creator, Brands und Marketing-Teams, Seite ${page}.`,
    alternates: { canonical: `https://ugc-vz.de/wissen/seite/${page}` },
    robots: Number.isInteger(page) && page >= 2 && page <= getPageCount() ? undefined : { index: false, follow: false },
  };
}

export default function WissenPaginationPage({ params }: { params: { page: string } }) {
  return <WissenListingPage page={Number(params.page)} />;
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import ResponsiveCTAButton from '@/src/components/ResponsiveCTAButton';
import LogoImage from '../components/LogoImage';
import PreferredSourceBadge from '../components/PreferredSourceBadge';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import JsonLdScript from './[slug]/JsonLdScript';
import ClientWissenContent from './ClientWissenContent';
import {
  absoluteContentUrl,
  getAuthor,
  getPageCount,
  getPostsPage,
} from '../lib/content-repository';

function pageHref(page: number) {
  return page === 1 ? '/wissen' : `/wissen/seite/${page}`;
}

export default function WissenListingPage({ page }: { page: number }) {
  const pageCount = getPageCount();
  if (!Number.isInteger(page) || page < 1 || page > pageCount) notFound();
  const summaries = getPostsPage(page);
  const posts = summaries.map((post) => ({ ...post, authorName: getAuthor(post.authorId).name }));
  const firstPosition = (page - 1) * 30;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: posts.length,
    itemListElement: posts.map((post, index) => ({
      '@type': 'ListItem',
      position: firstPosition + index + 1,
      url: `https://ugc-vz.de/wissen/${post.slug}`,
      name: post.title,
      image: absoluteContentUrl(post.featuredImage),
    })),
  };

  return (
    <div className="min-h-screen bg-white text-ink">
      <JsonLdScript data={schema} />
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://ugc-vz.de' },
        { name: 'Wissen', url: 'https://ugc-vz.de/wissen' },
        ...(page > 1 ? [{ name: `Seite ${page}`, url: `https://ugc-vz.de${pageHref(page)}` }] : []),
      ]} />

      <header className="py-6 px-4 sm:px-8 md:px-16 lg:px-24">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <LogoImage width={32} height={32} className="mr-2" priority />
            <span className="text-xl font-bold gradient-text">UGC VZ</span>
          </Link>
          <ResponsiveCTAButton />
        </div>
      </header>

      <main className="px-4 sm:px-8 md:px-16 lg:px-24 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              <span className="gradient-text">Wissen</span> für UGC Creators
            </h1>
            <p className="text-xl text-ink-soft max-w-3xl mx-auto leading-relaxed">
              Fundierte Guides für Creator, Brands und Marketing-Teams. Von Strategie und Preisen bis zu Briefing, Rechten und Kampagnenpraxis.
            </p>
            {page > 1 && <p className="mt-4 text-sm text-ink-soft">Seite {page} von {pageCount}</p>}
            <div className="mt-8 flex justify-center">
              <PreferredSourceBadge variant="dark" />
            </div>
          </div>

          <ClientWissenContent posts={posts} />

          {pageCount > 1 && (
            <nav aria-label="Seitennavigation Wissen" className="mt-12 flex flex-wrap justify-center gap-2">
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                <Link
                  key={number}
                  href={pageHref(number)}
                  aria-current={number === page ? 'page' : undefined}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold ${number === page ? 'border-geo-violet bg-geo-violet text-white' : 'border-hairline text-ink hover:border-geo-violet'}`}
                >
                  {number}
                </Link>
              ))}
            </nav>
          )}

          <section className="mt-20 grid md:grid-cols-2 gap-6">
            <Link href="/brands" className="surface-card rounded-lg p-6 hover:border-geo-violet transition-colors">
              <h2 className="text-2xl font-bold text-geo-violet mb-3">UGC Creator finden</h2>
              <p className="text-ink-soft leading-relaxed">Demand eingeben, passende Creator ansehen und kostenlos Kontaktinformationen anfordern.</p>
            </Link>
            <Link href="/creator" className="surface-card rounded-lg p-6 hover:border-geo-violet transition-colors">
              <h2 className="text-2xl font-bold text-geo-violet mb-3">Als UGC Creator anmelden</h2>
              <p className="text-ink-soft leading-relaxed">Kostenlos Profil, Portfolio, Themen, Preise und Social-Links hinterlegen.</p>
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}

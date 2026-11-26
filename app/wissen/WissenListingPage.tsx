import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-white text-[#202124]">
      <JsonLdScript data={schema} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://ugc-vz.de' },
          { name: 'Wissen', url: 'https://ugc-vz.de/wissen' },
          ...(page > 1 ? [{ name: `Seite ${page}`, url: `https://ugc-vz.de${pageHref(page)}` }] : []),
        ]}
      />

      <section className="bg-[#F5F7FA] px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-sm font-medium text-[#06458F]">Ratgeber &amp; Praxiswissen</p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight tracking-[-0.02em] sm:text-5xl">
            Wissen rund um Creator-Kampagnen
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#5C6470] sm:text-lg">
            Praxisnahe Guides für Marken und Creator zu View-Kampagnen, Preisen, Verträgen, Rechten und Briefings.
          </p>
          {page > 1 && (
            <p className="mt-3 text-sm font-medium text-[#5C6470]">
              Seite {page} von {pageCount}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8 sm:py-16">
        <ClientWissenContent posts={posts} />

        {pageCount > 1 && (
          <nav aria-label="Seitennavigation Wissen" className="mt-12 flex flex-wrap justify-center gap-2">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
              <Link
                key={number}
                href={pageHref(number)}
                aria-current={number === page ? 'page' : undefined}
                className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border px-4 text-sm font-semibold transition-colors ${
                  number === page
                    ? 'border-[#06458F] bg-[#06458F] text-white'
                    : 'border-[#DCE2EA] bg-white text-[#202124] hover:border-[#06458F]'
                }`}
              >
                {number}
              </Link>
            ))}
          </nav>
        )}

        <section className="mt-16 grid gap-6 md:grid-cols-2">
          <Link
            href="/brands"
            className="group rounded-[20px] border border-[#DCE2EA] bg-[#F5F7FA] p-7 transition-colors hover:border-[#06458F]"
          >
            <h2 className="font-display text-2xl font-bold text-[#202124]">Für Marken</h2>
            <p className="mt-2 text-sm leading-6 text-[#5C6470]">
              Starte Creator-Kampagnen nach geprüften Views mit fester Budget-Obergrenze und ohne Abo.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#202124] group-hover:text-[#06458F]">
              <span>Mehr erfahren</span>
              <ArrowRight size={15} aria-hidden="true" />
            </span>
          </Link>
          <Link
            href="/creator"
            className="group rounded-[20px] border border-[#DCE2EA] bg-[#F5F7FA] p-7 transition-colors hover:border-[#06458F]"
          >
            <h2 className="font-display text-2xl font-bold text-[#202124]">Für Creator</h2>
            <p className="mt-2 text-sm leading-6 text-[#5C6470]">
              Suche dir passende Kampagnen aus, poste auf deinem Profil und verdiene pro 1.000 Views bei 0 % Gebühr.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#202124] group-hover:text-[#06458F]">
              <span>Kostenlos mitmachen</span>
              <ArrowRight size={15} aria-hidden="true" />
            </span>
          </Link>
        </section>
      </div>
    </div>
  );
}

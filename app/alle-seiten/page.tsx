import type { Metadata } from 'next';
import Link from 'next/link';
import { NICHE_INDEX, nichePath } from '@/app/lib/niche-index';
import { SUFFIX, getPageCompetitors } from '@/app/lib/competitors';
import { getPublishedPosts } from '@/app/lib/content-repository';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Alle Seiten im Überblick',
  description:
    'Übersicht aller Seiten von UGC VZ: Kampagnen für Marken, Creator-Einstieg, Branchen, Plattform-Vergleiche, Rechner und Wissensartikel.',
  alternates: {
    canonical: 'https://ugc-vz.de/alle-seiten',
  },
};

const CORE_BRAND_LINKS = [
  { href: '/brands', label: 'UGC VZ für Marken' },
  { href: '/preise', label: 'Preise & Konditionen' },
  { href: '/brands/ugc-creator-finden', label: 'Creator-Pool durchsuchen' },
  { href: '/brands/ugc-kosten-rechner', label: 'UGC Kosten Rechner' },
  { href: '/brands/ugc-creator-preise', label: 'UGC Creator Preise in DACH' },
  { href: '/brands/ugc-vertrag-vorlage', label: 'UGC Vertragsvorlage & Generator' },
  { href: '/brands/ugc-creator-deutschland', label: 'UGC Creator in Deutschland' },
  { href: '/brands/ugc-plattform-deutschland', label: 'UGC Plattform Deutschland' },
  { href: '/brands/ugc-agentur-berlin', label: 'UGC Agentur Berlin' },
  { href: '/brands/ugc-agentur-hamburg', label: 'UGC Agentur Hamburg' },
  { href: '/brands/ugc-agentur-muenchen', label: 'UGC Agentur München' },
];

const CORE_CREATOR_LINKS = [
  { href: '/creator', label: 'Für Creator & Kampagnen' },
  { href: '/creator/ugc-creator-werden', label: 'UGC Creator werden' },
  { href: '/creator/ugc-creator-jobs', label: 'UGC Creator Jobs & Aufträge' },
  { href: '/konto', label: 'Creator-Login' },
];

const COMPANY_LINKS = [
  { href: '/about', label: 'Über UGC VZ' },
  { href: '/faq', label: 'Häufige Fragen (FAQ)' },
  { href: '/contact', label: 'Kontakt' },
  { href: '/developers', label: 'API, MCP & KI-Agenten' },
  { href: '/brandkit', label: 'Brand Kit' },
  { href: '/impressum', label: 'Impressum' },
  { href: '/datenschutz', label: 'Datenschutz' },
  { href: '/agb', label: 'AGB' },
  { href: '/cookies', label: 'Cookie-Hinweise' },
];

export default function AllPagesSitemapPage() {
  const competitors = getPageCompetitors();
  const posts = getPublishedPosts();

  return (
    <div className="min-h-screen bg-[#F7F6F2] px-5 py-16 text-[#121212] sm:px-8 sm:py-24">
      <div className="mx-auto max-w-[1200px]">
        <header className="max-w-2xl">
          <p className="text-sm font-medium text-[#5C5A55]">Seitenverzeichnis</p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight tracking-[-0.02em] sm:text-5xl">
            Alle Seiten auf UGC VZ
          </h1>
          <p className="mt-4 text-base leading-7 text-[#5C5A55]">
            Alle wichtigen Einstiege für Marken, Creator, Branchen, Vergleiche und Wissensartikel auf einen Blick.
          </p>
        </header>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <section className="rounded-[20px] border border-[#E4E1D8] bg-white p-6 shadow-card">
            <h2 className="font-display text-xl font-bold">Für Marken &amp; Tools</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {CORE_BRAND_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[#121212] underline decoration-[#E4E1D8] underline-offset-4 hover:decoration-[#6C2BD9]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section id="branchen" className="scroll-mt-24 rounded-[20px] border border-[#E4E1D8] bg-white p-6 shadow-card">
            <h2 className="font-display text-xl font-bold">Creator nach Branche</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {NICHE_INDEX.map((niche) => (
                <li key={niche.slug}>
                  <Link
                    href={nichePath(niche)}
                    className="text-[#121212] underline decoration-[#E4E1D8] underline-offset-4 hover:decoration-[#6C2BD9]"
                  >
                    {niche.chip}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[20px] border border-[#E4E1D8] bg-white p-6 shadow-card">
            <h2 className="font-display text-xl font-bold">Plattform-Vergleiche</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/vergleich" className="font-semibold text-[#121212] underline decoration-[#E4E1D8] underline-offset-4 hover:decoration-[#6C2BD9]">
                  Alle Plattformen im Vergleich
                </Link>
              </li>
              {competitors.map((comp) => (
                <li key={comp.slug}>
                  <Link
                    href={`/vergleich/${comp.slug}${SUFFIX}`}
                    className="text-[#121212] underline decoration-[#E4E1D8] underline-offset-4 hover:decoration-[#6C2BD9]"
                  >
                    {comp.name} Alternative
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[20px] border border-[#E4E1D8] bg-white p-6 shadow-card">
            <h2 className="font-display text-xl font-bold">Für Creator</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {CORE_CREATOR_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[#121212] underline decoration-[#E4E1D8] underline-offset-4 hover:decoration-[#6C2BD9]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[20px] border border-[#E4E1D8] bg-white p-6 shadow-card">
            <h2 className="font-display text-xl font-bold">Unternehmen &amp; Rechtliches</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {COMPANY_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[#121212] underline decoration-[#E4E1D8] underline-offset-4 hover:decoration-[#6C2BD9]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[20px] border border-[#E4E1D8] bg-white p-6 shadow-card">
            <h2 className="font-display text-xl font-bold">Wissen &amp; Ratgeber</h2>
            <p className="mt-2 text-xs text-[#5C5A55]">
              {posts.length} veröffentlichte Artikel rund um UGC, Preise, Verträge und Kampagnen.
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/wissen" className="font-semibold text-[#121212] underline decoration-[#E4E1D8] underline-offset-4 hover:decoration-[#6C2BD9]">
                  Alle Wissensartikel ansehen
                </Link>
              </li>
              {posts.slice(0, 12).map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/wissen/${post.slug}`}
                    className="text-[#121212] underline decoration-[#E4E1D8] underline-offset-4 hover:decoration-[#6C2BD9]"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

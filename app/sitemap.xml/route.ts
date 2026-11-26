import { statSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getPageCount, getPublishedPosts } from '@/app/lib/content-repository';
import { SUFFIX, getPageCompetitors } from '@/app/lib/competitors';
import { NICHES, nichePath } from '@/app/lib/niches';

const baseUrl = 'https://ugc-vz.de';
const vergleichPages = getPageCompetitors().map((c) => `/vergleich/${c.slug}${SUFFIX}`);
const nichePages = NICHES.map(nichePath);

const staticPages = [
  '',
  '/brands',
  '/preise',
  '/creator',
  '/faq',
  '/wissen',
  '/about',
  '/agb',
  '/brandkit',
  '/contact',
  '/cookies',
  '/datenschutz',
  '/developers',
  '/impressum',
  '/privacy',
  '/creator/ugc-creator-werden',
  '/creator/ugc-creator-jobs',
  '/brands/ugc-creator-finden',
  '/brands/ugc-creator-preise',
  '/brands/ugc-kosten-rechner',
  '/brands/ugc-creator-deutschland',
  ...nichePages,
  '/brands/ugc-plattform-deutschland',
  '/brands/ugc-agentur-berlin',
  '/brands/ugc-agentur-hamburg',
  '/brands/ugc-agentur-muenchen',
  '/brands/ugc-vertrag-vorlage',
  '/vergleich',
  ...vergleichPages,
];

function resolvePageLastMod(pathname: string, fallbackIso: string): string {
  const relCandidates: string[] = [];
  if (pathname === '') {
    relCandidates.push('app/page.tsx');
  } else if (pathname.startsWith('/brands/ugc-creator/') && pathname !== '/brands/ugc-creator-finden') {
    relCandidates.push('app/brands/ugc-creator/[nische]/page.tsx', 'app/lib/niches.ts');
  } else if (pathname.startsWith('/vergleich/')) {
    relCandidates.push('app/vergleich/[slug]/page.tsx', 'app/lib/competitors.ts');
  } else {
    relCandidates.push(`app${pathname}/page.tsx`);
  }

  let newestMs = 0;
  for (const rel of relCandidates) {
    try {
      const st = statSync(path.join(process.cwd(), rel));
      if (st.mtimeMs > newestMs) newestMs = st.mtimeMs;
    } catch {
      // ignore missing path at runtime
    }
  }
  return newestMs > 0 ? new Date(newestMs).toISOString() : fallbackIso;
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const posts = getPublishedPosts();
  const paginationPages = Array.from(
    { length: Math.max(0, getPageCount() - 1) },
    (_, index) => `/wissen/seite/${index + 2}`,
  );
  const latestContentChange = posts.reduce(
    (latest, post) => (post.modifiedAt > latest ? post.modifiedAt : latest),
    posts[0]?.modifiedAt || '2026-11-26T00:00:00Z',
  );

  const entries = [
    ...staticPages.map((pathname) => ({
      loc: `${baseUrl}${pathname}`,
      lastmod: resolvePageLastMod(pathname, latestContentChange),
      changefreq: pathname === '' || pathname === '/preise' ? 'weekly' : 'monthly',
      priority: pathname === '' ? '1.0' : pathname === '/brands' || pathname === '/preise' || pathname === '/creator' ? '0.9' : pathname === '/wissen' ? '0.8' : '0.7',
    })),
    ...paginationPages.map((pathname) => ({
      loc: `${baseUrl}${pathname}`,
      lastmod: latestContentChange,
      changefreq: 'monthly',
      priority: '0.6',
    })),
    ...posts.map((post) => ({
      loc: `${baseUrl}/wissen/${post.slug}`,
      lastmod: post.modifiedAt,
      changefreq: 'monthly',
      priority: '0.7',
    })),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${xmlEscape(entry.loc)}</loc>
    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

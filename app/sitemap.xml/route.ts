import { NextResponse } from 'next/server';
import { getPageCount, getPublishedPosts } from '@/app/lib/content-repository';
import { SUFFIX, getPageCompetitors } from '@/app/lib/competitors';

const baseUrl = 'https://ugc-vz.de';
// Detailseiten aus der Single Source of Truth ableiten, damit ein neues
// hasOwnPage: true automatisch in der Sitemap landet.
const vergleichPages = getPageCompetitors().map((c) => `/vergleich/${c.slug}${SUFFIX}`);
const staticPages = [
  '',
  '/about',
  '/agb',
  '/contact',
  '/cookies',
  '/datenschutz',
  '/developers',
  '/impressum',
  '/privacy',
  '/faq',
  '/wissen',
  '/creator',
  '/creator/ugc-creator-werden',
  '/creator/ugc-creator-jobs',
  '/brands',
  '/brands/ugc-creator-finden',
  '/brands/ugc-creator-preise',
  '/brands/ugc-creator-deutschland',
  '/brands/ugc-creator-beauty',
  '/brands/ugc-plattform-deutschland',
  '/brands/ugc-agentur-berlin',
  '/brands/ugc-agentur-hamburg',
  '/brands/ugc-agentur-muenchen',
  '/brands/ugc-vertrag-vorlage',
  '/vergleich',
  ...vergleichPages,
];

function xmlEscape(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export async function GET() {
  const posts = getPublishedPosts();
  const paginationPages = Array.from({ length: Math.max(0, getPageCount() - 1) }, (_, index) => `/wissen/seite/${index + 2}`);
  const latestContentChange = posts.reduce((latest, post) => post.modifiedAt > latest ? post.modifiedAt : latest, posts[0]?.modifiedAt || '2026-01-01T00:00:00Z');
  const entries = [
    ...staticPages.map((pathname) => ({
      loc: `${baseUrl}${pathname}`,
      lastmod: latestContentChange,
      changefreq: pathname === '' ? 'weekly' : 'monthly',
      priority: pathname === '' ? '1.0' : pathname === '/wissen' ? '0.9' : '0.8',
    })),
    ...paginationPages.map((pathname) => ({ loc: `${baseUrl}${pathname}`, lastmod: latestContentChange, changefreq: 'monthly', priority: '0.6' })),
    ...posts.map((post) => ({ loc: `${baseUrl}/wissen/${post.slug}`, lastmod: post.modifiedAt, changefreq: 'monthly', priority: '0.7' })),
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((entry) => `  <url>
    <loc>${xmlEscape(entry.loc)}</loc>
    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

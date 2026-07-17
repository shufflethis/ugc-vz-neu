import { NextResponse } from 'next/server';
import { getPublishedPosts } from '@/app/lib/content-repository';

export async function GET() {
  const baseUrl = 'https://ugc-vz.de';
  const lastModified = getPublishedPosts()
    .reduce((latest, post) => post.modifiedAt > latest ? post.modifiedAt : latest, '2026-07-17T00:00:00.000Z');
  
  // Sitemap-Index XML generieren
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${lastModified}</lastmod>
  </sitemap>
</sitemapindex>`;

  return new NextResponse(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}

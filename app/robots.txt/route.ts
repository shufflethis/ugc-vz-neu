import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = 'https://ugc-vz.de';
  
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap_index.xml
Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin areas
Disallow: /api/
Disallow: /_next/
Disallow: /admin/

# Allow important pages
Allow: /
Allow: /about
Allow: /wissen/
Allow: /agb
Allow: /datenschutz
Allow: /impressum
Allow: /cookies
Allow: /faq`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400'
    }
  });
}

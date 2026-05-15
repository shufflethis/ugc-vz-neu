import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = 'https://ugc-vz.de';
  
  // Statische Seiten
  const staticPages = [
    '',
    '/about',
    '/agb',
    '/cookies',
    '/datenschutz',
    '/impressum',
    '/faq',
    '/wissen',
    '/creator',
    '/brands'
  ];

  // Blog-Posts von der API abrufen
  let blogPosts: any[] = [];
  try {
    const blogResponse = await fetch(`${baseUrl}/api/blog`, {
      headers: {
        'User-Agent': 'UGC-VZ Sitemap Generator/1.0'
      }
    });
    
    if (blogResponse.ok) {
      const blogData = await blogResponse.json();
      if (blogData.success && blogData.posts) {
        blogPosts = blogData.posts;
      }
    }
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
  }

  // XML-Sitemap generieren
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
${blogPosts.map(post => `  <url>
    <loc>${baseUrl}/wissen/${post.slug}</loc>
    <lastmod>${post.date ? new Date(post.date).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=0, s-maxage=0, must-revalidate'
    }
  });
}

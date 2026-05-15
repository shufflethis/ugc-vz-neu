import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = 'https://ugc-vz.de';

  const robotsTxt = `User-agent: *
Allow: /

# LLM and AI Crawlers (Perplexity, GPT, Claude, Bing Copilot)
User-agent: PerplexityBot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: BingBot
Allow: /

User-agent: Google-Extended
Allow: /

# Standard Sitemaps
Sitemap: ${baseUrl}/sitemap_index.xml
Sitemap: ${baseUrl}/sitemap.xml

# LLM-optimized content (not a sitemap, but useful for AI crawlers)
# ${baseUrl}/llm.txt
# ${baseUrl}/llms.txt

# Allow static assets (CSS, JS, images)
Allow: /_next/static/
Allow: /_next/image

# Disallow admin areas and sensitive paths
Disallow: /api/
Disallow: /_next/webpack-hmr
Disallow: /admin/

# Explicitly allow important pages for all crawlers
Allow: /
Allow: /brands
Allow: /brands/
Allow: /creator
Allow: /creator/
Allow: /about
Allow: /wissen/
Allow: /agb
Allow: /datenschutz
Allow: /impressum
Allow: /cookies
Allow: /faq

# Crawl-delay for respectful crawling
Crawl-delay: 1`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400'
    }
  });
}

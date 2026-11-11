import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = 'https://ugc-vz.de';

  const sharedRules = [
    'Allow: /',
    'Allow: /api/avatar/',
    'Allow: /api/mcp',
    'Allow: /api/v1/',
    'Allow: /.well-known/',
    'Allow: /a2a',
    'Allow: /_next/static/',
    'Allow: /_next/image',
    'Disallow: /api/',
    'Disallow: /admin/',
    'Disallow: /konto/',
    'Disallow: /kooperationen/',
    'Disallow: /demo/',
    'Disallow: /_next/webpack-hmr',
  ].join('\n');

  const robotsTxt = [
    'User-agent: *',
    sharedRules,
    '',
    '# Explicit opt-in for LLM & AI search crawlers (GEO)',
    'User-agent: PerplexityBot',
    'User-agent: GPTBot',
    'User-agent: OAI-SearchBot',
    'User-agent: ChatGPT-User',
    'User-agent: ClaudeBot',
    'User-agent: Bingbot',
    'User-agent: Google-Extended',
    'User-agent: Applebot-Extended',
    sharedRules,
    '',
    '# LLM-optimized content: https://ugc-vz.de/llms.txt',
    `Sitemap: ${baseUrl}/sitemap_index.xml`,
    `Sitemap: ${baseUrl}/sitemap.xml`,
    '',
  ].join('\n');

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}

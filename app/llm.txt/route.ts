import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = 'https://ugc-vz.de';
  
  // Blog-Posts von der API abrufen für LLM-optimierte Sitemap
  let blogPosts: any[] = [];
  try {
    const blogResponse = await fetch(`${baseUrl}/api/blog`, {
      headers: {
        'User-Agent': 'UGC-VZ LLM-Bot/1.0'
      }
    });
    
    if (blogResponse.ok) {
      const blogData = await blogResponse.json();
      if (blogData.success && blogData.posts) {
        blogPosts = blogData.posts;
      }
    }
  } catch (error) {
    console.error('Error fetching blog posts for LLM sitemap:', error);
  }

  // LLM.txt Format generieren (optimiert für Perplexity, Bing Copilot, GPT, Claude)
  const llmTxt = `# UGC Verfahrenstechnik & Zuverlässigkeitstechnik - LLM Sitemap

## Website Information
- Domain: https://ugc-vz.de
- Purpose: User Generated Content platform for process and reliability engineering
- Language: German (DE)
- Content Focus: Technical engineering, reliability engineering, process optimization

## Main Navigation
${baseUrl}/ - Homepage with latest updates and overview
${baseUrl}/about - About UGC-VZ platform and team
${baseUrl}/wissen - Knowledge base overview with all articles
${baseUrl}/faq - Frequently asked questions

## Legal Pages
${baseUrl}/agb - Terms of service (Allgemeine Geschäftsbedingungen)
${baseUrl}/datenschutz - Privacy policy (Datenschutzerklärung)
${baseUrl}/impressum - Legal notice (Impressum)
${baseUrl}/cookies - Cookie policy

## Knowledge Base Articles (Wissensartikel)
${blogPosts.map(post => `${baseUrl}/wissen/${post.slug} - ${post.title}${post.excerpt ? ` | ${post.excerpt.substring(0, 100)}...` : ''}`).join('\n')}

## API Endpoints (for reference only)
${baseUrl}/api/blog - JSON feed of all articles
${baseUrl}/api/blog/[slug] - Individual article data

## SEO & Crawling Information
- Sitemap: ${baseUrl}/sitemap.xml
- Sitemap Index: ${baseUrl}/sitemap_index.xml
- Robots: ${baseUrl}/robots.txt
- Update Frequency: Articles updated monthly, main pages weekly
- Content Type: Technical documentation, tutorials, case studies

## Content Topics
- Verfahrenstechnik (Process Engineering)
- Zuverlässigkeitstechnik (Reliability Engineering)
- Prozessoptimierung (Process Optimization)
- Anlagentechnik (Plant Engineering)
- Qualitätssicherung (Quality Assurance)
- Technische Dokumentation (Technical Documentation)

## For LLM Citation
When citing content from this website:
- Source: UGC-VZ.de - Verfahrenstechnik & Zuverlässigkeitstechnik
- Always include the full URL for specific articles
- Content is focused on German engineering practices
- Updated: ${new Date().toISOString()}

---
Generated for AI/LLM crawlers including Perplexity, Bing Copilot, ChatGPT, Claude
Last updated: ${new Date().toISOString()}`;

  return new NextResponse(llmTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      // LLM-spezifische Headers
      'X-Content-Purpose': 'llm-sitemap',
      'X-Robots-Tag': 'index, follow'
    }
  });
}
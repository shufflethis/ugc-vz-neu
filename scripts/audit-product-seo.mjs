// Read-only HTTP inspection. Google indexing status still requires GSC URL inspection.
import { load } from 'cheerio';

const base = (process.env.SEO_AUDIT_BASE_URL || 'https://ugc-vz.de').replace(/\/$/, '');
const paths = ['/brands', '/creator', '/brands/ugc-creator-finden'];
async function read(path) {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(30000) });
  return { response, body: await response.text() };
}
const [robots, sitemap, home] = await Promise.all([read('/robots.txt'), read('/sitemap.xml'), read('/')]);
const homeHtml = load(home.body);
const pages = await Promise.all(paths.map(async (path) => {
  const { response, body } = await read(path);
  const html = load(body);
  return {
    path, status: response.status, finalUrl: response.url,
    canonical: html('link[rel="canonical"]').attr('href') || null,
    robotsMeta: html('meta[name="robots"]').attr('content') || null,
    xRobotsTag: response.headers.get('x-robots-tag'),
    title: html('title').text(), h1: html('h1').first().text(),
    inSitemap: sitemap.body.includes(`https://ugc-vz.de${path}</loc>`),
    linkedFromHome: homeHtml(`a[href="${path}"]`).length > 0,
  };
}));
console.log(JSON.stringify({ base, checkedAt: new Date().toISOString(), robotsStatus: robots.response.status, sitemapStatus: sitemap.response.status, robotsTxt: robots.body, pages, limit: 'HTTP checks do not prove indexing. Inspect these URLs and Google-selected canonicals in GSC.' }, null, 2));
if (pages.some(page => page.status !== 200 || !page.inSitemap || /noindex/i.test(`${page.robotsMeta} ${page.xRobotsTag}`))) process.exitCode = 1;

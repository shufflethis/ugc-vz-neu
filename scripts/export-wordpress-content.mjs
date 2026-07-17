#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const ROOT = process.cwd();
const WP_API = 'https://wp.ugc-vz.de/wp-json/wp/v2';
const CONTENT_DIR = path.join(ROOT, 'content', 'wissen');
const PUBLIC_DIR = path.join(ROOT, 'public');
const REPORT_FILE = path.join(ROOT, 'content', 'wordpress-export-report.json');
const CONCURRENCY = 8;

const duplicateRedirects = {
  'ugc-recht-was-ist-zu-beachten-2': 'ugc-recht-was-ist-zu-beachten',
  'ugc-success-stories-2': 'ugc-success-stories',
  'ugc-success-stories-3': 'ugc-success-stories',
  'ugc-trends-2025-2': 'ugc-trends-2025',
  'warum-ugc-guenstiger-als-influencer-marketing-ist-2': 'warum-ugc-guenstiger-als-influencer-marketing-ist',
  'ugc-in-der-beauty-branche-2': 'ugc-in-der-beauty-branche',
  'ugc-in-der-beauty-branche-3': 'ugc-in-der-beauty-branche',
  'ugc-bewertungen-so-werden-sie-authentisch-2': 'ugc-bewertungen-so-werden-sie-authentisch',
  'ugc-bewertungen-so-werden-sie-authentisch-3': 'ugc-bewertungen-so-werden-sie-authentisch',
  'ugc-bewertungen-so-werden-sie-authentisch-4': 'ugc-bewertungen-so-werden-sie-authentisch',
  'ugc-bewertungen-so-werden-sie-authentisch-5': 'ugc-bewertungen-so-werden-sie-authentisch',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchResponse(url, attempt = 1) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'UGC-VZ WordPress retirement exporter/1.0' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response;
  } catch (error) {
    if (attempt >= 4) throw new Error(`Could not fetch ${url}: ${error.message}`);
    await sleep(500 * attempt);
    return fetchResponse(url, attempt + 1);
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url) {
  return (await fetchResponse(url)).json();
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function decodeEntities(value = '') {
  const $ = load(`<span>${value}</span>`, null, false);
  return $('span').text().replace(/\s+/g, ' ').trim();
}

function plainText(value = '') {
  const $ = load(value, null, false);
  return $.root().text().replace(/\s+/g, ' ').trim();
}

function classifyContent(title, excerpt, contentHtml) {
  const text = plainText(contentHtml);
  const wordCount = text ? text.split(/\s+/).length : 0;
  const placeholder = /(?:searchgpt|ugc\s*vz)?\s*404|page not found|seite nicht gefunden/i
    .test(`${title} ${excerpt} ${text.slice(0, 500)}`);
  return {
    wordCount,
    status: placeholder || wordCount < 300 ? 'gone' : 'published',
  };
}

function rewriteWpUrl(value, slugs) {
  if (!value) return value;
  return value.replace(/https?:\/\/wp\.ugc-vz\.de([^\s"'<>)]*)/gi, (_match, pathname = '') => {
    if (pathname.startsWith('/wp-content/uploads/')) return pathname;
    const slug = pathname.replace(/^\/+|\/+$/g, '');
    if (slugs.has(slug)) return `/wissen/${slug}`;
    return pathname || '/';
  });
}

function sanitizeHtml(html, slugs) {
  const $ = load(html || '', null, false);
  $('script, style, iframe, object, embed, form, input, button, textarea, select, meta, link').remove();
  $('h1').each((_index, element) => { element.tagName = 'h2'; });

  $('*').each((_index, element) => {
    for (const attribute of Object.keys(element.attribs || {})) {
      if (/^on/i.test(attribute) || attribute.toLowerCase() === 'srcdoc') $(element).removeAttr(attribute);
    }
  });

  $('[href]').each((_index, element) => {
    const href = $(element).attr('href') || '';
    const rewritten = rewriteWpUrl(href, slugs);
    if (/^\s*(javascript|data|vbscript):/i.test(rewritten)) $(element).removeAttr('href');
    else if (/^[^/@\s]+@[^/@\s]+\.[^/@\s]+$/.test(rewritten)) $(element).attr('href', `mailto:${rewritten}`);
    else $(element).attr('href', rewritten);
  });

  $('[src]').each((_index, element) => {
    const src = rewriteWpUrl($(element).attr('src') || '', slugs);
    if (/^\s*(javascript|vbscript):/i.test(src)) $(element).removeAttr('src');
    else $(element).attr('src', src);
  });

  $('[srcset]').each((_index, element) => {
    $(element).attr('srcset', rewriteWpUrl($(element).attr('srcset') || '', slugs));
  });

  return $.html().trim();
}

function collectJsonLd(value, output = []) {
  if (!value || typeof value !== 'object') return output;
  if (value['@type']) output.push(value);
  for (const child of Object.values(value)) collectJsonLd(child, output);
  return output;
}

function extractFaqs(html) {
  const $ = load(html || '', null, false);
  const faqs = [];
  $('script[type="application/ld+json"]').each((_index, element) => {
    try {
      const parsed = JSON.parse($(element).text());
      for (const item of collectJsonLd(parsed)) {
        const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
        if (!types.includes('FAQPage') || !Array.isArray(item.mainEntity)) continue;
        for (const entity of item.mainEntity) {
          const question = decodeEntities(entity?.name || '');
          const answer = plainText(entity?.acceptedAnswer?.text || '');
          if (question && answer) faqs.push({ question, answer });
        }
      }
    } catch {}
  });
  return [...new Map(faqs.map((faq) => [`${faq.question}\n${faq.answer}`, faq])).values()];
}

function localMediaPath(sourceUrl) {
  if (!sourceUrl) return '';
  try {
    const url = new URL(sourceUrl);
    if (url.hostname !== 'wp.ugc-vz.de' || !url.pathname.startsWith('/wp-content/uploads/')) return sourceUrl;
    return url.pathname;
  } catch {
    return '';
  }
}

function normalizeAuthor(author) {
  if (!author) return { id: 'ugc-vz-redaktion', name: 'UGC VZ Redaktion', url: '/about', sameAs: [] };
  if (/^gorden$/i.test(author.name || '')) {
    return {
      id: 'gorden-wuebbe',
      name: 'Gorden Wübbe',
      url: '/about',
      sameAs: ['https://www.linkedin.com/in/wuebbe/'],
      sourceWordPressId: author.id,
    };
  }
  return {
    id: author.slug || `wp-author-${author.id}`,
    name: decodeEntities(author.name || 'UGC VZ Redaktion'),
    url: '/about',
    sameAs: [],
    sourceWordPressId: author.id,
  };
}

async function main() {
  await mkdir(CONTENT_DIR, { recursive: true });

  const first = await fetchResponse(`${WP_API}/posts?status=publish&per_page=1&_fields=id`);
  const total = Number(first.headers.get('x-wp-total'));
  const pages = Math.ceil(total / 100);
  if (!Number.isInteger(total) || total < 1) throw new Error('WordPress did not return a valid post total.');

  const postPages = await mapLimit(Array.from({ length: pages }, (_, index) => index + 1), 4, (page) => fetchJson(
    `${WP_API}/posts?status=publish&per_page=100&page=${page}&orderby=date&order=desc&_fields=id,slug,date,date_gmt,modified,modified_gmt,title,content,excerpt,featured_media,author,categories,link`,
  ));
  const posts = postPages.flat();
  if (posts.length !== total) throw new Error(`Expected ${total} posts, received ${posts.length}.`);

  const authorIds = [...new Set(posts.map((post) => post.author).filter(Boolean))];
  const categoryIds = [...new Set(posts.flatMap((post) => post.categories || []).filter(Boolean))];
  const mediaIds = [...new Set(posts.map((post) => post.featured_media).filter(Boolean))];

  const [rawAuthors, rawCategories] = await Promise.all([
    authorIds.length ? fetchJson(`${WP_API}/users?include=${authorIds.join(',')}&per_page=100&_fields=id,name,slug,description,link`) : [],
    categoryIds.length ? fetchJson(`${WP_API}/categories?include=${categoryIds.join(',')}&per_page=100&_fields=id,name,slug`) : [],
  ]);

  const mediaBatches = [];
  for (let index = 0; index < mediaIds.length; index += 100) mediaBatches.push(mediaIds.slice(index, index + 100));
  const rawMedia = (await mapLimit(mediaBatches, 4, (ids) => fetchJson(
    `${WP_API}/media?include=${ids.join(',')}&per_page=100&_fields=id,source_url,mime_type,media_details,alt_text`,
  ))).flat();

  const authorsById = new Map(rawAuthors.map((author) => [author.id, normalizeAuthor(author)]));
  const categoriesById = new Map(rawCategories.map((category) => [category.id, decodeEntities(category.name)]));
  const mediaById = new Map(rawMedia.map((media) => [media.id, media]));
  const slugs = new Set(posts.map((post) => post.slug));
  const authorRecords = [...new Map([...authorsById.values()].map((author) => [author.id, author])).values()];
  if (!authorRecords.length) authorRecords.push(normalizeAuthor(null));

  const manifest = [];
  let exportedContentBytes = 0;
  const missingMedia = [];

  for (const post of posts) {
    const rawHtml = post.content?.rendered || '';
    const contentHtml = sanitizeHtml(rawHtml, slugs);
    const excerpt = plainText(post.excerpt?.rendered || rawHtml).slice(0, 320);
    const title = decodeEntities(post.title?.rendered || post.slug);
    const classification = classifyContent(title, excerpt, contentHtml);
    const author = authorsById.get(post.author) || normalizeAuthor(null);
    const media = mediaById.get(post.featured_media);
    const featuredImage = localMediaPath(media?.source_url) || '/placeholder-blog.svg';
    if (post.featured_media && !media) missingMedia.push({ postId: post.id, slug: post.slug, mediaId: post.featured_media });
    const redirectSlug = classification.status === 'published' ? duplicateRedirects[post.slug] || null : null;
    const record = {
      version: 1,
      source: { system: 'wordpress', id: post.id, link: post.link },
      slug: post.slug,
      title,
      excerpt,
      contentHtml,
      publishedAt: post.date_gmt ? `${post.date_gmt}Z` : post.date,
      modifiedAt: post.modified_gmt ? `${post.modified_gmt}Z` : post.modified,
      authorId: author.id,
      categories: (post.categories || []).map((id) => categoriesById.get(id)).filter(Boolean),
      featuredImage,
      featuredImageAlt: decodeEntities(media?.alt_text || title),
      faqs: extractFaqs(rawHtml),
      redirectTo: redirectSlug ? `/wissen/${redirectSlug}` : null,
      contentStatus: redirectSlug ? 'redirect' : classification.status,
      wordCount: classification.wordCount,
      indexable: classification.status === 'published' && !redirectSlug,
      checksum: createHash('sha256').update(JSON.stringify({ title, contentHtml, excerpt })).digest('hex'),
    };
    exportedContentBytes += Buffer.byteLength(contentHtml);
    await writeFile(path.join(CONTENT_DIR, `${post.slug}.json`), `${JSON.stringify(record, null, 2)}\n`);
    manifest.push({
      slug: record.slug,
      title: record.title,
      excerpt: record.excerpt,
      publishedAt: record.publishedAt,
      modifiedAt: record.modifiedAt,
      authorId: record.authorId,
      categories: record.categories,
      featuredImage: record.featuredImage,
      redirectTo: record.redirectTo,
      contentStatus: record.contentStatus,
      wordCount: record.wordCount,
      indexable: record.indexable,
      checksum: record.checksum,
    });
  }

  await writeFile(path.join(ROOT, 'content', 'authors.json'), `${JSON.stringify(authorRecords, null, 2)}\n`);
  await writeFile(path.join(CONTENT_DIR, 'index.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(
    path.join(ROOT, 'content', 'gone-slugs.json'),
    `${JSON.stringify(manifest.filter((post) => post.contentStatus === 'gone').map((post) => post.slug), null, 2)}\n`,
  );
  await writeFile(
    path.join(ROOT, 'content', 'published-slugs.json'),
    `${JSON.stringify(manifest.filter((post) => post.indexable).map((post) => post.slug), null, 2)}\n`,
  );

  let downloadedBytes = 0;
  const downloadedMedia = [];
  await mapLimit(rawMedia, CONCURRENCY, async (media) => {
    const pathname = localMediaPath(media.source_url);
    if (!pathname || !pathname.startsWith('/wp-content/uploads/')) return;
    const target = path.join(PUBLIC_DIR, pathname);
    await mkdir(path.dirname(target), { recursive: true });
    const response = await fetchResponse(media.source_url);
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(target, buffer);
    downloadedBytes += buffer.length;
    downloadedMedia.push({ id: media.id, sourceUrl: media.source_url, pathname, bytes: buffer.length });
  });

  const report = {
    generatedAt: new Date().toISOString(),
    source: WP_API,
    postsExpected: total,
    postsExported: manifest.length,
    indexablePosts: manifest.filter((post) => post.indexable).length,
    redirectedPosts: manifest.filter((post) => post.redirectTo).length,
    gonePosts: manifest.filter((post) => post.contentStatus === 'gone').length,
    contentBytes: exportedContentBytes,
    featuredMediaIds: mediaIds.length,
    mediaMetadataFound: rawMedia.length,
    mediaDownloaded: downloadedMedia.length,
    mediaBytes: downloadedBytes,
    missingMedia,
    authors: authorRecords,
    categoryCount: rawCategories.length,
  };
  await writeFile(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`);

  const savedManifest = JSON.parse(await readFile(path.join(CONTENT_DIR, 'index.json'), 'utf8'));
  if (savedManifest.length !== total) throw new Error('Written manifest did not pass its count check.');
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

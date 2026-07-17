import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifest = JSON.parse(readFileSync(path.join(root, 'content/wissen/index.json'), 'utf8'));
const publishedSlugs = JSON.parse(readFileSync(path.join(root, 'content/published-slugs.json'), 'utf8'));
const goneSlugs = JSON.parse(readFileSync(path.join(root, 'content/gone-slugs.json'), 'utf8'));
const report = JSON.parse(readFileSync(path.join(root, 'content/wordpress-export-report.json'), 'utf8'));

const fail = (message) => { throw new Error(message); };
if (manifest.length !== 678) fail(`Expected 678 archived posts, received ${manifest.length}.`);
if (new Set(manifest.map((post) => post.slug)).size !== manifest.length) fail('Duplicate slugs found.');
if (publishedSlugs.length !== 64) fail(`Expected 64 published posts, received ${publishedSlugs.length}.`);
if (goneSlugs.length !== 614) fail(`Expected 614 gone posts, received ${goneSlugs.length}.`);
if (report.mediaDownloaded !== 638 || report.missingMedia.length) fail('Media export is incomplete.');

const referencedMedia = new Set();
for (const summary of manifest) {
  const file = path.join(root, 'content/wissen', `${summary.slug}.json`);
  if (!existsSync(file)) fail(`Missing post document: ${summary.slug}`);
  const post = JSON.parse(readFileSync(file, 'utf8'));
  const checksum = createHash('sha256')
    .update(JSON.stringify({ title: post.title, contentHtml: post.contentHtml, excerpt: post.excerpt }))
    .digest('hex');
  if (checksum !== summary.checksum || checksum !== post.checksum) fail(`Checksum mismatch: ${summary.slug}`);
  if (/<script\b|<h1\b|javascript:/i.test(post.contentHtml)) fail(`Unsafe article HTML: ${summary.slug}`);
  if (/https?:\/\/wp\.ugc-vz\.de/i.test(post.contentHtml)) fail(`WordPress host leak: ${summary.slug}`);
  if (post.featuredImage) {
    if (post.featuredImage.startsWith('/wp-content/uploads/')) referencedMedia.add(post.featuredImage);
    if (!existsSync(path.join(root, 'public', decodeURI(post.featuredImage)))) {
      fail(`Missing featured media: ${post.featuredImage}`);
    }
  }
}

console.log(JSON.stringify({
  archivedPosts: manifest.length,
  publishedPosts: publishedSlugs.length,
  gonePosts: goneSlugs.length,
  downloadedMedia: report.mediaDownloaded,
  referencedMedia: referencedMedia.size,
  checksumErrors: 0,
  unsafeHtml: 0,
  wordpressHostLeaks: 0,
}));

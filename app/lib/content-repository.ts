import { readFileSync } from 'node:fs';
import path from 'node:path';
import manifestJson from '@/content/wissen/index.json';
import authorsJson from '@/content/authors.json';
import relatedJson from '@/content/wissen/related.json';

export const POSTS_PER_PAGE = 30;

export type ContentAuthor = {
  id: string;
  name: string;
  url: string;
  sameAs: string[];
};

export type ContentPostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  modifiedAt: string;
  authorId: string;
  categories: string[];
  featuredImage: string;
  redirectTo: string | null;
  contentStatus: 'published' | 'redirect' | 'gone';
  wordCount: number;
  indexable: boolean;
  checksum: string;
};

export type ContentPost = ContentPostSummary & {
  version: number;
  source: { system: 'wordpress'; id: number; link: string };
  contentHtml: string;
  featuredImageAlt: string;
  faqs: Array<{ question: string; answer: string }>;
};

const manifest = manifestJson as ContentPostSummary[];
const authors = authorsJson as ContentAuthor[];
const summaryBySlug = new Map(manifest.map((post) => [post.slug, post]));
const authorById = new Map(authors.map((author) => [author.id, author]));

export function getAllContentRecords() {
  return manifest;
}

export function getPublishedPosts() {
  return manifest.filter((post) => post.indexable && post.contentStatus === 'published');
}

export function getPublishedPostCount() {
  return getPublishedPosts().length;
}

export function getPageCount() {
  return Math.ceil(getPublishedPostCount() / POSTS_PER_PAGE);
}

export function getPostsPage(page: number) {
  const posts = getPublishedPosts();
  const start = Math.max(0, page - 1) * POSTS_PER_PAGE;
  return posts.slice(start, start + POSTS_PER_PAGE);
}

export function getPostSummary(slug: string) {
  return summaryBySlug.get(slug) || null;
}

/**
 * Thematisch verwandte Artikel, vorberechnet von scripts/build-related-articles.mjs.
 * Filtert defensiv gegen das Manifest: Ein Verweis auf einen zurueckgezogenen Slug
 * waere ein Link auf HTTP 410. Nach dem Zurueckziehen eines Artikels also entweder
 * das Script neu laufen lassen oder auf diesen Filter vertrauen.
 */
export function getRelatedPosts(slug: string, limit = 3): ContentPostSummary[] {
  const slugs = (relatedJson as Record<string, string[]>)[slug] || [];
  return slugs
    .map((s) => summaryBySlug.get(s))
    .filter(
      (post): post is ContentPostSummary =>
        Boolean(post) && post!.indexable && post!.contentStatus === 'published',
    )
    .slice(0, limit);
}

export function getContentPost(slug: string): ContentPost | null {
  const summary = getPostSummary(slug);
  if (!summary?.indexable || summary.contentStatus !== 'published') return null;
  const filename = path.join(process.cwd(), 'content', 'wissen', `${summary.slug}.json`);
  return JSON.parse(readFileSync(filename, 'utf8')) as ContentPost;
}

export function getAuthor(authorId: string) {
  return authorById.get(authorId) || {
    id: 'ugc-vz-redaktion',
    name: 'UGC VZ Redaktion',
    url: '/about',
    sameAs: [],
  };
}

export function absoluteContentUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://ugc-vz.de${value.startsWith('/') ? value : `/${value}`}`;
}

'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import type { ContentPostSummary } from '../lib/content-repository';

export type ContentPostCard = ContentPostSummary & { authorName: string };

type WissenFilter = 'alle' | 'marken' | 'creator' | 'recht' | 'preise';

const FILTER_OPTIONS: Array<{ id: WissenFilter; label: string }> = [
  { id: 'alle', label: 'Alle' },
  { id: 'marken', label: 'Marken' },
  { id: 'creator', label: 'Creator' },
  { id: 'recht', label: 'Recht' },
  { id: 'preise', label: 'Preise' },
];

function classifyPost(post: ContentPostCard): WissenFilter[] {
  const haystack = `${post.slug} ${post.title} ${post.excerpt} ${post.categories.join(' ')}`.toLowerCase();
  const buckets: WissenFilter[] = [];
  if (/(recht|vertrag|nutzungsrecht|kennzeichnung|werbung|dsgvo|datenschutz|steuer|gewerbe|buyout)/.test(haystack)) {
    buckets.push('recht');
  }
  if (/(preis|kosten|honorar|budget|tkp|verdien|geld|bezahl|tarif|rechner)/.test(haystack)) {
    buckets.push('preise');
  }
  if (/(creator werden|portfolio|jobs|bewerb|auftraege|aufträge|anfangen|starter|equipment|skript)/.test(haystack)) {
    buckets.push('creator');
  }
  if (/(brand|marke|unternehmen|kampagne|agentur|ad|roas|e-commerce|performance|briefing|finden)/.test(haystack)) {
    buckets.push('marken');
  }
  return buckets.length > 0 ? buckets : ['marken'];
}

function formatDateDe(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function ClientWissenContent({ posts }: { posts: ContentPostCard[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<WissenFilter>('alle');

  const postsWithImages = useMemo(
    () =>
      posts.filter(
        (post) =>
          post.featuredImage &&
          post.featuredImage !== '/placeholder-blog.svg' &&
          !post.featuredImage.includes('placeholder'),
      ),
    [posts],
  );

  const filterCounts = useMemo(() => {
    const counts: Record<WissenFilter, number> = {
      alle: postsWithImages.length,
      marken: 0,
      creator: 0,
      recht: 0,
      preise: 0,
    };
    for (const post of postsWithImages) {
      for (const bucket of classifyPost(post)) {
        counts[bucket] += 1;
      }
    }
    return counts;
  }, [postsWithImages]);

  const filteredPosts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return postsWithImages.filter((post) => {
      if (activeFilter !== 'alle' && !classifyPost(post).includes(activeFilter)) {
        return false;
      }
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.authorName.toLowerCase().includes(q)
      );
    });
  }, [postsWithImages, activeFilter, searchTerm]);

  return (
    <>
      {/* Filter-Chips (Marken / Creator / Recht / Preise) + Suche */}
      <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Artikel nach Thema filtern" className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => {
            const active = activeFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveFilter(opt.id)}
                className={`min-h-[42px] rounded-full border px-4 text-sm font-semibold transition-colors ${
                  active
                    ? 'border-[#121212] bg-[#121212] text-[#F7F6F2]'
                    : 'border-[#E4E1D8] bg-white text-[#121212] hover:border-[#121212]'
                }`}
              >
                <span>{opt.label}</span>
                <span className={`ml-1.5 font-mono text-xs tabular-nums ${active ? 'text-[#C8F04B]' : 'text-[#5C5A55]'}`}>
                  {filterCounts[opt.id]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:max-w-sm">
          <input
            type="search"
            aria-label="Artikel durchsuchen"
            placeholder="Artikel durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-h-[44px] w-full rounded-full border border-[#E4E1D8] bg-[#F7F6F2] pl-4 pr-11 text-sm text-[#121212] placeholder-[#5C5A55] outline-none transition-colors focus:border-[#6C2BD9] focus:bg-white focus:ring-4 focus:ring-[#6C2BD9]/15"
          />
          <Search
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#5C5A55]"
          />
        </div>
      </div>

      {/* Leerer Zustand */}
      {filteredPosts.length === 0 && (
        <div className="rounded-[20px] border border-[#E4E1D8] bg-[#F7F6F2] p-10 text-center">
          <p className="text-base font-medium text-[#121212]">
            Keine passenden Artikel für diese Auswahl gefunden.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setActiveFilter('alle');
            }}
            className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-[#121212] px-5 text-sm font-semibold text-[#F7F6F2]"
          >
            Filter zurücksetzen
          </button>
        </div>
      )}

      {/* Artikel-Grid mit Autor und Pruefdatum */}
      {filteredPosts.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => {
            const reviewedDate = formatDateDe(post.modifiedAt || post.publishedAt);
            return (
              <article
                key={post.slug}
                className="group flex flex-col overflow-hidden rounded-[20px] border border-[#E4E1D8] bg-white shadow-card transition-colors hover:border-[#121212]/40"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-[#F7F6F2]">
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-blog.svg';
                    }}
                  />
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {post.categories.slice(0, 2).map((category) => (
                      <span
                        key={category}
                        className="rounded-full border border-[#E4E1D8] bg-[#F7F6F2] px-2.5 py-0.5 text-xs font-medium text-[#5C5A55]"
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  <h2 className="font-display text-xl font-bold leading-snug text-[#121212] line-clamp-2 group-hover:text-[#6C2BD9]">
                    <Link href={`/wissen/${post.slug}`}>{post.title}</Link>
                  </h2>

                  <p className="mt-2.5 flex-1 text-sm leading-6 text-[#5C5A55] line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#E4E1D8] pt-4 text-xs text-[#5C5A55]">
                    <span className="font-medium text-[#121212]">{post.authorName}</span>
                    {reviewedDate && <span>Geprüft: {reviewedDate}</span>}
                  </div>

                  <Link
                    href={`/wissen/${post.slug}`}
                    aria-label={`${post.title} lesen`}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#121212] hover:text-[#6C2BD9]"
                  >
                    <span>Artikel lesen</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

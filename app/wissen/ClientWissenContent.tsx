'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ContactButton from '../components/ContactButton';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  date: string;
  featuredImage: string;
  author: string;
  categories: string[];
}

interface ClientWissenContentProps {
  posts: BlogPost[];
}



export default function ClientWissenContent({ posts }: ClientWissenContentProps) {
  // Formatierungsfunktion für Datum
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Search Bar */}
      <div className="mb-12">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Artikel durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-4 bg-gray-900/50 text-white rounded-xl border border-gray-700/50 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none placeholder-gray-400"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* No Results */}
      {filteredPosts.length === 0 && searchTerm && (
        <div className="text-center py-16">
          <div className="bg-gray-900/30 border border-gray-700/50 rounded-xl p-8 max-w-md mx-auto">
            <p className="text-gray-300">Keine Artikel gefunden für "{searchTerm}"</p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Alle Artikel anzeigen
            </button>
          </div>
        </div>
      )}

      {/* Blog Posts Grid */}
      {filteredPosts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden hover:border-emerald-500/30 transition-all duration-300 group"
            >
              {/* Featured Image */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={post.featuredImage}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-blog.svg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.categories.map((category) => (
                    <span
                      key={category}
                      className="px-3 py-1 bg-emerald-600/20 text-emerald-300 text-xs rounded-full border border-emerald-600/30"
                    >
                      {category}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold mb-3 text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                  <Link href={`/wissen/${post.slug}`}>
                    {post.title}
                  </Link>
                </h2>

                {/* Excerpt */}
                <p className="text-gray-300 text-sm leading-relaxed mb-4 line-clamp-3">
                  {post.excerpt}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{post.author}</span>
                  <span>{formatDate(post.date)}</span>
                </div>

                {/* Read More Button */}
                <div className="mt-4">
                  <Link
                    href={`/wissen/${post.slug}`}
                    className="inline-flex items-center text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-medium"
                  >
                    Weiterlesen
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* CTA Section */}
      <section className="mt-20">
        <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 backdrop-blur-sm rounded-2xl p-12 border border-emerald-700/30 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Hast du <span className="gradient-text">Fragen</span> zu UGC?
          </h2>
          <p className="text-lg text-gray-200 leading-relaxed mb-8 max-w-2xl mx-auto">
            Unser Team steht dir gerne zur Verfügung. Egal ob du Creator bist oder eine Brand –
            wir helfen dir dabei, das Beste aus User Generated Content herauszuholen.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ContactButton
              title="Kontakt aufnehmen"
              subtitle="Haben Sie Fragen zu UGC oder Creator Marketing? Schreiben Sie uns!"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Kontakt aufnehmen
            </ContactButton>
            <Link
              href="/"
              className="border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105 inline-flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Creator finden
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
// Umwandlung in eine Server-Komponente (kein 'use client')

import { Metadata, ResolvingMetadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import ContactButton from '../../components/ContactButton';
import ResponsiveCTAButton from '@/src/components/ResponsiveCTAButton';
import LogoImage from '../../components/LogoImage';
import { notFound } from 'next/navigation';

// Client-Komponenten importieren
import ClientBlogPostContent from './ClientBlogPostContent';
import JsonLdScript from './JsonLdScript';
import BreadcrumbSchema from '../../components/BreadcrumbSchema';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  date: string;
  featuredImage: string;
  author: string;
  categories: string[];
  readingTime: number;
  schemaOrg?: string; // Schema.org JSON-LD als optionales Feld
}

// Metadaten für die Seite generieren
export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = params.slug;
  
  // Blogpost-Daten abrufen
  const post = await fetchPost(slug);
  
  if (!post) {
    return {
      title: 'Artikel nicht gefunden | UGC VZ',
      description: 'Der gesuchte Artikel konnte nicht gefunden werden.'
    };
  }
  
  const baseUrl = 'https://ugc-vz.de';
  const postUrl = `${baseUrl}/wissen/${slug}`;
  
  return {
    title: `${post.title} | UGC VZ`,
    description: post.excerpt,
    keywords: post.categories.join(', '),
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      url: postUrl,
      siteName: 'UGC VZ',
      locale: 'de_DE',
      images: [
        {
          url: post.featuredImage,
          width: 1200,
          height: 630,
          alt: post.title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.featuredImage],
      creator: '@Ugc_Vz',
    },
    alternates: {
      canonical: postUrl,
    },
  };
}

// Funktion zum Abrufen des Blogposts
async function fetchPost(slug: string): Promise<BlogPost | null> {
  try {
    // Verwende absolute URL für SSR
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ugc-vz.de';
    const response = await fetch(`${baseUrl}/api/blog/${slug}`, {
      next: { revalidate: 300 } // Cache für 5 Minuten - reduced for faster blog updates
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (!data.success) {
      return null;
    }
    
    return data.post;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

// Formatierungsfunktion für Datum
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug);
  
  if (!post) {
    notFound();
    return; // This will never be reached, but helps TypeScript understand
  }

  // Schema.org JSON-LD mit der JsonLdScript-Komponente einbetten
  const jsonLd = post.schemaOrg ? <JsonLdScript data={post.schemaOrg} /> : null;

  // BreadcrumbList für SEO
  const breadcrumbs = [
    { name: 'Home', url: 'https://ugc-vz.de' },
    { name: 'Wissen', url: 'https://ugc-vz.de/wissen' },
    { name: post.title, url: `https://ugc-vz.de/wissen/${params.slug}` }
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Schema.org JSON-LD für Rich Snippets */}
      {jsonLd}
      <BreadcrumbSchema items={breadcrumbs} />
      
      {/* Header */}
      <header className="py-6 px-4 sm:px-8 md:px-16 lg:px-24">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <LogoImage
              width={32}
              height={32}
              className="mr-2"
              priority
            />
            <span className="text-xl font-bold gradient-text">
              UGC VZ
            </span>
          </Link>

          <ResponsiveCTAButton />
        </div>
      </header>

      {/* Breadcrumb */}
      <nav className="px-4 sm:px-8 md:px-16 lg:px-24 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/wissen" className="hover:text-emerald-400 transition-colors">Wissen</Link>
            <span>/</span>
            <span className="text-gray-300">{post.title}</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-4 sm:px-8 md:px-16 lg:px-24 pb-24">
        <article className="max-w-4xl mx-auto">
          {/* Article Header */}
          <header className="mb-12">
            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-6">
              {post.categories.map((category) => (
                <span
                  key={category}
                  className="px-4 py-2 bg-emerald-600/20 text-emerald-300 text-sm rounded-full border border-emerald-600/30"
                >
                  {category}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-gray-400 mb-8">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{post.author}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(post.date)}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>{post.readingTime} Min. Lesezeit</span>
              </div>
            </div>

            {/* Featured Image */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-12">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </header>

          {/* Article Content */}
          <div className="prose prose-lg prose-invert max-w-none">
            <ClientBlogPostContent content={post.content} />
          </div>
        </article>
      </main>

      {/* CTA Section */}
      <section className="px-4 sm:px-8 md:px-16 lg:px-24 py-16 bg-gradient-to-b from-transparent to-black/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            <span className="gradient-text">Bereit für professionellen UGC?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Entdecke, wie UGC deine Marke auf das nächste Level bringen kann. Sprich mit unserem Team und erfahre mehr über unsere Creator-Vermittlung.
          </p>
          <ContactButton>Kontakt aufnehmen</ContactButton>
        </div>
      </section>
    </div>
  );
}

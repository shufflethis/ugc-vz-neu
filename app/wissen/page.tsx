import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import ContactButton from '../components/ContactButton';
import ResponsiveCTAButton from '@/src/components/ResponsiveCTAButton';
import LogoImage from '../components/LogoImage';

// Client-Komponenten importieren
import ClientWissenContent from './ClientWissenContent';
import JsonLdScript from './[slug]/JsonLdScript';
import BreadcrumbSchema from '../components/BreadcrumbSchema';

import { BlogPost } from '../lib/wordpress-api'; // Import BlogPost from central definition

// Metadaten für die Seite generieren
export const metadata: Metadata = {
  title: 'Creator-Wissen, Tipps & Strategien | UGC VZ',
  description: 'Entdecke die neuesten Trends, Strategien und Insights aus der Welt des User Generated Content. Von Creator-Tipps bis hin zu Brand-Strategien.',
  alternates: {
    canonical: 'https://ugc-vz.de/wissen',
  },
  openGraph: {
    title: 'Creator-Wissen, Tipps & Strategien',
    description: 'Entdecke die neuesten Trends, Strategien und Insights aus der Welt des User Generated Content.',
    type: 'website',
    images: [
      {
        url: 'https://ugc-vz.de/og-image-wissen.jpg',
        width: 1200,
        height: 630,
        alt: 'UGC VZ Wissen',
      }
    ],
  }
};

// Funktion zum Abrufen der Blogposts
async function fetchPosts(): Promise<BlogPost[]> {
  try {
    // Verwende absolute URL für SSR
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ugc-vz.de';
    const response = await fetch(`${baseUrl}/api/blog`, {
      next: { revalidate: 300 } // Cache für 5 Minuten - reduced for faster blog updates
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!data.success) {
      return [];
    }

    return data.posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

// Schema.org JSON-LD für die Blog-Liste generieren
function generateBlogListingSchema(posts: BlogPost[]) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ugc-vz.de';

  const itemListElements = posts.map((post, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "item": {
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "datePublished": post.date,
      "author": {
        "@type": "Person",
        "name": post.author
      },
      "publisher": {
        "@type": "Organization",
        "name": "UGC VZ",
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/ugc-vz-logo-600x60.svg`,
          "width": 600,
          "height": 60
        }
      },
      "image": post.image,
      "url": `${baseUrl}/wissen/${post.slug}`
    }
  }));

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": itemListElements
  };
}

export default async function WissenPage() {
  const posts = await fetchPosts();

  // Schema.org JSON-LD für die Blog-Liste generieren
  const blogListingSchema = generateBlogListingSchema(posts);

  // Schema.org JSON-LD mit der JsonLdScript-Komponente einbetten
  const jsonLd = <JsonLdScript data={blogListingSchema} />;

  return (
    <div className="min-h-screen bg-white text-ink">
      {/* Schema.org JSON-LD für Rich Snippets */}
      {jsonLd}
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://ugc-vz.de' },
        { name: 'Wissen', url: 'https://ugc-vz.de/wissen' }
      ]} />

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

      {/* Main Content */}
      <main className="px-4 sm:px-8 md:px-16 lg:px-24 pb-24">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              <span className="gradient-text">Wissen</span> für UGC Creators
            </h1>
            <p className="text-xl text-ink-soft max-w-3xl mx-auto leading-relaxed">
              Entdecke die neuesten Trends, Strategien und Insights aus der Welt des User Generated Content.
              Von Creator-Tipps bis hin zu Brand-Strategien – hier findest du alles, was du wissen musst.
            </p>
          </div>

          {/* Client-Komponente für interaktive Elemente */}
          <ClientWissenContent posts={posts} />

          <section className="mt-20 grid md:grid-cols-2 gap-6">
            <Link href="/brands" className="surface-card rounded-lg p-6 hover:border-geo-violet transition-colors">
              <h2 className="text-2xl font-bold text-geo-violet mb-3">UGC Creator finden</h2>
              <p className="text-ink-soft leading-relaxed">
                Fuer Brands, E-Commerce Teams und Agenturen: Demand eingeben, passende Creator ansehen und Anfrage an UGC VZ senden.
              </p>
            </Link>
            <Link href="/creator" className="surface-card rounded-lg p-6 hover:border-geo-violet transition-colors">
              <h2 className="text-2xl font-bold text-geo-violet mb-3">Als UGC Creator anmelden</h2>
              <p className="text-ink-soft leading-relaxed">
                Fuer Creator: kostenlos Profil, Portfolio, Themen und Social-Links hinterlegen.
              </p>
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}

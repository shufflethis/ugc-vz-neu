import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ContactButton from '../../components/ContactButton';
import ResponsiveCTAButton from '@/src/components/ResponsiveCTAButton';
import LogoImage from '../../components/LogoImage';
import JsonLdScript from './JsonLdScript';
import BreadcrumbSchema from '../../components/BreadcrumbSchema';
import {
  absoluteContentUrl,
  getAuthor,
  getContentPost,
  getPublishedPosts,
  getRelatedPosts,
} from '../../lib/content-repository';

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublishedPosts().map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getContentPost(params.slug);
  if (!post) return { title: 'Artikel nicht gefunden', robots: { index: false, follow: false } };
  const author = getAuthor(post.authorId);
  const postUrl = `https://ugc-vz.de/wissen/${post.slug}`;
  const image = absoluteContentUrl(post.featuredImage);
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.categories,
    authors: [{ name: author.name, url: author.url }],
    alternates: { canonical: postUrl },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.modifiedAt,
      authors: [author.name],
      url: postUrl,
      siteName: 'UGC VZ',
      locale: 'de_DE',
      images: [{ url: image, width: 1024, height: 576, alt: post.featuredImageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [image],
    },
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Europe/Berlin',
  }).format(new Date(value));
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getContentPost(params.slug);
  if (!post) notFound();
  const author = getAuthor(post.authorId);
  const postUrl = `https://ugc-vz.de/wissen/${post.slug}`;
  const image = absoluteContentUrl(post.featuredImage);
  const readingTime = Math.max(1, Math.ceil(post.wordCount / 220));
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${postUrl}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    headline: post.title,
    description: post.excerpt,
    image: [image],
    datePublished: post.publishedAt,
    dateModified: post.modifiedAt,
    inLanguage: 'de-DE',
    wordCount: post.wordCount,
    author: {
      '@type': 'Person',
      name: author.name,
      url: absoluteContentUrl(author.url),
      sameAs: author.sameAs,
    },
    publisher: {
      '@type': 'Organization',
      name: 'UGC VZ',
      url: 'https://ugc-vz.de',
      logo: { '@type': 'ImageObject', url: 'https://ugc-vz.de/ugc-vz-logo.webp' },
    },
  };
  const faqSchema = post.faqs.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${postUrl}#faq`,
    mainEntity: post.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  } : null;
  const relatedPosts = getRelatedPosts(post.slug);

  return (
    <div className="min-h-screen bg-white text-ink">
      <JsonLdScript data={articleSchema} />
      {faqSchema && <JsonLdScript data={faqSchema} />}
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://ugc-vz.de' },
        { name: 'Wissen', url: 'https://ugc-vz.de/wissen' },
        { name: post.title, url: postUrl },
      ]} />

      <header className="py-6 px-4 sm:px-8 md:px-16 lg:px-24">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <LogoImage width={32} height={32} className="mr-2" priority />
            <span className="text-xl font-bold gradient-text">UGC VZ</span>
          </Link>
          <ResponsiveCTAButton />
        </div>
      </header>

      <nav className="px-4 sm:px-8 md:px-16 lg:px-24 mb-8" aria-label="Breadcrumb">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm text-ink-soft">
          <Link href="/" className="hover:text-geo-violet">Home</Link><span>/</span>
          <Link href="/wissen" className="hover:text-geo-violet">Wissen</Link><span>/</span>
          <span aria-current="page" className="truncate">{post.title}</span>
        </div>
      </nav>

      <main className="px-4 sm:px-8 md:px-16 lg:px-24 pb-24">
        <article className="max-w-4xl mx-auto">
          <header className="mb-12">
            <div className="flex flex-wrap gap-2 mb-6">
              {(post.categories.length ? post.categories : ['UGC']).map((category) => (
                <span key={category} className="px-4 py-2 bg-geo-green/10 text-geo-violet text-sm rounded-full border border-hairline">{category}</span>
              ))}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-5 text-ink-soft mb-8 text-sm">
              <Link href={author.url} className="font-semibold text-geo-violet hover:text-geo-violet-soft">{author.name}</Link>
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              <span>{readingTime} Min. Lesezeit</span>
            </div>
            {post.featuredImage !== '/placeholder-blog.svg' && (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-12">
                <Image src={post.featuredImage} alt={post.featuredImageAlt} fill className="object-cover" priority sizes="(max-width: 896px) 100vw, 896px" />
              </div>
            )}
          </header>
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
        </article>
      </main>

      {relatedPosts.length > 0 && (
        <section className="px-4 sm:px-8 md:px-16 lg:px-24 pb-16 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Weiterführende Artikel</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <Link
                  key={related.slug}
                  href={`/wissen/${related.slug}`}
                  className="surface-card rounded-lg p-6 hover:border-geo-violet transition-colors"
                >
                  <h3 className="text-lg font-bold text-geo-violet mb-2 leading-snug">{related.title}</h3>
                  <p className="text-ink-soft text-sm leading-relaxed line-clamp-3">{related.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-4 sm:px-8 md:px-16 lg:px-24 py-16 grad-subtle">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6"><span className="gradient-text">Bereit für professionellen UGC?</span></h2>
          <p className="text-xl text-ink-soft mb-8 max-w-2xl mx-auto">Finde passende Creator kostenlos oder lass dich bei Auswahl, Briefing und Kampagnenabwicklung unterstützen.</p>
          <ContactButton>Kontakt aufnehmen</ContactButton>
        </div>
      </section>

      <section className="px-4 sm:px-8 md:px-16 lg:px-24 pb-20 bg-surface">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          <Link href="/brands" className="surface-card rounded-lg p-6 hover:border-geo-violet transition-colors">
            <h2 className="text-xl font-bold text-geo-violet mb-3">UGC Creator für eine Kampagne finden</h2>
            <p className="text-ink-soft leading-relaxed">Demand eingeben, passende Profile auswählen und Kontaktdaten kostenlos anfordern.</p>
          </Link>
          <Link href="/creator" className="surface-card rounded-lg p-6 hover:border-geo-violet transition-colors">
            <h2 className="text-xl font-bold text-geo-violet mb-3">Als UGC Creator anmelden</h2>
            <p className="text-ink-soft leading-relaxed">Kostenloses Profil mit Portfolio, Themen und Social-Links hinterlegen.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}

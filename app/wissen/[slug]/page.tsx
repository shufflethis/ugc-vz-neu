import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ContactButton from '../../components/ContactButton';
import ArticleAction from '../../components/ArticleAction';
import { getArticleQuickStart } from '../../lib/article-quick-start';
import { getArticleAudience, getAudienceCta } from '../../lib/article-audience';
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
  // Ein Artikel ueber Creator-Honorare braucht einen anderen Abschluss als einer
  // ueber Kampagnen-Briefings. Bis hierher bekamen beide denselben.
  const cta = getAudienceCta(getArticleAudience(post.slug));
  const quickStart = getArticleQuickStart(post.slug);
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
    <div className="min-h-screen text-ink">
      <JsonLdScript data={articleSchema} />
      {faqSchema && <JsonLdScript data={faqSchema} />}
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://ugc-vz.de' },
        { name: 'Wissen', url: 'https://ugc-vz.de/wissen' },
        { name: post.title, url: postUrl },
      ]} />


      <nav className="px-4 sm:px-8 md:px-16 lg:px-24 pt-8 mb-6" aria-label="Breadcrumb">
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
              {post.modifiedAt !== post.publishedAt && <span>Überarbeitet: <time dateTime={post.modifiedAt}>{formatDate(post.modifiedAt)}</time></span>}
              <span>{readingTime} Min. Lesezeit</span>
            </div>
            {quickStart && <section className="mb-8 rounded-2xl border border-hairline bg-surface p-5 sm:p-7" aria-labelledby="article-quick-start">
              <h2 id="article-quick-start" className="text-xl font-bold text-ink">Das Wichtigste für deinen nächsten Schritt</h2>
              <p className="mt-3 leading-7 text-ink-soft">{quickStart.answer}</p>
              <ul className="my-5 list-disc space-y-2 pl-5 text-ink-soft">{quickStart.checklist.map((item) => <li key={item}>{item}</li>)}</ul>
              <ArticleAction slug={post.slug} target={quickStart.target} placement="quick_start" href={quickStart.href}>{quickStart.label}</ArticleAction>
              {quickStart.target === 'brand' && <p className="mt-3 text-sm text-ink-soft">Die Suche ist kostenlos. Das Creator-Honorar vereinbart ihr direkt.</p>}
            </section>}
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
          <h2 className="text-3xl font-bold mb-6"><span className="gradient-text">{cta.footer.heading}</span></h2>
          <p className="text-xl text-ink-soft mb-8 max-w-2xl mx-auto">{cta.footer.text}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <ArticleAction slug={post.slug} target={cta.footer.primary.href.startsWith('/creator') ? 'creator' : 'brand'} placement="footer" href={cta.footer.primary.href}>
              {cta.footer.primary.label}
            </ArticleAction>
            <ContactButton>Kontakt aufnehmen</ContactButton>
          </div>
          {cta.footer.secondary && (
            <p className="text-sm text-ink-soft/80 mt-6 max-w-2xl mx-auto">{cta.footer.secondary}</p>
          )}
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

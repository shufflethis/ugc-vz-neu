import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import JsonLdScript from '../wissen/[slug]/JsonLdScript';
import SearchBox from '../components/SearchBox';

export const metadata: Metadata = {
  title: 'UGC Creator finden fuer Brands',
  description: 'Finde kostenlos passende UGC Creator fuer Kampagnen in Deutschland. Beschreibe Zielgruppe, Produkt und Content-Stil und fordere Creator-Details an.',
  keywords: 'UGC Creator finden, UGC Agentur, UGC Plattform Deutschland, Creator fuer Brands, UGC Creator buchen, User Generated Content Agentur',
  alternates: {
    canonical: 'https://ugc-vz.de/brands',
  },
  openGraph: {
    title: 'UGC Creator finden fuer Brands | UGC VZ',
    description: 'Kostenlose Creator-Suche fuer Brands, E-Commerce Teams und Agenturen.',
    url: 'https://ugc-vz.de/brands',
    siteName: 'UGC VZ',
    locale: 'de_DE',
    type: 'website',
  },
};

export default function BrandsPage({ searchParams }: { searchParams?: { query?: string } }) {
  const breadcrumbs = [
    { name: 'Home', url: 'https://ugc-vz.de' },
    { name: 'UGC Creator finden', url: 'https://ugc-vz.de/brands' },
  ];

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Kostenlose UGC Creator Suche fuer Brands',
    description: 'UGC VZ hilft Unternehmen in Deutschland, passende UGC Creator fuer Kampagnen, Produktvideos und Social Ads zu finden.',
    provider: {
      '@type': 'Organization',
      '@id': 'https://ugc-vz.de/#organization',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Deutschland',
    },
    serviceType: 'UGC Creator Matching',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <BreadcrumbSchema items={breadcrumbs} />
      <JsonLdScript data={serviceSchema} />

      <header className="py-6 px-4 sm:px-8 md:px-16 lg:px-24">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image src="/ugc-vz-logo.webp" alt="UGC VZ" width={32} height={32} className="mr-2" priority />
            <span className="text-xl font-bold gradient-text">UGC VZ</span>
          </Link>
          <Link href="/creator" className="text-sm font-medium text-gray-300 hover:text-white">
            Fuer Creator
          </Link>
        </div>
      </header>

      <main className="px-4 sm:px-8 md:px-16 lg:px-24 pb-24">
        <section className="max-w-5xl mx-auto py-16 text-center">
          <p className="text-emerald-300 font-semibold mb-4">Kostenlose UGC Creator Suche</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            UGC Creator <span className="gradient-text">fuer deine Brand finden</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-10">
            Beschreibe Produkt, Zielgruppe, Plattform und Content-Wunsch. UGC VZ zeigt passende Creator und du kannst die Details kostenlos anfordern.
          </p>
          <div className="max-w-2xl mx-auto">
            <SearchBox initialQuery={searchParams?.query || ''} />
          </div>
        </section>

        <section className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 mb-16">
          {[
            ['Keine Agenturpflicht', 'Du kannst UGC VZ kostenlos nutzen und Creator direkt anfragen. Agentur-Support ist optional, nicht Voraussetzung.'],
            ['Besser als kalte DMs', 'Statt endlos Instagram-Profile zu pruefen, startest du mit einer klaren Kampagnenbeschreibung.'],
            ['Fuer echte Kampagnen', 'Geeignet fuer Produktvideos, Testimonials, Social Ads, Launches, E-Commerce und lokale Brand-Aktivierungen.'],
          ].map(([title, copy]) => (
            <div key={title} className="bg-gray-900/40 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-3 text-emerald-300">{title}</h2>
              <p className="text-gray-300 leading-relaxed">{copy}</p>
            </div>
          ))}
        </section>

        <section className="max-w-4xl mx-auto bg-gray-900/40 border border-gray-800 rounded-lg p-8">
          <h2 className="text-3xl font-bold mb-6">So formulierst du eine gute Anfrage</h2>
          <ul className="space-y-3 text-gray-200">
            <li>Nenne Produkt, Branche und Zielgruppe.</li>
            <li>Beschreibe Plattform und Format, zum Beispiel TikTok, Reels, Short Ads oder Produktdemo.</li>
            <li>Erwaehne Standort, Sprache, Alter oder Stil, wenn relevant.</li>
            <li>Gib Budgetrahmen, Timing und Nutzungsrechte an, falls schon bekannt.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

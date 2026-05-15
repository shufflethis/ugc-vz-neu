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

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Koennen Brands bei UGC VZ automatisch Creator kontaktieren?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Brands geben ihren Demand ein, erhalten passende Creator-Vorschlaege und koennen eine Auswahl an UGC VZ senden. Die Anfrage wird nicht vollautomatisch an alle Creator verschickt, sondern von UGC VZ weiterbearbeitet.',
        },
      },
      {
        '@type': 'Question',
        name: 'Ist die UGC Creator Suche kostenlos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ja. Die Suche und erste Anfrage ueber UGC VZ ist kostenlos. Optional kann bei groesseren Kampagnen Agentur-Unterstuetzung angefragt werden.',
        },
      },
      {
        '@type': 'Question',
        name: 'Welche Informationen sollte eine Brand angeben?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Hilfreich sind Produkt, Branche, Zielgruppe, Plattform, Content-Format, Budgetrahmen, Timing und gewuenschte Nutzungsrechte.',
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <BreadcrumbSchema items={breadcrumbs} />
      <JsonLdScript data={serviceSchema} />
      <JsonLdScript data={faqSchema} />

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
            ['370+ echte Creator', 'Die Datenbank besteht aus echten UGC Creatorn, nicht aus synthetischen Platzhalterprofilen.'],
            ['Besser als kalte DMs', 'Statt endlos Instagram-Profile zu pruefen, startest du mit einer klaren Kampagnenbeschreibung.'],
            ['Fuer echte Kampagnen', 'Geeignet fuer Produktvideos, Testimonials, Social Ads, Launches, E-Commerce und lokale Brand-Aktivierungen.'],
          ].map(([title, copy]) => (
            <div key={title} className="bg-gray-900/40 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-3 text-emerald-300">{title}</h2>
              <p className="text-gray-300 leading-relaxed">{copy}</p>
            </div>
          ))}
        </section>

        <section className="max-w-6xl mx-auto mb-16">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
            <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-8">
              <h2 className="text-3xl font-bold mb-6">Was passiert nach der Creator-Auswahl?</h2>
              <div className="space-y-5">
                {[
                  ['1', 'Demand eingeben', 'Du beschreibst kurz Produkt, Zielgruppe, Plattform und Content-Wunsch.'],
                  ['2', 'Creator-Liste ansehen', 'UGC VZ interpretiert deine Suchanfrage mit KI und zeigt passende Profilvorschlaege. Die Auswahl bleibt deine Entscheidung.'],
                  ['3', 'E-Mail erhalten', 'Du bekommst eine Bestaetigung mit den ausgewaehlten Creatorn und verfuegbaren Kontakt-/Social-Daten.'],
                  ['4', 'Direkt starten', 'Du kontaktierst die Creator direkt oder holst optional Support fuer Briefing, Vertrag und Kampagnen-Setup dazu.'],
                ].map(([step, title, copy]) => (
                  <div key={step} className="flex gap-4">
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">{step}</div>
                    <div>
                      <h3 className="font-bold text-white">{title}</h3>
                      <p className="text-gray-300 leading-relaxed">{copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-4 text-emerald-300">Warum ist das kostenlos?</h2>
              <p className="text-gray-200 leading-relaxed mb-4">
                UGC VZ ist als niedrigschwelliger Einstieg gedacht: Brands sollen echte Creator entdecken koennen, ohne direkt einen Retainer oder eine Plattform-Lizenz zu buchen.
              </p>
              <p className="text-gray-200 leading-relaxed">
                Wenn aus einer Anfrage eine groessere Kampagne wird, kann optional Unterstuetzung durch das Team hinter UGC VZ sinnvoll sein. Die erste Suche bleibt davon unabhaengig.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto mb-16 bg-gray-900/40 border border-gray-800 rounded-lg p-8">
          <h2 className="text-3xl font-bold mb-4">KI, Datenschutz und Auswahl</h2>
          <div className="grid md:grid-cols-3 gap-5 text-gray-300">
            <div className="bg-black/30 border border-gray-800 rounded-lg p-5">
              <h3 className="font-bold text-emerald-300 mb-2">Nur Suchhilfe</h3>
              <p>Die KI versteht deine Anfrage und hilft bei der Sortierung. Sie entscheidet nicht automatisch, welcher Creator einen Auftrag bekommt.</p>
            </div>
            <div className="bg-black/30 border border-gray-800 rounded-lg p-5">
              <h3 className="font-bold text-emerald-300 mb-2">Datensparsam</h3>
              <p>An den KI-Anbieter wird nur deine Suchanfrage gesendet. Creator-Profile werden serverseitig in UGC VZ gematcht.</p>
            </div>
            <div className="bg-black/30 border border-gray-800 rounded-lg p-5">
              <h3 className="font-bold text-emerald-300 mb-2">Kontakt nach Auswahl</h3>
              <p>Kontakt- und Social-Daten erhaeltst du nur fuer die Creator, die du bewusst fuer deine Anfrage auswaehlst.</p>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto mb-16 bg-gray-900/40 border border-gray-800 rounded-lg p-8">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 items-start">
            <div>
              <h2 className="text-3xl font-bold mb-4">Weniger Overhead fuer dein Team</h2>
              <p className="text-gray-300 leading-relaxed">
                Du kannst die Creator direkt kontaktieren. Wenn du aber keine Zeit fuer Koordination, Briefing, Feedback und Rechteklaerung hast, kann UGC VZ die Abwicklung optional uebernehmen.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                'Creator-Koordination und Verfuegbarkeit',
                'Briefing, Skript und Feedback-Schleifen',
                'Nutzungsrechte, Timing und Asset-Uebergabe',
                'Optional Produktion/Filming und Kampagnen-Setup',
                'KI-UGC oder hybride Creator/KI-Setups fuer schnelle Creative-Tests',
              ].map((item) => (
                <div key={item} className="bg-black/30 border border-gray-800 rounded-lg p-4 text-gray-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
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

        <section className="max-w-4xl mx-auto mt-16">
          <h2 className="text-3xl font-bold mb-6 text-center">Haeufige Fragen von Brands</h2>
          <div className="space-y-4">
            {[
              ['Bekomme ich die Kontaktinfos per E-Mail?', 'Ja. Nach der Anfrage senden wir dir eine E-Mail mit deiner Creator-Auswahl und den verfuegbaren Kontakt- oder Social-Daten aus dem Profil.'],
              ['Werden Creator automatisch angeschrieben?', 'Standardmaessig bekommst du die Kontaktinfos und kannst direkt starten. Eine automatische Creator-Mail ist technisch vorbereitet, wird aber nur genutzt, wenn die Creator-Daten und Einwilligungen dafuer sauber sind.'],
              ['Kann ich auch eine UGC Agentur anfragen?', 'Ja. Wenn du mehr brauchst als reine Creator-Auswahl, kannst du in der Projektbeschreibung optional Strategie, Briefing, Produktion oder Kampagnensteuerung erwaehnen.'],
              ['Welche Branchen funktionieren?', 'Besonders gut funktionieren E-Commerce, Beauty, Food, Tech, Fashion, Apps, lokale Angebote und erklaerungsbeduerftige Produkte.'],
            ].map(([question, answer]) => (
              <details key={question} className="bg-gray-900/40 border border-gray-800 rounded-lg p-5">
                <summary className="cursor-pointer font-semibold text-white">{question}</summary>
                <p className="text-gray-300 mt-3 leading-relaxed">{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto mt-16">
          <h2 className="text-3xl font-bold mb-6 text-center">Weitere Einstiege fuer Brands</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/brands/ugc-creator-finden" className="bg-gray-900/40 border border-gray-800 rounded-lg p-5 hover:border-emerald-600 transition-colors">
              <h3 className="font-bold text-emerald-300 mb-2">UGC Creator finden</h3>
              <p className="text-gray-300 text-sm">Direkt in die Creator-Suche starten.</p>
            </Link>
            <Link href="/brands/ugc-creator-preise" className="bg-gray-900/40 border border-gray-800 rounded-lg p-5 hover:border-emerald-600 transition-colors">
              <h3 className="font-bold text-emerald-300 mb-2">UGC Creator Preise</h3>
              <p className="text-gray-300 text-sm">Budgetrahmen und Preislogik einschaetzen.</p>
            </Link>
            <Link href="/brands/ugc-creator-deutschland" className="bg-gray-900/40 border border-gray-800 rounded-lg p-5 hover:border-emerald-600 transition-colors">
              <h3 className="font-bold text-emerald-300 mb-2">UGC Creator Deutschland</h3>
              <p className="text-gray-300 text-sm">Creator fuer deutsche Kampagnen finden.</p>
            </Link>
            <Link href="/brands/ugc-creator-beauty" className="bg-gray-900/40 border border-gray-800 rounded-lg p-5 hover:border-emerald-600 transition-colors">
              <h3 className="font-bold text-emerald-300 mb-2">Beauty UGC Creator</h3>
              <p className="text-gray-300 text-sm">Creator fuer Kosmetik und Pflege finden.</p>
            </Link>
            <Link href="/brands/ugc-plattform-deutschland" className="bg-gray-900/40 border border-gray-800 rounded-lg p-5 hover:border-emerald-600 transition-colors">
              <h3 className="font-bold text-emerald-300 mb-2">UGC Plattform Deutschland</h3>
              <p className="text-gray-300 text-sm">UGC VZ als Plattform fuer beide Seiten.</p>
            </Link>
            <Link href="/brands/ugc-agentur-berlin" className="bg-gray-900/40 border border-gray-800 rounded-lg p-5 hover:border-emerald-600 transition-colors">
              <h3 className="font-bold text-emerald-300 mb-2">UGC Agentur Berlin</h3>
              <p className="text-gray-300 text-sm">Plattform oder Agentur-Support einordnen.</p>
            </Link>
            <Link href="/brands/ugc-agentur-hamburg" className="bg-gray-900/40 border border-gray-800 rounded-lg p-5 hover:border-emerald-600 transition-colors">
              <h3 className="font-bold text-emerald-300 mb-2">UGC Agentur Hamburg</h3>
              <p className="text-gray-300 text-sm">Creator-Suche fuer Hamburg einordnen.</p>
            </Link>
            <Link href="/brands/ugc-agentur-muenchen" className="bg-gray-900/40 border border-gray-800 rounded-lg p-5 hover:border-emerald-600 transition-colors">
              <h3 className="font-bold text-emerald-300 mb-2">UGC Agentur Muenchen</h3>
              <p className="text-gray-300 text-sm">Creator-Suche fuer Muenchen einordnen.</p>
            </Link>
            <Link href="/brands/ugc-vertrag-vorlage" className="bg-gray-900/40 border border-gray-800 rounded-lg p-5 hover:border-emerald-600 transition-colors">
              <h3 className="font-bold text-emerald-300 mb-2">UGC Vertrag Vorlage</h3>
              <p className="text-gray-300 text-sm">Briefing- und Vertrags-Checkliste fuer Creator Deals.</p>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

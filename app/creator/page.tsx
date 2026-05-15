import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import JsonLdScript from '../wissen/[slug]/JsonLdScript';

const creatorFormUrl = 'https://tally.so/r/w25dBp';

export const metadata: Metadata = {
  title: 'UGC Creator anmelden',
  description: 'Melde dich kostenlos als UGC Creator bei UGC VZ an. Hinterlege Portfolio, Themen, Social-Links und werde fuer passende Brand-Anfragen sichtbar.',
  keywords: 'UGC Creator anmelden, UGC Creator werden, UGC Creator Deutschland, UGC Creator Jobs, UGC Portfolio, UGC Auftraege finden',
  alternates: {
    canonical: 'https://ugc-vz.de/creator',
  },
  openGraph: {
    title: 'UGC Creator anmelden | UGC VZ',
    description: 'Kostenlose Registrierung fuer UGC Creator in Deutschland.',
    url: 'https://ugc-vz.de/creator',
    siteName: 'UGC VZ',
    locale: 'de_DE',
    type: 'website',
  },
};

export default function CreatorPage() {
  const breadcrumbs = [
    { name: 'Home', url: 'https://ugc-vz.de' },
    { name: 'UGC Creator anmelden', url: 'https://ugc-vz.de/creator' },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Ist die Anmeldung als UGC Creator kostenlos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ja. Die Registrierung bei UGC VZ ist fuer Creator kostenlos. Es gibt keine Profilgebuehr und keine Pflicht, ueber UGC VZ abzurechnen.',
        },
      },
      {
        '@type': 'Question',
        name: 'Was brauche ich fuer ein gutes UGC Creator Profil?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Hilfreich sind Portfolio-Beispiele, Social-Links, Themenbereiche, bevorzugte Branchen, Standort, Sprachen und grobe Preisvorstellungen.',
        },
      },
      {
        '@type': 'Question',
        name: 'Brauche ich viele Follower, um UGC Creator zu werden?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Nein. Bei UGC geht es vor allem um authentische, nutzbare Inhalte fuer Marken, nicht zwingend um grosse Reichweite.',
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <BreadcrumbSchema items={breadcrumbs} />
      <JsonLdScript data={faqSchema} />

      <header className="py-6 px-4 sm:px-8 md:px-16 lg:px-24">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image src="/ugc-vz-logo.webp" alt="UGC VZ" width={32} height={32} className="mr-2" priority />
            <span className="text-xl font-bold gradient-text">UGC VZ</span>
          </Link>
          <Link href="/brands" className="text-sm font-medium text-gray-300 hover:text-white">
            Fuer Brands
          </Link>
        </div>
      </header>

      <main className="px-4 sm:px-8 md:px-16 lg:px-24 pb-24">
        <section className="max-w-5xl mx-auto py-16 text-center">
          <p className="text-emerald-300 font-semibold mb-4">Kostenloses Creator-Verzeichnis</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Als <span className="gradient-text">UGC Creator</span> anmelden
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-10">
            Trage dich bei UGC VZ ein, wenn du Content fuer Marken produzierst. Dein Profil hilft uns, dich bei passenden Anfragen von Brands, Agenturen und Marketing-Teams zu beruecksichtigen.
          </p>
          <Link
            href={creatorFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-semibold py-4 px-8 rounded-lg transition-all"
          >
            Fragebogen ausfuellen
          </Link>
        </section>

        <section className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 mb-16">
          {[
            ['Portfolio zeigen', 'Verlinke Beispiele, Shortform-Videos, Produktclips, Testimonials oder andere UGC-Arbeiten.'],
            ['Passende Brands bekommen', 'Je klarer Themen, Stil, Sprache und Standort sind, desto besser passen spaetere Anfragen.'],
            ['Direkt verhandeln', 'UGC VZ ist der Einstieg. Preise, Rechte und Abrechnung klaerst du direkt mit dem Unternehmen.'],
          ].map(([title, copy]) => (
            <div key={title} className="bg-gray-900/40 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-3 text-emerald-300">{title}</h2>
              <p className="text-gray-300 leading-relaxed">{copy}</p>
            </div>
          ))}
        </section>

        <section className="max-w-4xl mx-auto bg-gray-900/40 border border-gray-800 rounded-lg p-8">
          <h2 className="text-3xl font-bold mb-6">Was sollte in deinen Fragebogen?</h2>
          <ul className="space-y-3 text-gray-200">
            <li>Profilbild, Name, Standort und bevorzugte Sprachen</li>
            <li>Social-Links und Portfolio-Beispiele</li>
            <li>Themen wie Beauty, Food, Tech, Family, Fitness, Fashion oder B2B</li>
            <li>Content-Formate: Reels, TikToks, Produktvideos, Voiceover, Fotos, Testimonials</li>
            <li>Grobe Preisrange, Nutzungsrechte und Verfuegbarkeit</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

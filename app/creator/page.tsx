import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import JsonLdScript from '../wissen/[slug]/JsonLdScript';
import CreatorRegistrationForm from './CreatorRegistrationForm';

const creatorFormUrl = '#creator-form';

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

export default function CreatorPage({
  searchParams,
}: {
  searchParams?: { verified?: string; invalid?: string; error?: string };
}) {
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
    <div className="min-h-screen bg-white text-ink">
      <BreadcrumbSchema items={breadcrumbs} />
      <JsonLdScript data={faqSchema} />

      <header className="py-6 px-4 sm:px-8 md:px-16 lg:px-24">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image src="/ugc-vz-logo.webp" alt="UGC VZ" width={32} height={32} className="mr-2" priority />
            <span className="text-xl font-bold gradient-text">UGC VZ</span>
          </Link>
          <Link href="/brands" className="text-sm font-medium text-ink-soft hover:text-ink">
            Fuer Brands
          </Link>
        </div>
      </header>

      <main className="px-4 sm:px-8 md:px-16 lg:px-24 pb-24">
        <section className="max-w-5xl mx-auto py-16 text-center">
          <p className="text-geo-violet font-semibold mb-4">Kostenloses Creator-Verzeichnis</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Als <span className="gradient-text">UGC Creator</span> anmelden
          </h1>
          <p className="text-xl text-ink-soft max-w-3xl mx-auto leading-relaxed mb-10">
            Trage dich bei UGC VZ ein, wenn du Content fuer Marken produzierst. Dein Profil hilft uns, dich bei passenden Anfragen von Brands, Agenturen und Marketing-Teams zu beruecksichtigen.
          </p>
          <p className="text-sm text-ink-soft max-w-2xl mx-auto leading-relaxed mb-8">
            Lege dein Profil direkt bei UGC VZ an. Öffentliche Profilangaben helfen Brands bei der Auswahl; deine E-Mail bleibt privat und wird nur für Bestätigung und konkrete Projektanfragen verwendet. Eine Löschung oder Korrektur ist jederzeit möglich.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={creatorFormUrl}
              className="inline-flex bg-geo-violet hover:bg-geo-violet-soft text-white font-semibold py-4 px-8 rounded-lg transition-all"
            >
              Kostenloses Profil anlegen
            </Link>
            <Link
              href="/konto"
              className="inline-flex border border-geo-violet text-geo-violet hover:bg-geo-violet/5 font-semibold py-4 px-8 rounded-lg transition-all"
            >
              Mein Profil bearbeiten
            </Link>
          </div>
        </section>

        <CreatorRegistrationForm
          verified={searchParams?.verified === '1'}
          invalid={searchParams?.invalid === '1'}
          failed={searchParams?.error === '1'}
        />

        <section className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 mb-16">
          {[
            ['Portfolio zeigen', 'Verlinke Beispiele, Shortform-Videos, Produktclips, Testimonials oder andere UGC-Arbeiten.'],
            ['Passende Brands bekommen', 'Je klarer Themen, Stil, Sprache und Standort sind, desto besser passen spaetere Anfragen.'],
            ['Direkt verhandeln', 'UGC VZ ist der Einstieg. Preise, Rechte und Abrechnung klaerst du direkt mit dem Unternehmen.'],
          ].map(([title, copy]) => (
            <div key={title} className="surface-card rounded-lg p-6">
              <h2 className="text-xl font-bold mb-3 text-geo-violet">{title}</h2>
              <p className="text-ink-soft leading-relaxed">{copy}</p>
            </div>
          ))}
        </section>

        <section className="max-w-6xl mx-auto mb-16">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-start">
            <div className="surface-card rounded-lg p-8">
              <h2 className="text-3xl font-bold mb-5 text-ink">So kann dein Profil wirken</h2>
              <p className="text-ink-soft leading-relaxed mb-6">
                Brands entscheiden schnell. Ein gutes UGC Profil zeigt nicht nur Reichweite, sondern Stil, Themen, Beispiele und klare Kontaktpunkte.
              </p>
              <Link
                href={creatorFormUrl}
                className="inline-flex bg-geo-violet hover:bg-geo-violet-soft text-white font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Profil anlegen
              </Link>
            </div>
            <div className="bg-surface-2 text-ink rounded-lg p-6 shadow-2xl">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-16 h-16 rounded-full bg-geo-violet" />
                <div>
                  <h3 className="text-xl font-bold">Beispiel Creator Profil</h3>
                  <p className="text-gray-600">Beauty, Food und Produktvideos | Deutsch & Englisch</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 mb-5">
                {['TikTok/Reels', 'Voiceover', 'Produktdemo'].map((item) => (
                  <span key={item} className="bg-geo-green/10 text-geo-violet border border-geo-green/20 rounded-md px-3 py-2 text-sm font-medium">
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-5">
                Kurze, authentische Produktclips fuer DTC Brands. Erfahrung mit Hook-Varianten, Testimonials und Ad Creatives.
              </p>
              <div className="border-t border-gray-200 pt-4 text-sm text-gray-600">
                Portfolio-Links, Preisrange, Standort, Nutzungsrechte und Verfuegbarkeit machen die Anfrage fuer Brands leichter.
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto surface-card rounded-lg p-8">
          <h2 className="text-3xl font-bold mb-6 text-ink">Was sollte in deinen Fragebogen?</h2>
          <ul className="space-y-3 text-ink-soft">
            <li>Profilbild, Name, Standort und bevorzugte Sprachen</li>
            <li>Social-Links und Portfolio-Beispiele</li>
            <li>Themen wie Beauty, Food, Tech, Family, Fitness, Fashion oder B2B</li>
            <li>Content-Formate: Reels, TikToks, Produktvideos, Voiceover, Fotos, Testimonials</li>
            <li>Grobe Preisrange, Nutzungsrechte und Verfuegbarkeit</li>
          </ul>
        </section>

        <section className="max-w-4xl mx-auto mt-16">
          <h2 className="text-3xl font-bold mb-6 text-center text-ink">Mehr fuer Creator</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/creator/ugc-creator-werden" className="surface-card rounded-lg p-5 hover:border-geo-violet transition-colors">
              <h3 className="font-bold text-geo-violet mb-2">UGC Creator werden</h3>
              <p className="text-ink-soft">Was du brauchst, wie du startest und wie du dein Profil besser machst.</p>
            </Link>
            <Link href="/creator/ugc-creator-jobs" className="surface-card rounded-lg p-5 hover:border-geo-violet transition-colors">
              <h3 className="font-bold text-geo-violet mb-2">UGC Creator Jobs</h3>
              <p className="text-ink-soft">Wie Brands dich finden und welche Angaben deine Chancen erhoehen.</p>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

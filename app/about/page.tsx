import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import ResponsiveCTAButton from '@/src/components/ResponsiveCTAButton';
import LogoImage from '../components/LogoImage';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import HomePageSchema from '../components/HomePageSchema';

export const metadata: Metadata = {
  title: 'Über uns – Das kostenlose Creator-Verzeichnis',
  description: 'UGC-VZ ist mehr als nur ein Verzeichnis – wir sind die Brücke zwischen talentierten UGC Creators und Unternehmen. Komplett kostenlos für beide Seiten.',
  keywords: 'UGC VZ, Über uns, Creator Verzeichnis, famefact, Social Media Agentur, User Generated Content',
  openGraph: {
    title: 'Über uns – Das kostenlose Creator-Verzeichnis',
    description: 'Wir demokratisieren User Generated Content. Jeder Creator verdient eine Chance, entdeckt zu werden.',
    url: 'https://ugc-vz.de/about',
    siteName: 'UGC VZ',
    locale: 'de_DE',
    type: 'website',
    images: [
      {
        url: 'https://ugc-vz.de/ugc-vz-logo.webp',
        width: 1200,
        height: 630,
        alt: 'UGC VZ - Über uns',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Über UGC VZ - Das kostenlose Creator-Verzeichnis',
    description: 'Wir demokratisieren User Generated Content. Komplett kostenlos für Creator und Unternehmen.',
    images: ['https://ugc-vz.de/ugc-vz-logo.webp'],
    creator: '@Ugc_Vz',
  },
  alternates: {
    canonical: 'https://ugc-vz.de/about',
  },
};

const team = [
  { slug: 'tobias', name: 'Tobias', role: 'Gründer & CEO', bio: 'Treibt die Vision von UGC-VZ voran: ein Verzeichnis, das Marken und authentische Creator ohne Umwege zusammenbringt.' },
  { slug: 'gorden', name: 'Gorden', role: 'Co-Founder', bio: 'Verantwortet Partnerschaften und sorgt dafür, dass UGC-VZ für Creator wie für Brands kostenlos bleibt.' },
  { slug: 'robert', name: 'Robert', role: 'Lead Creator Relations', bio: 'Betreut die Creator-Community und hilft Talenten, mit dem richtigen Profil entdeckt zu werden.' },
  { slug: 'marcel', name: 'Marcel', role: 'Head of Performance & UGC-Ads', bio: 'Weiß, welcher Creator-Content auf Paid Social tatsächlich konvertiert – und welcher nur schön aussieht.' },
  { slug: 'patrick', name: 'Patrick', role: 'Senior Campaign Manager', bio: 'Bringt Brands und Creator in Projekten zusammen und hält Kampagnen zuverlässig on track.' },
  { slug: 'jan', name: 'Jan', role: 'Head of Tech & Plattform', bio: 'Hält das Verzeichnis schnell, stabil und für beide Seiten einfach bedienbar.' },
  { slug: 'thomas', name: 'Thomas', role: 'Head of Sound', bio: 'Kümmert sich darum, dass UGC-Videos auch akustisch im Kopf hängen bleiben.' },
];

export default function AboutPage() {
  const breadcrumbs = [
    { name: 'Home', url: 'https://ugc-vz.de' },
    { name: 'Über uns', url: 'https://ugc-vz.de/about' }
  ];

  return (
    <div className="min-h-screen bg-white text-ink">
      {/* Schema.org structured data */}
      <HomePageSchema />
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

      {/* Main Content */}
      <main className="px-4 sm:px-8 md:px-16 lg:px-24 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Das kostenlose <span className="gradient-text">Creator-Verzeichnis</span>, das echte Connections schafft
            </h1>
            <p className="text-xl text-ink-soft max-w-3xl mx-auto leading-relaxed">
              Wir glauben: Authentischer Content entsteht, wenn die richtigen Menschen zusammenfinden.
            </p>
          </div>

          {/* Introduction */}
          <div className="surface-card rounded-2xl p-8 mb-12">
            <p className="text-lg text-ink-soft leading-relaxed">
              UGC-VZ ist mehr als nur ein Verzeichnis – wir sind die Brücke zwischen talentierten UGC Creators und Unternehmen,
              die echte Geschichten erzählen wollen. <span className="text-geo-violet font-semibold">Komplett kostenlos. Für beide Seiten.</span>
            </p>
          </div>

          {/* Mission Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-center">
              <span className="gradient-text">Unsere Mission</span>
            </h2>
            <div className="surface-card rounded-2xl p-8">
              <p className="text-lg text-ink-soft leading-relaxed">
                Wir demokratisieren User Generated Content. Jeder Creator verdient eine Chance, entdeckt zu werden.
                Jedes Unternehmen – egal ob Startup oder etablierte Marke – sollte Zugang zu authentischem Content haben,
                ohne Umwege über teure Agenturen oder komplizierte Plattformen.
              </p>
            </div>
          </section>

          {/* Why UGC-VZ Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Warum <span className="gradient-text">UGC-VZ</span>?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* For Creators */}
              <div className="surface-card rounded-2xl p-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-geo-violet rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-geo-violet">Für Creators</h3>
                </div>
                <p className="text-ink-soft leading-relaxed">
                  Zeig dich, wie du bist. Erstelle dein kostenloses Profil, präsentiere dein Portfolio und werde von Unternehmen entdeckt,
                  die genau nach deinem Style suchen. Kein Algorithmus, keine versteckten Kosten – nur echte Opportunities.
                </p>
              </div>

              {/* For Companies */}
              <div className="surface-card rounded-2xl p-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-geo-violet rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-geo-violet">Für Unternehmen</h3>
                </div>
                <p className="text-ink-soft leading-relaxed">
                  Finde den perfekten Creator für dein Projekt. Durchstöbere Profile, entdecke verschiedene Styles und knüpfe direkte Kontakte.
                  Ob du ein kleines Budget oder große Kampagnen planst – hier findest du den richtigen Match.
                </p>
              </div>
            </div>
          </section>

          {/* Background Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-center">
              Unser <span className="gradient-text">Background</span>
            </h2>
            <div className="surface-card rounded-2xl p-8">
              <p className="text-lg text-ink-soft leading-relaxed mb-4">
                UGC-VZ wurde von <span className="text-geo-violet font-semibold">famefact</span> ins Leben gerufen – einer der führenden Social Media Agenturen Deutschlands mit über 15 Jahren Erfahrung.
                Wir wissen aus erster Hand, wie kraftvoll authentischer User Generated Content ist.
              </p>
              <p className="text-lg text-ink-soft leading-relaxed">
                Gleichzeitig sehen wir täglich, dass viele großartige Projekte an unserem Agentur-Desk vorbeigehen, weil sie &ldquo;zu klein&rdquo; erscheinen.
                <span className="text-geo-violet font-semibold"> Das wollten wir ändern.</span>
              </p>
            </div>
          </section>

          {/* Team Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-4 text-center">
              Das Team hinter <span className="gradient-text">UGC-VZ</span>
            </h2>
            <p className="text-lg text-ink-soft leading-relaxed text-center max-w-3xl mx-auto mb-10">
              Menschen aus der famefact-Agentur, die täglich mit Creators und Brands arbeiten – und genau wissen,
              was authentischen User Generated Content ausmacht.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {team.map((member) => (
                <div key={member.slug} className="surface-card rounded-2xl overflow-hidden flex flex-col">
                  <div className="relative aspect-[4/5] w-full bg-geo-violet/5">
                    <Image
                      src={`/team/${member.slug}.webp`}
                      alt={`${member.name} – ${member.role} bei UGC-VZ`}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-ink">{member.name}</h3>
                    <p className="text-sm font-semibold text-geo-violet mb-2">{member.role}</p>
                    <p className="text-sm text-ink-soft leading-relaxed">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Philosophy Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Unsere <span className="gradient-text">Philosophie</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Free Forever */}
              <div className="surface-card rounded-2xl p-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-geo-violet rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-geo-violet">Kostenlos bleibt kostenlos</h3>
                </div>
                <p className="text-ink-soft leading-relaxed">
                  Wir verdienen kein Geld mit UGC-VZ. Stattdessen investieren wir in die Creator-Community und helfen dabei,
                  ein Ökosystem zu schaffen, in dem authentischer Content gedeihen kann. Wenn du später unsere Agentur-Services brauchst – großartig.
                  Wenn nicht – auch großartig.
                </p>
              </div>

              {/* Quality over Quantity */}
              <div className="surface-card rounded-2xl p-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-geo-violet rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-geo-violet">Qualität vor Quantität</h3>
                </div>
                <p className="text-ink-soft leading-relaxed">
                  Wir glauben an echte Connections, nicht an oberflächliche Matches. Jedes Profil wird gepflegt,
                  jede Anfrage hat das Potenzial für eine langfristige Partnerschaft.
                </p>
              </div>
            </div>
          </section>

          {/* Join the Movement Section */}
          <section className="mb-16">
            <div className="surface-card rounded-2xl p-12 text-center">
              <h2 className="text-3xl font-bold mb-6">
                Join the <span className="gradient-text">Movement</span>
              </h2>
              <p className="text-lg text-ink-soft leading-relaxed mb-8 max-w-3xl mx-auto">
                UGC-VZ ist mehr als eine Plattform – es ist eine Community von Creators und Brands, die authentische Geschichten schätzen.
                Hier entstehen Partnerships auf Augenhöhe, wo kreative Visionen auf unternehmerische Ziele treffen.
              </p>
              <p className="text-xl text-ink-soft leading-relaxed mb-8">
                <span className="text-geo-violet font-semibold">Ready to connect?</span> Dann bist du hier richtig.
              </p>
              <p className="text-2xl font-bold gradient-text">
                Willkommen bei UGC-VZ – wo authentischer Content zuhause ist.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Link
                  href="/"
                  className="bg-geo-violet hover:bg-geo-violet-soft text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105"
                >
                  Creator finden
                </Link>
                <Link
                  href="/creator#creator-form"
                  className="border border-geo-violet text-geo-violet hover:bg-geo-violet hover:text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105"
                >
                  Creator werden
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

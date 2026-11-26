import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import HomePageSchema from '../components/HomePageSchema';
import FloFounderCard from '../components/home/FloFounderCard';

export const metadata: Metadata = {
  title: 'Über uns',
  description:
    'Wir kommen aus der Social-Media-Agentur famefact in Berlin. Deshalb haben wir UGC VZ gebaut: klare Abläufe für Creator-Kampagnen nach Views in DACH.',
  keywords: 'UGC VZ, Über uns, famefact, track by track GmbH, Creator Kampagnen, Berlin',
  openGraph: {
    title: 'Über uns | UGC VZ',
    description:
      'Wir kommen aus der Agentur famefact. Deshalb haben wir UGC VZ gebaut: Brief, Posting, Prüfung, Abrechnung.',
    url: 'https://ugc-vz.de/about',
    siteName: 'UGC VZ',
    locale: 'de_DE',
    type: 'website',
    images: [
      {
        url: 'https://ugc-vz.de/ugc-vz-logo.webp',
        width: 1200,
        height: 630,
        alt: 'UGC VZ Team aus Berlin',
      },
    ],
  },
  alternates: {
    canonical: 'https://ugc-vz.de/about',
  },
};

const TEAM: Array<{
  slug: string;
  name: string;
  role: string;
  bio: string;
  hasPhoto: boolean;
  initials?: string;
}> = [
  {
    slug: 'tobias',
    name: 'Tobias Sander',
    role: 'Gründer & Geschäftsführer',
    bio: 'Führt die track by track GmbH und famefact in Berlin und verantwortet die strategische Entwicklung von UGC VZ.',
    hasPhoto: true,
  },
  {
    slug: 'gorden',
    name: 'Gorden',
    role: 'Co-Founder',
    bio: 'Verantwortet Produkt, Plattform-Architektur und Partnerschaften bei UGC VZ.',
    hasPhoto: true,
  },
  {
    slug: 'florian',
    name: 'Florian Runge',
    role: 'Brand Partnerships',
    bio: 'Direkter Ansprechpartner für Marken, Pilotkampagnen nach Views, TikTok Shop und laufende Creator-Programme.',
    hasPhoto: false,
    initials: 'FR',
  },
  {
    slug: 'robert',
    name: 'Robert',
    role: 'Lead Creator Relations',
    bio: 'Betreut die Creator-Community und unterstützt Profile bei Kampagnen, Verifizierung und Qualität.',
    hasPhoto: true,
  },
  {
    slug: 'marcel',
    name: 'Marcel',
    role: 'Head of Performance & UGC-Ads',
    bio: 'Prüft, welche Hooks und Creator-Formate auf TikTok, Reels und Paid Social wirklich funktionieren.',
    hasPhoto: true,
  },
  {
    slug: 'patrick',
    name: 'Patrick',
    role: 'Senior Campaign Manager',
    bio: 'Begleitet Marken und Creator bei Briefings, Abläufen und pünktlicher Kampagnen-Umsetzung.',
    hasPhoto: true,
  },
  {
    slug: 'jan',
    name: 'Jan',
    role: 'Head of Tech & Plattform',
    bio: 'Hält Suche, Konten, Tracking und Reporting schnell, stabil und einfach bedienbar.',
    hasPhoto: true,
  },
  {
    slug: 'thomas',
    name: 'Thomas',
    role: 'Head of Sound',
    bio: 'Kümmert sich darum, dass Videos auch bei Sprache, Ton und Sounddesign sauber sitzen.',
    hasPhoto: true,
  },
];

export default function AboutPage() {
  const breadcrumbs = [
    { name: 'Home', url: 'https://ugc-vz.de' },
    { name: 'Über uns', url: 'https://ugc-vz.de/about' },
  ];

  return (
    <div className="min-h-screen bg-white text-[#121212]">
      <HomePageSchema />
      <BreadcrumbSchema items={breadcrumbs} />

      {/* Hero (Spec 8.2 about.page) */}
      <section aria-labelledby="about-hero-title" className="bg-[#F7F6F2] px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-[#6C2BD9]">Über UGC VZ · Berlin</p>
            <h1
              id="about-hero-title"
              className="mt-2 font-display text-[38px] font-bold leading-[42px] tracking-[-0.02em] text-[#121212] sm:text-5xl sm:leading-[1.08] lg:text-[60px] lg:leading-[66px]"
            >
              Wir kommen aus der Agentur. Deshalb haben wir UGC VZ gebaut.
            </h1>
            <p className="mt-5 text-base leading-7 text-[#5C5A55] sm:text-lg sm:leading-8">
              Bei famefact arbeiten wir seit Jahren mit Marken und Creatorn. Wir haben gesehen, wie viel Zeit für Mails, Absprachen und Link-Sammeln draufgeht. UGC VZ macht daraus einen klaren Ablauf: Brief, Posting, Prüfung, Abrechnung.
            </p>
          </div>

          <div className="mt-10 rounded-[20px] border border-[#E4E1D8] bg-white p-6 shadow-card sm:p-8">
            <h2 className="font-display text-xl font-bold text-[#121212]">Wie wir arbeiten</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5C5A55] sm:text-base">
              UGC VZ ist ein Produkt der track by track GmbH in Berlin, dem Team hinter der Social-Media-Agentur{' '}
              <a
                href="https://famefact.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#121212] underline underline-offset-4 hover:text-[#6C2BD9]"
              >
                famefact
              </a>
              . Marken starten ohne Abo und mit fester Budget-Obergrenze. Creator zahlen 0 % Gebühr und sehen vor jedem Dreh, was eine Kampagne pro 1.000 Views zahlt. Wenn ein Team darüber hinaus strategische Agentur-Begleitung braucht, sind wir direkt ansprechbar.
            </p>
          </div>
        </div>
      </section>

      {/* Prominenter Ansprechpartner: Florian Runge */}
      <FloFounderCard />

      {/* Team-Raster */}
      <section aria-labelledby="about-team-title" className="bg-[#F7F6F2] px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[#5C5A55]">track by track GmbH · famefact</p>
            <h2
              id="about-team-title"
              className="mt-1 font-display text-[30px] font-bold leading-[34px] tracking-[-0.02em] text-[#121212] sm:text-[44px] sm:leading-[48px]"
            >
              Die Menschen dahinter
            </h2>
            <p className="mt-3 text-base leading-7 text-[#5C5A55]">
              Das Team aus Berlin, das täglich mit Marken, Performance-Teams und Creatorn in Deutschland, Österreich und der Schweiz arbeitet.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((member) => (
              <article
                key={member.slug}
                className="flex flex-col overflow-hidden rounded-[20px] border border-[#E4E1D8] bg-white shadow-card"
              >
                <div className="relative aspect-[4/5] w-full bg-[#F7F6F2]">
                  {member.hasPhoto ? (
                    <Image
                      src={`/team/${member.slug}.webp`}
                      alt={`${member.name}, ${member.role} bei UGC VZ`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-[#121212] p-6 text-center text-[#F7F6F2]">
                      <span className="font-display text-4xl font-bold">{member.initials}</span>
                      <span className="mt-3 rounded-lg border border-white/20 px-2.5 py-1 text-[11px] text-[#F7F6F2]/75">
                        [PLATZHALTER: Foto Florian Runge 4:5]
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-lg font-bold text-[#121212]">{member.name}</h3>
                  <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-[#6C2BD9]">
                    {member.role}
                  </p>
                  <p className="mt-2.5 text-sm leading-6 text-[#5C5A55]">{member.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Abschluss-CTA */}
      <section className="bg-white px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-[1200px] rounded-[24px] bg-[#121212] px-6 py-14 text-center text-[#F7F6F2] sm:px-12">
          <h2 className="font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
            Fragen zu einer ersten Kampagne?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-base text-[#F7F6F2]/75">
            Schreib uns direkt nach Berlin oder starte dein kostenloses Marken-Konto in einer Minute.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="btn-press inline-flex min-h-[52px] items-center gap-2 rounded-full bg-[#F7F6F2] px-7 text-sm font-semibold text-[#121212] hover:opacity-90"
            >
              <span>Sprich mit uns</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/brand?tab=signup"
              className="btn-press inline-flex min-h-[52px] items-center rounded-full border border-white/25 px-7 text-sm font-semibold text-[#F7F6F2] hover:border-white/60"
            >
              Kampagne starten
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

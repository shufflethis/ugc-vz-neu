import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calendar, Check, Film, Repeat, TrendingUp } from 'lucide-react';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import JsonLdScript from '../wissen/[slug]/JsonLdScript';
import TrustElements from '../components/TrustElements';
import ViewBudgetCalculator from '../components/ViewBudgetCalculator';
import VerificationProofSection from '../components/home/VerificationProofSection';
import FloFounderCard from '../components/home/FloFounderCard';
import BudgetBar from '../components/motion/BudgetBar';
import { getActivePromo } from '../lib/platform-pricing';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Creator-Kampagnen nach Views für Marken',
  description:
    'Du legst fest, was dir 1.000 Views wert sind und wie viel du maximal ausgibst. Creator posten auf TikTok und Instagram. Geprüfte Views, feste Budget-Obergrenze, kein Abo.',
  keywords:
    'UGC Creator finden, Creator Kampagne nach Views, UGC Plattform Deutschland, UGC für Marken, TikTok Creator Kampagne, Instagram Reels UGC',
  alternates: {
    canonical: 'https://ugc-vz.de/brands',
  },
  openGraph: {
    title: 'Creator-Kampagnen nach Views für Marken | UGC VZ',
    description:
      'Feste Budget-Obergrenze, geprüfte Beiträge und Live-Report in einem Konto. Kein Abo.',
    url: 'https://ugc-vz.de/brands',
    siteName: 'UGC VZ',
    locale: 'de_DE',
    type: 'website',
  },
};

const BRAND_FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'Was kostet eine View-Kampagne auf UGC VZ?',
    a: 'Dein Marken-Konto ist kostenlos und es gibt kein Abo. Du legst Preis pro 1.000 Views und deine Budget-Obergrenze selbst fest. Im Budget sind regulär 15 % Servicegebühr enthalten.',
  },
  {
    q: 'Wie schützt mich die Budget-Obergrenze?',
    a: 'Jede View-Kampagne hat eine verbindliche Obergrenze. Sobald die geprüften Views dieses Budget erreichen, stoppt die Abrechnung automatisch. Mehr als dein Budget zahlst du nie.',
  },
  {
    q: 'Kann ich zusätzlich auch klassische Produktvideos beauftragen?',
    a: 'Ja. Neben View-Kampagnen kannst du Creator direkt für Produktvideos, Testimonials und Ad-Creatives mit klaren Nutzungsrechten beauftragen, auch mit Produktversand.',
  },
  {
    q: 'Welche Branchen funktionieren besonders gut?',
    a: 'Besonders stark laufen E-Commerce, Beauty, Food, Fashion, Fitness, Apps, Haustierprodukte, lokale Angebote und erklärungsbedürftige Marken in Deutschland, Österreich und der Schweiz.',
  },
];

const EXTRA_ACCORDIONS = [
  {
    title: 'Datenschutz und KI-Suche',
    body: 'Die KI hilft beim Verstehen deines Briefings und sortiert Creator nach 20 klaren Themenkategorien. An den KI-Anbieter wird nur deine Suchanfrage gesendet, niemals die Creator-Datenbank. Die finale Auswahl triffst immer du selbst.',
  },
  {
    title: 'Was famefact zusätzlich übernehmen kann',
    body: 'UGC VZ funktioniert komplett als Self-Service ohne Agenturpflicht. Wenn dein Team für größere Kampagnen Unterstützung bei Strategie, Skripting, Creator-Koordination oder Paid-Ads-Setup braucht, hilft dir auf Wunsch das Team von famefact in Berlin.',
  },
  {
    title: 'So schreibst du einen guten Brief',
    body: 'Nenne dein Produkt in einem klaren Satz, die Zielplattformen, drei kurze Pflichtpunkte für das Video (zum Beispiel Produkt im Bild, Rabattcode, Werbekennzeichnung) sowie deinen Preis pro 1.000 Views und die feste Budget-Obergrenze.',
  },
];

const BRAND_RESOURCE_LINKS = [
  { href: '/preise', label: 'Preise & Servicegebühr' },
  { href: '/brands/ugc-creator-finden', label: 'Creator-Pool Vorschau' },
  { href: '/brands/ugc-kosten-rechner', label: 'UGC Kosten Rechner' },
  { href: '/brands/ugc-creator-preise', label: 'Marktpreise in DACH' },
  { href: '/brands/ugc-vertrag-vorlage', label: 'Vertragsvorlage & Generator' },
  { href: '/vergleich', label: 'Plattformen im Vergleich' },
  { href: '/brands/ugc-creator-deutschland', label: 'UGC Creator Deutschland' },
  { href: '/brands/ugc-agentur-berlin', label: 'UGC Agentur Berlin' },
  { href: '/alle-seiten#branchen', label: 'Alle Branchen ansehen' },
];

export default function BrandsPage() {
  const promo = getActivePromo(new Date());
  const bookingHref = process.env.NEXT_PUBLIC_FLO_BOOKING_URL || '/contact?topic=flo';
  const isExternalBooking = /^https?:\/\//i.test(bookingHref);

  const breadcrumbs = [
    { name: 'Home', url: 'https://ugc-vz.de' },
    { name: 'Für Marken', url: 'https://ugc-vz.de/brands' },
  ];

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'UGC VZ Creator-Kampagnen für Marken',
    description:
      'Creator-Kampagnen nach geprüften Views mit fester Budget-Obergrenze sowie direkte Creator-Produktionen für Marken in Deutschland, Österreich und der Schweiz. 15 % Servicegebühr im Budget enthalten.',
    provider: {
      '@type': 'Organization',
      '@id': 'https://ugc-vz.de/#organization',
    },
    areaServed: ['DE', 'AT', 'CH'],
    serviceType: 'Creator Campaign Platform',
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: BRAND_FAQS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-white text-[#202124]">
      <BreadcrumbSchema items={breadcrumbs} />
      <JsonLdScript data={serviceSchema} />
      <JsonLdScript data={faqSchema} />

      {/* 1. Hero + Live Budget-Rechner (Spec 8.2 brands.hero) */}
      <section aria-labelledby="brands-hero-title" className="bg-[#F5F7FA] px-5 py-12 sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="max-w-[560px] lg:col-span-6">
            <p className="text-sm font-medium text-[#06458F]">UGC VZ für Marken</p>
            <h1
              id="brands-hero-title"
              className="mt-2 font-display text-[38px] font-bold leading-[42px] tracking-[-0.02em] text-[#202124] sm:text-5xl sm:leading-[1.08] lg:text-[60px] lg:leading-[66px]"
            >
              UGC-Einzelvideos und Kampagnen nach echten Views.
            </h1>
            <p className="mt-5 text-base leading-7 text-[#5C6470] sm:text-lg">
              Kauf einzelne UGC-Videos (1-Off) zum Festpreis für deine Ads oder zahle pro 1.000 geprüfte Views mit fester Budget-Obergrenze. Echte DACH-Creator, kein Abo.
            </p>

            <ul className="mt-6 space-y-3 text-sm font-medium text-[#202124] sm:text-base">
              {[
                'Feste Budget-Obergrenze in jeder Kampagne',
                'Nur geprüfte Beiträge werden bezahlt',
                'Alle Beiträge und Views live in deinem Konto',
              ].map((bullet) => (
                <li key={bullet} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EBF2FA] text-[#202124]">
                    <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/brand?tab=signup"
                className="btn-press inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#06458F] px-7 text-sm font-semibold text-white hover:bg-[#053673] hover:opacity-90 sm:text-base"
              >
                <span>Kampagne starten</span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              {isExternalBooking ? (
                <a
                  href={bookingHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-press inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-[#DCE2EA] bg-white px-6 text-sm font-semibold text-[#202124] hover:border-[#06458F]"
                >
                  <Calendar size={16} aria-hidden="true" />
                  <span>15 Minuten mit Flo sprechen</span>
                </a>
              ) : (
                <Link
                  href={bookingHref}
                  className="btn-press inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-[#DCE2EA] bg-white px-6 text-sm font-semibold text-[#202124] hover:border-[#06458F]"
                >
                  <Calendar size={16} aria-hidden="true" />
                  <span>15 Minuten mit Flo sprechen</span>
                </Link>
              )}
            </div>
          </div>

          <div className="lg:col-span-6">
            <ViewBudgetCalculator
              initialPromo={promo}
              defaultBudgetEur={1000}
              defaultRateEur={2}
              compact
              ctaHref="/brand?tab=signup"
              ctaLabel="Kampagne mit diesem Budget starten"
            />
          </div>
        </div>
      </section>

      {/* 2. Agentur-Logos (Spec 8.2 home.logos) */}
      <TrustElements compact />

      {/* 3. Zwei Wege, ein Konto (Spec 8.2 brands.ways, kein TKP in Ueberschriften) */}
      <section aria-labelledby="brands-ways-title" className="bg-white px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[#5C6470]">Kampagnenmodelle</p>
            <h2
              id="brands-ways-title"
              className="mt-1 font-display text-[30px] font-bold leading-[34px] tracking-[-0.02em] text-[#202124] sm:text-[44px] sm:leading-[48px]"
            >
              Drei Modelle, ein Konto
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {/* Weg 1: Reichweite nach Views */}
            <Link
              href="/brand?tab=signup"
              className="group flex flex-col justify-between rounded-[20px] border border-[#DCE2EA] bg-[#F5F7FA] p-7 transition-colors hover:border-[#06458F]"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#062A59] text-[#F2072A]">
                    <TrendingUp size={20} aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-[#EBF2FA] px-3 py-1 font-mono text-xs font-bold text-[#202124]">
                    z. B. 2,00 € pro 1.000 Views
                  </span>
                </div>

                {/* Kompakte Feed-Vorschau */}
                <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-[#DCE2EA] bg-white p-3">
                  {['TikTok · 42k', 'Reel · 28k', 'Short · 19k'].map((label) => (
                    <div key={label} className="rounded-xl bg-[#F5F7FA] px-2.5 py-3 text-center">
                      <span className="block text-[11px] font-semibold text-[#202124]">{label}</span>
                      <span className="mt-1 inline-block rounded bg-[#EBF2FA] px-1.5 py-0.5 text-[10px] font-bold text-[#202124]">
                        Zählt
                      </span>
                    </div>
                  ))}
                </div>

                <h3 className="mt-6 font-display text-2xl font-bold text-[#202124]">
                  Reichweite nach Views
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-[#5C6470] sm:text-base">
                  Creator posten auf ihren eigenen Profilen. Du zahlst pro 1.000 geprüfte Views (TKP-Prinzip) bis zu deiner Obergrenze. Gut für Shop-Aktionen, Rabattcodes und Launches.
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#202124] group-hover:text-[#06458F]">
                <span>View-Kampagne starten</span>
                <ArrowRight size={15} aria-hidden="true" />
              </span>
            </Link>

            {/* Weg 2: Videos fuer deine Kanaele und Ads */}
            <Link
              href="/brand?tab=signup"
              className="group flex flex-col justify-between rounded-[20px] border border-[#DCE2EA] bg-[#F5F7FA] p-7 transition-colors hover:border-[#06458F]"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#202124] border border-[#DCE2EA]">
                    <Film size={20} aria-hidden="true" />
                  </span>
                  <span className="rounded-full border border-[#DCE2EA] bg-white px-3 py-1 font-mono text-xs font-bold text-[#202124]">
                    Festpreis pro Video
                  </span>
                </div>

                {/* Kompakte Datei-Vorschau */}
                <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-[#DCE2EA] bg-white p-3">
                  {['Hook A.mp4', 'Hook B.mp4', 'Testimonial.mp4'].map((file) => (
                    <div key={file} className="rounded-xl bg-[#F5F7FA] px-2.5 py-3 text-center">
                      <span className="block truncate font-mono text-[11px] font-semibold text-[#202124]">
                        {file}
                      </span>
                      <span className="mt-1 inline-block text-[10px] text-[#5C6470]">9:16 + Rechte</span>
                    </div>
                  ))}
                </div>

                <h3 className="mt-6 font-display text-2xl font-bold text-[#202124]">
                  Einzelvideos (1-Off) &amp; Ad-Pakete
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-[#5C6470] sm:text-base">
                  Kauf ein einzelnes Produktvideo oder ein kleines Paket zum Festpreis, auch als reine Videodatei für Ads ohne Creator-Posting. Mit klaren Nutzungsrechten.
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#202124] group-hover:text-[#06458F]">
                <span>Einzelvideo anfragen</span>
                <ArrowRight size={15} aria-hidden="true" />
              </span>
            </Link>

            {/* Weg 3: Core-Creator Monats-Retainer */}
            <Link
              href="/brand?tab=signup"
              className="group flex flex-col justify-between rounded-[20px] border border-[#DCE2EA] bg-[#F5F7FA] p-7 transition-colors hover:border-[#06458F]"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#06458F] text-white">
                    <Repeat size={20} aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-[#EBF2FA] px-3 py-1 font-mono text-xs font-bold text-[#06458F]">
                    Monats-Fixum + optional %
                  </span>
                </div>

                {/* Kompakte Retainer-Vorschau */}
                <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-[#DCE2EA] bg-white p-3">
                  {['Monat 1 · 4 Clips', 'Monat 2 · 4 Clips', 'Monat 3 · 4 Clips'].map((item) => (
                    <div key={item} className="rounded-xl bg-[#F5F7FA] px-2 py-3 text-center">
                      <span className="block text-[11px] font-semibold text-[#202124]">{item}</span>
                      <span className="mt-1 inline-block text-[10px] text-[#06458F]">Laufend</span>
                    </div>
                  ))}
                </div>

                <h3 className="mt-6 font-display text-2xl font-bold text-[#202124]">
                  Monats-Retainer mit Stamm-Creatorn
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-[#5C6470] sm:text-base">
                  Wie ein fester externer Dienstleister auf Monatsbasis: feste Creator liefern jeden Monat planbar neue Clips zum monatlichen Fixum, optional kombiniert mit Umsatz-Provision.
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#202124] group-hover:text-[#06458F]">
                <span>Retainer einrichten</span>
                <ArrowRight size={15} aria-hidden="true" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Beitragspruefung (Spec 8.2 home.proof) */}
      <VerificationProofSection />

      {/* 5. Dashboard-Vorschau (Spec 8.2 brands.dashboard) */}
      <section aria-labelledby="brands-dashboard-title" className="bg-white px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#5C6470]">Volle Kontrolle nach dem Login</p>
              <h2
                id="brands-dashboard-title"
                className="mt-1 font-display text-[30px] font-bold leading-[34px] tracking-[-0.02em] text-[#202124] sm:text-[44px] sm:leading-[48px]"
              >
                Alles in einem Konto.
              </h2>
            </div>
            <span className="rounded-full border border-[#DCE2EA] bg-[#F5F7FA] px-3 py-1 text-xs font-medium text-[#5C6470]">
              Beispielansicht
            </span>
          </div>

          {/* Browser-Rahmen */}
          <div className="mt-8 overflow-hidden rounded-[24px] border border-[#DCE2EA] bg-[#F5F7FA] shadow-card">
            <div className="flex items-center justify-between border-b border-[#DCE2EA] bg-white px-4 py-3">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-[#DCE2EA]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#DCE2EA]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#DCE2EA]" />
              </div>
              <span className="rounded-md bg-[#F5F7FA] px-3 py-1 font-mono text-[11px] text-[#5C6470]">
                ugc-vz.de/brand/kampagnen
              </span>
              <span className="text-[11px] font-medium text-[#5C6470]">Beispielansicht</span>
            </div>

            <div className="p-5 sm:p-8">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  { label: 'Erreichte Views', value: '128.000', accent: true },
                  { label: 'Beiträge', value: '18' },
                  { label: 'Creator', value: '12' },
                  { label: 'In Prüfung', value: '3' },
                  { label: 'Restbudget', value: '744 €', accent: true },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="rounded-[16px] border border-[#DCE2EA] bg-white p-4"
                  >
                    <p className="text-xs font-medium text-[#5C6470]">{kpi.label}</p>
                    <p
                      className={`mt-2 font-mono text-2xl font-bold tabular-nums ${
                        kpi.accent ? 'inline-block rounded-md bg-[#EBF2FA] px-2 py-0.5 text-[#202124]' : 'text-[#202124]'
                      }`}
                    >
                      {kpi.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[16px] border border-[#DCE2EA] bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-[#5C6470]">
                  <span>Budget-Auslastung (256 € von 1.000 € Obergrenze)</span>
                  <span className="font-mono font-semibold tabular-nums text-[#202124]">26 % genutzt</span>
                </div>
                <BudgetBar usedPercent={26} label="Beispielansicht Budget-Auslastung" className="mt-2.5" />

                <div className="mt-4 divide-y divide-[#DCE2EA] text-sm">
                  {[
                    { post: 'TikTok · Produkt im Alltag', views: '64.000 Views', amount: '128,00 €', status: 'Zählt' },
                    { post: 'Instagram Reel · Rabatt-Hinweis', views: '41.000 Views', amount: '82,00 €', status: 'Zählt' },
                    { post: 'TikTok · Unboxing Clip', views: '14.500 Views', amount: 'Prüfung läuft', status: 'In Prüfung' },
                  ].map((row) => (
                    <div key={row.post} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <span className="font-medium text-[#202124]">{row.post}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs tabular-nums text-[#5C6470]">{row.views}</span>
                        <span className="font-mono text-xs font-semibold tabular-nums text-[#202124]">{row.amount}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            row.status === 'Zählt'
                              ? 'bg-[#EBF2FA] text-[#202124]'
                              : 'bg-[#F5F7FA] text-[#5C6470]'
                          }`}
                        >
                          {row.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-3 text-right text-xs text-[#5C6470]">
                Beispielansicht mit erfundenen Zahlen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Gesicht der Plattform: Flo */}
      <FloFounderCard />

      {/* 7. Mehr Details & Kompakte Linkliste (Spec 8.2 brands.extras) */}
      <section aria-labelledby="brands-extras-title" className="bg-[#F5F7FA] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <h2
                id="brands-extras-title"
                className="font-display text-2xl font-bold tracking-[-0.02em] text-[#202124] sm:text-3xl"
              >
                Mehr Details
              </h2>
              <div className="mt-5 space-y-3">
                {EXTRA_ACCORDIONS.map((item) => (
                  <details
                    key={item.title}
                    className="group rounded-[16px] border border-[#DCE2EA] bg-white px-5"
                  >
                    <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold text-[#202124] [&::-webkit-details-marker]:hidden">
                      <span>{item.title}</span>
                      <span className="text-lg text-[#5C6470] transition-transform group-open:rotate-45" aria-hidden="true">
                        +
                      </span>
                    </summary>
                    <p className="pb-4 text-sm leading-6 text-[#5C6470]">{item.body}</p>
                  </details>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6">
              <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-[#202124] sm:text-3xl">
                Weitere Seiten für Marken
              </h2>
              <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {BRAND_RESOURCE_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex min-h-[48px] items-center justify-between rounded-xl border border-[#DCE2EA] bg-white px-3.5 py-2.5 text-sm font-medium text-[#202124] transition-colors hover:border-[#06458F]"
                    >
                      <span>{item.label}</span>
                      <ArrowRight size={14} className="shrink-0 text-[#5C6470]" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ (Schema-Text = sichtbarer Text) */}
      <section aria-labelledby="brands-faq-title" className="bg-white px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[720px]">
          <h2
            id="brands-faq-title"
            className="text-center font-display text-[30px] font-bold leading-[34px] tracking-[-0.02em] text-[#202124] sm:text-4xl"
          >
            Häufige Fragen von Marken
          </h2>
          <div className="mt-8 space-y-3">
            {BRAND_FAQS.map((item, idx) => (
              <details
                key={item.q}
                open={idx === 0}
                className="group rounded-[20px] border border-[#DCE2EA] bg-white px-5 sm:px-6"
              >
                <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-base font-semibold text-[#202124] sm:text-lg [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <span className="shrink-0 text-xl text-[#5C6470] transition-transform group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="pb-5 text-sm leading-7 text-[#5C6470] sm:text-base">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Abschluss-CTA */}
      <section className="bg-white px-5 pb-4 sm:px-8">
        <div className="mx-auto max-w-[1200px] rounded-[24px] bg-[#06458F] px-6 py-14 text-center text-[#F5F7FA] sm:px-12">
          <h2 className="font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
            Starte deine erste Kampagne.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-base text-[#F5F7FA]/75">
            Kostenloses Konto, kein Abo, feste Budget-Obergrenze.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/brand?tab=signup"
              className="btn-press inline-flex min-h-[52px] items-center gap-2 rounded-full bg-[#F5F7FA] px-7 text-sm font-semibold text-[#202124] hover:opacity-90"
            >
              <span>Kampagne starten</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/preise"
              className="btn-press inline-flex min-h-[52px] items-center rounded-full border border-white/25 px-7 text-sm font-semibold text-[#F5F7FA] hover:border-white/60"
            >
              Preise ansehen
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

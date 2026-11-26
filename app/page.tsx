import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BarChart3, Check, Search, ShieldCheck, Users } from 'lucide-react';
import SearchBox from './components/SearchBox';
import TrustElements from './components/TrustElements';
import HomePageSchema from './components/HomePageSchema';
import JsonLdScript from './wissen/[slug]/JsonLdScript';
import PauseableVideo from './components/motion/PauseableVideo';
import EditorialMotionHero from './components/home/EditorialMotionHero';
import QuickBriefCard from './components/home/QuickBriefCard';
import CampaignHowTabs from './components/home/CampaignHowTabs';
import VerificationProofSection from './components/home/VerificationProofSection';
import FloFounderCard from './components/home/FloFounderCard';
import { formatEurCentsDe, getHomepageLiveStats } from './lib/homepage-stats';
import { NICHE_INDEX, nichePath } from './lib/niche-index';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'UGC VZ: Einzelvideos & View-Kampagnen mit echten Creatorn in DACH',
  description:
    'Kauf einzelne UGC-Videos (1-Off) zum Festpreis oder starte View-Kampagnen auf TikTok und Instagram. Echte DACH-Creator, feste Budget-Obergrenze, kein Abo, 0 % Gebühr für Creator.',
  alternates: {
    canonical: 'https://ugc-vz.de',
    languages: {
      'de-DE': 'https://ugc-vz.de',
    },
  },
};

const HOME_ADVANTAGES = [
  {
    icon: Search,
    badge: 'KI-Suche',
    title: 'Die Suche versteht dein Briefing',
    description:
      'Beschreibe Produkt, Zielgruppe und Format in deinen eigenen Worten. Die KI-Suche filtert in 20 Kategorien nach passenden Creator-Profilen.',
  },
  {
    icon: Users,
    badge: 'Verifizierter Pool',
    title: 'Echte Profile mit Arbeitsproben',
    description:
      'Reale DACH-Creator mit verifizierten Social-Accounts, Portfolio-Links und echten Reels. Keine KI-Avatare und keine anonymen Listen.',
  },
  {
    icon: ShieldCheck,
    badge: 'Volle Kontrolle',
    title: 'Du wählst bewusst aus',
    description:
      'Vergleiche Themen, Formate und Arbeitsproben direkt selbst oder starte eine offene View-Kampagne mit klaren Brief-Regeln.',
  },
  {
    icon: BarChart3,
    badge: 'Brand-Workspace',
    title: 'Kampagne, Tracking & Reporting',
    description:
      'Briefing-Checkliste, geprüfte Views von TikTok und Instagram, feste Budget-Obergrenze und teilbarer Live-Report an einem Ort.',
  },
] as const;

const HOME_FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'Was kostet mich das als Marke?',
    a: 'Das Konto ist kostenlos, es gibt kein Abo. Du buchst entweder einzelne UGC-Videos (1-Off) zum Festpreis oder zahlst pro 1.000 geprüfte Views bis zu deiner Budget-Obergrenze. Im Budget sind regulär 15 % Servicegebühr enthalten.',
  },
  {
    q: 'Welche Views werden bezahlt?',
    a: 'Nur Views von Beiträgen, die deinen Brief erfüllen und bis Kampagnenende online sind. Gezählt wird in vollen 1.000er-Schritten.',
  },
  {
    q: 'Wie verdiene ich als Creator Geld?',
    a: 'Du kannst einzelne UGC-Videos (1-Off) zu deinem Festpreis verkaufen (auch ohne eigenes Posting) oder bei View-Kampagnen und monatlichen Retainern mitmachen. Für Creator fallen 0 % Gebühren an.',
  },
  {
    q: 'Kann ich auch einzelne Videos (1-Off) ohne Posting kaufen?',
    a: 'Ja. Im Schnell-Brief und im Brand-Workspace wählst du einfach „Einzelvideo / Fixpreis“ und „Nur Videodatei (Ads)“. Du zahlst erst nach Abnahme des fertigen Videos.',
  },
  {
    q: 'Was bedeutet Monats-Retainer auf UGC VZ?',
    a: 'Ein Retainer funktioniert wie eine dauerhafte Zusammenarbeit mit einem externen Dienstleister: Marken und Creator vereinbaren ein festes Monats-Honorar für laufende Videos (z. B. 4 Clips pro Monat), optional mit Umsatz-Provision. Das bringt Marken planbaren Content und Creatorn verlässliche laufende Einnahmen.',
  },
];

export default async function Home() {
  const stats = await getHomepageLiveStats();

  const homeFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': 'https://ugc-vz.de/#faq',
    mainEntity: HOME_FAQS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <div className="home-page min-h-screen bg-white text-[#202124]">
      <HomePageSchema />
      <JsonLdScript data={homeFaqSchema} />

      {/* ---------- 1. Editorial Motion Hero (ugcVZ Rot-Blau CI, Orla-Stil, 1x H1) ---------- */}
      <EditorialMotionHero
        stats={{
          liveCreatorCount: stats.liveCreatorCount,
          heroCampaign: stats.heroCampaign,
        }}
        headingId="home-title"
        heading={
          <h1
            id="home-title"
            className="font-display text-[40px] font-extrabold leading-[1.03] tracking-[-0.036em] text-[#202124] sm:text-5xl lg:text-[56px] lg:leading-[1.01] xl:text-[66px]"
          >
            Echte Creator.
            <br />
            Echte Views.
            <br />
            <span className="text-[#06458F]">Dein Budget</span>
            <span className="text-[#F2072A]">.</span>
          </h1>
        }
      />

      {/* ---------- 2. Logo-Leiste (Spec 8.2 home.logos) ---------- */}
      <TrustElements compact />

      {/* ---------- 3. Schnell-Brief in 60 Sekunden (Spec 8.2 home.brief) ---------- */}
      <QuickBriefCard />

      {/* ---------- 4. Interaktive KI-Creator-Suche ---------- */}
      <section
        id="search"
        aria-labelledby="home-search-title"
        className="scroll-mt-20 border-y border-[#DCE2EA] bg-white px-5 py-16 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-[#5C6470]">Creator-Pool direkt testen</p>
              <h2
                id="home-search-title"
                className="mt-1 font-display text-[28px] font-bold leading-[32px] tracking-[-0.02em] text-[#202124] sm:text-[36px] sm:leading-[42px]"
              >
                Oder direkt passende Creator im Pool suchen
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#5C6470] sm:text-base">
                Beschreibe Produkt, Zielgruppe und Format. Die KI-Suche filtert in 20 Kategorien nach echten Profilen und Arbeitsproben.
              </p>
            </div>
            <Link
              href="/brands/ugc-creator-finden"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#202124] underline decoration-[#DCE2EA] underline-offset-4 hover:text-[#06458F] hover:decoration-[#06458F]"
            >
              <span>Zur kompletten Pool-Vorschau</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          <div className="rounded-[16px] border border-[#DCE2EA] bg-[#F5F7FA]/75 p-4 shadow-card sm:p-8">
            <SearchBox showFeatured={false} hideNicheChips />
          </div>
        </div>
      </section>

      {/* ---------- 5. Vorteile & Marken-Produktvideo (erhaltene Inhalte + neues 16:9 CI-Video) ---------- */}
      <section
        aria-labelledby="home-features-title"
        className="bg-[#F5F7FA] px-5 py-16 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-[#06458F]">Warum Marken UGC VZ nutzen</p>
            <h2
              id="home-features-title"
              className="mt-2 font-display text-[30px] font-bold leading-[34px] tracking-[-0.02em] text-[#202124] sm:text-[44px] sm:leading-[48px]"
            >
              Vom Briefing zu geprüften Views
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#5C6470] sm:text-base sm:leading-7">
              Ob View-Kampagne mit fester Budget-Obergrenze oder direkte Creator-Auswahl: Alles läuft strukturiert im Brand-Workspace, ohne Abo.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOME_ADVANTAGES.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="card-fresh flex flex-col rounded-[14px] border border-[#DCE2EA] bg-white p-6 shadow-card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#EBF2FA] text-[#06458F]">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <span className="rounded-full border border-[#DCE2EA] bg-[#F5F7FA] px-2.5 py-0.5 text-[11px] font-semibold text-[#5C6470]">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-bold leading-snug text-[#202124]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#5C6470]">{item.description}</p>
                </div>
              );
            })}
          </div>

          {/* Aktuelles 16:9-Marken-Erklaervideo in neuer ugcVZ Rot-Blau-CI */}
          <div className="mt-10 rounded-[16px] border border-[#DCE2EA] bg-white p-4 shadow-[0_10px_32px_rgba(6,69,143,0.08)] sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#D10523]">
                  Produkt-Einblick in 16 Sekunden
                </p>
                <p className="mt-0.5 font-display text-lg font-bold text-[#202124] sm:text-xl">
                  So findest du Creator und startest deine Kampagne
                </p>
              </div>
              <Link
                href="/brand?tab=signup"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#06458F] hover:text-[#053673]"
              >
                <span>Jetzt kostenlos testen</span>
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>

            <PauseableVideo
              src="/motion/ugc-vz-brands-16x9.mp4"
              poster="/motion/ugc-vz-brands-16x9-poster.jpg"
              label="Produkt-Einblick: So funktionieren Marken-Kampagnen auf UGC VZ"
              aspectClassName="aspect-[16/9]"
              caption="Marken-Ablauf"
            />
          </div>
        </div>
      </section>

      {/* ---------- 6. So laeuft eine Kampagne (Spec 8.2 home.how, SSR Tabs) ---------- */}
      <CampaignHowTabs />

      {/* ---------- 7. Beitragspruefung sichtbar machen (Spec 8.2 home.proof) ---------- */}
      <VerificationProofSection />

      {/* ---------- 8. Creator-Band auf Directory Blue Navy (#062A59 + #F2072A Akzent) ---------- */}
      <section
        aria-labelledby="home-creator-title"
        className="relative overflow-hidden border-y-2 border-[#F2072A]/80 bg-[#062A59] bg-[radial-gradient(ellipse_60%_70%_at_90%_15%,rgba(10,91,184,0.45),transparent_70%),radial-gradient(ellipse_40%_45%_at_10%_90%,rgba(242,7,42,0.16),transparent_65%)] px-5 py-16 text-white sm:px-8 sm:py-24"
      >
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-[6px] bg-[#D10523] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white">
              Für Creator
            </p>
            <h2
              id="home-creator-title"
              className="mt-4 font-display text-[32px] font-bold leading-[36px] tracking-[-0.02em] text-white sm:text-5xl sm:leading-[54px]"
            >
              Du postest sowieso. Lass dich dafür bezahlen.
            </h2>

            {stats.highestTkpEurCents ? (
              <div className="mt-6">
                <p className="font-display text-5xl font-bold leading-none tabular-nums text-white sm:text-7xl lg:text-[84px]">
                  {formatEurCentsDe(stats.highestTkpEurCents)} €
                </p>
                <p className="mt-2 font-mono text-sm font-medium text-[#C4D7EF] sm:text-base">
                  pro 1.000 Views · aktueller Spitzensatz einer laufenden Kampagne
                </p>
              </div>
            ) : (
              <p className="mt-6 rounded-[12px] border border-white/20 bg-white/10 px-5 py-4 font-display text-xl font-semibold leading-snug text-white sm:text-2xl">
                Jede Kampagne zeigt dir vorher, was sie pro 1.000 Views zahlt.
              </p>
            )}

            <p className="mt-5 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
              Mach bei Kampagnen von Marken mit, poste auf deinem TikTok oder Instagram und bekomm Geld für deine Views. Anmeldung kostenlos, 0 % Gebühr für Creator. Der Satz gehört dir.
            </p>

            <ul className="mt-6 grid gap-2.5 text-sm text-white/90 sm:grid-cols-2">
              <li className="flex items-center gap-2">
                <Check size={16} className="shrink-0 text-[#F2072A]" aria-hidden="true" />
                <span>0 % Plattformgebühr für Creator</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="shrink-0 text-[#F2072A]" aria-hidden="true" />
                <span>Keine Exklusivität, du wählst frei</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="shrink-0 text-[#F2072A]" aria-hidden="true" />
                <span>Transparente Checkliste vor Dreh</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="shrink-0 text-[#F2072A]" aria-hidden="true" />
                <span>Kein Mindest-Follower-Zwang</span>
              </li>
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/creator"
                className="btn-press inline-flex min-h-[52px] items-center gap-2 rounded-[8px] bg-white px-7 text-sm font-bold text-[#06458F] hover:bg-[#F5F7FA] sm:text-base"
              >
                <span>Kampagnen ansehen</span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                href="/creator#creator-form"
                className="btn-press inline-flex min-h-[52px] items-center rounded-[8px] border border-white/35 px-6 text-sm font-semibold text-white hover:border-white hover:bg-white/10"
              >
                Kostenlos mitmachen
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="mx-auto max-w-[300px] lg:ml-auto lg:mr-0">
              <PauseableVideo
                src="/motion/ugc-vz-creator-9x16.mp4"
                poster="/motion/ugc-vz-creator-9x16-poster.jpg"
                label="So verdienen Creator mit Kampagnen auf UGC VZ"
                aspectClassName="aspect-[9/15]"
                caption="Creator-Ansicht"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 9. Gesicht der Plattform: Florian Runge (Spec 8.2 home.flo) ---------- */}
      <FloFounderCard />

      {/* ---------- 10. Beliebte Branchen (Spec 8.2 home.industries, max. 1x pro Seite) ---------- */}
      <section
        aria-labelledby="home-niches-title"
        className="border-y border-[#DCE2EA] bg-[#F5F7FA] px-5 py-14 sm:px-8 sm:py-16"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2
              id="home-niches-title"
              className="font-display text-2xl font-bold tracking-[-0.02em] text-[#202124] sm:text-3xl"
            >
              Beliebte Branchen
            </h2>
            <Link
              href="/alle-seiten#branchen"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#202124] hover:text-[#06458F]"
            >
              <span>Alle Branchen ansehen</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          <ul className="mt-6 flex gap-2.5 overflow-x-auto pb-2 [scrollbar-width:thin]">
            {NICHE_INDEX.map((niche) => (
              <li key={niche.slug} className="shrink-0">
                <Link
                  href={nichePath(niche)}
                  className="btn-press inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-full border border-[#DCE2EA] bg-white px-4 text-sm font-medium text-[#202124] hover:border-[#06458F]"
                >
                  <span>{niche.chip}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- 11. Kurz gefragt (Spec 8.2 home.faq, Schema-Text = sichtbarer Text) ---------- */}
      <section
        aria-labelledby="home-faq-title"
        className="bg-white px-5 py-16 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-[720px]">
          <h2
            id="home-faq-title"
            className="text-center font-display text-[30px] font-bold leading-[34px] tracking-[-0.02em] text-[#202124] sm:text-[44px] sm:leading-[48px]"
          >
            Kurz gefragt
          </h2>

          <div className="mt-10 space-y-3">
            {HOME_FAQS.map((item, idx) => (
              <details
                key={item.q}
                open={idx === 0}
                className="group rounded-[12px] border border-[#DCE2EA] bg-white px-5 transition-colors open:border-[#06458F]/35 open:shadow-[0_6px_20px_rgba(6,69,143,0.06)] sm:px-6"
              >
                <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-base font-semibold text-[#202124] sm:text-lg [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <span
                    className="shrink-0 text-xl font-normal text-[#5C6470] transition-transform duration-200 group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-5 text-sm leading-7 text-[#5C6470] sm:text-base">{item.a}</p>
              </details>
            ))}
          </div>

          <p className="mt-7 text-center">
            <Link
              href="/faq"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#202124] underline decoration-[#DCE2EA] underline-offset-4 hover:text-[#06458F] hover:decoration-[#06458F]"
            >
              <span>Alle häufigen Fragen</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </p>
        </div>
      </section>

      {/* ---------- 12. Abschluss-CTA (Spec 8.2 home.final_cta, Buttons in der Box) ---------- */}
      <section aria-labelledby="home-final-cta-title" className="bg-white px-5 pb-4 sm:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="rounded-[16px] border-t-[3px] border-[#F2072A] bg-[#06458F] bg-[radial-gradient(ellipse_55%_80%_at_50%_0%,rgba(10,91,184,0.55),transparent_75%)] px-6 py-14 text-center text-white shadow-[0_18px_48px_rgba(6,69,143,0.22)] sm:px-12 sm:py-16">
            <h2
              id="home-final-cta-title"
              className="font-display text-[30px] font-bold leading-[34px] tracking-[-0.02em] sm:text-[44px] sm:leading-[48px]"
            >
              Starte deine erste Kampagne.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-white/85 sm:text-lg">
              Kostenloses Konto, kein Abo, feste Budget-Obergrenze.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/brand?tab=signup"
                className="btn-press inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[8px] bg-white px-7 text-sm font-semibold text-[#06458F] hover:bg-[#F5F7FA] sm:w-auto sm:text-base"
              >
                <span>Kampagne starten</span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                href="/creator"
                className="btn-press inline-flex min-h-[52px] w-full items-center justify-center rounded-[8px] border border-white/35 px-7 text-sm font-semibold text-white hover:border-white hover:bg-white/10 sm:w-auto sm:text-base"
              >
                Ich bin Creator
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

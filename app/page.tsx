import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import SearchBox from './components/SearchBox';
import TrustElements from './components/TrustElements';
import HomePageSchema from './components/HomePageSchema';
import JsonLdScript from './wissen/[slug]/JsonLdScript';
import PauseableVideo from './components/motion/PauseableVideo';
import BudgetBar from './components/motion/BudgetBar';
import QuickBriefCard from './components/home/QuickBriefCard';
import CampaignHowTabs from './components/home/CampaignHowTabs';
import VerificationProofSection from './components/home/VerificationProofSection';
import FloFounderCard from './components/home/FloFounderCard';
import { formatEurCentsDe, getHomepageLiveStats } from './lib/homepage-stats';
import { NICHE_INDEX, nichePath } from './lib/niche-index';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'UGC VZ: Creator-Kampagnen nach Views für Marken in DACH',
  description:
    'Du schreibst ein kurzes Briefing und legst fest, was dir 1.000 Views wert sind. Creator posten dein Produkt auf TikTok und Instagram. Geprüfte Views, feste Budget-Obergrenze, kein Abo.',
  alternates: {
    canonical: 'https://ugc-vz.de',
    languages: {
      'de-DE': 'https://ugc-vz.de',
    },
  },
};

const HOME_FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'Was kostet mich das als Marke?',
    a: 'Das Konto ist kostenlos, es gibt kein Abo. Du zahlst pro 1.000 geprüfte Views den Preis, den du selbst festlegst, höchstens bis zu deiner Budget-Obergrenze. Im Kampagnen-Budget sind regulär 15 % Servicegebühr enthalten.',
  },
  {
    q: 'Welche Views werden bezahlt?',
    a: 'Nur Views von Beiträgen, die deinen Brief erfüllen und bis Kampagnenende online sind. Gezählt wird in vollen 1.000er-Schritten.',
  },
  {
    q: 'Wie verdiene ich als Creator Geld?',
    a: 'Du suchst dir eine Kampagne aus, postest auf deinem Profil und reichst den Link ein. Jede Kampagne zeigt vorher, was sie pro 1.000 Views zahlt. Für Creator fallen 0 % Gebühren an.',
  },
  {
    q: 'Kann ich auch Videos ohne Posting kaufen?',
    a: 'Ja. Neben View-Kampagnen kannst du Creator für Produktvideos und Ad-Creatives direkt beauftragen.',
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

  const heroCampaign = stats.heroCampaign;
  const heroRateLabel = heroCampaign
    ? `${formatEurCentsDe(heroCampaign.tkpEurCents)} € pro 1.000 Views`
    : '2,00 € pro 1.000 Views';
  const heroBudgetLabel = heroCampaign
    ? `Budget ${heroCampaign.totalBudgetEur.toLocaleString('de-DE')} €`
    : 'Budget 500 €';
  const heroRemainingPct = heroCampaign ? heroCampaign.remainingPercent : 74;
  const heroUsedPct = Math.max(0, Math.min(100, 100 - heroRemainingPct));

  return (
    <div className="home-page min-h-screen bg-white text-[#121212]">
      <HomePageSchema />
      <JsonLdScript data={homeFaqSchema} />

      {/* ---------- 1. Hero (Spec 8.2 home.hero, Paper #F7F6F2, kein Gradient) ---------- */}
      <section
        aria-labelledby="home-title"
        className="bg-[#F7F6F2] px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-16"
      >
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Linke Spalte: klare Botschaft, 1 Primary Button, leiser Creator-Link */}
          <div className="max-w-[560px] lg:col-span-6">
            <p className="text-sm font-medium text-[#5C5A55]">
              Für Marken in Deutschland, Österreich und der Schweiz
            </p>

            <h1
              id="home-title"
              className="mt-3 font-display text-[40px] font-bold leading-[44px] tracking-[-0.02em] text-[#121212] sm:text-6xl sm:leading-[1.06] lg:text-[68px] lg:leading-[74px]"
            >
              Echte Creator. Echte Views. Dein Budget.
            </h1>

            <p className="mt-5 text-base leading-6 text-[#5C5A55] sm:text-lg sm:leading-7">
              Du schreibst ein kurzes Briefing und legst fest, was dir 1.000 Views wert sind. Creator posten dein Produkt auf TikTok und Instagram. Du zahlst nur geprüfte Beiträge und nie mehr als dein Budget.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/brand?tab=signup"
                className="btn-press inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#121212] px-7 text-sm font-semibold text-[#F7F6F2] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C2BD9] focus-visible:ring-offset-2 sm:min-h-[52px] sm:text-base"
              >
                <span>Kampagne starten</span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                href="#so-funktionierts"
                className="btn-press inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#E4E1D8] bg-white px-6 text-sm font-semibold text-[#121212] hover:border-[#121212] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C2BD9] focus-visible:ring-offset-2 sm:min-h-[52px] sm:text-base"
              >
                So läuft eine Kampagne
              </Link>
            </div>

            <div className="mt-5">
              <Link
                href="/creator"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#121212] underline decoration-[#E4E1D8] underline-offset-4 transition-colors hover:text-[#6C2BD9] hover:decoration-[#6C2BD9]"
              >
                <span>Du bist Creator? Hier verdienst du pro 1.000 Views</span>
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>

            <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#5C5A55] sm:text-sm">
              <span>Kostenloses Konto</span>
              <span aria-hidden="true">·</span>
              <span>Kein Abo</span>
              <span aria-hidden="true">·</span>
              <span>Budget-Obergrenze in jeder Kampagne</span>
              {stats.liveCreatorCount && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums text-[#121212]">
                    {stats.liveCreatorCount.toLocaleString('de-DE')} aktive Creator-Profile
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Rechte Spalte: Hochkant-Video mit Poster-LCP & Pause-Button + Kampagnenkarte */}
          <div className="lg:col-span-6">
            <div className="mx-auto max-w-[460px] lg:ml-auto lg:mr-0">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-end">
                {/* Mobil nur ein Clip (Spec 8.10 hero_video_loop), Desktop mit statischer Zweitkarte */}
                <div className="sm:col-span-7">
                  <PauseableVideo
                    src="/motion/ugc-vz-brands-9x16.mp4"
                    poster="/motion/ugc-vz-brands-9x16-poster.jpg"
                    label="Einblick in eine UGC VZ Kampagne für Marken"
                    aspectClassName="aspect-[9/14] sm:aspect-[9/15]"
                    priorityPoster
                    caption="Marken-Kampagne"
                  />
                </div>
                <div className="hidden sm:col-span-5 sm:block">
                  <div className="overflow-hidden rounded-[20px] border border-[#E4E1D8] bg-white shadow-card">
                    {/* Statisches Posterbild der zweiten Perspektive (max. 1 aktives Video gleichzeitig) */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/motion/ugc-vz-creator-9x16-poster.jpg"
                      alt="Vorschau Creator-Perspektive auf UGC VZ"
                      loading="lazy"
                      className="aspect-[9/14] w-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Live-Kampagnenkarte oder klar markierte Beispielansicht */}
              <div className="mt-4 rounded-[20px] border border-[#E4E1D8] bg-white p-4 shadow-card sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#121212]">
                    <span
                      className={`h-2 w-2 rounded-full ${heroCampaign ? 'bg-[#1F9D55]' : 'bg-[#6C2BD9]'}`}
                      aria-hidden="true"
                    />
                    {heroCampaign ? heroCampaign.title : 'View-Kampagne · TikTok & Reels'}
                  </span>
                  <span className="rounded-full border border-[#E4E1D8] bg-[#F7F6F2] px-2.5 py-0.5 text-[11px] font-medium text-[#5C5A55]">
                    {heroCampaign ? 'Live-Kampagne' : 'Beispielansicht'}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-mono text-sm font-bold tabular-nums text-[#121212] sm:text-base">
                    <span className="rounded-md bg-[#C8F04B] px-2 py-0.5">{heroRateLabel}</span>
                  </p>
                  <p className="text-xs font-medium tabular-nums text-[#5C5A55] sm:text-sm">
                    {heroBudgetLabel} · noch {heroRemainingPct} % übrig
                  </p>
                </div>

                <BudgetBar
                  usedPercent={heroUsedPct}
                  label={`Verbrauchtes Budget: ${heroUsedPct} Prozent`}
                  className="mt-3"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 2. Logo-Leiste (Spec 8.2 home.logos) ---------- */}
      <TrustElements compact />

      {/* ---------- 3. Schnell-Brief in 60 Sekunden (Spec 8.2 home.brief) ---------- */}
      <QuickBriefCard />

      {/* ---------- 4. Erhaltene & verbesserte interaktive Creator-Suche (Nutzerwunsch!) ---------- */}
      <section
        id="search"
        aria-labelledby="home-search-title"
        className="scroll-mt-20 border-y border-[#E4E1D8] bg-white px-5 py-16 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-[#5C5A55]">Creator-Pool direkt testen</p>
              <h2
                id="home-search-title"
                className="mt-1 font-display text-[28px] font-bold leading-[32px] tracking-[-0.02em] text-[#121212] sm:text-[36px] sm:leading-[42px]"
              >
                Oder direkt passende Creator im Pool suchen
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#5C5A55] sm:text-base">
                Beschreibe Produkt, Zielgruppe und Format. Die KI-Suche filtert in 20 Kategorien nach echten Profilen und Arbeitsproben.
              </p>
            </div>
            <Link
              href="/brands/ugc-creator-finden"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#121212] underline decoration-[#E4E1D8] underline-offset-4 hover:text-[#6C2BD9] hover:decoration-[#6C2BD9]"
            >
              <span>Zur kompletten Pool-Vorschau</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          <div className="rounded-[24px] border border-[#E4E1D8] bg-[#F7F6F2]/60 p-4 shadow-card sm:p-8">
            <SearchBox showFeatured={false} hideNicheChips />
          </div>
        </div>
      </section>

      {/* ---------- 5. So laeuft eine Kampagne (Spec 8.2 home.how, SSR Tabs) ---------- */}
      <CampaignHowTabs />

      {/* ---------- 6. Beitragspruefung sichtbar machen (Spec 8.2 home.proof) ---------- */}
      <VerificationProofSection />

      {/* ---------- 7. Creator-Band auf Ink #121212 (Spec 8.2 home.creator_band) ---------- */}
      <section
        aria-labelledby="home-creator-title"
        className="bg-[#121212] px-5 py-16 text-[#F7F6F2] sm:px-8 sm:py-24"
      >
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#C8F04B]">
              Für Creator
            </p>
            <h2
              id="home-creator-title"
              className="mt-3 font-display text-[32px] font-bold leading-[36px] tracking-[-0.02em] text-[#F7F6F2] sm:text-5xl sm:leading-[54px]"
            >
              Du postest sowieso. Lass dich dafür bezahlen.
            </h2>

            {stats.highestTkpEurCents ? (
              <div className="mt-6">
                <p className="font-display text-5xl font-bold leading-none tabular-nums text-[#C8F04B] sm:text-7xl lg:text-[84px]">
                  {formatEurCentsDe(stats.highestTkpEurCents)} €
                </p>
                <p className="mt-2 font-mono text-sm font-medium text-[#C8F04B]/90 sm:text-base">
                  pro 1.000 Views · aktueller Spitzensatz einer laufenden Kampagne
                </p>
              </div>
            ) : (
              <p className="mt-6 rounded-[16px] border border-white/15 bg-white/5 px-5 py-4 font-display text-xl font-semibold leading-snug text-[#C8F04B] sm:text-2xl">
                Jede Kampagne zeigt dir vorher, was sie pro 1.000 Views zahlt.
              </p>
            )}

            <p className="mt-5 max-w-xl text-base leading-7 text-[#F7F6F2]/80 sm:text-lg">
              Mach bei Kampagnen von Marken mit, poste auf deinem TikTok oder Instagram und bekomm Geld für deine Views. Anmeldung kostenlos, 0 % Gebühr für Creator. Der Satz gehört dir.
            </p>

            <ul className="mt-6 grid gap-2.5 text-sm text-[#F7F6F2]/85 sm:grid-cols-2">
              <li className="flex items-center gap-2">
                <Check size={16} className="shrink-0 text-[#C8F04B]" aria-hidden="true" />
                <span>0 % Plattformgebühr für Creator</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="shrink-0 text-[#C8F04B]" aria-hidden="true" />
                <span>Keine Exklusivität, du wählst frei</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="shrink-0 text-[#C8F04B]" aria-hidden="true" />
                <span>Transparente Checkliste vor Dreh</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="shrink-0 text-[#C8F04B]" aria-hidden="true" />
                <span>Kein Mindest-Follower-Zwang</span>
              </li>
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/creator"
                className="btn-press inline-flex min-h-[52px] items-center gap-2 rounded-full bg-[#C8F04B] px-7 text-sm font-bold text-[#121212] hover:opacity-90 sm:text-base"
              >
                <span>Kampagnen ansehen</span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                href="/creator#creator-form"
                className="btn-press inline-flex min-h-[52px] items-center rounded-full border border-white/25 px-6 text-sm font-semibold text-[#F7F6F2] hover:border-white/60"
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

      {/* ---------- 8. Gesicht der Plattform: Florian Runge (Spec 8.2 home.flo) ---------- */}
      <FloFounderCard />

      {/* ---------- 9. Beliebte Branchen (Spec 8.2 home.industries, max. 1x pro Seite) ---------- */}
      <section
        aria-labelledby="home-niches-title"
        className="border-y border-[#E4E1D8] bg-[#F7F6F2] px-5 py-14 sm:px-8 sm:py-16"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2
              id="home-niches-title"
              className="font-display text-2xl font-bold tracking-[-0.02em] text-[#121212] sm:text-3xl"
            >
              Beliebte Branchen
            </h2>
            <Link
              href="/alle-seiten#branchen"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#121212] hover:text-[#6C2BD9]"
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
                  className="btn-press inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-full border border-[#E4E1D8] bg-white px-4 text-sm font-medium text-[#121212] hover:border-[#121212]"
                >
                  <span>{niche.chip}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- 10. Kurz gefragt (Spec 8.2 home.faq, Schema-Text = sichtbarer Text) ---------- */}
      <section
        aria-labelledby="home-faq-title"
        className="bg-white px-5 py-16 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-[720px]">
          <h2
            id="home-faq-title"
            className="text-center font-display text-[30px] font-bold leading-[34px] tracking-[-0.02em] text-[#121212] sm:text-[44px] sm:leading-[48px]"
          >
            Kurz gefragt
          </h2>

          <div className="mt-10 space-y-3">
            {HOME_FAQS.map((item, idx) => (
              <details
                key={item.q}
                open={idx === 0}
                className="group rounded-[20px] border border-[#E4E1D8] bg-white px-5 transition-colors open:border-[#121212]/30 sm:px-6"
              >
                <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-base font-semibold text-[#121212] sm:text-lg [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <span
                    className="shrink-0 text-xl font-normal text-[#5C5A55] transition-transform duration-200 group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-5 text-sm leading-7 text-[#5C5A55] sm:text-base">{item.a}</p>
              </details>
            ))}
          </div>

          <p className="mt-7 text-center">
            <Link
              href="/faq"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#121212] underline decoration-[#E4E1D8] underline-offset-4 hover:text-[#6C2BD9] hover:decoration-[#6C2BD9]"
            >
              <span>Alle häufigen Fragen</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </p>
        </div>
      </section>

      {/* ---------- 11. Abschluss-CTA (Spec 8.2 home.final_cta, Buttons in der Box) ---------- */}
      <section aria-labelledby="home-final-cta-title" className="bg-white px-5 pb-4 sm:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="rounded-[24px] bg-[#121212] px-6 py-14 text-center text-[#F7F6F2] sm:px-12 sm:py-16">
            <h2
              id="home-final-cta-title"
              className="font-display text-[30px] font-bold leading-[34px] tracking-[-0.02em] sm:text-[44px] sm:leading-[48px]"
            >
              Starte deine erste Kampagne.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-[#F7F6F2]/75 sm:text-lg">
              Kostenloses Konto, kein Abo, feste Budget-Obergrenze.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/brand?tab=signup"
                className="btn-press inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#F7F6F2] px-7 text-sm font-semibold text-[#121212] hover:opacity-90 sm:w-auto sm:text-base"
              >
                <span>Kampagne starten</span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                href="/creator"
                className="btn-press inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-white/25 px-7 text-sm font-semibold text-[#F7F6F2] hover:border-white/60 sm:w-auto sm:text-base"
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

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import JsonLdScript from '../wissen/[slug]/JsonLdScript';
import CreatorRegistrationForm from './CreatorRegistrationForm';
import CreatorPromoNotice from '../components/CreatorPromoNotice';
import BudgetBar from '../components/motion/BudgetBar';
import { getActivePromo } from '../lib/platform-pricing';
import { formatEurCentsDe, getHomepageLiveStats } from '../lib/homepage-stats';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Für Creator: Verdiene pro 1.000 Views',
  description:
    'Such dir Kampagnen von Marken aus, poste auf deinem TikTok oder Instagram und verdiene pro 1.000 Views. Anmeldung kostenlos, 0 % Plattformgebühr für Creator.',
  keywords:
    'UGC Creator werden, Geld verdienen mit Views, TikTok Creator Kampagnen, Instagram Reels Creator, UGC Creator Deutschland',
  alternates: {
    canonical: 'https://ugc-vz.de/creator',
  },
  openGraph: {
    title: 'Poste für Marken. Verdiene pro 1.000 Views. | UGC VZ',
    description:
      'Such dir Kampagnen aus, poste auf TikTok oder Instagram und bekomm Geld für deine Views. 0 % Gebühr für Creator.',
    url: 'https://ugc-vz.de/creator',
    siteName: 'UGC VZ',
    locale: 'de_DE',
    type: 'website',
  },
};

const CREATOR_FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'Kostet mich die Anmeldung oder Teilnahme etwas?',
    a: 'Nein. Dein Creator-Konto ist kostenlos und für Creator fallen 0 % Plattformgebühren an. Der angezeigte Satz pro 1.000 Views gehört komplett dir.',
  },
  {
    q: 'Wie sehe ich, was ich verdienen kann?',
    a: 'Jede Kampagne zeigt vorher den festen Betrag pro 1.000 geprüfte Views, die Briefing-Checkliste und das verbleibende Budget. Du entscheidest pro Kampagne frei.',
  },
  {
    q: 'Brauche ich viele Follower?',
    a: 'Nein. Bei View-Kampagnen zählen echte Aufrufe deiner Beiträge, nicht deine Follower-Zahl. Auch kleine Accounts mit starken Ideen können sofort mitmachen.',
  },
  {
    q: 'Wann wird mein Beitrag gezählt?',
    a: 'Nach dem Posten reichst du deinen Link im Konto ein. Erfüllt dein Video den Brief und bleibt bis Kampagnenende online, zählen deine Views in vollen 1.000er-Schritten.',
  },
];

export default async function CreatorPage() {
  const [stats, promo] = await Promise.all([
    getHomepageLiveStats(),
    Promise.resolve(getActivePromo(new Date())),
  ]);

  const breadcrumbs = [
    { name: 'Home', url: 'https://ugc-vz.de' },
    { name: 'Für Creator', url: 'https://ugc-vz.de/creator' },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: CREATOR_FAQS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  const campaignCard = stats.heroCampaign;
  const cardRate = campaignCard
    ? `${formatEurCentsDe(campaignCard.tkpEurCents)} € pro 1.000 Views`
    : '2,00 € pro 1.000 Views';
  const cardBudget = campaignCard
    ? `Budget ${campaignCard.totalBudgetEur.toLocaleString('de-DE')} €`
    : 'Budget 500 €';
  const cardRemaining = campaignCard ? campaignCard.remainingPercent : 74;
  const cardUsed = Math.max(0, Math.min(100, 100 - cardRemaining));

  return (
    <div className="min-h-screen bg-white text-[#202124]">
      <BreadcrumbSchema items={breadcrumbs} />
      <JsonLdScript data={faqSchema} />

      {/* 1. Hero (Spec 8.2 creator.hero, Paper #F5F7FA, zentriert) */}
      <section aria-labelledby="creator-hero-title" className="bg-[#F5F7FA] px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[920px] text-center">
          <div className="mb-6">
            <CreatorPromoNotice initialPromo={promo} />
          </div>

          <p className="text-sm font-medium text-[#06458F]">Für Creator in Deutschland, Österreich und der Schweiz</p>

          <h1
            id="creator-hero-title"
            className="mt-2 font-display text-[38px] font-bold leading-[42px] tracking-[-0.02em] text-[#202124] sm:text-6xl sm:leading-[1.06]"
          >
            Poste für Marken. Verdiene pro 1.000 Views.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#5C6470] sm:text-lg">
            Such dir Kampagnen aus, die zu dir passen, poste auf deinem TikTok oder Instagram und bekomm Geld für deine Reichweite. Den Satz siehst du, bevor du mitmachst.
          </p>

          {/* Grosse Zahl NUR aus Live-Kampagne, sonst ehrlicher Satz ohne Zahl */}
          <div className="mt-7 flex justify-center">
            {stats.highestTkpEurCents ? (
              <p className="inline-flex flex-wrap items-baseline justify-center gap-2 rounded-[12px] border border-[#06458F]/20 bg-[#EBF2FA] px-6 py-3 font-display text-2xl font-bold tabular-nums text-[#06458F] sm:text-4xl">
                <span>Aktuell bis zu {formatEurCentsDe(stats.highestTkpEurCents)} € pro 1.000 Views</span>
              </p>
            ) : (
              <p className="inline-flex rounded-[12px] border border-[#06458F]/20 bg-[#EBF2FA] px-5 py-2.5 font-display text-base font-bold text-[#06458F] sm:text-lg">
                Jede Kampagne zeigt dir vorher ihren festen Satz pro 1.000 Views. 0 % Abzug.
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="#creator-form"
              className="btn-press inline-flex min-h-[52px] items-center gap-2 rounded-full bg-[#06458F] px-7 text-sm font-semibold text-white hover:bg-[#053673] hover:opacity-90 sm:text-base"
            >
              <span>Kostenlos mitmachen</span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link
              href="/konto/kampagnen"
              className="btn-press inline-flex min-h-[52px] items-center rounded-full border border-[#DCE2EA] bg-white px-6 text-sm font-semibold text-[#202124] hover:border-[#06458F] sm:text-base"
            >
              Laufende Kampagnen ansehen
            </Link>
          </div>

          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-[#5C6470] sm:text-sm">
            {['Anmeldung kostenlos', 'Du entscheidest pro Kampagne', 'Satz vorher sichtbar', '0 % Plattformgebühr'].map(
              (item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <Check size={14} className="text-[#1F9D55]" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ),
            )}
          </ul>

          {/* Echte Live-Kampagnenkarte oder klar markierte Beispielansicht */}
          <div className="mx-auto mt-10 max-w-xl rounded-[20px] border border-[#DCE2EA] bg-white p-5 text-left shadow-card">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#202124]">
                {campaignCard ? campaignCard.title : 'Beispiel: View-Kampagne für TikTok & Reels'}
              </span>
              <span className="rounded-full border border-[#DCE2EA] bg-[#F5F7FA] px-2.5 py-0.5 text-[11px] font-medium text-[#5C6470]">
                {campaignCard ? 'Live-Kampagne' : 'Beispielansicht'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
              <span className="rounded-[6px] bg-[#EBF2FA] px-2.5 py-0.5 font-mono text-sm font-bold tabular-nums text-[#06458F]">
                {cardRate}
              </span>
              <span className="font-mono text-xs tabular-nums text-[#5C6470]">
                {cardBudget} · noch {cardRemaining} % übrig
              </span>
            </div>
            <BudgetBar usedPercent={cardUsed} label="Kampagnen-Fortschritt" className="mt-3" />
          </div>
        </div>
      </section>

      {/* 2. 3-Schritt-Registrierung (Schritt 1: max 2 Pflichtfelder + direkter 6-Feld-OTP) */}
      <CreatorRegistrationForm />

      {/* 3. So verdienst du in 3 Schritten */}
      <section id="so-funktionierts" className="scroll-mt-20 bg-[#F5F7FA] px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="font-display text-2xl font-bold tracking-[-0.02em] sm:text-3xl">
            So verdienst du mit UGC VZ
          </h2>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {[
              ['1. Profil anlegen', 'Mit E-Mail und TikTok- oder Instagram-Name bist du in zwei Minuten dabei. 0 % Gebühren.'],
              ['2. Kampagne aussuchen', 'Du siehst vorher den Satz pro 1.000 Views, die kurze Checkliste und das restliche Budget.'],
              ['3. Posten und abrechnen', 'Link im Konto einreichen. Nach der Prüfung zählen deine Views bis zum Kampagnenende.'],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-[20px] border border-[#DCE2EA] bg-white p-6 shadow-card">
                <h3 className="font-display text-xl font-bold text-[#202124]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5C6470]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Profil-Tipps im zugeklappten Akkordeon (Spec 8.2 creator.profile_tips) */}
      <section className="bg-white px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-[780px] space-y-3">
          <details className="group rounded-[20px] border border-[#DCE2EA] bg-[#F5F7FA] px-6">
            <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-lg font-bold text-[#202124] [&::-webkit-details-marker]:hidden">
              <span>So wird dein Profil stark</span>
              <span className="text-xl font-normal text-[#5C6470] transition-transform group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </summary>
            <div className="space-y-4 pb-6 text-sm leading-6 text-[#5C6470]">
              <p>
                Marken prüfen zuerst deine echten Arbeitsproben und deine Themenkategorien. Mit ein paar klaren Angaben wirst du für Produktvideos und View-Kampagnen schneller gefunden:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Wähle bis zu 3 passende Themenbereiche statt allgemeiner Schlagworte.</li>
                <li>Verbinde deinen aktiven TikTok- oder Instagram-Account im Konto per Bio-Code.</li>
                <li>Hinterlege 2 bis 3 starke Beispiel-Clips mit gutem Ton und klarem Einstieg.</li>
                <li>Ergänze optional deine Stadt, falls Marken regional suchen.</li>
              </ul>
            </div>
          </details>
        </div>
      </section>

      {/* 5. Creator FAQ */}
      <section aria-labelledby="creator-faq-title" className="bg-white px-5 pb-16 pt-4 sm:px-8">
        <div className="mx-auto max-w-[720px]">
          <h2 id="creator-faq-title" className="text-center font-display text-2xl font-bold sm:text-3xl">
            Kurz gefragt
          </h2>
          <div className="mt-7 space-y-3">
            {CREATOR_FAQS.map((item, idx) => (
              <details
                key={item.q}
                open={idx === 0}
                className="group rounded-[20px] border border-[#DCE2EA] bg-white px-5 sm:px-6"
              >
                <summary className="flex min-h-[58px] cursor-pointer list-none items-center justify-between gap-4 py-3.5 font-display text-base font-semibold text-[#202124] [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <span className="shrink-0 text-xl text-[#5C6470] transition-transform group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="pb-4 text-sm leading-6 text-[#5C6470]">{item.a}</p>
              </details>
            ))}
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              href="/creator/ugc-creator-werden"
              className="rounded-[20px] border border-[#DCE2EA] bg-[#F5F7FA] p-5 transition-colors hover:border-[#06458F]"
            >
              <p className="font-display font-bold text-[#202124]">UGC Creator werden</p>
              <p className="mt-1 text-sm text-[#5C6470]">Was du zum Start brauchst und wie du deine ersten Clips drehst.</p>
            </Link>
            <Link
              href="/creator/ugc-creator-jobs"
              className="rounded-[20px] border border-[#DCE2EA] bg-[#F5F7FA] p-5 transition-colors hover:border-[#06458F]"
            >
              <p className="font-display font-bold text-[#202124]">UGC Creator Jobs</p>
              <p className="mt-1 text-sm text-[#5C6470]">Wie Kampagnen funktionieren und worauf Marken achten.</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

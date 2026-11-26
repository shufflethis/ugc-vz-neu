'use client';

import { useState } from 'react';
import { CheckCircle2, FileText, PlaySquare, TrendingUp, UserCheck, Wallet } from 'lucide-react';

type AudienceTab = 'brand' | 'creator';

interface StepItem {
  title: string;
  description: string;
  screenBadge: string;
  screenTitle: string;
  screenRows: Array<{ label: string; value: string; highlight?: 'lime' | 'muted' }>;
}

const BRAND_STEPS: StepItem[] = [
  {
    title: '1. Brief anlegen',
    description: 'Produkt, Plattform, Preis pro 1.000 Views und Budget-Obergrenze. Fertig.',
    screenBadge: 'Schritt 1 von 3',
    screenTitle: 'Kampagnen-Brief',
    screenRows: [
      { label: 'Plattformen', value: 'TikTok, Instagram Reels' },
      { label: 'Preis pro 1.000 Views', value: '2,00 €', highlight: 'lime' },
      { label: 'Budget-Obergrenze', value: '500 € (fest)' },
    ],
  },
  {
    title: '2. Creator posten',
    description: 'Creator aus dem Pool posten auf ihren eigenen Profilen und reichen den Link ein.',
    screenBadge: 'Schritt 2 von 3',
    screenTitle: 'Eingereichte Beiträge',
    screenRows: [
      { label: 'TikTok Beitrag #14', value: 'Brief erfüllt · Geprüft', highlight: 'lime' },
      { label: 'Instagram Reel #15', value: 'Brief erfüllt · Geprüft', highlight: 'lime' },
      { label: 'TikTok Beitrag #16', value: 'Prüfung läuft', highlight: 'muted' },
    ],
  },
  {
    title: '3. Du zahlst geprüfte Views',
    description: 'Jeder Beitrag wird gegen deinen Brief geprüft. Gelöschte oder unpassende Beiträge zählen nicht.',
    screenBadge: 'Schritt 3 von 3',
    screenTitle: 'Live-Report & Abrechnung',
    screenRows: [
      { label: 'Geprüfte Views', value: '65.000 Views', highlight: 'lime' },
      { label: 'Abgerechnet', value: '130,00 € von 500 €' },
      { label: 'Restbudget', value: '74 % übrig', highlight: 'lime' },
    ],
  },
];

const CREATOR_STEPS: StepItem[] = [
  {
    title: '1. Profil anlegen',
    description: 'TikTok oder Instagram verbinden. Dauert ein paar Minuten.',
    screenBadge: 'Schritt 1 von 3',
    screenTitle: 'Dein Creator-Profil',
    screenRows: [
      { label: 'Anmeldung', value: 'Kostenlos, 0 % Gebühr', highlight: 'lime' },
      { label: 'Verbundene Kanäle', value: 'TikTok & Instagram' },
      { label: 'Kategorien', value: 'Bis zu 3 Themenbereiche' },
    ],
  },
  {
    title: '2. Kampagne aussuchen',
    description: 'Du siehst vorher, was eine Marke pro 1.000 Views zahlt. Du entscheidest, ob du mitmachst.',
    screenBadge: 'Schritt 2 von 3',
    screenTitle: 'Offene Kampagnen',
    screenRows: [
      { label: 'Vergütung sichtbar', value: '2,00 € / 1.000 Views', highlight: 'lime' },
      { label: 'Checkliste im Brief', value: 'Vor Dreh klar sichtbar' },
      { label: 'Verbleibendes Budget', value: 'Live-Fortschritt' },
    ],
  },
  {
    title: '3. Posten und Geld bekommen',
    description: 'Link einreichen. Nach der Prüfung zählen deine Views bis zum Kampagnenende.',
    screenBadge: 'Schritt 3 von 3',
    screenTitle: 'Deine Auszahlung',
    screenRows: [
      { label: 'Dein Anteil', value: '100 % des View-Satzes', highlight: 'lime' },
      { label: 'Plattformgebühr Creator', value: '0 %' },
      { label: 'Status', value: 'Beitrag zählt', highlight: 'lime' },
    ],
  },
];

function StepScreenGraphic({ tab, stepIndex, step }: { tab: AudienceTab; stepIndex: number; step: StepItem }) {
  const icons =
    tab === 'brand'
      ? [FileText, PlaySquare, TrendingUp]
      : [UserCheck, CheckCircle2, Wallet];
  const Icon = icons[stepIndex] || FileText;

  return (
    <div className="rounded-[20px] border border-[#E4E1D8] bg-[#F7F6F2] p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#121212] shadow-sm">
          <Icon size={14} aria-hidden="true" className="text-[#6C2BD9]" />
          {step.screenBadge}
        </span>
        <span className="rounded-full border border-[#E4E1D8] bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#5C5A55]">
          Beispielansicht
        </span>
      </div>

      {/* Kompakte Inline-SVG Ablauf-Grafik (< 3 KB, kein Autoplay) */}
      <div className="mt-5 rounded-[16px] border border-[#E4E1D8] bg-white p-5">
        <div className="flex items-center justify-between gap-2 border-b border-[#E4E1D8] pb-3.5">
          <p className="font-display text-lg font-bold text-[#121212]">{step.screenTitle}</p>
          <svg width="72" height="16" viewBox="0 0 72 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="5" fill={stepIndex === 0 ? '#121212' : '#E4E1D8'} />
            <line x1="16" y1="8" x2="28" y2="8" stroke="#E4E1D8" strokeWidth="2" />
            <circle cx="36" cy="8" r="5" fill={stepIndex === 1 ? '#121212' : '#E4E1D8'} />
            <line x1="44" y1="8" x2="56" y2="8" stroke="#E4E1D8" strokeWidth="2" />
            <circle cx="64" cy="8" r="5" fill={stepIndex === 2 ? '#C8F04B' : '#E4E1D8'} stroke={stepIndex === 2 ? '#121212' : 'none'} strokeWidth="1.5" />
          </svg>
        </div>

        <dl className="mt-4 space-y-3">
          {step.screenRows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 rounded-xl border border-[#E4E1D8]/80 bg-[#F7F6F2]/60 px-4 py-3 text-sm"
            >
              <dt className="text-[#5C5A55]">{row.label}</dt>
              <dd
                className={`font-semibold tabular-nums ${
                  row.highlight === 'lime'
                    ? 'rounded-md bg-[#C8F04B] px-2 py-0.5 text-[#121212]'
                    : row.highlight === 'muted'
                      ? 'text-[#5C5A55]'
                      : 'text-[#121212]'
                }`}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

export default function CampaignHowTabs() {
  const [activeTab, setActiveTab] = useState<AudienceTab>('brand');
  const [brandStep, setBrandStep] = useState(0);
  const [creatorStep, setCreatorStep] = useState(0);

  return (
    <section
      id="so-funktionierts"
      aria-labelledby="home-how-title"
      className="scroll-mt-20 bg-white px-5 py-16 sm:px-8 sm:py-28"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-[#5C5A55]">Ablauf in 3 Schritten</p>
          <h2
            id="home-how-title"
            className="mt-2 font-display text-[30px] font-bold leading-[34px] tracking-[-0.02em] text-[#121212] sm:text-[44px] sm:leading-[48px]"
          >
            So läuft eine Kampagne
          </h2>

          {/* Segmented Control */}
          <div
            role="tablist"
            aria-label="Ablauf nach Zielgruppe"
            className="mx-auto mt-7 inline-grid grid-cols-2 rounded-full border border-[#E4E1D8] bg-[#F7F6F2] p-1"
          >
            <button
              type="button"
              role="tab"
              id="tab-how-brand"
              aria-selected={activeTab === 'brand'}
              aria-controls="panel-how-brand"
              onClick={() => setActiveTab('brand')}
              className={`min-h-[44px] rounded-full px-6 text-sm font-semibold transition-colors duration-150 ${
                activeTab === 'brand'
                  ? 'bg-[#121212] text-[#F7F6F2]'
                  : 'text-[#5C5A55] hover:text-[#121212]'
              }`}
            >
              Für Marken
            </button>
            <button
              type="button"
              role="tab"
              id="tab-how-creator"
              aria-selected={activeTab === 'creator'}
              aria-controls="panel-how-creator"
              onClick={() => setActiveTab('creator')}
              className={`min-h-[44px] rounded-full px-6 text-sm font-semibold transition-colors duration-150 ${
                activeTab === 'creator'
                  ? 'bg-[#121212] text-[#F7F6F2]'
                  : 'text-[#5C5A55] hover:text-[#121212]'
              }`}
            >
              Für Creator
            </button>
          </div>
        </div>

        {/* Beide Tab-Panels im SSR-DOM (inaktives Panel mit hidden="until-found" fuer Suchmaschinen & KI) */}
        <div
          id="panel-how-brand"
          role="tabpanel"
          aria-labelledby="tab-how-brand"
          // @ts-expect-error React 18 supports hidden="until-found" as DOM attribute
          hidden={activeTab !== 'brand' ? 'until-found' : undefined}
          className="mt-12 grid items-start gap-8 lg:grid-cols-12 lg:gap-12"
        >
          <ol className="space-y-3 lg:col-span-6">
            {BRAND_STEPS.map((step, index) => {
              const selected = brandStep === index;
              return (
                <li key={step.title}>
                  <button
                    type="button"
                    onClick={() => setBrandStep(index)}
                    aria-current={selected ? 'step' : undefined}
                    className={`w-full rounded-[20px] border p-5 text-left transition-colors duration-150 ${
                      selected
                        ? 'border-[#121212] bg-[#F7F6F2]'
                        : 'border-[#E4E1D8] bg-white hover:border-[#121212]/40'
                    }`}
                  >
                    <h3 className="font-display text-[19px] font-semibold leading-6 text-[#121212] sm:text-[22px] sm:leading-7">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#5C5A55] sm:text-base sm:leading-7">
                      {step.description}
                    </p>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="lg:sticky lg:top-24 lg:col-span-6">
            <StepScreenGraphic tab="brand" stepIndex={brandStep} step={BRAND_STEPS[brandStep]} />
          </div>
        </div>

        <div
          id="panel-how-creator"
          role="tabpanel"
          aria-labelledby="tab-how-creator"
          // @ts-expect-error React 18 supports hidden="until-found" as DOM attribute
          hidden={activeTab !== 'creator' ? 'until-found' : undefined}
          className="mt-12 grid items-start gap-8 lg:grid-cols-12 lg:gap-12"
        >
          <ol className="space-y-3 lg:col-span-6">
            {CREATOR_STEPS.map((step, index) => {
              const selected = creatorStep === index;
              return (
                <li key={step.title}>
                  <button
                    type="button"
                    onClick={() => setCreatorStep(index)}
                    aria-current={selected ? 'step' : undefined}
                    className={`w-full rounded-[20px] border p-5 text-left transition-colors duration-150 ${
                      selected
                        ? 'border-[#121212] bg-[#F7F6F2]'
                        : 'border-[#E4E1D8] bg-white hover:border-[#121212]/40'
                    }`}
                  >
                    <h3 className="font-display text-[19px] font-semibold leading-6 text-[#121212] sm:text-[22px] sm:leading-7">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#5C5A55] sm:text-base sm:leading-7">
                      {step.description}
                    </p>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="lg:sticky lg:top-24 lg:col-span-6">
            <StepScreenGraphic tab="creator" stepIndex={creatorStep} step={CREATOR_STEPS[creatorStep]} />
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState } from 'react';
import {
  Award,
  Bot,
  Calendar,
  Check,
  Coins,
  Globe,
  Layers,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { CLUB_LEVELS, type DemoSection } from './data';

const GRADIENT =
  'linear-gradient(152deg, #0396F8 0%, #1F6FF4 25%, #3F58F2 50%, #653AED 75%, #9131EF 100%)';

interface Props {
  creatorCountLabel: string;
  onNavigate: (section: DemoSection) => void;
  onOpenStrategyModal: (defaultTopic?: string) => void;
}

export default function BrandsClubSection({
  creatorCountLabel,
  onNavigate,
  onOpenStrategyModal,
}: Props) {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [microCreators, setMicroCreators] = useState<number>(120);
  const [ordersPerCreator, setOrdersPerCreator] = useState<number>(6);
  const [avgOrderValue, setAvgOrderValue] = useState<number>(48);

  const currentLevel =
    CLUB_LEVELS.find((l) => l.level === selectedLevel) || CLUB_LEVELS[0];

  const monthlyClips = microCreators * 12; // ~3 short clips per week
  const monthlyOrders = microCreators * ordersPerCreator;
  const monthlyRevenue = monthlyOrders * avgOrderValue;
  const classicAgencyCost = monthlyClips * 180; // what 1,440 paid UGC videos would cost conventionally!
  const performancePayout = Math.round(monthlyRevenue * 0.14); // ~14% blended commission + product credits

  return (
    <div className="space-y-16 px-5 pb-20 pt-10 sm:px-8">
      {/* HERO: 3 MODELS FOR BRANDS */}
      <section className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#dce9d1] bg-[#edf5e5] px-3.5 py-1.5 text-xs font-bold text-[#385523]">
            <Rocket size={14} /> Für Marken, E-Commerce & Mediaagenturen
          </span>
          <h1 className="mx-auto mt-4 max-w-4xl text-3xl font-bold leading-tight tracking-[-0.045em] text-ink sm:text-5xl">
            Vom kostenlosen Einzel-Match bis zum eigenen{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRADIENT }}>
              More-Style Creator-Ökosystem.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-ink-soft sm:text-base">
            Nicht jede Marke braucht dasselbe Modell: Suche einzelne Creator für 0 €, kaufe planbare Reichweite über TKP-Bounties oder lass dir dein eigenes 5-Level Affiliate- & Seeding-Portal bauen – ab Tag 1 befüllt aus unseren {creatorCountLabel} Creatorn.
          </p>
        </div>

        {/* 3-Tier Cards */}
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {/* Tier 1 */}
          <div className="flex flex-col justify-between rounded-3xl border border-hairline bg-white p-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-surface px-2.5 py-1 font-mono text-[11px] font-bold text-ink">
                  STUFE 1 · SELF-SERVICE
                </span>
                <Search size={18} className="text-ink-soft" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-ink">Offene KI-Datenbank</h2>
              <p className="mt-1 text-2xl font-extrabold text-ink">
                0 € <span className="text-xs font-normal text-ink-soft">Grundgebühr & 0 % Provision</span>
              </p>
              <p className="mt-3 text-sm leading-6 text-ink-soft">
                Ideal für schnelle Einzel-Assets & Ad-Creatives: Profile prüfen, KI-Briefing erstellen, Kontaktdaten kostenlos per Mail erhalten.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-ink">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#527b33]" /> {creatorCountLabel} echte Creator ohne Login
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#527b33]" /> Direkte Absprache ohne Mittelmann
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#527b33]" /> Offen für KI-Agenten via MCP & A2A
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="mt-6 min-h-[44px] w-full rounded-full border border-hairline bg-surface text-xs font-bold text-ink hover:border-geo-violet hover:bg-white"
            >
              Kostenlose KI-Suche öffnen →
            </button>
          </div>

          {/* Tier 2 */}
          <div className="flex flex-col justify-between rounded-3xl border border-hairline bg-white p-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-[#edf5e5] px-2.5 py-1 font-mono text-[11px] font-bold text-[#385523]">
                  STUFE 2 · REICHWEITEN-PUSH
                </span>
                <Coins size={18} className="text-[#385523]" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-ink">UGC View-Bounties (TKP)</h2>
              <p className="mt-1 text-2xl font-extrabold text-ink">
                Ab 1.000 € <span className="text-xs font-normal text-ink-soft">Kampagnen-Pool</span>
              </p>
              <p className="mt-3 text-sm leading-6 text-ink-soft">
                Ideal für Launches, Apps & Mediaagenturen: Festes Gesamtbudget reinlegen und nur für verifizierte organische Views zahlen (z. B. 3,50 € / 1k).
              </p>
              <ul className="mt-4 space-y-2 text-xs text-ink">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#527b33]" /> Volle Kostenkontrolle per Budget-Deckel
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#527b33]" /> Anti-Bot Fraud-Shield gegen gekaufte Klicks
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#527b33]" /> Fertiger Kampagnen-Report für Endkunden
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('bounties')}
              className="mt-6 min-h-[44px] w-full rounded-full bg-void text-xs font-bold text-white hover:bg-geo-violet"
            >
              Bounty-Marktplatz & Rechner →
            </button>
          </div>

          {/* Tier 3: Highlighted Core Belief */}
          <div className="flex flex-col justify-between rounded-3xl border-2 border-geo-violet bg-[#FBF8FE] p-6 shadow-[0_20px_60px_rgba(139,63,202,0.14)]">
            <div>
              <div className="flex items-center justify-between">
                <span
                  className="rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold text-white"
                  style={{ background: GRADIENT }}
                >
                  STUFE 3 · NACHHALTIGE DOMINANZ
                </span>
                <Award size={18} className="text-geo-violet" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-ink">Eigenes Brand Creator-Portal</h2>
              <p className="mt-1 text-2xl font-extrabold text-geo-violet">
                Turnkey Club <span className="text-xs font-normal text-ink-soft">auf Provisions- & Seeding-Basis</span>
              </p>
              <p className="mt-3 text-sm leading-6 text-ink-soft">
                Das Erfolgsprinzip von More Nutrition & Co. für deine Marke: Hunderte Micro-Creator posten täglich für Produkt-Guthaben + Provision – ohne Fixgagen.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-ink">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-geo-violet" /> Eigenes Portal (z. B. creator.deinemarke.de)
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-geo-violet" /> 5-Level Aufstiegssystem + Code-Tracking
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-geo-violet" /> Direkt-Einladung an unsere {creatorCountLabel} Creator
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => onOpenStrategyModal('Eigenes 5-Level Brand Creator-Portal (More-Modell)')}
              className="mt-6 min-h-[44px] w-full rounded-full bg-geo-violet text-xs font-bold text-white shadow-md hover:bg-[#7531ae]"
            >
              Strategy Session & Pilot-Angebot sichern →
            </button>
          </div>
        </div>
      </section>

      {/* INTERACTIVE 5-LEVEL MORE-STYLE SYSTEM EXPLORER */}
      <section className="mx-auto max-w-6xl rounded-[36px] border border-hairline bg-white p-6 shadow-[0_24px_70px_rgba(35,22,47,0.06)] sm:p-10">
        <div className="flex flex-col justify-between gap-4 border-b border-hairline pb-6 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-geo-violet">
              Blueprint · Warum Performance-Clubs klassische Fixgagen schlagen
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-4xl">
              Das 5-Level Creator-Programm (schlüsselfertig für deine Brand)
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
              Statt 5 teuren Influencern Fixbeträge zu überweisen, aktivierst du hunderte echte Micro-Creator ab 500 Followern. Keine feste Gage – Aufstieg rein über Mehrwert, Community-Fit und Code-Umsatz.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-surface px-3.5 py-1.5 text-xs font-bold text-ink">
            Null IT-Integration auf Kundenseite nötig
          </span>
        </div>

        {/* Level Tabs */}
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {CLUB_LEVELS.map((lvl) => {
            const active = lvl.level === selectedLevel;
            return (
              <button
                key={lvl.level}
                type="button"
                onClick={() => setSelectedLevel(lvl.level)}
                className={`rounded-2xl border p-3.5 text-left transition-all ${
                  active
                    ? 'border-geo-violet bg-void text-white shadow-lg'
                    : 'border-hairline bg-surface text-ink hover:border-geo-violet'
                }`}
              >
                <p
                  className={`font-mono text-[10px] font-bold uppercase tracking-wider ${
                    active ? 'text-geo-green' : 'text-geo-violet'
                  }`}
                >
                  Stufe {lvl.level}
                </p>
                <p className="mt-1 text-xs font-bold leading-snug">
                  {lvl.name.replace(`Level ${lvl.level} · `, '')}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active Level Detail */}
        <div className="mt-6 grid gap-6 rounded-3xl border border-hairline bg-surface p-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-3 py-1 font-mono text-xs font-bold text-white"
                style={{ background: GRADIENT }}
              >
                {currentLevel.name}
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-ink">
                Typischer Creator-Verdienst: {currentLevel.monthlyEarning}
              </span>
            </div>
            <h3 className="mt-3 text-xl font-bold text-ink">{currentLevel.subtitle}</h3>
            <p className="mt-1 text-xs font-semibold text-ink-soft">
              Qualifikation: {currentLevel.entryRule}
            </p>

            <ul className="mt-4 space-y-2.5">
              {currentLevel.creatorPerks.map((perk) => (
                <li
                  key={perk}
                  className="flex items-start gap-2.5 rounded-xl border border-hairline bg-white p-3 text-sm text-ink"
                >
                  <Check size={16} className="mt-0.5 shrink-0 text-geo-violet" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-between rounded-2xl bg-void p-6 text-white">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-geo-green">
                Warum sich diese Stufe für die Brand rechnet
              </p>
              <p className="mt-3 text-base font-semibold leading-7 text-white">
                {currentLevel.brandEconomics}
              </p>

              <div className="mt-5 space-y-3 border-t border-white/10 pt-4 text-xs text-white/75">
                <p className="flex items-start gap-2">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0 text-geo-green" />
                  <span>
                    <strong className="text-white">Produkt-Guthaben-Hebel:</strong> Tauscht eine Creatorin 150 € gesammelte Provision gegen neue Shop-Produkte, kostet dich das bei 25 % Wareneinsatz real nur ~37,50 €!
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <Globe size={15} className="mt-0.5 shrink-0 text-[#62B4FF]" />
                  <span>
                    <strong className="text-white">Gehostet ohne IT-Blockade:</strong> Läuft sofort auf einer Subdomain (z. B. <code className="text-white">creator.deinemarke.de</code>) inkl. Bewerbungs-Funnel, Gutscheincode-Sync & KI-Briefings.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <Bot size={15} className="mt-0.5 shrink-0 text-geo-violet-soft" />
                  <span>
                    <strong className="text-white">Tech-Add-ons inklusive:</strong> Auf Wunsch liefern wir direkt ChatGPT-Plugin / MCP-Server & automatisierte Creator-Einladungen mit.
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                onOpenStrategyModal(`White-Label Creator-Club Anfrage (Fokus ab Stufe ${currentLevel.level})`)
              }
              className="mt-6 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-white text-xs font-extrabold text-void hover:bg-geo-green"
            >
              <Calendar size={15} />
              Dieses Portal für unsere Marke durchsprechen
            </button>
          </div>
        </div>
      </section>

      {/* ROI / UNIT ECONOMICS CALCULATOR */}
      <section className="mx-auto max-w-6xl rounded-3xl bg-void p-6 text-white sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-geo-green">
              Unit-Economics Vergleich
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              Was kosten {monthlyClips.toLocaleString('de-DE')} organische Videos im Monat?
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Rechne durch, warum Marken mit einem eigenen Micro-Creator-Club den Markt fluten können, während Wettbewerber an Einzelvideo-Preisen scheitern.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/75">Aktive Micro-Creator im Club (ab 500 Followern)</span>
                  <span className="font-mono font-bold text-geo-green">{microCreators} Creator</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={400}
                  step={10}
                  value={microCreators}
                  onChange={(e) => setMicroCreators(Number(e.target.value))}
                  className="mt-1.5 w-full accent-geo-green"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/75">Ø Code-Bestellungen pro Creator / Monat</span>
                  <span className="font-mono font-bold text-white">{ordersPerCreator} Bestellungen</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={20}
                  step={1}
                  value={ordersPerCreator}
                  onChange={(e) => setOrdersPerCreator(Number(e.target.value))}
                  className="mt-1.5 w-full accent-geo-green"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/75">Ø Warenkorbwert (AOV)</span>
                  <span className="font-mono font-bold text-white">{avgOrderValue} €</span>
                </div>
                <input
                  type="range"
                  min={25}
                  max={120}
                  step={5}
                  value={avgOrderValue}
                  onChange={(e) => setAvgOrderValue(Number(e.target.value))}
                  className="mt-1.5 w-full accent-geo-green"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4">
              <p className="text-xs font-semibold text-red-200">
                Klassischer Einkauf ({monthlyClips.toLocaleString('de-DE')} Videos × 180 € Fixpreis)
              </p>
              <p className="mt-1 text-2xl font-extrabold text-red-300 line-through">
                {classicAgencyCost.toLocaleString('de-DE')} € / Monat Fixkosten
              </p>
              <p className="mt-0.5 text-[11px] text-red-200/75">
                Unbezahlbar für täglichen Dauer-Content – volles Risiko vor dem ersten Verkauf.
              </p>
            </div>

            <div className="rounded-2xl border border-geo-green/40 bg-geo-green/10 p-4">
              <p className="text-xs font-semibold text-geo-green">
                Dein eigenes Performance-Club-System (0 € Fixgagen)
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-white/65">Erzielter Code-Umsatz</p>
                  <p className="text-2xl font-extrabold text-white">
                    {monthlyRevenue.toLocaleString('de-DE')} €
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-white/65">Provision & Seeding (~14 %)</p>
                  <p className="text-2xl font-extrabold text-geo-green">
                    {performancePayout.toLocaleString('de-DE')} €
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-white/75">
                Inkl. {monthlyClips.toLocaleString('de-DE')} authentischen Alltags-Clips pro Monat – gezahlt erst nach tatsächlichem Umsatz.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onOpenStrategyModal(
                  `Club-Kalkulation: ${microCreators} Micro-Creator / Zielumsatz ${monthlyRevenue.toLocaleString('de-DE')} €`,
                )
              }
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-geo-green px-6 text-sm font-extrabold text-void hover:opacity-95"
            >
              <Sparkles size={16} />
              Kostenlose 15-Min Strategy Session buchen
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

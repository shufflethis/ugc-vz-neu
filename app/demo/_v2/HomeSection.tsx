'use client';

import { useState } from 'react';
import {
  ArrowRight,
  BadgeEuro,
  Bot,
  Calendar,
  Check,
  Coins,
  Layers,
  Receipt,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import {
  AI_PRESETS,
  BOUNTY_CAMPAIGNS,
  LOCALES,
  type DemoSection,
  type LocaleCode,
} from './data';

const GRADIENT =
  'linear-gradient(152deg, #0396F8 0%, #1F6FF4 25%, #3F58F2 50%, #653AED 75%, #9131EF 100%)';

interface Props {
  locale: LocaleCode;
  creatorCountLabel: string;
  shortlist: string[];
  onToggleShortlist: (id: string) => void;
  onNavigate: (section: DemoSection) => void;
  onOpenStrategyModal: (defaultTopic?: string) => void;
}

export default function HomeSection({
  locale,
  creatorCountLabel,
  shortlist,
  onToggleShortlist,
  onNavigate,
  onOpenStrategyModal,
}: Props) {
  const t = LOCALES[locale];
  const [selectedPresetId, setSelectedPresetId] = useState<string>(AI_PRESETS[0].id);
  const [customPrompt, setCustomPrompt] = useState<string>(AI_PRESETS[0].prompt);
  const [generatedTopic, setGeneratedTopic] = useState<string | null>(null);

  const activePreset =
    AI_PRESETS.find((p) => p.id === selectedPresetId) || AI_PRESETS[0];

  const handleSelectPreset = (id: string) => {
    const found = AI_PRESETS.find((p) => p.id === id);
    if (!found) return;
    setSelectedPresetId(id);
    setCustomPrompt(found.prompt);
    setGeneratedTopic(null);
  };

  const handleCustomGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    setGeneratedTopic(customPrompt.trim());
  };

  const displayedScript = generatedTopic
    ? {
        hook: `0–3s Hook: „Wartet kurz – warum redet eigentlich noch kaum jemand über ${generatedTopic.slice(0, 48)}${generatedTopic.length > 48 ? '…' : ''}?“`,
        body: `3–14s Echter Alltags-Beweis: Direkt ungestellt am Handy zeigen, welches konkrete Problem gelöst wird – kein abgelesener Werbetext, schnelle Schnitte + Nahaufnahme der Anwendung.`,
        cta: `14–20s CTA: „Probier-Link & Details stehen im Profil – schreibt ehrlich in die Kommentare, ob ihr es testen würdet.“ (inkl. Anzeige-Kennzeichnung)`,
      }
    : activePreset.script;

  return (
    <div className="space-y-20 pb-20">
      {/* HERO */}
      <section className="relative overflow-hidden bg-surface px-5 pb-20 pt-10 sm:px-8 sm:pb-24 sm:pt-14">
        <div
          className="pointer-events-none absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full opacity-[0.13] blur-3xl"
          style={{ background: GRADIENT }}
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="mb-5 inline-flex flex-wrap items-center gap-2 rounded-full border border-[#dce9d1] bg-[#edf5e5] px-3.5 py-1.5 text-xs font-semibold text-[#385523]">
              <span className="h-2 w-2 rounded-full bg-[#527b33]" />
              <span>{t.badge.replace('730+', creatorCountLabel)}</span>
              <span className="rounded-full bg-white/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink">
                {t.domain}
              </span>
            </div>

            <h1 className="text-[2.45rem] font-bold leading-[1.03] tracking-[-0.05em] text-ink sm:text-6xl lg:text-[3.85rem]">
              {t.heroTitleTop}
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: GRADIENT }}
              >
                {t.heroTitleAccent}
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-ink-soft sm:text-lg">
              {t.heroSub}
            </p>

            {/* Dual CTA: Self-Service + Hypefy-Style Book Strategy Session */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <a
                href="#ki-briefing-studio"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-geo-violet px-6 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(139,63,202,0.32)] transition-transform hover:-translate-y-0.5"
              >
                <Sparkles size={17} />
                {t.ctaPrimary}
              </a>
              <button
                type="button"
                onClick={() => onOpenStrategyModal('Pilot-Kampagne / Brand-Club')}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-ink/15 bg-white px-6 text-sm font-semibold text-ink transition-colors hover:border-geo-violet hover:text-geo-violet"
              >
                <Calendar size={16} />
                {t.ctaStrategy}
                <span className="rounded-full bg-[#edf5e5] px-2 py-0.5 text-[10px] font-bold text-[#385523]">
                  Pilot-Rabatt
                </span>
              </button>
            </div>

            {/* Creator Entry Pill with Starter Bonus + Tax Autopilot */}
            <div className="mt-5">
              <button
                type="button"
                onClick={() => onNavigate('creator')}
                className="group inline-flex items-center gap-2.5 rounded-2xl border border-hairline bg-white/85 px-3.5 py-2 text-left text-xs text-ink-soft backdrop-blur transition-colors hover:border-geo-violet hover:bg-white sm:rounded-full"
              >
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white"
                  style={{ background: GRADIENT }}
                >
                  Creator Hub
                </span>
                <span className="font-medium text-ink">{t.creatorPill}</span>
                <ArrowRight
                  size={15}
                  className="shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-geo-violet"
                />
              </button>
            </div>
          </div>

          {/* Right Visual: Live 3-Engine Architecture Stack */}
          <div className="rounded-3xl border border-hairline bg-white p-5 shadow-[0_28px_80px_rgba(35,22,47,0.09)] sm:p-6">
            <div className="flex items-center justify-between border-b border-hairline pb-3.5">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-geo-violet">
                  UGC VZ 2.0 · All-in-One Engine
                </p>
                <p className="text-sm font-bold text-ink">
                  3 Modelle – 1 wachsender Creator-Pool ({creatorCountLabel})
                </p>
              </div>
              <span className="rounded-full bg-[#edf5e5] px-2.5 py-1 text-[11px] font-bold text-[#385523]">
                0 % Creator-Abzug
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {/* Card 1 */}
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('ki-briefing-studio');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex w-full items-start justify-between gap-3 rounded-2xl border border-hairline bg-surface p-3.5 text-left transition-colors hover:border-geo-violet hover:bg-white"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-geo-violet shadow-sm">
                    <Search size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink">{t.pillar1Title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-ink-soft">{t.pillar1Desc}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-lg bg-white px-2 py-1 font-mono text-[10px] font-bold text-ink">
                  0 €
                </span>
              </button>

              {/* Card 2 */}
              <button
                type="button"
                onClick={() => onNavigate('bounties')}
                className="flex w-full items-start justify-between gap-3 rounded-2xl border border-geo-violet/30 bg-[#FBF8FE] p-3.5 text-left transition-colors hover:border-geo-violet"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ background: GRADIENT }}
                  >
                    <Coins size={18} />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-bold text-ink">{t.pillar2Title}</p>
                      <span className="rounded bg-geo-violet px-1.5 py-0.5 text-[10px] font-bold text-white">
                        NEU
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-5 text-ink-soft">{t.pillar2Desc}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-lg bg-white px-2 py-1 font-mono text-[10px] font-bold text-geo-violet">
                  2–5 € TKP
                </span>
              </button>

              {/* Card 3 */}
              <button
                type="button"
                onClick={() => onNavigate('brands')}
                className="flex w-full items-start justify-between gap-3 rounded-2xl border border-hairline bg-surface p-3.5 text-left transition-colors hover:border-geo-violet hover:bg-white"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-void text-white">
                    <Rocket size={18} />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-bold text-ink">{t.pillar3Title}</p>
                      <span className="rounded bg-[#edf5e5] px-1.5 py-0.5 text-[10px] font-bold text-[#385523]">
                        B2B High-Impact
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-5 text-ink-soft">{t.pillar3Desc}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-lg bg-white px-2 py-1 font-mono text-[10px] font-bold text-ink">
                  Level 1–5
                </span>
              </button>
            </div>

            {/* Bottom Trust Bar inside Visual */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-void px-3.5 py-2.5 text-xs text-white">
              <span className="flex items-center gap-1.5 text-white/85">
                <Receipt size={14} className="text-geo-green" />
                Inkl. Creator Steuer-Autopilot (Accountable Deal)
              </span>
              <button
                type="button"
                onClick={() => onNavigate('vergleich')}
                className="font-semibold text-geo-green underline underline-offset-4 hover:no-underline"
              >
                0-%-Gebührenvergleich →
              </button>
            </div>
          </div>
        </div>

        {/* KLARE LOGIN- & KERNMODELL-REGEL FUER BRANDS */}
        <div className="relative mx-auto mt-8 max-w-6xl rounded-2xl border border-hairline bg-white px-5 py-4 shadow-sm sm:px-6">
          <div className="grid gap-4 text-xs sm:grid-cols-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#edf5e5] font-bold text-[#385523]">
                1
              </span>
              <div>
                <p className="font-bold text-ink">Kern-Modell bleibt 1:1 offen (OHNE Brand-Login)</p>
                <p className="mt-0.5 text-ink-soft">
                  Creator suchen, Profile prüfen & Kontaktdaten gratis per Mail anfordern – keine Registrierungshürde.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F4EDFB] font-bold text-geo-violet">
                2
              </span>
              <div>
                <p className="font-bold text-ink">Brand-Account erst bei Bounty-Buchung</p>
                <p className="mt-0.5 text-ink-soft">
                  Nur wer ein Euro-Budget für Pay-per-View Bounties oder ein eigenes Club-Portal bucht, legt ein Brand-Konto an.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-2 font-bold text-ink">
                €
              </span>
              <div>
                <p className="font-bold text-ink">100 % Euro / Cash (Kein Krypto)</p>
                <p className="mt-0.5 text-ink-soft">
                  Einzahlung per B2B-Rechnung / SEPA / Karte (Stripe Connect / Mangopay), Creator-Payout per SEPA aufs Girokonto.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE AI SEARCH + BRIEFING / SCRIPT GENERATOR (Creonda + Hypefy + UGCLaunch) */}
      <section id="ki-briefing-studio" className="scroll-mt-24 px-5 sm:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-hairline bg-white p-5 shadow-[0_24px_70px_rgba(35,22,47,0.07)] sm:p-8">
          <div className="flex flex-col gap-3 border-b border-hairline pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-geo-violet">
                KI-Briefing, Skript & Creator-Matching (ohne Login)
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Beschreib dein Produkt – erhalte sofort Creator-Shortlist & drehfertiges Video-Skript
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-soft">
              <ShieldCheck size={16} className="text-[#527b33]" />
              <span>0 € Suche · Auswahl: {shortlist.length} Creator</span>
            </div>
          </div>

          {/* Preset Chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            {AI_PRESETS.map((preset) => {
              const active = preset.id === selectedPresetId && !generatedTopic;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-geo-violet bg-geo-violet text-white'
                      : 'border-hairline bg-surface text-ink hover:border-geo-violet'
                  }`}
                >
                  {preset.chip}
                </button>
              );
            })}
          </div>

          {/* Prompt Input */}
          <form onSubmit={handleCustomGenerate} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Produkt, Zielgruppe, Kanal & Ziel eingeben (z. B. Protein-Eiskaffee, TikTok Routine)..."
              className="min-h-[48px] flex-1 rounded-2xl border border-hairline bg-surface px-4 text-sm text-ink focus:border-geo-violet focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-void px-5 text-sm font-semibold text-white transition-colors hover:bg-geo-violet"
            >
              <Bot size={16} />
              KI-Briefing & Match generieren
            </button>
          </form>

          {/* Output Grid: Left = AI Video Script, Right = Matched Creators */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            {/* AI Script Box */}
            <div className="rounded-2xl border border-hairline bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-geo-violet">
                  <Sparkles size={14} /> KI-Skript & Kampagnen-Empfehlung
                </span>
                <span className="rounded-full bg-[#edf5e5] px-2.5 py-1 text-[11px] font-bold text-[#385523]">
                  {activePreset.recommendedModeLabel}
                </span>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-xl border border-hairline bg-white p-3.5">
                  <p className="text-xs font-bold uppercase tracking-wide text-geo-violet">
                    1 · Scroll-Stopper Hook
                  </p>
                  <p className="mt-1 leading-6 text-ink">{displayedScript.hook}</p>
                </div>
                <div className="rounded-xl border border-hairline bg-white p-3.5">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#1F6FF4]">
                    2 · Authentischer Produktbeweis
                  </p>
                  <p className="mt-1 leading-6 text-ink">{displayedScript.body}</p>
                </div>
                <div className="rounded-xl border border-hairline bg-white p-3.5">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#385523]">
                    3 · Call-to-Action & Code
                  </p>
                  <p className="mt-1 leading-6 text-ink">{displayedScript.cta}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onNavigate(
                      activePreset.recommendedMode === 'club'
                        ? 'brands'
                        : activePreset.recommendedMode === 'bounty'
                          ? 'bounties'
                          : 'brands',
                    )
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-geo-violet hover:underline"
                >
                  Passendes Kampagnenmodell öffnen <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenStrategyModal(customPrompt.slice(0, 60))}
                  className="rounded-xl border border-hairline bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-geo-violet"
                >
                  Mit Team besprechen (20 % Neukunden-Vorteil)
                </button>
              </div>
            </div>

            {/* Matched Creators */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-ink">
                  Sofort verfügbare Creator-Vorschläge aus {creatorCountLabel} Profilen
                </p>
                <span className="text-xs text-ink-soft">Kein KI-Avatar · Geprüfte Profile</span>
              </div>

              {activePreset.creators.map((c) => {
                const selected = shortlist.includes(c.id);
                return (
                  <div
                    key={c.id}
                    className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 transition-colors sm:flex-row sm:items-center ${
                      selected
                        ? 'border-geo-violet bg-[#FBF8FE]'
                        : 'border-hairline bg-white hover:border-ink/30'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
                        style={{ background: GRADIENT }}
                      >
                        {c.initials}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-ink">{c.name}</p>
                          <span className="rounded-md bg-[#edf5e5] px-2 py-0.5 text-[11px] font-bold text-[#385523]">
                            {c.fitScore} % Match
                          </span>
                          <span className="rounded-md bg-surface px-2 py-0.5 text-[11px] font-medium text-ink-soft">
                            {c.modeTag}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-ink-soft">
                          {c.niche} · {c.followers} · <strong className="text-ink">{c.avgViews}</strong>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleShortlist(c.id)}
                      className={`inline-flex min-h-[38px] shrink-0 items-center justify-center gap-1.5 rounded-xl px-3.5 text-xs font-bold transition-colors ${
                        selected
                          ? 'bg-[#edf5e5] text-[#385523]'
                          : 'bg-geo-violet text-white hover:bg-[#7531ae]'
                      }`}
                    >
                      {selected ? (
                        <>
                          <Check size={14} /> Auf Shortlist
                        </>
                      ) : (
                        '+ Zur Shortlist'
                      )}
                    </button>
                  </div>
                );
              })}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-hairline bg-surface px-4 py-3 text-xs">
                <span className="text-ink-soft">
                  Du willst nicht einzeln anfragen, sondern ein festes Budget pro 1.000 Views ausschreiben?
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('bounties')}
                  className="font-bold text-geo-violet hover:underline"
                >
                  Zu den UGC Bounties →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE BOUNTIES TEASER (Contentmarkt / Content Rewards Style) */}
      <section className="px-5 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-geo-violet">
                Neu: UGC Bounty Marketplace
              </p>
              <h2 className="mt-1 text-3xl font-bold tracking-[-0.04em] text-ink sm:text-4xl">
                Feste Budgets. Abrechnung pro 1.000 Views.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft sm:text-base">
                Marken legen wie bei Meta Ads einen Budget-Topf fest. Creator sehen live, wie viel Budget noch frei ist, reichen ihren Clip ein und verdienen pro 1.000 verifizierte Aufrufe.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('bounties')}
              className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full bg-void px-5 text-sm font-semibold text-white hover:bg-geo-violet"
            >
              Alle {BOUNTY_CAMPAIGNS.length} Bounties & Rechner öffnen <ArrowRight size={16} />
            </button>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {BOUNTY_CAMPAIGNS.slice(0, 3).map((b) => {
              const pct = Math.round((b.spentBudget / b.totalBudget) * 100);
              const remaining = b.totalBudget - b.spentBudget;
              return (
                <article
                  key={b.id}
                  className={`flex flex-col justify-between rounded-3xl border p-5 transition-shadow hover:shadow-lg ${
                    b.isOwnCampaign
                      ? 'border-geo-violet bg-[#FBF8FE]'
                      : 'border-hairline bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-void px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                        {b.badge}
                      </span>
                      <span className="rounded-xl bg-[#edf5e5] px-2.5 py-1 text-xs font-extrabold text-[#385523]">
                        {b.cpmEuro.toFixed(2).replace('.', ',')} € / 1k Views
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-ink-soft">{b.brand}</p>
                    <h3 className="mt-1 text-lg font-bold leading-snug text-ink">{b.title}</h3>
                    {b.starterBonus && (
                      <p className="mt-2 inline-block rounded-lg bg-geo-violet/10 px-2.5 py-1 text-xs font-bold text-geo-violet">
                        🎁 {b.starterBonus}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 border-t border-hairline pt-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-soft">
                        Noch <strong className="text-ink">{remaining.toLocaleString('de-DE')} €</strong> von{' '}
                        {b.totalBudget.toLocaleString('de-DE')} € frei
                      </span>
                      <span className="font-mono font-bold text-ink">{pct} %</span>
                    </div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: GRADIENT }}
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-ink-soft">
                        {b.platforms.join(' · ')}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate('bounties')}
                        className="text-xs font-bold text-geo-violet hover:underline"
                      >
                        Briefing & Teilnehmen →
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* DARK STAGE: FAIR-PAY POSITIONING + MORE-SYSTEM + ACCOUNTABLE + GEO */}
      <section className="px-5 sm:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-void p-7 text-white sm:p-12">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <BadgeEuro className="text-geo-green" size={26} />
              <h3 className="mt-4 text-lg font-bold">0 % Verzeichnis-Gebühr & echte Euro-Abrechnung</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Klassische UGC-Plattformen schlagen heimlich 30–50 % auf Creator-Gagen auf. Bei uns bleibt die Direktsuche ohne Login 100 % kostenlos, und bezahlte Bounties laufen sauber in Euro per Rechnung/Stripe & SEPA.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('vergleich')}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-geo-green hover:underline"
              >
                Gebühren-Vergleich ansehen <ArrowRight size={14} />
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <Layers className="text-[#0396F8]" size={26} />
              <h3 className="mt-4 text-lg font-bold">Eigenes More-Style Brand-Portal</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Statt einmaliger Einzelvideos bauen wir Marken ein eigenes 5-Level Creator- & Affiliate-Ökosystem (Produkt-Seeding + Rabattcodes + Aufstiegs-Level) – direkt befüllt aus {creatorCountLabel} Creatorn.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('brands')}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#62B4FF] hover:underline"
              >
                5-Level Club-Baukasten öffnen <ArrowRight size={14} />
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <TrendingUp className="text-geo-violet-soft" size={26} />
              <h3 className="mt-4 text-lg font-bold">Steuer-USP, Agenturen & KI-GEO</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Deutscher Steuer-Autopilot für Creator (Accountable-Kooperation), Multi-Creator-Dashboards für Managements sowie native Anbindung an ChatGPT, MCP & A2A (bereits 800+ KI-Such-Besucher).
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => onNavigate('creator')}
                  className="text-geo-violet-soft hover:underline"
                >
                  Steuer-Rechner →
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('agenturen')}
                  className="text-white/80 hover:underline"
                >
                  Agentur-Hub →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

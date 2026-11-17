'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Check,
  Coins,
  Copy,
  Layers,
  Search,
  Sparkles,
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
  // Moeglichkeit 2: TKP Konfigurator
  const [tkpBudget, setTkpBudget] = useState<number>(2500);
  const [tkpRate, setTkpRate] = useState<number>(3.5);
  const [tkpBooked, setTkpBooked] = useState<boolean>(false);

  // Moeglichkeit 3: Affiliate-Netzwerk auf Provisionsbasis
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [payoutMode, setPayoutMode] = useState<'products' | 'cash'>('products');
  const [copiedDemoCode, setCopiedDemoCode] = useState<boolean>(false);

  const guaranteedViews = Math.round((tkpBudget / tkpRate) * 1000);
  const currentLevel =
    CLUB_LEVELS.find((l) => l.level === selectedLevel) || CLUB_LEVELS[0];

  return (
    <div className="space-y-20 px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      {/* RUHIGER SEITENKOPF */}
      <section className="mx-auto max-w-4xl text-center">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-geo-violet">
          Für Unternehmen &amp; Marken
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-tight tracking-[-0.045em] text-ink sm:text-5xl">
          Drei klare Wege zu{' '}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRADIENT }}>
            echtem Creator-Content.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-ink-soft">
          Vom kostenlosen Einzelkontakt über planbare TKP-Kampagnen bis zum Aufbau deines eigenen Creator-Netzwerks auf reiner Provisionsbasis.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-2 text-xs font-bold">
          <a href="#weg-1" className="rounded-full border border-hairline bg-surface px-4 py-2 text-ink hover:border-ink">
            1 · Creator direkt finden (0 €)
          </a>
          <a href="#weg-2" className="rounded-full border border-hairline bg-surface px-4 py-2 text-ink hover:border-ink">
            2 · TKP-Kampagne starten
          </a>
          <a href="#weg-3" className="rounded-full bg-void px-4 py-2 text-white hover:bg-geo-violet">
            3 · Eigenes Provisions-Netzwerk (Strategie-Call)
          </a>
        </div>
      </section>

      {/* ==================== MOEGLICHKEIT 1: CREATOR DIREKT FINDEN ==================== */}
      <section id="weg-1" className="scroll-mt-24 mx-auto max-w-5xl rounded-3xl border border-hairline bg-surface p-6 sm:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf5e5] px-3 py-1 font-mono text-[11px] font-bold uppercase text-[#385523]">
              <Search size={13} /> Möglichkeit 1 · Selbstsuche ohne Login
            </span>
            <h2 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">
              Creator kostenlos im Verzeichnis finden (0 % Provision)
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft sm:text-base">
              Du brauchst einzelne UGC-Videos für Ads oder deinen Shop? Durchsuche {creatorCountLabel} geprüfte Profile ohne Registrierung, schau dir Arbeitsproben an und erhalte die Kontaktdaten kostenlos per E-Mail.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-full border border-ink/20 bg-white px-6 text-sm font-bold text-ink hover:border-geo-violet hover:text-geo-violet"
          >
            Zur kostenlosen Suche <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ==================== MOEGLICHKEIT 2: TKP-KAMPAGNE MACHEN ==================== */}
      <section id="weg-2" className="scroll-mt-24 mx-auto max-w-5xl rounded-3xl border border-hairline bg-white p-6 shadow-[0_20px_60px_rgba(35,22,47,0.06)] sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-geo-violet/10 px-3 py-1 font-mono text-[11px] font-bold uppercase text-geo-violet">
              <Coins size={13} /> Möglichkeit 2 · Pay-per-1.000-Views
            </span>
            <h2 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">
              TKP-Kampagne schalten mit festem Budget-Deckel
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              Statt mit 20 Creatorn einzeln zu schreiben, hinterlegst du ein festes Gesamtbudget (in Euro per Rechnung oder Stripe). Deine Kampagne landet sofort im Login-Bereich unserer {creatorCountLabel} Creator – bezahlt wird nur pro 1.000 echte, geprüfte Views.
            </p>

            <ul className="mt-5 space-y-2.5 text-xs text-ink sm:text-sm">
              <li className="flex items-center gap-2">
                <Check size={16} className="shrink-0 text-[#527b33]" />
                <span>Volle Kostenkontrolle: Nie mehr als dein festgelegtes Maximalbudget</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="shrink-0 text-[#527b33]" />
                <span>Für TikTok, Instagram Reels &amp; YouTube Shorts (Produktion oder Clipping)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="shrink-0 text-[#527b33]" />
                <span>Automatischer Schutz vor gekauften Klick-Paketen</span>
              </li>
            </ul>
          </div>

          {/* Ruhiger TKP-Rechner & Direktbuchungs-Simulation */}
          <div className="rounded-3xl border border-hairline bg-surface p-6">
            <h3 className="text-base font-bold text-ink">TKP-Kampagne kalkulieren</h3>

            <div className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-soft">Dein Kampagnenbudget</span>
                  <span className="font-mono font-bold text-ink">{tkpBudget.toLocaleString('de-DE')} €</span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={15000}
                  step={500}
                  value={tkpBudget}
                  onChange={(e) => {
                    setTkpBudget(Number(e.target.value));
                    setTkpBooked(false);
                  }}
                  className="mt-1.5 w-full accent-geo-violet"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-soft">Vergütung pro 1.000 Views (TKP)</span>
                  <span className="font-mono font-bold text-geo-violet">
                    {tkpRate.toFixed(2).replace('.', ',')} €
                  </span>
                </div>
                <input
                  type="range"
                  min={2.0}
                  max={6.0}
                  step={0.5}
                  value={tkpRate}
                  onChange={(e) => {
                    setTkpRate(Number(e.target.value));
                    setTkpBooked(false);
                  }}
                  className="mt-1.5 w-full accent-geo-violet"
                />
              </div>

              <div className="rounded-2xl bg-white p-4 text-center">
                <p className="text-xs text-ink-soft">Erreichte organische Views für dein Budget</p>
                <p className="mt-1 text-3xl font-extrabold text-ink">
                  {guaranteedViews.toLocaleString('de-DE')} Views
                </p>
              </div>

              {tkpBooked ? (
                <div className="rounded-2xl bg-[#edf5e5] p-3.5 text-xs font-semibold text-[#2b421a]">
                  ✓ In der Demo vorgemerkt: Im Live-Betrieb legst du hier dein Brand-Konto an und zahlst {tkpBudget.toLocaleString('de-DE')} € per B2B-Rechnung oder Stripe ein.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setTkpBooked(true)}
                  className="min-h-[46px] w-full rounded-full bg-void text-xs font-bold text-white hover:bg-geo-violet"
                >
                  TKP-Kampagne starten ({tkpBudget.toLocaleString('de-DE')} € Budget)
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== MOEGLICHKEIT 3: AFFILIATE / CREATOR-NETZWERK AUF PROVISIONSBASIS -> STRATEGIE-CALL ==================== */}
      <section id="weg-3" className="scroll-mt-24 mx-auto max-w-5xl rounded-[36px] bg-void p-7 text-white sm:p-12">
        <div className="max-w-3xl">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white"
            style={{ background: GRADIENT }}
          >
            <Layers size={13} /> Möglichkeit 3 · Komplettes Business-Konzept auf Provisionsbasis
          </span>
          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Wir bauen dein eigenes UGC-Creator- &amp; Affiliate-Netzwerk auf (More-Prinzip)
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/75 sm:text-base">
            Du willst keine einzelnen Videos einkaufen, sondern hunderte Micro-Creator ab 500 Followern, die jeden Tag organisch über deine Marke posten – <strong>komplett ohne Fixgagen, rein auf Provisions- und Produktbasis</strong>? Wir setzen dir das komplette Partner-Portal technisch auf und laden direkt passende Creator aus unserem {creatorCountLabel} Pool ein.
          </p>
        </div>

        {/* Kompakte, glasklare Vorschau der Mechanik */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Links: 5-Level Aufstiegssystem */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-geo-green">
              5-Stufen-System statt Fixgagen
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {CLUB_LEVELS.map((lvl) => (
                <button
                  key={lvl.level}
                  type="button"
                  onClick={() => setSelectedLevel(lvl.level)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                    selectedLevel === lvl.level
                      ? 'bg-geo-green text-void'
                      : 'bg-white/10 text-white/75 hover:text-white'
                  }`}
                >
                  Level {lvl.level}
                </button>
              ))}
            </div>

            <h3 className="mt-4 text-lg font-bold text-white">{currentLevel.name}</h3>
            <p className="mt-1 text-xs text-white/65">{currentLevel.entryRule}</p>
            <ul className="mt-3 space-y-2 text-xs text-white/85">
              {currentLevel.creatorPerks.map((perk) => (
                <li key={perk} className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-geo-green" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl bg-white/[0.06] p-3 text-xs text-geo-green">
              <strong>Vorteil für deine Marke:</strong> {currentLevel.brandEconomics}
            </p>
          </div>

          {/* Rechts: Eigenes Portal mit Code & Produkt-Tausch */}
          <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#62B4FF]">
                Vorschau deines Partner-Portals (creator.deinemarke.de)
              </p>
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-xs">
                <span>
                  Persönlicher Creator-Code: <strong className="font-mono text-sm text-geo-green">LARA10</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCopiedDemoCode(true);
                    setTimeout(() => setCopiedDemoCode(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 font-bold text-white"
                >
                  <Copy size={12} /> {copiedDemoCode ? 'Kopiert' : 'Test'}
                </button>
              </div>

              <p className="mt-4 text-xs font-bold text-white">
                Cleverer Margen-Hebel (für E-Commerce &amp; SaaS):
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPayoutMode('products')}
                  className={`rounded-xl border p-3 text-left ${
                    payoutMode === 'products'
                      ? 'border-geo-green bg-geo-green/15 text-white'
                      : 'border-white/10 text-white/70'
                  }`}
                >
                  <p className="font-bold text-geo-green">Produkt-Tausch (+20 %)</p>
                  <p className="mt-0.5 text-[11px]">
                    Creator tauscht Provision in Ware → kostet dich nur Wareneinsatz!
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutMode('cash')}
                  className={`rounded-xl border p-3 text-left ${
                    payoutMode === 'cash'
                      ? 'border-white bg-white/10 text-white'
                      : 'border-white/10 text-white/70'
                  }`}
                >
                  <p className="font-bold">Reine Umsatz-Provision</p>
                  <p className="mt-0.5 text-[11px]">
                    10–15 % im Shop oder 20–30 % bei Software/SaaS – erst nach Verkauf.
                  </p>
                </button>
              </div>
            </div>

            {/* DER KLARE STRATEGIE-CALL GENAU FUER MOEGLICHKEIT 3 */}
            <div className="mt-6 border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={() =>
                  onOpenStrategyModal(
                    'Möglichkeit 3: Eigenes UGC-Creator- & Affiliate-Netzwerk auf Provisionsbasis aufbauen',
                  )
                }
                className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-geo-green px-6 text-sm font-extrabold text-void transition-transform hover:-translate-y-0.5"
              >
                <Calendar size={16} />
                Strategie-Call für euer Provisions-Netzwerk vereinbaren
              </button>
              <p className="mt-2 text-center text-[11px] text-white/60">
                15 Minuten direkt mit uns: Wir prüfen euren Shop/SaaS-Case &amp; den Kaltstart über unsere {creatorCountLabel} Creator.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

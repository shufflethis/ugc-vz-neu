'use client';

import { useState } from 'react';
import {
  Award,
  Bot,
  Calendar,
  Check,
  Coins,
  Copy,
  FileCheck2,
  Globe,
  Layers,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
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
  const [portalTab, setPortalTab] = useState<'dashboard' | 'application' | 'saas-vs-ecom'>('dashboard');
  const [businessType, setBusinessType] = useState<'ecommerce' | 'saas'>('ecommerce');
  const [copiedCode, setCopiedCode] = useState(false);
  const [payoutChoice, setPayoutChoice] = useState<'products' | 'cash'>('products');
  const [sampleApplied, setSampleApplied] = useState(false);

  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [microCreators, setMicroCreators] = useState<number>(120);
  const [ordersPerCreator, setOrdersPerCreator] = useState<number>(8);
  const [avgOrderValue, setAvgOrderValue] = useState<number>(52);

  const currentLevel =
    CLUB_LEVELS.find((l) => l.level === selectedLevel) || CLUB_LEVELS[0];

  const monthlyClips = microCreators * 12;
  const monthlyOrders = microCreators * ordersPerCreator;
  const monthlyRevenue = monthlyOrders * avgOrderValue;
  const classicAgencyCost = monthlyClips * 180;
  const commissionRate = businessType === 'saas' ? 0.25 : 0.14;
  const performancePayout = Math.round(monthlyRevenue * commissionRate);

  const handleCopyCode = () => {
    try {
      navigator.clipboard?.writeText('LARA10');
    } catch {
      /* optional */
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-16 px-5 pb-20 pt-10 sm:px-8">
      {/* HERO: DAS MORE-NUTRITION AFFILIATE-UGC-SYSTEM FUER BRANDS */}
      <section className="mx-auto max-w-6xl">
        <div className="grid gap-8 rounded-[36px] bg-void p-7 text-white sm:p-12 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
          <div>
            <span
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white"
              style={{ background: GRADIENT }}
            >
              <Rocket size={13} /> Flaggschiff-Angebot für Brands · Affiliate-UGC-Ökosystem
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.045em] sm:text-5xl">
              Keine Fixgagen. Kein TKP-Risiko.{' '}
              <span className="text-geo-green">
                Dein eigenes Affiliate-Creator-Programm wie bei More Nutrition.
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
              Warum posten bei Marken wie More Nutrition hunderte Micro-Creator ab 500 Followern jeden Tag freiwillig 2–3 Videos? Weil sie <strong>keine Einmal-Gage</strong> bekommen, sondern ein eigenes <strong>Affiliate-Portal mit persönlichem Rabattcode, Produkt-Guthaben und einem 5-Stufen-Aufstiegssystem</strong>. Genau dieses System bauen wir dir schlüsselfertig – und laden zum Start direkt unsere {creatorCountLabel} Creator ein.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onOpenStrategyModal('Eigenes Affiliate-UGC-Programm (More-Modell) anfragen')}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-geo-green px-6 text-sm font-extrabold text-void transition-transform hover:-translate-y-0.5"
              >
                <Calendar size={16} />
                Affiliate-System für unsere Marke anfragen
              </button>
              <a
                href="#live-portal-preview"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-white/20 px-6 text-sm font-semibold text-white hover:border-white"
              >
                Live-Portal unten durchklicken ↓
              </a>
            </div>
          </div>

          {/* Right Summary Box: What We Deliver Turnkey */}
          <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-6">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-geo-green">
              Was wir deiner Brand komplett fertig hinstellen
            </p>
            <ul className="mt-4 space-y-3 text-xs leading-5 text-white/85 sm:text-sm">
              <li className="flex items-start gap-2.5">
                <Check size={16} className="mt-0.5 shrink-0 text-geo-green" />
                <span>
                  <strong className="text-white">Fertige Affiliate-Engine:</strong> Eigene Creator-Codes (z. B. <code className="text-geo-green">LARA10</code>), Tracking-Links, Live-Provisionen & Storno-Abgleich (für Shops & SaaS).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="mt-0.5 shrink-0 text-geo-green" />
                <span>
                  <strong className="text-white">Bezahlung in Produkten ODER Provision:</strong> Creator tauschen gesammeltes Guthaben direkt in deine Produkte (kostet dich nur Wareneinsatz!) oder lassen per SEPA auszahlen.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="mt-0.5 shrink-0 text-geo-green" />
                <span>
                  <strong className="text-white">Level 1 bis Level 5 Gamification:</strong> Von Micro-Seeding (&lt; 500 €/Monat) bis Elite-Partner (eigene Landingpage, Boni, Paid-Ads-Whitelisting, Creator-Events).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="mt-0.5 shrink-0 text-geo-green" />
                <span>
                  <strong className="text-white">Sofort-Kaltstart mit {creatorCountLabel} Creatorn:</strong> Keine leere Software – wir laden passende DACH-Creator aus unserer Datenbank direkt in dein Programm ein.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* INTERACTIVE WHITE-LABEL AFFILIATE PORTAL PREVIEW */}
      <section id="live-portal-preview" className="scroll-mt-24 mx-auto max-w-6xl">
        <div className="rounded-[36px] border-2 border-geo-violet/30 bg-white p-6 shadow-[0_24px_80px_rgba(35,22,47,0.08)] sm:p-10">
          <div className="flex flex-col justify-between gap-4 border-b border-hairline pb-6 lg:flex-row lg:items-center">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-geo-violet">
                Interaktive Vorschau · So sieht das Portal auf deiner Marke aus (z. B. creator.deinemarke.de)
              </p>
              <h2 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">
                Dein eigenes Creator- & Affiliate-Portal (ohne IT-Aufwand auf eurer Seite)
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['dashboard', '1 · Creator Affiliate-Cockpit'],
                  ['application', '2 · Bewerbungs-Funnel'],
                  ['saas-vs-ecom', '3 · Shop vs. SaaS (20–30 %)'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPortalTab(id)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                    portalTab === id
                      ? 'bg-geo-violet text-white'
                      : 'border border-hairline bg-surface text-ink hover:border-geo-violet'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: CREATOR AFFILIATE DASHBOARD */}
          {portalTab === 'dashboard' && (
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4 rounded-3xl border border-hairline bg-surface p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="rounded-md bg-void px-2.5 py-1 font-mono text-[10px] font-bold text-geo-green">
                      WHITE-LABEL CREATOR LOGIN
                    </span>
                    <h3 className="mt-2 text-lg font-bold text-ink">
                      Hallo Lara (@lara.alltag · 1.850 Follower)
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-[#edf5e5] px-3 py-1 text-xs font-extrabold text-[#385523]">
                      Aktuell: Level 2 · Rising Creator (12 % Provision)
                    </span>
                  </div>
                </div>

                {/* Personal Code + Tracking Link */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-hairline bg-white p-4">
                    <p className="text-[11px] font-semibold text-ink-soft">Dein persönlicher Community-Code (10 % Rabatt)</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-mono text-xl font-extrabold text-geo-violet">LARA10</span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1 text-xs font-bold text-ink hover:bg-surface-2"
                      >
                        <Copy size={12} /> {copiedCode ? 'Kopiert' : 'Code'}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-hairline bg-white p-4">
                    <p className="text-[11px] font-semibold text-ink-soft">Dein Affiliate-Tracking-Link (30 Tage Cookie)</p>
                    <p className="mt-2 truncate font-mono text-xs font-bold text-ink">
                      shop.deinemarke.de/?ref=lara10
                    </p>
                    <p className="mt-1 text-[11px] text-[#385523]">✓ Automatisch mit Shop-Checkout synchronisiert</p>
                  </div>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-white p-3.5">
                    <p className="text-[11px] text-ink-soft">Klicks (30 Tage)</p>
                    <p className="mt-1 text-xl font-extrabold text-ink">642</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3.5">
                    <p className="text-[11px] text-ink-soft">Code-Bestellungen</p>
                    <p className="mt-1 text-xl font-extrabold text-ink">19</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3.5">
                    <p className="text-[11px] text-ink-soft">Verdiente Provision</p>
                    <p className="mt-1 text-xl font-extrabold text-[#385523]">168,40 €</p>
                  </div>
                </div>

                {/* Level Progress */}
                <div className="rounded-2xl border border-hairline bg-white p-4">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-ink">Aufstieg zu Level 3 (15 % Provision + festes Monats-Produktpaket)</span>
                    <span className="font-mono font-bold text-geo-violet">19 / 25 Sales</span>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full"
                      style={{ width: '76%', background: GRADIENT }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-ink-soft">
                    Noch 6 Bestellungen über deinen Code bis Level 3!
                  </p>
                </div>
              </div>

              {/* Right: Product Swap vs Cash Payout (The More-Nutrition Secret Sauce!) */}
              <div className="flex flex-col justify-between rounded-3xl bg-void p-6 text-white">
                <div>
                  <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-geo-green">
                    Der Margen-Hebel · Provision gegen Produkte tauschen
                  </p>
                  <h3 className="mt-2 text-xl font-bold">
                    Wie möchte der Creator seine 168,40 € abrufen?
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-white/70">
                    Genau wie bei großen Supplement- & Beauty-Marken können Creator ihr gesammeltes Affiliate-Guthaben direkt mit Aufschlag in neue Produkte umtauschen – und drehen damit sofort das nächste Unboxing-Video!
                  </p>

                  <div className="mt-4 space-y-3">
                    <button
                      type="button"
                      onClick={() => setPayoutChoice('products')}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        payoutChoice === 'products'
                          ? 'border-geo-green bg-geo-green/15'
                          : 'border-white/15 bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-geo-green">
                          Option A · In Shop-Produkte tauschen (+20 % Bonus!)
                        </span>
                        <span className="rounded bg-geo-green px-2 py-0.5 text-[10px] font-extrabold text-void">
                          202,08 € Warenwert
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-white/75">
                        Creator erhält Produkte im Wert von 202 € gratis nach Hause → <strong>kostet die Brand bei 25 % Wareneinsatz real nur ~50 €!</strong>
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayoutChoice('cash')}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        payoutChoice === 'cash'
                          ? 'border-white bg-white/10'
                          : 'border-white/15 bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">
                          Option B · Euro-Auszahlung aufs Girokonto (SEPA)
                        </span>
                        <span className="font-mono text-xs font-bold text-white">168,40 €</span>
                      </div>
                      <p className="mt-1 text-xs text-white/70">
                        Automatische PDF-Gutschrift (§19 oder +19 % USt.) + SEPA-Payout – erst nachdem die Marke bereits ~1.400 € echten Umsatz eingenommen hat.
                      </p>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenStrategyModal('White-Label Affiliate-Portal mit Produkt-Tausch & Codes')}
                  className="mt-6 min-h-[46px] w-full rounded-full bg-geo-green text-xs font-extrabold text-void hover:opacity-95"
                >
                  Genau dieses Affiliate-Portal für unsere Brand bauen lassen →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: BRAND APPLICATION FUNNEL (MORE HELPCENTER VORILD) */}
          {portalTab === 'application' && (
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-ink">
                  Eigene Creator-Bewerbungsstrecke (Vorbild More Nutrition Helpcenter)
                </h3>
                <p className="text-sm leading-6 text-ink-soft">
                  Statt ungeordneter Instagram-DMs bekommt deine Marke ein sauberes Bewerbungs-Formular: Creator tragen Reichweite, Nische, Community-Mehrwert und Paket-Adresse ein. Passt der Brand-Fit, schaltet ihr mit <strong>1 Klick</strong> Starter-Paket + Affiliate-Code frei.
                </p>
                <ul className="space-y-2 text-xs text-ink">
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-[#527b33]" /> Filtert nach echtem Marken-Fit & Community-Vertrauen statt reiner Followerzahl
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-[#527b33]" /> Direkt gekoppelt an unsere {creatorCountLabel} registrierten UGC-Creator (1-Klick Einladung)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-[#527b33]" /> Automatische Code-Erstellung für Shopify, Shopware, WooCommerce oder eigene Systeme
                  </li>
                </ul>
              </div>

              <div className="rounded-3xl border border-hairline bg-surface p-5">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-geo-violet">
                  Vorschau · Marken-Bewerbungsbogen
                </p>
                {sampleApplied ? (
                  <div className="mt-4 rounded-2xl bg-[#edf5e5] p-4 text-xs text-[#2b421a]">
                    <p className="font-bold">✓ Bewerbung im Marken-Backend eingegangen!</p>
                    <p className="mt-1">
                      Die Brand sieht jetzt Profil, Engagement-Rate & Produktwunsch und kann mit 1 Klick Level 1 (Starter-Box + 10-%-Code) aktivieren.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSampleApplied(true);
                    }}
                    className="mt-3 space-y-3 text-xs"
                  >
                    <input
                      type="text"
                      defaultValue="@sina.moves (3.200 Follower · Fitness & Alltag)"
                      className="min-h-[40px] w-full rounded-xl border border-hairline bg-white px-3 text-ink"
                    />
                    <input
                      type="text"
                      defaultValue="Warum passt du zur Marke? Ich nutze eure Produkte seit 6 Monaten täglich im Training."
                      className="min-h-[40px] w-full rounded-xl border border-hairline bg-white px-3 text-ink"
                    />
                    <button
                      type="submit"
                      className="min-h-[42px] w-full rounded-xl bg-void font-bold text-white hover:bg-geo-violet"
                    >
                      Bewerbungs-Flow simulieren
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: E-COMMERCE VS SAAS AFFILIATE */}
          {portalTab === 'saas-vs-ecom' && (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-hairline bg-surface p-6">
                <span className="rounded-full bg-white px-3 py-1 font-mono text-[10px] font-bold text-geo-violet">
                  MODELL A · E-COMMERCE, FOOD, BEAUTY & FASHION
                </span>
                <h3 className="mt-3 text-xl font-bold text-ink">
                  Produkt-Seeding + 10–15 % Code-Provision
                </h3>
                <p className="mt-2 text-sm leading-6 text-ink-soft">
                  Perfekt für physische Konsumgüter (Supplements, Meals, Skincare, Streetwear): Creator bekommen ein Produktpaket, teilen ihren Rabattcode im Alltag und tauschen Provisionen bevorzugt wieder in neue Produkte um.
                </p>
              </div>

              <div className="rounded-3xl border border-geo-violet/30 bg-[#FBF8FE] p-6">
                <span className="rounded-full bg-geo-violet px-3 py-1 font-mono text-[10px] font-bold text-white">
                  MODELL B · SOFTWARE, SAAS & APPS (0 € WARENEINSATZ)
                </span>
                <h3 className="mt-3 text-xl font-bold text-ink">
                  20–30 % wiederkehrende Affiliate-Provision pro Abo
                </h3>
                <p className="mt-2 text-sm leading-6 text-ink-soft">
                  Bei digitalen Tools, KI-Apps oder B2B-SaaS kostet dich ein neuer Nutzer fast 0 € Grenzkosten: Gib Creatorn 20–30 % Lifetime- oder Jahres-Provision über unser fertiges Affiliate-Tracking – null Risiko, reiner Gewinn-Split.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* INTERACTIVE 5-LEVEL MORE-STYLE SYSTEM EXPLORER */}
      <section className="mx-auto max-w-6xl rounded-[36px] border border-hairline bg-white p-6 shadow-sm sm:p-10">
        <div className="flex flex-col justify-between gap-4 border-b border-hairline pb-6 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-geo-violet">
              Das 5-Stufen-System im Detail (More-Nutrition-Vorbild)
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-4xl">
              Vom Einstieg unter 500 € bis Level 5 mit eigener Landingpage & Reisen
            </h2>
          </div>
          <span className="shrink-0 rounded-full bg-surface px-3.5 py-1.5 text-xs font-bold text-ink">
            100 % leistungsbasiert über Affiliate-Umsatz
          </span>
        </div>

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
                  Level {lvl.level}
                </p>
                <p className="mt-1 text-xs font-bold leading-snug">
                  {lvl.name.replace(`Level ${lvl.level} · `, '')}
                </p>
              </button>
            );
          })}
        </div>

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
                {currentLevel.monthlyEarning}
              </span>
            </div>
            <h3 className="mt-3 text-xl font-bold text-ink">{currentLevel.subtitle}</h3>
            <p className="mt-1 text-xs font-semibold text-ink-soft">
              Voraussetzung: {currentLevel.entryRule}
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
                Ökonomie für deine Marke auf Level {currentLevel.level}
              </p>
              <p className="mt-3 text-base font-semibold leading-7 text-white">
                {currentLevel.brandEconomics}
              </p>
              <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4 text-xs text-white/75">
                <p className="flex items-start gap-2">
                  <Globe size={15} className="mt-0.5 shrink-0 text-[#62B4FF]" />
                  <span>
                    Läuft schlüsselfertig auf eigener Subdomain (<code className="text-white">creator.deinemarke.de</code>) – kein Eingriff in euren bestehenden Shop-Kern nötig.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <Bot size={15} className="mt-0.5 shrink-0 text-geo-violet-soft" />
                  <span>
                    Optional inkl. eigener ChatGPT-App / MCP-Anbindung & automatischem Creator-Sourcing.
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                onOpenStrategyModal(`Eigenes Affiliate-Programm anfragen (Level 1–5 System)`)
              }
              className="mt-6 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-white text-xs font-extrabold text-void hover:bg-geo-green"
            >
              <Calendar size={15} />
              Unverbindliches Konzept für unsere Marke anfordern
            </button>
          </div>
        </div>
      </section>

      {/* ROI / AFFILIATE UNIT ECONOMICS CALCULATOR */}
      <section className="mx-auto max-w-6xl rounded-3xl bg-void p-6 text-white sm:p-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-geo-green">
              Affiliate-ROI-Rechner für Marken
            </p>
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
              {monthlyClips.toLocaleString('de-DE')} Videos/Monat auf reiner Provisionsbasis
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBusinessType('ecommerce')}
              className={`rounded-full px-4 py-1.5 text-xs font-bold ${
                businessType === 'ecommerce' ? 'bg-geo-green text-void' : 'bg-white/10 text-white'
              }`}
            >
              E-Commerce (~14 % Provision)
            </button>
            <button
              type="button"
              onClick={() => setBusinessType('saas')}
              className={`rounded-full px-4 py-1.5 text-xs font-bold ${
                businessType === 'saas' ? 'bg-geo-green text-void' : 'bg-white/10 text-white'
              }`}
            >
              SaaS / Software (25 % Affiliate)
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs">
                <span className="text-white/75">Aktive Micro-Creator mit Affiliate-Code</span>
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
                <span className="text-white/75">Ø Code-Verkäufe / Abos pro Creator im Monat</span>
                <span className="font-mono font-bold text-white">{ordersPerCreator} Sales</span>
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
                <span className="text-white/75">Ø Warenkorb / Abo-Wert</span>
                <span className="font-mono font-bold text-white">{avgOrderValue} €</span>
              </div>
              <input
                type="range"
                min={25}
                max={150}
                step={5}
                value={avgOrderValue}
                onChange={(e) => setAvgOrderValue(Number(e.target.value))}
                className="mt-1.5 w-full accent-geo-green"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4">
              <p className="text-xs font-semibold text-red-200">
                Klassischer UGC-Einkauf ({monthlyClips.toLocaleString('de-DE')} Videos × 180 € Fixgage)
              </p>
              <p className="mt-1 text-2xl font-extrabold text-red-300 line-through">
                {classicAgencyCost.toLocaleString('de-DE')} € Vorab-Fixkosten
              </p>
            </div>

            <div className="rounded-2xl border border-geo-green/40 bg-geo-green/10 p-4">
              <p className="text-xs font-semibold text-geo-green">
                Dein eigenes Affiliate-Creator-System (0 € Fixgage)
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-white/65">Erzielter Monatsumsatz</p>
                  <p className="text-2xl font-extrabold text-white">
                    {monthlyRevenue.toLocaleString('de-DE')} €
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-white/65">
                    Affiliate-Ausschüttung ({Math.round(commissionRate * 100)} %)
                  </p>
                  <p className="text-2xl font-extrabold text-geo-green">
                    {performancePayout.toLocaleString('de-DE')} €
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                onOpenStrategyModal(
                  `Affiliate-System Anfrage (${businessType === 'saas' ? 'SaaS 25%' : 'E-Commerce'}: ${microCreators} Creator)`,
                )
              }
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-geo-green px-6 text-sm font-extrabold text-void hover:opacity-95"
            >
              <Sparkles size={16} />
              15-Min Strategy Session für euer Affiliate-System buchen
            </button>
          </div>
        </div>
      </section>

      {/* AUCH WEITERHIN VERFUEGBAR: STUFE 1 (FREE DB) & STUFE 2 (TKP BOUNTIES) */}
      <section className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-hairline bg-surface p-5">
          <div>
            <p className="text-xs font-bold text-ink">Lieber nur einzelne Creator kostenlos anfragen?</p>
            <p className="mt-0.5 text-xs text-ink-soft">Offene Datenbank ohne Login & mit 0 % Provision.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="shrink-0 rounded-full border border-hairline bg-white px-4 py-2 text-xs font-bold text-ink hover:border-geo-violet"
          >
            Zur Suche →
          </button>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-hairline bg-surface p-5">
          <div>
            <p className="text-xs font-bold text-ink">Lieber einmalige Reichweite pro 1.000 Views kaufen?</p>
            <p className="mt-0.5 text-xs text-ink-soft">Festes Kampagnenbudget mit TKP-Abrechnung.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('bounties')}
            className="shrink-0 rounded-full bg-void px-4 py-2 text-xs font-bold text-white hover:bg-geo-violet"
          >
            Zu den Bounties →
          </button>
        </div>
      </section>
    </div>
  );
}

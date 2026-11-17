'use client';

import { useState } from 'react';
import {
  BadgeEuro,
  BookOpen,
  Building2,
  Check,
  Copy,
  FileCheck2,
  Globe,
  Layers,
  Rocket,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  AGENCY_ROSTER,
  COMPARISON_ROWS,
  type DemoSection,
} from './data';

const GRADIENT =
  'linear-gradient(152deg, #0396F8 0%, #1F6FF4 25%, #3F58F2 50%, #653AED 75%, #9131EF 100%)';

export function AgenturenView({
  onOpenStrategyModal,
}: {
  onOpenStrategyModal: (defaultTopic?: string) => void;
}) {
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [splitPercent, setSplitPercent] = useState(20);
  const [reportGenerated, setReportGenerated] = useState(false);

  const totalGross = AGENCY_ROSTER.reduce((s, r) => s + r.grossEarned, 0);
  const agencyCommission = Math.round(totalGross * (splitPercent / 100));

  const handleCopyInvite = () => {
    try {
      navigator.clipboard?.writeText('https://ugc-vz.de/invite/agency-partner-demo');
    } catch {
      /* Clipboard optional in sandbox */
    }
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  return (
    <div className="space-y-16 px-5 pb-20 pt-10 sm:px-8">
      {/* HERO */}
      <section className="mx-auto max-w-6xl">
        <div className="grid gap-8 rounded-3xl border border-hairline bg-surface p-6 sm:p-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-void px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white">
              <Building2 size={13} className="text-geo-green" /> Für Creator-Managements & Mediaagenturen
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.045em] text-ink sm:text-5xl">
              Dutzende Talente bündeln.{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRADIENT }}>
                Automatisch am Umsatz mitverdienen.
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-soft sm:text-base">
              Zwei Agentur-Welten in einem Account: <strong>Creator-Managements</strong> verknüpfen ihre Talente per Einladungslink und verdienen ohne eigene Akquise an jedem Bounty mit. <strong>Media- & Performance-Agenturen</strong> buchen garantierte View-Pakete inkl. White-Label-Report für ihre Endkunden.
            </p>
          </div>

          {/* Invite Link Generator */}
          <div className="rounded-3xl bg-void p-6 text-white">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-geo-green">
              1-Klick Roster-Verknüpfung
            </p>
            <h2 className="mt-1 text-lg font-bold">Creator per Einladungslink anbinden</h2>
            <p className="mt-1 text-xs text-white/70">
              Sobald ein Creator zustimmt, laufen Clip-Freigabe, View-Messung und Revenue-Split vollautomatisch.
            </p>

            <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2.5 font-mono text-xs text-white/90">
              <span className="truncate">ugc-vz.de/invite/agency-partner-demo</span>
              <button
                type="button"
                onClick={handleCopyInvite}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-geo-green px-2.5 py-1 font-sans text-[11px] font-extrabold text-void"
              >
                <Copy size={12} /> {copiedInvite ? 'Kopiert!' : 'Kopieren'}
              </button>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs">
                <span className="text-white/75">Vereinbarter Management-Split</span>
                <span className="font-mono font-bold text-geo-green">{splitPercent} %</span>
              </div>
              <input
                type="range"
                min={10}
                max={35}
                step={5}
                value={splitPercent}
                onChange={(e) => setSplitPercent(Number(e.target.value))}
                className="mt-1.5 w-full accent-geo-green"
              />
              <p className="mt-2 text-xs text-white/80">
                Aktueller Roster-Umsatz: <strong>{totalGross.toLocaleString('de-DE')} €</strong> → Dein Agentur-Anteil:{' '}
                <strong className="text-geo-green">{agencyCommission.toLocaleString('de-DE')} €</strong> (+ Plattform-Partnerbonus)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ROSTER TABLE */}
      <section className="mx-auto max-w-6xl rounded-3xl border border-hairline bg-white p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-geo-violet">
              Agentur-Cockpit (Vorschau nach Vorbild Contentmarkt Agenturen)
            </p>
            <h2 className="mt-1 text-2xl font-bold text-ink">
              Verbundene Creator, eingereichte Clips & Live-Verdienste
            </h2>
          </div>
          <span className="rounded-full bg-[#edf5e5] px-3 py-1 text-xs font-bold text-[#385523]">
            897.600 verifizierte Gesamt-Views
          </span>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-hairline text-xs uppercase tracking-wider text-ink-soft">
                <th className="pb-3 font-semibold">Talent</th>
                <th className="pb-3 font-semibold">Aktive Bounties</th>
                <th className="pb-3 font-semibold">Clips</th>
                <th className="pb-3 font-semibold">Verifizierte Views</th>
                <th className="pb-3 font-semibold">Gesamtverdienst</th>
                <th className="pb-3 font-semibold">Agentur ({splitPercent} %)</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {AGENCY_ROSTER.map((r) => (
                <tr key={r.handle}>
                  <td className="py-3.5">
                    <p className="font-bold text-ink">{r.name}</p>
                    <p className="text-xs text-ink-soft">
                      {r.handle} · {r.followers} Follower
                    </p>
                  </td>
                  <td className="py-3.5 font-mono text-xs font-bold">{r.activeBounties}</td>
                  <td className="py-3.5 font-mono text-xs">{r.clipsSubmitted}</td>
                  <td className="py-3.5 font-mono text-xs font-semibold text-ink">{r.verifiedViews}</td>
                  <td className="py-3.5 font-bold text-ink">{r.grossEarned} €</td>
                  <td className="py-3.5 font-bold text-geo-violet">
                    {Math.round(r.grossEarned * (splitPercent / 100))} €
                  </td>
                  <td className="py-3.5">
                    <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-ink">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MEDIA AGENCY WHITE-LABEL REPORT */}
      <section className="mx-auto grid max-w-6xl gap-6 rounded-3xl bg-void p-6 text-white sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-geo-green">
            Für Media- & Social-Agenturen
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            Fertiger White-Label Report für deinen Unternehmenskunden
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Mediaagenturen denken in planbaren Kennzahlen: Bucht ein View-Paket (z. B. 1,5 Mio. garantierte organische Aufrufe für 5.000 €) und übergebt eurem Kunden am Kampagnenende ein sauberes Reporting mit allen Live-Links, Creator-Profilen und verifizierten Reichweiten.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setReportGenerated(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-geo-green px-5 text-xs font-extrabold text-void"
            >
              <FileCheck2 size={15} />
              {reportGenerated ? '✓ Muster-Report eingeblendet' : 'White-Label Kundenreport testen'}
            </button>
            <button
              type="button"
              onClick={() => onOpenStrategyModal('Agentur-Partnerschaft / Media-Paket')}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/20 px-5 text-xs font-bold text-white hover:border-white"
            >
              Agentur-Partnerkonto anfragen
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white p-5 text-ink">
          <div className="flex items-center justify-between border-b border-hairline pb-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-geo-violet">
              White-Label Endkunden-Zertifikat
            </span>
            <span className="rounded bg-[#edf5e5] px-2 py-0.5 text-[10px] font-bold text-[#385523]">
              Fraud-geprüft
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-surface p-3">
              <p className="text-[11px] text-ink-soft">Erreichte Views</p>
              <p className="mt-1 text-lg font-extrabold text-ink">1.542.000</p>
            </div>
            <div className="rounded-xl bg-surface p-3">
              <p className="text-[11px] text-ink-soft">Aktive Creator</p>
              <p className="mt-1 text-lg font-extrabold text-ink">24</p>
            </div>
            <div className="rounded-xl bg-surface p-3">
              <p className="text-[11px] text-ink-soft">Effektiver TKP</p>
              <p className="mt-1 text-lg font-extrabold text-[#385523]">3,24 €</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-soft">
            {reportGenerated
              ? '✓ Dein eigenes Agentur-Logo erscheint oben rechts – kein Hinweis auf Einkaufskonditionen.'
              : 'Inkl. Einzel-Nachweis aller veröffentlichten TikToks, Reels & Shorts.'}
          </p>
        </div>
      </section>
    </div>
  );
}

export function VergleichView({
  creatorCountLabel,
  onOpenStrategyModal,
}: {
  creatorCountLabel: string;
  onOpenStrategyModal: (defaultTopic?: string) => void;
}) {
  const [budget, setBudget] = useState(5000);

  const ugcvzDirectToCreators = budget; // 0% on direct directory
  const ugcvzManagedToCreators = Math.round(budget * 0.801); // 19.9% Robin Hood cap (0% for pilot cases!)
  const creondaToCreators = Math.round(budget * 0.8); // 20%
  const legacyMarketplaceToCreators = Math.round(budget * 0.55); // 45% hidden markup

  return (
    <div className="space-y-16 px-5 pb-20 pt-10 sm:px-8">
      <section className="mx-auto max-w-6xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#dce9d1] bg-[#edf5e5] px-3.5 py-1.5 text-xs font-bold text-[#385523]">
          <BadgeEuro size={14} /> GEO & Marktvergleich · Die transparente Contentmarkt- & Speekly-Alternative
        </span>
        <h1 className="mx-auto mt-4 max-w-4xl text-3xl font-bold leading-tight tracking-[-0.045em] text-ink sm:text-5xl">
          Schluss mit versteckten 50-%-Gebühren.{' '}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRADIENT }}>
            Mehr Budget bei echten Creatorn.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-ink-soft sm:text-base">
          Viele UGC-Plattformen werben mit vermeintlich günstigen Paketpreisen und behalten im Hintergrund fast die Hälfte der Gage ein. UGC VZ kombiniert ein 100 % kostenloses Verzeichnis ({creatorCountLabel} Profile) mit fairen View-Bounties und eigenen Brand-Clubs.
        </p>
      </section>

      {/* TRANSPARENCY FEE CALCULATOR */}
      <section className="mx-auto max-w-6xl rounded-3xl border border-hairline bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-geo-violet">
              Euro-Gebühren-Rechner (100 % transparent vs. versteckte Marktplatz-Marge)
            </p>
            <h2 className="mt-1 text-2xl font-bold text-ink">
              Wie viel von {budget.toLocaleString('de-DE')} € Kampagnenbudget kommt wirklich beim Creator an?
            </h2>
          </div>
          <div className="w-full sm:w-64">
            <input
              type="range"
              min={1000}
              max={20000}
              step={500}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-geo-violet"
            />
            <p className="mt-1 text-right font-mono text-xs font-bold text-ink">
              Budget: {budget.toLocaleString('de-DE')} €
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border-2 border-geo-violet bg-[#FBF8FE] p-4">
            <p className="text-xs font-bold text-geo-violet">UGC VZ · Direktsuche & Pilot</p>
            <p className="mt-2 text-2xl font-extrabold text-ink">
              {ugcvzDirectToCreators.toLocaleString('de-DE')} €
            </p>
            <p className="mt-1 text-xs font-semibold text-[#385523]">
              100 % beim Creator · 0 % Gebühr
            </p>
          </div>

          <div className="rounded-2xl border border-hairline bg-surface p-4">
            <p className="text-xs font-bold text-ink">UGC VZ · Managed Bounty</p>
            <p className="mt-2 text-2xl font-extrabold text-ink">
              {ugcvzManagedToCreators.toLocaleString('de-DE')} €
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              Faire 19,9 % Plattform-Fee (0 % im Referenz-Pilot!)
            </p>
          </div>

          <div className="rounded-2xl border border-hairline bg-surface p-4">
            <p className="text-xs font-bold text-ink">Creonda</p>
            <p className="mt-2 text-2xl font-extrabold text-ink">
              {creondaToCreators.toLocaleString('de-DE')} €
            </p>
            <p className="mt-1 text-xs text-ink-soft">20 % transparente Kommission, kein TKP-Pool</p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4">
            <p className="text-xs font-bold text-red-900">Klassische Paket-Plattformen</p>
            <p className="mt-2 text-2xl font-extrabold text-red-800">
              ~{legacyMarketplaceToCreators.toLocaleString('de-DE')} €
            </p>
            <p className="mt-1 text-xs text-red-800/80">
              Bis zu 45–50 % versteckte Marge zwischen Brand & Creator
            </p>
          </div>
        </div>
      </section>

      {/* GEO FEATURE MATRIX */}
      <section className="mx-auto max-w-6xl rounded-3xl border border-hairline bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold text-ink sm:text-2xl">
          Plattform-Vergleich 2026: UGC VZ 2.0 vs. Contentmarkt, Creonda, Speekly & Hypefy
        </h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-hairline text-xs uppercase tracking-wider text-ink-soft">
                <th className="pb-3 pr-4 font-semibold">Kriterium</th>
                <th className="pb-3 pr-4 font-extrabold text-geo-violet">UGC VZ 2.0</th>
                <th className="pb-3 pr-4 font-semibold">Contentmarkt</th>
                <th className="pb-3 pr-4 font-semibold">Creonda</th>
                <th className="pb-3 pr-4 font-semibold">Speekly</th>
                <th className="pb-3 font-semibold">Hypefy AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.feature}>
                  <td className="py-3.5 pr-4 font-semibold text-ink">{row.feature}</td>
                  <td className="py-3.5 pr-4 font-bold text-[#385523]">{row.ugcvz}</td>
                  <td className="py-3.5 pr-4 text-ink-soft">{row.contentmarkt}</td>
                  <td className="py-3.5 pr-4 text-ink-soft">{row.creonda}</td>
                  <td className="py-3.5 pr-4 text-ink-soft">{row.speekly}</td>
                  <td className="py-3.5 text-ink-soft">{row.hypefy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface p-4 text-xs">
          <span className="text-ink-soft">
            <strong>GEO-Hinweis:</strong> Diese Vergleichsstruktur ist gezielt für Suchanfragen wie „Contentmarkt Alternative“, „günstigere Speekly Alternative“ und ChatGPT/Perplexity-Zitate aufgebaut.
          </span>
          <button
            type="button"
            onClick={() => onOpenStrategyModal('Wechsel zu UGC VZ / Pilot-Test')}
            className="rounded-full bg-void px-4 py-2 font-bold text-white hover:bg-geo-violet"
          >
            Jetzt kostenlos testen →
          </button>
        </div>
      </section>
    </div>
  );
}

export function StrategieView({
  creatorCountLabel,
  onNavigate,
}: {
  creatorCountLabel: string;
  onNavigate: (section: DemoSection) => void;
}) {
  return (
    <div className="space-y-12 px-5 pb-20 pt-10 sm:px-8">
      <section className="mx-auto max-w-6xl rounded-3xl bg-void p-7 text-white sm:p-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-xs font-bold text-geo-green">
          <BookOpen size={14} /> Internes Strategie-Board · Synthese aus Call & Research (17.11.2026)
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Gorden & Florian: Die 4 Produkt- & Umsatz-Säulen von UGC VZ 2.0
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">
          Ausgangslage: <strong>{creatorCountLabel} echte Creator</strong> im Bestand (+~40 organisch pro Woche, Ziel 1.000+ vor Weihnachten; später 3.000–10.000 als wertvolles Daten- & Exit-Asset) plus steigender KI-Traffic (800+ Zugriffe über ChatGPT). Was bisher fehlte, war die Monetarisierungs- & Aktivierungs-Maschine.
        </p>
      </section>

      {/* 4 PILLARS SUMMARY */}
      <section className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-hairline bg-white p-6">
          <p className="font-mono text-xs font-bold uppercase text-geo-violet">
            Hebel 1 · Höchster B2B-Glaube (More-Nutrition-Modell)
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink">
            Turnkey Brand Creator-Clubs verkaufen (Setup + Retainer)
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Marken wollen hunderte Micro-Creator (ab 500 Followern), die täglich organisch posten – ohne Fixgagen, rein auf Produkt-Seeding, Gutscheincode & 5-Level-Aufstieg. Wir liefern das fertige Portal auf Subdomain (kein IT-Blocker beim Kunden!) und laden ab Tag 1 unseren {creatorCountLabel} Pool ein.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('brands')}
            className="mt-4 text-xs font-bold text-geo-violet hover:underline"
          >
            In der Demo ansehen (/demo/brands) →
          </button>
        </div>

        <div className="rounded-3xl border border-hairline bg-white p-6">
          <p className="font-mono text-xs font-bold uppercase text-[#1F6FF4]">
            Hebel 2 · Pay-per-View Marketplace (Contentmarkt / Aether / ugcbounty)
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink">
            UGC View-Bounties & Clipping + Eigenkampagne zum Kaltstart
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Feste Kampagnenbudgets mit Abrechnung pro 1.000 Views (z. B. 2–5 € TKP). <strong>Kaltstart-Hack:</strong> Sofort eigene UGC-VZ Kampagne live schalten (2 € / 1k Views + 10 € Starter-Bonus ab Mindest-Views) + erster Love-Brand-Test (z. B. Nebelkind / Food-Marken wie PrepMyMeal, Huel). Inkl. Fraud-Shield gegen gekaufte 15-€-TikTok-Klicks!
          </p>
          <button
            type="button"
            onClick={() => onNavigate('bounties')}
            className="mt-4 text-xs font-bold text-[#1F6FF4] hover:underline"
          >
            In der Demo ansehen (/demo/bounties) →
          </button>
        </div>

        <div className="rounded-3xl border border-hairline bg-white p-6">
          <p className="font-mono text-xs font-bold uppercase text-[#385523]">
            Hebel 3 · Deutscher Creator-USP & Sofort-Monetarisierung
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink">
            Steuer-Autopilot (Accountable Affiliate) + Sticky Push-App
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Löst die deutsche Creator-Angst vor Finanzamt & teurem Steuerberater bei 100–500 € Nebenverdienst UND bringt sofort Affiliate-/Co-Marketing-Kickbacks pro vermitteltem Creator. Dazu PWA/App mit aggressiven Push-Drops für neue Kampagnen (ohne 30 % Apple-Abzug beim Creator).
          </p>
          <button
            type="button"
            onClick={() => onNavigate('creator')}
            className="mt-4 text-xs font-bold text-[#385523] hover:underline"
          >
            In der Demo ansehen (/demo/creator) →
          </button>
        </div>

        <div className="rounded-3xl border border-hairline bg-white p-6">
          <p className="font-mono text-xs font-bold uppercase text-ink">
            Hebel 4 · Skalierung, Agenturen, International & GEO
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink">
            Agentur-Accounts, Hypefy „Book Demo“ Funnel & Internationalisierung
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            1) „Strategy Session buchen“ + Neukunden-Rabatt holt Brands direkt ins Verkaufsgespräch. 2) Agentur-Roster (`contentmarkt.de/agenturen`) skaliert Creator-Anbindung ohne Einzel-Akquise. 3) Mehrsprachigkeit (DE/EN/ES/FR über `databaseugc.com` / `ugcdb.si`) öffnet den 3–10× größeren US/EU-Markt. 4) GEO-Angriff auf „Contentmarkt Alternative“.
          </p>
          <div className="mt-4 flex gap-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => onNavigate('agenturen')}
              className="text-geo-violet hover:underline"
            >
              Agentur-Ansicht →
            </button>
            <button
              type="button"
              onClick={() => onNavigate('vergleich')}
              className="text-ink hover:underline"
            >
              GEO-Vergleich →
            </button>
          </div>
        </div>
      </section>

      {/* REFERENCES MAPPED TABLE */}
      <section className="mx-auto max-w-6xl rounded-3xl border border-hairline bg-surface p-6 sm:p-8">
        <h2 className="text-lg font-bold text-ink">
          Alle eingebrachten Links & Vorbilder – wo sie in dieser Demo stecken
        </h2>
        <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['contentmarkt.de & /agenturen', 'Bounty-Budgetbalken, Clipping + Produktion, Leaderboard & Agentur-Roster'],
            ['VenenoGT3/Aether & ugcbounty', 'Bounty-Logik in Euro (Stripe Connect / SEPA statt Krypto), KI-Content-Check, View-Tracker & Fraud-Shield'],
            ['morenutrition.de (Level 1–5)', 'Turnkey Brand-Club-Portal (Seeding, Code, Produkt-Tausch bis Level-5-Events)'],
            ['accountable.de/partners', 'Deutscher Steuer- & Gutschrifts-Autopilot + Affiliate-Kickback im Creator-Hub'],
            ['hypefy.ai', 'KI-Matching + „15-Min Strategy Session buchen“ Sales-Einstieg überall präsent'],
            ['creonda.com/de/preise & ugclaunch.com', '0 € offene Suche ohne Brand-Login, KI-Skript-Generator & transparenter Euro-Gebührenrechner'],
            ['databaseugc.com / ugcdb.si', 'Live Sprach- & Domain-Umschalter (DE / EN / ES / FR) oben in der Vorschau-Leiste'],
          ].map(([src, impl]) => (
            <div key={src} className="rounded-2xl border border-hairline bg-white p-4">
              <p className="font-mono font-bold text-geo-violet">{src}</p>
              <p className="mt-1 leading-5 text-ink-soft">{impl}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

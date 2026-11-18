'use client';

import Link from 'next/link';
import SearchBox from '@/app/components/SearchBox';
import HeroVisual from '@/app/components/home/HeroVisual';
import NotchCard from '@/app/components/home/NotchCard';
import FilmPlayer from '@/app/components/motion/FilmPlayer';
import TrustElements from '@/app/components/TrustElements';
import { NICHE_INDEX, nichePath } from '@/app/lib/niche-index';
import type { DemoSection, LocaleCode } from './data';

const GRADIENT =
  'linear-gradient(152deg, #0396F8 0%, #1F6FF4 25%, #3F58F2 50%, #653AED 75%, #9131EF 100%)';

function Arrow() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

// Geschwungener Uebergang hell -> dunkel (bzw. umgekehrt) exakt wie auf der aktuellen Startseite (app/page.tsx)
function NotchEdge({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 1440 64"
      preserveAspectRatio="none"
      className={`block h-10 w-full sm:h-16 ${flip ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path
        d="M0 0 H420 C470 0 490 64 560 64 H880 C950 64 970 0 1020 0 H1440 V64 H0 Z"
        fill="#060606"
      />
    </svg>
  );
}

const features = [
  {
    title: 'Die Suche versteht dein Briefing',
    text: 'Beschreib Produkt, Zielgruppe und Format in deinen Worten. Die KI-Suche findet passende Profile.',
    ui: (
      <div className="rounded-2xl border border-hairline bg-surface p-4 text-sm">
        <p className="leading-6 text-ink">
          <mark className="rounded bg-[#F4EDFB] px-1 text-geo-violet">Skincare-Serum</mark>,{' '}
          <mark className="rounded bg-[#E6F0FE] px-1 text-[#1F6FF4]">Reel für Instagram</mark>,{' '}
          <mark className="rounded bg-[#edf5e5] px-1 text-[#385523]">Frau 25–35</mark>
        </p>
        <div className="mt-3 flex justify-end">
          <span className="rounded-xl bg-geo-violet px-4 py-2 text-xs font-bold text-white">
            Creator suchen
          </span>
        </div>
      </div>
    ),
  },
  {
    title: 'Echte Profile mit Arbeitsproben',
    text: 'Reale UGC Creator mit Portfolio- und Social-Nachweisen – keine KI-Avatare.',
    ui: (
      <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-white p-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: GRADIENT }}
        >
          LE
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Lea · München</p>
          <p className="truncate text-xs text-ink-soft">Testimonials, Reels, Fotos</p>
        </div>
        <div className="flex gap-1">
          {[0.5, 0.75, 1].map((o) => (
            <span
              key={o}
              className="h-10 w-6 rounded-md"
              style={{ background: GRADIENT, opacity: o }}
            />
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Du wählst bewusst aus',
    text: 'Vergleiche Themen, Preisvorstellungen und Arbeitsproben. Kein Algorithmus entscheidet für dich.',
    ui: (
      <div className="space-y-2">
        {[
          ['Mia · Berlin', true],
          ['Jonas · Köln', false],
          ['Lea · München', true],
        ].map(([name, on]) => (
          <div
            key={name as string}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
              on ? 'border-geo-violet bg-[#FBF8FE]' : 'border-hairline bg-white'
            }`}
          >
            <span className="truncate font-semibold">{name}</span>
            <span
              className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold ${
                on ? 'bg-[#edf5e5] text-[#385523]' : 'bg-geo-violet text-white'
              }`}
            >
              {on ? '✓ In deiner Auswahl' : '+ Zur Auswahl'}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Kontakte per Mail – ohne Provision',
    text: 'Du erhältst die verfügbaren Kontaktdaten kostenlos per E-Mail. Honorar und Rechte klärt ihr direkt.',
    ui: (
      <div className="rounded-2xl border border-hairline bg-white p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-geo-violet">
          Dein kostenloses Matching
        </p>
        <p className="mt-1 text-base font-bold tracking-tight">Deine Creator-Auswahl ist da</p>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#edf5e5] font-bold text-[#385523]">
            ✓
          </span>
          2 Kontakte · 0 € Provision
        </div>
      </div>
    ),
  },
];

interface Props {
  locale: LocaleCode;
  creatorCountLabel: string;
  shortlist?: string[];
  onToggleShortlist?: (id: string) => void;
  onNavigate: (section: DemoSection) => void;
  onOpenStrategyModal: (defaultTopic?: string) => void;
}

export default function HomeSection({
  locale,
  creatorCountLabel,
  onNavigate,
  onOpenStrategyModal,
}: Props) {
  const isEn = locale === 'en';

  const faqs: [string, string][] = [
    [
      'Ist UGC VZ wirklich kostenlos?',
      'Ja. Creator suchen, Profile prüfen, Kontaktdaten anfordern und ein Creator-Profil anlegen ist kostenlos. Optionale TKP-Kampagnen oder der Aufbau eines eigenen Affiliate-Netzwerks werden separat vereinbart.',
    ],
    [
      'Was passiert nach meiner Kontaktanfrage?',
      'Du erhältst deine Auswahl und die verfügbaren Kontaktinformationen per E-Mail. Anschließend kontaktierst du die Creator selbst. Die Anfrage bucht keinen Auftrag.',
    ],
    [
      'Wann nutze ich TKP-Kampagnen oder ein eigenes Provisions-Programm?',
      'Bei einer TKP-Kampagne legst du ein festes Budget und einen Satz pro 1.000 Views fest; Creator picken die Kampagne in ihrem Login-Bereich. Auf das Kampagnenbudget fällt eine Plattform-Fee von 19,9 % an, Creator erhalten den angezeigten Satz ohne Abzug. Willst du wie große D2C-Marken hunderte Micro-Creator dauerhaft auf Provisionsbasis aktivieren, besprechen wir das Setup im Strategie-Call.',
    ],
    [
      'Wie komme ich als Creator ins Verzeichnis und an bezahlte Kampagnen?',
      'Ganz ohne Bewerbung: Du legst dein Profil kostenlos an, wirst von Marken direkt gefunden und kannst dir in deinem neuen Creator-Login jederzeit selbst aktive TKP-Kampagnen & Provisions-Partnerschaften picken.',
    ],
  ];

  return (
    <div className="home-page min-h-screen bg-white text-ink pb-20">
      {/* ---------- 1. HERO (1:1 wie aktuelle Startseite) ---------- */}
      <section
        className="relative overflow-hidden bg-surface px-5 pb-24 pt-10 sm:px-8 sm:pb-32 sm:pt-16"
        aria-labelledby="demo-home-title"
      >
        <div
          className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full opacity-[0.12] blur-3xl"
          style={{ background: GRADIENT }}
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="text-center lg:text-left">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dce9d1] bg-[#edf5e5] px-3 py-1.5 text-xs font-semibold text-[#385523] sm:text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#527b33]" aria-hidden="true" />
              {creatorCountLabel} Creator-Profile · {isEn ? 'Free creator search' : 'Kostenlos suchen'}
            </p>

            <h1
              id="demo-home-title"
              className="text-[2.6rem] font-bold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-[4.1rem] xl:text-[4.4rem]"
            >
              {isEn ? 'Your Product.' : 'Dein Produkt.'}
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: GRADIENT }}
              >
                {isEn ? 'Matching Creators.' : 'Passende Creator.'}
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-ink-soft sm:text-lg lg:mx-0">
              {isEn
                ? 'Find real UGC creators, review samples, and request contacts for free — plus optional CPM campaigns and commission networks.'
                : 'Finde echte UGC Creator, prüfe Arbeitsproben und frage deine Favoriten kostenlos an – ohne Provision, ohne Agentur dazwischen.'}
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <a
                href="#search"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-geo-violet px-6 font-semibold text-white shadow-[0_14px_30px_rgba(139,63,202,0.35)] transition-transform hover:-translate-y-0.5"
              >
                Creator finden <Arrow />
              </a>
              <a
                href="#so-funktionierts"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-hairline bg-white px-6 font-semibold transition-colors hover:border-ink"
              >
                So funktioniert&apos;s
              </a>
            </div>

            {/* Zweite Zielgruppe: Creator anmelden + Hinweis auf Kampagnen-Login */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => onNavigate('creator')}
                className="group inline-flex min-h-[44px] items-center gap-3 rounded-full border border-hairline bg-white/70 py-1.5 pl-1.5 pr-4 text-left text-sm backdrop-blur transition-colors hover:border-geo-violet hover:bg-white"
              >
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
                  style={{ background: GRADIENT }}
                >
                  Creator?
                </span>
                <span className="text-ink-soft">
                  <span className="font-semibold text-ink">Profil kostenlos anlegen</span>
                  <span className="hidden sm:inline"> – &amp; im Konto direkt Kampagnen picken</span>
                </span>
                <span className="shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-geo-violet">
                  <Arrow />
                </span>
              </button>
            </div>
          </div>

          <HeroVisual />
        </div>
      </section>

      {/* ---------- 2. SUCHE (1:1 die echte SearchBox mit Bildern & Kategorien wie im Original!) ---------- */}
      <section className="relative z-10 -mt-16 px-5 sm:-mt-20 sm:px-8">
        <div
          id="search"
          className="home-search-panel mx-auto max-w-6xl scroll-mt-6 rounded-3xl border border-hairline bg-white p-4 shadow-[0_30px_90px_rgba(35,22,47,0.10)] sm:p-8"
        >
          <div className="mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
              Wofür suchst du Creator?
            </h2>
            <p className="flex items-center gap-1.5 text-xs text-ink-soft">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#527b33"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>
              Kostenlos · Ohne Brand-Login
            </p>
          </div>
          <SearchBox showFeatured demoMode />
        </div>
        <p className="mx-auto mt-5 max-w-6xl text-center text-xs leading-5 text-ink-soft">
          Suche und Kontaktanfrage sind kostenlos. Produktion und Nutzungsrechte vereinbart ihr direkt.{' '}
          <strong>In dieser Vorschau werden Kontaktanfragen nur simuliert und nicht versendet.</strong>
        </p>
      </section>

      {/* ---------- 3. PARTNER-LOGOS (wie auf der aktuellen Startseite) ---------- */}
      <div className="mt-10">
        <TrustElements compact />
      </div>

      {/* ---------- 4. VIER SCHRITTE (wie auf der aktuellen Startseite) ---------- */}
      <section className="px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="home-features-title">
        <div className="mx-auto max-w-6xl">
          <h2
            id="home-features-title"
            className="mx-auto max-w-3xl text-center text-3xl font-bold leading-tight tracking-[-0.045em] sm:text-5xl"
          >
            Echte Creator finden.
            <br className="hidden sm:block" />{' '}
            <span className="text-ink-soft">In vier klaren Schritten.</span>
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:mt-16 md:grid-cols-2">
            {features.map((f) => (
              <NotchCard
                key={f.title}
                title={<h3 className="text-lg font-semibold tracking-tight sm:text-xl">{f.title}</h3>}
              >
                <p className="text-sm leading-6 text-ink-soft">{f.text}</p>
                <div className="mt-6">{f.ui}</div>
              </NotchCard>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- 5. MOTION-GRAFIK AUF DUNKLER BUEHNE (1:1 wieder drin!) ---------- */}
      <section id="so-funktionierts" className="scroll-mt-4" aria-labelledby="home-how-title">
        <NotchEdge />
        <div className="relative overflow-hidden bg-void px-5 pb-20 pt-12 text-white sm:px-8 sm:pb-28 sm:pt-16">
          <div
            className="pointer-events-none absolute left-1/2 top-1/3 h-[900px] w-[900px] -translate-x-1/2 rounded-full border border-white/5"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute left-1/2 top-1/3 h-[620px] w-[620px] -translate-x-1/2 rounded-full border border-white/5"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute left-1/2 top-[20%] h-96 w-[60%] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
            style={{ background: GRADIENT }}
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-5xl">
            <p className="text-center font-mono text-xs uppercase tracking-[0.2em] text-white/50">
              So funktioniert UGC VZ
            </p>
            <h2
              id="home-how-title"
              className="mx-auto mt-4 max-w-3xl text-center text-3xl font-bold leading-tight tracking-[-0.045em] sm:text-5xl"
            >
              Vom Briefing zur Zusammenarbeit.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center leading-7 text-white/60">
              Du prüfst die Profile. Du wählst aus. Den Rest vereinbart ihr direkt – für Brands und Creator kostenlos.
            </p>
            <div className="mt-10 sm:mt-12">
              <FilmPlayer />
            </div>
          </div>
        </div>
        <NotchEdge flip />
      </section>

      {/* ---------- 6. NEU: DIE 3 MOEGLICHKEITEN FUER UNTERNEHMEN ---------- */}
      <section
        id="drei-wege"
        className="scroll-mt-20 px-5 pt-20 sm:px-8 sm:pt-28"
        aria-labelledby="three-ways-title"
      >
        <div className="mx-auto max-w-6xl">
          <p className="text-center font-mono text-xs uppercase tracking-[0.18em] text-geo-violet">
            Für Marken &amp; Agenturen
          </p>
          <h2
            id="three-ways-title"
            className="mx-auto mt-3 max-w-3xl text-center text-3xl font-bold leading-tight tracking-[-0.045em] sm:text-5xl"
          >
            Drei Möglichkeiten für Unternehmen.
            <br className="hidden sm:block" />{' '}
            <span className="text-ink-soft">Vom Einzel-Kontakt bis zum Provisions-Netzwerk.</span>
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <NotchCard
              title={
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#385523]">
                    01 · Kostenlos
                  </span>
                  <h3 className="text-lg font-bold tracking-tight text-ink">
                    Creator direkt finden
                  </h3>
                </div>
              }
            >
              <div className="flex h-full flex-col justify-between">
                <div>
                  <p className="text-sm leading-6 text-ink-soft">
                    Durchsuche {creatorCountLabel} echte Creator ohne Login, prüfe Arbeitsproben und fordere Kontaktdaten gratis per E-Mail an.
                  </p>
                  <div className="mt-5 rounded-2xl bg-surface p-3.5 text-xs text-ink">
                    <strong>0 € Grundgebühr · 0 % Provision</strong>
                    <p className="mt-0.5 text-ink-soft">Kein Account nötig – sofort oben starten.</p>
                  </div>
                </div>
                <a
                  href="#search"
                  className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-hairline bg-white px-5 text-xs font-bold text-ink transition-colors hover:border-ink"
                >
                  Direkt im Verzeichnis suchen
                </a>
              </div>
            </NotchCard>

            <NotchCard
              title={
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-geo-violet">
                    02 · Pay-per-View
                  </span>
                  <h3 className="text-lg font-bold tracking-tight text-ink">
                    TKP-Kampagne schalten
                  </h3>
                </div>
              }
            >
              <div className="flex h-full flex-col justify-between">
                <div>
                  <p className="text-sm leading-6 text-ink-soft">
                    Hinterlege ein festes Kampagnenbudget (z. B. 2.000 € bei 3,50 € pro 1.000 Views). Unsere Creator picken deine Kampagne in ihrem Login-Bereich.
                  </p>
                  <div className="mt-5 rounded-2xl bg-surface p-3.5 text-xs text-ink">
                    <strong>Volle Budgetkontrolle in Euro (€)</strong>
                    <p className="mt-0.5 text-ink-soft">
                      TikTok, Reels &amp; Shorts · Abrechnung per Rechnung / Stripe.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('brands')}
                  className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-void px-5 text-xs font-bold text-white transition-colors hover:bg-geo-violet"
                >
                  TKP-Kampagne starten <Arrow />
                </button>
              </div>
            </NotchCard>

            <NotchCard
              dark
              title={
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-geo-green">
                    03 · Komplett-Konzept
                  </span>
                  <h3 className="text-lg font-bold tracking-tight text-white">
                    Creator-Affiliate-Netzwerk
                  </h3>
                </div>
              }
            >
              <div className="flex h-full flex-col justify-between text-white">
                <div>
                  <p className="text-sm leading-6 text-white/75">
                    Wir bauen deiner Marke ein eigenes UGC- &amp; Partnerprogramm auf reiner Provisionsbasis auf (eigene Codes, Produkt-Seeding, Level 1–5) – und laden unsere {creatorCountLabel} Creator ein.
                  </p>
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.05] p-3.5 text-xs">
                    <strong className="text-geo-green">0 € Fixgagen – auf Provisionsbasis</strong>
                    <p className="mt-0.5 text-white/65">
                      Persönliche Abstimmung im kurzen Strategie-Call.
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenStrategyModal(
                        'Eigenes UGC-Creator- & Affiliate-Netzwerk auf Provisionsbasis aufbauen',
                      )
                    }
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-geo-green px-5 text-xs font-extrabold text-void transition-transform hover:-translate-y-0.5"
                  >
                    Strategie-Call vereinbaren <Arrow />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('brands')}
                    className="block w-full text-center text-[11px] font-medium text-white/65 underline underline-offset-4 hover:text-white"
                  >
                    Details ansehen
                  </button>
                </div>
              </div>
            </NotchCard>
          </div>
        </div>
      </section>

      {/* ---------- 7. BRANCHEN (wie auf der aktuellen Startseite) ---------- */}
      <section className="px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="home-niches-title">
        <div className="mx-auto max-w-6xl">
          <h2
            id="home-niches-title"
            className="mx-auto max-w-3xl text-center text-3xl font-bold leading-tight tracking-[-0.045em] sm:text-5xl"
          >
            UGC Creator für jede Branche
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center leading-7 text-ink-soft">
            Von Beauty-Reels bis App-Demo: Starte mit einer Branche und sieh direkt passende Profile.
          </p>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {NICHE_INDEX.map((niche) => (
              <li key={niche.slug}>
                <Link
                  href={nichePath(niche)}
                  className="group flex min-h-[56px] items-center justify-between rounded-2xl border border-hairline bg-surface px-5 transition-colors hover:border-geo-violet hover:bg-white"
                >
                  <span className="font-semibold">{niche.chip}</span>
                  <span className="text-ink-soft transition-transform group-hover:translate-x-1 group-hover:text-geo-violet">
                    <Arrow />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- 8. FUER CREATOR (wie aktuelle Startseite + Kampagnen-Login!) ---------- */}
      <section className="px-5 pb-20 sm:px-8 sm:pb-28" aria-labelledby="demo-creator-banner">
        <div
          className="relative mx-auto grid max-w-6xl gap-10 overflow-hidden rounded-[36px] p-7 text-white sm:p-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:p-16"
          style={{ background: GRADIENT }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'repeating-linear-gradient(-78deg, transparent 0 26px, rgba(255,255,255,.4) 26px 27px)',
            }}
            aria-hidden="true"
          />
          <div className="relative">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-white/75">
              Für die Menschen hinter dem Content
            </p>
            <h2
              id="demo-creator-banner"
              className="text-3xl font-bold leading-tight tracking-[-0.045em] sm:text-5xl"
            >
              Du machst den Content.
              <br />
              Mach dich auffindbar &amp; verdiene mit.
            </h2>
            <p className="mt-5 max-w-lg leading-7 text-white/90">
              Als UGC Creator kostenlos anmelden, von Brands gefunden werden – und in deinem Creator-Login jederzeit aktive TKP-Kampagnen &amp; Provisions-Partnerschaften picken.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('creator')}
                className="inline-flex min-h-[48px] items-center gap-3 rounded-full bg-white px-6 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
              >
                Kostenloses Creator-Profil erstellen <Arrow />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('konto')}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-white/35 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                Zum Creator-Login (Kampagnen picken)
              </button>
            </div>
          </div>

          <ul className="relative space-y-3">
            {[
              [
                'Deine Arbeitsproben im Mittelpunkt',
                'Zeige Marken, welche Themen und Formate zu dir passen – 0 % Provision.',
              ],
              [
                'Neu: Aktiv Kampagnen im Login picken',
                'Wähle selbst bezahlte TKP-Kampagnen (pro 1.000 Views) oder Provisions-Deals mit eigenem Code.',
              ],
              [
                'Auszahlung in Euro + Gutschriften',
                'SEPA-Überweisung aufs Bankkonto inkl. automatischem Gutschriftsbeleg.',
              ],
            ].map(([title, description]) => (
              <li key={title} className="flex gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[#385523]"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <div>
                  <span className="font-semibold">{title}</span>
                  <p className="text-sm leading-6 text-white/85">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- 9. FAQ & ABSCHLUSS-CTA (wie auf der aktuellen Startseite) ---------- */}
      <section className="px-5 pb-20 sm:px-8 sm:pb-24" aria-labelledby="demo-faq-title">
        <div className="mx-auto max-w-3xl">
          <h2
            id="demo-faq-title"
            className="text-center text-3xl font-bold tracking-[-0.045em] sm:text-4xl"
          >
            Noch kurz gefragt.
          </h2>
          <div className="mt-10 space-y-3">
            {faqs.map(([question, answer], i) => (
              <details
                key={question}
                open={i === 0}
                className="group rounded-2xl border border-hairline bg-white px-5 transition-colors open:border-ink/20 sm:px-6"
              >
                <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                  <span>{question}</span>
                  <span
                    className="text-xl font-normal text-ink-soft transition-transform group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-5 text-sm leading-7 text-ink-soft">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 sm:px-8" aria-label="Kostenlos starten">
        <div className="relative mx-auto max-w-6xl">
          <div className="relative z-10 mx-auto -mb-8 w-fit rounded-full bg-white p-2">
            <a
              href="#search"
              className="inline-flex min-h-[56px] items-center gap-3 rounded-full px-8 text-base font-semibold text-white shadow-[0_18px_40px_rgba(91,70,240,0.4)] sm:text-lg"
              style={{ background: GRADIENT }}
            >
              Kostenlos Creator finden <Arrow />
            </a>
          </div>
          <div className="rounded-[36px] bg-void px-6 pb-12 pt-16 text-center text-white sm:pb-14">
            <p className="text-2xl font-bold tracking-[-0.04em] sm:text-3xl">
              {creatorCountLabel} echte Creator. 0 € Provision.
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/60">
              Suche, Auswahl und Kontaktdaten sind kostenlos – ergänzt um TKP-Kampagnen &amp; eigene Provisions-Netzwerke.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

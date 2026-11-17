'use client';

import { useState } from 'react';
import HeroVisual from '@/app/components/home/HeroVisual';
import NotchCard from '@/app/components/home/NotchCard';
import { AI_PRESETS, type DemoSection, type LocaleCode } from './data';

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
  const [query, setQuery] = useState('');
  const [activePresetIdx, setActivePresetIdx] = useState(0);
  const [contactRequested, setContactRequested] = useState(false);

  const isEn = locale === 'en';
  const activeCreators = AI_PRESETS[activePresetIdx].creators;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.toLowerCase();
    if (q.includes('hoodie') || q.includes('fashion') || q.includes('street')) {
      setActivePresetIdx(1);
    } else if (q.includes('steuer') || q.includes('app') || q.includes('tech')) {
      setActivePresetIdx(2);
    } else if (q.includes('food') || q.includes('meal') || q.includes('essen')) {
      setActivePresetIdx(3);
    } else {
      setActivePresetIdx(0);
    }
    setContactRequested(false);
  };

  const faqs: [string, string][] = [
    [
      'Ist die Creator-Suche auf UGC VZ wirklich kostenlos?',
      'Ja. Marken durchsuchen alle Profile ohne Anmeldung, prüfen Arbeitsproben und erhalten die Kontaktdaten kostenlos per E-Mail (0 % Provision).',
    ],
    [
      'Wann nutze ich TKP-Kampagnen oder ein eigenes Affiliate-Programm?',
      'Wenn du nicht einzeln verhandeln willst: Bei einer TKP-Kampagne legst du ein festes Budget pro 1.000 Views fest. Willst du wie große D2C-Marken hunderte Micro-Creator dauerhaft auf Provisionsbasis aktivieren, bauen wir dir im Strategie-Call dein eigenes Affiliate-Netzwerk auf.',
    ],
    [
      'Wie verdiene ich als Creator auf UGC VZ Geld?',
      'Zweifach: Mit deinem kostenlosen Profil wirst du von Marken direkt angefragt – und in deinem Creator-Login kannst du dir jederzeit selbst aktive TKP-Kampagnen & Provisions-Partnerschaften picken.',
    ],
  ];

  return (
    <div className="home-page min-h-screen bg-white text-ink">
      {/* ---------- 1. RUHIGER HERO (1:1 Klarheit der Live-Startseite) ---------- */}
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
              className="text-[2.6rem] font-bold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-[4.1rem]"
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
                ? 'Find real UGC creators for free, launch pay-per-1,000-views campaigns, or build your own commission-based creator network.'
                : 'Finde echte UGC Creator kostenlos im Verzeichnis – oder starte skalierbare TKP-Kampagnen und eigene Creator-Programme auf Provisionsbasis.'}
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <a
                href="#search"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-geo-violet px-6 font-semibold text-white shadow-[0_14px_30px_rgba(139,63,202,0.35)] transition-transform hover:-translate-y-0.5"
              >
                Creator finden <Arrow />
              </a>
              <a
                href="#drei-wege"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-hairline bg-white px-6 font-semibold transition-colors hover:border-ink"
              >
                Für Unternehmen (3 Wege)
              </a>
            </div>

            {/* Ruhiger zweiter Einstieg fuer Creator: Anmelden -> Kampagnen picken & Geld verdienen */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => onNavigate('creator')}
                className="group inline-flex min-h-[44px] items-center gap-3 rounded-full border border-hairline bg-white/80 py-1.5 pl-1.5 pr-4 text-left text-sm backdrop-blur transition-colors hover:border-geo-violet hover:bg-white"
              >
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
                  style={{ background: GRADIENT }}
                >
                  Creator?
                </span>
                <span className="text-ink-soft">
                  <span className="font-semibold text-ink">Kostenlos anmelden</span>
                  <span className="hidden sm:inline"> – &amp; im Login direkt Kampagnen picken</span>
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

      {/* ---------- 2. DIE RUHIGE SUCHE (Ueberlappt den Hero wie auf Live) ---------- */}
      <section className="relative z-10 -mt-16 px-5 sm:-mt-20 sm:px-8">
        <div
          id="search"
          className="home-search-panel mx-auto max-w-6xl scroll-mt-24 rounded-3xl border border-hairline bg-white p-5 shadow-[0_30px_90px_rgba(35,22,47,0.10)] sm:p-8"
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

          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Beschreib kurz Produkt, Zielgruppe & Format – z. B. Skincare Reel, Streetwear Hoodie, Food-Test…"
              className="min-h-[52px] flex-1 rounded-2xl border border-hairline bg-surface px-4 text-sm text-ink outline-none transition focus:border-geo-violet focus:bg-white"
            />
            <button
              type="submit"
              className="inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-geo-violet px-6 text-sm font-semibold text-white transition-colors hover:bg-[#7531ae]"
            >
              Creator suchen <Arrow />
            </button>
          </form>

          {/* Ruhige Beispiel-Kategorien */}
          <div className="mt-3 flex flex-wrap gap-2">
            {['Beauty & Routinen', 'Streetwear & Fashion', 'Apps & Tech', 'Food & Drinks'].map(
              (label, idx) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setActivePresetIdx(idx);
                    setContactRequested(false);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    activePresetIdx === idx
                      ? 'bg-void text-white'
                      : 'bg-surface text-ink-soft hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ),
            )}
          </div>

          {/* 3 ruhige Creator-Karten */}
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {activeCreators.map((c) => {
              const selected = shortlist.includes(c.id);
              return (
                <div
                  key={c.id}
                  className={`flex flex-col justify-between rounded-2xl border p-4 transition-colors ${
                    selected ? 'border-geo-violet bg-[#FBF8FE]' : 'border-hairline bg-surface/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: GRADIENT }}
                    >
                      {c.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{c.name}</p>
                      <p className="truncate text-xs text-ink-soft">{c.niche}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-hairline/80 pt-3 text-xs">
                    <span className="text-ink-soft">{c.followers}</span>
                    <button
                      type="button"
                      onClick={() => onToggleShortlist(c.id)}
                      className={`rounded-lg px-2.5 py-1 font-bold transition-colors ${
                        selected
                          ? 'bg-[#edf5e5] text-[#385523]'
                          : 'bg-white text-ink hover:text-geo-violet'
                      }`}
                    >
                      {selected ? '✓ In Auswahl' : '+ Zur Auswahl'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {shortlist.length > 0 && (
            <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-2xl border border-hairline bg-surface px-4 py-3 text-xs sm:flex-row sm:items-center">
              <span className="text-ink">
                <strong>{shortlist.length} Creator ausgewählt</strong> – Kontaktdaten kostenlos per E-Mail anfordern (0 € Provision).
              </span>
              {contactRequested ? (
                <span className="font-bold text-[#385523]">
                  ✓ In der Demo vorgemerkt (kein echter E-Mail-Versand)
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setContactRequested(true)}
                  className="rounded-full bg-void px-4 py-2 font-semibold text-white hover:bg-geo-violet"
                >
                  Kontaktdaten kostenlos anfordern
                </button>
              )}
            </div>
          )}
        </div>
        <p className="mx-auto mt-4 max-w-6xl text-center text-xs leading-5 text-ink-soft">
          Suche und Kontaktanfrage sind kostenlos. Produktion und Nutzungsrechte vereinbart ihr direkt.
        </p>
      </section>

      {/* ---------- 3. DIE 3 KLAREN MOEGLICHKEITEN FUER UNTERNEHMEN ---------- */}
      <section
        id="drei-wege"
        className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28"
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
            Drei Wege zur Zusammenarbeit.
            <br className="hidden sm:block" />{' '}
            <span className="text-ink-soft">So einfach oder skalierbar, wie du willst.</span>
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* WEG 1: CREATOR DIREKT FINDEN */}
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
                    Durchsuche {creatorCountLabel} echte Creator ohne Login, prüfe Arbeitsproben und fordere Kontaktdaten gratis per E-Mail an. Honorar und Rechte klärt ihr direkt.
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

            {/* WEG 2: TKP-KAMPAGNE */}
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
                    Hinterlege ein festes Kampagnenbudget (z. B. 2.000 € bei 3,50 € pro 1.000 Views). Unsere Creator picken dein Briefing in ihrem Login-Bereich – du zahlst nur für verifizierte Views.
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
                  TKP-Kampagne ansehen <Arrow />
                </button>
              </div>
            </NotchCard>

            {/* WEG 3: AFFILIATE-NETZWERK AUF PROVISIONSBASIS -> STRATEGIE-CALL */}
            <NotchCard
              dark
              title={
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-geo-green">
                    03 · Komplett-System
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
                    Wir bauen deiner Marke ein komplettes UGC- &amp; Partnerprogramm auf Provisionsbasis auf (eigene Codes, Produkt-Seeding, Stufen-System wie bei großen Supplement-Brands) – und laden unsere {creatorCountLabel} Creator ein.
                  </p>
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.05] p-3.5 text-xs">
                    <strong className="text-geo-green">0 € Fixgagen – reine Provisionsbasis</strong>
                    <p className="mt-0.5 text-white/65">
                      Individuelles Konzept &amp; Setup im persönlichen Gespräch.
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
                    Details zum Provisions-Modell ansehen
                  </button>
                </div>
              </div>
            </NotchCard>
          </div>
        </div>
      </section>

      {/* ---------- 4. FUER CREATOR: ANMELDEN -> IM KONTO KAMPAGNEN PICKEN & GELD VERDIENEN ---------- */}
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
              Für Creator
            </p>
            <h2
              id="demo-creator-banner"
              className="text-3xl font-bold leading-tight tracking-[-0.045em] sm:text-5xl"
            >
              Profil anlegen.
              <br />
              Direkt Kampagnen picken.
            </h2>
            <p className="mt-5 max-w-lg leading-7 text-white/90">
              Trag dich kostenlos ins Verzeichnis ein, um von Brands gefunden zu werden – und nutze deinen neuen Creator-Login, um dir jederzeit selbst bezahlte TKP-Kampagnen &amp; Provisions-Deals auszusuchen.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('creator')}
                className="inline-flex min-h-[48px] items-center gap-3 rounded-full bg-white px-6 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
              >
                Als Creator kostenlos anmelden <Arrow />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('konto')}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-white/35 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                Creator-Login (Kampagnen ansehen)
              </button>
            </div>
          </div>

          <ul className="relative space-y-3">
            {[
              [
                '1 · Kostenlos im Verzeichnis gelistet',
                'Marken finden dein Portfolio und fragen dich ohne Provision direkt an.',
              ],
              [
                '2 · Im Login aktive Kampagnen picken',
                'Wähle selbst TKP-Kampagnen (Geld pro 1.000 Views) oder Produkt- & Provisions-Partnerschaften aus.',
              ],
              [
                '3 · Auszahlung in Euro + Beleg-Service',
                'SEPA-Überweisung aufs Bankkonto, automatische Gutschrift und optionale Steuer-Hilfe.',
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

      {/* ---------- 5. KURZE RUHIGE FAQ ---------- */}
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
    </div>
  );
}

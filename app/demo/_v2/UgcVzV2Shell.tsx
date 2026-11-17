'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Check,
  ExternalLink,
  Lock,
  Menu,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import {
  LOCALES,
  type DemoSection,
  type LocaleCode,
} from './data';
import HomeSection from './HomeSection';
import CreatorKontoSection from './CreatorKontoSection';
import BrandsClubSection from './BrandsClubSection';
import CreatorTaxAppSection from './CreatorTaxAppSection';
import {
  AgenturenView,
  StrategieView,
  VergleichView,
} from './AgencyCompareStrategySection';

const GRADIENT =
  'linear-gradient(152deg, #0396F8 0%, #1F6FF4 25%, #3F58F2 50%, #653AED 75%, #9131EF 100%)';

const STORAGE_PREFIX = 'ugcvz-v2-demo:';

const NAV_ITEMS: { id: DemoSection; href: string; label: string }[] = [
  { id: 'brands', href: '/demo/brands', label: 'Für Brands' },
  { id: 'creator', href: '/demo/creator', label: 'Für Creator' },
  { id: 'konto', href: '/demo/konto', label: 'Creator-Login' },
];

interface Props {
  initialSection: DemoSection;
  creatorCountLabel: string;
}

export default function UgcVzV2Shell({ initialSection, creatorCountLabel }: Props) {
  const normalizedInitial: DemoSection =
    initialSection === 'bounties' ? 'konto' : initialSection;

  const [section, setSection] = useState<DemoSection>(normalizedInitial);
  const [vergleichSlug, setVergleichSlug] = useState<string>('all');
  const [locale, setLocale] = useState<LocaleCode>('de');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [shortlist, setShortlist] = useState<string[]>(['UGC-MN01', 'UGC-ST01']);
  const [pickedIds, setPickedIds] = useState<string[]>(['ugcvz-launch']);
  const [submittedClips, setSubmittedClips] = useState<
    { campaignId: string; url: string; payout: number; status: 'verified' | 'flagged' }[]
  >([]);

  // Strategie-Call Modal (gezielt fuer Moeglichkeit 3: Eigenes Creator-Affiliate-Netzwerk)
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [strategyTopic, setStrategyTopic] = useState('');
  const [strategySubmitted, setStrategySubmitted] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [brandEmail, setBrandEmail] = useState('');

  useEffect(() => {
    setSection(initialSection === 'bounties' ? 'konto' : initialSection);
  }, [initialSection]);

  useEffect(() => {
    try {
      const savedLocale = sessionStorage.getItem(STORAGE_PREFIX + 'locale') as LocaleCode | null;
      if (savedLocale && LOCALES[savedLocale]) setLocale(savedLocale);
      const savedShortlist = sessionStorage.getItem(STORAGE_PREFIX + 'shortlist');
      if (savedShortlist) setShortlist(JSON.parse(savedShortlist));
      const savedPicked = sessionStorage.getItem(STORAGE_PREFIX + 'picked');
      if (savedPicked) setPickedIds(JSON.parse(savedPicked));
      const savedClips = sessionStorage.getItem(STORAGE_PREFIX + 'clips');
      if (savedClips) setSubmittedClips(JSON.parse(savedClips));
    } catch {
      /* sessionStorage optional */
    }
  }, []);

  const handleLocaleChange = (next: LocaleCode) => {
    setLocale(next);
    try {
      sessionStorage.setItem(STORAGE_PREFIX + 'locale', next);
    } catch {
      /* ignore */
    }
  };

  const handleToggleShortlist = (id: string) => {
    setShortlist((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        sessionStorage.setItem(STORAGE_PREFIX + 'shortlist', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const handleTogglePick = (id: string) => {
    setPickedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        sessionStorage.setItem(STORAGE_PREFIX + 'picked', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const handleSubmitClip = (entry: {
    campaignId: string;
    url: string;
    payout: number;
    status: 'verified' | 'flagged';
  }) => {
    setSubmittedClips((prev) => {
      const next = [entry, ...prev];
      try {
        sessionStorage.setItem(STORAGE_PREFIX + 'clips', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const navigateSection = (target: DemoSection) => {
    const resolved = target === 'bounties' ? 'konto' : target;
    setSection(resolved);
    setMobileMenuOpen(false);
    const path = resolved === 'home' ? '/demo' : `/demo/${resolved}`;
    try {
      window.history.pushState(null, '', path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      /* ignore */
    }
  };

  const openVergleichFromFooter = (slug: string) => {
    setVergleichSlug(slug);
    navigateSection('vergleich');
  };

  const openStrategyModal = (
    defaultTopic = 'Eigenes UGC-Creator- & Affiliate-Netzwerk auf Provisionsbasis aufbauen',
  ) => {
    setStrategyTopic(defaultTopic);
    setStrategySubmitted(false);
    setStrategyModalOpen(true);
  };

  const resetDemo = () => {
    try {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith(STORAGE_PREFIX))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    setLocale('de');
    setShortlist(['UGC-MN01', 'UGC-ST01']);
    setPickedIds(['ugcvz-launch']);
    setSubmittedClips([]);
  };

  return (
    <div className="min-h-screen bg-white text-ink">
      {/* DEZENTE INTERNE VORSCHAU-LEISTE GANZ OBEN */}
      <div className="border-b border-white/10 bg-void px-4 py-1.5 text-[11px] text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 font-semibold text-geo-green">
              <Lock size={11} /> Demo-Vorschau
            </span>
            <span className="hidden text-white/55 sm:inline">
              Live-Seite bleibt unberührt
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-full border border-white/15 bg-white/[0.05] p-0.5">
              {(['de', 'en'] as LocaleCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleLocaleChange(code)}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    locale === code ? 'bg-white text-void' : 'text-white/65 hover:text-white'
                  }`}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigateSection('strategie')}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-white/80 hover:text-white"
            >
              <BookOpen size={11} /> Notizen
            </button>

            <a
              href="/demo/kooperationen"
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-white/75 hover:text-white"
            >
              fomo <ExternalLink size={10} />
            </a>

            <button
              type="button"
              onClick={resetDemo}
              className="inline-flex items-center gap-1 text-white/55 hover:text-white"
              title="Demo zurücksetzen"
            >
              <RefreshCw size={10} /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* RUHIGER HEADER WIE AUF DER LIVE-SEITE (SiteHeader.tsx) */}
      <header className="sticky top-0 z-40 border-b border-hairline/80 bg-white/85 px-5 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 sm:h-[72px]">
          <Link
            href="/demo"
            onClick={(e) => {
              e.preventDefault();
              navigateSection('home');
            }}
            aria-label="UGC VZ – Startseite"
            className="shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/ugc-vz-logo.svg"
              alt="UGC VZ"
              width={78}
              height={48}
              className="h-9 w-auto sm:h-10"
            />
          </Link>

          <nav aria-label="Hauptnavigation" className="hidden items-center gap-7 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = section === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    navigateSection(item.id);
                  }}
                  className={`text-sm font-medium transition-colors ${
                    active ? 'font-bold text-ink' : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateSection('creator')}
              className="hidden min-h-[40px] items-center rounded-full border border-hairline px-4 text-sm font-semibold text-ink transition-colors hover:border-ink lg:inline-flex"
            >
              Als Creator anmelden
            </button>
            <button
              type="button"
              onClick={() => {
                if (section !== 'home') navigateSection('home');
                setTimeout(() => {
                  document.getElementById('search')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="inline-flex min-h-[40px] items-center rounded-full bg-geo-violet px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(139,63,202,0.3)] transition-transform hover:-translate-y-0.5"
            >
              Creator finden
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline md:hidden"
              aria-label="Menü öffnen"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="border-t border-hairline bg-white py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    navigateSection(item.id);
                  }}
                  className="flex min-h-[44px] items-center rounded-xl px-3 text-sm font-medium hover:bg-surface"
                >
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => navigateSection('creator')}
                className="mt-1 flex min-h-[44px] items-center justify-center rounded-xl border border-geo-violet/25 bg-geo-violet/5 text-sm font-semibold text-geo-violet"
              >
                Als Creator anmelden
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* AKTIVE SEITE */}
      <main>
        {section === 'home' && (
          <HomeSection
            locale={locale}
            creatorCountLabel={creatorCountLabel}
            shortlist={shortlist}
            onToggleShortlist={handleToggleShortlist}
            onNavigate={navigateSection}
            onOpenStrategyModal={openStrategyModal}
          />
        )}
        {section === 'konto' && (
          <CreatorKontoSection
            pickedIds={pickedIds}
            onTogglePick={handleTogglePick}
            submittedClips={submittedClips}
            onSubmitClip={handleSubmitClip}
          />
        )}
        {section === 'brands' && (
          <BrandsClubSection
            creatorCountLabel={creatorCountLabel}
            onNavigate={navigateSection}
            onOpenStrategyModal={openStrategyModal}
          />
        )}
        {section === 'creator' && <CreatorTaxAppSection onNavigate={navigateSection} />}
        {section === 'agenturen' && <AgenturenView onOpenStrategyModal={openStrategyModal} />}
        {section === 'vergleich' && (
          <VergleichView
            creatorCountLabel={creatorCountLabel}
            selectedSlug={vergleichSlug}
            onSelectSlug={setVergleichSlug}
            onOpenStrategyModal={openStrategyModal}
          />
        )}
        {section === 'strategie' && (
          <StrategieView creatorCountLabel={creatorCountLabel} onNavigate={navigateSection} />
        )}
      </main>

      {/* RUHIGER 5-SPALTEN FOOTER INKL. GEO-VERGLEICHSSEITEN */}
      <footer className="border-t border-white/10 bg-void px-5 py-16 text-white sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/ugc-vz-logo-white.svg" alt="UGC VZ" width={84} height={50} />
            <p className="mt-3 text-xs leading-5 text-white/60">
              Die Plattform, um echte UGC Creator kostenlos zu finden, TKP-Kampagnen zu schalten oder eigene Provisions-Netzwerke aufzubauen.
            </p>
            <p className="mt-3 text-xs text-white/40">track by track GmbH · Berlin</p>
          </div>

          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-white">
              Für Brands
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              <li>
                <button type="button" onClick={() => navigateSection('home')} className="hover:text-white">
                  1 · Creator finden (0 €)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigateSection('brands')} className="hover:text-white">
                  2 · TKP-Kampagne starten
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openStrategyModal()}
                  className="text-left text-geo-green hover:underline"
                >
                  3 · Provisions-Netzwerk (Call)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigateSection('agenturen')} className="hover:text-white">
                  Für Agenturen
                </button>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-white">
              Für Creator
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              <li>
                <button type="button" onClick={() => navigateSection('creator')} className="hover:text-white">
                  Als Creator anmelden
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigateSection('konto')} className="hover:text-white">
                  Creator-Login (Kampagnen picken)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigateSection('konto')} className="hover:text-white">
                  Auszahlung &amp; Steuer-Hilfe
                </button>
              </li>
            </ul>
          </div>

          {/* Spalte 4: Vergleiche (GEO-Seiten wie im Live-Footer) */}
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-white">
              Vergleiche
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              <li>
                <button type="button" onClick={() => openVergleichFromFooter('all')} className="hover:text-white">
                  Alle Plattformen
                </button>
              </li>
              <li>
                <button type="button" onClick={() => openVergleichFromFooter('speekly-alternative')} className="hover:text-white">
                  Speekly Alternative
                </button>
              </li>
              <li>
                <button type="button" onClick={() => openVergleichFromFooter('contentmarkt-alternative')} className="hover:text-white">
                  Contentmarkt Alternative
                </button>
              </li>
              <li>
                <button type="button" onClick={() => openVergleichFromFooter('creonda-alternative')} className="hover:text-white">
                  Creonda Alternative
                </button>
              </li>
              <li>
                <button type="button" onClick={() => openVergleichFromFooter('influee-alternative')} className="hover:text-white">
                  Influee Alternative
                </button>
              </li>
              <li>
                <button type="button" onClick={() => openVergleichFromFooter('stylink-ugc-alternative')} className="hover:text-white">
                  stylink UGC Alternative
                </button>
              </li>
              <li>
                <button type="button" onClick={() => openVergleichFromFooter('boksi-alternative')} className="hover:text-white">
                  Boksi Alternative
                </button>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-white">
              API &amp; KI-Agenten
            </p>
            <p className="mt-4 text-xs leading-5 text-white/60">
              MCP · A2A 1.0 · WebMCP · ChatGPT Plugin aktiv.
            </p>
          </div>
        </div>
      </footer>

      {/* STRATEGIE-CALL MODAL (NUR FUER MOEGLICHKEIT 3: EIGENES CREATOR-/AFFILIATE-NETZWERK) */}
      {strategyModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-hairline bg-white p-6 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={() => setStrategyModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-ink-soft hover:bg-surface hover:text-ink"
              aria-label="Schließen"
            >
              <X size={18} />
            </button>

            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white"
              style={{ background: GRADIENT }}
            >
              <Sparkles size={12} /> Möglichkeit 3 · Strategie-Call
            </span>

            <h2 className="mt-3 text-2xl font-bold text-ink">
              Eigenes Creator- &amp; Affiliate-Netzwerk aufbauen
            </h2>
            <p className="mt-1.5 text-xs leading-5 text-ink-soft">
              Wir besprechen in 15 Minuten, wie wir euer eigenes Partnerprogramm auf Provisionsbasis (Codes, Produkt-Seeding &amp; Stufen-System) technisch aufsetzen und aus unseren {creatorCountLabel} Creatorn befüllen.
            </p>

            {strategySubmitted ? (
              <div className="mt-6 rounded-2xl border border-[#dce9d1] bg-[#edf5e5] p-5 text-sm text-[#2b421a]">
                <p className="flex items-center gap-2 font-bold">
                  <Check size={18} /> Strategie-Call in der Demo vorgemerkt!
                </p>
                <p className="mt-1 text-xs leading-5">
                  Im Live-Betrieb landet die Anfrage direkt bei euch in Slack &amp; per Mail inkl. Terminauswahl.
                </p>
                <button
                  type="button"
                  onClick={() => setStrategyModalOpen(false)}
                  className="mt-4 rounded-full bg-void px-5 py-2 text-xs font-bold text-white"
                >
                  Schließen
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setStrategySubmitted(true);
                }}
                className="mt-5 space-y-3.5"
              >
                <div>
                  <label className="block text-xs font-bold text-ink">Thema / Produkt</label>
                  <input
                    type="text"
                    value={strategyTopic}
                    onChange={(e) => setStrategyTopic(e.target.value)}
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-hairline bg-surface px-3.5 text-xs text-ink"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-ink">Unternehmen / Marke</label>
                    <input
                      type="text"
                      required
                      placeholder="Deine Marke"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="mt-1 min-h-[42px] w-full rounded-xl border border-hairline bg-surface px-3.5 text-xs text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink">Geschäftliche E-Mail</label>
                    <input
                      type="email"
                      required
                      placeholder="name@unternehmen.de"
                      value={brandEmail}
                      onChange={(e) => setBrandEmail(e.target.value)}
                      className="mt-1 min-h-[42px] w-full rounded-xl border border-hairline bg-surface px-3.5 text-xs text-ink"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="min-h-[46px] w-full rounded-full bg-geo-violet text-sm font-bold text-white hover:bg-[#7531ae]"
                >
                  Unverbindlichen Strategie-Call anfragen
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

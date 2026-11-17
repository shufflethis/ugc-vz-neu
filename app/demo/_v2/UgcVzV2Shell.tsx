'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
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
import BountiesSection from './BountiesSection';
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

const NAV_ITEMS: { id: DemoSection; href: string; label: string; badge?: string }[] = [
  { id: 'home', href: '/demo', label: 'Startseite' },
  { id: 'bounties', href: '/demo/bounties', label: 'UGC Bounties', badge: 'TKP' },
  { id: 'brands', href: '/demo/brands', label: 'Affiliate-System (Brands)', badge: 'More-Modell' },
  { id: 'creator', href: '/demo/creator', label: 'Creator & Steuern' },
  { id: 'agenturen', href: '/demo/agenturen', label: 'Agenturen' },
];

interface Props {
  initialSection: DemoSection;
  creatorCountLabel: string;
}

export default function UgcVzV2Shell({ initialSection, creatorCountLabel }: Props) {
  const [section, setSection] = useState<DemoSection>(initialSection);
  const [vergleichSlug, setVergleichSlug] = useState<string>('all');
  const [locale, setLocale] = useState<LocaleCode>('de');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shortlist, setShortlist] = useState<string[]>(['UGC-MN01', 'UGC-ST01']);
  const [submittedClips, setSubmittedClips] = useState<
    { campaignId: string; url: string; payout: number; status: 'verified' | 'flagged' }[]
  >([]);

  // Strategy Session Modal (Hypefy-style)
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [strategyTopic, setStrategyTopic] = useState('');
  const [strategySubmitted, setStrategySubmitted] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [brandEmail, setBrandEmail] = useState('');

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    try {
      const savedLocale = sessionStorage.getItem(STORAGE_PREFIX + 'locale') as LocaleCode | null;
      if (savedLocale && LOCALES[savedLocale]) setLocale(savedLocale);
      const savedShortlist = sessionStorage.getItem(STORAGE_PREFIX + 'shortlist');
      if (savedShortlist) setShortlist(JSON.parse(savedShortlist));
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
    setSection(target);
    setMobileMenuOpen(false);
    const path = target === 'home' ? '/demo' : `/demo/${target}`;
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

  const openStrategyModal = (defaultTopic = 'Allgemeine Kampagnen- & Club-Beratung') => {
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
    setSubmittedClips([]);
  };

  return (
    <div className="min-h-screen bg-white text-ink">
      {/* TOP PRIVATE PREVIEW BAR */}
      <div className="border-b border-white/10 bg-void px-4 py-2 text-xs text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 font-semibold text-geo-green">
              <Lock size={12} /> Geschützte Demo · UGC VZ 2.0
            </span>
            <span className="hidden text-white/60 md:inline">
              Live-Seite (ugc-vz.de) bleibt unberührt · Kein echter Mail-/Zahlungsversand
            </span>
          </div>

          {/* Multilingual / International Domain Preview Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.05] p-0.5">
              {(Object.keys(LOCALES) as LocaleCode[]).map((code) => {
                const l = LOCALES[code];
                const active = locale === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleLocaleChange(code)}
                    title={`Domain-Vorschau: ${l.domain}`}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold transition-colors ${
                      active ? 'bg-white text-void' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {l.flag} {l.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => navigateSection('strategie')}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                section === 'strategie'
                  ? 'bg-geo-violet text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <BookOpen size={12} /> Call-Synthese
            </button>

            <a
              href="/demo/kooperationen"
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 hover:bg-white/20 hover:text-white"
            >
              fomo-Pilot <ExternalLink size={11} />
            </a>

            <button
              type="button"
              onClick={resetDemo}
              className="inline-flex items-center gap-1 text-[11px] text-white/60 hover:text-white"
              title="Simulierte Demo-Eingaben zurücksetzen"
            >
              <RefreshCw size={11} /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* NEW UGC VZ 2.0 HEADER */}
      <header className="sticky top-0 z-40 border-b border-hairline bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <Link
            href="/demo"
            onClick={(e) => {
              e.preventDefault();
              navigateSection('home');
            }}
            className="flex items-center gap-2.5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/ugc-vz-logo.svg" alt="UGC VZ" width={72} height={44} />
            <span className="hidden rounded-md bg-surface px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-geo-violet sm:inline-block">
              v2 Preview · {LOCALES[locale].domain}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="UGC VZ 2.0 Navigation">
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
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-void text-white'
                      : 'text-ink-soft hover:bg-surface hover:text-ink'
                  }`}
                >
                  {item.label}
                  {item.badge && (
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${
                        active ? 'bg-geo-green text-void' : 'bg-geo-violet/15 text-geo-violet'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Header CTA */}
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => openStrategyModal('15-Min Strategy Session (Header CTA)')}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-geo-violet px-4 text-xs font-bold text-white shadow-sm hover:bg-[#7531ae]"
            >
              <Calendar size={14} />
              Strategy Session
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-hairline lg:hidden"
            aria-label="Menü öffnen"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-hairline bg-white px-5 py-4 lg:hidden">
            <div className="flex flex-col gap-1.5">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    navigateSection(item.id);
                  }}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold ${
                    section === item.id ? 'bg-void text-white' : 'bg-surface text-ink'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="rounded bg-geo-violet px-2 py-0.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openStrategyModal('Mobile Strategy Session');
                }}
                className="mt-2 min-h-[44px] w-full rounded-xl bg-geo-violet text-sm font-bold text-white"
              >
                15-Min Strategy Session buchen
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ACTIVE VIEW */}
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
        {section === 'bounties' && (
          <BountiesSection
            submittedClips={submittedClips}
            onSubmitClip={handleSubmitClip}
            onOpenStrategyModal={openStrategyModal}
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

      {/* NEW UGC VZ 2.0 FOOTER (5-Spalten inkl. klassischer GEO-Vergleichs-Links wie im Live-Footer) */}
      <footer className="border-t border-white/10 bg-void px-5 py-16 text-white sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/ugc-vz-logo-white.svg" alt="UGC VZ" width={84} height={50} />
            <p className="mt-3 text-xs leading-5 text-white/65">
              Offenes KI-Creator-Verzeichnis ({creatorCountLabel} echte Profile), Pay-per-View Bounties & schlüsselfertige Affiliate-Programme für Brands.
            </p>
            <p className="mt-3 font-mono text-[10px] text-geo-green">
              track by track GmbH · Berlin
            </p>
          </div>

          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-white">
              Für Brands & Agenturen
            </p>
            <ul className="mt-4 space-y-2.5 text-xs text-white/65">
              <li>
                <button type="button" onClick={() => navigateSection('home')} className="hover:text-white">
                  Kostenlose Creator-Suche (0 €)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigateSection('brands')} className="font-semibold text-geo-green hover:underline">
                  Eigenes Affiliate-System (More-Modell)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigateSection('bounties')} className="hover:text-white">
                  UGC Bounties (Pay-per-1.000-Views)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigateSection('agenturen')} className="hover:text-white">
                  Für Agenturen & Managements
                </button>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-white">
              Für Creator
            </p>
            <ul className="mt-4 space-y-2.5 text-xs text-white/65">
              <li>
                <button type="button" onClick={() => navigateSection('bounties')} className="hover:text-white">
                  Mit Views Geld verdienen (+10 € Bonus)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigateSection('creator')} className="hover:text-white">
                  Steuer- & Gutschrifts-Autopilot
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigateSection('creator')} className="hover:text-white">
                  Web-App & Push-Benachrichtigungen
                </button>
              </li>
            </ul>
          </div>

          {/* Spalte 4: Vergleiche (GEO-Seiten genau wie im Live-Footer, erweitert um Contentmarkt, Creonda & Hypefy!) */}
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-white">
              Vergleiche (GEO)
            </p>
            <ul className="mt-4 space-y-2.5 text-xs text-white/65">
              <li>
                <button type="button" onClick={() => openVergleichFromFooter('all')} className="hover:text-white">
                  Alle Plattformen im Vergleich
                </button>
              </li>
              <li>
                <button type="button" onClick={() => openVergleichFromFooter('contentmarkt-alternative')} className="hover:text-white">
                  Contentmarkt Alternative
                </button>
              </li>
              <li>
                <button type="button" onClick={() => openVergleichFromFooter('speekly-alternative')} className="hover:text-white">
                  Speekly Alternative
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
              <li>
                <button type="button" onClick={() => openVergleichFromFooter('hypefy-alternative')} className="hover:text-white">
                  Hypefy AI Alternative
                </button>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-white">
              KI-Agenten & Vorschau
            </p>
            <p className="mt-4 text-xs leading-5 text-white/65">
              MCP · A2A 1.0 · WebMCP · ChatGPT Plugin aktiv. Passwortgeschützte Demo unter <code className="text-white">/demo</code> (`noindex, noarchive`).
            </p>
          </div>
        </div>
      </footer>

      {/* HYPEFY-STYLE STRATEGY SESSION & PILOT DISCOUNT MODAL */}
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
              <Sparkles size={12} /> Book Strategy Session · Referenz-Pilot
            </span>

            <h2 className="mt-3 text-2xl font-bold text-ink">
              15-Minuten Strategie-Call & Neukunden-Vorteil sichern
            </h2>
            <p className="mt-1.5 text-xs leading-5 text-ink-soft">
              Für ausgewählte Pilot-Marken & Love-Brands starten wir mit <strong>0 % Plattformgebühr bzw. +20 % Reichweiten-Bonus</strong> im Austausch für eine gemeinsame Case Study.
            </p>

            {strategySubmitted ? (
              <div className="mt-6 rounded-2xl border border-[#dce9d1] bg-[#edf5e5] p-5 text-sm text-[#2b421a]">
                <p className="flex items-center gap-2 font-bold">
                  <Check size={18} /> Anfrage lokal in der Demo simuliert!
                </p>
                <p className="mt-1 text-xs leading-5">
                  Im Live-Betrieb landet dieser Lead sofort in Slack + E-Mail (inkl. Vorauswahl deiner {shortlist.length} gemerkten Creator und gewähltem Thema „{strategyTopic}“) plus direktem Kalender-Slot.
                </p>
                <button
                  type="button"
                  onClick={() => setStrategyModalOpen(false)}
                  className="mt-4 rounded-full bg-void px-5 py-2 text-xs font-bold text-white"
                >
                  Zurück zur Vorschau
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
                  <label className="block text-xs font-bold text-ink">Gewünschtes Setup</label>
                  <input
                    type="text"
                    value={strategyTopic}
                    onChange={(e) => setStrategyTopic(e.target.value)}
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-hairline bg-surface px-3.5 text-xs text-ink"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-ink">Marke / Agentur</label>
                    <input
                      type="text"
                      required
                      placeholder="z. B. Nebelkind / DailyFuel"
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
                      placeholder="marketing@deinemarke.de"
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
                  Unverbindlichen Slot & Pilot-Konditionen anfragen
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

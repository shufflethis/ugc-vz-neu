'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { NICHE_INDEX } from '@/app/lib/niche-index';
import { trackUGCEvents } from '@/app/lib/analytics';
import {
  EXPERIENCE_OPTIONS,
  USAGE_RIGHTS_OPTIONS,
  VIDEO_FORMATS,
  buildBriefingQueryFromCalculator,
  buildBudgetSummaryText,
  calculateUgcBudget,
  type ExperienceLevelId,
  type NichePriceBenchmark,
  type UsageRightsId,
  type VideoFormatId,
} from '@/app/lib/ugc-calculator';

const INTRO_CALL_URL = 'https://book.agentifizierung.de/gorden/intro-call?overlayCalendar=true';

const euro = (value: number) => `${value.toLocaleString('de-DE')} €`;

interface UgcCostCalculatorProps {
  benchmarks?: NichePriceBenchmark[];
  defaultNiche?: string;
}

export default function UgcCostCalculator({ benchmarks = [], defaultNiche = 'allgemein' }: UgcCostCalculatorProps) {
  const [nicheSlug, setNicheSlug] = useState(defaultNiche);
  const [formatId, setFormatId] = useState<VideoFormatId>('social_clip');
  const [videoCount, setVideoCount] = useState(4);
  const [extraHooks, setExtraHooks] = useState(2);
  const [includeRawFiles, setIncludeRawFiles] = useState(false);
  const [usageRights, setUsageRights] = useState<UsageRightsId>('paid_12m');
  const [includeWhitelisting, setIncludeWhitelisting] = useState(false);
  const [experience, setExperience] = useState<ExperienceLevelId>('experienced');

  // Optionaler E-Mail-Lead-Magnet fuer interne Budget-Freigabe / Kurz-Check
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadWebsite, setLeadWebsite] = useState('');
  const [leadSending, setLeadSending] = useState(false);
  const [leadSent, setLeadSent] = useState(false);

  const nicheOptions = useMemo(
    () => [
      { slug: 'allgemein', label: 'Branchenübergreifend (DE-Schnitt)' },
      ...NICHE_INDEX.map((n) => ({ slug: n.slug, label: n.chip })),
    ],
    [],
  );

  const activeNiche = nicheOptions.find((n) => n.slug === nicheSlug) || nicheOptions[0];
  const activeBenchmark = useMemo(
    () => benchmarks.find((b) => b.slug === nicheSlug) || null,
    [benchmarks, nicheSlug],
  );

  const input = useMemo(
    () => ({
      nicheSlug: activeNiche.slug,
      nicheLabel: activeNiche.label,
      formatId,
      videoCount,
      extraHooks,
      includeRawFiles,
      usageRights,
      includeWhitelisting,
      experience,
      benchmark: activeBenchmark,
    }),
    [activeNiche, formatId, videoCount, extraHooks, includeRawFiles, usageRights, includeWhitelisting, experience, activeBenchmark],
  );

  const result = useMemo(() => calculateUgcBudget(input), [input]);
  const briefingQuery = useMemo(() => buildBriefingQueryFromCalculator(input, result), [input, result]);
  const summaryText = useMemo(() => buildBudgetSummaryText(input, result), [input, result]);
  const searchHref = `/brands#q=${encodeURIComponent(briefingQuery)}`;

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      trackUGCEvents.ctaClick('calculator_copy_summary');
      toast.success('Budget-Übersicht kopiert – bereit für Slack, Mail oder interne Freigabe.');
    } catch {
      toast.error('Kopieren fehlgeschlagen. Bitte markiere den Text manuell.');
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadEmail.trim())) {
      toast.error('Bitte gib Name und eine gültige E-Mail-Adresse an.');
      return;
    }
    setLeadSending(true);
    try {
      const res = await fetch('/api/submit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          creatorIds: [],
          clientInfo: {
            requestType: 'general_contact',
            name: leadName.trim(),
            email: leadEmail.trim(),
            company: leadCompany.trim(),
            website: leadWebsite,
            subject: `UGC-Kostenrechner: ${activeNiche.label} (${videoCount} Videos, ca. ${euro(result.totalMid)})`,
            message: `${summaryText}\n\nGewünschter nächster Schritt: Bitte passende Creator-Vorschläge oder Budget-Check zusenden.`,
            submissionId: globalThis.crypto?.randomUUID?.() || `calc-${Date.now()}`,
            sourcePath: typeof window !== 'undefined' ? window.location.pathname : '/brands/ugc-kosten-rechner',
            sourceUrl: typeof window !== 'undefined' ? window.location.href : 'https://ugc-vz.de/brands/ugc-kosten-rechner',
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Senden fehlgeschlagen');
      }
      setLeadSent(true);
      trackUGCEvents.contactForm('cost_calculator');
      toast.success('Kalkulation angefragt! Bestätigung ist per E-Mail unterwegs.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Senden. Bitte versuche es erneut.');
    } finally {
      setLeadSending(false);
    }
  };

  return (
    <section
      id="ugc-kosten-rechner"
      aria-labelledby="calculator-heading"
      className="scroll-mt-24 rounded-3xl border border-hairline bg-surface p-5 sm:p-8 lg:p-10"
    >
      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-geo-violet">
            Interaktiver UGC-Budget- &amp; Nutzungsrechte-Rechner
          </p>
          <h2 id="calculator-heading" className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Was kostet deine UGC-Kampagne realistisch?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
            Kalkuliere Format, Anzahl, Hooks und Nutzungsrechte – inklusive Direktvergleich zu Marktplatz-Modellen.
            {activeBenchmark ? (
              <>
                {' '}Für <strong className="text-ink">{activeNiche.label}</strong> rechnen wir mit echten Selbstangaben aus{' '}
                <strong className="text-ink">{activeBenchmark.n} Creator-Profilen</strong> (Einstiegs-Median {euro(activeBenchmark.median)}).
              </>
            ) : (
              ' Wähle optional eine Branche für reale Daten aus dem UGC-VZ-Verzeichnis.'
            )}
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#dce9d1] bg-[#edf5e5] px-3 py-1.5 text-xs font-semibold text-[#385523]">
          0 % Plattform-Provision bei UGC VZ
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        {/* Linke Spalte: Eingaben */}
        <div className="space-y-6 rounded-2xl border border-hairline bg-white p-5 sm:p-6">
          {/* 1. Branche */}
          <div>
            <label htmlFor="calc-niche" className="block text-sm font-semibold text-ink">
              1. Branche / Nische
            </label>
            <select
              id="calc-niche"
              value={nicheSlug}
              onChange={(e) => setNicheSlug(e.target.value)}
              className="mt-2 w-full rounded-xl border border-hairline bg-white px-4 py-3 text-sm text-ink focus:border-geo-violet focus:outline-none focus:ring-2 focus:ring-geo-violet"
            >
              {nicheOptions.map((opt) => {
                const bm = benchmarks.find((b) => b.slug === opt.slug);
                return (
                  <option key={opt.slug} value={opt.slug}>
                    {opt.label}{bm ? ` (Live-Median ${euro(bm.median)} · ${bm.count} Creator)` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 2. Format */}
          <div>
            <span className="block text-sm font-semibold text-ink">2. Video-Format</span>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {VIDEO_FORMATS.map((f) => {
                const active = f.id === formatId;
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFormatId(f.id)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      active
                        ? 'border-geo-violet bg-[#FBF8FE] text-ink'
                        : 'border-hairline bg-white text-ink-soft hover:border-ink/30'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-ink">{f.label}</span>
                    <span className="mt-0.5 block text-xs text-ink-soft">{f.lengthLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Anzahl Videos & Extra-Hooks */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between text-sm">
                <label htmlFor="calc-videos" className="font-semibold text-ink">
                  3. Anzahl Videos
                </label>
                <span className="font-mono font-bold text-geo-violet">{videoCount}×</span>
              </div>
              <input
                id="calc-videos"
                type="range"
                min={1}
                max={20}
                step={1}
                value={videoCount}
                onChange={(e) => setVideoCount(Number(e.target.value))}
                className="mt-2 w-full accent-geo-violet"
              />
              <p className="mt-1 text-xs text-ink-soft">
                {result.bundleDiscountPct > 0
                  ? `Inkl. geschätztem Paket-Rabatt (−${result.bundleDiscountPct} %) ab ${videoCount >= 10 ? 10 : videoCount >= 5 ? 5 : 3} Videos.`
                  : 'Ab 3 Videos geben viele Creator 5–15 % Paket-Rabatt.'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm">
                <label htmlFor="calc-hooks" className="font-semibold text-ink">
                  Zusatz-Hooks pro Video
                </label>
                <span className="font-mono font-bold text-geo-violet">+{extraHooks}</span>
              </div>
              <input
                id="calc-hooks"
                type="range"
                min={0}
                max={5}
                step={1}
                value={extraHooks}
                onChange={(e) => setExtraHooks(Number(e.target.value))}
                className="mt-2 w-full accent-geo-violet"
              />
              <p className="mt-1 text-xs text-ink-soft">
                Empfohlen für Paid Social Testing (+15 % pro extra Einstieg).
              </p>
            </div>
          </div>

          {/* 4. Nutzungsrechte */}
          <div>
            <span className="block text-sm font-semibold text-ink">4. Nutzungsrechte (größter Preishebel)</span>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {USAGE_RIGHTS_OPTIONS.map((u) => {
                const active = u.id === usageRights;
                return (
                  <button
                    key={u.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setUsageRights(u.id)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      active
                        ? 'border-geo-violet bg-[#FBF8FE]'
                        : 'border-hairline bg-white hover:border-ink/30'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-ink">{u.label}</span>
                    <span className="mt-0.5 block text-xs text-ink-soft">{u.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Creator-Erfahrung & Zusatzoptionen */}
          <div className="space-y-4 border-t border-hairline pt-4">
            <div>
              <span className="block text-sm font-semibold text-ink">5. Creator-Erfahrungslevel</span>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {EXPERIENCE_OPTIONS.map((opt) => {
                  const active = opt.id === experience;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setExperience(opt.id)}
                      className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        active
                          ? 'border-geo-violet bg-[#FBF8FE]'
                          : 'border-hairline bg-white hover:border-ink/30'
                      }`}
                    >
                      <span className="block text-sm font-semibold text-ink">{opt.label}</span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-ink-soft">{opt.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-hairline bg-surface px-3.5 py-2.5 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={includeRawFiles}
                  onChange={(e) => setIncludeRawFiles(e.target.checked)}
                  className="h-4 w-4 accent-geo-violet"
                />
                <span>Rohmaterial / Raw Files (+25 %)</span>
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-hairline bg-surface px-3.5 py-2.5 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={includeWhitelisting}
                  onChange={(e) => setIncludeWhitelisting(e.target.checked)}
                  className="h-4 w-4 accent-geo-violet"
                />
                <span>Whitelisting / Spark Ads (+35 %)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Rechte Spalte: Ergebnis & Conversion-Bruecke */}
        <div className="space-y-4">
          <div className="rounded-3xl bg-void p-6 text-white shadow-[0_24px_70px_rgba(20,10,40,0.22)]">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-geo-green">
              Geschätztes Kampagnenbudget (netto)
            </p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight text-white">
              {euro(result.totalMid)}
            </p>
            <p className="mt-1 text-sm text-white/70">
              Realistische Spanne: {euro(result.totalLow)} – {euro(result.totalHigh)} · ca.{' '}
              <strong className="text-white">{euro(result.perVideoMid)} / Video</strong>
            </p>

            <dl className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs">
              <div className="flex justify-between">
                <dt className="text-white/65">Basis-Produktion ({videoCount}×)</dt>
                <dd className="font-mono font-semibold text-white">{euro(result.baseProductionTotal)}</dd>
              </div>
              {result.addonsTotal > 0 && (
                <div className="flex justify-between">
                  <dt className="text-white/65">Zusatz-Hooks &amp; Rohmaterial</dt>
                  <dd className="font-mono font-semibold text-white">+{euro(result.addonsTotal)}</dd>
                </div>
              )}
              {result.rightsTotal > 0 && (
                <div className="flex justify-between">
                  <dt className="text-white/65">Nutzungsrechte &amp; Whitelisting</dt>
                  <dd className="font-mono font-semibold text-white">+{euro(result.rightsTotal)}</dd>
                </div>
              )}
              {result.bundleDiscountEuro > 0 && (
                <div className="flex justify-between text-geo-green">
                  <dt>Üblicher Paket-Rabatt (−{result.bundleDiscountPct} %)</dt>
                  <dd className="font-mono font-semibold">−{euro(result.bundleDiscountEuro)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-white/10 pt-2 text-geo-green">
                <dt className="font-semibold">UGC VZ Plattform-Gebühr</dt>
                <dd className="font-mono font-bold">0 € (0 %)</dd>
              </div>
            </dl>

            <div className="mt-6 space-y-2.5">
              <Link
                href={searchHref}
                onClick={() => trackUGCEvents.ctaClick('calculator_find_creators')}
                className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-geo-green px-5 text-center text-sm font-extrabold text-void transition-transform hover:-translate-y-0.5"
              >
                Passende Creator in diesem Budget finden →
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="min-h-[42px] rounded-full border border-white/20 px-3 text-xs font-semibold text-white hover:border-white/50"
                >
                  Übersicht kopieren
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailForm((prev) => !prev)}
                  className="min-h-[42px] rounded-full border border-white/20 px-3 text-xs font-semibold text-white hover:border-white/50"
                >
                  {showEmailForm ? 'Formular schließen' : 'Budget-Check anfragen'}
                </button>
              </div>
            </div>
          </div>

          {showEmailForm && (
            <div className="rounded-2xl border border-geo-violet/30 bg-white p-5">
              {leadSent ? (
                <p className="text-sm font-semibold text-[#385523]">
                  ✓ Anfrage erhalten! Wir schicken dir deine Übersicht &amp; passende Hinweise per E-Mail.
                </p>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-3">
                  <p className="text-sm font-bold text-ink">Kalkulation sichern &amp; Creator-Shortlist anfragen</p>
                  <p className="text-xs text-ink-soft">
                    Wir senden dir eine Bestätigung und helfen optional beim Briefing oder der Vorauswahl.
                  </p>
                  <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                    <label htmlFor="calc-website">Website</label>
                    <input id="calc-website" type="text" tabIndex={-1} autoComplete="off" value={leadWebsite} onChange={(e) => setLeadWebsite(e.target.value)} />
                  </div>
                  <input
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="Dein Name *"
                    className="w-full rounded-xl border border-hairline px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-geo-violet"
                  />
                  <input
                    type="email"
                    required
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="Geschäftliche E-Mail *"
                    className="w-full rounded-xl border border-hairline px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-geo-violet"
                  />
                  <input
                    type="text"
                    value={leadCompany}
                    onChange={(e) => setLeadCompany(e.target.value)}
                    placeholder="Brand / Unternehmen (optional)"
                    className="w-full rounded-xl border border-hairline px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-geo-violet"
                  />
                  <button
                    type="submit"
                    disabled={leadSending}
                    className="min-h-[44px] w-full rounded-xl bg-geo-violet px-4 text-sm font-semibold text-white hover:bg-[#7531ae] disabled:opacity-50"
                  >
                    {leadSending ? 'Wird gesendet …' : 'Kostenlos anfordern'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Marktplatz-Vergleichsbox */}
          <div className="rounded-2xl border border-hairline bg-white p-5 text-xs leading-5 text-ink-soft">
            <p className="font-semibold text-ink">Einordnung gegenüber anderen Modellen</p>
            <ul className="mt-2.5 space-y-2">
              <li>
                <strong className="text-ink">UGC VZ Direkt (0 % Provision):</strong> 100 % des Budgets geht direkt an die Creator. Kein Abo, direkte Verhandlung.
              </li>
              <li>
                <strong className="text-ink">Abo-Marktplätze (z. B. Influee):</strong> Zusätzlich zum Honorar fallen typischerweise ~{euro(result.comparison.influeeExtraFeesEurApprox)} an (Monatsabo ab $229 + 10 % Marketplace-Fee).
              </li>
              <li>
                <strong className="text-ink">Festpreis-Plattformen (z. B. Speekly ab {euro(result.comparison.speeklyEstimate)}, Noovid ab {euro(result.comparison.noovidEstimate)}):</strong> Günstige Einstiegs-Listenpreise für Standard-Clips, dafür Kommunikation &amp; Rechte nur über die Plattform statt direktem Creator-Pool.
              </li>
              <li>
                <strong className="text-ink">Pay-per-View-Vergleich (z. B. Contentmarkt):</strong> Bei 3,50 € TKP entspräche {euro(result.totalMid)} Budget rund{' '}
                <strong className="text-ink">{result.comparison.tkpEstimatedViewsAt350.toLocaleString('de-DE')} organischen Views</strong> (reine Rechengröße, keine Garantie).
              </li>
            </ul>
            <p className="mt-3 border-t border-hairline pt-3">
              Unsicher bei Rechteumfang oder Kampagnen-Setup?{' '}
              <a
                href={INTRO_CALL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-geo-violet underline hover:no-underline"
              >
                15-Min-Kurzgespräch buchen →
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check } from 'lucide-react';
import {
  QUICK_BRIEF_PLATFORMS,
  saveQuickBriefDraft,
  type QuickBriefModel,
  type QuickBriefPlatform,
} from '@/app/lib/quick-brief';
import {
  calculateCampaignBudgetBreakdown,
  formatEuroFromCents,
} from '@/app/lib/platform-pricing';
import { trackUGCEvents } from '@/app/lib/analytics';

const QUICK_EXAMPLES = [
  'Unsere Cap im Alltag, 20 % Rabatt im Shop',
  'Kurzer Ersteindruck unserer neuen Skincare-Creme',
  'App-Demo im Alltag: 3 Funktionen in 30 Sekunden',
];

export default function QuickBriefCard() {
  const router = useRouter();
  const [model, setModel] = useState<QuickBriefModel>('tkp');
  const [goal, setGoal] = useState('');
  const [platforms, setPlatforms] = useState<QuickBriefPlatform[]>(['tiktok', 'instagram']);
  const [pricePerThousandInput, setPricePerThousandInput] = useState('2,00');
  const [budgetPerVideoInput, setBudgetPerVideoInput] = useState('200');
  const [budgetCapInput, setBudgetCapInput] = useState('500');
  const [affiliateBonus, setAffiliateBonus] = useState(false);
  const [expandedAll, setExpandedAll] = useState(false);
  const [error, setError] = useState('');

  const stepsUnlocked = expandedAll || goal.trim().length > 0;

  const parsedPrice = useMemo(() => {
    const num = Number(pricePerThousandInput.replace(',', '.'));
    return Number.isFinite(num) && num > 0 ? num : 2;
  }, [pricePerThousandInput]);

  const parsedVideoPrice = useMemo(() => {
    const num = Number(budgetPerVideoInput.replace(',', '.'));
    return Number.isFinite(num) && num >= 20 ? num : 200;
  }, [budgetPerVideoInput]);

  const parsedBudget = useMemo(() => {
    const num = Number(budgetCapInput.replace(',', '.'));
    return Number.isFinite(num) && num > 0 ? num : 500;
  }, [budgetCapInput]);

  const calc = useMemo(
    () => calculateCampaignBudgetBreakdown(parsedBudget, parsedPrice),
    [parsedBudget, parsedPrice],
  );
  const feePercent = Math.round(calc.feeRate * 100);

  // Spec 8.2: Rechnung = Budget / Preis x 1.000 (TKP) oder Anzahl Videos im Paket (Fixpreis).
  const headlineViews = Math.max(0, Math.round((parsedBudget / parsedPrice) * 1000));
  const headlineVideos = Math.max(1, Math.floor((calc.creatorPoolCents / 100) / parsedVideoPrice));

  const togglePlatform = (platform: QuickBriefPlatform) => {
    setError('');
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((item) => item !== platform) : [...prev, platform],
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (platforms.length === 0) {
      setError('Bitte wähle mindestens eine Plattform aus.');
      return;
    }
    const rawBudget = Number(budgetCapInput.replace(',', '.'));
    const rawPrice = Number(pricePerThousandInput.replace(',', '.'));
    const rawVideo = Number(budgetPerVideoInput.replace(',', '.'));
    if (!Number.isFinite(rawBudget) || rawBudget < 50) {
      setError('Bitte gib eine Budget-Obergrenze ab 50 € an.');
      return;
    }
    if (model === 'tkp' && (!Number.isFinite(rawPrice) || rawPrice < 0.5)) {
      setError('Bitte gib einen Preis pro 1.000 Views ab 0,50 € an.');
      return;
    }
    if (model === 'fixed' && (!Number.isFinite(rawVideo) || rawVideo < 20)) {
      setError('Bitte gib ein Video-Honorar ab 20 € an.');
      return;
    }

    saveQuickBriefDraft({
      goal: goal.trim() || 'Produkt im Alltag vorstellen',
      platforms,
      compensationModel: model,
      pricePerThousandEur: Number.isFinite(rawPrice) && rawPrice > 0 ? rawPrice : 2,
      budgetPerVideoEur: Number.isFinite(rawVideo) && rawVideo > 0 ? Math.round(rawVideo) : 200,
      budgetCapEur: Math.round(rawBudget),
      affiliateEnabled: affiliateBonus,
      affiliatePercent: 10,
    });

    trackUGCEvents.quickBriefSubmit({
      model,
      affiliate: affiliateBonus,
      budgetEur: Math.round(rawBudget),
    });

    router.push('/brand?tab=signup&from=brief');
  };

  return (
    <section
      id="schnell-brief"
      aria-labelledby="quick-brief-title"
      className="bg-[#F5F7FA] px-5 py-16 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="rounded-[16px] border border-[#DCE2EA] bg-white p-6 shadow-[0_2px_4px_rgba(6,69,143,0.04),0_12px_32px_rgba(6,69,143,0.07)] sm:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[#06458F]">Unverbindlich testen</p>
              <h2
                id="quick-brief-title"
                className="mt-1 font-display text-[30px] font-bold leading-[34px] tracking-[-0.02em] text-[#202124] sm:text-[44px] sm:leading-[48px]"
              >
                Dein Brief in 60 Sekunden
              </h2>
            </div>
            <div className="inline-grid grid-cols-2 rounded-[10px] border border-[#DCE2EA] bg-[#F5F7FA] p-1">
              <button
                type="button"
                onClick={() => {
                  setModel('tkp');
                  setBudgetCapInput('500');
                  setExpandedAll(true);
                  trackUGCEvents.quickBriefMode('tkp');
                }}
                className={`min-h-[38px] rounded-[8px] px-3.5 text-xs font-semibold transition-all sm:text-sm ${
                  model === 'tkp'
                    ? 'bg-[#06458F] text-white shadow-sm'
                    : 'text-[#5C6470] hover:text-[#202124]'
                }`}
              >
                Nach Views (TKP)
              </button>
              <button
                type="button"
                onClick={() => {
                  setModel('fixed');
                  setBudgetCapInput('1000');
                  setExpandedAll(true);
                  trackUGCEvents.quickBriefMode('fixed');
                }}
                className={`min-h-[38px] rounded-[8px] px-3.5 text-xs font-semibold transition-all sm:text-sm ${
                  model === 'fixed'
                    ? 'bg-[#06458F] text-white shadow-sm'
                    : 'text-[#5C6470] hover:text-[#202124]'
                }`}
              >
                Fixpreis pro Video
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            aria-label="Kampagnen-Schnell-Brief erstellen"
            aria-describedby="qb-form-error"
            className="mt-8"
            {...({
              toolname: 'create_quick_campaign_brief',
              tooldescription:
                'Erstellt einen 60-Sekunden-Kampagnen-Brief (Pay-per-View TKP oder Fixpreis pro Video, optional mit 10 % Affiliate-Kickback) und speichert ihn für das Marken-Konto.',
              toolautosubmit: 'false',
            } as Record<string, string>)}
          >
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Schritt 1 */}
              <div className="rounded-[12px] border border-[#DCE2EA] bg-[#F5F7FA]/75 p-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#06458F] font-mono text-xs font-bold text-white">
                    1
                  </span>
                  <label htmlFor="qb-goal" className="text-sm font-semibold text-[#202124]">
                    Was sollen Creator zeigen?
                  </label>
                </div>
                <textarea
                  id="qb-goal"
                  name="goal"
                  rows={3}
                  autoComplete="off"
                  aria-describedby="qb-goal-hint"
                  aria-invalid={Boolean(error)}
                  aria-errormessage={error ? 'qb-form-error' : undefined}
                  value={goal}
                  onChange={(e) => {
                    setGoal(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="z. B. unsere Cap im Alltag, 20 % Rabatt im Shop"
                  className="mt-3 w-full resize-none rounded-[12px] border border-[#DCE2EA] bg-white px-3.5 py-3 text-sm text-[#202124] placeholder-[#5C6470]/70 outline-none transition-colors focus:border-[#06458F] focus:ring-4 focus:ring-[#06458F]/15"
                  {...({
                    toolparamdescription:
                      'Kurzes Kampagnen-Briefing: Produkt, Zielgruppe, Video-Idee und optionaler Rabattcode.',
                  } as Record<string, string>)}
                />
                <p id="qb-goal-hint" className="sr-only">
                  Beschreibe kurz dein Produkt, das gewünschte Format und den Call-to-Action für Creator.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {QUICK_EXAMPLES.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => {
                        setGoal(example);
                        setExpandedAll(true);
                      }}
                      className="rounded-full border border-[#DCE2EA] bg-white px-2.5 py-1 text-[11px] font-medium text-[#5C6470] transition-colors hover:border-[#06458F] hover:text-[#202124]"
                    >
                      {example.length > 34 ? `${example.slice(0, 34)}...` : example}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schritt 2 (immer im DOM fuer SSR & Screenshots, visuell hervorgehoben nach Schritt 1) */}
              <div
                onClick={() => setExpandedAll(true)}
                className={`rounded-[12px] border border-[#DCE2EA] bg-[#F5F7FA]/75 p-5 transition-opacity duration-200 ${
                  stepsUnlocked ? 'opacity-100' : 'opacity-75'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#06458F] font-mono text-xs font-bold text-white">
                    2
                  </span>
                  <p className="text-sm font-semibold text-[#202124]">Wo soll gepostet werden?</p>
                </div>
                <p className="mt-1.5 text-xs text-[#5C6470]">Pflichtfeld: mindestens eine Plattform wählen.</p>
                <div className="mt-3.5 grid grid-cols-2 gap-2" role="group" aria-label="Plattformen wählen">
                  {QUICK_BRIEF_PLATFORMS.map((platform) => {
                    const selected = platforms.includes(platform.id);
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => togglePlatform(platform.id)}
                        className={`btn-press flex min-h-[44px] items-center justify-between gap-2 rounded-[8px] border px-3 text-left text-xs font-semibold transition-colors ${
                          selected
                            ? 'border-[#06458F] bg-[#06458F] text-white'
                            : 'border-[#DCE2EA] bg-white text-[#202124] hover:border-[#06458F]'
                        }`}
                      >
                        <span>{platform.label}</span>
                        {selected && <Check size={14} aria-hidden="true" className="shrink-0 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Schritt 3 */}
              <div
                onClick={() => setExpandedAll(true)}
                className={`rounded-[12px] border border-[#DCE2EA] bg-[#F5F7FA]/75 p-5 transition-opacity duration-200 ${
                  stepsUnlocked ? 'opacity-100' : 'opacity-75'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#06458F] font-mono text-xs font-bold text-white">
                    3
                  </span>
                  <p className="text-sm font-semibold text-[#202124]">Dein Budget</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {model === 'tkp' ? (
                    <div>
                      <label htmlFor="qb-cpm" className="block text-xs font-medium text-[#5C6470]">
                        Preis / 1.000 Views (€)
                      </label>
                      <input
                        id="qb-cpm"
                        name="price_per_1000_views_eur"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        required
                        aria-describedby="qb-budget-hint"
                        aria-invalid={Boolean(error)}
                        aria-errormessage={error ? 'qb-form-error' : undefined}
                        value={pricePerThousandInput}
                        onChange={(e) => {
                          setPricePerThousandInput(e.target.value);
                          setExpandedAll(true);
                        }}
                        className="mt-1.5 min-h-[44px] w-full rounded-[12px] border border-[#DCE2EA] bg-white px-3 text-sm font-semibold tabular-nums text-[#202124] outline-none focus:border-[#06458F] focus:ring-4 focus:ring-[#06458F]/15"
                        {...({
                          toolparamdescription: 'Vergütung pro 1.000 geprüfte Views in Euro (ab 0,50 EUR).',
                        } as Record<string, string>)}
                      />
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="qb-video-fee" className="block text-xs font-medium text-[#5C6470]">
                        Fixpreis / Video (€)
                      </label>
                      <input
                        id="qb-video-fee"
                        name="fixed_price_per_video_eur"
                        type="number"
                        min={20}
                        step={25}
                        autoComplete="off"
                        required
                        aria-describedby="qb-budget-hint"
                        aria-invalid={Boolean(error)}
                        aria-errormessage={error ? 'qb-form-error' : undefined}
                        value={budgetPerVideoInput}
                        onChange={(e) => {
                          setBudgetPerVideoInput(e.target.value);
                          setExpandedAll(true);
                        }}
                        className="mt-1.5 min-h-[44px] w-full rounded-[12px] border border-[#DCE2EA] bg-white px-3 text-sm font-semibold tabular-nums text-[#202124] outline-none focus:border-[#06458F] focus:ring-4 focus:ring-[#06458F]/15"
                        {...({
                          toolparamdescription: 'Festes Honorar pro freigegebenem Video in Euro (ab 20 EUR).',
                        } as Record<string, string>)}
                      />
                    </div>
                  )}
                  <div>
                    <label htmlFor="qb-budget" className="block text-xs font-medium text-[#5C6470]">
                      Budget-Obergrenze (€)
                    </label>
                    <input
                      id="qb-budget"
                      name="budget_cap_eur"
                      type="number"
                      min={50}
                      step={50}
                      autoComplete="off"
                      required
                      aria-describedby="qb-budget-hint"
                      aria-invalid={Boolean(error)}
                      aria-errormessage={error ? 'qb-form-error' : undefined}
                      value={budgetCapInput}
                      onChange={(e) => {
                        setBudgetCapInput(e.target.value);
                        setExpandedAll(true);
                      }}
                      className="mt-1.5 min-h-[44px] w-full rounded-[12px] border border-[#DCE2EA] bg-white px-3 text-sm font-semibold tabular-nums text-[#202124] outline-none focus:border-[#06458F] focus:ring-4 focus:ring-[#06458F]/15"
                      {...({
                        toolparamdescription: 'Verbindliche maximale Budget-Obergrenze in Euro (ab 50 EUR).',
                      } as Record<string, string>)}
                    />
                  </div>
                </div>
                <p id="qb-budget-hint" className="sr-only">
                  Im Kampagnen-Budget sind 15 Prozent Servicegebühr enthalten, Creator zahlen 0 Prozent.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[500, 1000, 2500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setBudgetCapInput(String(preset));
                        setExpandedAll(true);
                      }}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums transition-colors ${
                        Number(budgetCapInput) === preset
                          ? 'border-[#06458F] bg-[#06458F] text-white'
                          : 'border-[#DCE2EA] bg-white text-[#5C6470] hover:border-[#06458F]'
                      }`}
                    >
                      {preset.toLocaleString('de-DE')} €
                    </button>
                  ))}
                </div>
                <label htmlFor="qb-affiliate" className="mt-3 flex cursor-pointer items-center gap-2 text-xs font-medium text-[#5C6470]">
                  <input
                    id="qb-affiliate"
                    name="affiliate_bonus_enabled"
                    type="checkbox"
                    checked={affiliateBonus}
                    onChange={(e) => {
                      setAffiliateBonus(e.target.checked);
                      setExpandedAll(true);
                    }}
                    className="h-3.5 w-3.5 rounded accent-[#06458F]"
                    {...({
                      toolparamdescription: 'Aktiviert zusätzlich 10 % Affiliate-Kickback pro bestätigtem Sale.',
                    } as Record<string, string>)}
                  />
                  <span>Zusätzlich 10 % Affiliate-Kickback pro Sale</span>
                </label>
              </div>
            </div>

            {/* Live-Ergebniszeile in Directory Blue Soft */}
            <div className="mt-6 flex flex-col items-start justify-between gap-5 rounded-[12px] border border-[#DCE2EA] bg-[#F5F7FA] p-5 lg:flex-row lg:items-center">
              <div className="space-y-1.5">
                <p className="text-base font-bold leading-snug text-[#202124] sm:text-xl">
                  <span className="inline-block rounded-[8px] bg-[#EBF2FA] px-2.5 py-1 font-mono tabular-nums text-[#06458F]">
                    {model === 'tkp'
                      ? `Bis zu ${headlineViews.toLocaleString('de-DE')} bezahlte Views.`
                      : `Ca. ${headlineVideos} freigegebene Videos à ${Math.round(parsedVideoPrice)} €.`}
                  </span>{' '}
                  <span>
                    Mehr als {Math.round(parsedBudget).toLocaleString('de-DE')} € zahlst du nicht.
                  </span>
                </p>
                <p className="text-xs text-[#5C6470]">
                  {model === 'tkp' ? 'Rechenbeispiel, keine garantierte Reichweite. ' : 'Budget sicher im Wallet reserviert, Freigabe erst nach Video-Abnahme. '}
                  Im Budget enthalten:{' '}
                  <strong className="font-semibold text-[#202124]">
                    {formatEuroFromCents(calc.creatorPoolCents, { hideZeroDecimals: true })}
                  </strong>{' '}
                  für Creator und{' '}
                  <strong className="font-semibold text-[#202124]">
                    {formatEuroFromCents(calc.feeCents, { hideZeroDecimals: true })}
                  </strong>{' '}
                  Servicegebühr ({feePercent} %{calc.promoActive ? ' Aktionsrate' : ''}, 0 % für Creator{affiliateBonus ? ', plus 10 % Affiliate-Kickback' : ''}).
                </p>
              </div>

              <div className="flex w-full flex-col items-stretch gap-1.5 lg:w-auto lg:items-end">
                <button
                  type="submit"
                  className="btn-press inline-flex min-h-[52px] items-center justify-center gap-2 whitespace-nowrap rounded-[8px] bg-[#06458F] px-6 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(6,69,143,0.22)] hover:-translate-y-[1px] hover:bg-[#053673] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06458F] focus-visible:ring-offset-2"
                >
                  <span>Brief speichern und Konto anlegen</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
                <p className="text-center text-xs text-[#5C6470] lg:text-right">
                  Dauert eine Minute. Wir schicken dir einen 6-stelligen Code, kein Passwort nötig.
                </p>
              </div>
            </div>

            <div
              id="qb-form-error"
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
              className={error ? 'mt-3 text-sm font-medium text-[#D93025]' : 'sr-only'}
            >
              {error}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

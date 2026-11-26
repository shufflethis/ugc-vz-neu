'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, LogOut, Mail, Plus, Search, ShieldAlert } from 'lucide-react';
import type { BrandAccount, CampaignSummary, CampaignVisibility, CompensationModel } from '@/app/lib/brand-workspace';
import {
  detectHighRiskKeywords,
  INDUSTRY_CATEGORIES,
  INDUSTRY_CATEGORY_LIST,
  isHighRiskCategory,
  type IndustryCategory,
} from '@/app/lib/high-risk-compliance';
import { clearQuickBriefDraft, loadQuickBriefDraft } from '@/app/lib/quick-brief';
import OtpInput from '@/app/components/auth/OtpInput';
import ResendTimer from '@/app/components/auth/ResendTimer';
import InlineError from '@/app/components/auth/InlineError';
import BrandWalletPanel from './BrandWalletPanel';

const fieldClass =
  'min-h-[48px] w-full rounded-xl border border-[#DCE2EA] bg-white px-4 py-3 text-sm text-[#202124] outline-none transition-colors focus:border-[#06458F] focus:ring-4 focus:ring-[#06458F]/15';
const labelClass = 'mb-1.5 block text-sm font-medium text-[#202124]';

const MODEL_LABELS: Record<CompensationModel, string> = {
  fixed: 'Fixpreis pro Video',
  tkp: 'Pay-per-View (TKP)',
  hybrid: 'Hybrid (Fix + Views)',
  affiliate: 'Affiliate / Kickback',
  retainer: 'Core-Creator Retainer',
  barter: 'Produkt / Seeding',
};

const STATUS_BADGES: Record<string, string> = {
  active: 'bg-[#edf5e5] text-[#1F9D55]',
  paused: 'bg-amber-50 text-amber-800',
  completed: 'bg-[#F5F7FA] text-[#5C6470]',
  draft: 'bg-[#F5F7FA] text-[#5C6470]',
};

export default function BrandWorkspaceClient({
  brand,
  initialCampaigns,
  initialTab = 'login',
}: {
  brand: BrandAccount | null;
  initialCampaigns: CampaignSummary[];
  initialTab?: 'login' | 'signup';
}) {
  if (!brand) return <BrandLoginView initialTab={initialTab} />;
  return <BrandDashboard brand={brand} initialCampaigns={initialCampaigns} />;
}

function BrandLoginView({ initialTab }: { initialTab: 'login' | 'signup' }) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialTab);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [industryCategory, setIndustryCategory] = useState<IndustryCategory>('standard');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [otpCode, setOtpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [switchedNotice, setSwitchedNotice] = useState(false);
  const [suggestSignup, setSuggestSignup] = useState(false);
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [resendKey, setResendKey] = useState(0);
  const [cooldownSec, setCooldownSec] = useState(60);
  const [hasSavedBrief, setHasSavedBrief] = useState(false);

  useEffect(() => {
    setHasSavedBrief(Boolean(loadQuickBriefDraft()));
  }, []);

  const switchMode = (nextMode: 'login' | 'signup') => {
    setMode(nextMode);
    setError('');
    setSuggestSignup(false);
    setSwitchedNotice(false);
  };

  const requestCode = async (targetMode: 'login' | 'signup') => {
    setError('');
    setSuggestSignup(false);
    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(trimmedEmail)) {
      setError('Bitte gib eine gültige geschäftliche E-Mail-Adresse an.');
      return false;
    }
    if (targetMode === 'signup' && (!name.trim() || !company.trim())) {
      setError('Bitte gib deinen Namen und deine Marke bzw. dein Unternehmen an.');
      return false;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/brand/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: targetMode,
          name: targetMode === 'signup' ? name.trim() : undefined,
          company: targetMode === 'signup' ? company.trim() : undefined,
          industryCategory: targetMode === 'signup' ? industryCategory : undefined,
          email: trimmedEmail,
          website,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.code === 'account_not_found' && data.suggestedMode === 'signup') {
          setSuggestSignup(true);
        }
        if (typeof data.retryAfterSec === 'number' && data.retryAfterSec > 0) {
          setCooldownSec(Math.min(60, data.retryAfterSec));
          setResendKey((k) => k + 1);
        }
        throw new Error(data.error || 'Gerade klappt der Versand bei uns nicht. Versuch es in ein paar Minuten noch mal oder schreib uns an hi@ugc-vz.de.');
      }
      setSwitchedNotice(Boolean(data.switchedToLogin));
      setCooldownSec(typeof data.resendCooldownSec === 'number' ? data.resendCooldownSec : 60);
      setResendKey((k) => k + 1);
      setSent(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await requestCode(mode);
  };

  const submitVerifyCode = async (rawCode: string) => {
    setError('');
    const cleanCode = rawCode.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setError('Bitte gib den 6-stelligen Code aus deiner E-Mail ein.');
      setShakeKey((k) => k + 1);
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch('/api/brand/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: cleanCode, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setShakeKey((k) => k + 1);
        throw new Error(data.error || 'Code ungültig oder abgelaufen.');
      }
      window.location.assign(data.redirectTo || '/brand');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code konnte nicht bestätigt werden.');
      setVerifying(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    await submitVerifyCode(otpCode);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] px-4 pb-24 pt-12 text-[#202124] sm:px-8 sm:pt-16">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <p className="text-sm font-medium text-[#5C6470]">UGC VZ für Marken</p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-[#202124] sm:text-4xl">
            {sent ? 'Code eingeben' : mode === 'login' ? 'Willkommen zurück' : 'Konto anlegen'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#5C6470]">
            Wir schicken dir einen 6-stelligen Code an deine geschäftliche E-Mail. Kein Passwort, kein Abo.
          </p>
        </div>

        <div className="rounded-[20px] border border-[#DCE2EA] bg-white p-6 shadow-[0_1px_2px_rgba(18,18,18,.06),0_8px_24px_rgba(18,18,18,.06)] sm:p-8">
          {hasSavedBrief && (
            <div className="mb-5 rounded-xl border border-[#06458F]/15 bg-[#F5F7FA] px-4 py-3 text-xs leading-5 text-[#202124]">
              <span className="inline-block rounded bg-[#EBF2FA] px-1.5 py-0.5 font-bold">Brief gespeichert</span>{' '}
              Deine Angaben aus dem 60-Sekunden-Brief werden nach der Anmeldung automatisch im Kampagnen-Builder vorausgefüllt.
            </div>
          )}
          {!sent && (
            <div
              role="tablist"
              aria-label="Marken-Zugang"
              className="mb-6 grid grid-cols-2 rounded-xl bg-[#F5F7FA] p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => switchMode('login')}
                className={`min-h-[40px] rounded-lg text-sm font-semibold transition-colors ${
                  mode === 'login' ? 'bg-white text-[#202124] shadow-sm' : 'text-[#5C6470] hover:text-[#202124]'
                }`}
              >
                Anmelden
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                onClick={() => switchMode('signup')}
                className={`min-h-[40px] rounded-lg text-sm font-semibold transition-colors ${
                  mode === 'signup' ? 'bg-white text-[#202124] shadow-sm' : 'text-[#5C6470] hover:text-[#202124]'
                }`}
              >
                Konto anlegen
              </button>
            </div>
          )}

          {sent ? (
            <div className="space-y-5">
              <div className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EBF2FA] text-[#06458F]">
                  <Mail size={22} aria-hidden="true" />
                </span>
                {switchedNotice && (
                  <p className="mt-3 rounded-xl bg-[#EBF2FA] px-3.5 py-2 text-xs font-medium text-[#202124]">
                    Du hast schon ein Konto bei uns. Wir haben dir direkt deinen Anmeldecode geschickt.
                  </p>
                )}
                <p className="mt-3 text-sm leading-6 text-[#5C6470]">
                  Code ist unterwegs an <strong className="text-[#202124]">{email}</strong>. Nichts da? Schau im Spam oder im Gmail-Tab „Benachrichtigungen“.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <span className={`${labelClass} text-center`}>6-stelliger Anmeldecode</span>
                  <OtpInput
                    value={otpCode}
                    onChange={(next) => {
                      setOtpCode(next);
                      if (error) setError('');
                    }}
                    onComplete={(code) => {
                      if (!verifying) void submitVerifyCode(code);
                    }}
                    disabled={verifying}
                    hasError={Boolean(error)}
                    shakeKey={shakeKey}
                    idPrefix="brand-otp"
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#5C6470]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-[#DCE2EA] accent-[#06458F]"
                  />
                  <span>Angemeldet bleiben (30 Tage)</span>
                </label>

                <button
                  type="submit"
                  disabled={verifying}
                  className="min-h-[48px] w-full rounded-xl bg-[#06458F] px-6 text-sm font-semibold text-white hover:bg-[#053673] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {verifying ? 'Code wird geprüft ...' : 'Code bestätigen'}
                </button>

                <InlineError message={error} />
              </form>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#DCE2EA] pt-4 text-xs text-[#5C6470]">
                <ResendTimer
                  initialSeconds={cooldownSec}
                  resetTrigger={resendKey}
                  disabled={submitting || verifying}
                  onResend={async () => {
                    await requestCode(switchedNotice ? 'login' : mode);
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setOtpCode('');
                    setError('');
                    setSwitchedNotice(false);
                  }}
                  className="font-semibold text-[#202124] underline underline-offset-2"
                >
                  E-Mail ändern
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                <label htmlFor="brand-login-website">Website</label>
                <input
                  id="brand-login-website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="brand-email" className={labelClass}>Geschäftliche E-Mail</label>
                <input
                  id="brand-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                    if (suggestSignup) setSuggestSignup(false);
                  }}
                  placeholder="name@deinemarke.de"
                  className={fieldClass}
                />
              </div>

              {mode === 'signup' && (
                <>
                  <div>
                    <label htmlFor="brand-name" className={labelClass}>Dein Name</label>
                    <input
                      id="brand-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Vor- und Nachname"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="brand-company" className={labelClass}>Marke / Unternehmen</label>
                    <input
                      id="brand-company"
                      type="text"
                      required
                      autoComplete="organization"
                      value={company}
                      onChange={(e) => {
                        setCompany(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="z. B. Deine Marke GmbH"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="brand-industry" className={labelClass}>Branche / Geschäftsmodell</label>
                    <select
                      id="brand-industry"
                      value={industryCategory}
                      onChange={(e) => setIndustryCategory(e.target.value as IndustryCategory)}
                      className={fieldClass}
                    >
                      {INDUSTRY_CATEGORY_LIST.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    {(isHighRiskCategory(industryCategory) || detectHighRiskKeywords(company, email).flagged) && (
                      <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-[#F2072A]/30 bg-[#F2072A]/5 p-3 text-xs leading-5 text-[#202124]">
                        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#D10523]" aria-hidden="true" />
                        <div>
                          <p className="font-bold text-[#D10523]">Sonderbranche / High-Risk-Abrechnung</p>
                          <p className="mt-0.5 text-[#5C6470]">
                            {isHighRiskCategory(industryCategory)
                              ? `${INDUSTRY_CATEGORIES[industryCategory].description} Kondition: ${Math.round(INDUSTRY_CATEGORIES[industryCategory].defaultFeeBps / 100)} % Servicegebühr (Creator 0 %). Direkt nach dem Login kannst du einen kurzen Call oder E-Mail-Check starten.`
                              : detectHighRiskKeywords(company, email).summary}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#5C6470]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[#DCE2EA] accent-[#06458F]"
                />
                <span>Angemeldet bleiben (30 Tage)</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="min-h-[48px] w-full rounded-xl bg-[#06458F] px-6 text-sm font-semibold text-white hover:bg-[#053673] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? 'Code wird gesendet ...'
                  : mode === 'login'
                    ? 'Code schicken'
                    : 'Konto anlegen'}
              </button>

              <InlineError
                message={error}
                actionLabel={suggestSignup ? 'Jetzt Konto anlegen' : undefined}
                onAction={suggestSignup ? () => switchMode('signup') : undefined}
              />

              <p className="pt-1 text-center text-sm text-[#5C6470]">
                {mode === 'login' ? (
                  <>
                    Noch kein Konto?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className="font-semibold text-[#202124] underline underline-offset-2"
                    >
                      Konto anlegen
                    </button>
                  </>
                ) : (
                  <>
                    Schon ein Konto?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="font-semibold text-[#202124] underline underline-offset-2"
                    >
                      Anmelden
                    </button>
                  </>
                )}
              </p>
            </form>
          )}
        </div>

        <div className="mt-6 space-y-2 text-center text-xs text-[#5C6470]">
          <p>
            Du bist Creator?{' '}
            <Link href="/konto" className="font-semibold text-[#202124] underline underline-offset-2">
              Zum Creator-Login
            </Link>
            {' · '}
            <Link href="/brands" className="font-semibold text-[#202124] underline underline-offset-2">
              Infos für Marken
            </Link>
          </p>
          <p>
            Klappt gar nicht? Schreib uns an{' '}
            <a href="mailto:hi@ugc-vz.de" className="font-semibold text-[#202124] underline underline-offset-2">
              hi@ugc-vz.de
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function BrandDashboard({
  brand,
  initialCampaigns,
}: {
  brand: BrandAccount;
  initialCampaigns: CampaignSummary[];
}) {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>(initialCampaigns);
  const [showCreate, setShowCreate] = useState(initialCampaigns.length === 0);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [title, setTitle] = useState('');
  const [brandDisplayName, setBrandDisplayName] = useState(brand.companyName || brand.contactName || '');
  const [niche, setNiche] = useState('');
  const [deliverables, setDeliverables] = useState('3× 30s UGC-Videos (9:16) inkl. 2 Hooks');
  const [compensationModel, setCompensationModel] = useState<CompensationModel>('tkp');
  const [budgetPerVideoEur, setBudgetPerVideoEur] = useState('');
  const [tkpEur, setTkpEur] = useState('2.00');
  const [totalBudgetEur, setTotalBudgetEur] = useState('500');
  const [requiresProductChoice, setRequiresProductChoice] = useState(false);
  const [productChoicePrompt, setProductChoicePrompt] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [affiliateEnabled, setAffiliateEnabled] = useState(false);
  const [affiliateType, setAffiliateType] = useState<'percent' | 'fixed_per_sale'>('percent');
  const [affiliateRatePercent, setAffiliateRatePercent] = useState('10');
  const [affiliateFixedEur, setAffiliateFixedEur] = useState('15');
  const [affiliateTargetUrl, setAffiliateTargetUrl] = useState('');
  const [retainerMonthlyEur, setRetainerMonthlyEur] = useState('1000');
  const [retainerVideosPerMonth, setRetainerVideosPerMonth] = useState('4');
  const [retainerMinMonths, setRetainerMinMonths] = useState('3');
  const [retainerPerks, setRetainerPerks] = useState('Monatlicher Store-Credit + 20 % Community-Rabattcode');
  const [requiredMention, setRequiredMention] = useState('');
  const [requiredHashtags, setRequiredHashtags] = useState('');
  const [checklistText, setChecklistText] = useState(
    'Produkt oder Shop-Aktion klar im Bild\nAktion / Rabatt-Hinweis oder CTA genannt\nWerbekennzeichnung (Werbung / Anzeige) sichtbar',
  );
  const [usageRights, setUsageRights] = useState('Organische Nutzung + 6 Monate Repost-Rechte');
  const [deadline, setDeadline] = useState('Laufzeit 14 Tage oder bis Budget-Limit erreicht');
  const [visibility, setVisibility] = useState<CampaignVisibility>('open');
  const [platforms, setPlatforms] = useState<string[]>(['tiktok', 'instagram', 'youtube']);
  const [description, setDescription] = useState('');
  const [loadedFromQuickBrief, setLoadedFromQuickBrief] = useState(false);

  // Uebernimmt gespeicherten 60-Sekunden-Brief aus localStorage automatisch in den Builder (Spec 8.2 home.brief).
  useEffect(() => {
    const draft = loadQuickBriefDraft();
    if (!draft) return;
    setShowCreate(true);
    const nextModel = draft.compensationModel === 'fixed' ? 'fixed' : 'tkp';
    setCompensationModel(nextModel);
    setTitle((prev) => prev || draft.goal.slice(0, 90));
    setDescription((prev) => prev || draft.goal);
    setPlatforms(draft.platforms);
    if (nextModel === 'fixed') {
      setBudgetPerVideoEur(String(draft.budgetPerVideoEur || 200));
      setTkpEur('');
    } else {
      setTkpEur(draft.pricePerThousandEur.toFixed(2));
    }
    setTotalBudgetEur(String(draft.budgetCapEur));
    if (draft.affiliateEnabled) {
      setAffiliateEnabled(true);
      setAffiliateRatePercent(String(draft.affiliatePercent || 10));
    }
    setLoadedFromQuickBrief(true);
  }, []);

  const applyPreset = (preset: 'tkp_cap' | 'fixed_ugc' | 'fixed_affiliate' | 'retainer_core' | 'affiliate_only') => {
    if (preset === 'tkp_cap') {
      setCompensationModel('tkp');
      setTkpEur('2.00');
      setBudgetPerVideoEur('');
      setTotalBudgetEur('500');
      setAffiliateEnabled(false);
      setDeliverables('1 bis 3 authentische Short-Videos (TikTok / Reels / Shorts) inkl. Aktions-Hinweis');
      setUsageRights('Organische Creator-Posts + Repost-Rechte');
      setDeadline('Aktionszeitraum oder bis Budget-Obergrenze erreicht');
      setPlatforms(['tiktok', 'instagram', 'youtube']);
      setRequiresProductChoice(false);
      setProductChoicePrompt('');
      setDiscountCode('z. B. 20 % Aktionsrabatt im Shop (kein Produktversand nötig)');
    } else if (preset === 'fixed_ugc') {
      setCompensationModel('fixed');
      setTkpEur('');
      setBudgetPerVideoEur('250');
      setTotalBudgetEur('1000');
      setAffiliateEnabled(false);
      setDeliverables('4x 30s UGC-Produktvideos (9:16) inkl. 2 Hooks');
      setUsageRights('12 Monate Paid Ads (Meta & TikTok) + Organisch');
      setDeadline('Erste Clips innerhalb von 14 Tagen');
      setPlatforms(['tiktok', 'instagram', 'meta_ads']);
      setRequiresProductChoice(false);
      setProductChoicePrompt('');
      setDiscountCode('');
    } else if (preset === 'fixed_affiliate') {
      setCompensationModel('fixed');
      setTkpEur('');
      setBudgetPerVideoEur('150');
      setTotalBudgetEur('900');
      setAffiliateEnabled(true);
      setAffiliateType('percent');
      setAffiliateRatePercent('10');
      setDeliverables('1 UGC-Video + persönlicher Rabattcode & Tracking-Link');
      setUsageRights('Organische Posts + 6 Monate Repost & Paid Ads');
      setDeadline('Erste Clips innerhalb von 14 Tagen');
      setPlatforms(['tiktok', 'instagram', 'tiktok_shop']);
      setRequiresProductChoice(true);
      setProductChoicePrompt('Welches Produkt / welche Variante möchtest du testen?');
      setDiscountCode('10 % Community-Rabatt + 10 % Creator-Kickback');
    } else if (preset === 'retainer_core') {
      setCompensationModel('retainer');
      setTkpEur('');
      setBudgetPerVideoEur('250');
      setRetainerMonthlyEur('1000');
      setRetainerVideosPerMonth('4');
      setRetainerMinMonths('3');
      setRetainerPerks('Monatlicher Store-Credit + 20 % Community-Code + direktes Portal-Onboarding');
      setTotalBudgetEur('3000');
      setAffiliateEnabled(true);
      setAffiliateType('percent');
      setAffiliateRatePercent('20');
      setDeliverables('Core-Creator Partnerschaft: 4 Videos / Monat + 20 % laufende Provision');
      setUsageRights('Organisch & Paid Ads für die Vertragslaufzeit');
      setDeadline('Start flexibel · monatliche Freigabe im Portal');
      setPlatforms(['tiktok', 'instagram', 'meta_ads']);
      setRequiresProductChoice(true);
      setProductChoicePrompt('Welche Produkte / Varianten passen am besten zu deinem Profil?');
      setDiscountCode('20 % Community-Code + bis zu 20 % Affiliate-Provision');
    } else {
      setCompensationModel('affiliate');
      setTkpEur('');
      setBudgetPerVideoEur('');
      setTotalBudgetEur('1000');
      setAffiliateEnabled(true);
      setAffiliateType('percent');
      setAffiliateRatePercent('15');
      setDeliverables('Authentische Empfehlung mit individuellem Creator-Code & Tracking-Link');
      setUsageRights('Organische Posts + Repost-Rechte');
      setDeadline('Laufend · Abrechnung pro bestätigtem Sale');
      setPlatforms(['tiktok', 'instagram', 'youtube']);
      setRequiresProductChoice(false);
      setProductChoicePrompt('');
      setDiscountCode('Persönlicher Creator-Code (automatisch im Portal erzeugt)');
    }
  };

  const tkpNumeric = Number(String(tkpEur).replace(',', '.'));
  const totalBudgetNumeric = Number(totalBudgetEur);
  const estimatedCapViews =
    (compensationModel === 'tkp' || compensationModel === 'hybrid') && tkpNumeric > 0 && totalBudgetNumeric > 0
      ? Math.floor((totalBudgetNumeric / tkpNumeric) * 1000)
      : null;

  const totals = campaigns.reduce(
    (acc, c) => ({
      active: acc.active + (c.status === 'active' ? 1 : 0),
      selected: acc.selected + c.counts.selected,
      submissions: acc.submissions + c.counts.submissions,
      views: acc.views + c.metrics.totalViews,
    }),
    { active: 0, selected: 0, submissions: 0, views: 0 },
  );

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]));
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!title.trim()) {
      setCreateError('Bitte gib einen Kampagnentitel an.');
      return;
    }
    if (!platforms.length) {
      setCreateError('Bitte wähle mindestens eine Plattform aus.');
      return;
    }
    if (compensationModel === 'tkp' && (!totalBudgetNumeric || totalBudgetNumeric <= 0)) {
      setCreateError('Für jede View-Kampagne ist eine feste Budget-Obergrenze in Euro Pflicht.');
      return;
    }
    setCreating(true);
    try {
      const tkpCents =
        (compensationModel === 'tkp' || compensationModel === 'hybrid') && tkpNumeric > 0
          ? Math.round(tkpNumeric * 100)
          : null;
      const res = await fetch('/api/brand/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          brandDisplayName,
          niche,
          deliverables,
          compensationModel,
          budgetPerVideoEur: budgetPerVideoEur ? Number(budgetPerVideoEur) : null,
          totalBudgetEur: totalBudgetEur ? Number(totalBudgetEur) : null,
          tkpEurCents: tkpCents,
          affiliateEnabled: compensationModel === 'affiliate' || affiliateEnabled,
          affiliateType,
          affiliateRateBps:
            (compensationModel === 'affiliate' || affiliateEnabled) && affiliateType === 'percent'
              ? Math.round((Number(affiliateRatePercent.replace(',', '.')) || 10) * 100)
              : null,
          affiliateFixedCents:
            (compensationModel === 'affiliate' || affiliateEnabled) && affiliateType === 'fixed_per_sale'
              ? Math.round((Number(affiliateFixedEur.replace(',', '.')) || 15) * 100)
              : null,
          affiliateTargetUrl: affiliateTargetUrl.trim(),
          retainerMonthlyEur: compensationModel === 'retainer' && retainerMonthlyEur ? Number(retainerMonthlyEur) : null,
          retainerVideosPerMonth: compensationModel === 'retainer' && retainerVideosPerMonth ? Number(retainerVideosPerMonth) : null,
          retainerMinMonths: compensationModel === 'retainer' && retainerMinMonths ? Number(retainerMinMonths) : null,
          retainerPerks: compensationModel === 'retainer' ? retainerPerks.trim() : '',
          requiresProductChoice,
          productChoicePrompt,
          discountCode,
          briefingChecklist: checklistText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
          requiredMention,
          requiredHashtags,
          usageRights,
          deadline,
          visibility,
          platforms,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Kampagne konnte nicht angelegt werden.');
      clearQuickBriefDraft();
      window.location.href = `/brand/kampagnen/${data.campaign.publicId}`;
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Fehler beim Anlegen.');
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/brand/logout', { method: 'POST' });
    window.location.href = '/brand';
  };

  const refresh = async () => {
    const res = await fetch('/api/brand/campaigns');
    const data = await res.json();
    if (res.ok && data.success) setCampaigns(data.campaigns);
  };

  return (
    <div className="min-h-screen bg-white px-4 pb-24 pt-10 text-ink sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Kopf */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-6">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-geo-violet">Brand-Workspace</p>
            <h1 className="mt-1 text-3xl font-bold text-ink sm:text-4xl">
              {brand.companyName || brand.contactName || 'Dein Kampagnen-Cockpit'}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">{brand.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/brands"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-hairline px-4 text-sm font-semibold text-ink hover:border-geo-violet"
            >
              <Search size={15} /> Creator suchen
            </Link>
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-geo-violet px-4 text-sm font-semibold text-white hover:bg-[#053673]"
            >
              <Plus size={16} /> {showCreate ? 'Formular schließen' : 'Neue Kampagne'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-hairline px-3.5 text-sm font-semibold text-ink-soft hover:bg-surface"
            >
              <LogOut size={15} /> Abmelden
            </button>
          </div>
        </div>

        {/* KPI-Zeile */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Aktive Kampagnen', String(totals.active), 'Offen oder per Einladung'],
            ['Ausgewählte Creator', String(totals.selected), 'Im aktiven Produktionsfluss'],
            ['Eingereichte Clips', String(totals.submissions), 'TikTok, IG Reels & Shorts'],
            ['Getrackte Views', totals.views.toLocaleString('de-DE'), 'Über alle Kampagnen'],
          ].map(([label, val, sub]) => (
            <div key={label} className="rounded-2xl border border-hairline bg-surface p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
              <p className="mt-2 text-3xl font-extrabold text-ink">{val}</p>
              <p className="mt-1 text-xs text-ink-soft">{sub}</p>
            </div>
          ))}
        </div>

        {/* Kampagnen-Wallet, Aufladen (SEPA / DE-IBAN / Karte +3 %) & Rechnungen */}
        <BrandWalletPanel />

        {/* Neue Kampagne anlegen */}
        {showCreate && (
          <form onSubmit={handleCreate} className="space-y-5 rounded-[20px] border border-[#DCE2EA] bg-[#F5F7FA] p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-[#202124]">Neue UGC-Kampagne anlegen</h2>
                <p className="text-sm text-[#5C6470]">Pay-per-View (TKP), Fixpreis pro Video (Escrow) oder Affiliate-Kickback — komplett im Portal.</p>
              </div>
              <button type="button" onClick={refresh} className="text-xs font-semibold text-[#06458F] underline">
                Ansicht aktualisieren
              </button>
            </div>

            {loadedFromQuickBrief && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#06458F]/15 bg-white px-4 py-3 text-xs text-[#202124]">
                <p>
                  <span className="mr-2 inline-block rounded bg-[#EBF2FA] px-2 py-0.5 font-bold text-[#06458F]">Übernommen</span>
                  Dein 60-Sekunden-Brief wurde vorausgefüllt. Prüfe die Felder und starte deine Kampagne.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    clearQuickBriefDraft();
                    setLoadedFromQuickBrief(false);
                  }}
                  className="font-semibold text-[#5C6470] underline hover:text-[#202124]"
                >
                  Hinweis schließen
                </button>
              </div>
            )}

            {/* 1-Klick Kampagnen-Vorlagen */}
            <div className="space-y-2">
              <span className={labelClass}>1-Klick-Vorlage wählen (optional)</span>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  {
                    id: 'tkp_cap' as const,
                    name: 'Pay-per-View (TKP)',
                    sub: 'z. B. 2 €/1.000 Views · festes Limit',
                  },
                  {
                    id: 'fixed_ugc' as const,
                    name: 'Pay-per-Video (Fixpreis)',
                    sub: 'z. B. 250 €/Video · Budget-Sicherung',
                  },
                  {
                    id: 'retainer_core' as const,
                    name: 'Core-Creator Retainer',
                    sub: 'z. B. 1.000 €/Monat + 20 % Provision',
                  },
                  {
                    id: 'fixed_affiliate' as const,
                    name: 'Fixpreis + Affiliate',
                    sub: 'z. B. 150 €/Video + 10 % Kickback',
                  },
                  {
                    id: 'affiliate_only' as const,
                    name: 'Affiliate / Kickback',
                    sub: 'z. B. 15 % Provision via Creator-Link',
                  },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.id)}
                    className="rounded-[12px] border border-[#DCE2EA] bg-white p-3.5 text-left transition hover:border-[#06458F] hover:shadow-sm"
                  >
                    <p className="text-xs font-bold text-[#06458F]">{preset.name}</p>
                    <p className="mt-1 text-xs text-[#5C6470]">{preset.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="camp-title" className={labelClass}>Kampagnentitel *</label>
                <input id="camp-title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Aktions-Kampagne Short-Videos (DE)" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="camp-brand" className={labelClass}>Anzeigename der Brand</label>
                <input id="camp-brand" value={brandDisplayName} onChange={(e) => setBrandDisplayName(e.target.value)} placeholder="z. B. GlowSkin" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="camp-niche" className={labelClass}>Branche / Nische</label>
                <input id="camp-niche" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="z. B. Streetwear, Beauty, Food, Tech" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="camp-deliverables" className={labelClass}>Deliverables</label>
                <input id="camp-deliverables" value={deliverables} onChange={(e) => setDeliverables(e.target.value)} className={fieldClass} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="camp-model" className={labelClass}>Vergütungsmodell</label>
                <select
                  id="camp-model"
                  value={compensationModel}
                  onChange={(e) => {
                    const next = e.target.value as CompensationModel;
                    setCompensationModel(next);
                    if (next === 'affiliate' || next === 'retainer') setAffiliateEnabled(true);
                  }}
                  className={fieldClass}
                >
                  <option value="tkp">Pay-per-View (TKP)</option>
                  <option value="fixed">Pay-per-Video (Fixpreis · Budget-Sicherung)</option>
                  <option value="retainer">Core-Creator Retainer (Monats-Fixum + %)</option>
                  <option value="hybrid">Hybrid (Fixpreis + TKP-Bonus)</option>
                  <option value="affiliate">Affiliate / Kickback (% oder € / Sale)</option>
                  <option value="barter">Produkt / Seeding</option>
                </select>
              </div>
              {compensationModel === 'tkp' ? (
                <div>
                  <label htmlFor="camp-tkp" className={labelClass}>TKP (€ / 1.000 Views)</label>
                  <input id="camp-tkp" type="number" min={0} step="0.10" value={tkpEur} onChange={(e) => setTkpEur(e.target.value)} placeholder="2.00" className={fieldClass} />
                </div>
              ) : compensationModel === 'retainer' ? (
                <div>
                  <label htmlFor="camp-retainer-monthly" className={labelClass}>Monats-Fixum (€ / Monat)</label>
                  <input
                    id="camp-retainer-monthly"
                    type="number"
                    min={0}
                    value={retainerMonthlyEur}
                    onChange={(e) => setRetainerMonthlyEur(e.target.value)}
                    placeholder="z. B. 1000"
                    className={fieldClass}
                  />
                </div>
              ) : compensationModel === 'affiliate' ? (
                <div>
                  <label htmlFor="camp-aff-quick" className={labelClass}>
                    {affiliateType === 'fixed_per_sale' ? 'Kickback / Sale (€)' : 'Kickback-Provision (%)'}
                  </label>
                  <input
                    id="camp-aff-quick"
                    type="number"
                    min={1}
                    max={affiliateType === 'fixed_per_sale' ? 5000 : 80}
                    value={affiliateType === 'fixed_per_sale' ? affiliateFixedEur : affiliateRatePercent}
                    onChange={(e) =>
                      affiliateType === 'fixed_per_sale'
                        ? setAffiliateFixedEur(e.target.value)
                        : setAffiliateRatePercent(e.target.value)
                    }
                    className={fieldClass}
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="camp-per-video" className={labelClass}>Fixpreis / Video (€)</label>
                  <input id="camp-per-video" type="number" min={0} value={budgetPerVideoEur} onChange={(e) => setBudgetPerVideoEur(e.target.value)} placeholder="250" className={fieldClass} />
                </div>
              )}
              <div>
                <label htmlFor="camp-total" className={labelClass}>
                  {compensationModel === 'tkp' ? 'Budget-Obergrenze (€) *' : 'Budget-Obergrenze (€)'}
                </label>
                <input
                  id="camp-total"
                  type="number"
                  min={compensationModel === 'tkp' ? 1 : 0}
                  required={compensationModel === 'tkp'}
                  value={totalBudgetEur}
                  onChange={(e) => setTotalBudgetEur(e.target.value)}
                  placeholder="z. B. 500"
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="camp-visibility" className={labelClass}>Sichtbarkeit</label>
                <select id="camp-visibility" value={visibility} onChange={(e) => setVisibility(e.target.value as CampaignVisibility)} className={fieldClass}>
                  <option value="open">Offen ausschreiben (750+ Creator)</option>
                  <option value="invite_only">Nur per Direkteinladung</option>
                </select>
              </div>
            </div>

            {compensationModel === 'retainer' && (
              <div className="space-y-3 rounded-[14px] border border-[#06458F]/25 bg-white p-4">
                <div>
                  <p className="text-sm font-bold text-[#06458F]">Core-Creator Retainer-Details (langfristige Partnerschaft)</p>
                  <p className="text-xs text-[#5C6470]">
                    Ideal für feste Brand-Gesichter: monatliches Fixum + wiederkehrende Videos + Affiliate-Provision &amp; Perks — komplett im Portal mit direktem Chat.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label htmlFor="camp-retainer-videos" className={labelClass}>Videos pro Monat</label>
                    <input
                      id="camp-retainer-videos"
                      type="number"
                      min={1}
                      max={200}
                      value={retainerVideosPerMonth}
                      onChange={(e) => setRetainerVideosPerMonth(e.target.value)}
                      placeholder="z. B. 4 oder 30"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="camp-retainer-months" className={labelClass}>Mindestlaufzeit (Monate)</label>
                    <input
                      id="camp-retainer-months"
                      type="number"
                      min={1}
                      max={36}
                      value={retainerMinMonths}
                      onChange={(e) => setRetainerMinMonths(e.target.value)}
                      placeholder="z. B. 3"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="camp-retainer-perks" className={labelClass}>Zusatz-Perks (optional)</label>
                    <input
                      id="camp-retainer-perks"
                      value={retainerPerks}
                      onChange={(e) => setRetainerPerks(e.target.value)}
                      placeholder="z. B. Store-Credit, 20 % Code, Discord"
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>
            )}

            {detectHighRiskKeywords(title, brandDisplayName, niche, description, retainerPerks).flagged && (
              <div className="flex items-start gap-2.5 rounded-[14px] border border-[#F2072A]/35 bg-[#F2072A]/5 p-4 text-xs leading-5 text-[#202124]">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#D10523]" aria-hidden="true" />
                <div>
                  <p className="font-bold text-[#D10523]">Hinweis: Sonderbranche / Stripe-Restricted erkannt</p>
                  <p className="mt-0.5 text-[#5C6470]">
                    {detectHighRiskKeywords(title, brandDisplayName, niche, description, retainerPerks).summary}
                  </p>
                </div>
              </div>
            )}

            {estimatedCapViews !== null && (
              <div className="rounded-2xl border border-[#1F9D55]/30 bg-[#f6fbf1] px-4 py-3 text-xs leading-5 text-[#202124]">
                <strong>Budget-Rechnung:</strong> Bei <strong>{tkpNumeric.toFixed(2).replace('.', ',')} € pro 1.000 Views</strong> und einer festen Budget-Obergrenze von <strong>{totalBudgetNumeric.toLocaleString('de-DE')} €</strong> zahlst du nie mehr als dein Budget. Rechenbeispiel, keine garantierte Reichweite.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="camp-rights" className={labelClass}>Nutzungsrechte</label>
                <input id="camp-rights" value={usageRights} onChange={(e) => setUsageRights(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="camp-deadline" className={labelClass}>Zeitplan / Frist</label>
                <input id="camp-deadline" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="camp-discount" className={labelClass}>Aktions- / Rabatt-Hinweis (optional)</label>
                <input id="camp-discount" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} placeholder="z. B. 20 % Shop-Rabatt / Aktionscode" className={fieldClass} />
              </div>
            </div>

            {/* Affiliate / Kickback Layer (eigenstaendig oder als Bonus auf TKP / Fixpreis) */}
            <div className="space-y-3 rounded-[14px] border border-[#DCE2EA] bg-white p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={compensationModel === 'affiliate' || affiliateEnabled}
                  disabled={compensationModel === 'affiliate'}
                  onChange={(e) => setAffiliateEnabled(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#06458F]"
                />
                <span className="text-sm text-[#202124]">
                  <strong>Affiliate / Kickback aktivieren (eigener Creator-Code &amp; Tracking-Link)</strong>
                  <span className="block text-xs text-[#5C6470]">
                    Jeder ausgewählte Creator bekommt automatisch seinen eigenen Code und Link (ugc-vz.de/r/CODE). Bestätigte Sales werden über dein Wallet ausgezahlt (0 % Gebühr für Creator).
                  </span>
                </span>
              </label>
              {(compensationModel === 'affiliate' || affiliateEnabled) && (
                <div className="grid gap-3 pt-1 sm:grid-cols-3">
                  <div>
                    <label htmlFor="camp-aff-type" className={labelClass}>Kickback-Art</label>
                    <select
                      id="camp-aff-type"
                      value={affiliateType}
                      onChange={(e) => setAffiliateType(e.target.value as 'percent' | 'fixed_per_sale')}
                      className={fieldClass}
                    >
                      <option value="percent">Prozent vom Bestellwert (%)</option>
                      <option value="fixed_per_sale">Fixbetrag pro Sale (€)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="camp-aff-val" className={labelClass}>
                      {affiliateType === 'percent' ? 'Provision (%)' : 'Kickback pro Sale (€)'}
                    </label>
                    <input
                      id="camp-aff-val"
                      type="number"
                      min={1}
                      max={affiliateType === 'percent' ? 80 : 5000}
                      value={affiliateType === 'percent' ? affiliateRatePercent : affiliateFixedEur}
                      onChange={(e) =>
                        affiliateType === 'percent'
                          ? setAffiliateRatePercent(e.target.value)
                          : setAffiliateFixedEur(e.target.value)
                      }
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="camp-aff-url" className={labelClass}>Shop-Ziel-URL für Tracking-Links</label>
                    <input
                      id="camp-aff-url"
                      type="url"
                      value={affiliateTargetUrl}
                      onChange={(e) => setAffiliateTargetUrl(e.target.value)}
                      placeholder="https://deinshop.de/produkt"
                      className={fieldClass}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-hairline bg-white p-4 space-y-3">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={requiresProductChoice}
                  onChange={(e) => setRequiresProductChoice(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-geo-violet"
                />
                <span className="text-sm text-ink">
                  <strong>Produkt-/Varianten-Auswahl bei Bewerbung abfragen</strong>
                  <span className="block text-xs text-ink-soft">Ideal für Musterversand: Creator geben direkt bei der Bewerbung ihr Wunschprodukt, Größe oder Shop-Link an.</span>
                </span>
              </label>
              {requiresProductChoice && (
                <div>
                  <label htmlFor="camp-product-prompt" className={labelClass}>Frage an Creator</label>
                  <input
                    id="camp-product-prompt"
                    value={productChoicePrompt}
                    onChange={(e) => setProductChoicePrompt(e.target.value)}
                    placeholder="z. B. Welches Produkt / welche Variante aus dem Shop möchtest du erhalten?"
                    className={fieldClass}
                  />
                </div>
              )}
            </div>

            <div>
              <span className={labelClass}>Auf welcher Plattform soll gepostet werden? (Pflichtangabe) *</span>
              <div className="flex flex-wrap gap-2">
                {[
                  ['tiktok', 'TikTok'],
                  ['instagram', 'Instagram Reels'],
                  ['youtube', 'YouTube Shorts'],
                  ['tiktok_shop', 'TikTok Shop'],
                  ['files_only', 'Nur Videodateien (kein Posting)'],
                  ['meta_ads', 'Meta Paid Ads'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={platforms.includes(id)}
                    onClick={() => togglePlatform(id)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
                      platforms.includes(id) ? 'border-geo-violet bg-geo-violet text-white' : 'border-hairline bg-white text-ink'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-ink-soft">Hinweis: Bei öffentlichen Creator-Postings muss der Beitrag gut sichtbar als „Werbung“ oder „Anzeige“ gekennzeichnet werden.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="camp-mention" className={labelClass}>Pflicht-Erwähnung / Tag (optional)</label>
                <input id="camp-mention" value={requiredMention} onChange={(e) => setRequiredMention(e.target.value)} placeholder="z. B. @deinemarke" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="camp-hashtags" className={labelClass}>Pflicht-Hashtags (optional)</label>
                <input id="camp-hashtags" value={requiredHashtags} onChange={(e) => setRequiredHashtags(e.target.value)} placeholder="z. B. #werbung #deinemarke" className={fieldClass} />
              </div>
            </div>

            <div>
              <label htmlFor="camp-checklist" className={labelClass}>Pflicht-Checkliste für die Beitragsprüfung (1 Punkt pro Zeile)</label>
              <textarea
                id="camp-checklist"
                rows={3}
                value={checklistText}
                onChange={(e) => setChecklistText(e.target.value)}
                placeholder={'Produkt klar sichtbar\nRabattcode oder CTA genannt\nWerbung sichtbar markiert'}
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="camp-desc" className={labelClass}>Briefing &amp; Produktdetails</label>
              <textarea id="camp-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Produkt-USP, Zielgruppe, gewünschte Hooks, Do's & Don'ts …" className={fieldClass} />
            </div>

            {createError && <p role="alert" className="text-sm text-red-700">{createError}</p>}

            <button
              type="submit"
              disabled={creating}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-geo-violet px-6 text-sm font-bold text-white hover:bg-[#053673] disabled:opacity-60"
            >
              <CheckCircle2 size={16} /> {creating ? 'Wird angelegt …' : 'Kampagne live anlegen →'}
            </button>
          </form>
        )}

        {/* Kampagnen-Liste */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-ink">Deine Kampagnen ({campaigns.length})</h2>
          {campaigns.length === 0 ? (
            <div className="rounded-3xl border border-hairline bg-surface p-10 text-center">
              <p className="text-base font-semibold text-ink">Noch keine Kampagne angelegt.</p>
              <p className="mt-2 text-sm text-ink-soft">Erstelle oben deine erste Ausschreibung oder wähle direkt passende Creator in der Suche aus.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {campaigns.map((camp) => (
                <Link
                  key={camp.id}
                  href={`/brand/kampagnen/${camp.publicId}`}
                  className="block rounded-3xl border border-hairline bg-white p-6 transition hover:border-geo-violet hover:shadow-[0_16px_45px_rgba(35,22,47,0.08)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="font-mono text-ink-soft">{camp.publicId}</span>
                        <span className={`rounded-full px-2.5 py-0.5 ${STATUS_BADGES[camp.status] || 'bg-surface text-ink-soft'}`}>
                          {camp.status === 'active' ? 'Aktiv' : camp.status === 'paused' ? 'Pausiert' : camp.status === 'completed' ? 'Abgeschlossen' : 'Entwurf'}
                        </span>
                        <span className="rounded-full bg-geo-violet/10 px-2.5 py-0.5 text-geo-violet">
                          {camp.visibility === 'open' ? 'Offen ausgeschrieben' : 'Nur Einladung'}
                        </span>
                        <span className="rounded-full border border-hairline px-2.5 py-0.5 text-ink-soft">
                          {MODEL_LABELS[camp.compensationModel]}
                        </span>
                      </div>
                      <h3 className="mt-2 text-xl font-bold text-ink">{camp.title}</h3>
                      <p className="mt-1 text-sm text-ink-soft">
                        {[
                          camp.deliverables,
                          camp.tkpEurCents ? `${(camp.tkpEurCents / 100).toFixed(2).replace('.', ',')} € / 1.000 Views` : '',
                          camp.totalBudgetEur ? `Budget-Limit ${camp.totalBudgetEur.toLocaleString('de-DE')} €` : '',
                          camp.deadline,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <span className="rounded-full bg-surface px-4 py-2 text-xs font-bold text-geo-violet">
                      Öffnen &amp; Reporting →
                    </span>
                  </div>

                  {camp.totalBudgetEur && camp.totalBudgetEur > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-ink-soft">
                          Budget-Limit: <strong className="text-ink">{camp.metrics.accruedPayoutEur.toLocaleString('de-DE')} €</strong> von {camp.totalBudgetEur.toLocaleString('de-DE')} €
                        </span>
                        <span className={`font-bold ${camp.metrics.capReached ? 'text-red-700' : 'text-[#385523]'}`}>
                          {camp.metrics.capReached
                            ? 'Budget-Limit erreicht'
                            : `Noch ${(camp.metrics.remainingBudgetEur ?? 0).toLocaleString('de-DE')} € frei`}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface">
                        <div
                          className={`h-full rounded-full transition-all ${camp.metrics.capReached ? 'bg-red-500' : 'bg-geo-violet'}`}
                          style={{ width: `${Math.min(100, Math.round((camp.metrics.accruedPayoutEur / camp.totalBudgetEur) * 100))}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-hairline pt-4 text-xs sm:grid-cols-5">
                    <div>
                      <span className="text-ink-soft">Eingeladen</span>
                      <p className="mt-0.5 text-base font-bold text-ink">{camp.counts.invited}</p>
                    </div>
                    <div>
                      <span className="text-ink-soft">Bewerbungen</span>
                      <p className="mt-0.5 text-base font-bold text-ink">{camp.counts.applied}</p>
                    </div>
                    <div>
                      <span className="text-ink-soft">Ausgewählt</span>
                      <p className="mt-0.5 text-base font-bold text-[#385523]">{camp.counts.selected}</p>
                    </div>
                    <div>
                      <span className="text-ink-soft">Clips (Freigegeben)</span>
                      <p className="mt-0.5 text-base font-bold text-ink">{camp.counts.submissions} ({camp.counts.approvedSubmissions})</p>
                    </div>
                    <div>
                      <span className="text-ink-soft">Views</span>
                      <p className="mt-0.5 text-base font-bold text-geo-violet">{camp.metrics.totalViews.toLocaleString('de-DE')}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

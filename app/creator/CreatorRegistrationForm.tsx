'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Mail } from 'lucide-react';
import { trackUGCEvents } from '../lib/analytics';
import { CREATOR_TAXONOMY } from '../lib/creator-taxonomy';
import OtpInput from '../components/auth/OtpInput';
import ResendTimer from '../components/auth/ResendTimer';
import InlineError from '../components/auth/InlineError';

type SocialPlatformChoice = 'tiktok' | 'instagram';

type CreatorFormState = {
  email: string;
  socialPlatform: SocialPlatformChoice;
  socialHandle: string;
  selectedTopics: string[];
  selectedFormats: string[];
  city: string;
  portfolioLinks: string;
  rateText: string;
  platformConsent: boolean;
  projectConsent: boolean;
  newsletterConsent: boolean;
  website: string;
};

const DRAFT_KEY = 'ugc-vz-creator-draft-v2';

const initialState: CreatorFormState = {
  email: '',
  socialPlatform: 'tiktok',
  socialHandle: '',
  selectedTopics: [],
  selectedFormats: ['TikTok', 'Instagram Reels'],
  city: '',
  portfolioLinks: '',
  rateText: '',
  platformConsent: false,
  projectConsent: false,
  newsletterConsent: false,
  website: '',
};

const STEPS = [
  { title: "Los geht's", description: 'Deine E-Mail und dein Kanalname reichen für den Start.' },
  { title: 'Was du machst', description: 'Wähle bis zu 3 Themen, deine Formate und optional deine Stadt.' },
  { title: 'Fast fertig', description: 'Portfolio und Video-Preis sind optional. Danach kommt dein 6-stelliger Code.' },
];

const FORMAT_CHIPS = [
  'TikTok',
  'Instagram Reels',
  'YouTube Shorts',
  'Produktdemo',
  'Unboxing',
  'Testimonial',
  'Voiceover',
  'Fotos',
];

const fieldClass =
  'min-h-[48px] w-full rounded-[12px] border border-[#DCE2EA] bg-white px-4 py-3 text-sm text-[#202124] outline-none transition-colors focus:border-[#06458F] focus:ring-4 focus:ring-[#06458F]/15';
const labelClass = 'mb-1.5 block text-sm font-semibold text-[#202124]';

const splitLinks = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((link) => link.trim())
    .filter(Boolean);

function buildSocialUrl(platform: SocialPlatformChoice, rawHandle: string): string {
  const trimmed = rawHandle.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || /^(?:www\.|tiktok\.|instagram\.)/i.test(trimmed)) {
    return trimmed;
  }
  const clean = trimmed.replace(/^@+/, '').replace(/\s+/g, '');
  if (!clean) return '';
  return platform === 'instagram'
    ? `https://instagram.com/${clean}`
    : `https://tiktok.com/@${clean}`;
}

export default function CreatorRegistrationForm({
  verified: verifiedProp = false,
  newlyVerified: newlyVerifiedProp = false,
  invalid: invalidProp = false,
  failed: failedProp = false,
}: {
  verified?: boolean;
  newlyVerified?: boolean;
  invalid?: boolean;
  failed?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreatorFormState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [resendKey, setResendKey] = useState(0);
  const [message, setMessage] = useState('');
  const [urlFlags, setUrlFlags] = useState({ verified: false, newlyVerified: false, invalid: false, failed: false });
  const startedRef = useRef(false);
  const confirmedRef = useRef(false);

  const verified = verifiedProp || urlFlags.verified;
  const newlyVerified = newlyVerifiedProp || urlFlags.newlyVerified;
  const invalid = invalidProp || urlFlags.invalid;
  const failed = failedProp || urlFlags.failed;

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const isVerified = params.get('verified') === '1';
      const isConfirmed = isVerified && params.get('confirmed') === '1';
      const isInvalid = params.get('invalid') === '1';
      const isFailed = params.get('error') === '1';
      if (isVerified || isInvalid || isFailed) {
        setUrlFlags({ verified: isVerified, newlyVerified: isConfirmed, invalid: isInvalid, failed: isFailed });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!newlyVerified || confirmedRef.current) return;
    confirmedRef.current = true;
    trackUGCEvents.registrationConfirmed();
    const url = new URL(window.location.href);
    url.searchParams.delete('confirmed');
    window.history.replaceState(window.history.state, '', url);
  }, [newlyVerified]);

  useEffect(() => {
    try {
      const draft = window.localStorage.getItem(DRAFT_KEY);
      if (draft) setForm({ ...initialState, ...JSON.parse(draft) });
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || submittedEmail) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      // ignore
    }
  }, [form, hydrated, submittedEmail]);

  const progressPct = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  const update = <K extends keyof CreatorFormState>(key: K, value: CreatorFormState[K]) => {
    if (!startedRef.current) {
      startedRef.current = true;
      trackUGCEvents.registrationStart();
      trackUGCEvents.registrationStep(1);
    }
    setForm((current) => ({ ...current, [key]: value }));
    if (message) setMessage('');
  };

  const toggleTopic = (label: string) => {
    setMessage('');
    setForm((current) => {
      if (current.selectedTopics.includes(label)) {
        return { ...current, selectedTopics: current.selectedTopics.filter((item) => item !== label) };
      }
      if (current.selectedTopics.length >= 3) {
        setMessage('Wähle bitte maximal 3 Themenkategorien aus.');
        return current;
      }
      return { ...current, selectedTopics: [...current.selectedTopics, label] };
    });
  };

  const toggleFormat = (label: string) => {
    setMessage('');
    setForm((current) => ({
      ...current,
      selectedFormats: current.selectedFormats.includes(label)
        ? current.selectedFormats.filter((item) => item !== label)
        : [...current.selectedFormats, label],
    }));
  };

  const validateStep = () => {
    if (step === 0) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(form.email.trim())) {
        setMessage('Bitte gib eine gültige E-Mail-Adresse an.');
        return false;
      }
      if (!buildSocialUrl(form.socialPlatform, form.socialHandle)) {
        setMessage('Bitte gib deinen TikTok- oder Instagram-Namen an.');
        return false;
      }
    }
    if (step === 1) {
      if (form.selectedTopics.length === 0) {
        setMessage('Bitte wähle mindestens ein Thema aus.');
        return false;
      }
      if (form.selectedFormats.length === 0) {
        setMessage('Bitte wähle mindestens ein Format aus.');
        return false;
      }
    }
    if (step === 2) {
      if (!form.platformConsent || !form.projectConsent) {
        setMessage('Bitte bestätige die beiden Pflicht-Einwilligungen.');
        return false;
      }
    }
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    trackUGCEvents.registrationStep(Math.min(step + 2, STEPS.length));
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const sendRegistration = async () => {
    setSubmitting(true);
    setMessage('');
    try {
      const socialUrl = buildSocialUrl(form.socialPlatform, form.socialHandle);
      const cleanHandle = form.socialHandle.trim().replace(/^@+/, '');
      const response = await fetch('/api/creators/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanHandle,
          stageName: cleanHandle,
          email: form.email.trim(),
          socialPlatform: form.socialPlatform,
          socialHandle: form.socialHandle.trim(),
          socialLinks: socialUrl ? [socialUrl] : [],
          topics: form.selectedTopics.join(', '),
          preferredContent: form.selectedFormats.join(', '),
          city: form.city.trim(),
          portfolioLinks: splitLinks(form.portfolioLinks),
          rateText: form.rateText.trim(),
          platformConsent: form.platformConsent,
          projectConsent: form.projectConsent,
          newsletterConsent: form.newsletterConsent,
          website: form.website,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Anmeldung fehlgeschlagen.');
      }

      setSubmittedEmail(form.email.trim().toLowerCase());
      setResendKey((k) => k + 1);
      trackUGCEvents.registrationSubmitted();
      try {
        window.localStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }
    } catch (error) {
      trackUGCEvents.registrationError();
      setMessage(error instanceof Error ? error.message : 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateStep()) return;
    await sendRegistration();
  };

  const verifyOtpCode = async (rawCode: string) => {
    setMessage('');
    const cleanCode = rawCode.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setMessage('Bitte gib den 6-stelligen Code aus deiner E-Mail ein.');
      setShakeKey((k) => k + 1);
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch('/api/creators/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: submittedEmail, code: cleanCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setShakeKey((k) => k + 1);
        throw new Error(data.error || 'Code ungültig oder abgelaufen.');
      }
      trackUGCEvents.registrationConfirmed();
      window.location.assign(data.redirectTo || '/konto/kampagnen');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Bestätigung fehlgeschlagen.');
      setVerifying(false);
    }
  };

  const handleVerifyForm = async (event: FormEvent) => {
    event.preventDefault();
    await verifyOtpCode(otpCode);
  };

  return (
    <section id="creator-form" className="scroll-mt-20 bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-[680px]">
        {verified && (
          <div className="mb-6 rounded-[20px] border border-[#1F9D55]/30 bg-[#EBF2FA]/25 p-5" role="status">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#062A59] text-[#F2072A]">
                <Check size={15} aria-hidden="true" />
              </span>
              <div>
                <p className="font-display font-bold text-[#202124]">Dein Konto ist bestätigt</p>
                <p className="mt-1 text-sm text-[#5C6470]">
                  Du kannst dich jetzt direkt in deinem Konto anmelden und offene Kampagnen ansehen.
                </p>
                <Link
                  href="/konto"
                  className="mt-3 inline-flex min-h-[40px] items-center rounded-full bg-[#06458F] px-4 text-xs font-semibold text-[#F5F7FA]"
                >
                  Zum Creator-Konto
                </Link>
              </div>
            </div>
          </div>
        )}

        {(invalid || failed) && (
          <div className="mb-6 rounded-[20px] border border-[#E8A317]/40 bg-amber-50 p-5 text-sm text-[#202124]" role="alert">
            {invalid
              ? 'Der Bestätigungslink ist ungültig oder abgelaufen. Melde dich unten einfach erneut an, um einen frischen Code zu erhalten.'
              : 'Die Bestätigung konnte gerade nicht abgeschlossen werden. Versuch es erneut oder schreib uns an hi@ugc-vz.de.'}
          </div>
        )}

        <div className="rounded-[24px] border border-[#DCE2EA] bg-[#F5F7FA] p-6 shadow-card sm:p-10">
          {submittedEmail ? (
            <div className="space-y-6 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EBF2FA] text-[#06458F]">
                <Mail size={22} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-bold text-[#202124] sm:text-3xl">
                  Code eingeben
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5C6470]">
                  Fertig. Wir haben dir einen Code an <strong className="text-[#202124]">{submittedEmail}</strong> geschickt. Bestätige ihn, dann siehst du alle Kampagnen.
                </p>
              </div>

              <form onSubmit={handleVerifyForm} className="mx-auto max-w-sm space-y-4">
                <OtpInput
                  value={otpCode}
                  onChange={(val) => {
                    setOtpCode(val);
                    if (message) setMessage('');
                  }}
                  onComplete={(code) => {
                    if (!verifying) void verifyOtpCode(code);
                  }}
                  disabled={verifying}
                  hasError={Boolean(message)}
                  shakeKey={shakeKey}
                  idPrefix="creator-signup-otp"
                />
                <button
                  type="submit"
                  disabled={verifying}
                  className="btn-press min-h-[48px] w-full rounded-full bg-[#06458F] px-6 text-sm font-semibold text-white hover:bg-[#053673] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {verifying ? 'Code wird geprüft...' : 'Code bestätigen und Kampagnen ansehen'}
                </button>
                <InlineError message={message} />
              </form>

              <p className="text-xs text-[#5C6470]">
                Nichts da? Schau im Spam oder im Gmail-Tab „Benachrichtigungen“.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 border-t border-[#DCE2EA] pt-4 text-xs text-[#5C6470]">
                <ResendTimer
                  initialSeconds={60}
                  resetTrigger={resendKey}
                  disabled={submitting || verifying}
                  onResend={async () => {
                    await sendRegistration();
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedEmail('');
                    setOtpCode('');
                    setMessage('');
                  }}
                  className="font-medium text-[#202124] underline underline-offset-2"
                >
                  E-Mail korrigieren
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {/* Onboarding Progress Bar (Spec 8.10: scaleX, aria-valuenow) */}
              <div className="mb-7">
                <div className="flex items-center justify-between text-xs font-semibold text-[#5C6470]">
                  <span>Schritt {step + 1} von {STEPS.length}</span>
                  <span className="font-mono tabular-nums">{progressPct} %</span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Fortschritt der Anmeldung"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressPct}
                  className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#DCE2EA]"
                >
                  <div
                    className="h-full w-full origin-left rounded-full bg-[#062A59] transition-transform duration-200 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
                    style={{ transform: `scaleX(${progressPct / 100})` }}
                  />
                </div>
                <h2 className="mt-5 font-display text-2xl font-bold text-[#202124] sm:text-3xl">
                  {STEPS[step].title}
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-[#5C6470]">{STEPS[step].description}</p>
              </div>

              {/* Schritt 1: maximal 2 Pflichtfelder (E-Mail + TikTok/Instagram-Name) */}
              {step === 0 && (
                <div className="space-y-5">
                  <div>
                    <label htmlFor="creator-email" className={labelClass}>
                      E-Mail *
                    </label>
                    <input
                      id="creator-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="du@beispiel.de"
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <span className={labelClass}>TikTok- oder Instagram-Name *</span>
                    <div className="mb-2.5 inline-grid grid-cols-2 rounded-full border border-[#DCE2EA] bg-white p-1">
                      {(['tiktok', 'instagram'] as const).map((platform) => (
                        <button
                          key={platform}
                          type="button"
                          onClick={() => update('socialPlatform', platform)}
                          aria-pressed={form.socialPlatform === platform}
                          className={`min-h-[36px] rounded-full px-4 text-xs font-semibold transition-colors ${
                            form.socialPlatform === platform
                              ? 'bg-[#06458F] text-white'
                              : 'text-[#5C6470] hover:text-[#202124]'
                          }`}
                        >
                          {platform === 'tiktok' ? 'TikTok' : 'Instagram'}
                        </button>
                      ))}
                    </div>
                    <input
                      id="creator-handle"
                      type="text"
                      required
                      value={form.socialHandle}
                      onChange={(e) => update('socialHandle', e.target.value)}
                      placeholder={form.socialPlatform === 'tiktok' ? '@dein.tiktok' : '@dein.instagram'}
                      className={fieldClass}
                    />
                    <p className="mt-1.5 text-xs text-[#5C6470]">
                      Direkt danach kannst du deinen Kanal im Konto per Verifizierung verbinden. Geburtsjahr und weitere Angaben sind später optional im Profil möglich.
                    </p>
                  </div>
                </div>
              )}

              {/* Schritt 2: Themen (Chips), Formate (Chips), Stadt */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={labelClass}>Themen (bis zu 3 wählen) *</span>
                      <span className="font-mono text-xs tabular-nums text-[#5C6470]">
                        {form.selectedTopics.length} / 3
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Themen wählen">
                      {CREATOR_TAXONOMY.map((cat) => {
                        const active = form.selectedTopics.includes(cat.label);
                        return (
                          <button
                            key={cat.label}
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggleTopic(cat.label)}
                            className={`min-h-[40px] rounded-full border px-3.5 text-xs font-semibold transition-colors ${
                              active
                                ? 'border-[#06458F] bg-[#06458F] text-white'
                                : 'border-[#DCE2EA] bg-white text-[#202124] hover:border-[#06458F]'
                            }`}
                          >
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className={labelClass}>Formate *</span>
                    <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Formate wählen">
                      {FORMAT_CHIPS.map((fmt) => {
                        const active = form.selectedFormats.includes(fmt);
                        return (
                          <button
                            key={fmt}
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggleFormat(fmt)}
                            className={`min-h-[40px] rounded-full border px-3.5 text-xs font-semibold transition-colors ${
                              active
                                ? 'border-[#06458F] bg-[#06458F] text-white'
                                : 'border-[#DCE2EA] bg-white text-[#202124] hover:border-[#06458F]'
                            }`}
                          >
                            {fmt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="creator-city" className={labelClass}>
                      Stadt (optional)
                    </label>
                    <input
                      id="creator-city"
                      type="text"
                      value={form.city}
                      onChange={(e) => update('city', e.target.value)}
                      placeholder="z. B. Berlin, Wien oder Zürich"
                      className={fieldClass}
                    />
                  </div>
                </div>
              )}

              {/* Schritt 3: Portfolio-Links, Preis (optional), Einwilligung */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <label htmlFor="creator-portfolio" className={labelClass}>
                      Portfolio-Links (optional)
                    </label>
                    <textarea
                      id="creator-portfolio"
                      rows={3}
                      value={form.portfolioLinks}
                      onChange={(e) => update('portfolioLinks', e.target.value)}
                      placeholder="Canva-, Drive-, Website- oder Video-Links (ein Link pro Zeile)"
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="creator-rate" className={labelClass}>
                      Preis für Videos (optional)
                    </label>
                    <input
                      id="creator-rate"
                      type="text"
                      value={form.rateText}
                      onChange={(e) => update('rateText', e.target.value)}
                      placeholder="z. B. ab 180 € pro Produktvideo"
                      className={fieldClass}
                    />
                  </div>

                  <div className="space-y-3 rounded-[16px] border border-[#DCE2EA] bg-white p-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={form.platformConsent}
                        onChange={(e) => update('platformConsent', e.target.checked)}
                        className="mt-1 h-4 w-4 accent-[#06458F]"
                      />
                      <span className="text-xs leading-5 text-[#5C6470]">
                        <strong className="text-[#202124]">Pflicht:</strong> Ich stimme der Verarbeitung meiner Angaben für mein UGC VZ Profil gemäß{' '}
                        <Link href="/datenschutz" className="font-semibold text-[#202124] underline">
                          Datenschutzerklärung
                        </Link>{' '}
                        zu.
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={form.projectConsent}
                        onChange={(e) => update('projectConsent', e.target.checked)}
                        className="mt-1 h-4 w-4 accent-[#06458F]"
                      />
                      <span className="text-xs leading-5 text-[#5C6470]">
                        <strong className="text-[#202124]">Pflicht:</strong> UGC VZ darf mich per E-Mail über passende Kampagnen und Anfragen informieren. Widerruf jederzeit möglich.
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={form.newsletterConsent}
                        onChange={(e) => update('newsletterConsent', e.target.checked)}
                        className="mt-1 h-4 w-4 accent-[#06458F]"
                      />
                      <span className="text-xs leading-5 text-[#5C6470]">
                        <strong className="text-[#202124]">Optional:</strong> Gelegentliche Tipps zu neuen Kampagnen per E-Mail erhalten.
                      </span>
                    </label>
                  </div>

                  <label className="sr-only" aria-hidden="true">
                    Website
                    <input
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={(e) => update('website', e.target.value)}
                    />
                  </label>
                </div>
              )}

              {message && (
                <div className="mt-5">
                  <InlineError message={message} />
                </div>
              )}

              <div className="mt-7 flex items-center justify-between gap-3">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMessage('');
                      setStep((current) => current - 1);
                    }}
                    className="btn-press inline-flex min-h-[48px] items-center gap-2 rounded-full border border-[#DCE2EA] bg-white px-5 text-sm font-semibold text-[#202124] hover:border-[#06458F]"
                  >
                    <ArrowLeft size={16} aria-hidden="true" />
                    <span>Zurück</span>
                  </button>
                ) : (
                  <span />
                )}

                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={next}
                    className="btn-press inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#06458F] px-6 text-sm font-semibold text-white hover:bg-[#053673] hover:opacity-90"
                  >
                    <span>Weiter</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-press inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#06458F] px-7 text-sm font-semibold text-white hover:bg-[#053673] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>{submitting ? 'Code wird gesendet...' : 'Kostenlos anmelden'}</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                )}
              </div>

              <p className="mt-5 text-center text-xs text-[#5C6470]">
                Deine E-Mail bleibt privat und erscheint nie öffentlich. Mehr im{' '}
                <Link href="/datenschutz" className="underline hover:text-[#202124]">
                  Datenschutz
                </Link>
                .
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

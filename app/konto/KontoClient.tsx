'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Check, LogOut, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import type { CreatorProfileView } from '../lib/creator-profile';
import type { CreatorSocialConnection } from '../lib/brand-workspace';
import type { SocialOAuthAvailability } from '../lib/social-oauth';
import type { CreatorAiProfileRecord } from '../lib/creator-social-analyzer';
import SocialVerifySection from './SocialVerifySection';
import AiProfileReviewCard from './AiProfileReviewCard';
import CreatorPayoutPanel from './CreatorPayoutPanel';
import OtpInput from '@/app/components/auth/OtpInput';
import ResendTimer from '@/app/components/auth/ResendTimer';
import InlineError from '@/app/components/auth/InlineError';

const fieldClass = 'w-full rounded-xl border border-hairline bg-white px-4 py-3 text-ink outline-none transition focus:border-geo-violet focus:ring-4 focus:ring-geo-violet/10';
const labelClass = 'mb-2 block text-sm font-semibold text-ink';

const splitLinks = (value: string) => value
  .split(/[\n,]+/)
  .map((link) => link.trim())
  .filter(Boolean);

const joinLinks = (value: string[]) => (value || []).join('\n');

export default function KontoClient({
  profile,
  aiProfile = null,
  socialConnections = [],
  oauthEnabled = { tiktok: false, instagram: false },
  oauthStatus,
  loginInvalid = false,
  loginError = false,
  loginNoSession = false,
}: {
  profile: CreatorProfileView | null;
  aiProfile?: CreatorAiProfileRecord | null;
  socialConnections?: CreatorSocialConnection[];
  oauthEnabled?: SocialOAuthAvailability;
  oauthStatus?: string;
  loginInvalid?: boolean;
  loginError?: boolean;
  loginNoSession?: boolean;
}) {
  return (
    <div className="min-h-screen text-ink">
      {profile ? (
        <EditView profile={profile} aiProfile={aiProfile} socialConnections={socialConnections} oauthEnabled={oauthEnabled} oauthStatus={oauthStatus} />
      ) : (
        <LoginView invalid={loginInvalid} error={loginError} noSession={loginNoSession} />
      )}
    </div>
  );
}

function ProjectRequests({ profile }: { profile: CreatorProfileView }) {
  const [enabled, setEnabled] = useState(Boolean(profile.projectNotifications));
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selected = profile.selectedCount ?? 0;

  const save = async (next: boolean) => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/creator/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Speichern fehlgeschlagen.');
      setEnabled(next);
      setConsent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`mb-8 rounded-2xl border p-5 ${enabled ? 'border-hairline bg-surface' : 'border-geo-violet bg-geo-violet/5'}`}>
      <h2 className="text-lg font-bold">Projektanfragen per E-Mail: {enabled ? 'aktiv' : 'aus'}</h2>
      {selected > 0 && (
        <p className="mt-1 text-sm text-ink-soft">
          Brands haben dein Profil bereits <strong className="text-ink">{selected}-mal</strong> für eine Anfrage ausgewählt.
          {!enabled && ' Weil Anfragen per E-Mail aus sind, konnten wir dich dabei nicht benachrichtigen.'}
        </p>
      )}
      {enabled ? (
        <button type="button" disabled={busy} onClick={() => save(false)} className="mt-3 text-sm font-semibold text-ink-soft underline disabled:opacity-50">
          Anfragen pausieren
        </button>
      ) : (
        <div className="mt-3 space-y-3">
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-geo-violet" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span className="text-sm leading-6 text-ink-soft">UGC VZ darf mich bei konkreten passenden Brand-Anfragen per E-Mail informieren und meine hinterlegten Kontaktdaten an die anfragende Brand übermitteln. Ich kann dies jederzeit widerrufen.</span>
          </label>
          <button type="button" disabled={!consent || busy} onClick={() => save(true)} className="rounded-xl bg-geo-violet px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            Projektanfragen aktivieren
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}

function LoginView({ invalid, error, noSession }: { invalid: boolean; error: boolean; noSession: boolean }) {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [resendKey, setResendKey] = useState(0);
  const [cooldownSec, setCooldownSec] = useState(60);

  const requestCode = async () => {
    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(trimmedEmail)) {
      setMessage('Bitte gib eine gültige E-Mail-Adresse an.');
      return false;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const response = await fetch('/api/creator/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        if (typeof result.retryAfterSec === 'number' && result.retryAfterSec > 0) {
          setCooldownSec(Math.min(60, result.retryAfterSec));
          setResendKey((k) => k + 1);
        }
        throw new Error(result.error || 'Gerade klappt der Versand bei uns nicht. Versuch es in ein paar Minuten noch mal oder schreib uns an hi@ugc-vz.de.');
      }
      setCooldownSec(typeof result.resendCooldownSec === 'number' ? result.resendCooldownSec : 60);
      setResendKey((k) => k + 1);
      setSent(true);
      return true;
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await requestCode();
  };

  const submitVerifyCode = async (rawCode: string) => {
    const cleanCode = rawCode.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setMessage('Bitte gib den 6-stelligen Code aus deiner E-Mail ein.');
      setShakeKey((k) => k + 1);
      return;
    }
    setVerifying(true);
    setMessage('');
    try {
      const response = await fetch('/api/creator/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: cleanCode, rememberMe }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setShakeKey((k) => k + 1);
        throw new Error(result.error || 'Code konnte nicht bestätigt werden.');
      }
      window.location.assign(result.redirectTo || '/konto?login=1');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.');
      setVerifying(false);
    }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    await submitVerifyCode(otpCode);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] px-4 pb-24 pt-12 text-[#202124] sm:px-8 sm:pt-16">
      <section className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <p className="text-sm font-medium text-[#5C6470]">UGC VZ für Creator</p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-[#202124] sm:text-4xl">
            {sent ? 'Code eingeben' : 'Creator-Konto'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#5C6470]">
            Melde dich mit deiner E-Mail per 6-stelligem Code an. Kein Passwort nötig.
          </p>
        </div>

        <div className="rounded-[20px] border border-[#DCE2EA] bg-white p-6 shadow-[0_1px_2px_rgba(18,18,18,.06),0_8px_24px_rgba(18,18,18,.06)] sm:p-8">
          {sent ? (
            <div className="space-y-5">
              <div className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EBF2FA] text-[#06458F]">
                  <Mail size={22} aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm leading-6 text-[#5C6470]">
                  Wenn zu <strong className="text-[#202124]">{email}</strong> ein Profil existiert, ist der Code unterwegs. Nichts da? Schau im Spam oder im Gmail-Tab „Benachrichtigungen“.
                </p>
              </div>

              <form onSubmit={verifyOtp} className="space-y-4">
                <div>
                  <span className="mb-1.5 block text-center text-sm font-medium text-[#202124]">6-stelliger Anmeldecode</span>
                  <OtpInput
                    value={otpCode}
                    onChange={(next) => {
                      setOtpCode(next);
                      if (message) setMessage('');
                    }}
                    onComplete={(code) => {
                      if (!verifying) void submitVerifyCode(code);
                    }}
                    disabled={verifying}
                    hasError={Boolean(message)}
                    shakeKey={shakeKey}
                    idPrefix="creator-otp"
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

                <InlineError message={message} />
              </form>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#DCE2EA] pt-4 text-xs text-[#5C6470]">
                <ResendTimer
                  initialSeconds={cooldownSec}
                  resetTrigger={resendKey}
                  disabled={submitting || verifying}
                  onResend={async () => {
                    await requestCode();
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setOtpCode('');
                    setMessage('');
                  }}
                  className="font-semibold text-[#202124] underline underline-offset-2"
                >
                  E-Mail ändern
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-4">
              {noSession && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900" role="alert">
                  Dein Browser hat die Anmeldung nicht behalten. Fordere hier einfach einen neuen 6-stelligen Code an und gib ihn direkt im Browser ein.
                </div>
              )}
              {(invalid || error) && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
                  {invalid
                    ? 'Der Anmeldelink ist ungültig oder abgelaufen. Fordere einfach einen neuen 6-stelligen Code an.'
                    : 'Die Anmeldung konnte gerade nicht abgeschlossen werden. Versuch es noch mal oder schreib uns an hi@ugc-vz.de.'}
                </div>
              )}

              <div>
                <label htmlFor="creator-login-email" className="mb-1.5 block text-sm font-medium text-[#202124]">
                  E-Mail-Adresse
                </label>
                <input
                  id="creator-login-email"
                  type="email"
                  className="min-h-[48px] w-full rounded-xl border border-[#DCE2EA] bg-white px-4 py-3 text-sm text-[#202124] outline-none transition-colors focus:border-[#06458F] focus:ring-4 focus:ring-[#06458F]/15"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (message) setMessage('');
                  }}
                  autoComplete="email"
                  maxLength={254}
                  placeholder="du@beispiel.de"
                  required
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
                disabled={submitting}
                className="min-h-[48px] w-full rounded-xl bg-[#06458F] px-6 text-sm font-semibold text-white hover:bg-[#053673] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Code wird gesendet ...' : 'Code schicken'}
              </button>

              <InlineError message={message} />
            </form>
          )}
        </div>

        <div className="mt-6 space-y-2 text-center text-xs text-[#5C6470]">
          <p>
            Noch kein Profil?{' '}
            <Link href="/creator" className="font-semibold text-[#202124] underline underline-offset-2">
              Jetzt kostenlos anlegen
            </Link>
            {' · '}
            <Link href="/brand/login" className="font-semibold text-[#202124] underline underline-offset-2">
              Login für Marken
            </Link>
          </p>
          <p>
            Klappt gar nicht? Schreib uns an{' '}
            <a href="mailto:hi@ugc-vz.de" className="font-semibold text-[#202124] underline underline-offset-2">
              hi@ugc-vz.de
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}

function EditView({
  profile,
  aiProfile,
  socialConnections,
  oauthEnabled,
  oauthStatus,
}: {
  profile: CreatorProfileView;
  aiProfile: CreatorAiProfileRecord | null;
  socialConnections: CreatorSocialConnection[];
  oauthEnabled: SocialOAuthAvailability;
  oauthStatus?: string;
}) {
  const [form, setForm] = useState({
    name: profile.name,
    stageName: profile.stageName,
    birthYear: profile.birthYear ? String(profile.birthYear) : '',
    gender: profile.gender,
    city: profile.city,
    profileImageUrl: profile.profileImageUrl || '',
    topics: profile.topics,
    preferredContent: profile.preferredContent,
    industries: profile.industries,
    rateText: profile.rateText,
    reachText: profile.reachText,
    equipment: profile.equipment,
    specialTraits: profile.specialTraits,
    childrenContext: profile.childrenContext,
    petContext: profile.petContext,
    socialLinks: joinLinks(profile.socialLinks),
    portfolioLinks: joinLinks(profile.portfolioLinks),
    newsletterConsent: profile.newsletterConsent,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  // Social-SEITEN-Links (Profil/Post) sind keine Bilddateien - der Server
  // verwirft sie (normalizeImageUrl), die Vorschau zeigt darum direkt den
  // automatischen Avatar und einen Hinweis statt eines kaputten Bildes.
  const imageUrlIsSocialPage = /(^|\.|\/\/)(instagram\.com|tiktok\.com|facebook\.com|youtube\.com|x\.com|twitter\.com)\//i.test(form.profileImageUrl.trim());
  const previewImageSrc = form.profileImageUrl.trim() && !imageUrlIsSocialPage
    ? form.profileImageUrl.trim()
    : `/api/avatar/${profile.publicId}`;

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (message) setMessage('');
    setSaved(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setSaved(false);
    try {
      const response = await fetch('/api/creator/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          birthYear: form.birthYear ? Number(form.birthYear) : null,
          socialLinks: splitLinks(form.socialLinks),
          portfolioLinks: splitLinks(form.portfolioLinks),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Speichern fehlgeschlagen.');
      setSaved(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Speichern fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    await fetch('/api/creator/logout', { method: 'POST' });
    window.location.href = '/konto';
  };

  return (
    <div className="px-4 sm:px-8 md:px-16 lg:px-24 pb-24 pt-10 sm:pt-14">
      <div className="max-w-4xl mx-auto py-10">
        <CreatorPayoutPanel />
        <ProjectRequests profile={profile} />
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <Link href="/konto/kampagnen" className="block rounded-2xl border border-geo-violet/40 bg-geo-violet/5 p-6 transition hover:bg-geo-violet/10">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-geo-violet">Neu · Brand-Workspace</p>
            <h2 className="mt-1 text-xl font-semibold">Brand-Kampagnen &amp; Ausschreibungen →</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">Einladungen annehmen, auf offene Kampagnen bewerben und fertige Clips einreichen.</p>
          </Link>
          <Link href="/konto/kooperationen" className="block rounded-2xl border border-hairline bg-white p-6 transition hover:border-geo-violet/40 hover:bg-surface/60">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">Direkt-Kooperationen</p>
            <h2 className="mt-1 text-xl font-semibold">Meine Kooperationen →</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">Bestehende Einladungen ansehen, fehlende Angaben ergänzen und nächste Schritte fortsetzen.</p>
          </Link>
        </div>
        <SocialVerifySection initialAccounts={socialConnections} oauthEnabled={oauthEnabled} oauthStatus={oauthStatus} />
        <AiProfileReviewCard initialAiProfile={aiProfile} />
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-geo-violet">Creator-Konto</p>
            <h1 className="mt-2 text-4xl font-bold">Dein Profil</h1>
            <p className="mt-2 text-sm text-ink-soft">Profil-ID: <span className="font-semibold text-ink">{profile.publicId}</span></p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl border border-hairline px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-surface"
          >
            <LogOut size={16} /> Abmelden
          </button>
        </div>

        {saved && (
          <div className="mb-6 rounded-2xl border border-geo-green/60 bg-geo-green/15 p-5" role="status">
            <div className="flex gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-geo-green text-ink"><Check size={18} /></span>
              <div><h2 className="font-bold text-ink">Gespeichert</h2><p className="mt-1 text-sm text-ink-soft">Deine Änderungen sind im Verzeichnis live. Änderungen an deinem Profil werden protokolliert.</p></div>
            </div>
          </div>
        )}

        <form onSubmit={submit} noValidate>
          <div className="rounded-3xl border border-hairline bg-white p-6 sm:p-8 shadow-[0_24px_80px_rgba(35,22,47,0.10)]">
            <h2 className="text-xl font-bold mb-6">Über dich</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <label><span className={labelClass}>Vor- und Nachname *</span><input className={fieldClass} value={form.name} onChange={(e) => update('name', e.target.value)} autoComplete="name" maxLength={120} required /></label>
              <label><span className={labelClass}>Künstlername</span><input className={fieldClass} value={form.stageName} onChange={(e) => update('stageName', e.target.value)} maxLength={120} placeholder="Optional" /></label>
              <label className="sm:col-span-2"><span className={labelClass}>E-Mail-Adresse</span><input className={`${fieldClass} bg-surface text-ink-soft`} value={profile.email} disabled readOnly /><span className="mt-2 block text-xs text-ink-soft">Deine E-Mail ist dein Login und bleibt privat. Änderung bitte per Mail an hi@ugc-vz.de.</span></label>
              <label><span className={labelClass}>Geburtsjahr</span><input type="number" min="1930" max={new Date().getFullYear() - 16} className={fieldClass} value={form.birthYear} onChange={(e) => update('birthYear', e.target.value)} inputMode="numeric" placeholder="z. B. 1995" /></label>
              <label><span className={labelClass}>Geschlecht</span><select className={fieldClass} value={form.gender} onChange={(e) => update('gender', e.target.value)}><option value="">Keine Angabe</option><option>Weiblich</option><option>Männlich</option><option>Divers</option><option>Selbstbeschreibung</option></select></label>
              <label className="sm:col-span-2"><span className={labelClass}>Stadt / Region</span><input className={fieldClass} value={form.city} onChange={(e) => update('city', e.target.value)} autoComplete="address-level2" maxLength={120} placeholder="z. B. Berlin oder Rhein-Main" /></label>
              <div className="sm:col-span-2">
                <span className={labelClass}>Profilbild</span>
                <div className="flex items-start gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline bg-surface">
                    {previewImageSrc && !previewFailed ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewImageSrc}
                        alt="Profilbild-Vorschau"
                        className="h-full w-full object-cover"
                        onError={() => setPreviewFailed(true)}
                      />
                    ) : (
                      <span className="px-2 text-center text-xs text-ink-soft">Kommt automatisch</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input type="url" className={fieldClass} value={form.profileImageUrl} onChange={(e) => { update('profileImageUrl', e.target.value); setPreviewFailed(false); }} maxLength={500} placeholder="https://… (optional)" />
                    {imageUrlIsSocialPage ? (
                      <span className="mt-2 block rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                        Das ist ein Link zu deinem Social-Profil, kein Bildlink. Du musst hier nichts eintragen: Lass das Feld einfach leer — wir übernehmen dein Instagram-/TikTok-Profilbild automatisch aus deinen Social-Links.
                      </span>
                    ) : (
                      <span className="mt-2 block text-xs leading-5 text-ink-soft">
                        Du musst hier nichts eintragen: Wir übernehmen dein Instagram-/TikTok-Profilbild automatisch aus deinen Social-Links (nach dem Speichern in der Regel innerhalb einer Stunde sichtbar). Nur ausfüllen, wenn du ein anderes Bild möchtest — dann bitte einen direkten Link zu einer Bilddatei (endet z. B. auf .jpg oder .png).
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-hairline bg-white p-6 sm:p-8 shadow-[0_24px_80px_rgba(35,22,47,0.10)]">
            <h2 className="text-xl font-bold mb-6">Dein Angebot</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className={labelClass}>Themen und Interessen *</span><textarea className={`${fieldClass} min-h-28`} value={form.topics} onChange={(e) => update('topics', e.target.value)} maxLength={1200} required /></label>
              <label className="sm:col-span-2"><span className={labelClass}>Welche Inhalte erstellst du am liebsten? *</span><textarea className={`${fieldClass} min-h-28`} value={form.preferredContent} onChange={(e) => update('preferredContent', e.target.value)} maxLength={1200} required /></label>
              <label><span className={labelClass}>Branchen / Erfahrung</span><textarea className={`${fieldClass} min-h-24`} value={form.industries} onChange={(e) => update('industries', e.target.value)} maxLength={1200} /></label>
              <label><span className={labelClass}>Preisvorstellung *</span><textarea className={`${fieldClass} min-h-24`} value={form.rateText} onChange={(e) => update('rateText', e.target.value)} maxLength={500} placeholder="z. B. Video ab 180 €" required /></label>
              <label><span className={labelClass}>Reichweite pro Netzwerk</span><textarea className={`${fieldClass} min-h-24`} value={form.reachText} onChange={(e) => update('reachText', e.target.value)} maxLength={500} placeholder="Instagram 2.400, TikTok 5.100" /></label>
              <label><span className={labelClass}>Ausrüstung</span><textarea className={`${fieldClass} min-h-24`} value={form.equipment} onChange={(e) => update('equipment', e.target.value)} maxLength={1000} /></label>
              <label><span className={labelClass}>Besondere Merkmale</span><textarea className={`${fieldClass} min-h-24`} value={form.specialTraits} onChange={(e) => update('specialTraits', e.target.value)} maxLength={1000} /></label>
              <label><span className={labelClass}>Kinder / Family-Content</span><textarea className={`${fieldClass} min-h-24`} value={form.childrenContext} onChange={(e) => update('childrenContext', e.target.value)} maxLength={700} placeholder="Optional, keine Namen nötig" /></label>
              <label><span className={labelClass}>Tiere / Pet-Content</span><textarea className={`${fieldClass} min-h-24`} value={form.petContext} onChange={(e) => update('petContext', e.target.value)} maxLength={700} /></label>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-hairline bg-white p-6 sm:p-8 shadow-[0_24px_80px_rgba(35,22,47,0.10)]">
            <h2 className="text-xl font-bold mb-6">Links &amp; Freigabe</h2>
            <div className="space-y-5">
              <label><span className={labelClass}>Social-Links *</span><textarea className={`${fieldClass} min-h-32`} value={form.socialLinks} onChange={(e) => update('socialLinks', e.target.value)} placeholder={'https://instagram.com/deinprofil\nhttps://tiktok.com/@deinprofil'} required /><span className="mt-2 block text-xs text-ink-soft">Ein vollständiger Link pro Zeile, maximal 8.</span></label>
              <label><span className={labelClass}>Portfolio und Arbeitsproben</span><textarea className={`${fieldClass} min-h-28`} value={form.portfolioLinks} onChange={(e) => update('portfolioLinks', e.target.value)} placeholder={'Canva-, Drive-, Website- oder Video-Link\nEin Link pro Zeile'} /><span className="mt-2 block text-xs text-ink-soft">Maximal 15 Links.</span></label>
              <div className="rounded-2xl border border-hairline bg-surface p-4 text-sm leading-6 text-ink-soft">
                <strong className="text-ink">Hinweis:</strong> UGC VZ hostet keine Dateien und nimmt aktuell nur Text- und Link-Daten an. Du kannst Videos also nicht hochladen — verlinke sie einfach (z. B. Google Drive, YouTube oder deine Website). Direkter Upload ist für die Zukunft denkbar, aktuell aber nicht möglich.
              </div>
              <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" className="mt-1 h-4 w-4 accent-geo-violet" checked={form.newsletterConsent} onChange={(e) => update('newsletterConsent', e.target.checked)} /><span className="text-sm leading-6 text-ink-soft"><strong className="text-ink">Optional:</strong> Ich möchte gelegentliche UGC-VZ-Updates per E-Mail erhalten. Diese Einwilligung ist jederzeit widerrufbar.</span></label>
            </div>
          </div>

          {message && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{message}</div>}

          <div className="mt-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-ink-soft"><ShieldCheck size={16} className="text-geo-violet" /> Änderungen werden protokolliert.</div>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-geo-violet px-6 py-3 font-semibold text-white transition hover:bg-geo-violet-soft disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Wird gespeichert …' : 'Änderungen speichern'} <Sparkles size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

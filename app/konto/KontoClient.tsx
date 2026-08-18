'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Check, LogOut, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import type { CreatorProfileView } from '../lib/creator-profile';

const fieldClass = 'w-full rounded-xl border border-hairline bg-white px-4 py-3 text-ink outline-none transition focus:border-geo-violet focus:ring-4 focus:ring-geo-violet/10';
const labelClass = 'mb-2 block text-sm font-semibold text-ink';

const splitLinks = (value: string) => value
  .split(/[\n,]+/)
  .map((link) => link.trim())
  .filter(Boolean);

const joinLinks = (value: string[]) => (value || []).join('\n');

export default function KontoClient({
  profile,
  loginInvalid = false,
  loginError = false,
}: {
  profile: CreatorProfileView | null;
  loginInvalid?: boolean;
  loginError?: boolean;
}) {
  return (
    <div className="min-h-screen bg-white text-ink">
      <Header />
      {profile ? <EditView profile={profile} /> : <LoginView invalid={loginInvalid} error={loginError} />}
    </div>
  );
}

function Header() {
  return (
    <header className="py-6 px-4 sm:px-8 md:px-16 lg:px-24">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold gradient-text">UGC VZ</span>
        </Link>
        <Link href="/creator" className="text-sm font-medium text-ink-soft hover:text-ink">
          Creator werden
        </Link>
      </div>
    </header>
  );
}

function LoginView({ invalid, error }: { invalid: boolean; error: boolean }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim())) {
      setMessage('Bitte gib eine gültige E-Mail-Adresse an.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const response = await fetch('/api/creator/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Login fehlgeschlagen.');
      setSent(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Login fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="px-4 sm:px-8 md:px-16 lg:px-24 pb-24">
      <section className="max-w-lg mx-auto py-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">Creator-Konto</h1>
          <p className="mt-3 text-ink-soft">Melde dich mit deiner E-Mail an, um dein Profil zu sehen und zu bearbeiten.</p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center text-center rounded-3xl border border-hairline bg-white p-10 shadow-[0_24px_80px_rgba(35,22,47,0.10)]">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-geo-violet/10 text-geo-violet"><Mail size={30} /></span>
            <h2 className="mt-6 text-2xl font-bold">Prüfe dein Postfach</h2>
            <p className="mt-3 leading-7 text-ink-soft">Wenn zu dieser Adresse ein verifiziertes Profil existiert, haben wir dir einen Anmeldelink geschickt.</p>
            <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm text-ink-soft">Keine E-Mail? Prüfe bitte auch Spam. Der Link ist 15 Minuten gültig.</p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="rounded-3xl border border-hairline bg-white p-8 shadow-[0_24px_80px_rgba(35,22,47,0.10)]">
            {(invalid || error) && (
              <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
                {invalid ? 'Der Anmeldelink ist ungültig oder abgelaufen. Fordere einfach einen neuen an.' : 'Die Anmeldung konnte gerade nicht abgeschlossen werden. Bitte versuche es erneut oder schreibe an hi@ugc-vz.de.'}
              </div>
            )}
            <label>
              <span className={labelClass}>E-Mail-Adresse</span>
              <input
                type="email"
                className={fieldClass}
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (message) setMessage(''); }}
                autoComplete="email"
                maxLength={254}
                placeholder="du@beispiel.de"
                required
              />
            </label>
            <p className="mt-3 text-xs leading-5 text-ink-soft">Wir schicken dir einen Anmeldelink. Kein Passwort nötig.</p>

            {message && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{message}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-geo-violet px-6 py-3 font-semibold text-white transition hover:bg-geo-violet-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Wird gesendet …' : 'Anmeldelink anfordern'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function EditView({ profile }: { profile: CreatorProfileView }) {
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
    <main className="px-4 sm:px-8 md:px-16 lg:px-24 pb-24">
      <div className="max-w-4xl mx-auto py-10">
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
                    {form.profileImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.profileImageUrl} alt="Profilbild-Vorschau" className="h-full w-full object-cover" />
                    ) : (
                      <span className="px-2 text-center text-xs text-ink-soft">Kein eigenes Bild</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input type="url" className={fieldClass} value={form.profileImageUrl} onChange={(e) => update('profileImageUrl', e.target.value)} maxLength={500} placeholder="https://… (optional)" />
                    <span className="mt-2 block text-xs text-ink-soft">Optional: direkter Link zu deinem Profilbild. Lässt du das Feld leer, nutzen wir dein Social-Profilbild.</span>
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
    </main>
  );
}

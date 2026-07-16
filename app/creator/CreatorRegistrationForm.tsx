'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Mail, ShieldCheck, Sparkles } from 'lucide-react';

type CreatorFormState = {
  name: string;
  stageName: string;
  email: string;
  birthYear: string;
  gender: string;
  city: string;
  topics: string;
  preferredContent: string;
  industries: string;
  rateText: string;
  reachText: string;
  equipment: string;
  specialTraits: string;
  childrenContext: string;
  petContext: string;
  socialLinks: string;
  portfolioLinks: string;
  platformConsent: boolean;
  projectConsent: boolean;
  newsletterConsent: boolean;
  website: string;
};

const initialState: CreatorFormState = {
  name: '',
  stageName: '',
  email: '',
  birthYear: '',
  gender: '',
  city: '',
  topics: '',
  preferredContent: '',
  industries: '',
  rateText: '',
  reachText: '',
  equipment: '',
  specialTraits: '',
  childrenContext: '',
  petContext: '',
  socialLinks: '',
  portfolioLinks: '',
  platformConsent: false,
  projectConsent: false,
  newsletterConsent: false,
  website: '',
};

const steps = [
  { title: 'Über dich', description: 'Die Grundlagen für dein Profil' },
  { title: 'Dein Angebot', description: 'Themen, Formate und Preise' },
  { title: 'Links & Freigabe', description: 'Socials, Portfolio und Einwilligung' },
];

const fieldClass = 'w-full rounded-xl border border-hairline bg-white px-4 py-3 text-ink outline-none transition focus:border-geo-violet focus:ring-4 focus:ring-geo-violet/10';
const labelClass = 'mb-2 block text-sm font-semibold text-ink';

const splitLinks = (value: string) => value
  .split(/[\n,]+/)
  .map((link) => link.trim())
  .filter(Boolean);

export default function CreatorRegistrationForm({
  verified = false,
  invalid = false,
  failed = false,
}: {
  verified?: boolean;
  invalid?: boolean;
  failed?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreatorFormState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    try {
      const draft = window.localStorage.getItem('ugc-vz-creator-draft-v1');
      if (draft) setForm({ ...initialState, ...JSON.parse(draft) });
    } catch {
      // A draft is a convenience only; registration works without local storage.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || submitted) return;
    window.localStorage.setItem('ugc-vz-creator-draft-v1', JSON.stringify(form));
  }, [form, hydrated, submitted]);

  const progress = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step]);

  const update = <K extends keyof CreatorFormState>(key: K, value: CreatorFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (message) setMessage('');
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(form.email.trim())) {
        setMessage('Bitte gib deinen Namen und eine gültige E-Mail-Adresse an.');
        return false;
      }
    }
    if (step === 1 && (!form.topics.trim() || !form.preferredContent.trim() || !form.rateText.trim())) {
      setMessage('Bitte ergänze Themen, bevorzugte Content-Formate und deine Preisvorstellung.');
      return false;
    }
    if (step === 2) {
      if (splitLinks(form.socialLinks).length === 0) {
        setMessage('Bitte hinterlege mindestens einen vollständigen Social-Link.');
        return false;
      }
      if (!form.platformConsent || !form.projectConsent) {
        setMessage('Für die Aufnahme ins Verzeichnis sind die beiden Pflicht-Einwilligungen nötig.');
        return false;
      }
    }
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
    document.getElementById('creator-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateStep()) return;
    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/creators/register', {
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
      if (!response.ok || !result.success) throw new Error(result.error || 'Anmeldung fehlgeschlagen.');

      setSubmitted(true);
      setForm(initialState);
      window.localStorage.removeItem('ugc-vz-creator-draft-v1');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="creator-form" className="scroll-mt-6 max-w-6xl mx-auto mb-20">
      {verified && (
        <div className="mb-6 rounded-2xl border border-geo-green/60 bg-geo-green/15 p-5 text-left" role="status">
          <div className="flex gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-geo-green text-ink"><Check size={18} /></span>
            <div><h2 className="font-bold text-ink">Dein Profil ist bestätigt</h2><p className="mt-1 text-sm text-ink-soft">Du bist jetzt im UGC-Verzeichnis sichtbar und kannst bei passenden Brand-Anfragen berücksichtigt werden.</p></div>
          </div>
        </div>
      )}
      {(invalid || failed) && (
        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900" role="alert">
          {invalid ? 'Der Bestätigungslink ist ungültig oder abgelaufen. Fülle das Formular bitte erneut aus, um einen neuen Link zu erhalten.' : 'Die Bestätigung konnte gerade nicht abgeschlossen werden. Bitte versuche den Link noch einmal oder schreibe an hi@ugc-vz.de.'}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-hairline bg-white shadow-[0_24px_80px_rgba(35,22,47,0.10)]">
        <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="relative overflow-hidden bg-[#17121d] p-7 text-white sm:p-10">
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-geo-violet/30 blur-3xl" />
            <div className="absolute -bottom-20 -left-12 h-52 w-52 rounded-full bg-geo-green/20 blur-3xl" />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-geo-green">Dein kostenloses Profil</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight">Von Brands gefunden werden – ohne Provision.</h2>
              <p className="mt-4 text-sm leading-6 text-white/70">In etwa 5 Minuten. Deine privaten Kontaktdaten bleiben geschützt und werden nur bei konkreten Anfragen genutzt.</p>

              <div className="mt-9 space-y-5">
                {steps.map((item, index) => (
                  <div key={item.title} className="flex gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${index < step ? 'border-geo-green bg-geo-green text-ink' : index === step ? 'border-white bg-white text-ink' : 'border-white/25 text-white/50'}`}>
                      {index < step ? <Check size={16} /> : index + 1}
                    </span>
                    <div><p className={index <= step ? 'font-semibold text-white' : 'font-semibold text-white/45'}>{item.title}</p><p className="mt-0.5 text-xs text-white/45">{item.description}</p></div>
                  </div>
                ))}
              </div>

              <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-5 text-white/60">
                <ShieldCheck className="mb-2 text-geo-green" size={20} />
                Keine vollständige Anschrift. Kein vollständiges Geburtsdatum. Newsletter nur mit eigener, freiwilliger Einwilligung.
              </div>
            </div>
          </aside>

          <div className="p-6 sm:p-10">
            {submitted ? (
              <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-geo-violet/10 text-geo-violet"><Mail size={30} /></span>
                <p className="mt-6 text-sm font-bold uppercase tracking-[0.15em] text-geo-violet">Fast geschafft</p>
                <h2 className="mt-3 text-3xl font-bold">Prüfe jetzt dein Postfach</h2>
                <p className="mt-4 max-w-md leading-7 text-ink-soft">Wir haben dir einen Bestätigungslink geschickt. Ein Klick aktiviert dein kostenloses Creator-Profil.</p>
                <p className="mt-5 rounded-xl bg-surface px-4 py-3 text-sm text-ink-soft">Keine E-Mail? Prüfe bitte auch Spam und Werbung. Der Link ist 24 Stunden gültig.</p>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <div className="mb-8">
                  <div className="flex items-center justify-between text-xs font-semibold text-ink-soft"><span>Schritt {step + 1} von {steps.length}</span><span>{progress}%</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-gradient-to-r from-geo-violet to-geo-green transition-all duration-300" style={{ width: `${progress}%` }} /></div>
                  <h2 className="mt-6 text-2xl font-bold sm:text-3xl">{steps[step].title}</h2>
                  <p className="mt-2 text-ink-soft">{steps[step].description}</p>
                </div>

                {step === 0 && (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label><span className={labelClass}>Vor- und Nachname *</span><input className={fieldClass} value={form.name} onChange={(e) => update('name', e.target.value)} autoComplete="name" maxLength={120} required /></label>
                    <label><span className={labelClass}>Künstlername</span><input className={fieldClass} value={form.stageName} onChange={(e) => update('stageName', e.target.value)} maxLength={120} placeholder="Optional" /></label>
                    <label className="sm:col-span-2"><span className={labelClass}>E-Mail-Adresse *</span><input type="email" className={fieldClass} value={form.email} onChange={(e) => update('email', e.target.value)} autoComplete="email" maxLength={254} placeholder="du@beispiel.de" required /><span className="mt-2 block text-xs text-ink-soft">Wir senden dir einmalig einen Link zur Bestätigung.</span></label>
                    <label><span className={labelClass}>Geburtsjahr</span><input type="number" min="1930" max={new Date().getFullYear() - 16} className={fieldClass} value={form.birthYear} onChange={(e) => update('birthYear', e.target.value)} inputMode="numeric" placeholder="z. B. 1995" /></label>
                    <label><span className={labelClass}>Geschlecht</span><select className={fieldClass} value={form.gender} onChange={(e) => update('gender', e.target.value)}><option value="">Keine Angabe</option><option>Weiblich</option><option>Männlich</option><option>Divers</option><option>Selbstbeschreibung</option></select></label>
                    <label className="sm:col-span-2"><span className={labelClass}>Stadt / Region</span><input className={fieldClass} value={form.city} onChange={(e) => update('city', e.target.value)} autoComplete="address-level2" maxLength={120} placeholder="z. B. Berlin oder Rhein-Main" /><span className="mt-2 block text-xs text-ink-soft">Keine Straße oder vollständige Privatanschrift nötig.</span></label>
                  </div>
                )}

                {step === 1 && (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="sm:col-span-2"><span className={labelClass}>Themen und Interessen *</span><textarea className={`${fieldClass} min-h-28`} value={form.topics} onChange={(e) => update('topics', e.target.value)} maxLength={1200} placeholder="Beauty, Food, Family, Fitness, Tech …" required /></label>
                    <label className="sm:col-span-2"><span className={labelClass}>Welche Inhalte erstellst du am liebsten? *</span><textarea className={`${fieldClass} min-h-28`} value={form.preferredContent} onChange={(e) => update('preferredContent', e.target.value)} maxLength={1200} placeholder="Produktdemo, Testimonial, Voiceover, Reels, Fotos …" required /></label>
                    <label><span className={labelClass}>Branchen / Erfahrung</span><textarea className={`${fieldClass} min-h-24`} value={form.industries} onChange={(e) => update('industries', e.target.value)} maxLength={1200} /></label>
                    <label><span className={labelClass}>Preisvorstellung *</span><textarea className={`${fieldClass} min-h-24`} value={form.rateText} onChange={(e) => update('rateText', e.target.value)} maxLength={500} placeholder="z. B. Video ab 180 €, Paket nach Absprache" required /></label>
                    <label><span className={labelClass}>Reichweite pro Netzwerk</span><textarea className={`${fieldClass} min-h-24`} value={form.reachText} onChange={(e) => update('reachText', e.target.value)} maxLength={500} placeholder="Instagram 2.400, TikTok 5.100" /></label>
                    <label><span className={labelClass}>Ausrüstung</span><textarea className={`${fieldClass} min-h-24`} value={form.equipment} onChange={(e) => update('equipment', e.target.value)} maxLength={1000} placeholder="Smartphone, Licht, Mikrofon …" /></label>
                    <label><span className={labelClass}>Besondere Merkmale</span><textarea className={`${fieldClass} min-h-24`} value={form.specialTraits} onChange={(e) => update('specialTraits', e.target.value)} maxLength={1000} /></label>
                    <label><span className={labelClass}>Kinder / Family-Content</span><textarea className={`${fieldClass} min-h-24`} value={form.childrenContext} onChange={(e) => update('childrenContext', e.target.value)} maxLength={700} placeholder="Optional, keine Namen nötig" /></label>
                    <label><span className={labelClass}>Tiere / Pet-Content</span><textarea className={`${fieldClass} min-h-24`} value={form.petContext} onChange={(e) => update('petContext', e.target.value)} maxLength={700} /></label>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <label><span className={labelClass}>Social-Links *</span><textarea className={`${fieldClass} min-h-32`} value={form.socialLinks} onChange={(e) => update('socialLinks', e.target.value)} placeholder={'https://instagram.com/deinprofil\nhttps://tiktok.com/@deinprofil'} required /><span className="mt-2 block text-xs text-ink-soft">Ein vollständiger Link pro Zeile, maximal 8.</span></label>
                    <label><span className={labelClass}>Portfolio und Arbeitsproben</span><textarea className={`${fieldClass} min-h-28`} value={form.portfolioLinks} onChange={(e) => update('portfolioLinks', e.target.value)} placeholder={'Canva-, Drive-, Website- oder Video-Link\nEin Link pro Zeile'} /><span className="mt-2 block text-xs text-ink-soft">Maximal 8 Links. Bitte nur Inhalte teilen, die Brands sehen dürfen.</span></label>

                    <div className="rounded-2xl border border-hairline bg-surface p-5 space-y-4">
                      <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" className="mt-1 h-4 w-4 accent-geo-violet" checked={form.platformConsent} onChange={(e) => update('platformConsent', e.target.checked)} /><span className="text-sm leading-6 text-ink-soft"><strong className="text-ink">Pflicht:</strong> Ich stimme der Verarbeitung meiner Angaben zur Erstellung und Darstellung meines UGC-VZ-Profils gemäß der <Link href="/datenschutz" className="font-semibold text-geo-violet underline">Datenschutzerklärung</Link> zu. Öffentliche Profilangaben umfassen unter anderem Name/Künstlername, Region, Themen, Portfolio, Social-Links, Reichweite und Preisangaben.</span></label>
                      <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" className="mt-1 h-4 w-4 accent-geo-violet" checked={form.projectConsent} onChange={(e) => update('projectConsent', e.target.checked)} /><span className="text-sm leading-6 text-ink-soft"><strong className="text-ink">Pflicht:</strong> UGC VZ darf mich bei konkreten passenden Brand-Anfragen per E-Mail informieren und meine hinterlegten Kontaktdaten an die anfragende Brand übermitteln. Ich kann dies jederzeit widerrufen.</span></label>
                      <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" className="mt-1 h-4 w-4 accent-geo-violet" checked={form.newsletterConsent} onChange={(e) => update('newsletterConsent', e.target.checked)} /><span className="text-sm leading-6 text-ink-soft"><strong className="text-ink">Optional:</strong> Ich möchte gelegentliche UGC-VZ-Updates per E-Mail erhalten. Diese Einwilligung ist unabhängig vom Profil und jederzeit widerrufbar.</span></label>
                    </div>

                    <label className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update('website', e.target.value)} /></label>
                  </div>
                )}

                {message && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{message}</div>}

                <div className="mt-8 flex items-center justify-between gap-4">
                  {step > 0 ? <button type="button" onClick={() => setStep((current) => current - 1)} className="inline-flex items-center gap-2 rounded-xl border border-hairline px-5 py-3 font-semibold text-ink transition hover:bg-surface"><ArrowLeft size={18} /> Zurück</button> : <span />}
                  {step < steps.length - 1 ? (
                    <button type="button" onClick={next} className="inline-flex items-center gap-2 rounded-xl bg-geo-violet px-6 py-3 font-semibold text-white transition hover:bg-geo-violet-soft">Weiter <ArrowRight size={18} /></button>
                  ) : (
                    <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-geo-violet px-6 py-3 font-semibold text-white transition hover:bg-geo-violet-soft disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Wird gespeichert …' : 'Kostenloses Profil anlegen'} <Sparkles size={18} /></button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

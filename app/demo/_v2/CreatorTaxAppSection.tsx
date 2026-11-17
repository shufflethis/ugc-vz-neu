'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Bell,
  Check,
  Coins,
  Receipt,
  Sparkles,
} from 'lucide-react';
import type { DemoSection } from './data';

const GRADIENT =
  'linear-gradient(152deg, #0396F8 0%, #1F6FF4 25%, #3F58F2 50%, #653AED 75%, #9131EF 100%)';

interface Props {
  onNavigate: (section: DemoSection) => void;
}

export default function CreatorTaxAppSection({ onNavigate }: Props) {
  const [step, setStep] = useState<'register' | 'after-signup'>('register');
  const [name, setName] = useState('Mia');
  const [city, setCity] = useState('Berlin');
  const [email, setEmail] = useState('mia@beispiel-creator.de');
  const [socialUrl, setSocialUrl] = useState('https://www.tiktok.com/@mia.berlin');
  const [topics, setTopics] = useState('Beauty, Skincare, Alltag & Food');

  return (
    <div className="px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <div className="mx-auto max-w-4xl">
        {/* Kleiner Demo-Umschalter zwischen Schritt 1 (Anmeldung) und Schritt 2 (Nach Anmeldung -> Geld verdienen Hinweis) */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setStep('register')}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
              step === 'register'
                ? 'bg-void text-white'
                : 'border border-hairline bg-surface text-ink-soft hover:text-ink'
            }`}
          >
            Schritt 1 · Kostenlose Profil-Anmeldung
          </button>
          <button
            type="button"
            onClick={() => setStep('after-signup')}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
              step === 'after-signup'
                ? 'bg-geo-violet text-white'
                : 'border border-hairline bg-surface text-ink-soft hover:text-ink'
            }`}
          >
            Schritt 2 · Nach Anmeldung („Direkt Geld verdienen &amp; Login“)
          </button>
        </div>

        {step === 'register' ? (
          <section className="space-y-10">
            <div className="text-center">
              <p className="font-semibold text-geo-violet">Kostenloses Creator-Verzeichnis</p>
              <h1 className="mt-3 text-4xl font-bold tracking-[-0.045em] text-ink sm:text-5xl">
                Als{' '}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRADIENT }}>
                  UGC Creator
                </span>{' '}
                anmelden
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-ink-soft sm:text-lg">
                Lege kostenlos dein Profil an, damit Marken dich finden – und erhalte gleichzeitig Zugang zu unserem Creator-Bereich, in dem du dir selbst bezahlte Kampagnen picken kannst.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep('after-signup');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="mx-auto max-w-2xl space-y-5 rounded-3xl border border-hairline bg-white p-6 shadow-[0_24px_70px_rgba(35,22,47,0.07)] sm:p-8"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink">Vorname / Creator-Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="min-h-[46px] w-full rounded-xl border border-hairline bg-surface px-3.5 text-sm text-ink outline-none focus:border-geo-violet focus:bg-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink">Stadt</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="min-h-[46px] w-full rounded-xl border border-hairline bg-surface px-3.5 text-sm text-ink outline-none focus:border-geo-violet focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink">E-Mail (für Brand-Anfragen &amp; deinen Creator-Login)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-h-[46px] w-full rounded-xl border border-hairline bg-surface px-3.5 text-sm text-ink outline-none focus:border-geo-violet focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink">Wichtigster Social- oder Portfolio-Link</label>
                <input
                  type="text"
                  required
                  value={socialUrl}
                  onChange={(e) => setSocialUrl(e.target.value)}
                  className="min-h-[46px] w-full rounded-xl border border-hairline bg-surface px-3.5 text-sm text-ink outline-none focus:border-geo-violet focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink">Deine Themen &amp; Nischen</label>
                <input
                  type="text"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  className="min-h-[46px] w-full rounded-xl border border-hairline bg-surface px-3.5 text-sm text-ink outline-none focus:border-geo-violet focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-geo-violet px-6 text-sm font-bold text-white shadow-[0_14px_30px_rgba(139,63,202,0.3)] hover:bg-[#7531ae]"
              >
                Kostenloses Profil anlegen &amp; weiter <ArrowRight size={16} />
              </button>

              <p className="text-center text-xs text-ink-soft">
                Schon angemeldet?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('konto')}
                  className="font-bold text-geo-violet underline underline-offset-4"
                >
                  Direkt zum Creator-Login →
                </button>
              </p>
            </form>
          </section>
        ) : (
          /* SCHRITT 2: NACH DER ANMELDUNG -> "DU KANNST AUCH DIREKT GELD VERDIENEN!" + WEITER INS KONTO */
          <section className="space-y-8">
            <div className="rounded-[36px] border border-[#dce9d1] bg-[#edf5e5] p-7 text-center sm:p-10">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#385523] text-white">
                <Check size={24} />
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Willkommen, {name}! Dein Profil ist im Verzeichnis.
              </h1>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#2b421a] sm:text-base">
                Marken können dich ab jetzt kostenlos finden und anfragen.{' '}
                <strong>Aber du musst nicht warten, bis sich jemand meldet:</strong>
              </p>
            </div>

            <div className="rounded-[36px] bg-void p-7 text-white sm:p-10">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-geo-green">
                Neu in deinem Creator-Konto
              </p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                Du kannst ab sofort direkt aktive Kampagnen picken &amp; Geld verdienen
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
                Logg dich in deinen Creator-Bereich ein, such dir passende Marken-Kampagnen aus und starte sofort – auch mit kleiner Reichweite:
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                  <Coins size={20} className="text-geo-green" />
                  <h3 className="mt-3 text-sm font-bold">1 · TKP-Kampagnen picken</h3>
                  <p className="mt-1 text-xs leading-5 text-white/70">
                    Verdiene z. B. 2,00 € bis 5,00 € pro 1.000 echte Views auf TikTok, Reels &amp; Shorts (+10 € Starter-Bonus aufs 1. Video).
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                  <Sparkles size={20} className="text-[#62B4FF]" />
                  <h3 className="mt-3 text-sm font-bold">2 · Provisions-Deals &amp; Produkte</h3>
                  <p className="mt-1 text-xs leading-5 text-white/70">
                    Sichere dir eigene Rabattcodes &amp; Produktpakete bei Partner-Brands und verdiene an jedem Verkauf mit.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                  <Receipt size={20} className="text-geo-violet-soft" />
                  <h3 className="mt-3 text-sm font-bold">3 · SEPA, Push &amp; Steuer-Hilfe</h3>
                  <p className="mt-1 text-xs leading-5 text-white/70">
                    Auszahlung in Euro aufs Girokonto, automatische Gutschriften &amp; Push-Info bei neuen Kampagnen.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => onNavigate('konto')}
                  className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-geo-green px-7 text-sm font-extrabold text-void transition-transform hover:-translate-y-0.5 sm:w-auto"
                >
                  Jetzt in meinen Creator-Bereich &amp; Kampagnen picken <ArrowRight size={16} />
                </button>
                <span className="inline-flex items-center gap-1.5 text-xs text-white/65">
                  <Bell size={14} className="text-geo-green" /> Push-Benachrichtigungen im Konto aktivierbar
                </span>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

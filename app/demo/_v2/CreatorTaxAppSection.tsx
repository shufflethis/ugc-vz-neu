'use client';

import { useState } from 'react';
import {
  Bell,
  Check,
  CheckCircle2,
  Coins,
  ExternalLink,
  FileCheck2,
  Flame,
  Receipt,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react';
import type { DemoSection } from './data';

const GRADIENT =
  'linear-gradient(152deg, #0396F8 0%, #1F6FF4 25%, #3F58F2 50%, #653AED 75%, #9131EF 100%)';

interface Props {
  onNavigate: (section: DemoSection) => void;
}

type TaxProfile = 'nebenjob' | 'kleinunternehmer' | 'regelbesteuert';

const SAMPLE_PUSHES = [
  {
    title: '🔥 Neues 5.000 € Bounty live!',
    body: 'Urban Drop zahlt 3,50 € / 1.000 Views + Gratis-Hoodie. Noch 92 % Budget im Topf.',
    tag: 'Vor 1 Min · Sofort teilnehmen',
  },
  {
    title: '💸 +28,00 € gutgeschrieben',
    body: 'Dein Morning-Coffee Reel hat 7.000 verifizierte Views geknackt. Beleg liegt im Steuer-Tab bereit.',
    tag: 'Gerade eben · Euro-Guthaben aktualisiert',
  },
  {
    title: '🎁 +10,00 € Starter-Bonus aktiviert!',
    body: 'Dein erstes UGC-VZ Video hat die 2.500-Views-Marke erreicht. Auszahlung jederzeit abrufbar.',
    tag: 'Meilenstein erreicht',
  },
];

export default function CreatorTaxAppSection({ onNavigate }: Props) {
  const [monthlyGross, setMonthlyGross] = useState<number>(450);
  const [taxProfile, setTaxProfile] = useState<TaxProfile>('kleinunternehmer');
  const [pushFeed, setPushFeed] = useState(SAMPLE_PUSHES.slice(0, 2));
  const [pushCounter, setPushCounter] = useState<number>(2);
  const [taxExportDone, setTaxExportDone] = useState<boolean>(false);

  const reserveRate =
    taxProfile === 'nebenjob' ? 0.18 : taxProfile === 'kleinunternehmer' ? 0.22 : 0.3;
  const recommendedReserve = Math.round(monthlyGross * reserveRate);
  const netInPocket = monthlyGross - recommendedReserve;
  const classicAdvisorMonthly = 160; // Why small creators in Germany hate filing!
  const autopilotMonthly = 12;

  const triggerNextPush = () => {
    const nextItem = SAMPLE_PUSHES[pushCounter % SAMPLE_PUSHES.length];
    setPushFeed((prev) => [
      { ...nextItem, tag: `Live-Test #${pushCounter + 1} · Jetzt` },
      ...prev.slice(0, 3),
    ]);
    setPushCounter((c) => c + 1);
  };

  return (
    <div className="space-y-16 px-5 pb-20 pt-10 sm:px-8">
      {/* HERO */}
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-hairline bg-surface p-6 sm:p-10">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold text-white"
            style={{ background: GRADIENT }}
          >
            <Zap size={13} /> Für Creator in DACH · 0 % Provision + Steuer-Autopilot + Push-App
          </span>
          <h1 className="mt-4 max-w-4xl text-3xl font-bold leading-tight tracking-[-0.045em] text-ink sm:text-5xl">
            Verdiene mit Views & Produkten –{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRADIENT }}>
              ohne dass der Steuerberater alles auffrisst.
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-soft sm:text-base">
            Das größte Problem in Deutschland bei 100 € bis 800 € Creator-Nebeneinnahmen war bisher der Papierkram: Rechnungen, Kleinunternehmer-Regelung und teure Steuerberater. Wir lösen beides in einem Hub – inklusive App-Push für neue Bounties.
          </p>
        </div>
      </section>

      {/* SECTION 1: GERMAN TAX AUTOPILOT USP (Accountable Partnership Blueprint) */}
      <section className="mx-auto max-w-6xl rounded-[36px] border border-hairline bg-white p-6 shadow-[0_24px_70px_rgba(35,22,47,0.06)] sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#edf5e5] px-3 py-1 text-xs font-bold text-[#385523]">
              <Receipt size={14} /> Deutscher Unique Selling Point · Steuer- & Rechnungs-Autopilot
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              1-Klick Gutschriften & direkter Steuer-Sync (Partner-Integration wie Accountable)
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              Wer in Deutschland 300 € mit drei Videos verdient, zahlt beim klassischen Steuerberater oft mehr Gebühr, als am Ende übrig bleibt. Deshalb erstellen wir für jede SEPA-/Stripe-Auszahlung automatisch einen sauberen Gutschriftsbeleg und übergeben ihn per 1-Klick an eine KI-Steuer-App für Selbstständige.
            </p>

            {/* Interactive Tax & Net Calculator */}
            <div className="mt-6 space-y-4 rounded-2xl border border-hairline bg-surface p-5">
              <div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-ink">Deine monatlichen UGC- & Bounty-Einnahmen</span>
                  <span className="font-mono text-sm font-extrabold text-geo-violet">
                    {monthlyGross.toLocaleString('de-DE')} € / Monat
                  </span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={3500}
                  step={50}
                  value={monthlyGross}
                  onChange={(e) => setMonthlyGross(Number(e.target.value))}
                  className="mt-2 w-full accent-geo-violet"
                />
              </div>

              <div>
                <p className="text-xs font-bold text-ink">Dein Setup in Deutschland:</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {(
                    [
                      ['nebenjob', 'Studium / Nebenjob'],
                      ['kleinunternehmer', 'Kleinunternehmer (§19)'],
                      ['regelbesteuert', 'Vollzeit (+ USt.)'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTaxProfile(key)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                        taxProfile === key
                          ? 'border-geo-violet bg-geo-violet text-white'
                          : 'border-hairline bg-white text-ink hover:border-geo-violet'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-[11px] text-ink-soft">Auszahlung (0 % Fee)</p>
                  <p className="mt-1 text-lg font-extrabold text-ink">{monthlyGross} €</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-[11px] text-ink-soft">Empf. Steuerrücklage</p>
                  <p className="mt-1 text-lg font-extrabold text-ink-soft">~{recommendedReserve} €</p>
                </div>
                <div className="rounded-xl bg-[#edf5e5] p-3">
                  <p className="text-[11px] font-semibold text-[#385523]">Frei verfügbar*</p>
                  <p className="mt-1 text-lg font-extrabold text-[#385523]">~{netInPocket} €</p>
                </div>
              </div>
              <p className="text-[11px] text-ink-soft">
                *Unverbindlicher Orientierungswert für deine Rücklagen-Planung – ersetzt keine Steuerberatung.
              </p>
            </div>
          </div>

          {/* Right Comparison: Classic Advisor vs Accountable Partner Flow */}
          <div className="flex flex-col justify-between rounded-3xl bg-void p-6 text-white sm:p-8">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-geo-green">
                Partner-Vorteil · UGC VZ × Steuer-App (z. B. Accountable)
              </p>
              <h3 className="mt-2 text-xl font-bold">
                Warum Creator wegen unseres Steuer-Flows bleiben
              </h3>

              <div className="mt-5 space-y-3 text-xs">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-bold text-red-300">
                    ✕ Ohne Autopilot (Klassischer Steuerberater)
                  </p>
                  <p className="mt-1 text-white/70">
                    Bei {monthlyGross} € Monatsverdienst frisst ein Berater (~{classicAdvisorMonthly} €/Monat bzw. Jahresabschluss-Mindestgebühr) sofort{' '}
                    <strong className="text-white">
                      {Math.min(100, Math.round((classicAdvisorMonthly / monthlyGross) * 100))} % deiner Einnahmen
                    </strong>{' '}
                    wieder auf.
                  </p>
                </div>

                <div className="rounded-2xl border border-geo-green/40 bg-geo-green/10 p-4">
                  <p className="font-bold text-geo-green">
                    ✓ Mit UGC VZ Gutschrift + Steuer-Partner (~{autopilotMonthly} €/Monat)
                  </p>
                  <ul className="mt-2 space-y-1.5 text-white/85">
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-geo-green" /> Automatische Gutschrifts-PDF pro Kampagne (§19 oder inkl. 19 % USt.)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-geo-green" /> 1-Klick CSV/API-Übergabe für EÜR, USt.-Voranmeldung & Einkommensteuer
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-geo-green" /> Auch Sachprämien / Produkt-Seeding sauber dokumentiert
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={() => setTaxExportDone(true)}
                className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-geo-green px-5 text-xs font-extrabold text-void hover:opacity-95"
              >
                <FileCheck2 size={16} />
                {taxExportDone
                  ? '✓ Beispiel-Gutschrift & Accountable-Sync bereit!'
                  : '1-Klick Steuer-Belegpaket in der Demo testen'}
              </button>
              <a
                href="https://www.accountable.de/partners/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 text-[11px] text-white/60 hover:text-white"
              >
                Partner-Referenz: accountable.de/partners <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: MOBILE WEBAPP & PUSH NOTIFICATION ENGINE */}
      <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        {/* Interactive Phone Mockup */}
        <div className="mx-auto w-full max-w-[390px] rounded-[42px] border-[8px] border-ink bg-void p-5 text-white shadow-2xl">
          <div className="mx-auto mb-4 h-1.5 w-20 rounded-full bg-white/20" />
          <div className="flex items-center justify-between text-xs text-white/70">
            <span className="font-mono font-bold text-white">UGC VZ App</span>
            <span className="rounded-full bg-geo-green/20 px-2.5 py-0.5 text-[10px] font-bold text-geo-green">
              Push aktiv · Streak: 5 Tage 🔥
            </span>
          </div>

          <div
            className="mt-4 rounded-2xl p-4 text-white"
            style={{ background: GRADIENT }}
          >
            <p className="text-[11px] uppercase tracking-wider text-white/80">Verfügbares Guthaben</p>
            <p className="mt-1 text-3xl font-extrabold">184,50 €</p>
            <div className="mt-3 flex gap-2 text-[11px] font-bold">
              <span className="rounded-lg bg-white/20 px-2.5 py-1">Sofort-SEPA</span>
              <span className="rounded-lg bg-white/20 px-2.5 py-1">+15 % als Produkt-Box</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-white/90">Live Push-Feed</p>
              <button
                type="button"
                onClick={triggerNextPush}
                className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-void hover:bg-geo-green"
              >
                <Bell size={12} /> Push testen
              </button>
            </div>

            <div className="mt-2.5 space-y-2">
              {pushFeed.map((item, idx) => (
                <div
                  key={`${item.title}-${idx}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.07] p-3 text-xs"
                >
                  <p className="font-bold text-white">{item.title}</p>
                  <p className="mt-1 leading-5 text-white/75">{item.body}</p>
                  <p className="mt-1.5 font-mono text-[10px] text-geo-green">{item.tag}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Copy: Sticky Notifications + Apple 30% Fee Solution */}
        <div className="space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3.5 py-1.5 text-xs font-bold text-ink">
            <Smartphone size={14} className="text-geo-violet" /> App-First Bindung & Push-Engine
          </span>
          <h2 className="text-3xl font-bold leading-tight tracking-[-0.04em] text-ink sm:text-4xl">
            E-Mails gehen unter. Push-Drops aktivieren Creator in Minuten.
          </h2>
          <p className="text-sm leading-6 text-ink-soft sm:text-base">
            Sobald eine Marke ein neues 5.000-€-Bounty oder ein Produkt-Seeding freischaltet, erhalten passende Creator sofort eine Push-Benachrichtigung aufs Handy – inklusive Restbudget-Countdown und 1-Tap-Teilnahme.
          </p>

          <div className="space-y-3">
            <div className="rounded-2xl border border-hairline bg-white p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-ink">
                <CheckCircle2 size={16} className="text-[#527b33]" /> Schritt 1 (Sofort live): Installierbare Web-App (PWA) mit iOS/Android Web-Push
              </p>
              <p className="mt-1 text-xs leading-5 text-ink-soft">
                0 % Apple/Google-Abzug, sofort ohne App-Store-Review nutzbar, direkter Homescreen-Icon & Echtzeit-Notifications.
              </p>
            </div>

            <div className="rounded-2xl border border-hairline bg-white p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-ink">
                <ShieldCheck size={16} className="text-geo-violet" /> Schritt 2 (Native iOS/Android App): Clevere Gebühren-Trennung wie bei Twitch & X
              </p>
              <p className="mt-1 text-xs leading-5 text-ink-soft">
                Creator-Auszahlungen sind zu 100 % gebührenfrei. Lädt eine Brand ihr Kampagnenbudget am Desktop auf: regulärer Preis – nur bei In-App-Käufen über Apple wird die Store-Gebühr transparent aufgeschlagen.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('bounties')}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-geo-violet px-6 text-sm font-bold text-white hover:bg-[#7531ae]"
            >
              <Flame size={16} /> Aktive Bounties (+10 € Starter-Bonus) ansehen
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Coins,
  Copy,
  FileCheck2,
  Mail,
  Receipt,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { BOUNTY_CAMPAIGNS } from './data';

const GRADIENT =
  'linear-gradient(152deg, #0396F8 0%, #1F6FF4 25%, #3F58F2 50%, #653AED 75%, #9131EF 100%)';

interface PartnerProgram {
  id: string;
  brand: string;
  category: string;
  title: string;
  summary: string;
  commission: string;
  perks: string;
  code: string;
}

const PARTNER_PROGRAMS: PartnerProgram[] = [
  {
    id: 'partner-dailyfuel',
    brand: 'DailyFuel Nutrition (Beispiel)',
    category: 'Affiliate & Produkt-Seeding · Level 1–5',
    title: 'Dauerhafte Creator-Partnerschaft (Rabattcode + Gratis-Produkte)',
    summary:
      'Keine Mindest-Followerzahl: Du erhältst eine Starter-Box, deinen eigenen 10-%-Code und steigst über Verkäufe von Level 1 bis Level 5 auf. Guthaben kannst du mit +20 % Bonus direkt gegen neue Produkte tauschen oder in Euro auszahlen.',
    commission: '12–18 % Provision + Produktpaket',
    perks: 'Ab 500 Followern · Tägliche Alltags-Reels',
    code: 'MIA10',
  },
  {
    id: 'partner-taxapp',
    brand: 'Steuer-Tool für Selbstständige (Beispiel)',
    category: 'Software-Affiliate · Wiederkehrend',
    title: 'Empfehlungs-Partner für Creator & Freelancer',
    summary:
      'Zeig in ehrlichen Behind-the-Scenes-Videos, wie du deine UGC-Einnahmen abrechnest, und verdiene an jedem vermittelten Jahresabo dauerhaft mit.',
    commission: '25 % Provision pro Abo',
    perks: 'Eigener Tracking-Link + kostenloser Pro-Zugang',
    code: 'MIA-TAX',
  },
];

interface Props {
  pickedIds: string[];
  onTogglePick: (id: string) => void;
  submittedClips: { campaignId: string; url: string; payout: number; status: 'verified' | 'flagged' }[];
  onSubmitClip: (entry: { campaignId: string; url: string; payout: number; status: 'verified' | 'flagged' }) => void;
}

export default function CreatorKontoSection({
  pickedIds,
  onTogglePick,
  submittedClips,
  onSubmitClip,
}: Props) {
  const [authView, setAuthView] = useState<'logged-in' | 'login-screen'>('logged-in');
  const [activeTab, setActiveTab] = useState<'pick' | 'active' | 'payout' | 'profile'>('pick');
  const [filterKind, setFilterKind] = useState<'all' | 'tkp' | 'affiliate'>('all');
  const [loginEmail, setLoginEmail] = useState('mia@beispiel-creator.de');

  // Submission state inside "Meine gepickten Kampagnen"
  const [selectedCampaignForLink, setSelectedCampaignForLink] = useState<string>(BOUNTY_CAMPAIGNS[0].id);
  const [videoUrl, setVideoUrl] = useState<string>('https://www.tiktok.com/@mia.berlin/video/7439182910');
  const [simulatedViews, setSimulatedViews] = useState<number>(12000);
  const [botTest, setBotTest] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Tax helper state inside "Auszahlung & Steuern"
  const [monthlyEuro, setMonthlyEuro] = useState<number>(450);
  const [taxSavedMsg, setTaxSavedMsg] = useState<boolean>(false);

  const verifiedEarnings = submittedClips
    .filter((c) => c.status === 'verified')
    .reduce((sum, c) => sum + c.payout, 0);

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const camp = BOUNTY_CAMPAIGNS.find((b) => b.id === selectedCampaignForLink) || BOUNTY_CAMPAIGNS[0];
    if (botTest) {
      onSubmitClip({ campaignId: camp.id, url: videoUrl, payout: 0, status: 'flagged' });
      return;
    }
    const base = (simulatedViews / 1000) * camp.cpmEuro;
    const bonus =
      camp.isOwnCampaign &&
      simulatedViews >= 2500 &&
      !submittedClips.some((c) => c.campaignId === 'ugcvz-launch' && c.status === 'verified')
        ? 10
        : 0;
    const payout = Math.min(camp.maxPayoutPerVideo, Number((base + bonus).toFixed(2)));
    onSubmitClip({ campaignId: camp.id, url: videoUrl, payout, status: 'verified' });
  };

  if (authView === 'login-screen') {
    return (
      <div className="px-5 pb-24 pt-12 sm:px-8">
        <div className="mx-auto max-w-md rounded-3xl border border-hairline bg-white p-8 shadow-[0_24px_80px_rgba(35,22,47,0.08)]">
          <div className="text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-geo-violet/10 text-geo-violet">
              <Mail size={22} />
            </span>
            <h1 className="mt-4 text-2xl font-bold text-ink">Creator-Login</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Wie beim bestehenden <code className="text-ink">/konto</code> per E-Mail-Link einloggen – um dein Profil zu pflegen und aktive Kampagnen zu picken.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setAuthView('logged-in');
            }}
            className="mt-6 space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink">Deine Creator-E-Mail</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="min-h-[46px] w-full rounded-xl border border-hairline bg-surface px-3.5 text-sm text-ink"
              />
            </div>
            <button
              type="submit"
              className="min-h-[46px] w-full rounded-full bg-geo-violet text-sm font-bold text-white hover:bg-[#7531ae]"
            >
              In der Demo direkt einloggen →
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 px-5 pb-20 pt-8 sm:px-8">
      {/* KOPFZEILE DES EINGELOGGTEN CREATOR-BEREICHS */}
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-hairline bg-surface p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-white"
              style={{ background: GRADIENT }}
            >
              MI
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-ink">Hallo Mia · Dein Creator-Bereich</h1>
                <span className="rounded-full bg-[#edf5e5] px-2.5 py-0.5 text-xs font-bold text-[#385523]">
                  ● Verzeichnis-Profil aktiv
                </span>
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                Pick dir passende TKP-Kampagnen &amp; Provisions-Partnerschaften oder verwalte dein öffentliches Profil.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-hairline bg-white px-4 py-2.5 text-right">
              <p className="text-[11px] text-ink-soft">Auszahlbar (Euro / SEPA)</p>
              <p className="text-lg font-extrabold text-[#385523]">
                {(42.5 + verifiedEarnings).toFixed(2).replace('.', ',')} €
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAuthView('login-screen')}
              className="rounded-full border border-hairline bg-white px-3.5 py-2 text-xs font-semibold text-ink-soft hover:text-ink"
            >
              Login-Maske zeigen
            </button>
          </div>
        </div>

        {/* 4 KLARE TABS IM CREATOR-KONTO */}
        <div className="mt-5 flex flex-wrap gap-2 border-b border-hairline pb-4">
          {(
            [
              ['pick', `1 · Kampagnen picken (${BOUNTY_CAMPAIGNS.length + PARTNER_PROGRAMS.length})`],
              ['active', `2 · Meine gepickten Deals (${pickedIds.length})`],
              ['payout', '3 · Auszahlung & Steuer-Belege'],
              ['profile', '4 · Mein Verzeichnis-Profil'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-colors sm:text-sm ${
                activeTab === id
                  ? 'bg-void text-white'
                  : 'bg-surface text-ink-soft hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* TAB 1: KAMPAGNEN PICKEN (TKP + AFFILIATE PARTNERSCHAFTEN) */}
      {activeTab === 'pick' && (
        <section className="mx-auto max-w-6xl space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['all', 'Alle Kampagnen'],
                  ['tkp', 'TKP-Kampagnen (Geld pro 1.000 Views)'],
                  ['affiliate', 'Provisions-Partnerschaften (Codes & Produkte)'],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFilterKind(k)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
                    filterKind === k
                      ? 'border-geo-violet bg-geo-violet text-white'
                      : 'border-hairline bg-white text-ink hover:border-geo-violet'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-soft">
              Klicke auf <strong>„Kampagne picken“</strong>, um dir das Briefing &amp; Budget in deinem Konto zu sichern.
            </p>
          </div>

          {/* A) TKP-KAMPAGNEN */}
          {(filterKind === 'all' || filterKind === 'tkp') && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-ink">
                TKP-Kampagnen · Verdiene pro 1.000 echte Views
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {BOUNTY_CAMPAIGNS.map((b) => {
                  const picked = pickedIds.includes(b.id);
                  const remaining = b.totalBudget - b.spentBudget;
                  const pct = Math.round((b.spentBudget / b.totalBudget) * 100);
                  return (
                    <article
                      key={b.id}
                      className={`flex flex-col justify-between rounded-3xl border p-5 transition-colors ${
                        picked ? 'border-geo-violet bg-[#FBF8FE]' : 'border-hairline bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-ink-soft">
                            {b.brand} · {b.type}
                          </span>
                          <span className="rounded-xl bg-[#edf5e5] px-2.5 py-1 text-xs font-extrabold text-[#385523]">
                            {b.cpmEuro.toFixed(2).replace('.', ',')} € / 1.000 Views
                          </span>
                        </div>
                        <h3 className="mt-2 text-base font-bold text-ink">{b.title}</h3>
                        <p className="mt-1 text-xs leading-5 text-ink-soft">{b.summary}</p>
                        {b.starterBonus && (
                          <p className="mt-2 inline-block rounded-lg bg-geo-violet/10 px-2.5 py-1 text-[11px] font-bold text-geo-violet">
                            🎁 {b.starterBonus}
                          </p>
                        )}
                      </div>

                      <div className="mt-5 border-t border-hairline pt-3.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-ink-soft">
                            Noch <strong className="text-ink">{remaining.toLocaleString('de-DE')} €</strong> im Budget-Topf
                          </span>
                          <span className="font-mono text-ink">{pct} % belegt</span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: GRADIENT }}
                          />
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-ink-soft">
                            {b.platforms.join(' · ')} · {b.minFollowers}
                          </span>
                          <button
                            type="button"
                            onClick={() => onTogglePick(b.id)}
                            className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                              picked
                                ? 'bg-[#edf5e5] text-[#385523]'
                                : 'bg-void text-white hover:bg-geo-violet'
                            }`}
                          >
                            {picked ? '✓ Gepickt (in meinen Deals)' : '+ Kampagne picken'}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* B) AFFILIATE / PROVISIONS-PARTNERSCHAFTEN */}
          {(filterKind === 'all' || filterKind === 'affiliate') && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-ink">
                Langfristige Provisions-Partnerschaften (eigener Code &amp; Produkte)
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {PARTNER_PROGRAMS.map((p) => {
                  const picked = pickedIds.includes(p.id);
                  return (
                    <article
                      key={p.id}
                      className={`flex flex-col justify-between rounded-3xl border p-5 ${
                        picked ? 'border-geo-violet bg-[#FBF8FE]' : 'border-hairline bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-geo-violet">{p.category}</span>
                          <span className="rounded-xl bg-surface px-2.5 py-1 text-xs font-bold text-ink">
                            {p.commission}
                          </span>
                        </div>
                        <p className="mt-2 text-xs font-semibold text-ink-soft">{p.brand}</p>
                        <h3 className="mt-0.5 text-base font-bold text-ink">{p.title}</h3>
                        <p className="mt-1.5 text-xs leading-5 text-ink-soft">{p.summary}</p>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-hairline pt-3.5">
                        <span className="text-[11px] text-ink-soft">{p.perks}</span>
                        <button
                          type="button"
                          onClick={() => onTogglePick(p.id)}
                          className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                            picked
                              ? 'bg-[#edf5e5] text-[#385523]'
                              : 'bg-geo-violet text-white hover:bg-[#7531ae]'
                          }`}
                        >
                          {picked ? '✓ Code freigeschaltet' : '+ Partnerschaft picken'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: MEINE GEPICKTEN DEALS & VIDEO-LINK EINREICHEN */}
      {activeTab === 'active' && (
        <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-ink">Deine gepickten Kampagnen &amp; Codes</h2>
            {pickedIds.length === 0 ? (
              <div className="rounded-2xl border border-hairline bg-surface p-6 text-sm text-ink-soft">
                Du hast noch keine Kampagne ausgewählt. Wechsle zu „Kampagnen picken“, um loszulegen.
              </div>
            ) : (
              pickedIds.map((id) => {
                const tkp = BOUNTY_CAMPAIGNS.find((b) => b.id === id);
                const partner = PARTNER_PROGRAMS.find((p) => p.id === id);
                if (tkp) {
                  return (
                    <div key={id} className="rounded-2xl border border-hairline bg-white p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-geo-violet">TKP-Kampagne aktiv</span>
                        <span className="text-xs font-bold text-[#385523]">
                          {tkp.cpmEuro.toFixed(2).replace('.', ',')} € / 1.000 Views
                        </span>
                      </div>
                      <h3 className="mt-1 font-bold text-ink">{tkp.title}</h3>
                      <div className="mt-3 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setSelectedCampaignForLink(tkp.id)}
                          className="text-xs font-bold text-geo-violet underline"
                        >
                          Rechts Video-Link einreichen →
                        </button>
                        <button
                          type="button"
                          onClick={() => onTogglePick(tkp.id)}
                          className="text-xs text-ink-soft hover:text-ink"
                        >
                          Entfernen
                        </button>
                      </div>
                    </div>
                  );
                }
                if (partner) {
                  return (
                    <div key={id} className="rounded-2xl border border-hairline bg-white p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#385523]">Affiliate-Partnerschaft aktiv</span>
                        <span className="text-xs font-semibold text-ink">{partner.commission}</span>
                      </div>
                      <h3 className="mt-1 font-bold text-ink">{partner.brand}</h3>
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-surface px-3 py-2 text-xs">
                        <span>
                          Dein persönlicher Code: <strong className="font-mono text-geo-violet">{partner.code}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCopiedCode(partner.code);
                            setTimeout(() => setCopiedCode(null), 2000);
                          }}
                          className="inline-flex items-center gap-1 font-bold text-ink"
                        >
                          <Copy size={12} /> {copiedCode === partner.code ? 'Kopiert!' : 'Kopieren'}
                        </button>
                      </div>
                    </div>
                  );
                }
                return null;
              })
            )}
          </div>

          {/* Rechts: Video-Link einreichen & pruefen */}
          <div className="rounded-3xl border border-hairline bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-ink">Veröffentlichten Video-Link einreichen</h3>
            <p className="mt-1 text-xs text-ink-soft">
              Reiche deinen TikTok-, Reels- oder Shorts-Link ein. Unser System prüft Briefing &amp; organische Views automatisch.
            </p>

            <form onSubmit={handleLinkSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink">Kampagne</label>
                <select
                  value={selectedCampaignForLink}
                  onChange={(e) => setSelectedCampaignForLink(e.target.value)}
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-hairline bg-surface px-3 text-xs text-ink"
                >
                  {BOUNTY_CAMPAIGNS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.brand} ({b.cpmEuro.toFixed(2).replace('.', ',')} € / 1k Views)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink">Video-URL</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-hairline bg-surface px-3 text-xs text-ink"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-ink">Simulierte Aufrufe</span>
                  <span className="font-mono font-bold text-geo-violet">
                    {simulatedViews.toLocaleString('de-DE')} Views
                  </span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={100000}
                  step={500}
                  value={simulatedViews}
                  onChange={(e) => setSimulatedViews(Number(e.target.value))}
                  className="mt-1.5 w-full accent-geo-violet"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-surface p-3 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  checked={botTest}
                  onChange={(e) => setBotTest(e.target.checked)}
                  className="mt-0.5 accent-geo-violet"
                />
                <span>Gekaufte Klicks simulieren (testet unseren Fraud-Schutz)</span>
              </label>

              <button
                type="submit"
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-geo-violet text-xs font-bold text-white hover:bg-[#7531ae]"
              >
                <Send size={14} /> Link einreichen &amp; prüfen
              </button>
            </form>

            {submittedClips.length > 0 && (
              <div className="mt-5 space-y-2 border-t border-hairline pt-4">
                {submittedClips.slice(0, 3).map((c, idx) =>
                  c.status === 'flagged' ? (
                    <div key={idx} className="rounded-xl bg-red-50 p-3 text-xs text-red-900">
                      <p className="flex items-center gap-1.5 font-bold">
                        <ShieldAlert size={14} /> Unnatürlicher Klick-Spike abgelehnt (0,00 €)
                      </p>
                    </div>
                  ) : (
                    <div key={idx} className="rounded-xl bg-[#edf5e5] p-3 text-xs text-[#2b421a]">
                      <p className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck size={14} /> Verifiziert &amp; gutgeschrieben
                        </span>
                        <span>+{c.payout.toFixed(2).replace('.', ',')} €</span>
                      </p>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 3: EURO-AUSZAHLUNG & STEUER-HILFE (ACCOUNTABLE DEAL) */}
      {activeTab === 'payout' && (
        <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-hairline bg-white p-6">
            <h2 className="text-lg font-bold text-ink">SEPA-Auszahlung in Euro (€)</h2>
            <p className="mt-1 text-xs text-ink-soft">
              100 % Auszahlung aufs Girokonto über Stripe Connect / SEPA-Gutschrift – kein Krypto, keine Plattform-Abzüge für Creator.
            </p>
            <div className="mt-5 rounded-2xl bg-surface p-5">
              <p className="text-xs text-ink-soft">Aktuell abrufbares Guthaben</p>
              <p className="mt-1 text-3xl font-extrabold text-ink">
                {(42.5 + verifiedEarnings).toFixed(2).replace('.', ',')} €
              </p>
              <p className="mt-2 text-xs text-[#385523]">
                ✓ Automatischer Gutschriftsbeleg (Kleinunternehmer §19 oder zzgl. 19 % USt.) wird bei jeder Auszahlung erstellt.
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-void p-6 text-white">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-geo-green">
              <Receipt size={13} /> Optionaler Creator-Vorteil · Steuer-Autopilot
            </div>
            <h3 className="mt-3 text-lg font-bold">
              Nebeneinnahmen versteuern ohne teuren Steuerberater
            </h3>
            <p className="mt-1 text-xs leading-5 text-white/70">
              Über unsere geplante Partnerschaft (z. B. mit Accountable) übergibst du alle UGC-Gutschriften mit 1 Klick in deine Steuer-App – statt die Hälfte deiner Einnahmen an einen Berater abzugeben.
            </p>
            <div className="mt-4">
              <div className="flex justify-between text-xs">
                <span className="text-white/75">Monatsverdienst schätzen</span>
                <span className="font-mono font-bold text-geo-green">{monthlyEuro} €</span>
              </div>
              <input
                type="range"
                min={100}
                max={2500}
                step={50}
                value={monthlyEuro}
                onChange={(e) => setMonthlyEuro(Number(e.target.value))}
                className="mt-1.5 w-full accent-geo-green"
              />
              <p className="mt-2 text-xs text-white/85">
                Empfohlene Steuerrücklage (~20 %): <strong>~{Math.round(monthlyEuro * 0.2)} €</strong> · Frei verfügbar:{' '}
                <strong className="text-geo-green">~{Math.round(monthlyEuro * 0.8)} €</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTaxSavedMsg(true)}
              className="mt-5 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-full bg-geo-green text-xs font-extrabold text-void"
            >
              <FileCheck2 size={15} />
              {taxSavedMsg ? '✓ Muster-Belegexport bereitgestellt' : 'Beleg-Export für Steuer-App testen'}
            </button>
          </div>
        </section>
      )}

      {/* TAB 4: BESTEHENDES VERZEICHNIS-PROFIL (wie /konto live) */}
      {activeTab === 'profile' && (
        <section className="mx-auto max-w-3xl rounded-3xl border border-hairline bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-hairline pb-4">
            <div>
              <h2 className="text-lg font-bold text-ink">Dein öffentliches Verzeichnis-Profil</h2>
              <p className="text-xs text-ink-soft">
                Genau wie im bestehenden <code className="text-ink">/konto</code>: Hier pflegst du Portfolio &amp; direkte Brand-Anfragen.
              </p>
            </div>
            <span className="rounded-full bg-[#edf5e5] px-3 py-1 text-xs font-bold text-[#385523]">
              Projektanfragen per Mail: aktiv
            </span>
          </div>
          <div className="mt-5 grid gap-4 text-xs sm:grid-cols-2">
            <div className="rounded-2xl bg-surface p-4">
              <p className="font-bold text-ink">Anzeigename &amp; Stadt</p>
              <p className="mt-1 text-ink-soft">Mia · Berlin</p>
            </div>
            <div className="rounded-2xl bg-surface p-4">
              <p className="font-bold text-ink">Themen &amp; Formate</p>
              <p className="mt-1 text-ink-soft">Beauty, Skincare, Lifestyle · Reels, TikTok, Unboxing</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

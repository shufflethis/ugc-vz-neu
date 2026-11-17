'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Coins,
  Filter,
  Flame,
  Play,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
  Video,
  Wallet,
} from 'lucide-react';
import {
  BOUNTY_CAMPAIGNS,
  LEADERBOARD_ENTRIES,
  type BountyCampaign,
} from './data';

const GRADIENT =
  'linear-gradient(152deg, #0396F8 0%, #1F6FF4 25%, #3F58F2 50%, #653AED 75%, #9131EF 100%)';

interface Props {
  submittedClips: { campaignId: string; url: string; payout: number; status: 'verified' | 'flagged' }[];
  onSubmitClip: (entry: { campaignId: string; url: string; payout: number; status: 'verified' | 'flagged' }) => void;
  onOpenStrategyModal: (defaultTopic?: string) => void;
}

export default function BountiesSection({
  submittedClips,
  onSubmitClip,
  onOpenStrategyModal,
}: Props) {
  const [filterType, setFilterType] = useState<string>('Alle');
  const [activeCampaignId, setActiveCampaignId] = useState<string>(BOUNTY_CAMPAIGNS[0].id);
  const [selectedTrackIdx, setSelectedTrackIdx] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string>('https://www.tiktok.com/@lara.alltag/video/7439182910');
  const [simulateBotTraffic, setSimulateBotTraffic] = useState<boolean>(false);
  const [simulatedViews, setSimulatedViews] = useState<number>(14500);

  // Brand Calculator State
  const [brandBudget, setBrandBudget] = useState<number>(3000);
  const [brandCpm, setBrandCpm] = useState<number>(3.5);

  const filteredCampaigns = BOUNTY_CAMPAIGNS.filter((c) =>
    filterType === 'Alle' ? true : c.type === filterType,
  );

  const selectedCampaign: BountyCampaign =
    BOUNTY_CAMPAIGNS.find((c) => c.id === activeCampaignId) || BOUNTY_CAMPAIGNS[0];

  const handleValidateSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;
    if (simulateBotTraffic) {
      onSubmitClip({
        campaignId: selectedCampaign.id,
        url: videoUrl.trim(),
        payout: 0,
        status: 'flagged',
      });
      return;
    }
    const rawPayout = (simulatedViews / 1000) * selectedCampaign.cpmEuro;
    const bonus =
      selectedCampaign.isOwnCampaign &&
      simulatedViews >= 2500 &&
      !submittedClips.some((c) => c.campaignId === 'ugcvz-launch' && c.status === 'verified')
        ? 10
        : 0;
    const capped = Math.min(selectedCampaign.maxPayoutPerVideo, Number((rawPayout + bonus).toFixed(2)));
    onSubmitClip({
      campaignId: selectedCampaign.id,
      url: videoUrl.trim(),
      payout: capped,
      status: 'verified',
    });
  };

  const totalWallet = submittedClips
    .filter((c) => c.status === 'verified')
    .reduce((acc, c) => acc + c.payout, 0);

  const guaranteedViews = Math.round((brandBudget / brandCpm) * 1000);
  const estimatedClips = Math.max(4, Math.round(guaranteedViews / 12000));

  return (
    <div className="space-y-16 px-5 pb-20 pt-10 sm:px-8">
      {/* HEADER */}
      <section className="mx-auto max-w-6xl">
        <div className="grid gap-8 rounded-3xl border border-hairline bg-surface p-6 sm:p-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-void px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white">
              <Flame size={13} className="text-geo-green" /> UGC Bounties · Pay-per-1.000-Views
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.045em] text-ink sm:text-5xl">
              Content posten oder clippen.{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRADIENT }}>
                Pro 1.000 Views kassieren.
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-soft sm:text-base">
              Keine Mindest-Followerzahl, keine zähen Preisverhandlungen: Marken hinterlegen ein transparentes Gesamtbudget. Du siehst live, wie viel noch im Topf liegt, reichst deinen TikTok-, Reels- oder Shorts-Link ein und wirst nach echten Views vergütet.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full border border-hairline bg-white px-3 py-1.5">
                ✓ Eigene Videos & Clipping
              </span>
              <span className="rounded-full border border-hairline bg-white px-3 py-1.5">
                ✓ KI-Briefing-Check & Fraud-Shield
              </span>
              <span className="rounded-full border border-hairline bg-white px-3 py-1.5">
                ✓ 0 % Abzug für Creator
              </span>
            </div>
          </div>

          {/* Demo Creator Euro Payout Card */}
          <div className="rounded-3xl bg-void p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-white/65">
                <Wallet size={15} className="text-geo-green" /> Dein Euro-Auszahlungskonto
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-geo-green">
                SEPA-Bankkonto via Stripe Connect
              </span>
            </div>
            <p className="mt-4 text-4xl font-extrabold tracking-tight">
              {(42.5 + totalWallet).toFixed(2).replace('.', ',')} €
            </p>
            <p className="mt-1 text-xs text-white/65">
              100 % Auszahlung in Euro (€) aufs Girokonto + automatischer Gutschriftsbeleg ({submittedClips.filter((c) => c.status === 'verified').length} getestete Clips)
            </p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.05] p-3.5 text-xs">
              <p className="font-semibold text-geo-green">
                🎁 +10,00 € Starter-Bonus aktivierbar
              </p>
              <p className="mt-1 text-white/70">
                Reiche unten einen Clip bei der UGC-VZ Eigenkampagne ein (ab 2.500 organischen Views), um die Euro-Gutschrift live zu testen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER + CAMPAIGN LIST + SUBMISSION SIMULATOR */}
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-soft">
              <Filter size={14} /> Format:
            </span>
            {['Alle', 'Eigene Produktion', 'Clipping / Repost', 'Seeding + Views'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  filterType === type
                    ? 'border-ink bg-ink text-white'
                    : 'border-hairline bg-white text-ink hover:border-geo-violet'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-soft">
            Gesamtvolumen im Demo-Pool:{' '}
            <strong className="text-ink">
              {BOUNTY_CAMPAIGNS.reduce((s, b) => s + b.totalBudget, 0).toLocaleString('de-DE')} €
            </strong>
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Left: Campaign Cards */}
          <div className="space-y-4">
            {filteredCampaigns.map((c) => {
              const pct = Math.round((c.spentBudget / c.totalBudget) * 100);
              const remaining = c.totalBudget - c.spentBudget;
              const isSelected = c.id === selectedCampaign.id;
              return (
                <article
                  key={c.id}
                  onClick={() => setActiveCampaignId(c.id)}
                  className={`cursor-pointer rounded-3xl border p-5 transition-all sm:p-6 ${
                    isSelected
                      ? 'border-geo-violet bg-[#FBF8FE] shadow-[0_16px_44px_rgba(139,63,202,0.12)]'
                      : 'border-hairline bg-white hover:border-ink/30'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-extrabold text-white"
                        style={{ background: c.isOwnCampaign ? GRADIENT : '#171717' }}
                      >
                        {c.monogram}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-bold text-ink">{c.brand}</p>
                          <span className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[10px] font-semibold text-ink-soft">
                            {c.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-soft">
                          {c.minFollowers} · {c.activeCreators} Creator aktiv
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-block rounded-xl bg-[#edf5e5] px-3 py-1 text-sm font-extrabold text-[#385523]">
                        {c.cpmEuro.toFixed(2).replace('.', ',')} € / 1.000 Views
                      </span>
                      <p className="mt-0.5 text-[11px] text-ink-soft">
                        Max. {c.maxPayoutPerVideo} € pro Clip
                      </p>
                    </div>
                  </div>

                  <h3 className="mt-3.5 text-lg font-bold text-ink">{c.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-ink-soft">{c.summary}</p>

                  {c.tracks && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {c.tracks.map((tr, idx) => (
                        <button
                          key={tr.label}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCampaignId(c.id);
                            setSelectedTrackIdx(idx);
                          }}
                          className={`rounded-xl border p-2.5 text-left text-xs transition-colors ${
                            selectedTrackIdx === idx && isSelected
                              ? 'border-geo-violet bg-white'
                              : 'border-hairline bg-surface/80'
                          }`}
                        >
                          <p className="font-bold text-geo-violet">{tr.label}</p>
                          <p className="mt-0.5 text-ink-soft">{tr.angle}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {c.starterBonus && (
                    <div className="mt-3 rounded-xl border border-geo-violet/25 bg-white px-3 py-2 text-xs">
                      <p className="font-bold text-geo-violet">🎁 {c.starterBonus}</p>
                      {c.starterBonusFootnote && (
                        <p className="mt-0.5 text-[11px] text-ink-soft">{c.starterBonusFootnote}</p>
                      )}
                    </div>
                  )}

                  {/* Budget Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-ink">
                        Budget-Topf: <strong>{remaining.toLocaleString('de-DE')} € verfügbar</strong>{' '}
                        <span className="text-ink-soft">
                          (von {c.totalBudget.toLocaleString('de-DE')} € Gesamtbudget)
                        </span>
                      </span>
                      <span className="font-mono font-bold text-ink">{pct} % belegt</span>
                    </div>
                    <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: GRADIENT }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-3">
                    <div className="flex flex-wrap gap-1.5">
                      {c.platforms.map((p) => (
                        <span
                          key={p}
                          className="rounded-md border border-hairline bg-white px-2 py-0.5 text-[11px] font-semibold text-ink"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-geo-violet">
                      <Play size={13} /> {isSelected ? 'Im Validator rechts geöffnet' : 'Auswählen & Video testen'}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Right Sticky Simulator: Aether / ugcbounty AI Validation + Fraud Shield */}
          <div className="space-y-6">
            <div className="sticky top-24 rounded-3xl border border-hairline bg-white p-6 shadow-[0_20px_60px_rgba(35,22,47,0.07)]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-geo-violet">
                  Live-Simulator · KI-Validierung & Fraud-Shield
                </span>
                <span className="rounded-md bg-surface px-2 py-0.5 font-mono text-[10px] font-semibold text-ink">
                  ugcbounty / Aether Core
                </span>
              </div>

              <h3 className="mt-2 text-lg font-bold text-ink">
                Clip einreichen für: {selectedCampaign.brand}
              </h3>

              <ul className="mt-3 space-y-1.5 rounded-2xl bg-surface p-3.5 text-xs text-ink-soft">
                {selectedCampaign.requirements.map((req) => (
                  <li key={req} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#527b33]" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>

              <form onSubmit={handleValidateSubmission} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink">
                    Öffentlicher Video-Link (TikTok / Reel / Short)
                  </label>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-hairline bg-surface px-3 text-xs text-ink focus:border-geo-violet focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-ink">Simulierte Aufrufe nach 7 Tagen</span>
                    <span className="font-mono font-bold text-geo-violet">
                      {simulatedViews.toLocaleString('de-DE')} Views
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1000}
                    max={120000}
                    step={500}
                    value={simulatedViews}
                    onChange={(e) => setSimulatedViews(Number(e.target.value))}
                    className="mt-1.5 w-full accent-geo-violet"
                  />
                </div>

                {/* Anti-Bot Toggle (addresses Gorden & Flo's point at 05:16 about 15€ bought TikTok clicks!) */}
                <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-hairline bg-surface p-3 text-xs">
                  <input
                    type="checkbox"
                    checked={simulateBotTraffic}
                    onChange={(e) => setSimulateBotTraffic(e.target.checked)}
                    className="mt-0.5 accent-geo-violet"
                  />
                  <span>
                    <strong className="text-ink">Anti-Scam Test aktivieren:</strong> Simuliere gekaufte 15-€-TikTok-Klicks / F5-Bot-Spike (zeigt, wie Brands vor Fake-Views geschützt werden)
                  </span>
                </label>

                <button
                  type="submit"
                  className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-geo-violet px-4 text-sm font-bold text-white transition-colors hover:bg-[#7531ae]"
                >
                  <Send size={15} />
                  Clip prüfen & Vergütung gutschreiben
                </button>
              </form>

              {/* Recent Validation Feed */}
              {submittedClips.length > 0 && (
                <div className="mt-5 space-y-2 border-t border-hairline pt-4">
                  <p className="text-xs font-bold text-ink">Letzte Prüf-Ergebnisse in dieser Sitzung:</p>
                  {submittedClips.slice(0, 3).map((clip, i) =>
                    clip.status === 'flagged' ? (
                      <div
                        key={`${clip.url}-${i}`}
                        className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900"
                      >
                        <p className="flex items-center gap-1.5 font-bold">
                          <ShieldAlert size={14} /> Blockiert durch View-Fraud-Shield (0,00 €)
                        </p>
                        <p className="mt-1 text-[11px]">
                          Unnatürlicher View-Spike ohne Watchtime/Kommentar-Korrelation erkannt (typisch für gekaufte Klick-Pakete). Markenbudget bleibt zu 100 % geschützt.
                        </p>
                      </div>
                    ) : (
                      <div
                        key={`${clip.url}-${i}`}
                        className="rounded-xl border border-[#dce9d1] bg-[#edf5e5] p-3 text-xs text-[#2b421a]"
                      >
                        <p className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck size={14} /> KI-Briefing & Views verifiziert
                          </span>
                          <span>+{clip.payout.toFixed(2).replace('.', ',')} €</span>
                        </p>
                        <p className="mt-0.5 truncate text-[11px] opacity-85">{clip.url}</p>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* LEADERBOARD + BRAND BOUNTY CALCULATOR */}
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Leaderboard */}
        <div className="rounded-3xl border border-hairline bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-geo-violet">
                Monats-Ranking (Vorschau)
              </p>
              <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold text-ink">
                <Trophy size={22} className="text-geo-violet" /> Top-Verdiener nach verifizierten Views
              </h2>
            </div>
          </div>

          <div className="mt-5 divide-y divide-hairline">
            {LEADERBOARD_ENTRIES.map((row) => (
              <div key={row.rank} className="flex items-center justify-between gap-3 py-3.5 text-sm">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-bold ${
                      row.rank === 1
                        ? 'bg-geo-violet text-white'
                        : 'bg-surface text-ink'
                    }`}
                  >
                    #{row.rank}
                  </span>
                  <div>
                    <p className="font-bold text-ink">@{row.handle}</p>
                    <p className="text-xs text-ink-soft">
                      {row.niche} · {row.clips} Clips · {row.platform}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-[#385523]">{row.earnedEuro}</p>
                  <p className="font-mono text-[11px] text-ink-soft">{row.verifiedViews} Views</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Brand Bounty Calculator */}
        <div className="rounded-3xl bg-void p-6 text-white sm:p-8">
          <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-geo-green">
            Für Marken & Mediaagenturen
          </p>
          <h2 className="mt-1 text-2xl font-bold">
            Eigenes Bounty kalkulieren – so simpel wie Meta Ads
          </h2>
          <p className="mt-2 text-xs leading-5 text-white/70">
            Lege dein Maximalbudget fest. Wird weniger abgerufen, zahlst du nur die tatsächlich erreichten, verifizierten Views.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <div className="flex justify-between text-xs">
                <span className="text-white/75">Kampagnen-Gesamtbudget</span>
                <span className="font-mono text-sm font-bold text-white">
                  {brandBudget.toLocaleString('de-DE')} €
                </span>
              </div>
              <input
                type="range"
                min={1000}
                max={20000}
                step={500}
                value={brandBudget}
                onChange={(e) => setBrandBudget(Number(e.target.value))}
                className="mt-2 w-full accent-geo-green"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs">
                <span className="text-white/75">Vergütung pro 1.000 Views (TKP)</span>
                <span className="font-mono text-sm font-bold text-geo-green">
                  {brandCpm.toFixed(2).replace('.', ',')} € / 1k Views
                </span>
              </div>
              <input
                type="range"
                min={1.5}
                max={6.5}
                step={0.5}
                value={brandCpm}
                onChange={(e) => setBrandCpm(Number(e.target.value))}
                className="mt-2 w-full accent-geo-green"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <div>
                <p className="text-[11px] text-white/60">Garantierte echte Views</p>
                <p className="mt-1 text-2xl font-extrabold text-geo-green">
                  {guaranteedViews.toLocaleString('de-DE')}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-white/60">Erwartete Creator-Videos</p>
                <p className="mt-1 text-2xl font-extrabold text-white">
                  ca. {estimatedClips}–{estimatedClips + 8}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                onOpenStrategyModal(
                  `UGC Bounty Anfrage: ${brandBudget.toLocaleString('de-DE')} € Budget bei ${brandCpm.toFixed(2)} € TKP`,
                )
              }
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-geo-green px-6 text-sm font-extrabold text-void transition-transform hover:-translate-y-0.5"
            >
              <Sparkles size={16} />
              Pilot-Bounty anfragen (20 % Neukunden-Bonus sichern)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

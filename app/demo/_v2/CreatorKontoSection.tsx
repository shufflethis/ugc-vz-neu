'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Copy,
  FileCheck2,
  Mail,
  Receipt,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  Upload,
} from 'lucide-react';
import {
  BOUNTY_CAMPAIGNS,
  LEADERBOARD_ENTRIES,
  type SubmittedClip,
} from './data';

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

type AuditScenario =
  | 'organic_dach'
  | 'mixed_dach'
  | 'bot_spike'
  | 'cheap_geo_ads'
  | 'unverified_channel';

interface Props {
  pickedIds: string[];
  onTogglePick: (id: string) => void;
  submittedClips: SubmittedClip[];
  onSubmitClip: (entry: SubmittedClip) => void;
  onUploadAnalyticsProof: (clipId: string) => void;
  onReleaseHoldClips: () => void;
  onNavigate?: (section: 'creator-tkp-guide') => void;
}

export default function CreatorKontoSection({
  pickedIds,
  onTogglePick,
  submittedClips,
  onSubmitClip,
  onUploadAnalyticsProof,
  onReleaseHoldClips,
  onNavigate,
}: Props) {
  const [authView, setAuthView] = useState<'logged-in' | 'login-screen'>('logged-in');
  const [activeTab, setActiveTab] = useState<'pick' | 'active' | 'payout' | 'profile'>('pick');
  const [filterKind, setFilterKind] = useState<'all' | 'tkp' | 'affiliate'>('all');
  const [loginEmail, setLoginEmail] = useState('mia@beispiel-creator.de');
  const [vatMode, setVatMode] = useState<'kleinunternehmer' | 'ust19'>('kleinunternehmer');
  const [stripeConnected, setStripeConnected] = useState<boolean>(true);

  // Submission state inside "Meine gepickten Kampagnen"
  const [selectedCampaignForLink, setSelectedCampaignForLink] = useState<string>(BOUNTY_CAMPAIGNS[0].id);
  const [videoUrl, setVideoUrl] = useState<string>('https://www.tiktok.com/@mia.berlin/video/7439182910');
  const [simulatedViews, setSimulatedViews] = useState<number>(12000);
  const [auditScenario, setAuditScenario] = useState<AuditScenario>('organic_dach');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedBioCode, setCopiedBioCode] = useState<boolean>(false);

  // Tax helper state inside "Auszahlung & Steuern"
  const [monthlyEuro, setMonthlyEuro] = useState<number>(450);
  const [taxSavedMsg, setTaxSavedMsg] = useState<boolean>(false);

  const availableEarnings = submittedClips
    .filter((c) => c.status === 'verified_available')
    .reduce((sum, c) => sum + c.payout, 0);

  const pendingEarnings = submittedClips
    .filter((c) => c.status === 'pending_hold' || c.status === 'needs_analytics')
    .reduce((sum, c) => sum + c.payout, 0);

  const hasHoldClips = submittedClips.some((c) => c.status === 'pending_hold');

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const camp = BOUNTY_CAMPAIGNS.find((b) => b.id === selectedCampaignForLink) || BOUNTY_CAMPAIGNS[0];
    const id = `clip-${Date.now()}`;

    if (auditScenario === 'bot_spike') {
      onSubmitClip({
        id,
        campaignId: camp.id,
        url: videoUrl,
        rawViews: simulatedViews,
        qualifiedViews: 0,
        dachSharePct: 0,
        payout: 0,
        status: 'flagged',
        holdDaysLeft: 0,
        reason:
          'Abgelehnt: Unnatürlicher Rechteck-Spike ohne Like-/Share-Korrelation (< 0,8 % Like-Rate). Markenbudget zu 100 % geschützt.',
      });
      return;
    }

    if (auditScenario === 'cheap_geo_ads') {
      onSubmitClip({
        id,
        campaignId: camp.id,
        url: videoUrl,
        rawViews: simulatedViews,
        qualifiedViews: 0,
        dachSharePct: 11,
        payout: 0,
        status: 'flagged',
        holdDaysLeft: 0,
        reason:
          'Abgelehnt: Analytics-Check zeigt nur 11 % DACH-Zuschauer (unter 30-%-Schwelle / bezahlter Auslands-Traffic).',
      });
      return;
    }

    if (auditScenario === 'unverified_channel') {
      onSubmitClip({
        id,
        campaignId: camp.id,
        url: videoUrl,
        rawViews: simulatedViews,
        qualifiedViews: 0,
        dachSharePct: 0,
        payout: 0,
        status: 'flagged',
        holdDaysLeft: 0,
        reason:
          'Abgelehnt: Kanal nicht per Bio-Code (UGCVZ-4821) bestätigt oder Video wurde vor Kampagnen-Pick / vor > 24 Std. hochgeladen.',
      });
      return;
    }

    const dachSharePct = auditScenario === 'mixed_dach' ? 52 : 86;
    // Ab 70 % DACH volle Wertung; 30-69 % fair anteilig nach DACH-Quote
    const qualifiedViews =
      dachSharePct >= 70 ? simulatedViews : Math.round(simulatedViews * (dachSharePct / 100));

    const base = (qualifiedViews / 1000) * camp.cpmEuro;
    const starterAlreadyClaimed = submittedClips.some(
      (c) => c.campaignId === 'ugcvz-launch' && c.status !== 'flagged',
    );
    const bonus =
      camp.isOwnCampaign && qualifiedViews >= 2500 && !starterAlreadyClaimed ? 10 : 0;
    const payout = Math.min(camp.maxPayoutPerVideo, Number((base + bonus).toFixed(2)));

    // Ab 35 € Verguetung ist ein kurzes 5-Sek.-Analytics-Screenrecording verpflichtend
    const needsAnalytics = payout >= 35;

    onSubmitClip({
      id,
      campaignId: camp.id,
      url: videoUrl,
      rawViews: simulatedViews,
      qualifiedViews,
      dachSharePct,
      payout,
      status: needsAnalytics ? 'needs_analytics' : 'pending_hold',
      holdDaysLeft: 7,
      reason: needsAnalytics
        ? `Ab 35,00 € Pflicht-Check: Bitte 5-Sek.-Screenrecording deiner TikTok/Reels-Analytics (Länder & For-You-Anteil) hochladen.`
        : auditScenario === 'mixed_dach'
          ? `Anteilige DACH-Wertung (${dachSharePct} % DACH = ${qualifiedViews.toLocaleString('de-DE')} vergütete Views) · 7 Tage Haltefrist aktiv.`
          : `Verlauf & Briefing unauffällig (${dachSharePct} % DACH) · 7 Tage Haltefrist vor Stripe-Freigabe aktiv.`,
    });
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
              <p className="text-[11px] text-ink-soft">Vorgemerkt (Haltefrist)</p>
              <p className="text-lg font-extrabold text-geo-violet">
                {(18.5 + pendingEarnings).toFixed(2).replace('.', ',')} €
              </p>
            </div>
            <div className="rounded-2xl border border-hairline bg-white px-4 py-2.5 text-right">
              <p className="text-[11px] text-ink-soft">Auszahlbar (Stripe SEPA)</p>
              <p className="text-lg font-extrabold text-[#385523]">
                {(42.5 + availableEarnings).toFixed(2).replace('.', ',')} €
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

          {/* C) KOMPAKTE MONATS-RANGLISTE NACH VERIFIZIERTEN DACH-VIEWS */}
          {(filterKind === 'all' || filterKind === 'tkp') && (
            <div className="rounded-3xl border border-hairline bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-geo-violet">
                    Monats-Übersicht (Vorschau)
                  </p>
                  <h2 className="mt-0.5 flex items-center gap-2 text-lg font-bold text-ink">
                    <Trophy size={18} className="text-geo-violet" /> Top-Creator nach verifizierten DACH-Views
                  </h2>
                </div>
                <span className="text-xs text-ink-soft">
                  Nur organische Views nach Haltefrist gezählt
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {LEADERBOARD_ENTRIES.map((row) => (
                  <div key={row.rank} className="rounded-2xl bg-surface p-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-geo-violet">#{row.rank}</span>
                      <span className="font-extrabold text-[#385523]">{row.earnedEuro}</span>
                    </div>
                    <p className="mt-1.5 truncate font-bold text-ink">@{row.handle}</p>
                    <p className="mt-0.5 text-[11px] text-ink-soft">
                      {row.verifiedViews} Views · {row.clips} Clips
                    </p>
                  </div>
                ))}
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

          {/* Rechts: Video-Link einreichen & 6-Schichten-Fraud-Shield testen */}
          <div className="rounded-3xl border border-hairline bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-ink">Veröffentlichten Video-Link einreichen</h3>
              <span className="rounded-full bg-[#edf5e5] px-2.5 py-0.5 text-[11px] font-bold text-[#385523]">
                Bio-Code aktiv: UGCVZ-4821
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              Eingereicht werden können nur eigene, per Bio-Code bestätigte Kanäle – veröffentlicht <strong>nach</strong> Kampagnen-Pick und max. 24 Std. alt.
            </p>

            {/* Verifizierte eigene Kanaele */}
            <div className="mt-3 flex flex-wrap gap-2 rounded-2xl bg-surface p-3 text-[11px]">
              <span className="inline-flex items-center gap-1 font-semibold text-[#2b421a]">
                <CheckCircle2 size={13} className="text-[#527b33]" /> TikTok @mia.berlin
              </span>
              <span className="text-ink-soft">·</span>
              <span className="inline-flex items-center gap-1 font-semibold text-[#2b421a]">
                <CheckCircle2 size={13} className="text-[#527b33]" /> IG @mia.creates
              </span>
            </div>

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
                <label className="block text-xs font-bold text-ink">Video-URL (von bestätigtem Kanal)</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-hairline bg-surface px-3 text-xs text-ink"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-ink">Simulierte Aufrufe im Zählfenster</span>
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
                <p className="mt-1 text-[11px] text-ink-soft">
                  Tipp: Schieb den Regler über ~18.000 Views, um die automatische <strong>35-€-Analytics-Prüfschwelle</strong> zu testen.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink">
                  Prüf-Szenario simulieren (Anti-Fraud-Test)
                </label>
                <select
                  value={auditScenario}
                  onChange={(e) => setAuditScenario(e.target.value as AuditScenario)}
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-hairline bg-surface px-3 text-xs text-ink"
                >
                  <option value="organic_dach">
                    1 · Organischer DACH-Clip (86 % DACH · For-You-Feed)
                  </option>
                  <option value="mixed_dach">
                    2 · International gestreut (52 % DACH → faire anteilige Wertung)
                  </option>
                  <option value="bot_spike">
                    3 · Betrugstest: Gekaufte 15-€-Bot-Views (Rechteck-Spike / &lt;0,8 % Likes)
                  </option>
                  <option value="cheap_geo_ads">
                    4 · Betrugstest: Billig-Länder-Ads (11 % DACH / 89 % Nicht-DACH)
                  </option>
                  <option value="unverified_channel">
                    5 · Betrugstest: Fremder Kanal / Video älter als 24 Std.
                  </option>
                </select>
              </div>

              <button
                type="submit"
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-geo-violet text-xs font-bold text-white hover:bg-[#7531ae]"
              >
                <Send size={14} /> Link einreichen &amp; 6-Stufen-Prüfung starten
              </button>
            </form>

            {submittedClips.length > 0 && (
              <div className="mt-5 space-y-2.5 border-t border-hairline pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-ink">Prüf-Status deiner Einreichungen:</p>
                  {hasHoldClips && (
                    <button
                      type="button"
                      onClick={onReleaseHoldClips}
                      className="text-[11px] font-bold text-geo-violet underline hover:no-underline"
                    >
                      7-Tage-Haltefrist vorspulen →
                    </button>
                  )}
                </div>

                {submittedClips.slice(0, 4).map((c) => {
                  if (c.status === 'flagged') {
                    return (
                      <div key={c.id} className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900">
                        <p className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            <ShieldAlert size={14} /> Blockiert durch Fraud-Shield
                          </span>
                          <span>0,00 €</span>
                        </p>
                        <p className="mt-1 text-[11px] leading-5">{c.reason}</p>
                      </div>
                    );
                  }

                  if (c.status === 'needs_analytics') {
                    return (
                      <div
                        key={c.id}
                        className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950"
                      >
                        <p className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            <Upload size={14} /> Analytics-Nachweis nötig (ab 35 €)
                          </span>
                          <span>+{c.payout.toFixed(2).replace('.', ',')} € (gesperrt)</span>
                        </p>
                        <p className="mt-1 text-[11px] leading-5">{c.reason}</p>
                        <button
                          type="button"
                          onClick={() => onUploadAnalyticsProof(c.id)}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-void px-3 py-1.5 text-[11px] font-bold text-white hover:bg-geo-violet"
                        >
                          <Upload size={12} /> 5-Sek.-Analytics-Screenrecording hochladen (Demo)
                        </button>
                      </div>
                    );
                  }

                  if (c.status === 'pending_hold') {
                    return (
                      <div
                        key={c.id}
                        className="rounded-xl border border-geo-violet/30 bg-[#FBF8FE] p-3 text-xs text-ink"
                      >
                        <p className="flex items-center justify-between font-bold text-geo-violet">
                          <span className="flex items-center gap-1.5">
                            <Clock size={14} /> Vorgemerkt ({c.holdDaysLeft} Tage Haltefrist)
                          </span>
                          <span>+{c.payout.toFixed(2).replace('.', ',')} €</span>
                        </p>
                        <p className="mt-1 text-[11px] leading-5 text-ink-soft">{c.reason}</p>
                      </div>
                    );
                  }

                  return (
                    <div key={c.id} className="rounded-xl border border-[#dce9d1] bg-[#edf5e5] p-3 text-xs text-[#2b421a]">
                      <p className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck size={14} /> Freigegeben &amp; auszahlbar
                        </span>
                        <span>+{c.payout.toFixed(2).replace('.', ',')} €</span>
                      </p>
                      <p className="mt-1 text-[11px] leading-5">{c.reason}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 3: EURO-AUSZAHLUNG VIA STRIPE CONNECT & STEUER-GUTSCHRIFTEN */}
      {activeTab === 'payout' && (
        <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-3xl border border-hairline bg-white p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-ink">Auszahlung via Stripe Connect (SEPA)</h2>
              <span className="rounded-full bg-[#edf5e5] px-2.5 py-0.5 text-[11px] font-bold text-[#385523]">
                {stripeConnected ? '● Stripe Express verbunden' : 'Nicht verbunden'}
              </span>
            </div>
            <p className="text-xs leading-5 text-ink-soft">
              Deine Einnahmen werden reguliert über <strong>Stripe Connect Express</strong> verwaltet und ab 25,00 € Mindestguthaben ohne Abzug in Euro auf dein hinterlegtes Girokonto überwiesen.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-hairline bg-surface p-4">
                <p className="text-xs text-ink-soft">1 · Vorgemerkt (in Haltefrist)</p>
                <p className="mt-1 text-2xl font-extrabold text-geo-violet">
                  {(18.5 + pendingEarnings).toFixed(2).replace('.', ',')} €
                </p>
                <p className="mt-1 text-[11px] leading-4 text-ink-soft">
                  Wird nach 7 Tagen Haltefrist &amp; Online-Check automatisch freigegeben.
                </p>
                {hasHoldClips && (
                  <button
                    type="button"
                    onClick={onReleaseHoldClips}
                    className="mt-2 text-[11px] font-bold text-geo-violet underline"
                  >
                    Demo: Haltefrist abschließen →
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-[#dce9d1] bg-[#edf5e5] p-4">
                <p className="text-xs text-[#2b421a]">2 · Auszahlbar (ab 25,00 € per SEPA)</p>
                <p className="mt-1 text-2xl font-extrabold text-[#385523]">
                  {(42.5 + availableEarnings).toFixed(2).replace('.', ',')} €
                </p>
                <button
                  type="button"
                  onClick={() => setStripeConnected((v) => !v)}
                  className="mt-2 rounded-full border border-[#dce9d1] bg-white px-3 py-1 text-[11px] font-bold text-ink hover:border-geo-violet"
                >
                  {stripeConnected ? 'IBAN: DE89 •••• 3000 (KYC ✓)' : 'Mit Stripe verbinden'}
                </button>
              </div>
            </div>

            <p className="rounded-xl bg-surface p-3 text-[11px] leading-5 text-ink-soft">
              <strong className="text-ink">Fair-Play-Schutz:</strong> Auszahlungen und einmalige Starter-Boni sind fest an deine bei Stripe hinterlegte Identität (KYC / IBAN) gebunden. Gelöschte oder auf privat gestellte Videos verfallen vor Ablauf der Haltefrist.
            </p>

            {/* 1-HAEKCHEN STEUER-STATUS FUER AUTOMATISCHE GUTSCHRIFT */}
            <div className="rounded-2xl border border-hairline p-4 text-xs">
              <p className="font-bold text-ink">Steuer-Einstellung für deine automatischen PDF-Gutschriften:</p>
              <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setVatMode('kleinunternehmer')}
                  className={`rounded-xl border p-3 text-left ${
                    vatMode === 'kleinunternehmer'
                      ? 'border-geo-violet bg-[#FBF8FE] font-bold text-ink'
                      : 'border-hairline text-ink-soft'
                  }`}
                >
                  Kleinunternehmer (§ 19 UStG)
                  <span className="mt-0.5 block font-normal text-[11px] text-ink-soft">
                    Gutschrift ohne Umsatzsteuer
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setVatMode('ust19')}
                  className={`rounded-xl border p-3 text-left ${
                    vatMode === 'ust19'
                      ? 'border-geo-violet bg-[#FBF8FE] font-bold text-ink'
                      : 'border-hairline text-ink-soft'
                  }`}
                >
                  Regelbesteuert (+19 % USt.)
                  <span className="mt-0.5 block font-normal text-[11px] text-ink-soft">
                    Gutschrift zzgl. 19 % Umsatzsteuer
                  </span>
                </button>
              </div>
            </div>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('creator-tkp-guide')}
                className="text-xs font-bold text-geo-violet underline underline-offset-4 hover:no-underline"
              >
                Ausführliche Erklärung zu Stripe Connect &amp; Steuern lesen →
              </button>
            )}
          </div>

          <div className="rounded-3xl bg-void p-6 text-white">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-geo-green">
              <Receipt size={13} /> Beleg-Export für deine Buchhaltung
            </div>
            <h3 className="mt-3 text-lg font-bold">
              Alle Gutschriften gesammelt exportieren
            </h3>
            <p className="mt-1 text-xs leading-5 text-white/70">
              Alle UGC-Gutschriften lassen sich gesammelt als PDF/CSV exportieren und in gängige Buchhaltungs- oder Steuer-Apps importieren. Das ersetzt keine Steuerberatung.
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

          <div className="mt-5 rounded-2xl border border-hairline bg-surface p-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold text-ink">
                  Kanal-Eigentumsnachweis für TKP-Kampagnen (Bio-Code)
                </p>
                <p className="mt-0.5 text-ink-soft">
                  Hinterlege diesen einmaligen Code kurz in deiner TikTok- oder Instagram-Bio, um deinen Kanal gegen fremde Einreichungen zu schützen.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCopiedBioCode(true);
                  setTimeout(() => setCopiedBioCode(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-white px-3.5 py-2 font-mono font-bold text-geo-violet hover:border-geo-violet"
              >
                <Copy size={12} /> {copiedBioCode ? 'Kopiert!' : 'UGCVZ-4821'}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Coins,
  Copy,
  ExternalLink,
  Link2,
  Megaphone,
  Send,
  ShieldAlert,
} from 'lucide-react';
import type { CreatorCampaignItem, SubmissionStatus } from '@/app/lib/brand-workspace';

const fieldClass =
  'w-full rounded-lg border border-[#DCE2EA] bg-white px-3.5 py-2.5 text-sm text-[#202124] outline-none transition focus:border-[#06458F] focus:ring-4 focus:ring-[#06458F]/10';

const STATUS_BADGE: Record<CreatorCampaignItem['status'], { label: string; className: string }> = {
  open: { label: 'Offen', className: 'bg-[#06458F]/10 text-[#06458F]' },
  invited: { label: 'Eingeladen', className: 'bg-amber-100 text-amber-900' },
  applied: { label: 'Beworben', className: 'bg-sky-100 text-sky-900' },
  shortlisted: { label: 'Shortlist', className: 'bg-[#06458F]/15 text-[#06458F]' },
  selected: { label: 'Ausgewählt · bereit für Content', className: 'bg-emerald-50 text-emerald-800' },
  delivered: { label: 'Clip eingereicht', className: 'bg-emerald-50 text-emerald-800' },
  approved: { label: 'Freigegeben', className: 'bg-emerald-100 text-emerald-900' },
  declined: { label: 'Abgelehnt', className: 'bg-[#F5F7FA] text-[#5C6470]' },
};

const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, { label: string; className: string }> = {
  submitted: { label: 'Eingereicht', className: 'bg-[#06458F]/10 text-[#06458F]' },
  revision_requested: { label: 'Überarbeitung angefragt', className: 'bg-amber-100 text-amber-900' },
  approved: { label: 'Freigegeben', className: 'bg-emerald-50 text-emerald-800' },
  rejected: { label: 'Abgelehnt', className: 'bg-[#F2072A]/10 text-[#D10523]' },
};

const COMP_MODEL_LABEL: Record<CreatorCampaignItem['compensationModel'], string> = {
  fixed: 'Pay-per-Video (Fixpreis)',
  tkp: 'Pay-per-View (TKP)',
  hybrid: 'Hybrid (Fixpreis + TKP)',
  affiliate: 'Affiliate / Kickback',
  barter: 'Produkt / Barter',
};

const PLATFORM_LABEL: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram Reels',
  youtube: 'YouTube Shorts',
  tiktok_shop: 'TikTok Shop',
  files_only: 'Nur Videodateien',
  meta_ads: 'Meta Ads',
  other: 'Sonstige',
};

const CREATOR_POST_PLATFORMS: Array<{ id: string; label: string }> = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram Reels' },
  { id: 'youtube', label: 'YouTube Shorts' },
  { id: 'tiktok_shop', label: 'TikTok Shop' },
  { id: 'files_only', label: 'Nur Videodateien' },
];

const formatAffiliateSummary = (item: CreatorCampaignItem): string => {
  if (!item.affiliateEnabled && item.compensationModel !== 'affiliate') return '';
  if (item.affiliateType === 'fixed_per_sale') {
    const eur = ((item.affiliateFixedCents ?? 1500) / 100).toFixed(2).replace('.', ',');
    return `${eur} € Kickback / Sale`;
  }
  const pct = ((item.affiliateRateBps ?? 1000) / 100).toFixed(1).replace(/\.0$/, '').replace('.', ',');
  return `${pct} % Affiliate-Kickback`;
};

const formatBudget = (item: CreatorCampaignItem) => {
  const parts: string[] = [];
  if (item.tkpEurCents) parts.push(`${(item.tkpEurCents / 100).toFixed(2).replace('.', ',')} € / 1.000 Views`);
  if (item.budgetPerVideoEur) parts.push(`${item.budgetPerVideoEur} € Fixpreis / Video`);
  const aff = formatAffiliateSummary(item);
  if (aff) parts.push(aff);
  if (item.totalBudgetEur) parts.push(`Budget-Limit ${item.totalBudgetEur.toLocaleString('de-DE')} €`);
  return parts.length ? parts.join(' · ') : COMP_MODEL_LABEL[item.compensationModel];
};

type ModelFilter = 'all' | 'tkp' | 'fixed' | 'affiliate';

const matchesModelFilter = (item: CreatorCampaignItem, filter: ModelFilter): boolean => {
  if (filter === 'all') return true;
  if (filter === 'tkp') return item.compensationModel === 'tkp' || item.compensationModel === 'hybrid';
  if (filter === 'fixed') return item.compensationModel === 'fixed' || item.compensationModel === 'hybrid';
  if (filter === 'affiliate') return Boolean(item.affiliateEnabled || item.compensationModel === 'affiliate');
  return true;
};

export default function CreatorCampaignsClient({
  initialMyCampaigns,
  initialOpenCampaigns,
  hasVerifiedSocial,
  unavailable,
}: {
  initialMyCampaigns: CreatorCampaignItem[];
  initialOpenCampaigns: CreatorCampaignItem[];
  hasVerifiedSocial: boolean;
  unavailable: boolean;
}) {
  const [myCampaigns, setMyCampaigns] = useState<CreatorCampaignItem[]>(initialMyCampaigns);
  const [openCampaigns, setOpenCampaigns] = useState<CreatorCampaignItem[]>(initialOpenCampaigns);
  const [tab, setTab] = useState<'my' | 'open'>(initialMyCampaigns.length > 0 ? 'my' : 'open');
  const [modelFilter, setModelFilter] = useState<ModelFilter>('all');
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const refresh = async () => {
    const res = await fetch('/api/creator/campaigns', { cache: 'no-store' });
    const data = await res.json();
    if (res.ok && data.success) {
      setMyCampaigns(data.myCampaigns || []);
      setOpenCampaigns(data.openCampaigns || []);
    }
  };

  const filteredMy = myCampaigns.filter((item) => matchesModelFilter(item, modelFilter));
  const filteredOpen = openCampaigns.filter((item) => matchesModelFilter(item, modelFilter));

  return (
    <div className="min-h-screen px-4 pb-24 pt-10 text-[#202124] sm:px-8 sm:pt-14 md:px-16 lg:px-24">
      <div className="mx-auto max-w-5xl py-6">
        <Link
          href="/konto"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#5C6470] hover:text-[#06458F]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Zurück zum Creator-Konto
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#06458F]">Creator-Workspace</p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Brand-Kampagnen &amp; Ausschreibungen</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5C6470]">
              Verdiene mit <strong>Pay-per-View (TKP)</strong>, <strong>Fixpreis pro Video</strong> oder <strong>Affiliate-Kickbacks</strong>. Immer <strong>0 % Gebühr</strong> für dich und direkte Auszahlung über dein UGC VZ Konto.
            </p>
          </div>
          <Link
            href="/konto#social-verify"
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
              hasVerifiedSocial
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-[#06458F]/30 bg-[#06458F]/5 text-[#06458F] hover:bg-[#06458F]/10'
            }`}
          >
            <BadgeCheck className="h-4 w-4" aria-hidden="true" />
            {hasVerifiedSocial ? 'Social-Kanal verifiziert' : 'Instagram / TikTok verifizieren →'}
          </Link>
        </div>

        {unavailable && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>Die Kampagnen-Datenbank wird gerade eingerichtet oder ist kurzzeitig nicht erreichbar. Bitte versuche es gleich erneut.</p>
          </div>
        )}

        {toastMsg && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900" role="status">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{toastMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-6 rounded-xl border border-[#F2072A]/30 bg-[#F2072A]/5 px-4 py-3 text-sm text-[#D10523]" role="alert">
            {errorMsg}
          </div>
        )}

        {/* Haupt-Tabs */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE2EA] pb-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab('my')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                tab === 'my' ? 'bg-[#06458F] text-white' : 'bg-[#F5F7FA] text-[#5C6470] hover:text-[#202124]'
              }`}
            >
              <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
              Meine Kampagnen &amp; Einladungen ({myCampaigns.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('open')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                tab === 'open' ? 'bg-[#06458F] text-white' : 'bg-[#F5F7FA] text-[#5C6470] hover:text-[#202124]'
              }`}
            >
              <Megaphone className="h-4 w-4" aria-hidden="true" />
              Offene Brand-Kampagnen ({openCampaigns.length})
            </button>
          </div>

          {/* Vergütungsmodell-Filter */}
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Nach Vergütungsmodell filtern">
            {(
              [
                ['all', 'Alle'],
                ['tkp', 'Pay-per-View'],
                ['fixed', 'Fixpreis / Video'],
                ['affiliate', 'Affiliate & Bonus'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setModelFilter(key)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  modelFilter === key
                    ? 'border-[#06458F] bg-[#06458F]/10 text-[#06458F]'
                    : 'border-[#DCE2EA] bg-white text-[#5C6470] hover:border-[#06458F]/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="mt-6 space-y-5">
          {tab === 'my' ? (
            filteredMy.length === 0 ? (
              <div className="rounded-xl border border-[#DCE2EA] bg-white p-10 text-center">
                <p className="text-lg font-bold text-[#202124]">
                  {myCampaigns.length === 0
                    ? 'Noch keine eigenen Kampagnen oder Einladungen'
                    : 'Keine deiner Kampagnen passt zu diesem Filter'}
                </p>
                <p className="mt-2 text-sm text-[#5C6470]">
                  {myCampaigns.length === 0
                    ? 'Schau dir die offenen Brand-Kampagnen an und bewirb dich direkt mit deinem Pitch und Honorarvorschlag.'
                    : 'Setze den Filter auf „Alle“, um wieder alle deine Kampagnen zu sehen.'}
                </p>
                <button
                  type="button"
                  onClick={() => (myCampaigns.length === 0 ? setTab('open') : setModelFilter('all'))}
                  className="mt-5 rounded-lg bg-[#06458F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#053673]"
                >
                  {myCampaigns.length === 0 ? `Offene Kampagnen ansehen (${openCampaigns.length})` : 'Alle anzeigen'}
                </button>
              </div>
            ) : (
              filteredMy.map((item) => (
                <CampaignCard
                  key={item.campaignPublicId}
                  item={item}
                  onUpdated={async (msg) => {
                    setErrorMsg('');
                    setToastMsg(msg);
                    await refresh();
                  }}
                  onNotice={(msg) => {
                    setErrorMsg('');
                    setToastMsg(msg);
                  }}
                  onError={(err) => {
                    setToastMsg('');
                    setErrorMsg(err);
                  }}
                />
              ))
            )
          ) : filteredOpen.length === 0 ? (
            <div className="rounded-xl border border-[#DCE2EA] bg-white p-10 text-center">
              <p className="text-lg font-bold text-[#202124]">
                {openCampaigns.length === 0
                  ? 'Aktuell keine weiteren offenen Kampagnen'
                  : 'Keine offene Kampagne passt zu diesem Filter'}
              </p>
              <p className="mt-2 text-sm text-[#5C6470]">
                {openCampaigns.length === 0
                  ? 'Halte dein Profil und deine verifizierten Social-Kanäle aktuell, damit Brands dich direkt über die Suche einladen können.'
                  : 'Wechsle den Filter auf „Alle“, um alle offenen Ausschreibungen zu sehen.'}
              </p>
              {openCampaigns.length === 0 ? (
                <Link
                  href="/konto"
                  className="mt-5 inline-block rounded-lg border border-[#DCE2EA] px-5 py-2.5 text-sm font-semibold text-[#202124] hover:border-[#06458F]"
                >
                  Profil optimieren →
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setModelFilter('all')}
                  className="mt-5 rounded-lg bg-[#06458F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#053673]"
                >
                  Alle offenen Kampagnen zeigen
                </button>
              )}
            </div>
          ) : (
            filteredOpen.map((item) => (
              <CampaignCard
                key={item.campaignPublicId}
                item={item}
                onUpdated={async (msg) => {
                  setErrorMsg('');
                  setToastMsg(msg);
                  await refresh();
                  setTab('my');
                }}
                onNotice={(msg) => {
                  setErrorMsg('');
                  setToastMsg(msg);
                }}
                onError={(err) => {
                  setToastMsg('');
                  setErrorMsg(err);
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CampaignCard({
  item,
  onUpdated,
  onNotice,
  onError,
}: {
  item: CreatorCampaignItem;
  onUpdated: (msg: string) => Promise<void>;
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const defaultPlatforms = item.targetPlatforms.length
    ? item.targetPlatforms
    : item.platforms.filter((p) => CREATOR_POST_PLATFORMS.some((cp) => cp.id === p));
  const [pitch, setPitch] = useState(item.creatorPitch || '');
  const [proposedFeeEur, setProposedFeeEur] = useState(
    item.proposedFeeEur ? String(item.proposedFeeEur) : item.budgetPerVideoEur ? String(item.budgetPerVideoEur) : '',
  );
  const [availabilityNote, setAvailabilityNote] = useState(item.availabilityNote || '');
  const [targetPlatforms, setTargetPlatforms] = useState<string[]>(defaultPlatforms.length ? defaultPlatforms : ['tiktok']);
  const [productChoice, setProductChoice] = useState(item.productChoice || '');
  const [busyApply, setBusyApply] = useState(false);

  const toggleTargetPlatform = (id: string) => {
    setTargetPlatforms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const [contentUrl, setContentUrl] = useState('');
  const [clipTitle, setClipTitle] = useState('');
  const [views, setViews] = useState('');
  const [likes, setLikes] = useState('');
  const [comments, setComments] = useState('');
  const [shares, setShares] = useState('');
  const [busySubmit, setBusySubmit] = useState(false);

  const badge = STATUS_BADGE[item.status] || STATUS_BADGE.open;
  const canApplyOrRespond = ['open', 'invited', 'applied', 'shortlisted', 'declined'].includes(item.status);
  const canSubmitContent = ['selected', 'delivered', 'approved'].includes(item.status);
  const isPureTkp = item.compensationModel === 'tkp' && Boolean(item.tkpEurCents);
  const isPureAffiliate = item.compensationModel === 'affiliate';
  const tkpPer1k = item.tkpEurCents ? item.tkpEurCents / 100 : null;
  const affiliateRateText = formatAffiliateSummary(item);
  const trackingUrl = item.affiliateCode ? `https://ugc-vz.de/r/${item.affiliateCode}` : '';

  const copyValue = async (val: string, label: string) => {
    try {
      await navigator.clipboard.writeText(val);
      onNotice(`${label} in die Zwischenablage kopiert!`);
    } catch {
      onError('Kopieren nicht möglich. Bitte markiere den Text manuell.');
    }
  };

  const submitApplication = async (e: FormEvent, action: 'apply' | 'decline' = 'apply') => {
    e.preventDefault();
    if (action !== 'decline' && targetPlatforms.length === 0) {
      onError('Bitte wähle mindestens eine Plattform aus, auf der du posten möchtest.');
      return;
    }
    if (action !== 'decline' && item.requiresProductChoice && !productChoice.trim()) {
      onError('Bitte gib deine gewünschte Produkt-/Varianten-Auswahl an.');
      return;
    }
    setBusyApply(true);
    try {
      const res = await fetch(`/api/creator/campaigns/${encodeURIComponent(item.campaignPublicId)}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          pitch,
          proposedFeeEur:
            !isPureTkp && !isPureAffiliate && item.compensationModel !== 'barter' && proposedFeeEur
              ? Number(proposedFeeEur)
              : null,
          availabilityNote,
          targetPlatforms,
          productChoice: productChoice.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Aktion fehlgeschlagen.');
      await onUpdated(
        action === 'decline'
          ? `Einladung für „${item.title}“ abgelehnt.`
          : item.status === 'open'
            ? `Bewerbung für „${item.title}“ erfolgreich gesendet!`
            : `Angaben für „${item.title}“ aktualisiert.`,
      );
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Bewerbung fehlgeschlagen.');
    } finally {
      setBusyApply(false);
    }
  };

  const submitClip = async (e: FormEvent) => {
    e.preventDefault();
    setBusySubmit(true);
    try {
      const res = await fetch(`/api/creator/campaigns/${encodeURIComponent(item.campaignPublicId)}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentUrl: contentUrl.trim(),
          title: clipTitle.trim(),
          views: views ? Number(views) : 0,
          likes: likes ? Number(likes) : 0,
          comments: comments ? Number(comments) : 0,
          shares: shares ? Number(shares) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Clip konnte nicht eingereicht werden.');
      setContentUrl('');
      setClipTitle('');
      setViews('');
      setLikes('');
      setComments('');
      setShares('');
      await onUpdated(`Clip für „${item.title}“ eingereicht und im Brand-Portal zur Freigabe sichtbar!`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Clip konnte nicht eingereicht werden.');
    } finally {
      setBusySubmit(false);
    }
  };

  return (
    <article className="rounded-xl border border-[#DCE2EA] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C6470]">
            <span className="font-semibold text-[#202124]">{item.brandDisplayName}</span>
            <span>·</span>
            <span className="font-mono">{item.campaignPublicId}</span>
            <span className="rounded-full bg-[#06458F]/10 px-2 py-0.5 font-semibold text-[#06458F]">
              {COMP_MODEL_LABEL[item.compensationModel]}
            </span>
            {item.niche && (
              <>
                <span>·</span>
                <span>{item.niche}</span>
              </>
            )}
          </div>
          <h2 className="mt-1 text-xl font-bold text-[#202124]">{item.title}</h2>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {item.description && (
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#5C6470]">{item.description}</p>
      )}

      {(item.briefingChecklist.length > 0 || item.requiredMention || item.requiredHashtags) && (
        <div className="mt-3 space-y-2 rounded-xl border border-[#06458F]/20 bg-[#F5F7FA] p-4 text-xs">
          {(item.requiredMention || item.requiredHashtags) && (
            <div className="flex flex-wrap gap-2">
              {item.requiredMention && (
                <span className="rounded-full bg-white px-3 py-1 font-semibold text-[#202124]">Pflicht-Tag: {item.requiredMention}</span>
              )}
              {item.requiredHashtags && (
                <span className="rounded-full bg-white px-3 py-1 font-semibold text-[#202124]">Hashtags: {item.requiredHashtags}</span>
              )}
            </div>
          )}
          {item.briefingChecklist.length > 0 && (
            <div>
              <p className="font-bold text-[#202124]">Pflicht-Checkliste fürs Video:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[#5C6470]">
                {item.briefingChecklist.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[11px] text-[#5C6470]">Bitte kennzeichne öffentliche Kampagnen-Posts gut sichtbar am Anfang als „Werbung“ oder „Anzeige“.</p>
        </div>
      )}

      <div className="mt-4 grid gap-3 rounded-xl border border-[#DCE2EA] bg-[#F5F7FA] p-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-semibold text-[#5C6470]">Vergütung &amp; Budget</p>
          <p className="mt-0.5 font-semibold text-[#202124]">{formatBudget(item)}</p>
        </div>
        <div>
          <p className="font-semibold text-[#5C6470]">Plattformen</p>
          <p className="mt-0.5 font-semibold text-[#202124]">
            {item.platforms.length ? item.platforms.map((p) => PLATFORM_LABEL[p] || p).join(', ') : 'Flexibel'}
          </p>
        </div>
        <div>
          <p className="font-semibold text-[#5C6470]">Deliverables</p>
          <p className="mt-0.5 font-semibold text-[#202124]">{item.deliverables || 'Nach Absprache'}</p>
        </div>
        <div>
          <p className="font-semibold text-[#5C6470]">Rechte &amp; Frist</p>
          <p className="mt-0.5 font-semibold text-[#202124]">
            {[item.usageRights, item.deadline].filter(Boolean).join(' · ') || 'Nach Absprache'}
          </p>
        </div>
      </div>

      {/* Fixpreis-Hinweis */}
      {(item.compensationModel === 'fixed' || item.compensationModel === 'hybrid') && item.budgetPerVideoEur && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#06458F]/20 bg-[#06458F]/5 px-4 py-3 text-xs text-[#06458F]">
          <p>
            <strong>Pay-per-Video Fixpreis:</strong> {item.budgetPerVideoEur} € pro freigegebenes Video · <strong>0 % Gebühr</strong> für dich · Gutschrift direkt nach Freigabe im UGC VZ Konto.
          </p>
        </div>
      )}

      {/* Pay-per-View TKP-Rechner */}
      {(tkpPer1k !== null || item.discountCode) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
          {tkpPer1k !== null && (
            <p>
              <strong>Pay-per-View:</strong> {tkpPer1k.toFixed(2).replace('.', ',')} € pro 1.000 Views
              {' · '}z. B. 25.000 Views = <strong>{(25 * tkpPer1k).toLocaleString('de-DE')} €</strong>, 100.000 Views ={' '}
              <strong>{(100 * tkpPer1k).toLocaleString('de-DE')} €</strong>
              {item.remainingBudgetEur !== null && (
                <>
                  {' · '}
                  {item.capReached ? (
                    <strong>Budget-Limit erreicht</strong>
                  ) : (
                    <>noch <strong>{item.remainingBudgetEur.toLocaleString('de-DE')} €</strong> im Budget frei</>
                  )}
                </>
              )}
            </p>
          )}
          {item.discountCode && (
            <span className="rounded-full bg-white px-3 py-1 font-semibold text-[#202124]">
              Aktion: {item.discountCode}
            </span>
          )}
        </div>
      )}

      {/* Affiliate / Kickback Box (mit persönlichem Code & Tracking-Link nach Auswahl) */}
      {affiliateRateText && (
        <div className="mt-3 rounded-xl border border-[#06458F]/25 bg-[#F5F7FA] p-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1.5 font-bold text-[#06458F]">
              <Coins className="h-4 w-4" aria-hidden="true" />
              {affiliateRateText} · 0 % Creator-Gebühr
            </p>
            {item.affiliateCode && (
              <span className="rounded-full bg-white px-2.5 py-0.5 font-bold text-[#202124]">
                {(item.affiliateClicks ?? 0).toLocaleString('de-DE')} Klicks
              </span>
            )}
          </div>
          {item.affiliateCode ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-2 rounded-lg border border-[#DCE2EA] bg-white px-3 py-2">
                <div className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase text-[#5C6470]">Dein Affiliate-Code</span>
                  <code className="font-mono text-sm font-bold text-[#06458F]">{item.affiliateCode}</code>
                </div>
                <button
                  type="button"
                  onClick={() => copyValue(item.affiliateCode!, 'Affiliate-Code')}
                  className="inline-flex items-center gap-1 rounded-md border border-[#DCE2EA] px-2.5 py-1 font-semibold text-[#202124] hover:border-[#06458F] hover:text-[#06458F]"
                >
                  <Copy className="h-3.5 w-3.5" /> Kopieren
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-[#DCE2EA] bg-white px-3 py-2">
                <div className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase text-[#5C6470]">Dein Tracking-Link</span>
                  <span className="block truncate font-mono text-xs font-semibold text-[#202124]">{trackingUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyValue(trackingUrl, 'Tracking-Link')}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#06458F] px-2.5 py-1 font-semibold text-white hover:bg-[#053673]"
                >
                  <Copy className="h-3.5 w-3.5" /> Link
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-1.5 text-[#5C6470]">
              Sobald dich die Brand für diese Kampagne auswählt, erhältst du automatisch deinen persönlichen Affiliate-Code &amp; Tracking-Link genau hier.
            </p>
          )}
        </div>
      )}

      {canApplyOrRespond && (
        <form onSubmit={(e) => submitApplication(e, 'apply')} className="mt-5 space-y-3.5 border-t border-[#DCE2EA] pt-5">
          <p className="text-sm font-bold text-[#202124]">
            {item.status === 'open'
              ? 'Jetzt auf diese Kampagne bewerben'
              : item.status === 'invited'
                ? 'Auf deine persönliche Einladung antworten'
                : 'Deine Bewerbungsangaben aktualisieren'}
          </p>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-[#202124]">
              Auf welchen Plattformen möchtest du posten? *
            </span>
            <div className="flex flex-wrap gap-2">
              {CREATOR_POST_PLATFORMS.map((p) => {
                const active = targetPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleTargetPlatform(p.id)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                      active
                        ? 'border-[#06458F] bg-[#06458F] text-white'
                        : 'border-[#DCE2EA] bg-white text-[#202124] hover:border-[#06458F]'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {item.requiresProductChoice && (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#202124]">
                {item.productChoicePrompt || 'Gewünschtes Produkt / Variante aus dem Shop'} *
              </span>
              <input
                type="text"
                required
                maxLength={300}
                value={productChoice}
                onChange={(e) => setProductChoice(e.target.value)}
                placeholder="z. B. Produktname, Farbe, Größe oder direkter Shop-Link"
                className={fieldClass}
              />
            </label>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {!isPureTkp && !isPureAffiliate && item.compensationModel !== 'barter' ? (
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[#202124]">Dein Honorarvorschlag (€, optional)</span>
                <input
                  type="number"
                  min={0}
                  max={50000}
                  value={proposedFeeEur}
                  onChange={(e) => setProposedFeeEur(e.target.value)}
                  placeholder="z. B. 250"
                  className={fieldClass}
                />
              </label>
            ) : (
              <div className="rounded-lg border border-[#DCE2EA] bg-[#F5F7FA] px-3.5 py-2.5 text-xs text-[#5C6470]">
                <span className="block font-semibold text-[#202124]">Feste Kampagnen-Vergütung</span>
                <span className="mt-0.5 block">{formatBudget(item)}</span>
              </div>
            )}
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#202124]">Verfügbarkeit / Lieferzeit (optional)</span>
              <input
                type="text"
                maxLength={200}
                value={availabilityNote}
                onChange={(e) => setAvailabilityNote(e.target.value)}
                placeholder="z. B. Erste Clips innerhalb von 3 Tagen"
                className={fieldClass}
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#202124]">Kurzer Pitch / Video-Idee</span>
            <textarea
              rows={2}
              maxLength={1500}
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              placeholder="Warum passt du zur Brand? Welche Hook-Idee hättest du?"
              className={fieldClass}
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={busyApply}
              className="inline-flex items-center gap-2 rounded-lg bg-[#06458F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#053673] disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {busyApply
                ? 'Wird gesendet ...'
                : item.status === 'open'
                  ? 'Bewerbung absenden'
                  : item.status === 'invited'
                    ? 'Einladung annehmen & Angebot senden'
                    : 'Angaben speichern'}
            </button>
            {item.status === 'invited' && (
              <button
                type="button"
                disabled={busyApply}
                onClick={(e) => submitApplication(e, 'decline')}
                className="rounded-lg border border-[#DCE2EA] px-4 py-2.5 text-sm font-semibold text-[#5C6470] hover:bg-[#F5F7FA]"
              >
                Einladung ablehnen
              </button>
            )}
          </div>
        </form>
      )}

      {canSubmitContent && (
        <div className="mt-5 space-y-4 border-t border-[#DCE2EA] pt-5">
          {item.submissions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-[#202124]">Deine eingereichten Clips ({item.submissions.length})</p>
              <div className="space-y-2">
                {item.submissions.map((sub) => {
                  const subStatus = SUBMISSION_STATUS_LABEL[sub.status] || SUBMISSION_STATUS_LABEL.submitted;
                  return (
                    <div
                      key={sub.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#DCE2EA] bg-[#F5F7FA] px-4 py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[#202124]">{sub.title || 'Clip'}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${subStatus.className}`}>
                            {subStatus.label}
                          </span>
                        </div>
                        <a
                          href={sub.contentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 inline-flex items-center gap-1 text-xs text-[#06458F] hover:underline"
                        >
                          <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="max-w-xs truncate sm:max-w-md">{sub.contentUrl}</span>
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#5C6470]">
                        <span><strong className="text-[#202124]">{sub.views.toLocaleString('de-DE')}</strong> Views</span>
                        <span><strong className="text-[#202124]">{sub.likes.toLocaleString('de-DE')}</strong> Likes</span>
                        <span><strong className="text-[#202124]">{sub.comments.toLocaleString('de-DE')}</strong> Komm.</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <form onSubmit={submitClip} className="space-y-3 rounded-xl border border-[#06458F]/20 bg-[#F5F7FA] p-4">
            <p className="text-sm font-bold text-[#202124]">Neuen Clip / Content-Link einreichen</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[#202124]">Clip-URL (TikTok, Instagram, YouTube oder Drive) *</span>
                <input
                  type="url"
                  required
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@deinhandle/video/..."
                  className={fieldClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[#202124]">Titel / Hook (optional)</span>
                <input
                  type="text"
                  maxLength={140}
                  value={clipTitle}
                  onChange={(e) => setClipTitle(e.target.value)}
                  placeholder="z. B. Hook A · Morgenroutine"
                  className={fieldClass}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[#202124]">Views (optional)</span>
                <input type="number" min={0} value={views} onChange={(e) => setViews(e.target.value)} placeholder="0" className={fieldClass} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[#202124]">Likes</span>
                <input type="number" min={0} value={likes} onChange={(e) => setLikes(e.target.value)} placeholder="0" className={fieldClass} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[#202124]">Kommentare</span>
                <input type="number" min={0} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="0" className={fieldClass} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[#202124]">Shares</span>
                <input type="number" min={0} value={shares} onChange={(e) => setShares(e.target.value)} placeholder="0" className={fieldClass} />
              </label>
            </div>
            <button
              type="submit"
              disabled={busySubmit}
              className="rounded-lg bg-[#06458F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#053673] disabled:opacity-50"
            >
              {busySubmit ? 'Wird eingereicht ...' : 'Clip einreichen'}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

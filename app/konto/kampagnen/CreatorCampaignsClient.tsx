'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, CheckCircle2, ExternalLink, Link2, Megaphone, Send, ShieldAlert } from 'lucide-react';
import type { CreatorCampaignItem, SubmissionStatus } from '@/app/lib/brand-workspace';

const fieldClass =
  'w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-geo-violet focus:ring-4 focus:ring-geo-violet/10';

const STATUS_BADGE: Record<CreatorCampaignItem['status'], { label: string; className: string }> = {
  open: { label: 'Offen', className: 'bg-geo-violet/10 text-geo-violet' },
  invited: { label: 'Eingeladen', className: 'bg-amber-100 text-amber-900' },
  applied: { label: 'Beworben', className: 'bg-blue-100 text-blue-900' },
  shortlisted: { label: 'Shortlist', className: 'bg-purple-100 text-purple-900' },
  selected: { label: 'Ausgewählt – bereit für Content', className: 'bg-[#edf5e5] text-[#385523]' },
  delivered: { label: 'Clip eingereicht', className: 'bg-[#edf5e5] text-[#385523]' },
  approved: { label: 'Freigegeben', className: 'bg-emerald-100 text-emerald-900' },
  declined: { label: 'Abgelehnt', className: 'bg-surface text-ink-soft' },
};

const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, { label: string; className: string }> = {
  submitted: { label: 'Eingereicht', className: 'bg-blue-100 text-blue-900' },
  revision_requested: { label: 'Überarbeitung angefragt', className: 'bg-amber-100 text-amber-900' },
  approved: { label: 'Freigegeben', className: 'bg-[#edf5e5] text-[#385523]' },
  rejected: { label: 'Abgelehnt', className: 'bg-red-100 text-red-800' },
};

const COMP_MODEL_LABEL: Record<CreatorCampaignItem['compensationModel'], string> = {
  fixed: 'Festpreis',
  tkp: 'Performance / TKP',
  hybrid: 'Hybrid (Basis + TKP)',
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

const formatBudget = (item: CreatorCampaignItem) => {
  const parts: string[] = [];
  if (item.tkpEurCents) parts.push(`${(item.tkpEurCents / 100).toFixed(2).replace('.', ',')} € / 1.000 Views`);
  if (item.budgetPerVideoEur) parts.push(`${item.budgetPerVideoEur} € / Video`);
  if (item.totalBudgetEur) parts.push(`Budget-Limit ${item.totalBudgetEur.toLocaleString('de-DE')} €`);
  return parts.length ? parts.join(' · ') : COMP_MODEL_LABEL[item.compensationModel];
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

  return (
    <div className="min-h-screen px-4 pb-24 pt-10 text-ink sm:px-8 md:px-16 lg:px-24 sm:pt-14">
      <div className="mx-auto max-w-5xl py-6">
        <Link
          href="/konto"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-geo-violet"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Zurück zum Creator-Konto
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-geo-violet">Creator-Workspace</p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Brand-Kampagnen &amp; Ausschreibungen</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
              Antworte auf persönliche Einladungen, bewirb dich auf offene Brand-Kampagnen und reiche deine fertigen TikTok-, Instagram- oder YouTube-Links direkt fürs Kampagnen-Tracking ein.
            </p>
          </div>
          <Link
            href="/konto#social-verify"
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              hasVerifiedSocial
                ? 'border-geo-green/50 bg-[#f6fbf1] text-[#385523]'
                : 'border-geo-violet/30 bg-geo-violet/5 text-geo-violet hover:bg-geo-violet/10'
            }`}
          >
            <BadgeCheck className="h-4 w-4" aria-hidden="true" />
            {hasVerifiedSocial ? 'Social-Kanal verifiziert' : 'Instagram / TikTok verifizieren →'}
          </Link>
        </div>

        {unavailable && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>Die Kampagnen-Datenbank wird gerade eingerichtet oder ist kurzzeitig nicht erreichbar. Bitte versuche es gleich erneut.</p>
          </div>
        )}

        {toastMsg && (
          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-geo-green/60 bg-[#f6fbf1] px-4 py-3 text-sm font-medium text-[#385523]" role="status">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{toastMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {errorMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-hairline pb-3">
          <button
            type="button"
            onClick={() => setTab('my')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === 'my' ? 'bg-geo-violet text-white' : 'bg-surface text-ink-soft hover:text-ink'
            }`}
          >
            <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
            Meine Kampagnen &amp; Einladungen ({myCampaigns.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('open')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === 'open' ? 'bg-geo-violet text-white' : 'bg-surface text-ink-soft hover:text-ink'
            }`}
          >
            <Megaphone className="h-4 w-4" aria-hidden="true" />
            Offene Brand-Kampagnen ({openCampaigns.length})
          </button>
        </div>

        {/* Tab content */}
        <div className="mt-6 space-y-5">
          {tab === 'my' ? (
            myCampaigns.length === 0 ? (
              <div className="rounded-3xl border border-hairline bg-white p-10 text-center">
                <p className="text-lg font-bold text-ink">Noch keine eigenen Kampagnen oder Einladungen</p>
                <p className="mt-2 text-sm text-ink-soft">
                  Schau dir die offenen Brand-Kampagnen an und bewirb dich direkt mit deinem Pitch und Honorarvorschlag.
                </p>
                <button
                  type="button"
                  onClick={() => setTab('open')}
                  className="mt-5 rounded-xl bg-geo-violet px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#053673]"
                >
                  Offene Kampagnen ansehen ({openCampaigns.length})
                </button>
              </div>
            ) : (
              myCampaigns.map((item) => (
                <CampaignCard
                  key={item.campaignPublicId}
                  item={item}
                  onUpdated={async (msg) => {
                    setErrorMsg('');
                    setToastMsg(msg);
                    await refresh();
                  }}
                  onError={(err) => {
                    setToastMsg('');
                    setErrorMsg(err);
                  }}
                />
              ))
            )
          ) : openCampaigns.length === 0 ? (
            <div className="rounded-3xl border border-hairline bg-white p-10 text-center">
              <p className="text-lg font-bold text-ink">Aktuell keine weiteren offenen Kampagnen</p>
              <p className="mt-2 text-sm text-ink-soft">
                Halte dein Profil und deine verifizierten Social-Kanäle aktuell, damit Brands dich direkt über die Suche einladen können.
              </p>
              <Link
                href="/konto"
                className="mt-5 inline-block rounded-xl border border-hairline px-5 py-2.5 text-sm font-semibold text-ink hover:border-geo-violet"
              >
                Profil optimieren →
              </Link>
            </div>
          ) : (
            openCampaigns.map((item) => (
              <CampaignCard
                key={item.campaignPublicId}
                item={item}
                onUpdated={async (msg) => {
                  setErrorMsg('');
                  setToastMsg(msg);
                  await refresh();
                  setTab('my');
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
  onError,
}: {
  item: CreatorCampaignItem;
  onUpdated: (msg: string) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const defaultPlatforms = item.targetPlatforms.length
    ? item.targetPlatforms
    : item.platforms.filter((p) => CREATOR_POST_PLATFORMS.some((cp) => cp.id === p));
  const [pitch, setPitch] = useState(item.creatorPitch || '');
  const [proposedFeeEur, setProposedFeeEur] = useState(item.proposedFeeEur ? String(item.proposedFeeEur) : item.budgetPerVideoEur ? String(item.budgetPerVideoEur) : '');
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
  const tkpPer1k = item.tkpEurCents ? item.tkpEurCents / 100 : null;

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
          proposedFeeEur: !isPureTkp && item.compensationModel !== 'barter' && proposedFeeEur ? Number(proposedFeeEur) : null,
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
      await onUpdated(`Clip für „${item.title}“ eingereicht und im Brand-Reporting sichtbar!`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Clip konnte nicht eingereicht werden.');
    } finally {
      setBusySubmit(false);
    }
  };

  return (
    <article className="rounded-3xl border border-hairline bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
            <span className="font-semibold text-ink">{item.brandDisplayName}</span>
            <span>·</span>
            <span className="font-mono">{item.campaignPublicId}</span>
            {item.niche && (
              <>
                <span>·</span>
                <span>{item.niche}</span>
              </>
            )}
          </div>
          <h2 className="mt-1 text-xl font-bold text-ink">{item.title}</h2>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {item.description && (
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink-soft">{item.description}</p>
      )}

      {(item.briefingChecklist.length > 0 || item.requiredMention || item.requiredHashtags) && (
        <div className="mt-3 space-y-2 rounded-2xl border border-geo-violet/20 bg-[#FBF8FE] p-4 text-xs">
          {(item.requiredMention || item.requiredHashtags) && (
            <div className="flex flex-wrap gap-2">
              {item.requiredMention && (
                <span className="rounded-full bg-white px-3 py-1 font-semibold text-ink">Pflicht-Tag: {item.requiredMention}</span>
              )}
              {item.requiredHashtags && (
                <span className="rounded-full bg-white px-3 py-1 font-semibold text-ink">Hashtags: {item.requiredHashtags}</span>
              )}
            </div>
          )}
          {item.briefingChecklist.length > 0 && (
            <div>
              <p className="font-bold text-ink">Pflicht-Checkliste fürs Video:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink-soft">
                {item.briefingChecklist.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[11px] text-ink-soft">Bitte kennzeichne öffentliche Kampagnen-Posts gut sichtbar am Anfang als „Werbung“ oder „Anzeige“.</p>
        </div>
      )}

      <div className="mt-4 grid gap-3 rounded-2xl border border-hairline bg-surface/60 p-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-semibold text-ink-soft">Vergütung &amp; Budget</p>
          <p className="mt-0.5 font-semibold text-ink">{formatBudget(item)}</p>
        </div>
        <div>
          <p className="font-semibold text-ink-soft">Plattformen</p>
          <p className="mt-0.5 font-semibold text-ink">
            {item.platforms.length ? item.platforms.map((p) => PLATFORM_LABEL[p] || p).join(', ') : 'Flexibel'}
          </p>
        </div>
        <div>
          <p className="font-semibold text-ink-soft">Deliverables</p>
          <p className="mt-0.5 font-semibold text-ink">{item.deliverables || 'Nach Absprache'}</p>
        </div>
        <div>
          <p className="font-semibold text-ink-soft">Rechte &amp; Frist</p>
          <p className="mt-0.5 font-semibold text-ink">
            {[item.usageRights, item.deadline].filter(Boolean).join(' · ') || 'Nach Absprache'}
          </p>
        </div>
      </div>

      {(tkpPer1k !== null || item.discountCode) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-geo-green/50 bg-[#f6fbf1] px-4 py-3 text-xs text-[#385523]">
          {tkpPer1k !== null && (
            <p>
              <strong>Pay-per-View:</strong> {tkpPer1k.toFixed(2).replace('.', ',')} € pro 1.000 Views
              {' · '}z. B. 25.000 Views = <strong>{(25 * tkpPer1k).toLocaleString('de-DE')} €</strong>, 100.000 Views = <strong>{(100 * tkpPer1k).toLocaleString('de-DE')} €</strong>
              {item.remainingBudgetEur !== null && (
                <> · {item.capReached ? <strong>Budget-Limit erreicht</strong> : <>noch <strong>{item.remainingBudgetEur.toLocaleString('de-DE')} €</strong> im Budget frei</>}</>
              )}
            </p>
          )}
          {item.discountCode && (
            <span className="rounded-full bg-white px-3 py-1 font-semibold text-ink">
              Aktion: {item.discountCode}
            </span>
          )}
        </div>
      )}

      {canApplyOrRespond && (
        <form onSubmit={(e) => submitApplication(e, 'apply')} className="mt-5 space-y-3.5 border-t border-hairline pt-5">
          <p className="text-sm font-bold text-ink">
            {item.status === 'open'
              ? 'Jetzt auf diese Kampagne bewerben'
              : item.status === 'invited'
                ? 'Auf deine persönliche Einladung antworten'
                : 'Deine Bewerbungsangaben aktualisieren'}
          </p>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ink">
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
                        ? 'border-geo-violet bg-geo-violet text-white'
                        : 'border-hairline bg-white text-ink hover:border-geo-violet'
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
              <span className="mb-1 block text-xs font-semibold text-ink">
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
            {!isPureTkp && item.compensationModel !== 'barter' ? (
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-ink">Dein Honorarvorschlag (€, optional)</span>
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
              <div className="rounded-xl border border-hairline bg-surface/60 px-3.5 py-2.5 text-xs text-ink-soft">
                <span className="block font-semibold text-ink">Feste Kampagnen-Vergütung</span>
                <span className="mt-0.5 block">{formatBudget(item)}</span>
              </div>
            )}
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-ink">Verfügbarkeit / Lieferzeit (optional)</span>
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
            <span className="mb-1 block text-xs font-semibold text-ink">Kurzer Pitch / Video-Idee</span>
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
              className="inline-flex items-center gap-2 rounded-xl bg-geo-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#053673] disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {busyApply
                ? 'Wird gesendet …'
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
                className="rounded-xl border border-hairline px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-surface"
              >
                Einladung ablehnen
              </button>
            )}
          </div>
        </form>
      )}

      {canSubmitContent && (
        <div className="mt-5 space-y-4 border-t border-hairline pt-5">
          {item.submissions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-ink">Deine eingereichten Clips ({item.submissions.length})</p>
              <div className="space-y-2">
                {item.submissions.map((sub) => {
                  const subStatus = SUBMISSION_STATUS_LABEL[sub.status] || SUBMISSION_STATUS_LABEL.submitted;
                  return (
                    <div
                      key={sub.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-hairline bg-surface/50 px-4 py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink">{sub.title || 'Clip'}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${subStatus.className}`}>
                            {subStatus.label}
                          </span>
                        </div>
                        <a
                          href={sub.contentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 inline-flex items-center gap-1 text-xs text-geo-violet hover:underline"
                        >
                          <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="truncate max-w-xs sm:max-w-md">{sub.contentUrl}</span>
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-ink-soft">
                        <span><strong className="text-ink">{sub.views.toLocaleString('de-DE')}</strong> Views</span>
                        <span><strong className="text-ink">{sub.likes.toLocaleString('de-DE')}</strong> Likes</span>
                        <span><strong className="text-ink">{sub.comments.toLocaleString('de-DE')}</strong> Komm.</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <form onSubmit={submitClip} className="space-y-3 rounded-2xl border border-geo-violet/25 bg-[#FBF8FE] p-4">
            <p className="text-sm font-bold text-ink">Neuen Clip / Content-Link einreichen</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-ink">Clip-URL (TikTok, Instagram, YouTube oder Drive) *</span>
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
                <span className="mb-1 block text-xs font-semibold text-ink">Titel / Hook (optional)</span>
                <input
                  type="text"
                  maxLength={140}
                  value={clipTitle}
                  onChange={(e) => setClipTitle(e.target.value)}
                  placeholder="z. B. Hook A – Morgenroutine"
                  className={fieldClass}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-ink">Views (optional)</span>
                <input type="number" min={0} value={views} onChange={(e) => setViews(e.target.value)} placeholder="0" className={fieldClass} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-ink">Likes</span>
                <input type="number" min={0} value={likes} onChange={(e) => setLikes(e.target.value)} placeholder="0" className={fieldClass} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-ink">Kommentare</span>
                <input type="number" min={0} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="0" className={fieldClass} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-ink">Shares</span>
                <input type="number" min={0} value={shares} onChange={(e) => setShares(e.target.value)} placeholder="0" className={fieldClass} />
              </label>
            </div>
            <button
              type="submit"
              disabled={busySubmit}
              className="rounded-xl bg-geo-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#053673] disabled:opacity-50"
            >
              {busySubmit ? 'Wird eingereicht …' : 'Clip einreichen'}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  CheckCircle2,
  Coins,
  Copy,
  Download,
  ExternalLink,
  Film,
  Link2,
  Lock,
  MessageSquare,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { toast } from 'react-toastify';
import type {
  ApplicationStatus,
  BrandCampaignDetail,
  CampaignSubmissionView,
  SubmissionStatus,
} from '@/app/lib/brand-workspace';
import type { AffiliateConversionView } from '@/app/lib/payments-ledger';

const APP_STATUS_LABEL: Record<ApplicationStatus, { text: string; tone: string }> = {
  invited: { text: 'Eingeladen', tone: 'bg-[#F5F7FA] text-[#5C6470]' },
  applied: { text: 'Bewerbung / Antwort', tone: 'bg-[#06458F]/10 text-[#06458F]' },
  shortlisted: { text: 'Shortlist', tone: 'bg-sky-50 text-sky-800' },
  selected: { text: 'Ausgewählt', tone: 'bg-emerald-50 text-emerald-800' },
  delivered: { text: 'Clip eingereicht', tone: 'bg-[#06458F]/15 text-[#06458F]' },
  approved: { text: 'Freigegeben', tone: 'bg-emerald-100 text-emerald-900' },
  declined: { text: 'Abgelehnt', tone: 'bg-[#F2072A]/10 text-[#D10523]' },
};

const SUB_STATUS_LABEL: Record<SubmissionStatus, { text: string; tone: string }> = {
  submitted: { text: 'Zur Prüfung', tone: 'bg-[#06458F]/10 text-[#06458F]' },
  revision_requested: { text: 'Korrektur angefragt', tone: 'bg-amber-50 text-amber-800' },
  approved: { text: 'Freigegeben', tone: 'bg-emerald-50 text-emerald-800' },
  rejected: { text: 'Abgelehnt', tone: 'bg-[#F2072A]/10 text-[#D10523]' },
};

const TARGET_PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram Reels',
  youtube: 'YouTube Shorts',
  tiktok_shop: 'TikTok Shop',
  files_only: 'Nur Videodateien',
  meta_ads: 'Meta Ads',
};

const COMP_MODEL_BADGE: Record<string, string> = {
  tkp: 'Pay-per-View (TKP)',
  fixed: 'Pay-per-Video (Fixpreis)',
  retainer: 'Core-Creator Retainer (Monatlich)',
  hybrid: 'Hybrid (Fixpreis + TKP)',
  affiliate: 'Affiliate / Kickback',
  barter: 'Produkt / Barter',
};

function formatAffiliateRate(campaign: BrandCampaignDetail['campaign']): string {
  if (!campaign.affiliateEnabled && campaign.compensationModel !== 'affiliate') return '';
  if (campaign.affiliateType === 'fixed_per_sale') {
    const eur = ((campaign.affiliateFixedCents ?? 1500) / 100).toFixed(2).replace('.', ',');
    return `${eur} € Kickback / Sale`;
  }
  const pct = ((campaign.affiliateRateBps ?? 1000) / 100).toFixed(1).replace(/\.0$/, '').replace('.', ',');
  return `${pct} % Affiliate-Kickback`;
}

export default function CampaignDetailClient({ initialDetail }: { initialDetail: BrandCampaignDetail }) {
  const [detail, setDetail] = useState<BrandCampaignDetail>(initialDetail);
  const [tab, setTab] = useState<'creators' | 'submissions' | 'affiliate' | 'report'>('creators');
  const [busyId, setBusyId] = useState('');

  const { campaign, applications, submissions, report } = detail;
  const hasAffiliate = Boolean(campaign.affiliateEnabled || campaign.compensationModel === 'affiliate');
  const affiliateRateLabel = formatAffiliateRate(campaign);

  const [affiliateState, setAffiliateState] = useState<{
    loading: boolean;
    loaded: boolean;
    webhookSecret: string;
    conversions: AffiliateConversionView[];
  }>({
    loading: false,
    loaded: false,
    webhookSecret: '',
    conversions: [],
  });

  const [saleAppId, setSaleAppId] = useState('');
  const [saleOrderRef, setSaleOrderRef] = useState('');
  const [saleOrderAmountEur, setSaleOrderAmountEur] = useState('');
  const [saleOverrideCommissionEur, setSaleOverrideCommissionEur] = useState('');
  const [saleNote, setSaleNote] = useState('');
  const [savingSale, setSavingSale] = useState(false);

  const reload = async () => {
    const res = await fetch(`/api/brand/campaigns/${encodeURIComponent(campaign.publicId)}`);
    const data = await res.json();
    if (res.ok && data.success) {
      setDetail({
        campaign: data.campaign,
        applications: data.applications,
        submissions: data.submissions,
        report: data.report,
      });
    }
  };

  const loadAffiliate = useCallback(async () => {
    if (!hasAffiliate) return;
    setAffiliateState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`/api/brand/campaigns/${encodeURIComponent(campaign.publicId)}/affiliate`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAffiliateState({
          loading: false,
          loaded: true,
          webhookSecret: String(data.affiliate?.webhookSecret || ''),
          conversions: Array.isArray(data.conversions) ? data.conversions : [],
        });
      } else {
        setAffiliateState((prev) => ({ ...prev, loading: false }));
      }
    } catch {
      setAffiliateState((prev) => ({ ...prev, loading: false }));
    }
  }, [campaign.publicId, hasAffiliate]);

  useEffect(() => {
    if (tab === 'affiliate' && hasAffiliate && !affiliateState.loaded && !affiliateState.loading) {
      loadAffiliate();
    }
  }, [tab, hasAffiliate, affiliateState.loaded, affiliateState.loading, loadAffiliate]);

  const affiliateEligibleApps = applications.filter((a) =>
    Boolean(a.affiliateCode) || ['selected', 'delivered', 'approved'].includes(a.status),
  );

  useEffect(() => {
    if (!saleAppId && affiliateEligibleApps.length > 0) {
      setSaleAppId(affiliateEligibleApps[0].id);
    }
  }, [saleAppId, affiliateEligibleApps]);

  const patchCampaign = async (patch: Record<string, unknown>) => {
    setBusyId('campaign');
    try {
      const res = await fetch(`/api/brand/campaigns/${encodeURIComponent(campaign.publicId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Speichern fehlgeschlagen');
      setDetail({
        campaign: data.campaign,
        applications: data.applications,
        submissions: data.submissions,
        report: data.report,
      });
      toast.success('Kampagnen-Einstellungen aktualisiert.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Speichern.');
    } finally {
      setBusyId('');
    }
  };

  const updateApplication = async (appId: string, status: ApplicationStatus) => {
    setBusyId(appId);
    try {
      const res = await fetch(
        `/api/brand/campaigns/${encodeURIComponent(campaign.publicId)}/applications/${encodeURIComponent(appId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Update fehlgeschlagen');
      await reload();
      if (status === 'selected' && data.application?.affiliateCode) {
        toast.success(`Creator ausgewählt · Persönlicher Affiliate-Code ${data.application.affiliateCode} wurde erzeugt und per E-Mail versendet.`);
      } else {
        toast.success('Creator-Status aktualisiert.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Aktualisieren.');
    } finally {
      setBusyId('');
    }
  };

  const handleRecordAffiliateSale = async (e: FormEvent) => {
    e.preventDefault();
    if (!saleAppId) {
      toast.error('Bitte wähle zuerst einen Creator aus.');
      return;
    }
    setSavingSale(true);
    try {
      const res = await fetch(`/api/brand/campaigns/${encodeURIComponent(campaign.publicId)}/affiliate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: saleAppId,
          externalOrderRef: saleOrderRef.trim(),
          orderAmountEur: saleOrderAmountEur.trim() || '0',
          commissionEur: saleOverrideCommissionEur.trim() || '0',
          note: saleNote.trim(),
          autoApprove: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Sale konnte nicht verbucht werden.');
      setAffiliateState((prev) => ({
        ...prev,
        loaded: true,
        conversions: Array.isArray(data.conversions) ? data.conversions : prev.conversions,
      }));
      setSaleOrderRef('');
      setSaleOrderAmountEur('');
      setSaleOverrideCommissionEur('');
      setSaleNote('');
      const eur = ((Number(data.conversion?.commissionCents || 0)) / 100).toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      toast.success(
        data.conversion?.createdNow
          ? `Sale verbucht · ${eur} € Kickback sofort im Creator-Guthaben gutgeschrieben!`
          : 'Diese Bestellnummer wurde bereits verbucht (Duplikat-Schutz).',
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Verbuchen des Affiliate-Sales.');
    } finally {
      setSavingSale(false);
    }
  };

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} kopiert!`);
    } catch {
      toast.error('Konnte nicht in die Zwischenablage kopiert werden.');
    }
  };

  const totalAffiliateClicks = applications.reduce((sum, a) => sum + (a.affiliateClicks || 0), 0);
  const totalAffiliateCommissionCents = affiliateState.conversions
    .filter((c) => c.status === 'approved')
    .reduce((sum, c) => sum + c.commissionCents, 0);

  const previewOrderEur = Number(saleOrderAmountEur.replace(',', '.')) || 0;
  const previewKickbackEur =
    Number(saleOverrideCommissionEur.replace(',', '.')) > 0
      ? Number(saleOverrideCommissionEur.replace(',', '.'))
      : campaign.affiliateType === 'fixed_per_sale'
        ? (campaign.affiliateFixedCents ?? 1500) / 100
        : (previewOrderEur * (campaign.affiliateRateBps ?? 1000)) / 10_000;

  return (
    <div className="min-h-screen bg-white px-4 pb-24 pt-10 text-[#202124] sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <Link href="/brand" className="text-sm font-medium text-[#5C6470] hover:text-[#06458F]">
            ← Zurück zum Brand-Workspace
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="font-mono text-[#5C6470]">{campaign.publicId}</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-800">
                  {campaign.status === 'active' ? 'Aktiv' : campaign.status === 'paused' ? 'Pausiert' : 'Abgeschlossen'}
                </span>
                <span className="rounded-full bg-[#06458F]/10 px-2.5 py-0.5 text-[#06458F]">
                  {COMP_MODEL_BADGE[campaign.compensationModel] || campaign.compensationModel}
                </span>
                <span className="rounded-full border border-[#DCE2EA] bg-[#F5F7FA] px-2.5 py-0.5 text-[#5C6470]">
                  {campaign.visibility === 'open' ? 'Offen für 750+ Creator' : 'Nur Direkteinladung'}
                </span>
                {campaign.requiresHighRiskBilling && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F2072A]/10 px-2.5 py-0.5 text-[#D10523]">
                    <ShieldAlert size={11} /> Sonderbranche / High-Risk-Abrechnung
                  </span>
                )}
              </div>
              <h1 className="mt-2 text-3xl font-bold text-[#202124] sm:text-4xl">{campaign.title}</h1>
              <p className="mt-1 text-sm text-[#5C6470]">
                {[
                  campaign.deliverables,
                  campaign.compensationModel === 'retainer' && campaign.retainerMonthlyEur
                    ? `${campaign.retainerMonthlyEur.toLocaleString('de-DE')} € / Monat${campaign.retainerVideosPerMonth ? ` (${campaign.retainerVideosPerMonth} Videos/Monat)` : ''}`
                    : '',
                  campaign.tkpEurCents ? `${(campaign.tkpEurCents / 100).toFixed(2).replace('.', ',')} € / 1.000 Views` : '',
                  campaign.budgetPerVideoEur ? `${campaign.budgetPerVideoEur} € / Video` : '',
                  affiliateRateLabel,
                  campaign.totalBudgetEur ? `Budget-Limit ${campaign.totalBudgetEur.toLocaleString('de-DE')} €` : '',
                  campaign.usageRights,
                  campaign.deadline,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {campaign.retainerPerks && (
                <p className="mt-2 inline-flex items-center rounded-full border border-[#06458F]/20 bg-[#F5F7FA] px-3 py-1 text-xs font-semibold text-[#202124]">
                  Retainer-Perks: {campaign.retainerPerks}
                </p>
              )}
              {campaign.discountCode && (
                <p className="mt-2 inline-flex items-center rounded-full border border-[#06458F]/25 bg-[#06458F]/5 px-3 py-1 text-xs font-semibold text-[#06458F]">
                  Aktions-Hinweis: {campaign.discountCode}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyId === 'campaign'}
                onClick={() => patchCampaign({ visibility: campaign.visibility === 'open' ? 'invite_only' : 'open' })}
                className="rounded-lg border border-[#DCE2EA] px-3.5 py-2 text-xs font-semibold text-[#202124] hover:border-[#06458F]"
              >
                {campaign.visibility === 'open' ? 'Auf „Nur Einladung“ umstellen' : 'Offen für 750+ Creator ausschreiben'}
              </button>
              <button
                type="button"
                disabled={busyId === 'campaign'}
                onClick={() => patchCampaign({ status: campaign.status === 'active' ? 'paused' : 'active' })}
                className="rounded-lg border border-[#DCE2EA] px-3.5 py-2 text-xs font-semibold text-[#202124] hover:border-[#06458F]"
              >
                {campaign.status === 'active' ? 'Pausieren' : 'Wieder aktivieren'}
              </button>
              {campaign.reportShareToken && (
                <button
                  type="button"
                  onClick={() => copyText(`${window.location.origin}/report/${campaign.reportShareToken}`, 'Live-Report-Link')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#06458F]/35 bg-[#06458F]/5 px-3.5 py-2 text-xs font-bold text-[#06458F] hover:bg-[#06458F]/10"
                >
                  <Copy size={13} /> Report-Link teilen
                </button>
              )}
              <a
                href={`/api/brand/campaigns/${encodeURIComponent(campaign.publicId)}/report.csv`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#202124] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#06458F]"
              >
                <Download size={14} /> CSV-Report
              </a>
            </div>
          </div>

          {(campaign.description || campaign.briefingChecklist.length > 0 || campaign.requiredMention || campaign.requiredHashtags) && (
            <div className="mt-4 max-w-4xl space-y-3 rounded-xl border border-[#DCE2EA] bg-[#F5F7FA] p-4 text-sm leading-6 text-[#5C6470]">
              {campaign.description && <p className="whitespace-pre-line">{campaign.description}</p>}
              {(campaign.requiredMention || campaign.requiredHashtags) && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {campaign.requiredMention && (
                    <span className="rounded-full bg-white px-3 py-1 font-semibold text-[#202124]">Pflicht-Tag: {campaign.requiredMention}</span>
                  )}
                  {campaign.requiredHashtags && (
                    <span className="rounded-full bg-white px-3 py-1 font-semibold text-[#202124]">Hashtags: {campaign.requiredHashtags}</span>
                  )}
                </div>
              )}
              {campaign.briefingChecklist.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#202124]">Briefing-Checkliste für die Beitragsprüfung</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-[#202124]">
                    {campaign.briefingChecklist.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Budget-Limit & Fortschritt */}
        {campaign.totalBudgetEur && campaign.totalBudgetEur > 0 && (
          <div
            className={`rounded-xl border p-5 ${
              report.capReached
                ? 'border-[#F2072A]/40 bg-[#F2072A]/5'
                : (report.budgetUtilizationPct ?? 0) >= 80
                  ? 'border-amber-300 bg-amber-50/80'
                  : 'border-[#06458F]/20 bg-[#F5F7FA]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#06458F]">
                  {campaign.tkpEurCents
                    ? `Performance-Budget · ${(campaign.tkpEurCents / 100).toFixed(2).replace('.', ',')} € / 1.000 Views`
                    : campaign.budgetPerVideoEur
                      ? `Gesichertes Kampagnenbudget · ${campaign.budgetPerVideoEur} € / Video`
                      : 'Kampagnen-Budget-Limit'}
                </p>
                <p className="mt-1 text-lg font-extrabold text-[#202124]">
                  {report.cappedPayoutEur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €{' '}
                  <span className="text-sm font-medium text-[#5C6470]">
                    von {campaign.totalBudgetEur.toLocaleString('de-DE')} € ({Math.min(100, report.budgetUtilizationPct ?? 0).toFixed(1).replace('.', ',')} %)
                  </span>
                </p>
              </div>
              <div className="text-right text-xs">
                {report.capReached ? (
                  <span className="inline-flex rounded-full bg-[#F2072A] px-3 py-1 font-bold text-white">
                    Budget-Limit erreicht · Kampagne pausierbar
                  </span>
                ) : (report.budgetUtilizationPct ?? 0) >= 80 ? (
                  <div className="space-y-0.5">
                    <span className="inline-flex rounded-full bg-amber-600 px-3 py-1 font-bold text-white">
                      Über 80 % Budget ausgeschöpft
                    </span>
                    <p className="font-bold text-amber-900">
                      Restbudget: {(report.remainingBudgetEur ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <p className="font-bold text-emerald-800">
                      Restbudget: {(report.remainingBudgetEur ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </p>
                    {report.viewsUntilCap !== null && (
                      <p className="text-[#5C6470]">
                        Noch ca. {report.viewsUntilCap.toLocaleString('de-DE')} Views im Budget (max. {(report.maxCapViews ?? 0).toLocaleString('de-DE')})
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white">
              <div
                className={`h-full rounded-full transition-all ${
                  report.capReached ? 'bg-[#F2072A]' : (report.budgetUtilizationPct ?? 0) >= 80 ? 'bg-amber-500' : 'bg-[#06458F]'
                }`}
                style={{ width: `${Math.min(100, report.budgetUtilizationPct ?? 0)}%` }}
              />
            </div>
          </div>
        )}

        {/* 5 KPI-Karten */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-[#DCE2EA] bg-[#F5F7FA] p-4">
            <p className="text-xs font-semibold text-[#5C6470]">Budget-Status</p>
            <p className="mt-1 text-xl font-extrabold text-[#202124]">
              {report.cappedPayoutEur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </p>
            <p className="mt-0.5 text-[11px] text-[#5C6470]">
              {campaign.totalBudgetEur ? `von ${campaign.totalBudgetEur.toLocaleString('de-DE')} € Limit` : 'Offenes Budget'}
            </p>
          </div>
          <div className="rounded-xl border border-[#DCE2EA] bg-[#F5F7FA] p-4">
            <p className="text-xs font-semibold text-[#5C6470]">Geprüfte Views</p>
            <p className="mt-1 text-xl font-extrabold text-[#06458F]">{report.approvedViews.toLocaleString('de-DE')}</p>
            <p className="mt-0.5 text-[11px] text-[#5C6470]">Gesamt: {report.totalViews.toLocaleString('de-DE')}</p>
          </div>
          <div className="rounded-xl border border-[#DCE2EA] bg-[#F5F7FA] p-4">
            <p className="text-xs font-semibold text-[#5C6470]">Beiträge</p>
            <p className="mt-1 text-xl font-extrabold text-[#202124]">{report.totalSubmissions}</p>
            <p className="mt-0.5 text-[11px] text-[#5C6470]">
              {report.approvedSubmissions} frei · {submissions.filter((s) => s.status === 'submitted').length} in Prüfung
            </p>
          </div>
          <div className="rounded-xl border border-[#DCE2EA] bg-[#F5F7FA] p-4">
            <p className="text-xs font-semibold text-[#5C6470]">{hasAffiliate ? 'Affiliate-Klicks' : 'Effektiver TKP'}</p>
            <p className="mt-1 text-xl font-extrabold text-[#202124]">
              {hasAffiliate
                ? totalAffiliateClicks.toLocaleString('de-DE')
                : report.effectiveCpmEur !== null
                  ? `${report.effectiveCpmEur.toFixed(2).replace('.', ',')} €`
                  : '-'}
            </p>
            <p className="mt-0.5 text-[11px] text-[#5C6470]">
              {hasAffiliate ? affiliateRateLabel : `Ø ER: ${report.engagementRatePct.toFixed(2).replace('.', ',')} %`}
            </p>
          </div>
          <div className="rounded-xl border border-[#DCE2EA] bg-[#F5F7FA] p-4">
            <p className="text-xs font-semibold text-[#5C6470]">Aktive Creator</p>
            <p className="mt-1 text-xl font-extrabold text-emerald-700">{campaign.counts.selected}</p>
            <p className="mt-0.5 text-[11px] text-[#5C6470]">{applications.length} im Funnel</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#DCE2EA] pb-3" role="tablist">
          {[
            { id: 'creators', label: `Creator & Bewerbungen (${applications.length})`, Icon: Users },
            { id: 'submissions', label: `Content & Freigabe (${submissions.length})`, Icon: Film },
            ...(hasAffiliate ? [{ id: 'affiliate', label: `Affiliate & Kickbacks`, Icon: Coins }] : []),
            { id: 'report', label: 'Performance-Reporting', Icon: BarChart3 },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id as typeof tab)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === id
                  ? 'bg-[#06458F] text-white'
                  : 'bg-[#F5F7FA] text-[#5C6470] hover:text-[#202124]'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* TAB 1: CREATOR & BEWERBUNGEN */}
        {tab === 'creators' && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-[#5C6470]">
                Eingeladene Creator &amp; Bewerbungen aus dem UGC VZ Pool. Alle Status-Updates, Videofreigaben und Auszahlungen laufen direkt über das Portal.
              </p>
              <Link href="/brands" className="text-sm font-semibold text-[#06458F] underline">
                Weitere Creator in der Suche finden →
              </Link>
            </div>
            {applications.length === 0 ? (
              <div className="rounded-xl border border-[#DCE2EA] bg-[#F5F7FA] p-8 text-center text-sm text-[#5C6470]">
                Noch keine Creator in dieser Kampagne.
                {campaign.visibility === 'open'
                  ? ' Deine Ausschreibung ist live im Creator-Konto sichtbar. Bewerbungen erscheinen automatisch hier.'
                  : ' Stelle die Kampagne auf „Offen ausschreiben“ oder lade Creator über die Suche ein.'}
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => {
                  const badge = APP_STATUS_LABEL[app.status];
                  const isConnectedInPortal = ['applied', 'shortlisted', 'selected', 'delivered', 'approved'].includes(app.status);
                  const trackingUrl = app.affiliateCode ? `https://ugc-vz.de/r/${app.affiliateCode}` : '';
                  return (
                    <article key={app.id} className="rounded-xl border border-[#DCE2EA] bg-white p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-[#202124]">{app.creatorName}</h3>
                            {app.creatorCity && <span className="text-xs text-[#5C6470]">· {app.creatorCity}</span>}
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.tone}`}>{badge.text}</span>
                            <span className="rounded-full border border-[#DCE2EA] px-2 py-0.5 text-[11px] text-[#5C6470]">
                              {app.source === 'applied' ? 'Eigenbewerbung' : 'Eingeladen'}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[#5C6470]">
                            Profil-Preis: <strong className="text-[#202124]">{app.creatorPrice}</strong>
                            {app.proposedFeeEur !== null && (
                              <> · Angebot für diese Kampagne: <strong className="text-[#06458F]">{app.proposedFeeEur.toLocaleString('de-DE')} €</strong></>
                            )}
                            {app.availabilityNote && <> · Verfügbarkeit: <strong className="text-[#202124]">{app.availabilityNote}</strong></>}
                          </p>
                          {app.creatorPitch && (
                            <p className="mt-3 rounded-lg bg-[#F5F7FA] p-3 text-sm leading-6 text-[#202124]">{app.creatorPitch}</p>
                          )}

                          {(app.targetPlatforms.length > 0 || app.productChoice) && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                              {app.targetPlatforms.length > 0 && (
                                <span className="font-semibold text-[#5C6470]">Postet auf:</span>
                              )}
                              {app.targetPlatforms.map((plat) => (
                                <span
                                  key={plat}
                                  className="rounded-full bg-[#06458F]/10 px-2.5 py-0.5 font-semibold text-[#06458F]"
                                >
                                  {TARGET_PLATFORM_LABELS[plat] || plat}
                                </span>
                              ))}
                              {app.productChoice && (
                                <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-amber-950">
                                  Produkt-Wunsch: <strong>{app.productChoice}</strong>
                                </span>
                              )}
                            </div>
                          )}

                          {/* Verifizierte Social-Accounts, Portfolio & Portal-Status (kein Off-Platform-Mail-Bypass) */}
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                            {app.verifiedSocials.map((s, idx) => (
                              <a
                                key={`${s.url}-${idx}`}
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium ${
                                  s.verifiedAt
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                    : 'border-[#DCE2EA] bg-white text-[#5C6470]'
                                }`}
                              >
                                {s.verifiedAt && <ShieldCheck size={12} />}
                                {s.platform} {s.handle ? `(${s.handle})` : ''}
                                {s.verifiedAt ? ' · Verifiziert' : ''}
                              </a>
                            ))}
                            {app.creatorPortfolio.map((url, idx) => (
                              <a
                                key={`${url}-${idx}`}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-full border border-[#DCE2EA] px-2.5 py-1 font-semibold text-[#06458F] hover:border-[#06458F]"
                              >
                                Arbeitsprobe {idx + 1} <ExternalLink size={11} />
                              </a>
                            ))}
                            {isConnectedInPortal && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-[#06458F]/20 bg-[#06458F]/5 px-2.5 py-1 font-semibold text-[#06458F]">
                                <Lock size={11} /> Über Portal verbunden
                              </span>
                            )}
                          </div>

                          {/* Persönlicher Affiliate-Code & Tracking-Link */}
                          {app.affiliateCode && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-[#06458F]/20 bg-[#F5F7FA] px-3 py-2 text-xs">
                              <span className="font-semibold text-[#202124]">
                                Affiliate-Code: <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[#06458F]">{app.affiliateCode}</code>
                              </span>
                              <span className="text-[#5C6470]">·</span>
                              <button
                                type="button"
                                onClick={() => copyText(trackingUrl, 'Tracking-Link')}
                                className="inline-flex items-center gap-1 font-semibold text-[#06458F] hover:underline"
                              >
                                <Link2 size={12} /> {trackingUrl} <Copy size={11} />
                              </button>
                              <span className="ml-auto rounded-full bg-white px-2.5 py-0.5 font-bold text-[#202124]">
                                {(app.affiliateClicks ?? 0).toLocaleString('de-DE')} Klicks
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busyId === app.id}
                            onClick={() => updateApplication(app.id, 'shortlisted')}
                            className="rounded-lg border border-[#DCE2EA] px-3 py-2 text-xs font-semibold text-[#202124] hover:border-[#06458F] disabled:opacity-50"
                          >
                            Shortlist
                          </button>
                          <button
                            type="button"
                            disabled={busyId === app.id}
                            onClick={() => updateApplication(app.id, 'selected')}
                            className="rounded-lg bg-[#06458F] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#053673] disabled:opacity-50"
                          >
                            Auswählen
                          </button>
                          <button
                            type="button"
                            disabled={busyId === app.id}
                            onClick={() => updateApplication(app.id, 'declined')}
                            className="rounded-lg border border-[#DCE2EA] px-3 py-2 text-xs font-semibold text-[#5C6470] hover:border-[#F2072A] hover:text-[#D10523] disabled:opacity-50"
                          >
                            Ablehnen
                          </button>
                        </div>
                      </div>
                      <BrandPortalMessageDrawer
                        campaignPublicId={campaign.publicId}
                        applicationId={app.id}
                        creatorName={app.creatorName}
                      />
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: CONTENT & FREIGABE */}
        {tab === 'submissions' && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-[#5C6470]">
                {campaign.compensationModel === 'fixed' || campaign.compensationModel === 'hybrid'
                  ? 'Prüfe eingereichte Videos deiner ausgewählten Creator. Mit Klick auf „Freigeben & Honorar auszahlen“ wird das Fixpreis-Honorar direkt aus deinem Budget-Wallet im Creator-Konto gutgeschrieben (0 % Gebühr für Creator).'
                  : 'Eingereichte TikTok-, Instagram-Reels- oder YouTube-Links deiner ausgewählten Creator. Prüfe Clips, gib sie frei und pflege aktuelle Performance-Metriken für dein Reporting.'}
              </p>
              <Link href="/brand/wallet" className="text-xs font-bold text-[#06458F] underline">
                Marken-Wallet verwalten →
              </Link>
            </div>
            {submissions.length === 0 ? (
              <div className="rounded-xl border border-[#DCE2EA] bg-[#F5F7FA] p-8 text-center text-sm text-[#5C6470]">
                Noch keine Clips eingereicht. Sobald du Creator ausgewählt hast, können diese ihre Video-URLs direkt über ihr UGC VZ Konto einreichen.
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => (
                  <SubmissionTrackerRow
                    key={sub.id}
                    campaignPublicId={campaign.publicId}
                    tkpEurCents={campaign.tkpEurCents}
                    budgetPerVideoEur={campaign.budgetPerVideoEur}
                    compensationModel={campaign.compensationModel}
                    sub={sub}
                    onUpdated={reload}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 3 (OPTIONAL): AFFILIATE & KICKBACKS */}
        {tab === 'affiliate' && hasAffiliate && (
          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-[#06458F]/20 bg-[#F5F7FA] p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#06458F]">Kickback-Modell</p>
                <p className="mt-1 text-2xl font-extrabold text-[#202124]">{affiliateRateLabel}</p>
                <p className="mt-1 text-xs text-[#5C6470]">
                  {campaign.affiliateTargetUrl ? `Ziel-URL: ${campaign.affiliateTargetUrl}` : 'Tracking über persönlichen Creator-Code'}
                </p>
              </div>
              <div className="rounded-xl border border-[#DCE2EA] bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#5C6470]">Klicks über /r/CODE</p>
                <p className="mt-1 text-2xl font-extrabold text-[#06458F]">{totalAffiliateClicks.toLocaleString('de-DE')}</p>
                <p className="mt-1 text-xs text-[#5C6470]">
                  {applications.filter((a) => Boolean(a.affiliateCode)).length} aktive Creator-Links
                </p>
              </div>
              <div className="rounded-xl border border-[#DCE2EA] bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#5C6470]">Freigegebene Kickbacks</p>
                <p className="mt-1 text-2xl font-extrabold text-emerald-700">
                  {(totalAffiliateCommissionCents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </p>
                <p className="mt-1 text-xs text-[#5C6470]">
                  {affiliateState.conversions.filter((c) => c.status === 'approved').length} bestätigte Sales (0 % Creator-Gebühr)
                </p>
              </div>
            </div>

            {/* Aktive Creator-Codes & Tracking-Links */}
            <div className="rounded-xl border border-[#DCE2EA] bg-white p-6">
              <h2 className="text-base font-bold text-[#202124]">Persönliche Creator-Codes &amp; Tracking-Links</h2>
              <p className="mt-1 text-xs text-[#5C6470]">
                Jeder ausgewählte Creator erhält automatisch seinen eigenen Kurzlink mit UTM-Parametern. Klicks werden in Echtzeit gezählt.
              </p>
              {affiliateEligibleApps.length === 0 ? (
                <p className="mt-4 rounded-lg bg-[#F5F7FA] p-4 text-xs text-[#5C6470]">
                  Wähle zuerst Creator im Tab „Creator &amp; Bewerbungen“ aus, damit persönliche Affiliate-Codes erzeugt werden.
                </p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {affiliateEligibleApps.map((app) => {
                    const link = app.affiliateCode ? `https://ugc-vz.de/r/${app.affiliateCode}` : '';
                    return (
                      <div key={app.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#DCE2EA] bg-[#F5F7FA] px-4 py-3 text-xs">
                        <div className="min-w-0">
                          <p className="font-bold text-[#202124]">{app.creatorName}</p>
                          {app.affiliateCode ? (
                            <p className="mt-0.5 truncate font-mono text-[#06458F]">{app.affiliateCode} · {link}</p>
                          ) : (
                            <p className="mt-0.5 text-[#5C6470]">Code wird bei nächster Auswahl erzeugt</p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="rounded-full bg-white px-2.5 py-1 font-bold text-[#202124]">
                            {(app.affiliateClicks ?? 0).toLocaleString('de-DE')} Klicks
                          </span>
                          {link && (
                            <button
                              type="button"
                              onClick={() => copyText(link, 'Affiliate-Link')}
                              className="rounded-lg border border-[#DCE2EA] bg-white p-1.5 text-[#06458F] hover:border-[#06458F]"
                              title="Tracking-Link kopieren"
                            >
                              <Copy size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bestätigten Sale verbuchen & sofort auszahlen */}
            <form onSubmit={handleRecordAffiliateSale} className="rounded-xl border border-[#06458F]/25 bg-[#F5F7FA] p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-[#202124]">Bestätigten Sale verbuchen &amp; Kickback freigeben</h2>
                  <p className="mt-0.5 text-xs text-[#5C6470]">
                    Der Kickback wird direkt aus deinem Kampagnenbudget / Marken-Wallet im Creator-Guthaben gutgeschrieben (Creator wird per E-Mail benachrichtigt).
                  </p>
                </div>
                <Link href="/brand/wallet" className="text-xs font-bold text-[#06458F] underline">
                  Wallet aufladen →
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-[#202124]">Creator / Code *</span>
                  <select
                    value={saleAppId}
                    onChange={(e) => setSaleAppId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[#DCE2EA] bg-white px-3 py-2 text-xs font-semibold text-[#202124]"
                  >
                    <option value="">Creator wählen ...</option>
                    {affiliateEligibleApps.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.creatorName} {app.affiliateCode ? `(${app.affiliateCode})` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-[#202124]">Bestellnummer (optional)</span>
                  <input
                    type="text"
                    maxLength={120}
                    value={saleOrderRef}
                    onChange={(e) => setSaleOrderRef(e.target.value)}
                    placeholder="z. B. ORD-10482"
                    className="w-full rounded-lg border border-[#DCE2EA] bg-white px-3 py-2 text-xs text-[#202124]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-[#202124]">Bestellwert netto (€)</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={saleOrderAmountEur}
                    onChange={(e) => setSaleOrderAmountEur(e.target.value)}
                    placeholder="z. B. 89.90"
                    className="w-full rounded-lg border border-[#DCE2EA] bg-white px-3 py-2 text-xs text-[#202124]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-[#202124]">
                    Kickback (€, leer = auto)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={saleOverrideCommissionEur}
                    onChange={(e) => setSaleOverrideCommissionEur(e.target.value)}
                    placeholder={previewKickbackEur > 0 ? `${previewKickbackEur.toFixed(2)}` : 'auto'}
                    className="w-full rounded-lg border border-[#DCE2EA] bg-white px-3 py-2 text-xs text-[#202124]"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <input
                  type="text"
                  maxLength={280}
                  value={saleNote}
                  onChange={(e) => setSaleNote(e.target.value)}
                  placeholder="Optionaler Vermerk (z. B. Retourenfrist abgelaufen)"
                  className="min-w-[240px] flex-1 rounded-lg border border-[#DCE2EA] bg-white px-3 py-2 text-xs text-[#202124]"
                />
                <button
                  type="submit"
                  disabled={savingSale || affiliateEligibleApps.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#06458F] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#053673] disabled:opacity-50"
                >
                  <Plus size={14} />
                  {savingSale
                    ? 'Wird verbucht ...'
                    : previewKickbackEur > 0
                      ? `Sale verbuchen & ${previewKickbackEur.toFixed(2).replace('.', ',')} € gutschreiben`
                      : 'Sale verbuchen & Kickback auszahlen'}
                </button>
              </div>
            </form>

            {/* Verbuchte Sales Tabelle */}
            <div className="rounded-xl border border-[#DCE2EA] bg-white p-6">
              <h2 className="text-base font-bold text-[#202124]">Erfasste Affiliate-Conversions ({affiliateState.conversions.length})</h2>
              {affiliateState.loading ? (
                <p className="mt-4 text-xs text-[#5C6470]">Lade Affiliate-Daten ...</p>
              ) : affiliateState.conversions.length === 0 ? (
                <p className="mt-4 text-xs text-[#5C6470]">Noch keine Sales verbucht. Erfasse bestätigte Bestellungen oben manuell oder per Shop-Webhook.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#DCE2EA] uppercase text-[#5C6470]">
                        <th className="py-2 pr-4">Creator</th>
                        <th className="py-2 pr-4">Code</th>
                        <th className="py-2 pr-4">Bestell-Nr.</th>
                        <th className="py-2 pr-4">Bestellwert</th>
                        <th className="py-2 pr-4">Kickback</th>
                        <th className="py-2 pr-4">Quelle</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE2EA]">
                      {affiliateState.conversions.map((c) => (
                        <tr key={c.id}>
                          <td className="py-2.5 pr-4 font-semibold text-[#202124]">{c.creatorName}</td>
                          <td className="py-2.5 pr-4 font-mono text-[#06458F]">{c.affiliateCode || '-'}</td>
                          <td className="py-2.5 pr-4 text-[#5C6470]">{c.externalOrderRef || '-'}</td>
                          <td className="py-2.5 pr-4 text-[#5C6470]">
                            {(c.orderAmountCents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                          </td>
                          <td className="py-2.5 pr-4 font-bold text-emerald-700">
                            {(c.commissionCents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                          </td>
                          <td className="py-2.5 pr-4 uppercase text-[#5C6470]">{c.source}</td>
                          <td className="py-2.5">
                            <span
                              className={`rounded-full px-2 py-0.5 font-semibold ${
                                c.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : c.status === 'rejected'
                                    ? 'bg-[#F2072A]/10 text-[#D10523]'
                                    : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              {c.status === 'approved' ? 'Ausgezahlt' : c.status === 'rejected' ? 'Abgelehnt' : 'Offen'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Shop-Webhook Integration */}
            <div className="rounded-xl border border-[#DCE2EA] bg-[#F5F7FA] p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#202124]">Shop-Webhook (Shopify, Shopware, WooCommerce, Custom)</h3>
                  <p className="text-xs text-[#5C6470]">
                    Optional für automatische Sale-Übermittlung direkt aus deinem Shop nach Ablauf der Retourenfrist.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-lg border border-[#DCE2EA] bg-white p-3">
                  <span className="block font-semibold text-[#5C6470]">POST Endpoint</span>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <code className="truncate font-mono text-[#06458F]">
                      https://ugc-vz.de/api/webhooks/affiliate/{campaign.publicId}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyText(`https://ugc-vz.de/api/webhooks/affiliate/${campaign.publicId}`, 'Webhook-URL')}
                      className="shrink-0 text-[#06458F] hover:underline"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
                <div className="rounded-lg border border-[#DCE2EA] bg-white p-3">
                  <span className="block font-semibold text-[#5C6470]">Header: X-UGCVZ-Affiliate-Secret</span>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <code className="truncate font-mono text-[#202124]">
                      {affiliateState.webhookSecret || 'Wird beim Laden angezeigt ...'}
                    </code>
                    {affiliateState.webhookSecret && (
                      <button
                        type="button"
                        onClick={() => copyText(affiliateState.webhookSecret, 'Webhook-Secret')}
                        className="shrink-0 text-[#06458F] hover:underline"
                      >
                        <Copy size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-[#202124] p-3 text-[11px] text-white/90">
{`{ "affiliateCode": "MIA-8F2A", "orderRef": "ORD-10482", "orderAmountEur": 89.90, "autoApprove": true }`}
              </pre>
            </div>
          </section>
        )}

        {/* TAB 4: PERFORMANCE-REPORTING */}
        {tab === 'report' && (
          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-[#06458F] p-5 text-white">
                <p className="text-xs uppercase tracking-wider text-white/75">Gesamtreichweite</p>
                <p className="mt-2 text-3xl font-extrabold">{report.totalViews.toLocaleString('de-DE')}</p>
                <p className="mt-1 text-xs text-white/80">{report.approvedSubmissions} von {report.totalSubmissions} Clips freigegeben</p>
              </div>
              <div className="rounded-xl border border-[#DCE2EA] bg-white p-5">
                <p className="text-xs uppercase tracking-wider text-[#5C6470]">Engagements gesamt</p>
                <p className="mt-2 text-3xl font-extrabold text-[#202124]">{report.totalEngagements.toLocaleString('de-DE')}</p>
                <p className="mt-1 text-xs text-[#5C6470]">
                  {report.totalLikes.toLocaleString('de-DE')} Likes · {report.totalComments.toLocaleString('de-DE')} Comm. · {report.totalShares.toLocaleString('de-DE')} Shares
                </p>
              </div>
              <div className="rounded-xl border border-[#DCE2EA] bg-white p-5">
                <p className="text-xs uppercase tracking-wider text-[#5C6470]">Ø Engagement-Rate</p>
                <p className="mt-2 text-3xl font-extrabold text-[#06458F]">{report.engagementRatePct.toFixed(2).replace('.', ',')} %</p>
                <p className="mt-1 text-xs text-[#5C6470]">(Likes + Comments + Shares) / Views</p>
              </div>
              <div className="rounded-xl border border-[#DCE2EA] bg-white p-5">
                <p className="text-xs uppercase tracking-wider text-[#5C6470]">Auszahlung &amp; Eff. TKP</p>
                <p className="mt-2 text-3xl font-extrabold text-[#202124]">
                  {report.cappedPayoutEur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </p>
                <p className="mt-1 text-xs text-[#5C6470]">
                  Eff. TKP: {report.effectiveCpmEur !== null ? `${report.effectiveCpmEur.toFixed(2).replace('.', ',')} €` : 'noch offen'}
                  {report.remainingBudgetEur !== null ? ` · Rest ${report.remainingBudgetEur.toLocaleString('de-DE')} €` : ''}
                </p>
              </div>
            </div>

            {report.byPlatform.length > 0 && (
              <div className="rounded-xl border border-[#DCE2EA] bg-white p-6">
                <h2 className="text-lg font-bold text-[#202124]">Aufschlüsselung nach Plattform</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {report.byPlatform.map((p) => (
                    <div key={p.platform} className="rounded-lg bg-[#F5F7FA] p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#06458F]">{p.platform}</p>
                      <p className="mt-1 text-xl font-extrabold text-[#202124]">{p.views.toLocaleString('de-DE')} Views</p>
                      <p className="mt-0.5 text-xs text-[#5C6470]">
                        {p.submissions} Clip(s) · {p.engagements.toLocaleString('de-DE')} Engagements ({p.engagementRatePct.toFixed(2).replace('.', ',')} %)
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-[#DCE2EA] bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-[#202124]">Performance pro Creator</h2>
                <a
                  href={`/api/brand/campaigns/${encodeURIComponent(campaign.publicId)}/report.csv`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#06458F] underline"
                >
                  <Download size={13} /> Vollständigen CSV-Report herunterladen
                </a>
              </div>
              {report.byCreator.length === 0 ? (
                <p className="mt-4 text-sm text-[#5C6470]">Noch keine Leistungsdaten erfasst. Pflege Views &amp; Engagements im Tab „Content &amp; Freigabe“.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#DCE2EA] text-xs uppercase text-[#5C6470]">
                        <th className="py-2.5 pr-4">Creator</th>
                        <th className="py-2.5 pr-4">Clips</th>
                        <th className="py-2.5 pr-4">Views</th>
                        <th className="py-2.5 pr-4">Engagements</th>
                        <th className="py-2.5 pr-4">ER %</th>
                        {campaign.tkpEurCents ? <th className="py-2.5 pr-4">TKP-Verdienst</th> : null}
                        <th className="py-2.5 pr-4">Honorar / Spend</th>
                        <th className="py-2.5">Eff. TKP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE2EA]">
                      {report.byCreator.map((row) => (
                        <tr key={row.creatorPublicId}>
                          <td className="py-3 pr-4 font-semibold text-[#202124]">{row.creatorName}</td>
                          <td className="py-3 pr-4 text-[#5C6470]">{row.submissions}</td>
                          <td className="py-3 pr-4 font-bold text-[#202124]">{row.views.toLocaleString('de-DE')}</td>
                          <td className="py-3 pr-4 text-[#5C6470]">{row.engagements.toLocaleString('de-DE')}</td>
                          <td className="py-3 pr-4 text-[#5C6470]">{row.engagementRatePct.toFixed(2).replace('.', ',')} %</td>
                          {campaign.tkpEurCents ? (
                            <td className="py-3 pr-4 font-bold text-emerald-700">
                              {row.tkpEarnedEur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                            </td>
                          ) : null}
                          <td className="py-3 pr-4 text-[#5C6470]">{row.spendEur.toLocaleString('de-DE')} €</td>
                          <td className="py-3 font-semibold text-[#06458F]">
                            {row.effectiveCpmEur !== null ? `${row.effectiveCpmEur.toFixed(2).replace('.', ',')} €` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function SubmissionTrackerRow({
  campaignPublicId,
  tkpEurCents,
  budgetPerVideoEur,
  compensationModel,
  sub,
  onUpdated,
}: {
  campaignPublicId: string;
  tkpEurCents: number | null;
  budgetPerVideoEur: number | null;
  compensationModel: string;
  sub: CampaignSubmissionView;
  onUpdated: () => Promise<void>;
}) {
  const isFixedModel = compensationModel === 'fixed' || compensationModel === 'hybrid' || compensationModel === 'retainer';
  const initialSpendEur =
    sub.spendEurCents > 0
      ? String(sub.spendEurCents / 100)
      : isFixedModel && budgetPerVideoEur
        ? String(budgetPerVideoEur)
        : '0';

  const [views, setViews] = useState(String(sub.views));
  const [likes, setLikes] = useState(String(sub.likes));
  const [comments, setComments] = useState(String(sub.comments));
  const [shares, setShares] = useState(String(sub.shares));
  const [spendEur, setSpendEur] = useState(initialSpendEur);
  const [autoTkp, setAutoTkp] = useState(compensationModel === 'tkp' && Boolean(tkpEurCents));
  const [checklistPassed, setChecklistPassed] = useState(Boolean(sub.checklistPassed));
  const [reviewNote, setReviewNote] = useState(sub.reviewNote || '');
  const [saving, setSaving] = useState(false);

  const liveViews = Number(views) || 0;
  const liveBlocks = Math.floor(liveViews / 1000);
  const liveTkpPreview =
    tkpEurCents && tkpEurCents > 0
      ? Math.round(((liveViews / 1000) * (tkpEurCents / 100)) * 100) / 100
      : null;

  const badge = SUB_STATUS_LABEL[sub.status];

  const save = async (nextStatus?: SubmissionStatus) => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/brand/campaigns/${encodeURIComponent(campaignPublicId)}/submissions/${encodeURIComponent(sub.id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(nextStatus ? { status: nextStatus } : {}),
            views: liveViews,
            likes: Number(likes) || 0,
            comments: Number(comments) || 0,
            shares: Number(shares) || 0,
            checklistPassed: nextStatus === 'approved' ? true : checklistPassed,
            reviewNote: reviewNote.trim(),
            ...(autoTkp && tkpEurCents ? { autoCalculateTkp: true } : { spendEur: Number(spendEur) || 0 }),
          }),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Speichern fehlgeschlagen');
      if (autoTkp && data.submission?.spendEurCents !== undefined) {
        setSpendEur(String(data.submission.spendEurCents / 100));
      }
      await onUpdated();
      if (data.settlement?.settledNow && data.settlement.grantedCreatorCents > 0) {
        const creditedEur = (data.settlement.grantedCreatorCents / 100).toLocaleString('de-DE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        toast.success(`Video freigegeben · ${creditedEur} € direkt im Creator-Guthaben gutgeschrieben!`);
      } else if (data.settlementWarning) {
        toast.warning(`Video freigegeben, Auszahlung offen: ${data.settlementWarning}`);
      } else {
        toast.success('Beitragsprüfung & Metriken gespeichert (Snapshot erfasst).');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="space-y-4 rounded-xl border border-[#DCE2EA] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#F5F7FA] px-2.5 py-0.5 text-xs font-bold uppercase text-[#202124]">{sub.platform}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.tone}`}>{badge.text}</span>
            <span className="text-xs text-[#5C6470]">von <strong className="text-[#202124]">{sub.creatorName}</strong></span>
          </div>
          <h3 className="mt-1.5 text-base font-bold text-[#202124]">{sub.title}</h3>
          <a
            href={sub.contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 break-all text-xs font-semibold text-[#06458F] underline"
          >
            {sub.contentUrl} <ExternalLink size={12} />
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => save('approved')}
            className="inline-flex items-center gap-1 rounded-lg bg-[#06458F] px-3 py-2 text-xs font-semibold text-white hover:bg-[#053673] disabled:opacity-50"
          >
            <CheckCircle2 size={13} />
            {isFixedModel ? 'Freigeben & Honorar auszahlen' : 'Freigeben (Zählt)'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save('revision_requested')}
            className="rounded-lg border border-[#DCE2EA] px-3 py-2 text-xs font-semibold text-[#202124] hover:border-amber-400 disabled:opacity-50"
          >
            Korrektur anfragen
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save('rejected')}
            className="rounded-lg border border-[#DCE2EA] px-3 py-2 text-xs font-semibold text-[#D10523] hover:border-[#F2072A] disabled:opacity-50"
          >
            Ablehnen (Zählt nicht)
          </button>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-[#DCE2EA] bg-white p-3 sm:grid-cols-[auto_1fr] sm:items-center">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#202124]">
          <input
            type="checkbox"
            checked={checklistPassed}
            onChange={(e) => setChecklistPassed(e.target.checked)}
            className="h-4 w-4 accent-[#06458F]"
          />
          <span>Briefing-Checkliste erfüllt (Link aktiv, Thema &amp; CTA drin)</span>
        </label>
        <input
          type="text"
          maxLength={400}
          value={reviewNote}
          onChange={(e) => setReviewNote(e.target.value)}
          placeholder="Prüfnotiz / Korrekturhinweis für den Creator (optional)"
          className="w-full rounded-lg border border-[#DCE2EA] bg-[#F5F7FA] px-3 py-1.5 text-xs text-[#202124]"
        />
      </div>

      <div className="space-y-2.5 rounded-lg bg-[#F5F7FA] p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {liveTkpPreview !== null ? (
            <label className="inline-flex cursor-pointer items-center gap-2 font-semibold text-[#202124]">
              <input
                type="checkbox"
                checked={autoTkp}
                onChange={(e) => setAutoTkp(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#06458F]"
              />
              <span>Auto-TKP ({((tkpEurCents || 0) / 100).toFixed(2).replace('.', ',')} € / 1.000 Views)</span>
            </label>
          ) : (
            <span className="font-semibold text-[#5C6470]">
              {isFixedModel ? 'Fixpreis-Freigabe & Performance-Metriken' : 'Metriken & Abrechnung'}
            </span>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[#5C6470]">
              Volle 1.000er-Blöcke: <strong className="text-[#202124]">{liveBlocks.toLocaleString('de-DE')}</strong>
            </span>
            {liveTkpPreview !== null && (
              <span className="font-bold text-emerald-700">
                TKP-Verdienst: {liveTkpPreview.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </span>
            )}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-6 sm:items-end">
          {[
            ['Views', views, setViews, false],
            ['Likes', likes, setLikes, false],
            ['Comments', comments, setComments, false],
            ['Shares', shares, setShares, false],
            [
              isFixedModel ? 'Fixpreis-Honorar (€)' : 'Spend (€)',
              autoTkp && liveTkpPreview !== null ? liveTkpPreview.toFixed(2) : spendEur,
              setSpendEur,
              autoTkp && liveTkpPreview !== null,
            ],
          ].map(([lbl, val, setter, disabled]) => (
            <label key={lbl as string} className="block">
              <span className="block text-[11px] font-semibold text-[#5C6470]">{lbl as string}</span>
              <input
                type="number"
                min={0}
                step={String(lbl).includes('(€)') ? '0.01' : '1'}
                disabled={Boolean(disabled)}
                value={val as string}
                onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#DCE2EA] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#202124] disabled:bg-[#F5F7FA] disabled:text-[#5C6470]"
              />
            </label>
          ))}
          <button
            type="button"
            disabled={saving}
            onClick={() => save()}
            className="min-h-[34px] rounded-lg bg-[#202124] px-3 text-xs font-bold text-white hover:bg-[#06458F] disabled:opacity-50"
          >
            {saving ? '...' : 'Werte speichern'}
          </button>
        </div>
      </div>
    </article>
  );
}

interface PortalMessageItem {
  id: string;
  senderRole: 'brand' | 'creator';
  senderName: string;
  body: string;
  createdAt: string;
}

function BrandPortalMessageDrawer({
  campaignPublicId,
  applicationId,
  creatorName,
}: {
  campaignPublicId: string;
  applicationId: string;
  creatorName: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<PortalMessageItem[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/brand/campaigns/${encodeURIComponent(campaignPublicId)}/messages?applicationId=${encodeURIComponent(applicationId)}`,
        { cache: 'no-store' },
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      }
    } finally {
      setLoading(false);
    }
  }, [campaignPublicId, applicationId]);

  useEffect(() => {
    if (open) void loadMessages();
  }, [open, loadMessages]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/brand/campaigns/${encodeURIComponent(campaignPublicId)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, body: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Senden fehlgeschlagen.');
      setMessages((prev) => [...prev, data.message]);
      setDraft('');
      toast.success(`Nachricht an ${creatorName} gesendet (E-Mail-Benachrichtigung raus).`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Nachricht konnte nicht gesendet werden.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-4 border-t border-[#DCE2EA] pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#06458F] hover:underline"
      >
        <MessageSquare size={13} aria-hidden="true" />
        {open ? 'Portal-Nachrichten schließen' : `Direkt im Portal mit ${creatorName} schreiben`}
        {messages.length > 0 ? ` (${messages.length})` : ''}
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-xl border border-[#DCE2EA] bg-[#F5F7FA] p-4">
          <p className="text-[11px] text-[#5C6470]">
            Klärt Briefing, Retainer-Konditionen, Produktversand und Hooks direkt hier. {creatorName} wird automatisch per E-Mail benachrichtigt.
          </p>
          {loading ? (
            <p className="text-xs text-[#5C6470]">Lade Nachrichten ...</p>
          ) : messages.length === 0 ? (
            <p className="text-xs text-[#5C6470]">Noch keine Nachrichten in diesem Thread.</p>
          ) : (
            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg px-3 py-2 text-xs leading-5 ${
                    m.senderRole === 'brand'
                      ? 'ml-6 bg-[#06458F] text-white'
                      : 'mr-6 border border-[#DCE2EA] bg-white text-[#202124]'
                  }`}
                >
                  <div className={`flex items-center justify-between gap-2 text-[10px] ${m.senderRole === 'brand' ? 'text-white/75' : 'text-[#5C6470]'}`}>
                    <span className="font-bold">{m.senderName}</span>
                    <span>{new Date(m.createdAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-line">{m.body}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={sendMessage} className="flex flex-wrap gap-2">
            <input
              type="text"
              maxLength={2000}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Nachricht an ${creatorName} (z. B. Retainer-Paket, Produktwunsch, Hook-Idee) ...`}
              className="min-w-[200px] flex-1 rounded-lg border border-[#DCE2EA] bg-white px-3 py-2 text-xs text-[#202124]"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#06458F] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#053673] disabled:opacity-50"
            >
              <Send size={12} /> {sending ? '...' : 'Senden'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BarChart3, CheckCircle2, Copy, Download, ExternalLink, Film, ShieldCheck, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import type {
  ApplicationStatus,
  BrandCampaignDetail,
  CampaignSubmissionView,
  SubmissionStatus,
} from '@/app/lib/brand-workspace';

const APP_STATUS_LABEL: Record<ApplicationStatus, { text: string; tone: string }> = {
  invited: { text: 'Eingeladen', tone: 'bg-surface text-ink-soft' },
  applied: { text: 'Bewerbung / Antwort', tone: 'bg-geo-violet/10 text-geo-violet' },
  shortlisted: { text: 'Shortlist', tone: 'bg-blue-50 text-blue-700' },
  selected: { text: 'Ausgewählt', tone: 'bg-[#edf5e5] text-[#385523]' },
  delivered: { text: 'Clip eingereicht', tone: 'bg-indigo-50 text-indigo-700' },
  approved: { text: 'Freigegeben', tone: 'bg-[#edf5e5] text-[#2b421a]' },
  declined: { text: 'Abgelehnt', tone: 'bg-red-50 text-red-700' },
};

const SUB_STATUS_LABEL: Record<SubmissionStatus, { text: string; tone: string }> = {
  submitted: { text: 'Zur Prüfung', tone: 'bg-geo-violet/10 text-geo-violet' },
  revision_requested: { text: 'Korrektur angefragt', tone: 'bg-amber-50 text-amber-800' },
  approved: { text: 'Freigegeben', tone: 'bg-[#edf5e5] text-[#385523]' },
  rejected: { text: 'Abgelehnt', tone: 'bg-red-50 text-red-700' },
};

const TARGET_PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram Reels',
  youtube: 'YouTube Shorts',
  tiktok_shop: 'TikTok Shop',
  files_only: 'Nur Videodateien',
  meta_ads: 'Meta Ads',
};

export default function CampaignDetailClient({ initialDetail }: { initialDetail: BrandCampaignDetail }) {
  const [detail, setDetail] = useState<BrandCampaignDetail>(initialDetail);
  const [tab, setTab] = useState<'creators' | 'submissions' | 'report'>('creators');
  const [busyId, setBusyId] = useState('');

  const { campaign, applications, submissions, report } = detail;

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
      const res = await fetch(`/api/brand/campaigns/${encodeURIComponent(campaign.publicId)}/applications/${encodeURIComponent(appId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Update fehlgeschlagen');
      await reload();
      toast.success('Creator-Status aktualisiert.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Aktualisieren.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 pb-24 pt-10 text-ink sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <Link href="/brand" className="text-sm text-ink-soft hover:text-ink">
            ← Zurück zum Brand-Workspace
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="font-mono text-ink-soft">{campaign.publicId}</span>
                <span className="rounded-full bg-[#edf5e5] px-2.5 py-0.5 text-[#385523]">
                  {campaign.status === 'active' ? 'Aktiv' : campaign.status === 'paused' ? 'Pausiert' : 'Abgeschlossen'}
                </span>
                <span className="rounded-full bg-geo-violet/10 px-2.5 py-0.5 text-geo-violet">
                  {campaign.visibility === 'open' ? 'Offen für 750+ Creator ausgeschrieben' : 'Nur Direkteinladung'}
                </span>
              </div>
              <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">{campaign.title}</h1>
              <p className="mt-1 text-sm text-ink-soft">
                {[
                  campaign.deliverables,
                  campaign.tkpEurCents ? `${(campaign.tkpEurCents / 100).toFixed(2).replace('.', ',')} € / 1.000 Views` : '',
                  campaign.totalBudgetEur ? `Budget-Limit ${campaign.totalBudgetEur.toLocaleString('de-DE')} €` : '',
                  campaign.usageRights,
                  campaign.deadline,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {campaign.discountCode && (
                <p className="mt-2 inline-flex items-center rounded-full border border-geo-violet/25 bg-geo-violet/5 px-3 py-1 text-xs font-semibold text-geo-violet">
                  Aktions-Hinweis: {campaign.discountCode}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyId === 'campaign'}
                onClick={() => patchCampaign({ visibility: campaign.visibility === 'open' ? 'invite_only' : 'open' })}
                className="rounded-xl border border-hairline px-3.5 py-2 text-xs font-semibold text-ink hover:border-geo-violet"
              >
                {campaign.visibility === 'open' ? 'Auf „Nur Einladung“ umstellen' : 'Offen für 750+ Creator ausschreiben'}
              </button>
              <button
                type="button"
                disabled={busyId === 'campaign'}
                onClick={() => patchCampaign({ status: campaign.status === 'active' ? 'paused' : 'active' })}
                className="rounded-xl border border-hairline px-3.5 py-2 text-xs font-semibold text-ink hover:border-geo-violet"
              >
                {campaign.status === 'active' ? 'Pausieren' : 'Wieder aktivieren'}
              </button>
              {campaign.reportShareToken && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const shareUrl = `${window.location.origin}/report/${campaign.reportShareToken}`;
                      await navigator.clipboard.writeText(shareUrl);
                      toast.success('Teilbarer Live-Report-Link kopiert!');
                    } catch {
                      toast.error('Link konnte nicht kopiert werden.');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-geo-violet/40 bg-geo-violet/5 px-3.5 py-2 text-xs font-bold text-geo-violet hover:bg-geo-violet/10"
                >
                  <Copy size={13} /> Report-Link teilen
                </button>
              )}
              <a
                href={`/api/brand/campaigns/${encodeURIComponent(campaign.publicId)}/report.csv`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-void px-3.5 py-2 text-xs font-bold text-white hover:bg-geo-violet"
              >
                <Download size={14} /> CSV-Report
              </a>
            </div>
          </div>
          {(campaign.description || campaign.briefingChecklist.length > 0 || campaign.requiredMention || campaign.requiredHashtags) && (
            <div className="mt-4 max-w-4xl space-y-3 rounded-2xl border border-hairline bg-surface p-4 text-sm leading-6 text-ink-soft">
              {campaign.description && <p className="whitespace-pre-line">{campaign.description}</p>}
              {(campaign.requiredMention || campaign.requiredHashtags) && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {campaign.requiredMention && (
                    <span className="rounded-full bg-white px-3 py-1 font-semibold text-ink">Pflicht-Tag: {campaign.requiredMention}</span>
                  )}
                  {campaign.requiredHashtags && (
                    <span className="rounded-full bg-white px-3 py-1 font-semibold text-ink">Hashtags: {campaign.requiredHashtags}</span>
                  )}
                </div>
              )}
              {campaign.briefingChecklist.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink">Briefing-Checkliste für die Beitragsprüfung</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-ink">
                    {campaign.briefingChecklist.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Optionales Budget-Limit & TKP Fortschritt */}
        {campaign.totalBudgetEur && campaign.totalBudgetEur > 0 && (
          <div
            className={`rounded-2xl border p-5 ${
              report.capReached
                ? 'border-red-300 bg-red-50/70'
                : (report.budgetUtilizationPct ?? 0) >= 80
                  ? 'border-amber-300 bg-amber-50/80'
                  : 'border-geo-violet/25 bg-[#FBF8FE]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-geo-violet">
                  {campaign.tkpEurCents
                    ? `Performance-Budget · ${(campaign.tkpEurCents / 100).toFixed(2).replace('.', ',')} € / 1.000 Views`
                    : 'Kampagnen-Budget-Limit'}
                </p>
                <p className="mt-1 text-lg font-extrabold text-ink">
                  {report.cappedPayoutEur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €{' '}
                  <span className="text-sm font-medium text-ink-soft">
                    von {campaign.totalBudgetEur.toLocaleString('de-DE')} € ({Math.min(100, report.budgetUtilizationPct ?? 0).toFixed(1).replace('.', ',')} %)
                  </span>
                </p>
              </div>
              <div className="text-right text-xs">
                {report.capReached ? (
                  <span className="inline-flex rounded-full bg-red-600 px-3 py-1 font-bold text-white">
                    Budget-Limit erreicht – Kampagne pausierbar
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
                    <p className="font-bold text-[#385523]">
                      Restbudget: {(report.remainingBudgetEur ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </p>
                    {report.viewsUntilCap !== null && (
                      <p className="text-ink-soft">
                        Noch ca. {report.viewsUntilCap.toLocaleString('de-DE')} Views im Budget (max. {(report.maxCapViews ?? 0).toLocaleString('de-DE')})
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/90">
              <div
                className={`h-full rounded-full transition-all ${
                  report.capReached ? 'bg-red-500' : (report.budgetUtilizationPct ?? 0) >= 80 ? 'bg-amber-500' : 'bg-geo-violet'
                }`}
                style={{ width: `${Math.min(100, report.budgetUtilizationPct ?? 0)}%` }}
              />
            </div>
          </div>
        )}

        {/* 5 KPI-Karten */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-hairline bg-surface p-4">
            <p className="text-xs font-semibold text-ink-soft">Budget-Status</p>
            <p className="mt-1 text-xl font-extrabold text-ink">
              {report.cappedPayoutEur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </p>
            <p className="mt-0.5 text-[11px] text-ink-soft">
              {campaign.totalBudgetEur ? `von ${campaign.totalBudgetEur.toLocaleString('de-DE')} € Limit` : 'Offenes Budget'}
            </p>
          </div>
          <div className="rounded-2xl border border-hairline bg-surface p-4">
            <p className="text-xs font-semibold text-ink-soft">Geprüfte Views</p>
            <p className="mt-1 text-xl font-extrabold text-geo-violet">{report.approvedViews.toLocaleString('de-DE')}</p>
            <p className="mt-0.5 text-[11px] text-ink-soft">Gesamt: {report.totalViews.toLocaleString('de-DE')}</p>
          </div>
          <div className="rounded-2xl border border-hairline bg-surface p-4">
            <p className="text-xs font-semibold text-ink-soft">Beiträge</p>
            <p className="mt-1 text-xl font-extrabold text-ink">{report.totalSubmissions}</p>
            <p className="mt-0.5 text-[11px] text-ink-soft">
              {report.approvedSubmissions} frei · {submissions.filter((s) => s.status === 'submitted').length} in Prüfung
            </p>
          </div>
          <div className="rounded-2xl border border-hairline bg-surface p-4">
            <p className="text-xs font-semibold text-ink-soft">Effektiver TKP</p>
            <p className="mt-1 text-xl font-extrabold text-ink">
              {report.effectiveCpmEur !== null ? `${report.effectiveCpmEur.toFixed(2).replace('.', ',')} €` : '—'}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-soft">Ø ER: {report.engagementRatePct.toFixed(2).replace('.', ',')} %</p>
          </div>
          <div className="rounded-2xl border border-hairline bg-surface p-4">
            <p className="text-xs font-semibold text-ink-soft">Aktive Creator</p>
            <p className="mt-1 text-xl font-extrabold text-[#385523]">{campaign.counts.selected}</p>
            <p className="mt-0.5 text-[11px] text-ink-soft">{applications.length} im Funnel</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-hairline pb-3" role="tablist">
          {[
            { id: 'creators', label: `Creator & Bewerbungen (${applications.length})`, Icon: Users },
            { id: 'submissions', label: `Content & Tracking (${submissions.length})`, Icon: Film },
            { id: 'report', label: 'Performance-Reporting', Icon: BarChart3 },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id as typeof tab)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === id ? 'bg-geo-violet text-white' : 'bg-surface text-ink-soft hover:text-ink'
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
              <p className="text-sm text-ink-soft">
                Eingeladene Creator &amp; Bewerbungen aus dem 750+-Pool. Sobald du einen Creator auswählst, kann er Clips im Konto einreichen.
              </p>
              <Link href="/brands" className="text-sm font-semibold text-geo-violet underline">
                Weitere Creator in der Suche finden →
              </Link>
            </div>
            {applications.length === 0 ? (
              <div className="rounded-2xl border border-hairline bg-surface p-8 text-center text-sm text-ink-soft">
                Noch keine Creator in dieser Kampagne.
                {campaign.visibility === 'open'
                  ? ' Deine Ausschreibung ist live im Creator-Konto sichtbar – Bewerbungen erscheinen automatisch hier.'
                  : ' Stelle die Kampagne auf „Offen ausschreiben“ oder lade Creator über die Suche ein.'}
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => {
                  const badge = APP_STATUS_LABEL[app.status];
                  return (
                    <article key={app.id} className="rounded-2xl border border-hairline bg-white p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-ink">{app.creatorName}</h3>
                            {app.creatorCity && <span className="text-xs text-ink-soft">· {app.creatorCity}</span>}
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.tone}`}>{badge.text}</span>
                            <span className="rounded-full border border-hairline px-2 py-0.5 text-[11px] text-ink-soft">
                              {app.source === 'applied' ? 'Eigenbewerbung' : 'Eingeladen'}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-ink-soft">
                            Profil-Preis: <strong className="text-ink">{app.creatorPrice}</strong>
                            {app.proposedFeeEur !== null && (
                              <> · Angebot für diese Kampagne: <strong className="text-geo-violet">{app.proposedFeeEur.toLocaleString('de-DE')} €</strong></>
                            )}
                            {app.availabilityNote && <> · Verfügbarkeit: <strong className="text-ink">{app.availabilityNote}</strong></>}
                          </p>
                          {app.creatorPitch && (
                            <p className="mt-3 rounded-xl bg-surface p-3 text-sm leading-6 text-ink">{app.creatorPitch}</p>
                          )}

                          {(app.targetPlatforms.length > 0 || app.productChoice) && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                              {app.targetPlatforms.length > 0 && (
                                <span className="font-semibold text-ink-soft">Postet auf:</span>
                              )}
                              {app.targetPlatforms.map((plat) => (
                                <span
                                  key={plat}
                                  className="rounded-full bg-geo-violet/10 px-2.5 py-0.5 font-semibold text-geo-violet"
                                >
                                  {TARGET_PLATFORM_LABELS[plat] || plat}
                                </span>
                              ))}
                              {app.productChoice && (
                                <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-amber-950">
                                  Produkt-Wunsch: <strong>{app.productChoice}</strong>
                                </span>
                              )}
                            </div>
                          )}

                          {/* Verifizierte Social-Accounts & Portfolio */}
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                            {app.verifiedSocials.map((s, idx) => (
                              <a
                                key={`${s.url}-${idx}`}
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium ${
                                  s.verifiedAt ? 'border-[#dce9d1] bg-[#edf5e5] text-[#385523]' : 'border-hairline bg-white text-ink-soft'
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
                                className="inline-flex items-center gap-1 rounded-full border border-hairline px-2.5 py-1 font-semibold text-geo-violet hover:border-geo-violet"
                              >
                                Arbeitsprobe {idx + 1} <ExternalLink size={11} />
                              </a>
                            ))}
                            {app.contactEmail && (
                              <a href={`mailto:${app.contactEmail}`} className="font-semibold text-geo-violet underline">
                                ✉ {app.contactEmail}
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busyId === app.id}
                            onClick={() => updateApplication(app.id, 'shortlisted')}
                            className="rounded-xl border border-hairline px-3 py-2 text-xs font-semibold text-ink hover:border-geo-violet disabled:opacity-50"
                          >
                            Shortlist
                          </button>
                          <button
                            type="button"
                            disabled={busyId === app.id}
                            onClick={() => updateApplication(app.id, 'selected')}
                            className="rounded-xl bg-geo-violet px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#053673] disabled:opacity-50"
                          >
                            Auswählen
                          </button>
                          <button
                            type="button"
                            disabled={busyId === app.id}
                            onClick={() => updateApplication(app.id, 'declined')}
                            className="rounded-xl border border-hairline px-3 py-2 text-xs font-semibold text-ink-soft hover:border-red-300 hover:text-red-700 disabled:opacity-50"
                          >
                            Ablehnen
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: CONTENT & TRACKING */}
        {tab === 'submissions' && (
          <section className="space-y-4">
            <p className="text-sm text-ink-soft">
              Eingereichte TikTok-, Instagram-Reels- oder YouTube-Links deiner ausgewählten Creator. Prüfe Clips, gib sie frei und pflege aktuelle Performance-Metriken für dein Reporting.
            </p>
            {submissions.length === 0 ? (
              <div className="rounded-2xl border border-hairline bg-surface p-8 text-center text-sm text-ink-soft">
                Noch keine Clips eingereicht. Sobald du Creator ausgewählt hast, können diese ihre Video-URLs direkt über ihr UGC-VZ-Konto einreichen.
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => (
                  <SubmissionTrackerRow
                    key={sub.id}
                    campaignPublicId={campaign.publicId}
                    tkpEurCents={campaign.tkpEurCents}
                    compensationModel={campaign.compensationModel}
                    sub={sub}
                    onUpdated={reload}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: PERFORMANCE-REPORTING */}
        {tab === 'report' && (
          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-void p-5 text-white">
                <p className="text-xs uppercase tracking-wider text-white/60">Gesamtreichweite</p>
                <p className="mt-2 text-3xl font-extrabold text-geo-green">{report.totalViews.toLocaleString('de-DE')}</p>
                <p className="mt-1 text-xs text-white/70">{report.approvedSubmissions} von {report.totalSubmissions} Clips freigegeben</p>
              </div>
              <div className="rounded-2xl border border-hairline bg-white p-5">
                <p className="text-xs uppercase tracking-wider text-ink-soft">Engagements gesamt</p>
                <p className="mt-2 text-3xl font-extrabold text-ink">{report.totalEngagements.toLocaleString('de-DE')}</p>
                <p className="mt-1 text-xs text-ink-soft">
                  {report.totalLikes.toLocaleString('de-DE')} Likes · {report.totalComments.toLocaleString('de-DE')} Comm. · {report.totalShares.toLocaleString('de-DE')} Shares
                </p>
              </div>
              <div className="rounded-2xl border border-hairline bg-white p-5">
                <p className="text-xs uppercase tracking-wider text-ink-soft">Ø Engagement-Rate</p>
                <p className="mt-2 text-3xl font-extrabold text-geo-violet">{report.engagementRatePct.toFixed(2).replace('.', ',')} %</p>
                <p className="mt-1 text-xs text-ink-soft">(Likes + Comments + Shares) / Views</p>
              </div>
              <div className="rounded-2xl border border-hairline bg-white p-5">
                <p className="text-xs uppercase tracking-wider text-ink-soft">Auszahlung &amp; Eff. TKP</p>
                <p className="mt-2 text-3xl font-extrabold text-ink">
                  {report.cappedPayoutEur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  Eff. TKP: {report.effectiveCpmEur !== null ? `${report.effectiveCpmEur.toFixed(2).replace('.', ',')} €` : 'noch offen'}
                  {report.remainingBudgetEur !== null ? ` · Rest ${report.remainingBudgetEur.toLocaleString('de-DE')} €` : ''}
                </p>
              </div>
            </div>

            {report.byPlatform.length > 0 && (
              <div className="rounded-2xl border border-hairline bg-white p-6">
                <h2 className="text-lg font-bold text-ink">Aufschlüsselung nach Plattform</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {report.byPlatform.map((p) => (
                    <div key={p.platform} className="rounded-xl bg-surface p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-geo-violet">{p.platform}</p>
                      <p className="mt-1 text-xl font-extrabold text-ink">{p.views.toLocaleString('de-DE')} Views</p>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {p.submissions} Clip(s) · {p.engagements.toLocaleString('de-DE')} Engagements ({p.engagementRatePct.toFixed(2).replace('.', ',')} %)
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-hairline bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-ink">Performance pro Creator</h2>
                <a
                  href={`/api/brand/campaigns/${encodeURIComponent(campaign.publicId)}/report.csv`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-geo-violet underline"
                >
                  <Download size={13} /> Vollständigen CSV-Report herunterladen
                </a>
              </div>
              {report.byCreator.length === 0 ? (
                <p className="mt-4 text-sm text-ink-soft">Noch keine Leistungsdaten erfasst. Pflege Views &amp; Engagements im Tab „Content &amp; Tracking“.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-hairline text-xs uppercase text-ink-soft">
                        <th className="py-2.5 pr-4">Creator</th>
                        <th className="py-2.5 pr-4">Clips</th>
                        <th className="py-2.5 pr-4">Views</th>
                        <th className="py-2.5 pr-4">Engagements</th>
                        <th className="py-2.5 pr-4">ER %</th>
                        {campaign.tkpEurCents ? <th className="py-2.5 pr-4">TKP-Verdienst</th> : null}
                        <th className="py-2.5 pr-4">Spend</th>
                        <th className="py-2.5">Eff. TKP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {report.byCreator.map((row) => (
                        <tr key={row.creatorPublicId}>
                          <td className="py-3 pr-4 font-semibold text-ink">{row.creatorName}</td>
                          <td className="py-3 pr-4 text-ink-soft">{row.submissions}</td>
                          <td className="py-3 pr-4 font-bold text-ink">{row.views.toLocaleString('de-DE')}</td>
                          <td className="py-3 pr-4 text-ink-soft">{row.engagements.toLocaleString('de-DE')}</td>
                          <td className="py-3 pr-4 text-ink-soft">{row.engagementRatePct.toFixed(2).replace('.', ',')} %</td>
                          {campaign.tkpEurCents ? (
                            <td className="py-3 pr-4 font-bold text-[#385523]">
                              {row.tkpEarnedEur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                            </td>
                          ) : null}
                          <td className="py-3 pr-4 text-ink-soft">{row.spendEur.toLocaleString('de-DE')} €</td>
                          <td className="py-3 font-semibold text-geo-violet">
                            {row.effectiveCpmEur !== null ? `${row.effectiveCpmEur.toFixed(2).replace('.', ',')} €` : '—'}
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
  compensationModel,
  sub,
  onUpdated,
}: {
  campaignPublicId: string;
  tkpEurCents: number | null;
  compensationModel: string;
  sub: CampaignSubmissionView;
  onUpdated: () => Promise<void>;
}) {
  const [views, setViews] = useState(String(sub.views));
  const [likes, setLikes] = useState(String(sub.likes));
  const [comments, setComments] = useState(String(sub.comments));
  const [shares, setShares] = useState(String(sub.shares));
  const [spendEur, setSpendEur] = useState(String(sub.spendEurCents / 100));
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
      toast.success('Beitragsprüfung & Metriken gespeichert (Snapshot erfasst).');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="rounded-2xl border border-hairline bg-white p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-bold uppercase text-ink">{sub.platform}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.tone}`}>{badge.text}</span>
            <span className="text-xs text-ink-soft">von <strong className="text-ink">{sub.creatorName}</strong></span>
          </div>
          <h3 className="mt-1.5 text-base font-bold text-ink">{sub.title}</h3>
          <a
            href={sub.contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 break-all text-xs font-semibold text-geo-violet underline"
          >
            {sub.contentUrl} <ExternalLink size={12} />
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => save('approved')}
            className="inline-flex items-center gap-1 rounded-xl bg-[#385523] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            <CheckCircle2 size={13} /> Freigeben (Zählt)
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save('revision_requested')}
            className="rounded-xl border border-hairline px-3 py-2 text-xs font-semibold text-ink hover:border-amber-400 disabled:opacity-50"
          >
            Korrektur anfragen
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save('rejected')}
            className="rounded-xl border border-hairline px-3 py-2 text-xs font-semibold text-red-700 hover:border-red-300 disabled:opacity-50"
          >
            Ablehnen (Zählt nicht)
          </button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-hairline bg-white p-3 sm:grid-cols-[auto_1fr] sm:items-center">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink">
          <input
            type="checkbox"
            checked={checklistPassed}
            onChange={(e) => setChecklistPassed(e.target.checked)}
            className="h-4 w-4 accent-[#385523]"
          />
          <span>Briefing-Checkliste erfüllt (Link aktiv, Thema &amp; CTA drin)</span>
        </label>
        <input
          type="text"
          maxLength={400}
          value={reviewNote}
          onChange={(e) => setReviewNote(e.target.value)}
          placeholder="Prüfnotiz / Ablehnungsgrund (optional)"
          className="w-full rounded-lg border border-hairline bg-surface/60 px-3 py-1.5 text-xs text-ink"
        />
      </div>

      <div className="space-y-2.5 rounded-xl bg-surface p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {liveTkpPreview !== null ? (
            <label className="inline-flex cursor-pointer items-center gap-2 font-semibold text-ink">
              <input
                type="checkbox"
                checked={autoTkp}
                onChange={(e) => setAutoTkp(e.target.checked)}
                className="h-3.5 w-3.5 accent-geo-violet"
              />
              <span>Auto-TKP ({((tkpEurCents || 0) / 100).toFixed(2).replace('.', ',')} € / 1.000 Views)</span>
            </label>
          ) : (
            <span className="font-semibold text-ink-soft">Metriken &amp; Abrechnung</span>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-ink-soft">
              Volle 1.000er-Blöcke: <strong className="text-ink">{liveBlocks.toLocaleString('de-DE')}</strong>
            </span>
            {liveTkpPreview !== null && (
              <span className="font-bold text-[#385523]">
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
            ['Spend (€)', autoTkp && liveTkpPreview !== null ? liveTkpPreview.toFixed(2) : spendEur, setSpendEur, autoTkp && liveTkpPreview !== null],
          ].map(([lbl, val, setter, disabled]) => (
            <label key={lbl as string} className="block">
              <span className="block text-[11px] font-semibold text-ink-soft">{lbl as string}</span>
              <input
                type="number"
                min={0}
                step={lbl === 'Spend (€)' ? '0.01' : '1'}
                disabled={Boolean(disabled)}
                value={val as string}
                onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                className="mt-1 w-full rounded-lg border border-hairline bg-white px-2.5 py-1.5 text-xs font-semibold text-ink disabled:bg-surface disabled:text-ink-soft"
              />
            </label>
          ))}
          <button
            type="button"
            disabled={saving}
            onClick={() => save()}
            className="min-h-[34px] rounded-lg bg-geo-violet px-3 text-xs font-bold text-white hover:bg-[#053673] disabled:opacity-50"
          >
            {saving ? '…' : 'Werte speichern'}
          </button>
        </div>
      </div>
    </article>
  );
}

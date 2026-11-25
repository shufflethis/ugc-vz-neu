import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { getPublicCampaignReportByShareToken } from '@/app/lib/brand-workspace';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Kampagnen-Report | UGC VZ',
  robots: { index: false, follow: false },
};

const PLATFORM_NAMES: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram Reels',
  youtube: 'YouTube Shorts',
  tiktok_shop: 'TikTok Shop',
  files_only: 'Videodateien',
  other: 'Sonstige',
};

export default async function PublicCampaignReportPage({ params }: { params: { token: string } }) {
  if (!isDatabaseConfigured()) notFound();
  const data = await getPublicCampaignReportByShareToken(getDatabase(), params.token);
  if (!data) notFound();

  const { report } = data;

  return (
    <div className="min-h-screen bg-white px-4 pb-24 pt-10 text-ink sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="border-b border-hairline pb-6">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-geo-violet">
            UGC VZ Live-Kampagnen-Report · {data.publicId}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">{data.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Brand: <strong className="text-ink">{data.brandDisplayName}</strong>
            {data.tkpEurCents ? ` · ${(data.tkpEurCents / 100).toFixed(2).replace('.', ',')} € / 1.000 Views` : ''}
            {data.totalBudgetEur ? ` · Budget-Limit ${data.totalBudgetEur.toLocaleString('de-DE')} €` : ''}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-void p-5 text-white">
            <p className="text-xs uppercase tracking-wider text-white/60">Gesamt-Views</p>
            <p className="mt-2 text-3xl font-extrabold text-geo-green">{report.totalViews.toLocaleString('de-DE')}</p>
            <p className="mt-1 text-xs text-white/70">{report.approvedSubmissions} von {report.totalSubmissions} Beiträgen freigegeben</p>
          </div>
          <div className="rounded-2xl border border-hairline bg-surface p-5">
            <p className="text-xs uppercase tracking-wider text-ink-soft">Engagements</p>
            <p className="mt-2 text-3xl font-extrabold text-ink">{report.totalEngagements.toLocaleString('de-DE')}</p>
            <p className="mt-1 text-xs text-ink-soft">ER: {report.engagementRatePct.toFixed(2).replace('.', ',')} %</p>
          </div>
          <div className="rounded-2xl border border-hairline bg-surface p-5">
            <p className="text-xs uppercase tracking-wider text-ink-soft">Effektiver TKP</p>
            <p className="mt-2 text-3xl font-extrabold text-geo-violet">
              {report.effectiveCpmEur !== null ? `${report.effectiveCpmEur.toFixed(2).replace('.', ',')} €` : '—'}
            </p>
            <p className="mt-1 text-xs text-ink-soft">pro 1.000 Views</p>
          </div>
          <div className="rounded-2xl border border-hairline bg-surface p-5">
            <p className="text-xs uppercase tracking-wider text-ink-soft">Budget-Status</p>
            <p className="mt-2 text-3xl font-extrabold text-ink">
              {report.cappedPayoutEur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              {data.totalBudgetEur ? `von ${data.totalBudgetEur.toLocaleString('de-DE')} € Limit` : 'Offenes Budget'}
            </p>
          </div>
        </div>

        {report.byPlatform.length > 0 && (
          <section className="rounded-2xl border border-hairline bg-white p-6">
            <h2 className="text-lg font-bold text-ink">Ergebnisse nach Plattform</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {report.byPlatform.map((p) => (
                <div key={p.platform} className="rounded-xl bg-surface p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-geo-violet">{PLATFORM_NAMES[p.platform] || p.platform}</p>
                  <p className="mt-1 text-xl font-extrabold text-ink">{p.views.toLocaleString('de-DE')} Views</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {p.submissions} Beitrag/Beiträge · {p.engagements.toLocaleString('de-DE')} Engagements ({p.engagementRatePct.toFixed(2).replace('.', ',')} %)
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-hairline bg-white p-6">
          <h2 className="text-lg font-bold text-ink">Beiträge ({data.submissions.length})</h2>
          {data.submissions.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">Noch keine freigegebenen Beiträge erfasst.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-hairline text-xs uppercase text-ink-soft">
                    <th className="py-2.5 pr-4">Creator</th>
                    <th className="py-2.5 pr-4">Plattform</th>
                    <th className="py-2.5 pr-4">Link</th>
                    <th className="py-2.5 pr-4">Status</th>
                    <th className="py-2.5 pr-4">Views</th>
                    <th className="py-2.5 pr-4">1.000er-Blöcke</th>
                    <th className="py-2.5">ER %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {data.submissions.map((sub) => (
                    <tr key={sub.id}>
                      <td className="py-3 pr-4 font-semibold text-ink">{sub.creatorName}</td>
                      <td className="py-3 pr-4 text-ink-soft">{PLATFORM_NAMES[sub.platform] || sub.platform}</td>
                      <td className="py-3 pr-4">
                        <a
                          href={sub.contentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-geo-violet hover:underline"
                        >
                          {sub.title || 'Clip öffnen'} <ExternalLink size={12} />
                        </a>
                      </td>
                      <td className="py-3 pr-4 text-xs font-semibold">
                        <span className={`rounded-full px-2.5 py-0.5 ${sub.status === 'approved' ? 'bg-[#edf5e5] text-[#385523]' : 'bg-surface text-ink-soft'}`}>
                          {sub.status === 'approved' ? 'Zählt (Freigegeben)' : 'In Prüfung'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-bold text-ink">{sub.views.toLocaleString('de-DE')}</td>
                      <td className="py-3 pr-4 text-ink-soft">{sub.billedBlocks.toLocaleString('de-DE')}</td>
                      <td className="py-3 text-ink-soft">{sub.engagementRatePct.toFixed(2).replace('.', ',')} %</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-center text-xs text-ink-soft">
          Erstellt mit <Link href="/brand" className="font-semibold text-geo-violet underline">UGC VZ Brand-Workspace</Link> · Alle Angaben werden laufend aus den geprüften Beiträgen aktualisiert.
        </p>
      </div>
    </div>
  );
}

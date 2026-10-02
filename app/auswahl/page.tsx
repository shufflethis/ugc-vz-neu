// Teilbare Creator-Auswahl: /auswahl?ids=UGC-…,UGC-… zeigt die oeffentlichen
// Profile (nie Kontaktdaten). Fuer Agenturen/Teams, die eine Auswahl an den
// Kunden weitergeben, und als Profil-Link in der Brand-Mail.
import { Metadata } from 'next';
import { getCreator } from '@/app/lib/agent-gateway';
import { MAX_CREATORS_PER_REQUEST } from '@/app/lib/lead-limits';
import { humanizeCreatorText } from '@/app/lib/creator-public';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Creator-Auswahl – UGC VZ',
  robots: { index: false, follow: false },
};

const ID_RE = /^UGC-[A-F0-9]{10}$/;
const text = (value: unknown, max = 600) => humanizeCreatorText(value == null ? '' : String(value)).slice(0, max);
const link = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

export default async function SelectionPage({ searchParams }: { searchParams?: { ids?: string } }) {
  const ids = [...new Set((searchParams?.ids || '').split(',').map((id) => id.trim().toUpperCase()).filter((id) => ID_RE.test(id)))]
    .slice(0, MAX_CREATORS_PER_REQUEST);
  const creators = (await Promise.all(ids.map((id) => getCreator(id).catch(() => null)))).filter(Boolean) as Awaited<ReturnType<typeof getCreator>>[];

  return (
    <main className="px-4 sm:px-8 md:px-16 lg:px-24 pb-24 bg-white text-ink">
      <div className="max-w-3xl mx-auto py-14">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-geo-violet">Creator-Auswahl</p>
        <h1 className="mt-3 text-4xl font-bold">{creators.length ? `${creators.length} ausgewählte UGC Creator` : 'Keine Creator gefunden'}</h1>
        <p className="mt-4 leading-7 text-ink-soft">
          Öffentliche Profile mit Preisvorstellung, Social-Links und Portfolio. Kontaktdaten gibt es nach einer Anfrage über{' '}
          <a className="font-semibold text-geo-violet underline" href="https://ugc-vz.de/brands">UGC VZ</a> per E-Mail – kostenlos.
        </p>
        <div className="mt-8 space-y-5">
          {creators.map((c) => (
            <article key={c.public_id} className="rounded-3xl border border-hairline bg-white p-6 shadow-[0_24px_80px_rgba(35,22,47,0.06)]">
              <h2 className="text-2xl font-bold">{c.display_name}</h2>
              <p className="text-sm text-ink-soft">{[c.city, c.humanVerification?.level >= 1 ? 'Portfolio vorhanden' : ''].filter(Boolean).join(' · ')}</p>
              {c.topics && <p className="mt-3 text-sm"><strong>Themen:</strong> {text(c.topics, 300)}</p>}
              {c.preferred_content && <p className="mt-1 text-sm"><strong>Formate:</strong> {text(c.preferred_content, 300)}</p>}
              <p className="mt-1 whitespace-pre-line text-sm"><strong>Preisvorstellung:</strong> {text(c.rate_text) || 'Nicht angegeben'}</p>
              {c.reach_text && <p className="mt-1 whitespace-pre-line text-sm"><strong>Reichweite:</strong> {text(c.reach_text, 300)}</p>}
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {[...(c.socials || []).map((s: { platform?: string; url: string }) => [s.platform || 'Social', s.url]), ...(c.portfolio || []).slice(0, 3).map((u: string) => ['Portfolio', u])]
                  .filter(([, url]) => url)
                  .map(([label, url], i) => (
                    <a key={i} className="font-semibold text-geo-violet underline" href={link(String(url))} target="_blank" rel="noopener noreferrer nofollow">{label}</a>
                  ))}
              </p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

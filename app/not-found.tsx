// Globale 404-Seite. Fuer Menschen: Navigation zurueck. Fuer Agenten:
// maschinenlesbare Einstiegspunkte (Sitemap, llms.txt, OpenAPI) direkt im
// Dokument - "agent-friendly 404" statt Sackgasse. Der Statuscode 404 kommt
// von Next selbst; die Markdown-Variante liefert app/md/[[...path]]/route.ts.
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seite nicht gefunden – UGC VZ',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white text-ink px-6 py-24">
      <div className="max-w-2xl mx-auto">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-geo-violet">Fehler 404</p>
        <h1 className="mt-3 text-4xl font-bold">Diese Seite gibt es nicht (mehr)</h1>
        <p className="mt-4 leading-7 text-ink-soft">
          Die angeforderte Adresse existiert nicht. Hier sind die besten Einstiegspunkte, um das
          Gesuchte zu finden:
        </p>
        <ul className="mt-6 space-y-3 leading-7">
          <li><Link className="font-semibold text-geo-violet underline" href="/">Startseite</Link> – UGC-Creator suchen</li>
          <li><Link className="font-semibold text-geo-violet underline" href="/wissen">Wissen</Link> – alle Ratgeber-Artikel</li>
          <li><Link className="font-semibold text-geo-violet underline" href="/vergleich">Plattform-Vergleiche</Link></li>
          <li><Link className="font-semibold text-geo-violet underline" href="/creator">Creator-Anmeldung</Link> · <Link className="font-semibold text-geo-violet underline" href="/konto">Creator-Login</Link></li>
        </ul>
        <div className="mt-10 rounded-2xl border border-hairline bg-surface p-5 text-sm leading-6 text-ink-soft">
          <strong className="text-ink">Für Maschinen und KI-Agenten:</strong>{' '}
          <a className="underline" href="/sitemap.xml">/sitemap.xml</a> ·{' '}
          <a className="underline" href="/llms.txt">/llms.txt</a> ·{' '}
          <a className="underline" href="/openapi.json">/openapi.json</a> ·{' '}
          <a className="underline" href="/developers">/developers</a>
        </div>
      </div>
    </main>
  );
}

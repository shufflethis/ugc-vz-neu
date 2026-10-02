import type { Metadata } from 'next';
import { pageMetadata } from '@/utils/seo-metadata';
import Link from 'next/link';
import SearchBox from '../../components/SearchBox';
import { NICHE_INDEX, nichePath } from '@/app/lib/niche-index';

export const metadata: Metadata = pageMetadata({
  path: '/brands/ugc-creator-finden',
  title: 'UGC Creator finden',
  description: 'UGC Creator finden in Deutschland: Demand eingeben, passende Profile ansehen und Anfrage kostenlos an UGC VZ senden.',
});

export default function UGCCreatorFindenPage() {
  return (
    <main className="min-h-screen bg-white text-ink px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink">UGC VZ</Link>
        <section className="py-14 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-ink">UGC Creator finden</h1>
          <p className="text-xl text-ink-soft max-w-3xl mx-auto mb-10">
            Suche passende UGC Creator fuer Produktvideos, Social Ads, Testimonials und Launches. Beschreibe kurz deinen Demand und waehle relevante Profile aus.
          </p>
          <SearchBox initialQuery="UGC Creator fuer meine Kampagne finden" />
        </section>
        <section className="grid md:grid-cols-3 gap-6">
          {[
            ['Demand statt endloser Recherche', 'Du startest mit Zielgruppe, Plattform, Produkt und Stil.'],
            ['Profile vergleichen', 'Die Suche liefert Creator-Vorschlaege aus der UGC VZ Datenbank.'],
            ['Anfrage an UGC VZ senden', 'Du erhältst die Kontaktdaten per E-Mail, und wir schreiben die erreichbaren Creator in deinem Namen an. Antworten gehen direkt an dich.'],
          ].map(([title, copy]) => (
            <div key={title} className="surface-card rounded-lg p-6">
              <h2 className="font-bold text-geo-violet mb-3">{title}</h2>
              <p className="text-ink-soft">{copy}</p>
            </div>
          ))}
        </section>
        <section className="py-14" aria-labelledby="branchen-heading">
          <h2 id="branchen-heading" className="text-2xl font-bold mb-6">UGC Creator nach Branche</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {NICHE_INDEX.map((niche) => (
              <Link key={niche.slug} href={nichePath(niche)} className="surface-card rounded-lg p-5 hover:border-geo-violet transition-colors">
                <h3 className="font-bold text-geo-violet mb-1">{niche.chip}</h3>
                <p className="text-ink-soft text-sm">Creator, Preise und Kampagnen-Ideen ansehen.</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

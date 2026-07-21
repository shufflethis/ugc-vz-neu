import type { Metadata } from 'next';
import { pageMetadata } from '@/utils/seo-metadata';
import Link from 'next/link';
import SearchBox from '../../components/SearchBox';

export const metadata: Metadata = pageMetadata({
  path: '/brands/ugc-creator-beauty',
  title: 'UGC Creator fuer Beauty Brands',
  description: 'Beauty UGC Creator finden: Produktdemo, Routine, Testimonial oder Social Ad fuer Kosmetik-, Pflege- und Beauty-Marken.',
});

export default function UGCCreatorBeautyPage() {
  return (
    <main className="min-h-screen bg-white text-ink px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto">
        <Link href="/brands" className="text-sm text-ink-soft hover:text-ink">UGC VZ fuer Brands</Link>
        <section className="py-14 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-ink">UGC Creator fuer Beauty Brands finden</h1>
          <p className="text-xl text-ink-soft max-w-3xl mx-auto mb-10">
            Beauty UGC funktioniert besonders gut, wenn Creator Produktanwendung, Hautgefuehl, Routine, Ergebnis und Einwaende glaubwuerdig zeigen.
          </p>
          <SearchBox initialQuery="Beauty UGC Creatorin fuer Hautpflege Reels" />
        </section>
        <section className="grid md:grid-cols-3 gap-6">
          {[
            ['Routine statt Werbespot', 'Beauty UGC lebt von Anwendung, Kontext und ehrlichen Details.'],
            ['Rechte vorher klaeren', 'Wenn Ads geplant sind, sollten Nutzungsrechte und Laufzeit frueh besprochen werden.'],
            ['Mehr Varianten testen', 'Hooks, Vorher/Nachher, Problem-Loesung und Testimonial koennen parallel funktionieren.'],
          ].map(([title, copy]) => (
            <div key={title} className="surface-card rounded-lg p-6">
              <h2 className="font-bold text-geo-violet mb-3">{title}</h2>
              <p className="text-ink-soft">{copy}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

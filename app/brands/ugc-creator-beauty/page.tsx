import type { Metadata } from 'next';
import Link from 'next/link';
import SearchBox from '../../components/SearchBox';

export const metadata: Metadata = {
  title: 'UGC Creator fuer Beauty Brands',
  description: 'Beauty UGC Creator finden: Produktdemo, Routine, Testimonial oder Social Ad fuer Kosmetik-, Pflege- und Beauty-Marken.',
  alternates: { canonical: 'https://ugc-vz.de/brands/ugc-creator-beauty' },
};

export default function UGCCreatorBeautyPage() {
  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto">
        <Link href="/brands" className="text-sm text-gray-400 hover:text-white">UGC VZ fuer Brands</Link>
        <section className="py-14 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">UGC Creator fuer Beauty Brands finden</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
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
            <div key={title} className="bg-gray-900/40 border border-gray-800 rounded-lg p-6">
              <h2 className="font-bold text-emerald-300 mb-3">{title}</h2>
              <p className="text-gray-300">{copy}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

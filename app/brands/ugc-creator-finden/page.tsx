import type { Metadata } from 'next';
import Link from 'next/link';
import SearchBox from '../../components/SearchBox';

export const metadata: Metadata = {
  title: 'UGC Creator finden',
  description: 'UGC Creator finden in Deutschland: Demand eingeben, passende Profile ansehen und Anfrage kostenlos an UGC VZ senden.',
  alternates: { canonical: 'https://ugc-vz.de/brands/ugc-creator-finden' },
};

export default function UGCCreatorFindenPage() {
  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-white">UGC VZ</Link>
        <section className="py-14 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">UGC Creator finden</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
            Suche passende UGC Creator fuer Produktvideos, Social Ads, Testimonials und Launches. Beschreibe kurz deinen Demand und waehle relevante Profile aus.
          </p>
          <SearchBox initialQuery="UGC Creator fuer meine Kampagne finden" />
        </section>
        <section className="grid md:grid-cols-3 gap-6">
          {[
            ['Demand statt endloser Recherche', 'Du startest mit Zielgruppe, Plattform, Produkt und Stil.'],
            ['Profile vergleichen', 'Die Suche liefert Creator-Vorschlaege aus der UGC VZ Datenbank.'],
            ['Anfrage an UGC VZ senden', 'Deine Auswahl wird nicht blind automatisiert, sondern als Anfrage weiterbearbeitet.'],
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

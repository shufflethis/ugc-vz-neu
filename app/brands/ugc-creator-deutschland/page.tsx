import type { Metadata } from 'next';
import Link from 'next/link';
import SearchBox from '../../components/SearchBox';

export const metadata: Metadata = {
  title: 'UGC Creator Deutschland finden',
  description: 'UGC Creator in Deutschland finden: echte Profile, deutsche Sprache, passende Themen und kostenlose Anfrage ueber UGC VZ.',
  alternates: { canonical: 'https://ugc-vz.de/brands/ugc-creator-deutschland' },
};

export default function UGCCreatorDeutschlandPage() {
  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto">
        <Link href="/brands" className="text-sm text-gray-400 hover:text-white">UGC VZ fuer Brands</Link>
        <section className="py-14 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">UGC Creator in Deutschland finden</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
            Wenn deine Kampagne deutsche Sprache, lokale Signale oder Creator aus Deutschland braucht, hilft UGC VZ beim schnellen Einstieg in die Auswahl.
          </p>
          <SearchBox initialQuery="UGC Creator Deutschland fuer E-Commerce Kampagne" />
        </section>
        <section className="bg-gray-900/40 border border-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-emerald-300 mb-4">Wann deutsche UGC Creator besonders sinnvoll sind</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300">
            <p>Bei Produktdemos, Testimonials, Retail-Kampagnen und lokalen Angeboten wirken Sprache, Alltagssituation und kulturelle Codes oft staerker als reine Reichweite.</p>
            <p>Beschreibe in der Suche Branche, Plattform, Alter, Standort oder Stil. Die KI interpretiert die Anfrage, die finale Auswahl triffst du selbst.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

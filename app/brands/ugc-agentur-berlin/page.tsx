import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'UGC Agentur Berlin oder Creator-Plattform?',
  description: 'UGC Agentur Berlin gesucht? UGC VZ hilft beim Einstieg: Creator kostenlos finden, Anfrage senden und optional Kampagnen-Support nutzen.',
  alternates: { canonical: 'https://ugc-vz.de/brands/ugc-agentur-berlin' },
};

export default function UGCAgenturBerlinPage() {
  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-white">UGC VZ</Link>
        <section className="py-14">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">UGC Agentur Berlin oder Creator direkt finden?</h1>
          <p className="text-xl text-gray-300 max-w-3xl leading-relaxed mb-8">
            Wenn du UGC Creator fuer Berlin oder den deutschen Markt suchst, muss der erste Schritt nicht direkt ein Agentur-Retainer sein. UGC VZ hilft dir, passende Profile zu finden und eine konkrete Anfrage zu stellen.
          </p>
          <Link href="/brands" className="inline-flex bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg">
            UGC Creator finden
          </Link>
        </section>
        <section className="bg-gray-900/40 border border-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-emerald-300 mb-4">Wann reicht die Plattform, wann braucht es Agentur-Support?</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h3 className="font-bold text-white mb-2">Plattform reicht oft bei</h3>
              <p>einzelnen Produktvideos, Tests, kleineren Kampagnen, Creator-Recherche und ersten UGC Experimenten.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">Agentur-Support hilft bei</h3>
              <p>Briefing, Rechteklaerung, Paid Social Adaption, Creator-Steuerung, Reporting und groesseren Kampagnen-Setups.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

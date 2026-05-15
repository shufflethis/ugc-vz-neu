import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'UGC Agentur Hamburg oder Creator-Plattform?',
  description: 'UGC Agentur Hamburg gesucht? UGC VZ hilft beim Finden passender Creator und bietet optional Support fuer Kampagnen-Abwicklung.',
  alternates: { canonical: 'https://ugc-vz.de/brands/ugc-agentur-hamburg' },
};

export default function UGCAgenturHamburgPage() {
  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto">
        <Link href="/brands" className="text-sm text-gray-400 hover:text-white">UGC VZ fuer Brands</Link>
        <section className="py-14">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">UGC Agentur Hamburg oder Creator direkt finden?</h1>
          <p className="text-xl text-gray-300 max-w-3xl leading-relaxed mb-8">
            Wenn du UGC fuer Hamburg, Norddeutschland oder bundesweite Kampagnen suchst, kannst du zuerst passende Creator identifizieren und danach entscheiden, ob du Agentur-Support brauchst.
          </p>
          <Link href="/brands?query=UGC%20Creator%20Hamburg" className="inline-flex bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg">
            Creator fuer Hamburg suchen
          </Link>
        </section>
        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-6">
            <h2 className="font-bold text-emerald-300 mb-3">Erst Matching, dann Abwicklung</h2>
            <p className="text-gray-300">UGC VZ zeigt dir Creator-Vorschlaege. Bei Bedarf kann das Team Briefing, Rechte, Feedback und Produktion mitdenken.</p>
          </div>
          <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-6">
            <h2 className="font-bold text-emerald-300 mb-3">Nicht nur lokale Reichweite</h2>
            <p className="text-gray-300">Oft zaehlt nicht der Wohnort, sondern Sprache, Stil, Produktfit und ob Creator das Format glaubwuerdig umsetzen koennen.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

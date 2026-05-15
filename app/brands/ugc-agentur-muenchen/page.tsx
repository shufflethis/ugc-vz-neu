import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'UGC Agentur Muenchen oder Creator-Plattform?',
  description: 'UGC Agentur Muenchen gesucht? UGC VZ verbindet Brands mit passenden UGC Creatorn und optionaler Kampagnen-Unterstuetzung.',
  alternates: { canonical: 'https://ugc-vz.de/brands/ugc-agentur-muenchen' },
};

export default function UGCAgenturMuenchenPage() {
  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto">
        <Link href="/brands" className="text-sm text-gray-400 hover:text-white">UGC VZ fuer Brands</Link>
        <section className="py-14">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">UGC Agentur Muenchen oder Creator direkt finden?</h1>
          <p className="text-xl text-gray-300 max-w-3xl leading-relaxed mb-8">
            Fuer Muenchner Brands, DTC-Teams und Agenturen ist UGC VZ ein schneller Einstieg: Demand beschreiben, Creator-Vorschlaege ansehen und Kontaktinfos kostenlos anfragen.
          </p>
          <Link href="/brands?query=UGC%20Creator%20Muenchen" className="inline-flex bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg">
            Creator fuer Muenchen suchen
          </Link>
        </section>
        <section className="bg-gray-900/40 border border-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-emerald-300 mb-4">Plattform oder Agentur?</h2>
          <p className="text-gray-300 leading-relaxed">
            Wenn du nur Creator entdecken und direkt kontaktieren willst, reicht die Plattform. Wenn du Briefing, Skript, Nutzungsrechte, Creator-Steuerung, Produktion oder Paid-Social-Setup brauchst, kann daraus optional ein betreutes Kampagnenprojekt werden.
          </p>
        </section>
      </div>
    </main>
  );
}

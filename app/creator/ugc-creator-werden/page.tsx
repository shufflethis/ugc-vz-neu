import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'UGC Creator werden',
  description: 'UGC Creator werden in Deutschland: Was du brauchst, wie du dein Portfolio aufbaust und wie du dich kostenlos bei UGC VZ anmeldest.',
  alternates: { canonical: 'https://ugc-vz.de/creator/ugc-creator-werden' },
};

export default function UGCCreatorWerdenPage() {
  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-white">UGC VZ</Link>
        <section className="py-14">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">UGC Creator werden</h1>
          <p className="text-xl text-gray-300 max-w-3xl leading-relaxed mb-8">
            Du brauchst keine riesige Reichweite, sondern gute Beispiele, klares Profil und verlaessliche Kommunikation. UGC VZ hilft dir, fuer passende Brand-Anfragen sichtbar zu werden.
          </p>
          <Link href="/creator" className="inline-flex bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg">
            Kostenlos anmelden
          </Link>
        </section>
        <section className="grid md:grid-cols-3 gap-6">
          {[
            ['Portfolio', 'Zeige 3-6 starke Beispiele: Hook, Produktdemo, Testimonial, Voiceover oder Ad Creative.'],
            ['Positionierung', 'Definiere Themen, Sprachen, Stil, Branchen und Content-Formate.'],
            ['Anfrage-Fit', 'Nenne Preisrange, Rechte, Verfuegbarkeit und Kontaktmoeglichkeiten.'],
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

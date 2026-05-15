import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'UGC Creator Jobs',
  description: 'UGC Creator Jobs finden: Wie Brands Creator suchen, welche Profilangaben helfen und wie du dich kostenlos bei UGC VZ eintraegst.',
  alternates: { canonical: 'https://ugc-vz.de/creator/ugc-creator-jobs' },
};

export default function UGCCreatorJobsPage() {
  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-sm text-gray-400 hover:text-white">UGC VZ</Link>
        <section className="py-14">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">UGC Creator Jobs und Auftraege</h1>
          <p className="text-xl text-gray-300 max-w-3xl leading-relaxed mb-8">
            UGC Jobs entstehen meist aus konkreten Brand-Anfragen: Produkt testen, Video erstellen, Nutzungsrechte klaeren. Ein vollstaendiges Profil hilft, schneller als passender Creator erkannt zu werden.
          </p>
          <Link href="/creator" className="inline-flex bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg">
            Creator-Profil eintragen
          </Link>
        </section>
        <section className="bg-gray-900/40 border border-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-emerald-300 mb-4">Welche Angaben erhoehen die Chance auf passende Jobs?</h2>
          <ul className="space-y-3 text-gray-300">
            <li>Branchen und Themen, fuer die du glaubwuerdig Content erstellen kannst.</li>
            <li>Portfolio-Links mit echten Beispielen statt nur Social-Profil.</li>
            <li>Formate wie TikTok, Reels, Produktdemo, Testimonial, Hook-Varianten oder Voiceover.</li>
            <li>Preisrahmen, Nutzungsrechte, Standort, Sprache und Antwortgeschwindigkeit.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}

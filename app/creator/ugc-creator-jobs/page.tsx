import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'UGC Creator Jobs',
  description: 'UGC Creator Jobs finden: Wie Brands Creator suchen, welche Profilangaben helfen und wie du dich kostenlos bei UGC VZ eintraegst.',
  alternates: { canonical: 'https://ugc-vz.de/creator/ugc-creator-jobs' },
};

export default function UGCCreatorJobsPage() {
  return (
    <main className="min-h-screen bg-white text-ink px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink">UGC VZ</Link>
        <section className="py-14">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-ink">UGC Creator Jobs und Auftraege</h1>
          <p className="text-xl text-ink-soft max-w-3xl leading-relaxed mb-8">
            UGC Jobs entstehen meist aus konkreten Brand-Anfragen: Produkt testen, Video erstellen, Nutzungsrechte klaeren. Ein vollstaendiges Profil hilft, schneller als passender Creator erkannt zu werden.
          </p>
          <Link href="/creator" className="inline-flex bg-geo-violet hover:bg-geo-violet-soft text-white font-semibold py-3 px-6 rounded-lg">
            Creator-Profil eintragen
          </Link>
        </section>
        <section className="surface-card rounded-lg p-8">
          <h2 className="text-2xl font-bold text-geo-violet mb-4">Welche Angaben erhoehen die Chance auf passende Jobs?</h2>
          <ul className="space-y-3 text-ink-soft">
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

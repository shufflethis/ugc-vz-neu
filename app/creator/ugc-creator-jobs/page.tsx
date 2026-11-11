import type { Metadata } from 'next';
import { pageMetadata } from '@/utils/seo-metadata';
import Link from 'next/link';

export const metadata: Metadata = pageMetadata({
  path: '/creator/ugc-creator-jobs',
  title: 'UGC Creator Jobs',
  description: 'UGC Creator Jobs finden: Wie Brands Creator suchen, welche Profilangaben helfen und wie du dich kostenlos bei UGC VZ einträgst.',
});

export default function UGCCreatorJobsPage() {
  return (
    <div className="min-h-screen bg-white text-ink px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto">
        <Link href="/creator" className="text-sm text-ink-soft hover:text-ink">UGC VZ für Creator</Link>
        <section className="py-14">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-ink">UGC Creator Jobs und Aufträge</h1>
          <p className="text-xl text-ink-soft max-w-3xl leading-relaxed mb-8">
            UGC Jobs entstehen meist aus konkreten Brand-Anfragen: Produkt testen, Video erstellen, Nutzungsrechte klären. Ein vollständiges Profil hilft, schneller als passender Creator erkannt zu werden.
          </p>
          <Link href="/creator#creator-form" className="inline-flex bg-geo-violet hover:bg-geo-violet-soft text-white font-semibold py-3 px-6 rounded-full">
            Creator-Profil eintragen
          </Link>
        </section>
        <section className="surface-card rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-geo-violet mb-4">Welche Angaben erhöhen die Chance auf passende Jobs?</h2>
          <ul className="space-y-3 text-ink-soft">
            <li>Branchen und Themen, für die du glaubwürdig Content erstellen kannst.</li>
            <li>Portfolio-Links mit echten Beispielen statt nur Social-Profil.</li>
            <li>Formate wie TikTok, Reels, Produktdemo, Testimonial, Hook-Varianten oder Voiceover.</li>
            <li>Preisrahmen, Nutzungsrechte, Standort, Sprache und Antwortgeschwindigkeit.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

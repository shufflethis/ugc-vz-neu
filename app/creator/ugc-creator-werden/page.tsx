import type { Metadata } from 'next';
import { pageMetadata } from '@/utils/seo-metadata';
import Link from 'next/link';

export const metadata: Metadata = pageMetadata({
  path: '/creator/ugc-creator-werden',
  title: 'UGC Creator werden',
  description: 'UGC Creator werden in Deutschland: Was du brauchst, wie du dein Portfolio aufbaust und wie du dich kostenlos bei UGC VZ anmeldest.',
});

export default function UGCCreatorWerdenPage() {
  return (
    <main className="min-h-screen bg-white text-ink px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink">UGC VZ</Link>
        <section className="py-14">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-ink">UGC Creator werden</h1>
          <p className="text-xl text-ink-soft max-w-3xl leading-relaxed mb-8">
            Du brauchst keine riesige Reichweite, sondern gute Beispiele, klares Profil und verlaessliche Kommunikation. UGC VZ hilft dir, fuer passende Brand-Anfragen sichtbar zu werden.
          </p>
          <Link href="/creator" className="inline-flex bg-geo-violet hover:bg-geo-violet-soft text-white font-semibold py-3 px-6 rounded-lg">
            Kostenlos anmelden
          </Link>
        </section>
        <section className="grid md:grid-cols-3 gap-6">
          {[
            ['Portfolio', 'Zeige 3-6 starke Beispiele: Hook, Produktdemo, Testimonial, Voiceover oder Ad Creative.'],
            ['Positionierung', 'Definiere Themen, Sprachen, Stil, Branchen und Content-Formate.'],
            ['Anfrage-Fit', 'Nenne Preisrange, Rechte, Verfuegbarkeit und Kontaktmoeglichkeiten.'],
          ].map(([title, copy]) => (
            <div key={title} className="surface-card rounded-lg p-6">
              <h2 className="font-bold text-geo-violet mb-3">{title}</h2>
              <p className="text-ink-soft">{copy}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

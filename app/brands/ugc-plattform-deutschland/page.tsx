import type { Metadata } from 'next';
import { pageMetadata } from '@/utils/seo-metadata';
import Link from 'next/link';

export const metadata: Metadata = pageMetadata({
  path: '/brands/ugc-plattform-deutschland',
  title: 'UGC Plattform Deutschland',
  description: 'UGC VZ ist eine kostenlose UGC Plattform fuer Deutschland: Creator entdecken, Profile auswaehlen und Kampagnen-Anfragen starten.',
});

export default function UGCPlattformDeutschlandPage() {
  return (
    <main className="min-h-screen bg-white text-ink px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink">UGC VZ</Link>
        <section className="py-14">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-ink">UGC Plattform fuer Deutschland</h1>
          <p className="text-xl text-ink-soft max-w-3xl leading-relaxed mb-8">
            UGC VZ verbindet deutsche Brands mit UGC Creatorn. Die Plattform ist fuer erste Creator-Suchen kostenlos und eignet sich fuer Teams, die schnell passende Profile fuer Content-Projekte finden wollen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/brands" className="bg-geo-violet hover:bg-geo-violet-soft text-white font-semibold py-3 px-6 rounded-lg">Creator suchen</Link>
            <Link href="/creator" className="border border-geo-violet text-geo-violet font-semibold py-3 px-6 rounded-lg hover:bg-geo-violet hover:text-white">Als Creator anmelden</Link>
          </div>
        </section>
        <section className="grid md:grid-cols-2 gap-6">
          <div className="surface-card rounded-lg p-6">
            <h2 className="text-2xl font-bold text-geo-violet mb-4">Fuer Brands</h2>
            <p className="text-ink-soft leading-relaxed">Demand eingeben, Creator-Vorschlaege ansehen, Auswahl senden. Geeignet fuer E-Commerce, lokale Unternehmen, Apps, Beauty, Food, Tech und B2B.</p>
          </div>
          <div className="surface-card rounded-lg p-6">
            <h2 className="text-2xl font-bold text-geo-violet mb-4">Fuer Creator</h2>
            <p className="text-ink-soft leading-relaxed">Kostenloses Profil mit Portfolio, Themen, Social-Links und Verfuegbarkeit anlegen, damit passende Anfragen besser zugeordnet werden koennen.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

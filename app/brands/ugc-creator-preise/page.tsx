import type { Metadata } from 'next';
import Link from 'next/link';
import SearchBox from '../../components/SearchBox';

export const metadata: Metadata = {
  title: 'UGC Creator Preise in Deutschland',
  description: 'UGC Creator Preise einschaetzen: typische Faktoren, Budgetrahmen und kostenlose Creator-Suche fuer Brands in Deutschland.',
  alternates: { canonical: 'https://ugc-vz.de/brands/ugc-creator-preise' },
};

export default function UGCCreatorPreisePage() {
  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto">
        <Link href="/brands" className="text-sm text-gray-400 hover:text-white">UGC VZ fuer Brands</Link>
        <section className="py-14 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">UGC Creator Preise realistisch einschaetzen</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
            UGC Preise haengen von Format, Aufwand, Nutzungsrechten, Erfahrung und Timing ab. Starte mit deinem Budgetrahmen und finde passende Creator-Vorschlaege.
          </p>
          <SearchBox initialQuery="UGC Creator bis 500 Euro fuer Produktvideo" />
        </section>
        <section className="grid md:grid-cols-3 gap-6">
          {[
            ['Preis ist nicht nur Video', 'Briefing, Hook-Varianten, Rohmaterial, Revisionen und Nutzungsrechte beeinflussen den Gesamtpreis.'],
            ['Budget offen nennen', 'Wenn du einen Rahmen nennst, kann die Suche Profile mit passenden Preisangaben besser priorisieren.'],
            ['Kontaktinfos kostenlos anfragen', 'Nach der Auswahl bekommst du verfuegbare Kontakt- und Social-Daten per E-Mail.'],
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

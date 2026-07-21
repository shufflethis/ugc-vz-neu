import type { Metadata } from 'next';
import { pageMetadata } from '@/utils/seo-metadata';
import Link from 'next/link';

export const metadata: Metadata = pageMetadata({
  path: '/brands/ugc-vertrag-vorlage',
  title: 'UGC Vertrag Vorlage',
  description: 'Praktische UGC Vertrags- und Briefing-Vorlage fuer Brands: Leistung, Verguetung, Nutzungsrechte, Abnahme und Timing klaeren.',
});

export default function UGCVertragVorlagePage() {
  return (
    <main className="min-h-screen bg-white text-ink px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <div className="max-w-4xl mx-auto">
        <Link href="/brands" className="text-sm text-ink-soft hover:text-ink">Zurueck zu Brands</Link>

        <section className="py-14">
          <p className="text-geo-violet font-semibold mb-4">Arbeitsvorlage, keine Rechtsberatung</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-ink">UGC Vertrag Vorlage fuer Creator Deals</h1>
          <p className="text-xl text-ink-soft leading-relaxed">
            Diese Vorlage hilft dir, die wichtigsten Punkte vor einer UGC-Produktion sauber zu klaeren. Sie ersetzt keine anwaltliche Pruefung, ist aber eine gute Grundlage fuer Briefing, Angebot und Abstimmung.
          </p>
        </section>

        <section className="space-y-8">
          {[
            {
              title: '1. Parteien und Kontakt',
              items: [
                'Brand/Unternehmen mit Ansprechpartner, E-Mail und Rechnungsadresse',
                'Creator mit Name, Kontakt, Social-Profilen und Rechnungsdaten',
                'Projektname oder Kampagnenname',
              ],
            },
            {
              title: '2. Leistung und Deliverables',
              items: [
                'Anzahl der Videos, Fotos, Hooks, Varianten oder Rohmaterialien',
                'Format, Plattform, Laenge, Sprache, Seitenverhaeltnis und Tonalitaet',
                'Ob Posting auf Creator-Kanal, reine Ad-Nutzung oder beides gewuenscht ist',
              ],
            },
            {
              title: '3. Verguetung und Zahlung',
              items: [
                'Fixpreis, Paketpreis oder Preis pro Asset',
                'Zahlungsziel, Anzahlungen und Rechnungsvoraussetzungen',
                'Zusatzkosten wie Produkte, Versand, Reisekosten oder Requisiten',
              ],
            },
            {
              title: '4. Nutzungsrechte',
              items: [
                'Wo darf die Brand den Content nutzen: Website, organisch, Paid Social, Marketplace, Newsletter',
                'Dauer der Nutzung: zum Beispiel 3, 6 oder 12 Monate',
                'Geografischer Umfang und ob Whitelisting/Spark Ads erlaubt sind',
              ],
            },
            {
              title: '5. Ablauf, Abnahme und Revisionen',
              items: [
                'Briefing-Datum, Skript-/Konzeptfreigabe, Lieferdatum und finale Abnahme',
                'Anzahl inkludierter Korrekturrunden',
                'Was als Korrektur gilt und was als neue Leistung berechnet wird',
              ],
            },
            {
              title: '6. Rechtliches und Compliance',
              items: [
                'Kennzeichnungspflichten bei Posting oder Werbung',
                'Musik-, Bild-, Marken- und Persönlichkeitsrechte',
                'Vertraulichkeit, Produktclaims, Gesundheits-/Finanzclaims und Freigaben',
              ],
            },
          ].map((section) => (
            <div key={section.title} className="surface-card rounded-lg p-6">
              <h2 className="text-2xl font-bold text-geo-violet mb-4">{section.title}</h2>
              <ul className="space-y-3 text-ink-soft">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="mt-12 surface-card rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-ink">Kurztext fuer deine Anfrage</h2>
          <p className="text-ink-soft leading-relaxed">
            Hallo, wir suchen UGC Content fuer [Produkt/Brand]. Geplant sind [Anzahl] [Videos/Fotos] fuer [Plattform/Nutzung]. Wichtig sind [Zielgruppe/Stil/Claims]. Bitte sende uns Preis, Verfuegbarkeit, Beispiele und deine Konditionen fuer Nutzungsrechte.
          </p>
        </section>
      </div>
    </main>
  );
}

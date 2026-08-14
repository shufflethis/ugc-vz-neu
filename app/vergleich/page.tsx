import type { Metadata } from 'next';
import Link from 'next/link';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import JsonLdScript from '../wissen/[slug]/JsonLdScript';
import ComparisonTable from '../components/ComparisonTable';
import { competitors } from '../lib/competitors';

export const metadata: Metadata = {
  title: 'UGC-Plattformen im Vergleich 2026',
  description:
    'Speekly, Influee, stylink UGC, Boksi, Refluenced und Youdji im sachlichen Vergleich: Kosten, Provisionen, Creator-Pools und Direktkontakt. Alle Angaben mit Quelle und Prüfdatum.',
  alternates: { canonical: 'https://ugc-vz.de/vergleich' },
  openGraph: {
    title: 'UGC-Plattformen im Vergleich 2026',
    description: 'Kosten, Provisionen und Creator-Pools der wichtigsten UGC-Plattformen im deutschsprachigen Raum.',
    url: 'https://ugc-vz.de/vergleich',
    siteName: 'UGC VZ',
    locale: 'de_DE',
    type: 'website',
  },
};

export default function VergleichPage() {
  const breadcrumbs = [
    { name: 'Startseite', url: 'https://ugc-vz.de' },
    { name: 'Vergleich', url: 'https://ugc-vz.de/vergleich' },
  ];

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'UGC-Plattformen im Vergleich',
    numberOfItems: competitors.length,
    itemListElement: competitors.map((c, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: c.name,
      url: c.url,
    })),
  };

  return (
    <div className="min-h-screen bg-white text-ink">
      <BreadcrumbSchema items={breadcrumbs} />
      <JsonLdScript data={itemListSchema} />

      <main className="py-12 px-4 sm:px-8 md:px-16 lg:px-24">
        <section className="max-w-5xl mx-auto mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-ink">
            UGC-Plattformen <span className="gradient-text">im Vergleich</span>
          </h1>
          <p className="text-lg text-ink-soft mb-4">
            Die meisten Anbieter in diesem Markt sind vermittelte Marktplätze: Du erstellst einen Auftrag, die Plattform
            wickelt Vertrag und Zahlung ab. UGC VZ ist ein Verzeichnis — du bekommst die Kontaktdaten der Creator und
            verhandelst direkt. Beides hat seine Berechtigung, und diese Tabelle zeigt, wann was passt.
          </p>
          <p className="text-sm text-ink-soft/80">
            Alle Zahlen stammen von den Websites der Anbieter, mit Quelle und Prüfdatum. Wo ein Anbieter keine Preise
            veröffentlicht, steht „nicht öffentlich" — wir schätzen nichts.
          </p>
        </section>

        <section className="max-w-6xl mx-auto mb-16">
          <ComparisonTable rows={competitors} />
        </section>

        <section className="max-w-5xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-6 text-ink">Die Anbieter im Einzelnen</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {competitors
              .filter((c) => !c.isOwn)
              .map((c) => (
                <div key={c.slug} className="border border-hairline rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-ink mb-2">{c.name}</h3>
                  <p className="text-sm text-ink-soft mb-3">{c.model}</p>
                  <p className="text-sm text-ink mb-4">
                    <strong>Am besten geeignet für:</strong> {c.bestFor}
                  </p>
                  <ul className="text-sm text-ink-soft space-y-1 mb-4 list-disc list-inside">
                    {c.strengths.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                  {c.hasOwnPage && (
                    <Link href={`/vergleich/${c.slug}-alternative`} className="text-sm underline hover:text-geo-violet">
                      {c.name} und UGC VZ im Detail vergleichen
                    </Link>
                  )}
                </div>
              ))}
          </div>
        </section>

        <section className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-ink">Creator direkt finden</h2>
          <p className="text-ink-soft mb-6">
            470+ kuratierte Creator im deutschsprachigen Raum, kostenlos, mit direkten Kontaktdaten.
          </p>
          <Link
            href="/brands"
            className="inline-block px-8 py-4 rounded-full bg-geo-violet text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Zur Creator-Suche
          </Link>
        </section>
      </main>
    </div>
  );
}

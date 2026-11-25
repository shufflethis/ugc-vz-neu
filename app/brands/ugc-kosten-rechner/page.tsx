import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMetadata } from '@/utils/seo-metadata';
import BreadcrumbSchema from '../../components/BreadcrumbSchema';
import JsonLdScript from '../../wissen/[slug]/JsonLdScript';
import UgcCostCalculator from '../../components/UgcCostCalculator';
import { NICHES } from '@/app/lib/niches';
import { loadNicheRows, matchesNiche, nicheStats } from '@/app/lib/niche-data';
import type { NichePriceBenchmark } from '@/app/lib/ugc-calculator';

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  path: '/brands/ugc-kosten-rechner',
  title: 'UGC Kosten Rechner 2026: Video- & Nutzungsrechte-Budget kalkulieren',
  description:
    'Kostenloser UGC Kosten Rechner für Deutschland: Kalkuliere Videopreise, Zusatz-Hooks, Rohmaterial und Paid-Ads-Nutzungsrechte auf Basis echter Creator-Daten.',
});

const faqs = [
  {
    question: 'Wie realistisch sind die Zahlen im UGC Kosten Rechner?',
    answer:
      'Für jede Branche, in der mindestens 8 aktive Profile im UGC-VZ-Verzeichnis Preisangaben enthalten, rechnet das Tool mit den echten Einstiegs-Medianen (p25/Median/p75) aus dem Pool. Für allgemeine Anfragen gelten die marktüblichen Spannen in Deutschland (150–2.500 € je nach Format).',
  },
  {
    question: 'Warum erhöhen Nutzungsrechte für Paid Ads den Preis so stark?',
    answer:
      'Bei rein organischer Nutzung spielt die Brand das Video nur auf eigenen Profilen aus. Bei Paid Social (Meta/TikTok Ads) oder Whitelisting wird das Gesicht des Creators gegen Mediabudget skaliert – dafür veranschlagen professionelle Creator je nach Laufzeit typischerweise 30 bis 110 % Aufschlag.',
  },
  {
    question: 'Welche Gebühr nimmt UGC VZ zusätzlich zum Creator-Honorar?',
    answer:
      'Keine. Suche, Profilprüfung und Kontaktanfrage über UGC VZ sind kostenlos und provisionsfrei (0 %). Du vereinbarst Honorar und Rechte direkt mit dem Creator.',
  },
];

async function loadBenchmarks(): Promise<NichePriceBenchmark[]> {
  try {
    const rows = await loadNicheRows();
    if (!rows.length) return [];
    return NICHES.map((niche) => {
      const matched = rows.filter((row) => matchesNiche(row, niche.match));
      const stats = nicheStats(matched);
      if (!stats.price) return null;
      return {
        slug: niche.slug,
        label: niche.chip,
        count: stats.count,
        p25: stats.price.p25,
        median: stats.price.median,
        p75: stats.price.p75,
        n: stats.price.n,
      };
    }).filter((item): item is NichePriceBenchmark => Boolean(item));
  } catch {
    return [];
  }
}

export default async function UgcKostenRechnerPage() {
  const benchmarks = await loadBenchmarks();
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-white text-ink px-4 sm:px-8 md:px-16 lg:px-24 py-14">
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://ugc-vz.de' },
          { name: 'Für Brands', url: 'https://ugc-vz.de/brands' },
          { name: 'UGC Kosten Rechner', url: 'https://ugc-vz.de/brands/ugc-kosten-rechner' },
        ]}
      />
      <JsonLdScript data={faqSchema} />

      <div className="mx-auto max-w-5xl space-y-12">
        <div>
          <Link href="/brands" className="text-sm text-ink-soft hover:text-ink">
            ← Zurück zu UGC VZ für Brands
          </Link>
          <h1 className="mt-5 text-4xl font-bold leading-tight text-ink sm:text-5xl">
            UGC Kosten Rechner <span className="gradient-text">für Deutschland</span>
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">
            Plane dein UGC-Budget in 60 Sekunden: Wähle Branche, Video-Format, Zusatz-Hooks, Rohmaterial und Paid-Ads-Nutzungsrechte
            und vergleiche direkt, wie viel Budget bei 0 % Provision wirklich beim Creator ankommt.
          </p>
        </div>

        <UgcCostCalculator benchmarks={benchmarks} />

        <section className="grid gap-5 md:grid-cols-3">
          <Link href="/brands/ugc-creator-preise" className="surface-card rounded-2xl p-6 hover:border-geo-violet transition-colors">
            <h2 className="font-bold text-geo-violet">Preistabellen nach Format</h2>
            <p className="mt-2 text-sm text-ink-soft">Alle Richtwerte von Social Clip bis Branded Story im Überblick.</p>
          </Link>
          <Link href="/brands/ugc-vertrag-vorlage" className="surface-card rounded-2xl p-6 hover:border-geo-violet transition-colors">
            <h2 className="font-bold text-geo-violet">Vertrags- &amp; Briefing-Generator</h2>
            <p className="mt-2 text-sm text-ink-soft">Nutzungsrechte, Abnahme und Honorar sauber schriftlich festhalten.</p>
          </Link>
          <Link href="/vergleich" className="surface-card rounded-2xl p-6 hover:border-geo-violet transition-colors">
            <h2 className="font-bold text-geo-violet">UGC-Plattformen im Vergleich</h2>
            <p className="mt-2 text-sm text-ink-soft">UGC VZ vs. Speekly, Noovid, Contentmarkt, Influee &amp; Co.</p>
          </Link>
        </section>

        <section className="max-w-3xl space-y-4">
          <h2 className="text-2xl font-bold text-ink">Häufige Fragen zum UGC-Budget</h2>
          {faqs.map((item) => (
            <details key={item.question} className="surface-card rounded-2xl p-5">
              <summary className="cursor-pointer font-semibold text-ink">{item.question}</summary>
              <p className="mt-3 text-sm leading-6 text-ink-soft">{item.answer}</p>
            </details>
          ))}
        </section>
      </div>
    </div>
  );
}

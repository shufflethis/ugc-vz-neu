import type { Metadata } from 'next';
import { pageMetadata } from '@/utils/seo-metadata';
import Link from 'next/link';
import BreadcrumbSchema from '../../components/BreadcrumbSchema';
import FAQSchema from '../../components/FAQSchema';
import UgcContractBuilder from '../../components/UgcContractBuilder';

export const metadata: Metadata = pageMetadata({
  path: '/brands/ugc-vertrag-vorlage',
  title: 'UGC Vertrag Vorlage & Generator (DE)',
  description: 'Interaktive UGC Vertrags- und Briefing-Vorlage für Brands: Leistung, Vergütung, Paid-Ads-Nutzungsrechte, Abnahme und Anfrage-Text kostenlos erstellen.',
});

const CONTRACT_FAQ = [
  {
    question: 'Reicht für ein UGC-Video eine kurze E-Mail oder brauche ich eine Vertragsvorlage?',
    answer:
      'Mindestens Leistungsumfang (Anzahl Videos, Länge, Hooks), Nutzungsrechte (Kanäle, Paid Ads, Laufzeit), Korrekturrunden, Liefertermin und Honorar sollten schriftlich per E-Mail oder Vertragsdokument bestätigt sein. Ohne klare Regelung verbleiben Nutzungsrechte nach § 31 UrhG im Zweifel beim Creator.',
  },
  {
    question: 'Wie regle ich Paid Ads und Whitelisting (Spark Ads) im UGC-Vertrag?',
    answer:
      'Trenne organische Nutzung auf eigenen Kanälen ausdrücklich von bezahlter Ausspielung (Meta Ads, TikTok Ads) und Whitelisting über den Creator-Account. Lege Laufzeit (z. B. 6 oder 12 Monate) und etwaige Verlängerungsoptionen vorab fest.',
  },
  {
    question: 'Ersetzt diese UGC Vertrag Vorlage eine Rechtsberatung?',
    answer:
      'Nein. Der Generator liefert eine strukturierte Arbeitsvorlage für typische Direktvereinbarungen zwischen Brands und Creatorn. Für komplexe Kampagnen, Exklusivitätsklauseln oder regulierte Branchen sollte ein Fachanwalt prüfen.',
  },
];

export default function UGCVertragVorlagePage() {
  return (
    <div className="min-h-screen bg-white text-ink px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://ugc-vz.de' },
          { name: 'Für Brands', url: 'https://ugc-vz.de/brands' },
          { name: 'UGC Vertrag Vorlage', url: 'https://ugc-vz.de/brands/ugc-vertrag-vorlage' },
        ]}
      />
      <FAQSchema faqItems={CONTRACT_FAQ} />
      <div className="max-w-5xl mx-auto">
        <Link href="/brands" className="text-sm text-ink-soft hover:text-ink">← Zurück zu UGC VZ für Brands</Link>

        <section className="py-10 sm:py-14">
          <p className="text-geo-violet font-semibold mb-3">Arbeitsvorlage, keine Rechtsberatung</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-5 text-ink">UGC Vertrag Vorlage &amp; Generator</h1>
          <p className="text-xl text-ink-soft max-w-3xl leading-relaxed">
            Erstelle in zwei Minuten eine saubere Vertrags- und Briefing-Grundlage inklusive Nutzungsrechten (§ 31 UrhG) und fertiger Erstansprache – kostenlos, zum Kopieren oder Drucken als PDF.
          </p>
        </section>

        <UgcContractBuilder />

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
                'Format, Plattform, Länge, Sprache, Seitenverhältnis und Tonalität',
                'Ob Posting auf Creator-Kanal, reine Ad-Nutzung oder beides gewünscht ist',
              ],
            },
            {
              title: '3. Vergütung und Zahlung',
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
            <div key={section.title} className="surface-card rounded-3xl p-6">
              <h2 className="text-2xl font-bold text-geo-violet mb-4">{section.title}</h2>
              <ul className="space-y-3 text-ink-soft">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-bold text-ink">Häufige Fragen zum UGC-Vertrag</h2>
          {CONTRACT_FAQ.map((item) => (
            <details key={item.question} className="surface-card rounded-2xl p-5">
              <summary className="cursor-pointer font-semibold text-ink">{item.question}</summary>
              <p className="mt-3 text-sm leading-6 text-ink-soft">{item.answer}</p>
            </details>
          ))}
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          <Link href="/brands/ugc-kosten-rechner" className="surface-card rounded-2xl p-6 hover:border-geo-violet transition-colors">
            <h2 className="font-bold text-geo-violet">UGC Kosten &amp; Nutzungsrechte kalkulieren →</h2>
            <p className="mt-1 text-sm text-ink-soft">Prüfe marktübliche Aufschläge für Paid Ads, Hooks und Rohmaterial.</p>
          </Link>
          <Link href="/brands" className="surface-card rounded-2xl p-6 hover:border-geo-violet transition-colors">
            <h2 className="font-bold text-geo-violet">Passende Creator direkt anfragen →</h2>
            <p className="mt-1 text-sm text-ink-soft">Durchsuche echte Profile im DACH-Raum ohne Monatsabo.</p>
          </Link>
        </section>
      </div>
    </div>
  );
}

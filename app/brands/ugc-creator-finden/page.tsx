import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMetadata } from '@/utils/seo-metadata';
import SearchBox from '../../components/SearchBox';
import BreadcrumbSchema from '../../components/BreadcrumbSchema';
import FAQSchema from '../../components/FAQSchema';
import JsonLdScript from '../../wissen/[slug]/JsonLdScript';
import { CREATOR_COUNT_LABEL } from '@/app/lib/creator-count';
import { NICHE_INDEX, nichePath } from '@/app/lib/niche-index';
import { loadNicheRows, nicheStats } from '@/app/lib/niche-data';

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  path: '/brands/ugc-creator-finden',
  title: 'UGC Creator finden – kostenlos im DACH-Verzeichnis',
  description: `UGC Creator finden ohne Agentur & Abo: Durchsuche ${CREATOR_COUNT_LABEL} echte Profile mit Portfolio und Preisvorstellung und erhalte direkte Kontaktdaten kostenlos per E-Mail.`,
});

const faqs = [
  {
    question: 'Wie finde ich schnell passende UGC Creator für mein Produkt?',
    answer:
      'Beschreibe oben kurz Produkt, Zielgruppe, Plattform (z. B. TikTok, Instagram Reels, Meta Ads) und deinen Budgetrahmen. Du siehst sofort passende Profile mit Arbeitsproben und Preisvorstellungen, markierst 3–5 Favoriten und forderst ihre Kontaktdaten kostenlos per E-Mail an.',
  },
  {
    question: 'Worauf sollte ich beim Prüfen eines Creator-Profils achten?',
    answer:
      'Schau zuerst in die verlinkten Arbeitsproben: Spricht der Creator natürlich vor der Kamera, passen Licht und Ton, wirken Hooks glaubwürdig? Danach prüfst du Preisvorstellung, Themen-Fit und ob E-Mail-Kontakt direkt hinterlegt ist.',
  },
  {
    question: 'Wie viele Creator sollte ich pro Kampagne anfragen?',
    answer:
      'Für eine typische Test-Kampagne mit 2–3 finalen Creatorn empfehlen wir, 5 bis 8 passende Profile anzufragen. So kannst du Verfügbarkeit, Paketpreise und Stil direkt vergleichen.',
  },
  {
    question: 'Entstehen bei UGC VZ versteckte Kosten oder Provisionen?',
    answer:
      'Nein. Suche, Auswahl und Kontaktanfrage sind für Brands kostenlos (0 % Provision). Du bezahlst ausschließlich das Honorar, das du direkt mit dem jeweiligen Creator vereinbarst.',
  },
];

export default async function UGCCreatorFindenPage() {
  let poolCount = 0;
  let medianPrice: number | null = null;
  try {
    const rows = await loadNicheRows();
    const stats = nicheStats(rows);
    poolCount = stats.count;
    medianPrice = stats.price?.median ?? null;
  } catch {
    poolCount = 0;
  }

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'UGC Creator finden',
    description: `Kostenlose UGC-Creator-Suche für Brands in Deutschland, Österreich und der Schweiz (${CREATOR_COUNT_LABEL} Profile, ohne Provision).`,
    provider: { '@type': 'Organization', '@id': 'https://ugc-vz.de/#organization' },
    areaServed: { '@type': 'Country', name: 'Deutschland' },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  };

  return (
    <div className="min-h-screen bg-white text-ink px-4 sm:px-8 md:px-16 lg:px-24 py-14">
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://ugc-vz.de' },
          { name: 'Für Brands', url: 'https://ugc-vz.de/brands' },
          { name: 'UGC Creator finden', url: 'https://ugc-vz.de/brands/ugc-creator-finden' },
        ]}
      />
      <JsonLdScript data={serviceSchema} />
      <FAQSchema faqItems={faqs} />

      <div className="max-w-5xl mx-auto">
        <Link href="/brands" className="text-sm text-ink-soft hover:text-ink">
          ← UGC VZ für Brands
        </Link>

        <section className="py-10 sm:py-14 text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#dce9d1] bg-[#edf5e5] px-3 py-1.5 text-xs font-semibold text-[#385523]">
            {poolCount > 0 ? `${poolCount} aktive Profile` : `${CREATOR_COUNT_LABEL} Profile`}
            {medianPrice ? ` · Einstiegs-Median ${medianPrice.toLocaleString('de-DE')} €` : ''} · 0 € Vermittlung
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-ink">UGC Creator finden – direkt &amp; ohne Provision</h1>
          <p className="text-lg sm:text-xl text-ink-soft max-w-3xl mx-auto mb-10 leading-relaxed">
            Suche passende UGC Creator für Produktvideos, Social Ads, Testimonials und Launches im DACH-Raum. Beschreibe kurz deinen Bedarf, vergleiche Portfolios und Preisvorstellungen und erhalte direkte Kontaktdaten kostenlos per E-Mail.
          </p>
          <div className="rounded-3xl border border-hairline bg-white p-4 text-left shadow-[0_24px_70px_rgba(35,22,47,0.08)] sm:p-8">
            <SearchBox initialQuery="UGC Creator für Produktvideos auf TikTok und Instagram Reels" />
          </div>
        </section>

        {/* 4 Schritte */}
        <section className="py-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-ink">So findest du in 4 Schritten den richtigen Creator</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              ['1. Bedarf beschreiben', 'Nenne Produkt, Zielgruppe, Video-Format (z. B. Unboxing, Testimonial, Hook-Ad) und deinen groben Budgetrahmen.'],
              ['2. Portfolios prüfen', 'Öffne die verlinkten Arbeitsproben im Profil und achte auf Kamera-Präsenz, Tonqualität und authentischen Stil.'],
              ['3. Favoriten anfragen', 'Wähle bis zu 10 Creator aus und fordere ihre Kontaktdaten kostenlos per E-Mail an; bei regulären bezahlten Anfragen können erreichbare Creator zusätzlich über dein Interesse informiert werden.'],
              ['4. Direkt vereinbaren', 'Kläre Verfügbarkeit, Preis, Deliverables und Nutzungsrechte direkt – ohne Plattformgebühr und ohne Abo.'],
            ].map(([title, copy]) => (
              <div key={title} className="surface-card rounded-2xl p-6">
                <h3 className="font-bold text-geo-violet mb-2">{title}</h3>
                <p className="text-sm leading-6 text-ink-soft">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Qualitaetscheck & Fehler vermeiden */}
        <section className="py-10 grid gap-6 md:grid-cols-2">
          <div className="surface-card rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-ink mb-4">Worauf Performance-Teams bei der Auswahl achten</h2>
            <ul className="list-disc space-y-2.5 pl-5 text-sm leading-6 text-ink-soft">
              <li><strong className="text-ink">Erste 3 Sekunden:</strong> Schafft es der Creator im Portfolio, sofort Aufmerksamkeit ohne gekünstelten Werbeton aufzubauen?</li>
              <li><strong className="text-ink">Zielgruppen-Passung:</strong> Alter, Wohnumgebung und Sprache sollten zur echten Käufergruppe passen – nicht zu generischen Hochglanz-Stockclips.</li>
              <li><strong className="text-ink">Klare Rechte &amp; Hooks:</strong> Frage immer direkt nach 2–3 Hook-Varianten pro Video und bezifferten Paid-Ads-Nutzungsrechten.</li>
            </ul>
          </div>
          <div className="surface-card rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold text-ink mb-4">Direkt starten mit kostenlosen Brand-Tools</h2>
              <p className="text-sm leading-6 text-ink-soft mb-5">
                Bevor du Creator anschreibst, kannst du Budget und Nutzungsrechte in zwei Minuten sauber vorbereiten – das beschleunigt Angebote spürbar.
              </p>
            </div>
            <div className="space-y-2.5">
              <Link href="/brands/ugc-kosten-rechner" className="flex items-center justify-between rounded-xl border border-hairline bg-white px-4 py-3 text-sm font-semibold text-geo-violet hover:border-geo-violet">
                <span>UGC Kosten &amp; Nutzungsrechte kalkulieren</span>
                <span>→</span>
              </Link>
              <Link href="/brands/ugc-vertrag-vorlage" className="flex items-center justify-between rounded-xl border border-hairline bg-white px-4 py-3 text-sm font-semibold text-geo-violet hover:border-geo-violet">
                <span>Vertrags-Vorlage &amp; Anfrage-Text generieren</span>
                <span>→</span>
              </Link>
              <Link href="/vergleich" className="flex items-center justify-between rounded-xl border border-hairline bg-white px-4 py-3 text-sm font-semibold text-ink hover:border-geo-violet">
                <span>UGC-Plattformen sachlich vergleichen</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Branchen */}
        <section className="py-10" aria-labelledby="branchen-heading">
          <h2 id="branchen-heading" className="text-2xl font-bold mb-6">UGC Creator nach Branche finden</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {NICHE_INDEX.map((niche) => (
              <Link key={niche.slug} href={nichePath(niche)} className="surface-card rounded-2xl p-5 hover:border-geo-violet transition-colors">
                <h3 className="font-bold text-geo-violet mb-1">{niche.chip}</h3>
                <p className="text-ink-soft text-sm">Creator, echte Preis-Mediane und Kampagnen-Ideen ansehen.</p>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-10 max-w-3xl">
          <h2 className="text-2xl font-bold mb-5 text-ink">Häufige Fragen zur Creator-Suche</h2>
          <div className="space-y-3">
            {faqs.map((item) => (
              <details key={item.question} className="surface-card rounded-2xl p-5">
                <summary className="cursor-pointer font-semibold text-ink">{item.question}</summary>
                <p className="mt-3 text-sm leading-6 text-ink-soft">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

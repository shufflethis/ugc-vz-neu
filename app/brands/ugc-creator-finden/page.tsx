import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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
  title: 'UGC Creator finden: DACH-Pool-Vorschau für Marken',
  description: `Durchsuche ${CREATOR_COUNT_LABEL} echte Creator-Profile in 20 Kategorien nach Arbeitsproben, Stil und Thema. Kampagnen-Briefings und Zusammenarbeit laufen gesammelt über dein kostenloses Marken-Konto.`,
});

const faqs = [
  {
    question: 'Wie finde ich schnell passende UGC Creator für mein Produkt?',
    answer:
      'Beschreibe oben kurz Produkt, Zielgruppe und Plattform wie TikTok, Instagram Reels oder YouTube Shorts. Die Suche filtert in 20 Kategorien nach echten Profilen und Arbeitsproben.',
  },
  {
    question: 'Warum brauche ich für Kontakt und Kampagnen ein Marken-Konto?',
    answer:
      'Die Pool-Vorschau ist ohne Login nutzbar. Für Kampagnen-Briefings, Einladungen und geprüfte Abrechnungen schützt das kostenlose Marken-Konto Creator vor Spam und bündelt alle Beiträge an einem Ort.',
  },
  {
    question: 'Worauf sollte ich beim Prüfen eines Creator-Profils achten?',
    answer:
      'Schau zuerst in die Arbeitsproben: Spricht der Creator natürlich vor der Kamera, passen Licht und Ton und greifen die ersten drei Sekunden? Danach prüfst du Themenkategorie und Stil.',
  },
  {
    question: 'Wie funktioniert die Abrechnung bei View-Kampagnen?',
    answer:
      'Du legst Preis pro 1.000 geprüfte Views und deine feste Budget-Obergrenze selbst fest. Im Kampagnenbudget sind regulär 15 % Servicegebühr enthalten, Creator zahlen 0 %.',
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
    name: 'UGC Creator Pool-Vorschau',
    description: `Creator-Suche in 20 Kategorien für Marken in Deutschland, Österreich und der Schweiz (${CREATOR_COUNT_LABEL} Profile).`,
    provider: { '@type': 'Organization', '@id': 'https://ugc-vz.de/#organization' },
    areaServed: ['DE', 'AT', 'CH'],
  };

  return (
    <div className="min-h-screen bg-white text-[#202124]">
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://ugc-vz.de' },
          { name: 'Für Marken', url: 'https://ugc-vz.de/brands' },
          { name: 'Creator-Pool', url: 'https://ugc-vz.de/brands/ugc-creator-finden' },
        ]}
      />
      <JsonLdScript data={serviceSchema} />
      <FAQSchema faqItems={faqs} />

      {/* Header & Suchbereich */}
      <section className="bg-[#F5F7FA] px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-[1200px]">
          <Link href="/brands" className="text-sm font-medium text-[#5C6470] hover:text-[#202124]">
            ← Zurück zu Für Marken
          </Link>

          <div className="mt-6 max-w-3xl">
            <p className="inline-flex flex-wrap items-center gap-2 rounded-full border border-[#DCE2EA] bg-white px-3.5 py-1 text-xs font-semibold text-[#202124]">
              <span>{poolCount > 0 ? `${poolCount} aktive Profile` : `${CREATOR_COUNT_LABEL} Profile`}</span>
              {medianPrice ? <span>· Richtwert-Median {medianPrice.toLocaleString('de-DE')} €</span> : null}
              <span>· Pool-Vorschau</span>
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-[-0.02em] sm:text-5xl">
              UGC Creator im DACH-Pool finden
            </h1>
            <p className="mt-4 text-base leading-7 text-[#5C6470] sm:text-lg">
              Durchsuche echte Profile nach Branche, Stil und Arbeitsproben. Für Kampagnen-Briefings, Einladungen und direkte Zusammenarbeit startest du danach in einer Minute im kostenlosen Marken-Konto.
            </p>
          </div>

          <div className="mt-8 rounded-[24px] border border-[#DCE2EA] bg-white p-4 shadow-card sm:p-8">
            <SearchBox
              initialQuery="UGC Creator für Produktvideos auf TikTok und Instagram Reels"
              showFeatured
              hideNicheChips
            />
          </div>
        </div>
      </section>

      {/* 4 Schritte */}
      <section className="bg-white px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="font-display text-2xl font-bold tracking-[-0.02em] sm:text-3xl">
            Vom ersten Treffer zur laufenden Kampagne
          </h2>
          <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              ['1. Bedarf beschreiben', 'Nenne Produkt, Zielgruppe und Format wie TikTok, Instagram Reel, Unboxing oder Produktdemo.'],
              ['2. Profile & Proben prüfen', 'Filtere nach 20 Kategorien, Plattform und Stil. Öffne Arbeitsproben direkt im Profil.'],
              ['3. Marken-Konto öffnen', 'Lege dein kostenloses Konto per 6-stelligem Code an und speichere dein Kampagnen-Briefing.'],
              ['4. Nach Views oder Paket starten', 'Lade Favoriten ein oder öffne deine View-Kampagne mit fester Budget-Obergrenze.'],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-[20px] border border-[#DCE2EA] bg-[#F5F7FA] p-6">
                <h3 className="font-display text-lg font-bold text-[#202124]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5C6470]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Qualitaetscheck & Brand Tools */}
      <section className="bg-[#F5F7FA] px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-6 md:grid-cols-2">
          <div className="rounded-[20px] border border-[#DCE2EA] bg-white p-6 shadow-card sm:p-8">
            <h2 className="font-display text-2xl font-bold text-[#202124]">
              Worauf Performance-Teams achten
            </h2>
            <ul className="mt-4 list-disc space-y-2.5 pl-5 text-sm leading-6 text-[#5C6470]">
              <li>
                <strong className="text-[#202124]">Erste 3 Sekunden:</strong> Baut der Creator im Portfolio sofort Aufmerksamkeit ohne gekünstelten Werbeton auf?
              </li>
              <li>
                <strong className="text-[#202124]">Zielgruppen-Passung:</strong> Passen Alltag, Umgebung und Sprache zur echten Käufergruppe deines Produkts?
              </li>
              <li>
                <strong className="text-[#202124]">Klare Rechte und Hooks:</strong> Halte gewünschte Hook-Varianten und Nutzungsrechte direkt im Brief fest.
              </li>
            </ul>
          </div>

          <div className="flex flex-col justify-between rounded-[20px] border border-[#DCE2EA] bg-white p-6 shadow-card sm:p-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#202124]">
                Nächste Schritte für Marken
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#5C6470]">
                Kalkuliere dein Budget, prüfe transparente Konditionen oder starte direkt mit deiner ersten Kampagne.
              </p>
            </div>
            <div className="mt-5 space-y-2.5">
              {[
                { href: '/brand?tab=signup', label: 'Kampagne im Marken-Konto starten' },
                { href: '/preise', label: 'Preise & Servicegebühr ansehen' },
                { href: '/brands/ugc-kosten-rechner', label: 'UGC Kosten & Nutzungsrechte kalkulieren' },
                { href: '/brands/ugc-vertrag-vorlage', label: 'Vertragsvorlage erstellen' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-[46px] items-center justify-between rounded-xl border border-[#DCE2EA] bg-[#F5F7FA] px-4 text-sm font-semibold text-[#202124] transition-colors hover:border-[#06458F]"
                >
                  <span>{link.label}</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Branchen: einmalige kompakte Chip-Leiste */}
      <section aria-labelledby="branchen-heading" className="bg-white px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="branchen-heading" className="font-display text-2xl font-bold text-[#202124]">
              Beliebte Branchen
            </h2>
            <Link href="/alle-seiten#branchen" className="text-sm font-semibold text-[#202124] hover:text-[#06458F]">
              Alle Branchen ansehen →
            </Link>
          </div>
          <ul className="mt-5 flex gap-2.5 overflow-x-auto pb-2 [scrollbar-width:thin]">
            {NICHE_INDEX.map((niche) => (
              <li key={niche.slug} className="shrink-0">
                <Link
                  href={nichePath(niche)}
                  className="inline-flex min-h-[44px] items-center rounded-full border border-[#DCE2EA] bg-[#F5F7FA] px-4 text-sm font-medium text-[#202124] hover:border-[#06458F]"
                >
                  {niche.chip}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white px-5 pb-20 pt-6 sm:px-8">
        <div className="mx-auto max-w-[720px]">
          <h2 className="font-display text-2xl font-bold text-[#202124] sm:text-3xl">
            Häufige Fragen zur Creator-Suche
          </h2>
          <div className="mt-6 space-y-3">
            {faqs.map((item, idx) => (
              <details
                key={item.question}
                open={idx === 0}
                className="group rounded-[20px] border border-[#DCE2EA] bg-white px-5"
              >
                <summary className="flex min-h-[58px] cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold text-[#202124] [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <span className="shrink-0 text-xl text-[#5C6470] transition-transform group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="pb-4 text-sm leading-6 text-[#5C6470]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

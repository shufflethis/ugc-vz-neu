import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMetadata } from '@/utils/seo-metadata';
import BreadcrumbSchema from '../../components/BreadcrumbSchema';
import FAQSchema from '../../components/FAQSchema';
import { CREATOR_COUNT_LABEL } from '@/app/lib/creator-count';
import { loadNicheRows, nicheStats } from '@/app/lib/niche-data';

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  path: '/creator/ugc-creator-jobs',
  title: 'UGC Creator Jobs & Aufträge in Deutschland',
  description: `UGC Creator Jobs finden ohne Plattform-Provision: Wie Marken im DACH-Raum Creator auswählen, welche Profilangaben Anfragen bringen und wie du dich kostenlos bei UGC VZ einträgst.`,
});

const faqs = [
  {
    question: 'Wie kommen UGC Creator Jobs über UGC VZ zustande?',
    answer:
      'Auf zwei Wegen, beide mit 0 % Gebühr für Creator: Entweder bewirbst du dich im Creator-Konto auf offene View-Kampagnen mit festem TKP und automatischer Abrechnung, oder Marken entdecken dein Profil in der Suche und fragen dich direkt für einzelne Produktvideos an.',
  },
  {
    question: 'Garantiert ein Eintrag bei UGC VZ feste Aufträge?',
    answer:
      'Nein – kein seriöses Verzeichnis kann Aufträge garantieren. Die Chancen steigen aber deutlich, wenn du öffentlich abrufbare Arbeitsproben, eine klare Preisvorstellung, realistische Themen und eine erreichbare E-Mail-Adresse hinterlegst.',
  },
  {
    question: 'Welche Branchen fragen aktuell am häufigsten UGC-Videos an?',
    answer:
      'Besonders regelmäßig gesucht werden Creator für Beauty & Skincare, Food & Supplements, Apps & SaaS, Mode, Home & Interior, Familie sowie Haustierprodukte.',
  },
];

export default async function UGCCreatorJobsPage() {
  let withPortfolioPct = 0;
  let reachablePct = 0;
  try {
    const stats = nicheStats(await loadNicheRows());
    if (stats.count > 0) {
      withPortfolioPct = Math.round((stats.withPortfolio / stats.count) * 100);
      reachablePct = Math.round((stats.reachable / stats.count) * 100);
    }
  } catch {
    withPortfolioPct = 0;
  }

  return (
    <div className="min-h-screen bg-white text-ink px-4 sm:px-8 md:px-16 lg:px-24 py-14">
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://ugc-vz.de' },
          { name: 'Für Creator', url: 'https://ugc-vz.de/creator' },
          { name: 'UGC Creator Jobs', url: 'https://ugc-vz.de/creator/ugc-creator-jobs' },
        ]}
      />
      <FAQSchema faqItems={faqs} />

      <div className="max-w-5xl mx-auto">
        <Link href="/creator" className="text-sm text-ink-soft hover:text-ink">
          ← UGC VZ für Creator
        </Link>

        <section className="py-10 sm:py-14">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#dce9d1] bg-[#edf5e5] px-3 py-1.5 text-xs font-semibold text-[#385523]">
            Direktkontakt mit Brands · 0 % Provision · {CREATOR_COUNT_LABEL} Profile
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-ink">UGC Creator Jobs &amp; Aufträge in Deutschland</h1>
          <p className="text-lg sm:text-xl text-ink-soft max-w-3xl leading-relaxed mb-8">
            Bezahlte UGC-Aufträge entstehen fast immer aus konkreten Brand-Briefings: Produkt testen, authentisches Video für Ads oder Produktseiten drehen, Nutzungsrechte sauber vereinbaren. Je prüfbarer dein Profil ist, desto schneller wirst du in die engere Auswahl genommen.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/creator#creator-form" className="inline-flex min-h-[48px] items-center bg-geo-violet hover:bg-[#7531ae] text-white font-semibold py-3 px-6 rounded-full">
              Kostenloses Creator-Profil eintragen →
            </Link>
            <Link href="/konto" className="inline-flex min-h-[48px] items-center border border-hairline bg-white hover:border-geo-violet text-ink font-semibold py-3 px-6 rounded-full">
              Bestehendes Profil aktualisieren
            </Link>
          </div>
        </section>

        <section className="mb-12 grid gap-6 md:grid-cols-2">
          <div className="surface-card rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-geo-violet mb-4">Was dein Profil für Brands sofort buchbar macht</h2>
            <ul className="list-disc space-y-2.5 pl-5 text-sm leading-6 text-ink-soft">
              <li><strong className="text-ink">Direkt abrufbare Arbeitsproben:</strong> Verlinke ein Portfolio ohne Login-Hürde statt nur deinen Instagram-Account.</li>
              <li><strong className="text-ink">Konkrete Themen &amp; Alltagssituationen:</strong> Nenne 2–4 Schwerpunkte (z. B. Hautpflege, Kochen, Hund, Tech-Apps) statt „alles“.</li>
              <li><strong className="text-ink">Transparente Preisvorstellung:</strong> Brands filtern nach Budget – eine klare Einstiegsspanne (z. B. „ab 200 € / Video“) bringt deutlich mehr seriöse Anfragen.</li>
              <li><strong className="text-ink">E-Mail-Erreichbarkeit aktivieren:</strong> Profile mit bestätigter E-Mail und aktivierten Projektbenachrichtigungen erscheinen in der Suche priorisiert.</li>
            </ul>
          </div>

          <div className="surface-card rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold text-ink mb-4">Typische Auftragsformen im DACH-Raum</h2>
              <ul className="space-y-3 text-sm leading-6 text-ink-soft">
                <li><strong className="text-ink">Einzelvideos &amp; Paid-Ad-Pakete:</strong> 1–5 Videos mit zusätzlichen Hooks für Meta Ads &amp; TikTok Ads.</li>
                <li><strong className="text-ink">Retainer-Kooperationen:</strong> Wiederkehrende monatliche Lieferungen (z. B. 4 Videos/Monat) mit festen Stamm-Brands.</li>
                <li><strong className="text-ink">Vertrag &amp; Rechte:</strong> Nutze bei Direkt-Deals eine klare schriftliche Vereinbarung zu Laufzeit, Kanälen und Zahlungsziel.</li>
              </ul>
              {withPortfolioPct > 0 && (
                <p className="mt-4 rounded-xl bg-surface p-3 text-xs text-ink-soft">
                  Im aktuellen Verzeichnis haben <strong className="text-ink">{withPortfolioPct} %</strong> der Profile Portfolio-Links hinterlegt und{' '}
                  <strong className="text-ink">{reachablePct} %</strong> sind direkt per E-Mail erreichbar.
                </p>
              )}
            </div>
            <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold">
              <Link href="/brands/ugc-vertrag-vorlage" className="text-geo-violet underline hover:no-underline">
                Kostenlose Vertrags-Vorlage →
              </Link>
              <Link href="/wissen/ugc-creator-pitches-wie-sie-marken-ueberzeugen" className="text-geo-violet underline hover:no-underline">
                Pitch-Guide für Creator →
              </Link>
              <Link href="/wissen/ugc-creator-jobs-wo-auftraege-wirklich-herkommen-und-wo-nicht" className="text-geo-violet underline hover:no-underline">
                Wo Aufträge wirklich herkommen →
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-3xl space-y-3">
          <h2 className="text-2xl font-bold text-ink mb-4">Häufige Fragen zu UGC Jobs</h2>
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

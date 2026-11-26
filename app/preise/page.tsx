import type { Metadata } from 'next';
import Link from 'next/link';
import BreadcrumbSchema from '@/app/components/BreadcrumbSchema';
import ViewBudgetCalculator from '@/app/components/ViewBudgetCalculator';
import JsonLdScript from '@/app/wissen/[slug]/JsonLdScript';
import { getActivePromo } from '@/app/lib/platform-pricing';
import { pageMetadata } from '@/utils/seo-metadata';

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  path: '/preise',
  title: 'Preise: Was kostet UGC VZ?',
  description:
    '15 % Servicegebühr, schon in deinem Budget enthalten. Kein Abo, keine Einrichtungsgebühr, feste Budget-Obergrenze. Creator zahlen 0 %.',
});

const PRICING_FAQS = [
  {
    q: 'Wofür ist die Servicegebühr?',
    a: 'Für die Prüfung jedes Beitrags, die Zahlungsabwicklung, Gutschriften für Creator und deinen Report. Sie ist im Budget enthalten.',
  },
  {
    q: 'Kostet mich UGC VZ als Creator etwas?',
    a: 'Nein. Du bekommst den vollen Satz pro 1.000 Views, den du vor der Teilnahme siehst. Die Plattform bezahlt die Marke.',
  },
  {
    q: 'Gibt es ein Abo oder eine Mindestlaufzeit?',
    a: 'Nein. Dein Konto ist kostenlos, es gibt kein monatliches Abo und keine Einrichtungsgebühr. Du zahlst nur dein Kampagnenbudget.',
  },
  {
    q: 'Kann ich mehr ausgeben als meine Budget-Obergrenze?',
    a: 'Nein. Jede View-Kampagne hat eine feste Budget-Obergrenze. Summe aus Creator-Auszahlungen und Servicegebühr liegt nie darüber.',
  },
];

export default function PreisePage() {
  const promo = getActivePromo(new Date());

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PRICING_FAQS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#202124]">
      <BreadcrumbSchema
        items={[
          { name: 'Startseite', url: 'https://ugc-vz.de' },
          { name: 'Preise', url: 'https://ugc-vz.de/preise' },
        ]}
      />
      <JsonLdScript data={faqSchema} />

      <div className="mx-auto max-w-5xl px-4 pb-24 pt-14 sm:px-8 sm:pt-20">
        <section className="max-w-3xl">
          <p className="text-sm font-medium text-[#5C6470]">Transparente Preise ohne Abo</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight tracking-tight text-[#202124] sm:text-6xl">
            Was kostet UGC VZ?
          </h1>
          <p className="mt-5 text-lg leading-7 text-[#5C6470]">
            15 % Servicegebühr. Schon in deinem Budget drin. Kein Abo, keine Einrichtungsgebühr.
          </p>
          {promo.active && (
            <div className="mt-5 inline-flex flex-wrap items-center gap-2 rounded-2xl border border-[#06458F]/15 bg-[#EBF2FA] px-4 py-2.5 text-sm font-semibold text-[#202124]">
              <span>
                Black Friday bis Cyber Monday: 10 % statt regulär 15 % Servicegebühr. Gilt für Buchungen und Aufladungen bis Mo 30.11.2026, 23:59 Uhr.
              </span>
            </div>
          )}
        </section>

        {/* Einfache Preistabelle */}
        <section className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="rounded-[20px] border border-[#DCE2EA] bg-white p-6 shadow-[0_1px_2px_rgba(18,18,18,.06),0_8px_24px_rgba(18,18,18,.06)] sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight text-[#202124]">Für Marken</h2>
            <dl className="mt-6 divide-y divide-[#DCE2EA]">
              {[
                {
                  t: 'Konto',
                  v: 'Kostenlos, kein Abo',
                },
                {
                  t: 'View-Kampagne',
                  v: 'Dein Preis pro 1.000 geprüfte Views, höchstens dein Budget',
                },
                {
                  t: 'Servicegebühr',
                  v: promo.active
                    ? 'Aktionssatz 10 % bis Mo 30.11., 23:59 Uhr (regulär 15 % fest, schon im Budget enthalten)'
                    : '15 % fest, schon in deinem Budget enthalten',
                },
                {
                  t: 'Creator-Produktion',
                  v: 'Preis direkt mit dem Creator, Richtwerte im Rechner',
                },
              ].map((row) => (
                <div key={row.t} className="grid gap-1 py-4 sm:grid-cols-[180px_1fr] sm:gap-4">
                  <dt className="text-sm font-semibold text-[#202124]">{row.t}</dt>
                  <dd className="text-sm leading-6 text-[#5C6470]">{row.v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/brand?tab=signup"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#06458F] px-6 text-sm font-semibold text-white hover:bg-[#053673] transition-opacity hover:opacity-90"
              >
                Kampagne starten
              </Link>
              <Link
                href="/brands"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[#DCE2EA] bg-white px-5 text-sm font-semibold text-[#202124] transition-colors hover:border-[#06458F]"
              >
                So läuft eine Kampagne
              </Link>
            </div>
          </div>

          {/* Creator-Box */}
          <div className="rounded-[20px] bg-[#062A59] p-6 text-[#F5F7FA] sm:p-8">
            <p className="text-sm font-medium text-[#F2072A]">Für Creator</p>
            <p className="mt-3 font-mono text-5xl font-bold tabular-nums text-[#F2072A]">0 %</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Der Satz gehört dir. Wir ziehen nichts ab.</h2>
            <p className="mt-3 text-sm leading-6 text-[#F5F7FA]/80">
              Anmeldung und Teilnahme sind für Creator kostenlos. Wenn bei einer Kampagne 2,00 € pro 1.000 Views stehen, kommen genau 2,00 € bei dir an.
            </p>
            <div className="mt-6">
              <Link
                href="/creator"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#EBF2FA] px-5 text-sm font-bold text-[#202124] transition-opacity hover:opacity-90"
              >
                Kostenlos mitmachen
              </Link>
            </div>
          </div>
        </section>

        {/* Budget-Rechner */}
        <section id="rechner" className="mt-14">
          <ViewBudgetCalculator initialPromo={promo} />
        </section>

        {/* FAQ */}
        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-[#202124] sm:text-3xl">Häufige Fragen zu den Preisen</h2>
          <div className="mt-6 space-y-3">
            {PRICING_FAQS.map((item) => (
              <details
                key={item.q}
                className="rounded-2xl border border-[#DCE2EA] bg-white p-5"
              >
                <summary className="cursor-pointer list-none text-base font-semibold text-[#202124] [&::-webkit-details-marker]:hidden">
                  {item.q}
                </summary>
                <p className="mt-2.5 text-sm leading-6 text-[#5C6470]">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Weitere Rechner- & Marktpreis-Links */}
        <section className="mt-14 rounded-[20px] border border-[#DCE2EA] bg-white p-6 sm:p-8">
          <h2 className="text-lg font-bold text-[#202124]">Weiterführende Preisinfos</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/brands/ugc-kosten-rechner"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-[#DCE2EA] px-4 text-sm font-semibold text-[#202124] transition-colors hover:border-[#06458F]"
            >
              UGC-Kostenrechner
            </Link>
            <Link
              href="/brands/ugc-creator-preise"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-[#DCE2EA] px-4 text-sm font-semibold text-[#202124] transition-colors hover:border-[#06458F]"
            >
              Creator-Preise in Deutschland
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

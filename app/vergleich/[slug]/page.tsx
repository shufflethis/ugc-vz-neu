import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BreadcrumbSchema from '../../components/BreadcrumbSchema';
import JsonLdScript from '../../wissen/[slug]/JsonLdScript';
import ComparisonTable from '../../components/ComparisonTable';
import MethodikNote from '../../components/MethodikNote';
import { SUFFIX, VERIFIED_AT_LABEL, getCompetitor, getOwn, getPageCompetitors } from '../../lib/competitors';
import { getPageCopy } from '../../lib/vergleich-copy';

export const dynamicParams = false;

function competitorFromParam(slug: string) {
  if (!slug.endsWith(SUFFIX)) return undefined;
  const c = getCompetitor(slug.slice(0, -SUFFIX.length));
  return c?.hasOwnPage ? c : undefined;
}

export function generateStaticParams() {
  return getPageCompetitors().map((c) => ({ slug: `${c.slug}${SUFFIX}` }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = competitorFromParam(params.slug);
  if (!c) return { title: 'Vergleich nicht gefunden', robots: { index: false, follow: false } };
  const url = `https://ugc-vz.de/vergleich/${params.slug}`;
  const title = `${c.name} Alternative: UGC Creator direkt finden`;
  const description = `${c.name}: ${c.model}, Creator-Pool: ${c.creatorCount.value}. UGC VZ ist ein kostenloses Verzeichnis mit Direktkontakt statt Plattform-Abwicklung. Alle Angaben mit Quelle, Stand ${VERIFIED_AT_LABEL}.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'UGC VZ', locale: 'de_DE', type: 'article' },
  };
}

export default function VergleichDetailPage({ params }: { params: { slug: string } }) {
  const c = competitorFromParam(params.slug);
  if (!c) notFound();
  const own = getOwn();
  const others = getPageCompetitors().filter((x) => x.slug !== c.slug);
  const copy = getPageCopy(c, own);

  const breadcrumbs = [
    { name: 'Startseite', url: 'https://ugc-vz.de' },
    { name: 'Vergleich', url: 'https://ugc-vz.de/vergleich' },
    { name: `${c.name} Alternative`, url: `https://ugc-vz.de/vergleich/${params.slug}` },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-white text-ink">
      <BreadcrumbSchema items={breadcrumbs} />
      <JsonLdScript data={faqSchema} />

      <main className="py-12 px-4 sm:px-8 md:px-16 lg:px-24">
        <section className="max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-ink">
            {c.name} Alternative: <span className="gradient-text">UGC Creator direkt finden</span>
          </h1>
          <p className="text-lg text-ink-soft">
            {c.name} ist ein {c.model}: Die Abwicklung läuft über die Plattform. UGC VZ ist ein kostenloses Verzeichnis —
            du bekommst die Kontaktdaten der Creator und verhandelst direkt, ohne Plattformgebühr. Welche Variante besser
            passt, hängt davon ab, wie viel Abwicklung du abgeben willst.
          </p>
        </section>

        <section className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-6 text-ink">{c.name} und UGC VZ im Vergleich</h2>
          <ComparisonTable rows={[own, c]} highlightSlug={c.slug} />
        </section>

        <section className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4 text-ink">Wann {c.name} die bessere Wahl ist</h2>
          <p className="text-ink-soft mb-4">{c.bestFor}</p>
          <ul className="text-ink-soft space-y-2 list-disc list-inside">
            {c.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>

        <section className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4 text-ink">Wann UGC VZ besser passt</h2>
          <p className="text-ink-soft mb-4">{own.bestFor}</p>
          <ul className="text-ink-soft space-y-2 list-disc list-inside">
            {own.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className="text-sm text-ink-soft/80 mt-4">
            Fairerweise: Der Creator-Pool von {c.name} ist deutlich größer als unser kuratiertes Verzeichnis, und wir
            übernehmen weder Verträge noch Zahlungsabwicklung. Wer das braucht, ist bei {c.name} besser aufgehoben.
          </p>
        </section>

        <section className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4 text-ink">Preisstruktur im Detail</h2>
          <div className="space-y-4 text-ink-soft">
            {copy.pricingDetail.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="text-xs text-ink-soft/70 mt-4">
            Quelle für die Preisangabe zu {c.name}:{' '}
            <a
              href={c.pricing.source}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="underline hover:text-geo-violet"
            >
              {c.pricing.source}
            </a>
            , geprüft am {VERIFIED_AT_LABEL}.
          </p>
        </section>

        <section className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4 text-ink">Direktkontakt oder Abwicklung über die Plattform</h2>
          <div className="space-y-4 text-ink-soft">
            {copy.handling.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4 text-ink">Was du vor der Buchung klären solltest</h2>
          <p className="text-ink-soft mb-4">{copy.questionsIntro}</p>
          <ul className="text-ink-soft space-y-2 list-disc list-inside">
            {copy.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </section>

        <section className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4 text-ink">Wofür UGC VZ nicht die richtige Wahl ist</h2>
          <div className="space-y-4 text-ink-soft">
            {copy.notFor.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4 text-ink">Fazit</h2>
          <div className="space-y-4 text-ink-soft">
            {copy.conclusion.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-6 text-ink">Häufige Fragen</h2>
          <div className="space-y-6">
            {c.faqs.map((f) => (
              <div key={f.question}>
                <h3 className="text-lg font-semibold text-ink mb-2">{f.question}</h3>
                <p className="text-ink-soft">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto mb-16 text-center">
          <Link
            href="/brands"
            className="inline-block px-8 py-4 rounded-full bg-geo-violet text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Creator kostenlos finden
          </Link>
        </section>

        <section className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-ink">Weitere Vergleiche</h2>
          <ul className="space-y-2">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/vergleich/${o.slug}${SUFFIX}`} className="underline hover:text-geo-violet">
                  {o.name} Alternative
                </Link>
              </li>
            ))}
            <li>
              <Link href="/vergleich" className="underline hover:text-geo-violet">
                Alle UGC-Plattformen im Überblick
              </Link>
            </li>
          </ul>
        </section>

        <MethodikNote className="max-w-3xl mx-auto mt-12" />
      </main>
    </div>
  );
}

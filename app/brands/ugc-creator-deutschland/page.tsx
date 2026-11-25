import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMetadata } from '@/utils/seo-metadata';
import SearchBox from '../../components/SearchBox';
import BreadcrumbSchema from '../../components/BreadcrumbSchema';
import FAQSchema from '../../components/FAQSchema';
import JsonLdScript from '../../wissen/[slug]/JsonLdScript';
import { CREATOR_COUNT_LABEL } from '@/app/lib/creator-count';
import { NICHE_INDEX, nichePath } from '@/app/lib/niche-index';
import { humanizeCreatorText } from '@/app/lib/creator-public';
import { loadNicheRows, nicheStats, topCreators, type NicheRow } from '@/app/lib/niche-data';

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  path: '/brands/ugc-creator-deutschland',
  title: 'UGC Creator Deutschland finden – kostenlos & direkt',
  description: `Über ${CREATOR_COUNT_LABEL} echte UGC Creator in Deutschland & DACH: Profile mit Portfolio und Preisvorstellung vergleichen, Kontaktdaten kostenlos anfragen – 0 % Provision.`,
});

const euro = (value: number) => `${value.toLocaleString('de-DE')} €`;
const clip = (value: string, max: number) => (value.length > max ? `${value.slice(0, max).trimEnd()}…` : value);

function CreatorPreviewCard({ row }: { row: NicheRow }) {
  const firstName = (row.display_name || 'Creator').split(' ')[0];
  const topics = clip((row.topics || '').replace(/\s+/g, ' '), 85);
  const price = clip(humanizeCreatorText(row.rate_text).replace(/\s+/g, ' '), 95);
  return (
    <li className="surface-card rounded-2xl p-5 flex flex-col">
      <div className="flex items-center gap-3">
        {row.has_social_avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/avatar/${row.public_id}`}
            alt={`Profilbild von ${firstName}`}
            width={52}
            height={52}
            loading="lazy"
            className="h-13 w-13 rounded-full object-cover"
          />
        ) : (
          <div aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-geo-violet/10 text-base font-bold text-geo-violet">
            {firstName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-bold text-ink truncate">{firstName}</h3>
          <p className="text-xs text-ink-soft truncate">{[row.city, (row.networks || []).join(', ')].filter(Boolean).join(' · ')}</p>
        </div>
      </div>
      {topics && <p className="mt-3 text-sm text-ink-soft line-clamp-2">{topics}</p>}
      {price && (
        <p className="mt-2 text-sm">
          <span className="font-semibold text-ink">Preisvorstellung:</span> {price}
        </p>
      )}
      <p className="mt-auto pt-3 flex items-center justify-between text-xs">
        <span className="text-ink-soft">{row.contact_reachable ? '✉ Per E-Mail erreichbar' : 'Kontakt über Social Media'}</span>
        <Link href={`/auswahl?ids=${row.public_id}`} rel="nofollow" className="font-semibold text-geo-violet underline">
          Profil ansehen
        </Link>
      </p>
    </li>
  );
}

const CITY_LINKS = [
  { href: '/brands/ugc-agentur-berlin', label: 'Berlin', query: 'UGC Creator Berlin' },
  { href: '/brands/ugc-agentur-hamburg', label: 'Hamburg', query: 'UGC Creator Hamburg' },
  { href: '/brands/ugc-agentur-muenchen', label: 'München', query: 'UGC Creator München' },
  { href: '/brands#q=' + encodeURIComponent('UGC Creator Köln oder NRW für Produktvideos'), label: 'Köln & NRW', query: 'UGC Creator Köln' },
  { href: '/brands#q=' + encodeURIComponent('UGC Creator Frankfurt oder Rhein-Main für Produktvideos'), label: 'Frankfurt', query: 'UGC Creator Frankfurt' },
  { href: '/brands#q=' + encodeURIComponent('UGC Creator Stuttgart oder Süddeutschland für Produktvideos'), label: 'Stuttgart', query: 'UGC Creator Stuttgart' },
  { href: '/brands#q=' + encodeURIComponent('UGC Creator Österreich deutschsprachig für Produktvideos'), label: 'Österreich (AT)', query: 'UGC Creator Österreich' },
  { href: '/brands#q=' + encodeURIComponent('UGC Creator Schweiz deutschsprachig für Produktvideos'), label: 'Schweiz (CH)', query: 'UGC Creator Schweiz' },
];

export default async function UGCCreatorDeutschlandPage() {
  let rows: NicheRow[] = [];
  try {
    rows = await loadNicheRows();
  } catch {
    rows = [];
  }
  const stats = nicheStats(rows);
  const featured = topCreators(rows, 8);
  const share = (count: number) => (stats.count ? Math.round((count / stats.count) * 100) : 0);

  const priceSummary = stats.price
    ? `Aus ${stats.price.n} Profilen mit Preisangabe im UGC-VZ-Verzeichnis liegt der Einstieg pro Video meist zwischen ${euro(stats.price.p25)} und ${euro(stats.price.p75)} (Median ${euro(stats.price.median)}). Umfangreichere Pakete mit Paid-Ads-Nutzungsrechten, Zusatz-Hooks oder Rohmaterial liegen darüber.`
    : 'Die Einstiegspreise deutscher UGC Creator liegen je nach Format, Länge und Nutzungsrechten typischerweise zwischen 150 und 2.500 € pro Video – im Social-Clip-Bereich oft im unteren bis mittleren dreistelligen Bereich.';

  const faqs = [
    {
      question: 'Was kosten UGC Creator in Deutschland?',
      answer: `${priceSummary} Im interaktiven UGC-Kosten-Rechner kannst du dein Projekt nach Format, Hooks und Paid-Ads-Rechten konkret durchkalkulieren.`,
    },
    {
      question: 'Worin unterscheidet sich UGC VZ von Festpreis-Plattformen wie Noovid oder Speekly?',
      answer:
        'Festpreis-Plattformen bündeln Briefing, Zahlung und Standard-Nutzungsrechte gegen feste Videopreise oder Plattformgebühren – der Kontakt bleibt dabei innerhalb der Plattform. UGC VZ ist ein kostenloses Verzeichnis: Du zahlst 0 € Gebühr und 0 % Provision, erhältst direkte Kontaktdaten und verhandelst Honorar, Hooks und Nutzungsrechte frei mit dem Creator.',
    },
    {
      question: 'Muss der Creator in derselben Stadt wie meine Brand sitzen?',
      answer:
        'Meist nicht. Über 90 % aller UGC-Produktionen im E-Commerce laufen remote: Du schickst ein Produktmuster per Post an den Creator, der das Video in seiner Alltagsumgebung dreht. Lokale Creator aus Berlin, Hamburg, München oder Köln sind vor allem für Vor-Ort-Drehs, Gastronomie, Retail und lokale Dienstleistungen wichtig.',
    },
    {
      question: 'Wie regle ich Nutzungsrechte und Vertrag bei deutschen UGC Creatorn?',
      answer:
        'Nach deutschem Urheberrecht (§ 31 UrhG) solltest du vor Drehbeginn schriftlich klären, für welche Kanäle (organisch vs. Paid Ads vs. Whitelisting), welche Laufzeit und welche Märkte die Freigabe gilt. Dafür kannst du direkt unseren kostenlosen Vertrags- und Briefing-Generator nutzen.',
    },
    {
      question: 'Kann ich Creator für deutschsprachige Kampagnen auch ohne Agentur buchen?',
      answer:
        'Ja. Suche, Profilprüfung und Kontaktanfrage über UGC VZ funktionieren ohne Agentur und ohne Brand-Login. Wenn du bei größeren Kampagnen Briefing, Koordination oder Paid-Social-Aussteuerung abgeben möchtest, ist Agentur-Support optional zubuchbar.',
    },
  ];

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'UGC Creator Verzeichnis Deutschland',
    description: `Kostenlose Suche nach geprüften deutschsprachigen UGC Creatorn in Deutschland und dem DACH-Raum (${CREATOR_COUNT_LABEL} Profile, 0 % Provision).`,
    provider: { '@type': 'Organization', '@id': 'https://ugc-vz.de/#organization' },
    areaServed: [
      { '@type': 'Country', name: 'Deutschland' },
      { '@type': 'Country', name: 'Österreich' },
      { '@type': 'Country', name: 'Schweiz' },
    ],
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  };

  return (
    <div className="min-h-screen bg-white text-ink px-4 sm:px-8 md:px-16 lg:px-24 py-14">
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://ugc-vz.de' },
          { name: 'Für Brands', url: 'https://ugc-vz.de/brands' },
          { name: 'UGC Creator Deutschland', url: 'https://ugc-vz.de/brands/ugc-creator-deutschland' },
        ]}
      />
      <JsonLdScript data={serviceSchema} />
      <FAQSchema faqItems={faqs} />

      <div className="max-w-5xl mx-auto">
        <Link href="/brands" className="text-sm text-ink-soft hover:text-ink">
          ← UGC VZ für Brands
        </Link>

        {/* Hero + direkte Suche */}
        <section className="py-10 sm:py-14 text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#dce9d1] bg-[#edf5e5] px-3 py-1.5 text-xs font-semibold text-[#385523]">
            {CREATOR_COUNT_LABEL} echte DACH-Profile · 0 € Gebühr · 0 % Provision
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-ink leading-tight">
            UGC Creator in <span className="gradient-text">Deutschland</span> finden
          </h1>
          <p className="text-lg sm:text-xl text-ink-soft max-w-3xl mx-auto mb-8 leading-relaxed">
            Finde authentische deutschsprachige UGC Creator für TikTok, Instagram Reels, YouTube Shorts und Meta Ads.
            Vergleiche echte Arbeitsproben und Preisvorstellungen direkt im Verzeichnis und erhalte die Kontaktdaten deiner Favoriten kostenlos per E-Mail – ohne Abo und ohne Agenturaufschlag.
          </p>
          {stats.count > 0 && (
            <ul className="mb-8 flex flex-wrap justify-center gap-2 text-xs font-semibold sm:text-sm">
              <li className="rounded-full border border-hairline bg-surface px-3.5 py-1.5 text-ink">{stats.count} aktive Profile im Verzeichnis</li>
              {stats.price && (
                <li className="rounded-full border border-hairline bg-surface px-3.5 py-1.5 text-ink">
                  Einstiegs-Median: {euro(stats.price.median)} / Video
                </li>
              )}
              <li className="rounded-full border border-hairline bg-surface px-3.5 py-1.5 text-ink">{share(stats.withPortfolio)} % mit Portfolio</li>
              <li className="rounded-full border border-hairline bg-surface px-3.5 py-1.5 text-ink">Ohne Brand-Login</li>
            </ul>
          )}
          <div className="rounded-3xl border border-hairline bg-white p-4 text-left shadow-[0_24px_70px_rgba(35,22,47,0.08)] sm:p-8">
            <SearchBox initialQuery="UGC Creator aus Deutschland für Produktvideos auf TikTok und Instagram Reels" />
          </div>
        </section>

        {/* Echte Creator-Auswahl aus dem Pool */}
        {featured.length > 0 && (
          <section className="py-10" aria-labelledby="de-creators-heading">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end mb-6">
              <div>
                <h2 id="de-creators-heading" className="text-2xl sm:text-3xl font-bold text-ink">
                  Einblick in deutsche UGC-Creator-Profile
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Per E-Mail erreichbare Profile mit hinterlegtem Portfolio zuerst. Für ein genaues Matching nutze die Suche oben.
                </p>
              </div>
              <Link href="/brands/ugc-kosten-rechner" className="text-sm font-semibold text-geo-violet underline hover:no-underline">
                Budget vorher kalkulieren →
              </Link>
            </div>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((row) => (
                <CreatorPreviewCard key={row.public_id} row={row} />
              ))}
            </ul>
          </section>
        )}

        {/* Echte Pool-Kennzahlen */}
        {stats.count > 0 && (
          <section className="py-10" aria-labelledby="de-data-heading">
            <h2 id="de-data-heading" className="text-2xl sm:text-3xl font-bold text-ink mb-4">
              Zahlen aus dem deutschen UGC-VZ-Verzeichnis
            </h2>
            <p className="text-ink-soft leading-7 max-w-3xl mb-6">
              Statt pauschaler Schätzungen zeigen diese Kennzahlen den aktuellen Stand der aktiven Profile im deutschsprachigen Verzeichnis (Selbstangaben der Creator).
            </p>
            <div className="overflow-x-auto rounded-2xl border border-hairline">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-hairline bg-surface">
                    <th className="px-4 py-3 font-semibold text-ink">Kennzahl</th>
                    <th className="px-4 py-3 font-semibold text-ink">Aktueller Wert im Verzeichnis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline text-ink-soft">
                  <tr>
                    <td className="px-4 py-3">Aktive deutschsprachige Creator-Profile</td>
                    <td className="px-4 py-3 font-semibold text-ink">{stats.count}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Profile mit verlinkten Arbeitsproben / Portfolio</td>
                    <td className="px-4 py-3">{share(stats.withPortfolio)} %</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Direkt per E-Mail erreichbare Creator</td>
                    <td className="px-4 py-3">{share(stats.reachable)} %</td>
                  </tr>
                  {stats.platforms.length > 0 && (
                    <tr>
                      <td className="px-4 py-3">Häufigste Plattformen</td>
                      <td className="px-4 py-3">
                        {stats.platforms.map((p) => `${p.name.charAt(0).toUpperCase()}${p.name.slice(1)} (${share(p.count)} %)`).join(', ')}
                      </td>
                    </tr>
                  )}
                  {stats.price && (
                    <>
                      <tr>
                        <td className="px-4 py-3">Einstiegspreis pro Video (mittlere 50 % der Profile)</td>
                        <td className="px-4 py-3 font-semibold text-ink">{euro(stats.price.p25)} bis {euro(stats.price.p75)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">Median-Einstiegspreis (Basis: n = {stats.price.n} Profile)</td>
                        <td className="px-4 py-3 font-semibold text-ink">{euro(stats.price.median)}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Direkter Vergleich: Direktverzeichnis vs. Festpreis-Plattform vs. Agentur */}
        <section className="py-10" aria-labelledby="de-compare-heading">
          <h2 id="de-compare-heading" className="text-2xl sm:text-3xl font-bold text-ink mb-4">
            UGC in Deutschland einkaufen: Verzeichnis, Festpreis-Plattform oder Agentur?
          </h2>
          <p className="text-ink-soft leading-7 max-w-3xl mb-6">
            Im deutschen Markt hast du drei grundlegende Wege, um UGC-Videos produzieren zu lassen. Welcher am besten passt, hängt vor allem davon ab, wie viel Kontrolle vs. Abwicklung dein Team braucht.
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border-2 border-geo-violet/30 bg-[#FBF8FE] p-6">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-geo-violet">Direktverzeichnis</p>
              <h3 className="mt-2 text-lg font-bold text-ink">UGC VZ (0 % Provision)</h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                Du wählst Creator anhand echter Portfolios selbst aus, erhältst direkte Kontaktdaten und verhandelst Honorar, Hooks und Nutzungsrechte frei. Ideal für Teams, die eigene Stamm-Creator aufbauen und 100 % des Budgets in Content stecken wollen.
              </p>
            </div>
            <div className="surface-card rounded-2xl p-6">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink-soft">Festpreis- &amp; Abo-Marktplätze</p>
              <h3 className="mt-2 text-lg font-bold text-ink">z. B. Noovid, Speekly, Influee</h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                Standardisierte Bestellung mit Plattform-Abwicklung, fester Lieferzeit und integrierten Nutzungsrechten – dafür keine direkte Creator-Beziehung und je nach Anbieter Abo oder Plattform-Marge.{' '}
                <Link href="/vergleich" className="font-semibold text-geo-violet underline">
                  Zum detaillierten Vergleich →
                </Link>
              </p>
            </div>
            <div className="surface-card rounded-2xl p-6">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink-soft">Full-Service / Managed</p>
              <h3 className="mt-2 text-lg font-bold text-ink">UGC Agentur</h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                Sinnvoll bei großen Paid-Social-Tests, wenn Konzeption, Skripting, Casting, Schnitt und Media-Buying komplett ausgelagert werden sollen. Bei UGC VZ optional über unser Team zubuchbar, nie Voraussetzung.
              </p>
            </div>
          </div>
        </section>

        {/* Branchen & Staedte */}
        <section className="py-10" aria-labelledby="de-niches-heading">
          <h2 id="de-niches-heading" className="text-2xl sm:text-3xl font-bold text-ink mb-4">
            Deutsche UGC Creator nach Branche &amp; Region
          </h2>
          <p className="text-ink-soft mb-6">
            Starte direkt in einer spezialisierten Kategorie mit eigenen Preis-Benchmarks und Kampagnen-Ideen:
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {NICHE_INDEX.map((niche) => (
              <Link
                key={niche.slug}
                href={nichePath(niche)}
                className="surface-card rounded-2xl px-5 py-4 hover:border-geo-violet transition-colors flex items-center justify-between"
              >
                <span className="font-semibold text-ink">{niche.chip}</span>
                <span className="text-geo-violet text-sm font-semibold">Profile →</span>
              </Link>
            ))}
          </div>

          <h3 className="text-lg font-bold text-ink mb-3">Regionale Schwerpunkte (Deutschland &amp; DACH)</h3>
          <div className="flex flex-wrap gap-2">
            {CITY_LINKS.map((city) => (
              <Link
                key={city.label}
                href={city.href}
                className="rounded-full border border-hairline bg-surface px-4 py-2 text-sm font-medium text-ink hover:border-geo-violet hover:bg-white transition-colors"
              >
                UGC Creator {city.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Hilfreiche Brand-Tools */}
        <section className="py-10 grid gap-5 md:grid-cols-3">
          <Link href="/brands/ugc-kosten-rechner" className="surface-card rounded-2xl p-6 hover:border-geo-violet transition-colors">
            <h2 className="font-bold text-geo-violet">UGC Kosten Rechner</h2>
            <p className="mt-2 text-sm text-ink-soft">Videos, Hooks, Rohmaterial und Paid-Ads-Nutzungsrechte in 60 Sek. kalkulieren.</p>
          </Link>
          <Link href="/brands/ugc-vertrag-vorlage" className="surface-card rounded-2xl p-6 hover:border-geo-violet transition-colors">
            <h2 className="font-bold text-geo-violet">Vertrags- &amp; Briefing-Generator</h2>
            <p className="mt-2 text-sm text-ink-soft">Rechte nach § 31 UrhG und Anfrage-Text direkt konfigurieren und kopieren.</p>
          </Link>
          <Link href="/vergleich/noovid-alternative" className="surface-card rounded-2xl p-6 hover:border-geo-violet transition-colors">
            <h2 className="font-bold text-geo-violet">Noovid &amp; Contentmarkt im Vergleich</h2>
            <p className="mt-2 text-sm text-ink-soft">Sachlicher Faktenvergleich mit Quellen zu Kosten, Rechten und Direktkontakt.</p>
          </Link>
        </section>

        {/* FAQ */}
        <section className="py-10 max-w-3xl" aria-labelledby="de-faq-heading">
          <h2 id="de-faq-heading" className="text-2xl sm:text-3xl font-bold text-ink mb-5">
            Häufige Fragen zu UGC Creatorn in Deutschland
          </h2>
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

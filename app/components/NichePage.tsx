// Template der Nischen-Landingpages. Zahlen und Creator kommen live aus den
// oeffentlichen Profilen (app/lib/niche-data.ts), der Text aus app/lib/niches.ts.
import Link from 'next/link';
import SearchBox from './SearchBox';
import FAQSchema from './FAQSchema';
import BreadcrumbSchema from './BreadcrumbSchema';
import { humanizeCreatorText } from '@/app/lib/creator-public';
import { NICHES, nichePath, nicheBySlug, type Niche } from '@/app/lib/niches';
import { NICHE_EXTRAS } from '@/app/lib/niche-extras';
import { loadNicheRows, matchesNiche, nicheStats, topCreators, type NicheRow } from '@/app/lib/niche-data';

const euro = (value: number) => `${value.toLocaleString('de-DE')} €`;
const monthYear = () => new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
const clip = (value: string, max: number) => (value.length > max ? `${value.slice(0, max).trimEnd()}…` : value);

/** Aufgerufen von der Route (Metadata) und vom Template: eine DB-Abfrage pro Stunde. */
export async function loadNicheData(niche: Niche) {
  const rows = (await loadNicheRows()).filter((row) => matchesNiche(row, niche.match));
  return { rows, stats: nicheStats(rows), creators: topCreators(rows, 8) };
}

function CreatorCard({ row }: { row: NicheRow }) {
  const firstName = (row.display_name || 'Creator').split(' ')[0];
  const topics = clip((row.topics || '').replace(/\s+/g, ' '), 90);
  const price = clip(humanizeCreatorText(row.rate_text).replace(/\s+/g, ' '), 110);
  return (
    <li className="surface-card rounded-lg p-5">
      <div className="flex items-center gap-3">
        {row.has_social_avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/avatar/${row.public_id}`} alt={`Profilbild von ${firstName}`} width={56} height={56} loading="lazy" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <div aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-geo-violet/10 text-lg font-bold text-geo-violet">{firstName.charAt(0).toUpperCase()}</div>
        )}
        <div className="min-w-0">
          <h3 className="font-bold text-ink">{firstName}</h3>
          <p className="text-xs text-ink-soft">{[row.city, (row.networks || []).join(', ')].filter(Boolean).join(' · ')}</p>
        </div>
      </div>
      {topics && <p className="mt-3 text-sm text-ink-soft">{topics}</p>}
      {price && <p className="mt-2 text-sm"><span className="font-semibold">Preisvorstellung:</span> {price}</p>}
      <p className="mt-3 flex items-center justify-between text-xs">
        <span className="text-ink-soft">{row.contact_reachable ? '✉ Per E-Mail erreichbar' : 'Kontakt über Social Media'}</span>
        <Link href={`/auswahl?ids=${row.public_id}`} className="font-semibold text-geo-violet underline">Profil ansehen</Link>
      </p>
    </li>
  );
}

export default async function NichePage({ niche }: { niche: Niche }) {
  const { stats, creators } = await loadNicheData(niche);
  const path = nichePath(niche);
  const stand = monthYear();
  const price = stats.price;
  const priceAnswer = price
    ? `Laut Selbstangabe von ${price.n} Creatorn in diesem Bereich liegt der Einstiegspreis pro Video meist zwischen ${euro(price.p25)} und ${euro(price.p75)}, der Median bei ${euro(price.median)} (Stand ${stand}). Der Endpreis hängt von Aufwand, Länge, Skript und Nutzungsrechten ab.`
    : 'Die Preise sind Selbstangaben der Creator und hängen von Aufwand, Länge, Skript und Nutzungsrechten ab. Die Vergütung steht in jedem Profil.';
  const extras = NICHE_EXTRAS[niche.slug];
  const faq = [
    { question: `Was kostet UGC für ${niche.chip}?`, answer: priceAnswer },
    { question: 'Was kostet die Vermittlung über UGC VZ?', answer: 'Nichts. UGC VZ ist für Brands kostenlos und nimmt keine Provision. Das Honorar wird direkt mit dem Creator vereinbart.' },
    ...niche.faq,
    ...(extras?.faq || []),
  ];
  const share = (count: number) => (stats.count ? Math.round((count / stats.count) * 100) : 0);
  const related = niche.related.map(nicheBySlug).filter((n): n is Niche => Boolean(n));

  return (
    <main className="min-h-screen bg-white text-ink px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <BreadcrumbSchema items={[
        { name: 'UGC VZ', url: 'https://ugc-vz.de' },
        { name: 'Für Brands', url: 'https://ugc-vz.de/brands' },
        { name: niche.chip, url: `https://ugc-vz.de${path}` },
      ]} />
      <FAQSchema faqItems={faq} />
      <div className="max-w-5xl mx-auto">
        <Link href="/brands" className="text-sm text-ink-soft hover:text-ink">UGC VZ für Brands</Link>

        <section className="py-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-ink">{niche.h1}</h1>
          <p className="text-xl text-ink-soft max-w-3xl mx-auto mb-10">
            {niche.intro}
            {stats.count > 0 && (
              <>
                {' '}Im UGC-VZ-Verzeichnis gibt es <strong className="text-ink">{stats.count} Creator</strong> mit diesem Schwerpunkt
                {price ? <>, der Einstieg liegt meist bei <strong className="text-ink">{euro(price.p25)} bis {euro(price.p75)}</strong> pro Video (Median {euro(price.median)})</> : null}
                . Die Vermittlung ist kostenlos und ohne Provision.
              </>
            )}
          </p>
          <SearchBox initialQuery={niche.query} />
        </section>

        {creators.length > 0 && (
          <section className="py-10" aria-labelledby="creator-heading">
            <h2 id="creator-heading" className="text-2xl font-bold mb-2">Ausgewählte Creator: {niche.chip}</h2>
            <p className="text-ink-soft mb-6">Profile mit Portfolio, die per E-Mail erreichbar sind, stehen zuerst. Die Suche oben findet weitere passende Creator zu Ihrem Briefing.</p>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{creators.map((row) => <CreatorCard key={row.public_id} row={row} />)}</ul>
            <p className="mt-6 text-center">
              <Link href={`/auswahl?ids=${creators.map((row) => row.public_id).join(',')}`} className="font-semibold text-geo-violet underline">
                Diese {creators.length} Creator als Auswahl ansehen und weiterleiten
              </Link>
            </p>
          </section>
        )}

        {extras && stats.count > 0 && (
          <section className="py-10" aria-labelledby="audience-heading">
            <h2 id="audience-heading" className="text-2xl font-bold mb-4">Zielgruppe & Plattformen: {niche.chip}</h2>
            <p className="text-ink-soft leading-7">{extras.audience}</p>
            <h3 className="mt-6 text-lg font-bold">Das zeigen die Profile im Verzeichnis</h3>
            <table className="mt-3 w-full max-w-2xl border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-hairline"><th className="py-2 pr-4 font-semibold">Kennzahl</th><th className="py-2 font-semibold">Wert</th></tr>
              </thead>
              <tbody className="text-ink-soft">
                <tr className="border-b border-hairline"><td className="py-2 pr-4">Creator mit diesem Schwerpunkt</td><td className="py-2">{stats.count}</td></tr>
                <tr className="border-b border-hairline"><td className="py-2 pr-4">Mit Portfolio-Links</td><td className="py-2">{share(stats.withPortfolio)} %</td></tr>
                <tr className="border-b border-hairline"><td className="py-2 pr-4">Per E-Mail erreichbar</td><td className="py-2">{share(stats.reachable)} %</td></tr>
                {stats.platforms.length > 0 && <tr className="border-b border-hairline"><td className="py-2 pr-4">Plattformen</td><td className="py-2">{stats.platforms.map((p) => `${p.name.charAt(0).toUpperCase()}${p.name.slice(1)} (${share(p.count)} %)`).join(', ')}</td></tr>}
                {price && <tr className="border-b border-hairline"><td className="py-2 pr-4">Einstiegspreis pro Video (mittlere Hälfte)</td><td className="py-2">{euro(price.p25)} bis {euro(price.p75)}</td></tr>}
                {price && <tr><td className="py-2 pr-4">Median Einstiegspreis (n = {price.n})</td><td className="py-2">{euro(price.median)}</td></tr>}
              </tbody>
            </table>
          </section>
        )}

        <section className="py-10" aria-labelledby="ideas-heading">
          <h2 id="ideas-heading" className="text-2xl font-bold mb-6">Kampagnen-Ideen: {niche.chip}</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {niche.ideas.map((idea) => (
              <div key={idea.title} className="surface-card rounded-lg p-6">
                <h3 className="font-bold text-geo-violet mb-2">{idea.title}</h3>
                <p className="text-ink-soft">{idea.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10" aria-labelledby="tips-heading">
          <h2 id="tips-heading" className="text-2xl font-bold mb-4">So gelingt das Briefing</h2>
          <ul className="list-disc space-y-2 pl-6 text-ink-soft">{niche.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
          <p className="mt-4 text-sm">
            <Link href="/brands/ugc-vertrag-vorlage" className="font-semibold text-geo-violet underline">Kostenlose Briefing- und Vertragsvorlage</Link>
            {' · '}
            <Link href="/brands/ugc-creator-preise" className="font-semibold text-geo-violet underline">UGC Preise im Überblick</Link>
            {' · '}
            <Link href="/brands/ugc-creator-finden" className="font-semibold text-geo-violet underline">UGC Creator finden</Link>
          </p>
        </section>

        {extras && (
          <section className="py-10" aria-labelledby="mistakes-heading">
            <h2 id="mistakes-heading" className="text-2xl font-bold mb-6">Typische Fehler vermeiden</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {extras.mistakes.map((m) => (
                <div key={m.title} className="surface-card rounded-lg p-6">
                  <h3 className="font-bold mb-2">{m.title}</h3>
                  <p className="text-ink-soft">{m.text}</p>
                </div>
              ))}
            </div>
            <h3 className="mt-8 text-lg font-bold">Rechte und Recht</h3>
            <p className="mt-2 text-ink-soft leading-7">{extras.legal} Das ist eine allgemeine Orientierung, keine Rechtsberatung.</p>
          </section>
        )}

        <section className="py-10" aria-labelledby="flow-heading">
          <h2 id="flow-heading" className="text-2xl font-bold mb-4">So läuft die Anfrage über UGC VZ</h2>
          <ol className="list-decimal space-y-2 pl-6 text-ink-soft leading-7">
            <li><strong className="text-ink">Creator auswählen:</strong> Oben das Briefing beschreiben oder einen Beispiel-Chip anklicken, Profile vergleichen und passende Creator markieren.</li>
            <li><strong className="text-ink">Anfrage senden:</strong> Name, E-Mail und Projektbeschreibung eintragen, optional Vergütung, Budget, Frist und Nutzungsrechte. Dies ist eine echte Anfrage: Sie erhalten die Kontaktdaten per E-Mail, und wir schreiben die erreichbaren Creator in Ihrem Namen an.</li>
            <li><strong className="text-ink">Direkt abstimmen:</strong> Creator antworten direkt an Sie. Preis, Umfang und Nutzungsrechte vereinbaren Sie ohne Provision für UGC VZ.</li>
          </ol>
        </section>

        <section className="py-10" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-2xl font-bold mb-4">Häufige Fragen</h2>
          <div className="space-y-3">
            {faq.map((item) => (
              <details key={item.question} className="surface-card rounded-lg p-5">
                <summary className="cursor-pointer font-semibold">{item.question}</summary>
                <p className="mt-3 text-ink-soft">{item.answer}</p>
              </details>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-soft">
            Kennzahlen aus den Selbstangaben der Creator-Profile im Verzeichnis (Stand {stand}). Preise sind Einstiegspreise pro Video, keine Festpreise.
          </p>
        </section>

        <section className="py-10" aria-labelledby="more-heading">
          <h2 id="more-heading" className="text-xl font-bold mb-3">Weitere Branchen</h2>
          <ul className="flex flex-wrap gap-2">
            {[...related, ...NICHES.filter((n) => n.slug !== niche.slug && !related.includes(n))].slice(0, 10).map((n) => (
              <li key={n.slug}><Link href={nichePath(n)} className="inline-block rounded-full border border-hairline bg-surface px-3 py-2 text-sm hover:border-geo-violet">{n.chip}</Link></li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

import type { Metadata } from 'next';
import { pageMetadata } from '@/utils/seo-metadata';
import Link from 'next/link';
import SearchBox from '../../components/SearchBox';
import BreadcrumbSchema from '../../components/BreadcrumbSchema';

export const metadata: Metadata = pageMetadata({
  path: '/brands/ugc-creator-preise',
  title: 'UGC Creator Preise in Deutschland',
  description: 'Was kostet ein UGC Video? Preisspannen von 150 bis 2.500 Euro nach Format, die Faktoren dahinter und kostenlose Creator-Suche fuer Brands.',
});

// Verbindliche Preisreferenz der Seite. Quelle ist der Detailartikel
// /wissen/ugc-video-preise-komplette-kosten-uebersicht-2025 — diese Seite und der
// Artikel muessen dieselben Zahlen nennen, sonst entsteht wieder der Widerspruch,
// den der SEO-Audit vom 21.07.2026 aufgedeckt hat (siehe docs/seo/ACTION-PLAN.md).
const PREISE = [
  { format: 'Social Clip', laenge: '15–30 Sek.', schnitt: '350 €', spanne: '150–600 €', nutzung: 'Instagram- und TikTok-Feed' },
  { format: 'Produkttest', laenge: '45–60 Sek.', schnitt: '650 €', spanne: '300–1.200 €', nutzung: 'Website, YouTube' },
  { format: 'Testimonial', laenge: '60–90 Sek.', schnitt: '850 €', spanne: '400–1.500 €', nutzung: 'Landingpages, E-Mail' },
  { format: 'Tutorial', laenge: '90–120 Sek.', schnitt: '1.100 €', spanne: '500–2.000 €', nutzung: 'YouTube, Help Center' },
  { format: 'Branded Story', laenge: 'ab 120 Sek.', schnitt: '1.500 €', spanne: '800–2.500 €', nutzung: 'Ads, Konferenzen' },
];

const FAKTOREN = [
  { faktor: 'Nutzungsrechte', gering: 'Nicht-exklusiv, 6 Monate', hoch: 'Exklusiv, 24 Monate', impact: '+80–150 %' },
  { faktor: 'Video-Länge', gering: '15–30 Sekunden', hoch: '60–90 Sekunden', impact: '+35–70 %' },
  { faktor: 'Produktionsaufwand', gering: 'Self-shot, ein Take', hoch: 'Mehrere Locations, Requisiten', impact: '+50–120 %' },
  { faktor: 'Creator-Erfahrung', gering: 'Einsteiger, unter 10 Videos', hoch: 'Profi, über 50 Videos', impact: '+60–100 %' },
  { faktor: 'Revisionsrunden', gering: '1–2 inklusive', hoch: '5 und mehr', impact: '+20–40 % je Runde' },
];

export default function UGCCreatorPreisePage() {
  return (
    <main className="min-h-screen bg-white text-ink px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://ugc-vz.de' },
        { name: 'Brands', url: 'https://ugc-vz.de/brands' },
        { name: 'UGC Creator Preise', url: 'https://ugc-vz.de/brands/ugc-creator-preise' },
      ]} />

      <div className="max-w-5xl mx-auto">
        <Link href="/brands" className="text-sm text-ink-soft hover:text-ink">UGC VZ fuer Brands</Link>

        <section className="py-14">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-ink">UGC Creator Preise realistisch einschätzen</h1>
          {/* Direktantwort zuerst: Suchmaschinen und AI-Systeme zitieren bevorzugt
              einen eigenstaendig verstaendlichen ersten Absatz. */}
          <p className="text-xl text-ink-soft max-w-3xl mb-6 leading-relaxed">
            Ein UGC-Video kostet in Deutschland zwischen <strong className="text-ink">150 und 2.500 Euro</strong>.
            Wo genau du landest, hängt vom Format ab: Ein kurzer Social Clip liegt im Schnitt bei 350 Euro,
            eine aufwendige Branded Story bei 1.500 Euro. Den größten Einzelhebel haben die Nutzungsrechte –
            exklusive Rechte über 24 Monate verteuern eine Produktion um 80 bis 150 Prozent.
          </p>
          <div className="max-w-3xl">
            <SearchBox initialQuery="UGC Creator bis 500 Euro fuer Produktvideo" />
          </div>
        </section>

        <section className="pb-14">
          <h2 className="text-2xl font-bold mb-4">Was kostet welches Format?</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline">
                  <th className="py-3 pr-4 font-semibold">Format</th>
                  <th className="py-3 pr-4 font-semibold">Länge</th>
                  <th className="py-3 pr-4 font-semibold">Durchschnitt</th>
                  <th className="py-3 pr-4 font-semibold">Spanne</th>
                  <th className="py-3 font-semibold">Typische Nutzung</th>
                </tr>
              </thead>
              <tbody>
                {PREISE.map((p) => (
                  <tr key={p.format} className="border-b border-hairline">
                    <td className="py-3 pr-4 font-medium text-geo-violet">{p.format}</td>
                    <td className="py-3 pr-4 text-ink-soft whitespace-nowrap">{p.laenge}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">{p.schnitt}</td>
                    <td className="py-3 pr-4 text-ink-soft whitespace-nowrap">{p.spanne}</td>
                    <td className="py-3 text-ink-soft">{p.nutzung}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-ink-soft mt-4">
            Orientierungswerte für den deutschen Markt. Einzelne Angebote können darunter oder darüber liegen.
          </p>
        </section>

        <section className="pb-14">
          <h2 className="text-2xl font-bold mb-4">Welche Faktoren den Preis treiben</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline">
                  <th className="py-3 pr-4 font-semibold">Faktor</th>
                  <th className="py-3 pr-4 font-semibold">Günstige Ausprägung</th>
                  <th className="py-3 pr-4 font-semibold">Teure Ausprägung</th>
                  <th className="py-3 font-semibold">Aufschlag</th>
                </tr>
              </thead>
              <tbody>
                {FAKTOREN.map((f) => (
                  <tr key={f.faktor} className="border-b border-hairline">
                    <td className="py-3 pr-4 font-medium text-geo-violet">{f.faktor}</td>
                    <td className="py-3 pr-4 text-ink-soft">{f.gering}</td>
                    <td className="py-3 pr-4 text-ink-soft">{f.hoch}</td>
                    <td className="py-3 whitespace-nowrap">{f.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="pb-14 grid md:grid-cols-3 gap-6">
          {[
            ['Preis ist nicht nur das Video', 'Briefing, Hook-Varianten, Rohmaterial, Revisionen und Nutzungsrechte bestimmen den Gesamtpreis mit.'],
            ['Budget offen nennen', 'Wenn du einen Rahmen angibst, priorisiert die Suche Profile mit passenden Preisvorstellungen.'],
            ['Kontaktdaten kostenlos anfragen', 'Nach der Auswahl bekommst du verfügbare Kontakt- und Social-Daten per E-Mail.'],
          ].map(([title, copy]) => (
            <div key={title} className="surface-card rounded-lg p-6">
              <h2 className="font-bold text-geo-violet mb-3">{title}</h2>
              <p className="text-ink-soft">{copy}</p>
            </div>
          ))}
        </section>

        <section className="surface-card rounded-lg p-6">
          <h2 className="text-xl font-bold mb-3">Ausführliche Kostenübersicht</h2>
          <p className="text-ink-soft mb-4 leading-relaxed">
            Rechenbeispiele, Paketpreise und wie sich die Kosten über die Laufzeit einer Kampagne verteilen,
            stehen im Detailartikel.
          </p>
          <Link
            href="/wissen/ugc-video-preise-komplette-kosten-uebersicht-2025"
            className="inline-flex text-geo-violet hover:text-geo-violet-soft font-medium"
          >
            UGC Video Preise: Komplette Kosten-Übersicht
          </Link>
        </section>
      </div>
    </main>
  );
}

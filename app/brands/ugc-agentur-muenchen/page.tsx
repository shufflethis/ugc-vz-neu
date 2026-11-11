import type { Metadata } from 'next';
import { pageMetadata } from '@/utils/seo-metadata';
import Link from 'next/link';

export const metadata: Metadata = pageMetadata({
  path: '/brands/ugc-agentur-muenchen',
  title: 'UGC Agentur München oder Creator-Plattform?',
  description: 'UGC Agentur München gesucht? UGC VZ verbindet Brands mit passenden UGC Creatorn und optionaler Kampagnen-Unterstützung.',
});

export default function UGCAgenturMuenchenPage() {
  return (
    <div className="min-h-screen bg-white text-ink px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto">
        <Link href="/brands" className="text-sm text-ink-soft hover:text-ink">UGC VZ für Brands</Link>
        <section className="py-14">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-ink">UGC Agentur München oder Creator direkt finden?</h1>
          <p className="text-xl text-ink-soft max-w-3xl leading-relaxed mb-8">
            Für Münchner Brands, DTC-Teams und Agenturen ist UGC VZ ein schneller Einstieg: Bedarf beschreiben, Creator-Vorschläge ansehen und Kontaktinfos kostenlos anfragen.
          </p>
          <Link href="/brands#q=UGC+Creator+M%C3%BCnchen" className="inline-flex bg-geo-violet hover:bg-geo-violet-soft text-white font-semibold py-3 px-6 rounded-full">
            Creator für München suchen
          </Link>
        </section>
        <section className="surface-card rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-geo-violet mb-4">Plattform oder Agentur?</h2>
          <p className="text-ink-soft leading-relaxed">
            Wenn du nur Creator entdecken und direkt kontaktieren willst, reicht die Plattform. Wenn du Briefing, Skript, Nutzungsrechte, Creator-Steuerung, Produktion oder Paid-Social-Setup brauchst, kann daraus optional ein betreutes Kampagnenprojekt werden.
          </p>
        </section>
      </div>
    </div>
  );
}

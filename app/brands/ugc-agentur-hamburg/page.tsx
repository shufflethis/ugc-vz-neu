import type { Metadata } from 'next';
import { pageMetadata } from '@/utils/seo-metadata';
import Link from 'next/link';

export const metadata: Metadata = pageMetadata({
  path: '/brands/ugc-agentur-hamburg',
  title: 'UGC Agentur Hamburg oder Creator-Plattform?',
  description: 'UGC Agentur Hamburg gesucht? UGC VZ hilft beim Finden passender Creator und bietet optional Support fuer Kampagnen-Abwicklung.',
});

export default function UGCAgenturHamburgPage() {
  return (
    <main className="min-h-screen bg-white text-ink px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <div className="max-w-5xl mx-auto">
        <Link href="/brands" className="text-sm text-ink-soft hover:text-ink">UGC VZ fuer Brands</Link>
        <section className="py-14">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-ink">UGC Agentur Hamburg oder Creator direkt finden?</h1>
          <p className="text-xl text-ink-soft max-w-3xl leading-relaxed mb-8">
            Wenn du UGC fuer Hamburg, Norddeutschland oder bundesweite Kampagnen suchst, kannst du zuerst passende Creator identifizieren und danach entscheiden, ob du Agentur-Support brauchst.
          </p>
          <Link href="/brands#q=UGC+Creator+Hamburg" className="inline-flex bg-geo-violet hover:bg-geo-violet-soft text-white font-semibold py-3 px-6 rounded-lg">
            Creator fuer Hamburg suchen
          </Link>
        </section>
        <section className="grid md:grid-cols-2 gap-6">
          <div className="surface-card rounded-lg p-6">
            <h2 className="font-bold text-geo-violet mb-3">Erst Matching, dann Abwicklung</h2>
            <p className="text-ink-soft">UGC VZ zeigt dir Creator-Vorschlaege. Bei Bedarf kann das Team Briefing, Rechte, Feedback und Produktion mitdenken.</p>
          </div>
          <div className="surface-card rounded-lg p-6">
            <h2 className="font-bold text-geo-violet mb-3">Nicht nur lokale Reichweite</h2>
            <p className="text-ink-soft">Oft zaehlt nicht der Wohnort, sondern Sprache, Stil, Produktfit und ob Creator das Format glaubwuerdig umsetzen koennen.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

// Englische Datenschutz-Zusammenfassung (Trust-Anchor fuer internationale
// Crawler/Agenten). Bewusst KEINE Kopie der Rechtstexte - die massgebliche,
// vollstaendige Fassung bleibt /datenschutz; hier nur Prinzipien + Verweis,
// damit nichts auseinanderdriften kann.
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy at UGC VZ (English Summary)',
  description:
    'How UGC VZ handles personal data: public creator profiles without private contact data, email-based outreach after explicit requests, GDPR compliance. Authoritative German policy at /datenschutz.',
  alternates: { canonical: 'https://ugc-vz.de/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className="px-4 sm:px-8 md:px-16 lg:px-24 pb-24 bg-white text-ink">
      <div className="max-w-2xl mx-auto py-14">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-geo-violet">Privacy</p>
        <h1 className="mt-3 text-4xl font-bold">Privacy at UGC VZ</h1>
        <p className="mt-4 leading-7 text-ink-soft">
          This page summarizes how UGC VZ handles personal data, in English. The authoritative and
          legally binding privacy policy is the German version at{' '}
          <Link className="font-semibold text-geo-violet underline" href="/datenschutz">/datenschutz</Link>{' '}
          (GDPR / DSGVO).
        </p>

        <div className="mt-8 space-y-5 leading-7 text-ink-soft">
          <p>
            <strong className="text-ink">Public profiles, private contacts.</strong> Creator profiles in
            the public directory contain professional information only: name or stage name, region,
            topics, portfolio links, reach and pricing. Private contact details (email, phone) are
            stored separately and are <strong className="text-ink">never</strong> exposed through search
            results, the public API, the MCP server, or any other public endpoint.
          </p>
          <p>
            <strong className="text-ink">Contact only after explicit requests.</strong> A brand receives
            creator contact details by email only after deliberately selecting creators and submitting a
            request. Creators are notified according to their consent settings and can withdraw consent
            at any time.
          </p>
          <p>
            <strong className="text-ink">AI processing is minimal.</strong> When a search query is
            structured by a language model, only the query text is transmitted — never the creator
            database. Profile changes made by creators are logged for accountability.
          </p>
          <p>
            <strong className="text-ink">Operator and contact.</strong> UGC VZ is operated by track by
            track GmbH, Schliemannstr. 23, 10437 Berlin, Germany. Data protection inquiries:{' '}
            <a className="font-semibold text-geo-violet underline" href="mailto:hi@ugc-vz.de">hi@ugc-vz.de</a>.
            See also <Link className="underline" href="/impressum">Impressum</Link> (legal notice) and{' '}
            <Link className="underline" href="/contact">Contact</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}

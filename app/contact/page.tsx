// Statische Kontaktseite (Trust-Anchor). Ergaenzt das Kontakt-Popup im Footer
// um eine verlinkbare, crawlbare Seite mit den echten Betreiberdaten.
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kontakt – UGC VZ',
  description:
    'Kontakt zu UGC VZ: E-Mail, Telefon und Postanschrift der track by track GmbH in Berlin. Ansprechpartner für Creator, Brands und Presse.',
  alternates: { canonical: 'https://ugc-vz.de/contact' },
};

export default function ContactPage() {
  return (
    <main className="px-4 sm:px-8 md:px-16 lg:px-24 pb-24 bg-white text-ink">
      <div className="max-w-2xl mx-auto py-14">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-geo-violet">Kontakt</p>
        <h1 className="mt-3 text-4xl font-bold">So erreichst du uns</h1>
        <p className="mt-4 leading-7 text-ink-soft">
          UGC VZ wird von der track by track GmbH in Berlin betrieben — dem Team hinter der
          Social-Media-Agentur famefact. Wir antworten in der Regel innerhalb eines Werktags.
        </p>

        <div className="mt-8 rounded-3xl border border-hairline bg-white p-6 sm:p-8 shadow-[0_24px_80px_rgba(35,22,47,0.06)] space-y-4 leading-7">
          <p><strong>E-Mail:</strong> <a className="font-semibold text-geo-violet underline" href="mailto:hi@ugc-vz.de">hi@ugc-vz.de</a></p>
          <p><strong>Telefon:</strong> <a className="font-semibold text-geo-violet underline" href="tel:+4930403665451">+49 30 403 665 451</a></p>
          <p><strong>Post:</strong><br />track by track GmbH<br />Schliemannstr. 23<br />10437 Berlin, Deutschland</p>
        </div>

        <div className="mt-8 space-y-4 leading-7 text-ink-soft">
          <p>
            <strong className="text-ink">Creator:</strong> Fragen zu deinem Profil bitte mit deiner
            Profil-ID (UGC-…) senden. Profil selbst bearbeiten kannst du jederzeit im{' '}
            <Link className="font-semibold text-geo-violet underline" href="/konto">Creator-Konto</Link>.
          </p>
          <p>
            <strong className="text-ink">Brands:</strong> Für Creator-Anfragen nutzt du am schnellsten
            die <Link className="font-semibold text-geo-violet underline" href="/brands">Suche</Link> —
            Kontaktdaten kommen nach deiner Auswahl automatisch per E-Mail.
          </p>
          <p>
            <strong className="text-ink">Developer &amp; KI-Agenten:</strong> Schnittstellen und Doku
            unter <Link className="font-semibold text-geo-violet underline" href="/developers">/developers</Link>.
          </p>
          <p>
            Rechtliches: <Link className="underline" href="/impressum">Impressum</Link> ·{' '}
            <Link className="underline" href="/datenschutz">Datenschutz</Link> ·{' '}
            <Link className="underline" href="/agb">AGB</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

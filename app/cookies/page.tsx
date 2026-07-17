'use client';

import Link from 'next/link';
import ResponsiveCTAButton from '@/src/components/ResponsiveCTAButton';
import LogoImage from '../components/LogoImage';

type ConsentWindow = Window & typeof globalThis & {
  showCookieSettings?: () => void;
  resetCookieConsent?: () => void;
};

export default function CookiesPage() {
  const openSettings = () => (window as ConsentWindow).showCookieSettings?.();
  const resetSettings = () => (window as ConsentWindow).resetCookieConsent?.();

  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="py-6 px-4 sm:px-8 md:px-16 lg:px-24">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <LogoImage width={32} height={32} className="mr-2" priority />
            <span className="text-xl font-bold gradient-text">UGC VZ</span>
          </Link>
          <ResponsiveCTAButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 sm:px-8 md:px-16 lg:px-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="mb-6 text-4xl font-bold sm:text-5xl"><span className="gradient-text">Datenschutz-Einstellungen</span></h1>
            <p className="text-lg text-ink-soft">Welche lokale Speicherung und Analyse UGC VZ verwendet und wie du deine Auswahl änderst.</p>
          </div>

          <div className="space-y-8">
            <section className="surface-card rounded-2xl p-8">
              <h2 className="mb-4 text-2xl font-bold">Notwendige Speicherung</h2>
              <p className="leading-relaxed text-ink-soft">Die Website speichert deine Datenschutz-Auswahl im lokalen Speicher des Browsers. Diese Information ist erforderlich, damit wir dich nicht bei jedem Seitenaufruf erneut fragen.</p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-ink-soft">
                <li>Schlüssel: <code>ugc-vz-cookie-consent</code></li>
                <li>Inhalt: Zustimmung oder Ablehnung von Google Analytics sowie Zeitstempel</li>
                <li>Keine Nutzung für Werbung oder Profilbildung</li>
              </ul>
            </section>

            <section className="surface-card rounded-2xl p-8">
              <h2 className="mb-4 text-2xl font-bold">Optionale Reichweitenmessung</h2>
              <p className="leading-relaxed text-ink-soft">Google Analytics wird erst geladen, nachdem du aktiv zugestimmt hast. Ohne Zustimmung wird weder das Analytics-Script geladen noch ein Messrequest an Google gesendet.</p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-ink-soft">
                <li>Anbieter: Google Ireland Limited</li>
                <li>Zweck: statistische Reichweiten- und Nutzungsanalyse</li>
                <li>Rechtsgrundlage: deine Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO</li>
                <li>Widerruf: jederzeit über die Einstellungen auf dieser Seite</li>
              </ul>
            </section>

            <section className="surface-card rounded-2xl p-8">
              <h2 className="mb-4 text-2xl font-bold">Auswahl verwalten</h2>
              <p className="mb-6 leading-relaxed text-ink-soft">Du kannst deine Auswahl jederzeit ansehen, ändern oder vollständig zurücksetzen.</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button onClick={openSettings} className="rounded-lg bg-geo-violet px-6 py-3 font-semibold text-white hover:bg-geo-violet-soft">Einstellungen öffnen</button>
                <button onClick={resetSettings} className="rounded-lg border border-hairline px-6 py-3 font-semibold text-ink hover:border-geo-violet">Einwilligung zurücksetzen</button>
              </div>
            </section>

            <section className="surface-card rounded-2xl p-8">
              <h2 className="mb-4 text-2xl font-bold">Kontakt und weitere Informationen</h2>
              <p className="leading-relaxed text-ink-soft">Weitere Angaben zu Empfängern, Speicherdauer und deinen Rechten findest du in der <Link href="/datenschutz" className="text-geo-violet">Datenschutzerklärung</Link>. Fragen beantwortet <a href="mailto:hi@ugc-vz.de" className="text-geo-violet">hi@ugc-vz.de</a>.</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

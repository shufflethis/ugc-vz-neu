import Link from 'next/link';
import ResponsiveCTAButton from '@/src/components/ResponsiveCTAButton';
import LogoImage from '../components/LogoImage';

export default function CookiesPage() {
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
            <h1 className="mb-6 text-4xl font-bold sm:text-5xl"><span className="gradient-text">Cookies & Reichweitenmessung</span></h1>
            <p className="text-lg text-ink-soft">Welche Technik UGC VZ zur anonymen Reichweitenmessung verwendet.</p>
          </div>

          <div className="space-y-8">
            <section className="surface-card rounded-2xl p-8">
              <h2 className="mb-4 text-2xl font-bold">Keine Analyse-Cookies</h2>
              <p className="leading-relaxed text-ink-soft">UGC VZ setzt für die Reichweitenmessung keine Cookies und speichert dafür auch keine dauerhaften Kennungen im lokalen Speicher deines Browsers.</p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-ink-soft">
                <li>Kein Google Analytics</li>
                <li>Keine geräte- oder websiteübergreifende Verfolgung</li>
                <li>Keine Nutzung für Werbung oder individuelle Profilbildung</li>
              </ul>
            </section>

            <section className="surface-card rounded-2xl p-8">
              <h2 className="mb-4 text-2xl font-bold">Datenschutzfreundliche Reichweitenmessung</h2>
              <p className="leading-relaxed text-ink-soft">Wir verwenden Plausible Analytics über <code>analytics.polymarkt.de</code>, um ausschließlich zusammengefasste Nutzungsstatistiken wie Seitenaufrufe, Verweisquellen, Länder sowie Browser- und Gerätetypen auszuwerten.</p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-ink-soft">
                <li>Zweck: statistische Reichweiten- und Nutzungsanalyse</li>
                <li>Keine personenbezogenen Besucherprofile</li>
                <li>Keine persistenten Identifikatoren</li>
              </ul>
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

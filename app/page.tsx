import Link from 'next/link';

// Make sure the search.css is imported in your main page or layout
import './styles/search.css';
import SearchBox from './components/SearchBox';
import ResponsiveCTAButton from '@/src/components/ResponsiveCTAButton';
import LogoImage from './components/LogoImage';
import TrustElements from './components/TrustElements';
import ContentCascade from './components/ContentCascade';
import HomePageSchema from './components/HomePageSchema';

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Schema.org structured data for SEO */}
      <HomePageSchema />
      
      <header className="py-6 px-4 sm:px-8 md:px-16 lg:px-24">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <LogoImage
              width={32}
              height={32}
              className="mr-2"
              priority
            />
            <span className="text-xl font-bold gradient-text">
              UGC VZ
            </span>
          </div>

          <nav className="flex items-center gap-3">
            <Link href="/brands" className="hidden sm:inline-flex text-sm font-medium text-ink-soft hover:text-ink transition-colors">
              Fuer Brands
            </Link>
            <Link href="/creator" className="hidden sm:inline-flex text-sm font-medium text-ink-soft hover:text-ink transition-colors">
              Fuer Creator
            </Link>
            <ResponsiveCTAButton />
          </nav>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-ink">
          UGC Creator finden oder als <span className="gradient-text">Creator anmelden</span>
        </h1>
        <p className="text-lg sm:text-xl text-ink-soft max-w-2xl mb-12">
          UGC VZ ist die kostenlose Plattform fuer User Generated Content in Deutschland. Brands beschreiben ihre Kampagne und finden passende Creator aus 370+ echten Profilen. Creator fuellen den Fragebogen aus und werden fuer passende Anfragen sichtbar.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <Link
            href="/brands"
            className="bg-geo-violet hover:bg-geo-violet-soft text-white font-semibold py-3 px-6 rounded-lg transition-all"
          >
            Creator fuer Kampagne finden
          </Link>
          <Link
            href="/creator"
            className="border border-geo-violet text-geo-violet hover:bg-geo-violet hover:text-white font-semibold py-3 px-6 rounded-lg transition-all"
          >
            Als UGC Creator anmelden
          </Link>
        </div>

        <div id="search" className="w-full max-w-2xl mx-auto scroll-mt-24">
          <SearchBox />
        </div>
      </main>

      {/* Trust Elements Section */}
      <TrustElements />

      {/* SEO-Optimized Content Section */}
      <section className="px-4 sm:px-8 md:px-16 lg:px-24 py-16 grad-subtle">
        <div className="max-w-6xl mx-auto">
          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {/* UGC Creator finden */}
            <div className="surface-card rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-4 text-geo-violet">
                UGC Creator finden - kostenlos fuer Brands
              </h2>
              <p className="text-ink-soft leading-relaxed mb-4">
                Du willst <strong>UGC Creators finden</strong>, die zu Produkt, Zielgruppe und Content-Stil passen? Beschreibe deine Kampagne in der Suche, waehle passende Profile aus und fordere die Details kostenlos an.
              </p>
              <p className="text-ink-soft leading-relaxed">
                Das ist kein klassischer Agentur-Retainer und keine teure Datenbank-Lizenz. UGC VZ funktioniert als niedrigschwelliger Einstieg fuer Marketing-Teams, die Creator testen, briefen und direkt anfragen wollen.
              </p>
            </div>

            {/* Was ist UGC Creator */}
            <div className="surface-card rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-4 text-geo-violet">
                Als UGC Creator anmelden
              </h2>
              <p className="text-ink-soft leading-relaxed mb-4">
                Creator koennen sich kostenlos registrieren und ihr Portfolio hinterlegen. Wichtig sind klare Beispiele, Themenbereiche, Social-Links, Preise oder grobe Ranges und die Art von Marken, fuer die du Content erstellen willst.
              </p>
              <p className="text-ink-soft leading-relaxed">
                Je vollstaendiger dein Fragebogen ist, desto besser kann dein Profil bei passenden Brand-Anfragen beruecksichtigt werden.
              </p>
              <Link href="/creator" className="inline-flex mt-5 text-geo-violet hover:text-geo-violet-soft font-semibold">
                Zum Creator-Fragebogen
              </Link>
            </div>
          </div>

          {/* Full Width Content */}
          <div className="surface-card rounded-2xl p-8 mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">
              <span className="gradient-text">User Generated Content & Geld verdienen</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-geo-violet">Als Creator Geld verdienen</h3>
                <p className="text-ink-soft leading-relaxed mb-3">
                  Du bist kreativ und möchtest mit <strong>User Generated Content Geld verdienen</strong>? Bei UGC-VZ kannst du 
                  dich kostenlos registrieren und dein Portfolio präsentieren. Unternehmen finden dich und kontaktieren dich 
                  direkt für bezahlte Kooperationen.
                </p>
                <ul className="text-ink-soft space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-deep mr-2">✓</span>
                    <span>Kostenlose Registrierung für Creator</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-deep mr-2">✓</span>
                    <span>Direkte Bezahlung durch Unternehmen</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-deep mr-2">✓</span>
                    <span>Flexible Projekte nach deinem Zeitplan</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4 text-geo-violet">Für Unternehmen</h3>
                <p className="text-ink-soft leading-relaxed mb-3">
                  Mit <strong>UGC Creators</strong> erreichst du authentische Kundenbindung und bessere Conversion-Raten. 
                  User Generated Content wirkt bis zu 8x glaubwürdiger als klassische Werbung und kostet einen Bruchteil 
                  von Influencer-Marketing.
                </p>
                <ul className="text-ink-soft space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-deep mr-2">✓</span>
                    <span>Höhere Conversion durch Authentizität</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-deep mr-2">✓</span>
                    <span>Kosteneffizient im Vergleich zu Influencern</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-deep mr-2">✓</span>
                    <span>Direkter Kontakt ohne Agentur-Gebühren</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center surface-card rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-4 text-ink">
              Bereit für <span className="gradient-text">authentischen Content</span>?
            </h2>
            <p className="text-xl text-ink-soft mb-8 max-w-2xl mx-auto">
              Egal ob du als Creator durchstarten oder als Unternehmen <strong>UGC Creators finden</strong> möchtest – 
              UGC-VZ bringt euch zusammen. Komplett kostenlos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/#search"
                className="bg-geo-violet hover:bg-geo-violet-soft text-white font-semibold py-4 px-8 rounded-lg transition-all transform hover:scale-105"
              >
                Jetzt Creator finden
              </Link>
              <Link
                href="https://tally.so/r/w25dBp"
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-geo-violet text-geo-violet hover:bg-geo-violet hover:text-white font-semibold py-4 px-8 rounded-lg transition-all transform hover:scale-105"
              >
                Als Creator registrieren
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="px-4 sm:px-8 md:px-16 lg:px-24 py-16 grad-subtle">
        <div className="max-w-5xl mx-auto">
          <div className="surface-card rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-center text-ink">
              <span className="gradient-text">So findest du deinen UGC Creator</span>
            </h2>
            <p className="text-ink-soft text-center mb-8 max-w-2xl mx-auto">
              Schau dir an, wie einfach es ist, den perfekten Creator für deine Kampagne zu finden
            </p>
            <div className="relative rounded-xl overflow-hidden shadow-2xl">
              <video 
                className="w-full h-auto"
                controls
                preload="auto"
                playsInline
                controlsList="nodownload"
              >
                <source src="/ugc-creator-finden.mp4" type="video/mp4" />
                Dein Browser unterstützt keine Videos.
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* Content Cascade Section */}
      <ContentCascade />
    </div>
  );
}

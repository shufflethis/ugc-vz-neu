import Link from 'next/link';
import Image from 'next/image';

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

      <main className="flex-grow flex flex-col w-full">
        {/* Full-width Hero Section */}
        <section className="relative w-full min-h-[85vh] flex flex-col items-center justify-center pt-20 pb-32 overflow-visible">
          
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image 
              src="/ugc-tool.webp"
              alt="UGC VZ Plattform Background"
              fill
              className="object-cover object-center"
              priority
            />
            {/* Dark & Blurry Overlay */}
            <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm"></div>
          </div>

          {/* Foreground Content */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto w-full px-4 sm:px-8 mt-12">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-semibold mb-8 border border-white/20 backdrop-blur-md shadow-lg">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
              </span>
              Vermutlich das größte kostenfreie UGC Verzeichnis
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold mb-6 text-white leading-[1.1] tracking-tight shadow-sm">
              UGC Creator finden oder als <br className="hidden md:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-geo-violet-soft">Creator anmelden</span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-gray-200 max-w-3xl mb-12 leading-relaxed">
              Die kostenlose Plattform für User Generated Content in Deutschland. Brands beschreiben ihre Kampagne und finden passende Creator aus 370+ echten Profilen.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8 w-full sm:w-auto">
              <Link
                href="/brands"
                className="bg-geo-violet hover:bg-geo-violet-soft text-white font-semibold py-4 px-10 rounded-xl transition-all shadow-xl shadow-geo-violet/40 flex items-center justify-center gap-2 group text-lg"
              >
                Creator finden
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link
                href="/creator"
                className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold py-4 px-10 rounded-xl transition-all flex items-center justify-center backdrop-blur-md text-lg"
              >
                Als Creator anmelden
              </Link>
            </div>
          </div>

          {/* SearchBox Overlapping the bottom edge */}
          <div id="search" className="w-full max-w-5xl mx-auto scroll-mt-24 relative z-20 mt-auto translate-y-32 px-4 sm:px-8">
            <div className="absolute inset-4 sm:-inset-1 bg-gradient-to-r from-geo-violet/40 via-teal-400/40 to-geo-violet/40 blur-xl -z-10 rounded-[2.5rem]"></div>
            <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white p-6 sm:p-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-ink">
                Passende UGC Creator <span className="text-geo-violet">direkt finden</span>
              </h2>
              <SearchBox />
            </div>
          </div>
        </section>
        
        {/* Spacer to account for overlapping search box */}
        <div className="h-40 w-full bg-white"></div>
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
                href="/creator#creator-form"
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

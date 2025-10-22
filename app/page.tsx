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
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
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

          <ResponsiveCTAButton />
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
          Finde deinen perfekten <span className="gradient-text">UGC Creator</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mb-12">
          Beschreibe deine Kampagne und wir finden die passenden Creator gratis für dich. Wähle danach einfach aus und unser Agent wird dir umgehend die Details kostenlos zusenden.
        </p>

        <div className="w-full max-w-2xl mx-auto">
          <SearchBox />
        </div>
      </main>

      {/* Trust Elements Section */}
      <TrustElements />

      {/* SEO-Optimized Content Section */}
      <section className="px-4 sm:px-8 md:px-16 lg:px-24 py-16 bg-gradient-to-b from-transparent to-gray-900/30">
        <div className="max-w-6xl mx-auto">
          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {/* UGC Creator finden */}
            <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 backdrop-blur-sm rounded-2xl p-8 border border-emerald-700/30">
              <h2 className="text-2xl font-bold mb-4 text-emerald-300">
                UGC Creator finden – So einfach geht's
              </h2>
              <p className="text-gray-200 leading-relaxed mb-4">
                Du willst <strong>UGC Creators finden</strong>, die perfekt zu deiner Marke passen? Mit UGC-VZ ist das kinderleicht. 
                Beschreibe einfach deine Kampagne in der Suche, und unser intelligentes System findet die passenden Creator für dich – 
                kostenlos und ohne lange Wartezeiten.
              </p>
              <p className="text-gray-200 leading-relaxed">
                Egal ob Fashion, Food, Tech oder Lifestyle: Unsere Datenbank bietet dir Zugang zu <strong>authentischen UGC Creators</strong>, 
                die genau deinen Style treffen. Keine Agentur-Gebühren, keine versteckten Kosten – nur echte Connections.
              </p>
            </div>

            {/* Was ist UGC Creator */}
            <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 backdrop-blur-sm rounded-2xl p-8 border border-blue-700/30">
              <h2 className="text-2xl font-bold mb-4 text-blue-300">
                UGC Creator – Was ist das?
              </h2>
              <p className="text-gray-200 leading-relaxed mb-4">
                Ein <strong>UGC Creator</strong> (User Generated Content Creator) erstellt authentische Inhalte über Produkte und Marken. 
                Im Gegensatz zu klassischen Influencern geht es hier nicht um große Reichweiten, sondern um <strong>ehrliche, 
                nachvollziehbare Empfehlungen</strong>, die potenzielle Kunden wirklich überzeugen.
              </p>
              <p className="text-gray-200 leading-relaxed">
                <strong>UGC Creators</strong> produzieren Videos, Fotos und Reviews, die wie Content von echten Nutzern aussehen – 
                weil sie es sind! Diese Authentizität macht UGC so wertvoll für moderne Marketing-Strategien.
              </p>
            </div>
          </div>

          {/* Full Width Content */}
          <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-700/30 mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">
              <span className="gradient-text">User Generated Content & Geld verdienen</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-purple-300">Als Creator Geld verdienen</h3>
                <p className="text-gray-200 leading-relaxed mb-3">
                  Du bist kreativ und möchtest mit <strong>User Generated Content Geld verdienen</strong>? Bei UGC-VZ kannst du 
                  dich kostenlos registrieren und dein Portfolio präsentieren. Unternehmen finden dich und kontaktieren dich 
                  direkt für bezahlte Kooperationen.
                </p>
                <ul className="text-gray-200 space-y-2">
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">✓</span>
                    <span>Kostenlose Registrierung für Creator</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">✓</span>
                    <span>Direkte Bezahlung durch Unternehmen</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">✓</span>
                    <span>Flexible Projekte nach deinem Zeitplan</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4 text-pink-300">Für Unternehmen</h3>
                <p className="text-gray-200 leading-relaxed mb-3">
                  Mit <strong>UGC Creators</strong> erreichst du authentische Kundenbindung und bessere Conversion-Raten. 
                  User Generated Content wirkt bis zu 8x glaubwürdiger als klassische Werbung und kostet einen Bruchteil 
                  von Influencer-Marketing.
                </p>
                <ul className="text-gray-200 space-y-2">
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">✓</span>
                    <span>Höhere Conversion durch Authentizität</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">✓</span>
                    <span>Kosteneffizient im Vergleich zu Influencern</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">✓</span>
                    <span>Direkter Kontakt ohne Agentur-Gebühren</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-emerald-900/30 to-blue-900/30 backdrop-blur-sm rounded-2xl p-12 border border-emerald-700/30">
            <h2 className="text-3xl font-bold mb-4">
              Bereit für <span className="gradient-text">authentischen Content</span>?
            </h2>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Egal ob du als Creator durchstarten oder als Unternehmen <strong>UGC Creators finden</strong> möchtest – 
              UGC-VZ bringt euch zusammen. Komplett kostenlos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/#search"
                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-semibold py-4 px-8 rounded-lg transition-all transform hover:scale-105"
              >
                Jetzt Creator finden
              </Link>
              <Link
                href="https://tally.so/r/w25dBp"
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white font-semibold py-4 px-8 rounded-lg transition-all transform hover:scale-105"
              >
                Als Creator registrieren
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="px-4 sm:px-8 md:px-16 lg:px-24 py-16 bg-gradient-to-b from-gray-900/30 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-700/30">
            <h2 className="text-3xl font-bold mb-6 text-center">
              <span className="gradient-text">So findest du deinen UGC Creator</span>
            </h2>
            <p className="text-gray-200 text-center mb-8 max-w-2xl mx-auto">
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

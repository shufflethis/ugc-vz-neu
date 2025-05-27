import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Header */}
      <header className="py-6 px-4 sm:px-8 md:px-16 lg:px-24">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/ugc-vz-logo.webp"
              alt="UGC VZ"
              width={32}
              height={32}
              className="mr-2"
              priority
            />
            <span className="text-xl font-bold gradient-text">
              UGC VZ
            </span>
          </Link>

          <Link
            href="https://tally.so/r/w25dBp"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-md text-sm whitespace-nowrap"
          >
            Ich bin UGC Creator und will mitmachen
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-8 md:px-16 lg:px-24 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Das kostenlose <span className="gradient-text">Creator-Verzeichnis</span>, das echte Connections schafft
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Wir glauben: Authentischer Content entsteht, wenn die richtigen Menschen zusammenfinden.
            </p>
          </div>

          {/* Introduction */}
          <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-2xl p-8 mb-12 border border-gray-700/50">
            <p className="text-lg text-gray-200 leading-relaxed">
              UGC-VZ ist mehr als nur ein Verzeichnis – wir sind die Brücke zwischen talentierten UGC Creators und Unternehmen,
              die echte Geschichten erzählen wollen. <span className="text-emerald-400 font-semibold">Komplett kostenlos. Für beide Seiten.</span>
            </p>
          </div>

          {/* Mission Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-center">
              <span className="gradient-text">Unsere Mission</span>
            </h2>
            <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-800/50">
              <p className="text-lg text-gray-200 leading-relaxed">
                Wir democratisieren User Generated Content. Jeder Creator verdient eine Chance, entdeckt zu werden.
                Jedes Unternehmen – egal ob Startup oder etablierte Marke – sollte Zugang zu authentischem Content haben,
                ohne Umwege über teure Agenturen oder komplizierte Plattformen.
              </p>
            </div>
          </section>

          {/* Why UGC-VZ Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Warum <span className="gradient-text">UGC-VZ</span>?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* For Creators */}
              <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/20 backdrop-blur-sm rounded-2xl p-8 border border-emerald-700/30">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-emerald-300">Für Creators</h3>
                </div>
                <p className="text-gray-200 leading-relaxed">
                  Zeig dich, wie du bist. Erstelle dein kostenloses Profil, präsentiere dein Portfolio und werde von Unternehmen entdeckt,
                  die genau nach deinem Style suchen. Kein Algorithmus, keine versteckten Kosten – nur echte Opportunities.
                </p>
              </div>

              {/* For Companies */}
              <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 backdrop-blur-sm rounded-2xl p-8 border border-blue-700/30">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-blue-300">Für Unternehmen</h3>
                </div>
                <p className="text-gray-200 leading-relaxed">
                  Finde den perfekten Creator für dein Projekt. Durchstöbere Profile, entdecke verschiedene Styles und knüpfe direkte Kontakte.
                  Ob du ein kleines Budget oder große Kampagnen planst – hier findest du den richtigen Match.
                </p>
              </div>
            </div>
          </section>

          {/* Background Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-center">
              Unser <span className="gradient-text">Background</span>
            </h2>
            <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-800/50">
              <p className="text-lg text-gray-200 leading-relaxed mb-4">
                UGC-VZ wurde von <span className="text-emerald-400 font-semibold">famefact</span> ins Leben gerufen – einer der führenden Social Media Agenturen Deutschlands mit über 15 Jahren Erfahrung.
                Wir wissen aus erster Hand, wie kraftvoll authentischer User Generated Content ist.
              </p>
              <p className="text-lg text-gray-200 leading-relaxed">
                Gleichzeitig sehen wir täglich, dass viele großartige Projekte an unserem Agentur-Desk vorbeigehen, weil sie "zu klein" erscheinen.
                <span className="text-emerald-400 font-semibold"> Das wollten wir ändern.</span>
              </p>
            </div>
          </section>

          {/* Philosophy Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Unsere <span className="gradient-text">Philosophie</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Free Forever */}
              <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-700/30">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-purple-300">Kostenlos bleibt kostenlos</h3>
                </div>
                <p className="text-gray-200 leading-relaxed">
                  Wir verdienen kein Geld mit UGC-VZ. Stattdessen investieren wir in die Creator-Community und helfen dabei,
                  ein Ökosystem zu schaffen, in dem authentischer Content gedeihen kann. Wenn du später unsere Agentur-Services brauchst – großartig.
                  Wenn nicht – auch großartig.
                </p>
              </div>

              {/* Quality over Quantity */}
              <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/20 backdrop-blur-sm rounded-2xl p-8 border border-orange-700/30">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-orange-300">Qualität vor Quantität</h3>
                </div>
                <p className="text-gray-200 leading-relaxed">
                  Wir glauben an echte Connections, nicht an oberflächliche Matches. Jedes Profil wird gepflegt,
                  jede Anfrage hat das Potenzial für eine langfristige Partnerschaft.
                </p>
              </div>
            </div>
          </section>

          {/* Join the Movement Section */}
          <section className="mb-16">
            <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 backdrop-blur-sm rounded-2xl p-12 border border-emerald-700/30 text-center">
              <h2 className="text-3xl font-bold mb-6">
                Join the <span className="gradient-text">Movement</span>
              </h2>
              <p className="text-lg text-gray-200 leading-relaxed mb-8 max-w-3xl mx-auto">
                UGC-VZ ist mehr als eine Plattform – es ist eine Community von Creators und Brands, die authentische Geschichten schätzen.
                Hier entstehen Partnerships auf Augenhöhe, wo kreative Visionen auf unternehmerische Ziele treffen.
              </p>
              <p className="text-xl text-gray-200 leading-relaxed mb-8">
                <span className="text-emerald-400 font-semibold">Ready to connect?</span> Dann bist du hier richtig.
              </p>
              <p className="text-2xl font-bold gradient-text">
                Willkommen bei UGC-VZ – wo authentischer Content zuhause ist.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Link
                  href="/"
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105"
                >
                  Creator finden
                </Link>
                <Link
                  href="https://tally.so/r/w25dBp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105"
                >
                  Creator werden
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

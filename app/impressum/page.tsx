import Link from 'next/link';
import ResponsiveCTAButton from '@/src/components/ResponsiveCTAButton';
import LogoImage from '../components/LogoImage';

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Header */}
      <header className="py-6 px-4 sm:px-8 md:px-16 lg:px-24">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <LogoImage
              width={32}
              height={32}
              className="mr-2"
              priority
            />
            <span className="text-xl font-bold gradient-text">
              UGC VZ
            </span>
          </Link>

          <ResponsiveCTAButton />
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-8 md:px-16 lg:px-24 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="gradient-text">Impressum</span>
            </h1>
            <p className="text-xl text-gray-300">
              Angaben gemäß § 5 DDG
            </p>
          </div>

          {/* Content */}
          <div className="bg-gray-900/50 rounded-2xl p-8 md:p-12 backdrop-blur-sm border border-gray-800">
            <div className="space-y-8">

              {/* Firmenangaben */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-white">Firmenangaben</h2>
                <div className="text-gray-300 space-y-2">
                  <p className="text-lg font-medium">track by track GmbH</p>
                  <p>Schliemannstr. 23</p>
                  <p>10437 Berlin</p>
                </div>
              </section>

              {/* Vertreten durch */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-white">Vertreten durch</h2>
                <div className="text-gray-300">
                  <p>Tobias Sander</p>
                </div>
              </section>

              {/* Kontakt */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-white">Kontakt</h2>
                <div className="text-gray-300 space-y-2">
                  <p>
                    <span className="font-medium">Telefon:</span>{' '}
                    <a href="tel:+4930403665451" className="text-teal-400 hover:text-teal-300 transition-colors">
                      +49 30 403 665 451
                    </a>
                  </p>
                  <p>
                    <span className="font-medium">Telefax:</span> 030403665450
                  </p>
                  <p>
                    <span className="font-medium">E-Mail:</span>{' '}
                    <a href="mailto:hi@ugc-vz.de" className="text-teal-400 hover:text-teal-300 transition-colors">
                      hi@ugc-vz.de
                    </a>
                  </p>
                </div>
              </section>

              {/* DUNS-Nummer */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-white">DUNS-Nummer</h2>
                <div className="text-gray-300">
                  <p>34-024-8055</p>
                </div>
              </section>

              {/* Registereintrag */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-white">Registereintrag</h2>
                <div className="text-gray-300 space-y-2">
                  <p>Eintragung im Handelsregister.</p>
                  <p><span className="font-medium">Registergericht:</span> Amtsgericht Berlin-Charlottenburg</p>
                  <p><span className="font-medium">Registernummer:</span> HRB 129805 B</p>
                </div>
              </section>

              {/* Umsatzsteuer */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-white">Umsatzsteuer</h2>
                <div className="text-gray-300">
                  <p>Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:</p>
                  <p className="font-medium">DE814954842</p>
                </div>
              </section>

              {/* Verantwortlich für den Inhalt */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-white">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
                <div className="text-gray-300 space-y-2">
                  <p>Tobias Sander</p>
                  <p>Schliemannstr. 23</p>
                  <p>10437 Berlin</p>
                </div>
              </section>

              {/* Streitschlichtung */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-white">Streitschlichtung</h2>
                <div className="text-gray-300">
                  <p>
                    Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor
                    einer Verbraucherschlichtungsstelle teilzunehmen.
                  </p>
                </div>
              </section>

            </div>
          </div>

          {/* Back to Home Button */}
          <div className="text-center mt-12">
            <Link
              href="/"
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105 inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Zurück zur Startseite
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

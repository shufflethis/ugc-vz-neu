'use client';

import Image from 'next/image';
import Link from 'next/link';
import ResponsiveCTAButton from '@/src/components/ResponsiveCTAButton';

export default function AGBPage() {
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

          <ResponsiveCTAButton />
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-8 md:px-16 lg:px-24 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="gradient-text">Allgemeine Geschäftsbedingungen</span>
            </h1>
            <p className="text-xl text-gray-300">
              Transparente Regelungen für eine faire Community
            </p>
          </div>

          {/* Das Wichtigste in Kürze */}
          <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 rounded-2xl p-6 md:p-8 mb-12 border border-emerald-500/20">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              💡 Das Wichtigste in Kürze
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              UGC-VZ ist und bleibt kostenlos! Wir sind eine reine Vermittlungsplattform, die Creator und Unternehmen zusammenbringt.
              Alle Geschäfte wickelt ihr direkt miteinander ab – wir verdienen nichts daran.
            </p>
          </div>

          {/* Inhaltsverzeichnis */}
          <div className="bg-gray-900/50 rounded-2xl p-6 md:p-8 mb-12 backdrop-blur-sm border border-gray-800">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              📋 Inhaltsverzeichnis
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                "Geltungsbereich & Begriffe",
                "Kostenfreie Leistungen",
                "Registrierung & Profile",
                "Haftung & Verantwortung",
                "Datenschutz & KI-Tools",
                "Optionale Services",
                "Urheberrechte",
                "Änderungen & Kündigung",
                "Technische Verfügbarkeit",
                "Schlussbestimmungen"
              ].map((item, index) => (
                <div key={index} className="flex items-center text-gray-300">
                  <span className="text-teal-400 font-bold mr-3">{index + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-12">

            {/* Section 1 */}
            <section className="bg-gray-900/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 text-white">1. GELTUNGSBEREICH UND BEGRIFFSBESTIMMUNGEN</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">1.1 Geltungsbereich</h3>
                  <p className="text-gray-300">
                    Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Plattform UGC-VZ,
                    die von der track by track GmbH / famefact („Betreiber") betrieben wird.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">1.2 Begriffsbestimmungen</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li><strong>UGC-VZ:</strong> Das kostenlose Online-Verzeichnis für UGC Creator und Unternehmen</li>
                    <li><strong>Creator:</strong> Personen, die User Generated Content erstellen und sich auf der Plattform registrieren</li>
                    <li><strong>Unternehmen:</strong> Firmen, die nach UGC Creators suchen</li>
                    <li><strong>Nutzer:</strong> Alle Personen, die die Plattform verwenden (Creator und Unternehmen)</li>
                    <li><strong>Vermittlung:</strong> Die Bereitstellung von Kontaktmöglichkeiten zwischen Creatorn und Unternehmen</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="bg-gray-900/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 text-white">2. LEISTUNGSUMFANG UND KOSTENFREIHEIT</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">2.1 Grundleistungen</h3>
                  <p className="text-gray-300 mb-3">UGC-VZ ist eine kostenlose Vermittlungsplattform, die folgende Dienste anbietet:</p>
                  <ul className="text-gray-300 space-y-2 list-disc list-inside">
                    <li>Kostenlose Registrierung für UGC Creator</li>
                    <li>Kostenloses Durchsuchen der Creator-Profile für Unternehmen</li>
                    <li>Bereitstellung von Kontaktdaten zur direkten Kommunikation</li>
                    <li>Optionale Übermittlung von Agentur-Angeboten bei Interesse</li>
                  </ul>
                </div>

                <div className="bg-emerald-900/20 rounded-lg p-4 border border-emerald-500/30">
                  <h3 className="text-xl font-semibold mb-3 text-emerald-400 flex items-center">
                    💰 100% Kostenfrei
                  </h3>
                  <p className="text-gray-300">
                    Die Nutzung von UGC-VZ ist für alle Parteien vollständig kostenfrei.
                    Es entstehen keine Registrierungs-, Nutzungs- oder Vermittlungsgebühren.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">2.3 Rolle als Vermittler</h3>
                  <p className="text-gray-300">
                    UGC-VZ fungiert ausschließlich als Vermittlungsplattform. Alle Geschäftsbeziehungen,
                    Verträge und Zahlungen werden direkt zwischen Creatorn und Unternehmen abgewickelt.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="bg-gray-900/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 text-white">3. REGISTRIERUNG UND PROFILE</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">3.1 Creator-Profile</h3>
                  <p className="text-gray-300 mb-3">Creator können folgende Informationen hinterlegen:</p>
                  <ul className="text-gray-300 space-y-2 list-disc list-inside">
                    <li>Portfolio-Beispiele und Arbeitsproben</li>
                    <li>Kontaktdaten (Instagram, TikTok, E-Mail etc.)</li>
                    <li>Beschreibung ihrer Arbeitsweise und Spezialisierung</li>
                    <li>Präferenzen bezüglich Zusammenarbeiten</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">3.2 Datennutzung für Optimierung</h3>
                  <p className="text-gray-300">
                    Die hinterlegten Portfolio-Daten können zur Optimierung des Matching-Prozesses und zur Verbesserung
                    unserer Suchalgorithmen verwendet werden. Hierfür setzen wir DSGVO-konforme, EU-basierte KI-Tools ein.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">3.3 Kontaktaufnahme</h3>
                  <p className="text-gray-300">
                    Unternehmen erhalten direkte Kontaktdaten (Social Media Accounts, E-Mail) der Creator
                    zur eigenständigen Kontaktaufnahme.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section className="bg-gray-900/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 text-white">4. HAFTUNG UND VERANTWORTUNG</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">4.1 Haftungsausschluss</h3>
                  <p className="text-gray-300 mb-3">Der Betreiber haftet nicht für:</p>
                  <ul className="text-gray-300 space-y-2 list-disc list-inside">
                    <li>Die Qualität oder Richtigkeit der Creator-Profile</li>
                    <li>Vertragsverhandlungen zwischen Creatorn und Unternehmen</li>
                    <li>Zahlungsabwicklungen zwischen den Parteien</li>
                    <li>Streitigkeiten aus direkten Geschäftsbeziehungen</li>
                    <li>Schäden aus der Nutzung bereitgestellter Kontaktdaten</li>
                  </ul>
                </div>

                <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-500/30">
                  <h3 className="text-xl font-semibold mb-3 text-yellow-400 flex items-center">
                    ⚠️ Eigenverantwortung
                  </h3>
                  <p className="text-gray-300">
                    Alle Nutzer handeln in eigener Verantwortung. Verträge, Preisverhandlungen und Zahlungen
                    erfolgen direkt zwischen den Parteien ohne Beteiligung des Betreibers.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">4.3 Meldung von Missbrauch</h3>
                  <p className="text-gray-300">
                    Nutzer können Missbrauch oder problematische Profile über die bereitgestellten Kontaktkanäle melden.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="bg-gray-900/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 text-white">5. DATENSCHUTZ UND DATENVERARBEITUNG</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">5.1 Datenverarbeitung</h3>
                  <p className="text-gray-300">
                    Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer Datenschutzerklärung
                    und den Bestimmungen der DSGVO.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">5.2 KI-Tools</h3>
                  <p className="text-gray-300">
                    Zur Optimierung der Plattform und des Matching-Prozesses verwenden wir ausschließlich
                    DSGVO-konforme, EU-basierte KI-Tools.
                  </p>
                </div>

                <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400 flex items-center">
                    🔒 EU-Datenschutz
                  </h3>
                  <p className="text-gray-300">
                    Creator-Portfolios werden zur Verbesserung der Suchergebnisse und des Matching-Prozesses analysiert.
                    Die Daten verlassen nicht den EU-Raum.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section className="bg-gray-900/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 text-white">6. OPTIONALE AGENTUR-SERVICES</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">6.1 Freiwillige Angebote</h3>
                  <p className="text-gray-300">
                    Bei Interesse können optional Angebote der famefact-Agentur in Vermittlungs-E-Mails enthalten sein.
                    Die Inanspruchnahme ist vollständig freiwillig.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">6.2 Keine Verpflichtung</h3>
                  <p className="text-gray-300">
                    Weder Creator noch Unternehmen sind verpflichtet, Agentur-Services zu nutzen.
                    Die Plattform funktioniert vollständig unabhängig davon.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section className="bg-gray-900/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 text-white">7. URHEBERRECHTE UND NUTZUNGSRECHTE</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">7.1 Creator-Inhalte</h3>
                  <p className="text-gray-300">
                    Creator behalten alle Rechte an ihren hochgeladenen Inhalten. Mit dem Upload erteilen sie UGC-VZ
                    das Recht zur Darstellung auf der Plattform.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">7.2 Plattform-Nutzung</h3>
                  <p className="text-gray-300">
                    Der Betreiber darf anonymisierte Erfolgsbeispiele und Statistiken für Marketing-Zwecke verwenden,
                    ohne persönliche Daten preiszugeben.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section className="bg-gray-900/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 text-white">8. ÄNDERUNGEN UND KÜNDIGUNG</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">8.1 AGB-Änderungen</h3>
                  <p className="text-gray-300">
                    Änderungen dieser AGB werden den Nutzern per E-Mail mitgeteilt. Widerspruch ist binnen 30 Tagen möglich.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">8.2 Account-Löschung</h3>
                  <p className="text-gray-300">
                    Nutzer können jederzeit die Löschung ihres Profils beantragen. Creator-Profile werden binnen 30 Tagen vollständig entfernt.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 9 */}
            <section className="bg-gray-900/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 text-white">9. TECHNISCHE VERFÜGBARKEIT</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">9.1 Verfügbarkeit</h3>
                  <p className="text-gray-300">
                    Der Betreiber strebt eine hohe Verfügbarkeit der Plattform an, übernimmt jedoch keine Garantie
                    für ununterbrochene Erreichbarkeit.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">9.2 Wartungsarbeiten</h3>
                  <p className="text-gray-300">
                    Geplante Wartungsarbeiten werden nach Möglichkeit vorab angekündigt.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 10 */}
            <section className="bg-gray-900/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 text-white">10. SCHLUSSBESTIMMUNGEN</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">10.1 Anwendbares Recht</h3>
                  <p className="text-gray-300">
                    Es gilt das Recht der Bundesrepublik Deutschland.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">10.2 Gerichtsstand</h3>
                  <p className="text-gray-300">
                    Gerichtsstand ist Berlin.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-teal-400">10.3 Salvatorische Klausel</h3>
                  <p className="text-gray-300">
                    Sollten einzelne Bestimmungen unwirksam sein, bleiben die übrigen Bestimmungen davon unberührt.
                  </p>
                </div>
              </div>
            </section>

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

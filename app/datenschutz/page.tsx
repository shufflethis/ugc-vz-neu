import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import ResponsiveCTAButton from '@/src/components/ResponsiveCTAButton';

export const metadata: Metadata = {
  title: 'Datenschutz | UGC VZ',
  description: 'Datenschutzerklärung der UGC VZ Plattform. Informationen zur Verarbeitung Ihrer personenbezogenen Daten.',
  alternates: {
    canonical: 'https://ugc-vz.de/datenschutz',
  },
};

export default function DatenschutzPage() {
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
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="gradient-text">Datenschutzerklärung</span>
            </h1>
            <p className="text-xl text-gray-300">
              Transparenz und Schutz Ihrer persönlichen Daten
            </p>
          </div>

          {/* Content */}
          <div className="bg-gray-900/50 rounded-2xl p-8 md:p-12 backdrop-blur-sm border border-gray-800 space-y-12">

            {/* Section 1 */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-white">1. Datenschutz auf einen Blick</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-teal-400">Allgemeine Hinweise</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert,
                    wenn Sie UGC-VZ nutzen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
                    Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-teal-400">Datenerfassung auf UGC-VZ</h3>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-medium mb-2 text-white">Wer ist verantwortlich für die Datenerfassung?</h4>
                      <p className="text-gray-300">
                        Die Datenverarbeitung auf UGC-VZ erfolgt durch die track by track GmbH.
                        Kontaktdaten finden Sie im Abschnitt „Hinweis zur Verantwortlichen Stelle".
                      </p>
                    </div>

                    <div>
                      <h4 className="text-lg font-medium mb-2 text-white">Wie erfassen wir Ihre Daten?</h4>
                      <p className="text-gray-300 mb-3">
                        Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen:
                      </p>
                      <ul className="text-gray-300 space-y-2 list-disc list-inside ml-4">
                        <li>Creator-Registrierung über unser Anmeldeformular</li>
                        <li>Kontaktformular und Anfragen</li>
                        <li>Portfolio-Uploads und Profilinformationen</li>
                      </ul>
                      <p className="text-gray-300 mt-3">
                        Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst
                        (z.B. Internetbrowser, Betriebssystem, Uhrzeit des Seitenaufrufs).
                      </p>
                    </div>

                    <div>
                      <h4 className="text-lg font-medium mb-2 text-white">Wofür nutzen wir Ihre Daten?</h4>
                      <ul className="text-gray-300 space-y-2 list-disc list-inside ml-4">
                        <li>Bereitstellung der UGC-VZ Plattform</li>
                        <li>Vermittlung zwischen Creatorn und Unternehmen</li>
                        <li>Verbesserung unserer Suchalgorithmen</li>
                        <li>Kommunikation über Projektanfragen</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-medium mb-2 text-white">Welche Rechte haben Sie?</h4>
                      <p className="text-gray-300">
                        Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Herkunft, Empfänger und Zweck
                        Ihrer gespeicherten personenbezogenen Daten. Sie haben außerdem ein Recht auf Berichtigung oder
                        Löschung dieser Daten sowie auf Einschränkung der Verarbeitung und Widerruf erteilter Einwilligungen.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-white">2. Hosting und technische Infrastruktur</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-teal-400">Hosting-Anbieter</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Wir hosten UGC-VZ bei professionellen Hosting-Anbietern, die verschiedene Logfiles inklusive
                    Ihrer IP-Adressen erfassen. Die Verwendung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO
                    aufgrund unseres berechtigten Interesses an einer zuverlässigen Darstellung unserer Plattform.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-teal-400">Content Delivery Network (CDN)</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Zur Optimierung der Ladezeiten nutzen wir CDN-Services, die den Datenverkehr zwischen
                    Ihrem Browser und unserer Website analysieren können. Dies dient der sicheren und
                    effizienten Bereitstellung unseres Webangebotes.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-white">3. Allgemeine Hinweise und Pflichtinformationen</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-teal-400">Hinweis zur verantwortlichen Stelle</h3>
                  <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                    <p className="text-gray-300 mb-4">Die verantwortliche Stelle für die Datenverarbeitung auf UGC-VZ ist:</p>
                    <div className="text-gray-300 space-y-2">
                      <p className="font-semibold text-white">track by track GmbH</p>
                      <p>Schliemannstr. 23</p>
                      <p>10437 Berlin</p>
                      <p className="mt-4">
                        <span className="font-medium">Telefon:</span>{' '}
                        <a href="tel:+4930403665451" className="text-teal-400 hover:text-teal-300">+49 30 403 665 451</a>
                      </p>
                      <p>
                        <span className="font-medium">E-Mail:</span>{' '}
                        <a href="mailto:hi@ugc-vz.de" className="text-teal-400 hover:text-teal-300">hi@ugc-vz.de</a>
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-teal-400">Datenschutzbeauftragter</h3>
                  <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                    <div className="text-gray-300 space-y-2">
                      <p className="font-semibold text-white">Jan Kriedner</p>
                      <p>Schliemannstr. 23</p>
                      <p>10437 Berlin</p>
                      <p className="mt-4">
                        <span className="font-medium">Telefon:</span>{' '}
                        <a href="tel:+4930403665451" className="text-teal-400 hover:text-teal-300">+49 30 403 665 451</a>
                      </p>
                      <p>
                        <span className="font-medium">E-Mail:</span>{' '}
                        <a href="mailto:hi@ugc-vz.de" className="text-teal-400 hover:text-teal-300">hi@ugc-vz.de</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-white">4. UGC Creator Datenbank</h2>

              <div className="space-y-6">
                <div className="bg-teal-900/20 rounded-lg p-6 border border-teal-500/30">
                  <h3 className="text-xl font-semibold mb-4 text-teal-400">Besondere Hinweise für UGC Creator</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Als UGC Creator auf unserer Plattform gelten für Sie besondere Datenschutzbestimmungen
                    bezüglich der Erhebung, Verarbeitung und Weitergabe Ihrer Profildaten.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-teal-400">Datensammlung</h3>
                  <p className="text-gray-300 mb-3">
                    Wir sammeln die Informationen, die Sie aktiv in unserem Registrierungsformular angeben:
                  </p>
                  <ul className="text-gray-300 space-y-2 list-disc list-inside ml-4">
                    <li>Name, Alter und Kontaktdaten</li>
                    <li>Social Media Profile (Instagram, TikTok, etc.)</li>
                    <li>Portfolio-Beispiele und Arbeitsproben</li>
                    <li>Erfahrungen und Spezialisierungen</li>
                    <li>Technische Ausrüstung und Präferenzen</li>
                    <li>Verfügbarkeit und Preisvorstellungen</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-teal-400">Nutzung Ihrer Daten</h3>
                  <p className="text-gray-300 mb-3">Ihre Daten nutzen wir für folgende Zwecke:</p>
                  <ul className="text-gray-300 space-y-2 list-disc list-inside ml-4">
                    <li>Pflege einer durchsuchbaren UGC Creator Datenbank</li>
                    <li>Kontaktaufnahme bezüglich passender Projekte und Kooperationen</li>
                    <li>Weiterleitung von Anfragen durch Unternehmen</li>
                    <li>Verbesserung unserer Matching-Algorithmen</li>
                    <li>Bereitstellung maßgeschneiderter Angebote</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-teal-400">Datenweitergabe an Unternehmen</h3>
                  <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-500/30 mb-4">
                    <p className="text-gray-300">
                      <strong>Wichtiger Hinweis:</strong> Wir können die von Ihnen angegebenen Profil-, Kontakt-
                      und Social-Media-Daten an Unternehmen weiterleiten, wenn diese eine passende Creator-Anfrage
                      stellen oder bestimmte Creator bewusst für eine Anfrage auswählen.
                    </p>
                  </div>
                  <p className="text-gray-300 mb-3">
                    Die Weitergabe erfolgt nur im Rahmen der Creator-Vermittlung und Projektanbahnung. Unternehmen
                    dürfen die Daten insbesondere nicht für fremde Zwecke, Spam oder den Aufbau eigener Datenbanken nutzen.
                  </p>
                  <ul className="text-gray-300 space-y-2 list-disc list-inside ml-4">
                    <li>Ihre Privatsphäre zu respektieren</li>
                    <li>Die Sicherheit Ihrer Daten zu gewährleisten</li>
                    <li>Ihre Daten nur für den vereinbarten Zweck zu nutzen</li>
                    <li>Ihre Daten nach Projektende zu löschen</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-teal-400">KI-gestützte Datenverarbeitung</h3>
                  <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
                    <p className="text-gray-300 mb-3">
                      UGC-VZ kann KI-Dienste verwenden, um Suchanfragen von Unternehmen zu verstehen und passende
                      Creator-Vorschläge zu sortieren. Die KI trifft keine verbindliche Entscheidung darüber,
                      ob ein Creator geeignet ist oder einen Auftrag erhält.
                    </p>
                    <ul className="text-gray-300 space-y-2 list-disc list-inside ml-4">
                      <li>An den KI-Dienst wird grundsätzlich nur die Suchanfrage des Unternehmens übermittelt.</li>
                      <li>Die vollständige Creator-Datenbank wird nicht an den KI-Dienst gesendet.</li>
                      <li>Das anschließende Matching erfolgt serverseitig anhand der bei UGC-VZ gespeicherten Profilangaben.</li>
                      <li>Als KI-Infrastruktur kann OpenRouter mit angebundenen Sprachmodellen eingesetzt werden.</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-teal-400">Eingesetzte Dienstleister</h3>
                  <p className="text-gray-300 mb-3">
                    Für Betrieb, Formulare, Datenhaltung, Benachrichtigungen und Kommunikation können insbesondere
                    folgende Dienstleister eingesetzt werden:
                  </p>
                  <ul className="text-gray-300 space-y-2 list-disc list-inside ml-4">
                    <li>Vercel für Hosting und technische Auslieferung der Website</li>
                    <li>Tally für Creator- und Anfrageformulare</li>
                    <li>Airtable für die Verwaltung der Creator-Datenbank</li>
                    <li>Resend für transaktionale E-Mails an anfragende Unternehmen</li>
                    <li>Slack für interne Benachrichtigungen und Mitschnitte von Anfragen</li>
                    <li>OpenRouter für KI-gestützte Analyse von Suchanfragen</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-white">5. Ihre Rechte als Betroffener</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-teal-400">Auskunft, Berichtigung und Löschung</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten,
                    deren Herkunft und Empfänger sowie den Zweck der Datenverarbeitung. Außerdem haben Sie ein Recht auf
                    Berichtigung oder Löschung dieser Daten.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-teal-400">Widerruf Ihrer Einwilligung</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Sie können eine bereits erteilte Einwilligung zur Datenverarbeitung jederzeit widerrufen.
                    Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt davon unberührt.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-teal-400">Widerspruchsrecht</h3>
                  <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
                    <p className="text-gray-300 font-medium mb-2">WICHTIGER HINWEIS:</p>
                    <p className="text-gray-300">
                      Sie haben jederzeit das Recht, aus Gründen Ihrer besonderen Situation gegen die Verarbeitung
                      Ihrer personenbezogenen Daten Widerspruch einzulegen. Dies gilt auch für ein auf diese
                      Bestimmungen gestütztes Profiling.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-teal-400">Beschwerderecht</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Im Falle von Verstößen gegen die DSGVO steht Ihnen ein Beschwerderecht bei einer Aufsichtsbehörde zu,
                    insbesondere in dem Mitgliedstaat Ihres gewöhnlichen Aufenthalts oder des Orts des mutmaßlichen Verstoßes.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-white">6. Speicherdauer und Löschung</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-teal-400">Allgemeine Speicherdauer</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Ihre personenbezogenen Daten verbleiben bei uns, bis der Zweck für die Datenverarbeitung entfällt.
                    Bei einem berechtigten Löschersuchen oder Widerruf der Einwilligung werden Ihre Daten gelöscht,
                    sofern keine anderen rechtlich zulässigen Gründe für die Speicherung bestehen.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-teal-400">Creator-Profile</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Creator-Profile werden binnen 30 Tagen nach Ihrer Löschungsanfrage vollständig entfernt.
                    Sie können jederzeit die Löschung Ihres Profils über unser Kontaktformular beantragen.
                    Alternativ genügt eine E-Mail an hi@ugc-vz.de mit dem Hinweis, welches Profil gelöscht,
                    korrigiert oder für Brand-Anfragen deaktiviert werden soll.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-teal-400">Automatische Löschung</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Inaktive Creator-Profile werden nach 24 Monaten ohne Aktivität automatisch zur Löschung vorgemerkt
                    und nach weiteren 30 Tagen endgültig entfernt, sofern keine anderweitige Vereinbarung besteht.
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

'use client';

import Link from 'next/link';
import ResponsiveCTAButton from '@/src/components/ResponsiveCTAButton';
import LogoImage from '../components/LogoImage';
import { useState, useEffect } from 'react';

export default function CookiesPage() {
  const [klaroLoaded, setKlaroLoaded] = useState(false);

  useEffect(() => {
    // Prüfen ob Klaro geladen ist
    const checkKlaro = () => {
      if (typeof window !== 'undefined' && (window as any).klaro) {
        setKlaroLoaded(true);
      } else {
        // Nochmal in 100ms prüfen
        setTimeout(checkKlaro, 100);
      }
    };

    // Event Listener für Klaro-Loaded Event
    const handleKlaroLoaded = () => {
      setKlaroLoaded(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('klaro-loaded', handleKlaroLoaded);
    }

    checkKlaro();

    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('klaro-loaded', handleKlaroLoaded);
      }
    };
  }, []);

  const openCookieSettings = () => {
    if (typeof window !== 'undefined') {
      // Verwende das neue einfache Cookie-Banner
      if ((window as any).showCookieSettings) {
        (window as any).showCookieSettings();
      } else {
        alert('Cookie-Einstellungen werden geladen. Bitte versuchen Sie es in einem Moment erneut.');
      }
    }
  };

  const resetCookieConsent = () => {
    if (typeof window !== 'undefined') {
      // Lösche localStorage für das neue Cookie-Banner
      try {
        localStorage.removeItem('ugc-vz-cookie-consent');
      } catch (e) {
        console.log('LocalStorage konnte nicht geleert werden:', e);
      }

      // Verwende die Reset-Funktion des neuen Banners
      if ((window as any).resetCookieConsent) {
        (window as any).resetCookieConsent();
      }

      alert('Cookie-Einstellungen wurden zurückgesetzt. Die Seite wird neu geladen.');
      window.location.reload();
    }
  };

  const debugKlaro = () => {
    if (typeof window !== 'undefined') {
      console.log('=== KLARO DEBUG INFO ===');
      console.log('window.klaro:', window.klaro);
      console.log('window.klaroConfig:', window.klaroConfig);
      console.log('Klaro element:', document.getElementById('klaro'));
      console.log('Cookies:', document.cookie);

      const info = [
        `Klaro geladen: ${!!window.klaro}`,
        `Config geladen: ${!!window.klaroConfig}`,
        `Klaro Element: ${!!document.getElementById('klaro')}`,
        `Aktuelle Cookies: ${document.cookie || 'Keine'}`
      ];

      alert('Debug Info (siehe auch Konsole):\n\n' + info.join('\n'));
    }
  };

  const forceShowBanner = () => {
    if (typeof window !== 'undefined') {
      // Lösche zuerst alle Cookies
      resetCookieConsent();

      // Dann versuche das Banner zu zeigen
      setTimeout(() => {
        if ((window as any).klaro) {
          try {
            (window as any).klaro.show();
          } catch (error) {
            console.error('Fehler beim Anzeigen des Banners:', error);
          }
        }
      }, 1000);
    }
  };
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
              <span className="gradient-text">Cookie-Richtlinie</span>
            </h1>
            <p className="text-xl text-gray-300">
              Informationen über die Verwendung von Cookies auf UGC-VZ
            </p>
          </div>

          {/* Content */}
          <div className="bg-gray-900/50 rounded-2xl p-8 md:p-12 backdrop-blur-sm border border-gray-800 space-y-12">

            {/* Cookie Settings Button */}
            <div className="bg-teal-900/20 rounded-lg p-6 border border-teal-500/30 text-center">
              <h2 className="text-xl font-semibold mb-4 text-teal-400">Cookie-Einstellungen verwalten</h2>
              <p className="text-gray-300 mb-6">
                Sie können Ihre Cookie-Einstellungen jederzeit anpassen und bestimmen, welche Cookies Sie akzeptieren möchten.
              </p>
              <button
                onClick={openCookieSettings}
                disabled={!klaroLoaded}
                className={`${
                  klaroLoaded
                    ? 'bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 transform hover:scale-105'
                    : 'bg-gray-600 cursor-not-allowed'
                } text-white font-semibold py-3 px-8 rounded-lg transition-all inline-flex items-center`}
              >
                {klaroLoaded ? (
                  <>🍪 Cookie-Einstellungen öffnen</>
                ) : (
                  <>⏳ Lade Cookie-Manager...</>
                )}
              </button>
            </div>

            {/* Section 1 */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-white">Was sind Cookies?</h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  Cookies sind kleine Textdateien, die von Websites auf Ihrem Computer oder mobilen Gerät gespeichert werden.
                  Sie ermöglichen es der Website, sich an Ihre Aktionen und Präferenzen zu erinnern, sodass Sie diese nicht
                  bei jedem Besuch oder beim Navigieren zwischen den Seiten erneut eingeben müssen.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  UGC-VZ verwendet Cookies, um Ihnen die bestmögliche Benutzererfahrung zu bieten und unsere Dienste
                  kontinuierlich zu verbessern.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-white">Welche Cookies verwenden wir?</h2>

              <div className="space-y-8">
                {/* Essential Cookies */}
                <div className="bg-blue-900/20 rounded-lg p-6 border border-blue-500/30">
                  <h3 className="text-xl font-semibold mb-4 text-blue-400 flex items-center">
                    <span className="mr-2">🔧</span>
                    Essentielle Cookies (Erforderlich)
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden.
                  </p>
                  <ul className="text-gray-300 space-y-2 list-disc list-inside ml-4">
                    <li>Session-Management und Benutzeranmeldung</li>
                    <li>Sicherheitsfeatures und CSRF-Schutz</li>
                    <li>Grundlegende Website-Funktionalität</li>
                    <li>Cookie-Einstellungen speichern</li>
                  </ul>
                </div>

                {/* Analytics Cookies */}
                <div className="bg-green-900/20 rounded-lg p-6 border border-green-500/30">
                  <h3 className="text-xl font-semibold mb-4 text-green-400 flex items-center">
                    <span className="mr-2">📊</span>
                    Analyse & Performance Cookies
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren.
                  </p>
                  <ul className="text-gray-300 space-y-2 list-disc list-inside ml-4">
                    <li>Google Analytics für Website-Statistiken</li>
                    <li>Seitenaufrufe und Verweildauer messen</li>
                    <li>Beliebte Inhalte und Suchbegriffe identifizieren</li>
                    <li>Performance-Optimierung der Website</li>
                  </ul>
                </div>

                {/* Marketing Cookies */}
                <div className="bg-purple-900/20 rounded-lg p-6 border border-purple-500/30">
                  <h3 className="text-xl font-semibold mb-4 text-purple-400 flex items-center">
                    <span className="mr-2">🎯</span>
                    Marketing & Werbung Cookies
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Diese Cookies werden verwendet, um Ihnen relevante Werbung und Inhalte zu zeigen.
                  </p>
                  <ul className="text-gray-300 space-y-2 list-disc list-inside ml-4">
                    <li>Facebook Pixel für zielgerichtete Werbung</li>
                    <li>Retargeting und Lookalike Audiences</li>
                    <li>Conversion-Tracking für Werbekampagnen</li>
                    <li>Social Media Integration</li>
                  </ul>
                </div>

                {/* Preferences Cookies */}
                <div className="bg-orange-900/20 rounded-lg p-6 border border-orange-500/30">
                  <h3 className="text-xl font-semibold mb-4 text-orange-400 flex items-center">
                    <span className="mr-2">⚙️</span>
                    Präferenzen & Funktionalität Cookies
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Diese Cookies ermöglichen erweiterte Funktionen und Personalisierung.
                  </p>
                  <ul className="text-gray-300 space-y-2 list-disc list-inside ml-4">
                    <li>Benutzereinstellungen und Präferenzen</li>
                    <li>Sprachauswahl und Theme-Einstellungen</li>
                    <li>Gespeicherte Suchfilter</li>
                    <li>Favoriten und Merklisten</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-white">Ihre Rechte und Kontrolle</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-teal-400">Cookie-Einstellungen verwalten</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Sie haben die vollständige Kontrolle über Ihre Cookie-Einstellungen. Sie können:
                  </p>
                  <ul className="text-gray-300 space-y-2 list-disc list-inside ml-4 mt-4">
                    <li>Einzelne Cookie-Kategorien aktivieren oder deaktivieren</li>
                    <li>Ihre Einstellungen jederzeit über unser Cookie-Banner ändern</li>
                    <li>Alle nicht-essentiellen Cookies ablehnen</li>
                    <li>Ihre Einwilligung jederzeit widerrufen</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-teal-400">Browser-Einstellungen</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Sie können Cookies auch direkt in Ihrem Browser verwalten. Die meisten Browser ermöglichen es Ihnen:
                  </p>
                  <ul className="text-gray-300 space-y-2 list-disc list-inside ml-4 mt-4">
                    <li>Alle Cookies zu blockieren oder zu löschen</li>
                    <li>Cookies von bestimmten Websites zu blockieren</li>
                    <li>Benachrichtigungen zu erhalten, wenn Cookies gesetzt werden</li>
                    <li>Cookies beim Schließen des Browsers automatisch zu löschen</li>
                  </ul>
                </div>

                <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-500/30">
                  <p className="text-gray-300">
                    <strong>Hinweis:</strong> Das Deaktivieren bestimmter Cookies kann die Funktionalität
                    unserer Website beeinträchtigen und Ihre Benutzererfahrung verschlechtern.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-white">Kontakt</h2>
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-300 leading-relaxed">
                  Wenn Sie Fragen zu unserer Cookie-Richtlinie haben oder weitere Informationen benötigen,
                  können Sie uns jederzeit kontaktieren:
                </p>
                <div className="mt-4 space-y-2">
                  <p className="text-gray-300">
                    <span className="font-medium">E-Mail:</span>{' '}
                    <a href="mailto:hi@ugc-vz.de" className="text-teal-400 hover:text-teal-300">
                      hi@ugc-vz.de
                    </a>
                  </p>
                  <p className="text-gray-300">
                    <span className="font-medium">Telefon:</span>{' '}
                    <a href="tel:+4930403665451" className="text-teal-400 hover:text-teal-300">
                      +49 30 403 665 451
                    </a>
                  </p>
                </div>
              </div>
            </section>

          </div>

          {/* Cookie Settings Button */}
          <div className="text-center mt-12">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={openCookieSettings}
                  className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105 inline-flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Cookie-Einstellungen öffnen
                </button>

                <button
                  onClick={resetCookieConsent}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105 inline-flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Cookie-Banner zurücksetzen
                </button>

                <button
                  onClick={debugKlaro}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105 inline-flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Debug Klaro
                </button>

                <button
                  onClick={forceShowBanner}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105 inline-flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Banner forcieren
                </button>
              </div>

              <Link
                href="/"
                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105 inline-flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Zurück zur Startseite
              </Link>

              <div className="text-sm text-gray-400 mt-4">
                <p>Hinweis: Das Cookie-Banner erscheint automatisch beim ersten Besuch der Website.</p>
                <p>Verwenden Sie den Button oben, um Ihre Einstellungen zu ändern.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

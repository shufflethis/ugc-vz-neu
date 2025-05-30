'use client';

import { useState, useEffect } from 'react';

export default function SimpleCookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Prüfe ob Cookie-Einwilligung bereits gegeben wurde
    const consent = localStorage.getItem('ugc-vz-cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('ugc-vz-cookie-consent', JSON.stringify({
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now()
    }));
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptSelected = () => {
    const essential = (document.getElementById('essential') as HTMLInputElement)?.checked || true;
    const analytics = (document.getElementById('analytics') as HTMLInputElement)?.checked || false;
    const marketing = (document.getElementById('marketing') as HTMLInputElement)?.checked || false;

    localStorage.setItem('ugc-vz-cookie-consent', JSON.stringify({
      essential,
      analytics,
      marketing,
      timestamp: Date.now()
    }));
    setShowBanner(false);
    setShowSettings(false);
  };

  const declineAll = () => {
    localStorage.setItem('ugc-vz-cookie-consent', JSON.stringify({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now()
    }));
    setShowBanner(false);
    setShowSettings(false);
  };

  const openSettings = () => {
    setShowSettings(true);
  };

  const closeSettings = () => {
    setShowSettings(false);
  };

  // Funktion um Banner von außen zu öffnen
  useEffect(() => {
    (window as any).showCookieSettings = () => {
      setShowSettings(true);
    };

    (window as any).resetCookieConsent = () => {
      localStorage.removeItem('ugc-vz-cookie-consent');
      setShowBanner(true);
    };
  }, []);

  if (!showBanner && !showSettings) return null;

  return (
    <>
      {/* Cookie Banner */}
      {showBanner && !showSettings && (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 shadow-2xl border-t border-gray-700"
             style={{
               background: 'rgba(26, 26, 26, 0.95)',
               backdropFilter: 'blur(16px)'
             }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  🍪 Cookie-Einstellungen für UGC-VZ
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Wir verwenden Cookies und ähnliche Technologien, um Ihnen die bestmögliche Erfahrung auf unserer UGC Creator Plattform zu bieten.
                  Einige sind für die Funktionalität erforderlich, andere helfen uns dabei, die Website zu verbessern.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 min-w-fit">
                <button
                  onClick={openSettings}
                  className="px-4 py-2 text-sm border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 rounded-lg transition-colors"
                >
                  Einstellungen
                </button>
                <button
                  onClick={declineAll}
                  className="px-4 py-2 text-sm border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 rounded-lg transition-colors"
                >
                  Nur notwendige
                </button>
                <button
                  onClick={acceptAll}
                  className="px-6 py-2 text-sm bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all"
                >
                  Alle akzeptieren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm"
             style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="border border-gray-700/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
               style={{
                 background: 'rgba(26, 26, 26, 0.95)',
                 backdropFilter: 'blur(16px)'
               }}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Cookie-Einstellungen</h2>
                <button
                  onClick={closeSettings}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Essential Cookies */}
                <div className="border border-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">Essentielle Cookies</h3>
                    <input
                      type="checkbox"
                      id="essential"
                      checked={true}
                      disabled={true}
                      className="w-5 h-5 text-emerald-600 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-gray-300 text-sm">
                    Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden.
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="border border-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">Analyse & Performance</h3>
                    <input
                      type="checkbox"
                      id="analytics"
                      defaultChecked={false}
                      className="w-5 h-5 text-emerald-600 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-gray-300 text-sm">
                    Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren.
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="border border-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">Marketing & Werbung</h3>
                    <input
                      type="checkbox"
                      id="marketing"
                      defaultChecked={false}
                      className="w-5 h-5 text-emerald-600 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-gray-300 text-sm">
                    Diese Cookies werden verwendet, um Ihnen relevante Werbung und Inhalte zu zeigen.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button
                  onClick={declineAll}
                  className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 rounded-lg transition-colors"
                >
                  Nur notwendige
                </button>
                <button
                  onClick={acceptSelected}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all"
                >
                  Auswahl speichern
                </button>
                <button
                  onClick={acceptAll}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all"
                >
                  Alle akzeptieren
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-700/50">
                <p className="text-xs text-gray-400 text-center">
                  Weitere Informationen finden Sie in unserer{' '}
                  <a href="/datenschutz" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                    Datenschutzerklärung
                  </a>{' '}
                  und{' '}
                  <a href="/cookies" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                    Cookie-Richtlinie
                  </a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

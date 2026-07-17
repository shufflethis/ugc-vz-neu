'use client';

import { useEffect, useState } from 'react';

const CONSENT_KEY = 'ugc-vz-cookie-consent';
const GA_ID = 'G-CE33NMGRD2';

type Consent = { essential: true; analytics: boolean; timestamp: number };
type AnalyticsWindow = Window & typeof globalThis & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  showCookieSettings?: () => void;
  resetCookieConsent?: () => void;
  [key: `ga-disable-${string}`]: boolean | undefined;
};

function readConsent(): Consent | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<Consent>;
    return { essential: true, analytics: parsed.analytics === true, timestamp: Number(parsed.timestamp || 0) };
  } catch {
    return null;
  }
}

function enableAnalytics() {
  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow[`ga-disable-${GA_ID}`] = false;
  analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
  analyticsWindow.gtag = analyticsWindow.gtag || ((...args: unknown[]) => analyticsWindow.dataLayer?.push(args));
  analyticsWindow.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied' });
  analyticsWindow.gtag('js', new Date());
  analyticsWindow.gtag('config', GA_ID, { anonymize_ip: true, cookie_flags: 'SameSite=None;Secure' });
  if (!document.querySelector(`script[data-ugc-analytics="${GA_ID}"]`)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    script.dataset.ugcAnalytics = GA_ID;
    document.head.appendChild(script);
  }
}

function disableAnalytics() {
  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow[`ga-disable-${GA_ID}`] = true;
  analyticsWindow.gtag?.('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied' });
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0]?.trim();
    if (!name || !/^_ga|^_gid|^_gat/.test(name)) continue;
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.ugc-vz.de; SameSite=Lax`;
  }
}

export default function SimpleCookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const consent = readConsent();
    if (!consent) setShowBanner(true);
    else {
      setAnalytics(consent.analytics);
      if (consent.analytics) enableAnalytics();
    }
    const analyticsWindow = window as AnalyticsWindow;
    analyticsWindow.showCookieSettings = () => {
      const current = readConsent();
      setAnalytics(current?.analytics === true);
      setShowSettings(true);
    };
    analyticsWindow.resetCookieConsent = () => {
      localStorage.removeItem(CONSENT_KEY);
      disableAnalytics();
      setAnalytics(false);
      setShowSettings(false);
      setShowBanner(true);
    };
  }, []);

  function saveConsent(allowAnalytics: boolean) {
    const consent: Consent = { essential: true, analytics: allowAnalytics, timestamp: Date.now() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setAnalytics(allowAnalytics);
    if (allowAnalytics) enableAnalytics();
    else disableAnalytics();
    setShowBanner(false);
    setShowSettings(false);
  }

  if (!showBanner && !showSettings) return null;

  return (
    <>
      {showBanner && !showSettings && (
        <div className="fixed inset-x-0 bottom-0 z-[10001] border-t border-hairline bg-white p-4 shadow-lg" role="dialog" aria-label="Cookie-Einstellungen">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex-1">
              <h2 className="mb-2 text-lg font-semibold text-ink">Datenschutz-Einstellungen</h2>
              <p className="text-sm leading-relaxed text-ink-soft">Notwendige Speicherung hält die Website funktionsfähig. Google Analytics wird ausschließlich nach deiner freiwilligen Zustimmung geladen.</p>
            </div>
            <div className="flex min-w-fit flex-col gap-3 sm:flex-row">
              <button onClick={() => setShowSettings(true)} className="rounded-lg border border-hairline px-4 py-2 text-sm text-ink hover:bg-hairline">Einstellungen</button>
              <button onClick={() => saveConsent(false)} className="rounded-lg bg-surface-2 px-4 py-2 text-sm text-ink hover:bg-hairline">Nur notwendige</button>
              <button onClick={() => saveConsent(true)} className="rounded-lg bg-geo-violet px-6 py-2 text-sm font-semibold text-white hover:bg-geo-violet-soft">Analyse erlauben</button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="consent-title">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-hairline bg-white shadow-xl">
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 id="consent-title" className="text-2xl font-bold text-ink">Datenschutz-Einstellungen</h2>
                <button onClick={() => setShowSettings(false)} aria-label="Einstellungen schließen" className="text-ink-soft hover:text-ink">✕</button>
              </div>
              <div className="space-y-5">
                <div className="rounded-lg border border-hairline p-4">
                  <div className="mb-2 flex items-center justify-between"><h3 className="font-semibold text-ink">Notwendige Speicherung</h3><input type="checkbox" checked disabled aria-label="Notwendige Speicherung aktiv" /></div>
                  <p className="text-sm text-ink-soft">Speichert deine Auswahl und ermöglicht grundlegende Website-Funktionen.</p>
                </div>
                <div className="rounded-lg border border-hairline p-4">
                  <div className="mb-2 flex items-center justify-between"><label htmlFor="analytics-consent" className="font-semibold text-ink">Google Analytics</label><input id="analytics-consent" type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} /></div>
                  <p className="text-sm text-ink-soft">Wird erst nach Zustimmung geladen und hilft uns, die Nutzung der Website zu verstehen. Die Auswahl ist freiwillig und jederzeit widerrufbar.</p>
                </div>
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => saveConsent(false)} className="flex-1 rounded-lg bg-surface-2 px-4 py-3 text-ink hover:bg-hairline">Nur notwendige</button>
                <button onClick={() => saveConsent(analytics)} className="flex-1 rounded-lg bg-geo-violet px-4 py-3 font-semibold text-white hover:bg-geo-violet-soft">Auswahl speichern</button>
              </div>
              <p className="mt-6 border-t border-hairline pt-4 text-center text-xs text-ink-soft">Weitere Informationen in der <a href="/datenschutz" className="text-geo-violet">Datenschutzerklärung</a> und <a href="/cookies" className="text-geo-violet">Cookie-Richtlinie</a>.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

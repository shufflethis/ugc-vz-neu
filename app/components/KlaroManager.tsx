'use client';

import { useEffect } from 'react';
import { klaroConfig } from '../lib/klaro-config.js';

declare global {
  interface Window {
    klaro: any;
    klaroConfig: any;
  }
}

export default function KlaroManager() {
  useEffect(() => {
    // Klaro Konfiguration global verfügbar machen
    window.klaroConfig = klaroConfig;

    // Klaro dynamisch laden
    const loadKlaro = async () => {
      try {
        // Prüfen ob Klaro bereits geladen ist
        if (window.klaro) {
          console.log('Klaro ist bereits geladen');
          return;
        }

        // Klaro CSS laden
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://cdn.kiprotect.com/klaro/v0.7/klaro.min.css';
        document.head.appendChild(cssLink);

        // Custom CSS laden
        const customCssLink = document.createElement('link');
        customCssLink.rel = 'stylesheet';
        customCssLink.href = '/styles/klaro-custom.css';
        document.head.appendChild(customCssLink);

        // Klaro JS laden
        const script = document.createElement('script');
        script.src = 'https://cdn.kiprotect.com/klaro/v0.7/klaro-no-css.min.js';
        script.async = true;

        script.onload = () => {
          console.log('Klaro Script geladen');
          // Kurz warten, dann Klaro initialisieren
          setTimeout(() => {
            if (window.klaro) {
              console.log('Klaro wird initialisiert');
              window.klaro.setup(klaroConfig);

              // Event für andere Komponenten dispatchen
              window.dispatchEvent(new CustomEvent('klaro-loaded'));
            } else {
              console.error('Klaro konnte nicht geladen werden');
            }
          }, 100);
        };

        script.onerror = () => {
          console.error('Fehler beim Laden des Klaro Scripts');
        };

        document.head.appendChild(script);

      } catch (error) {
        console.error('Fehler beim Laden von Klaro:', error);
      }
    };

    loadKlaro();

    // Cleanup function
    return () => {
      // Klaro Scripts und Styles entfernen wenn Component unmounted wird
      const scripts = document.querySelectorAll('script[src*="klaro"]');
      const styles = document.querySelectorAll('link[href*="klaro"]');

      scripts.forEach(script => script.remove());
      styles.forEach(style => style.remove());
    };
  }, []);

  return (
    <>
      {/* Klaro Container */}
      <div id="klaro" />

      {/* Klaro Show Button - für manuelle Einstellungen */}
      <div
        id="klaro-show-button"
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #14b8a6 0%, #3b82f6 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 16px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 4px 14px 0 rgba(20, 184, 166, 0.3)',
          transition: 'all 0.2s ease',
          display: 'none' // Wird von Klaro automatisch angezeigt
        }}
        onClick={() => {
          if (window.klaro) {
            window.klaro.show();
          }
        }}
      >
        🍪 Cookie-Einstellungen
      </div>
    </>
  );
}

// Hilfsfunktionen für Cookie-Management
export const cookieHelpers = {
  // Prüfen ob ein Service akzeptiert wurde
  isServiceAccepted: (serviceName: string): boolean => {
    if (typeof window !== 'undefined' && window.klaro) {
      const manager = window.klaro.getManager();
      return manager.confirmed && manager.states[serviceName] === true;
    }
    return false;
  },

  // Alle akzeptierten Services abrufen
  getAcceptedServices: (): string[] => {
    if (typeof window !== 'undefined' && window.klaro) {
      const manager = window.klaro.getManager();
      if (manager.confirmed) {
        return Object.keys(manager.states).filter(key => manager.states[key] === true);
      }
    }
    return [];
  },

  // Cookie-Einstellungen anzeigen
  showSettings: (): void => {
    if (typeof window !== 'undefined' && window.klaro) {
      window.klaro.show();
    }
  },

  // Alle Cookies akzeptieren
  acceptAll: (): void => {
    if (typeof window !== 'undefined' && window.klaro) {
      const manager = window.klaro.getManager();
      manager.updateConsents(
        Object.keys(klaroConfig.services).reduce((acc, service) => {
          acc[service] = true;
          return acc;
        }, {} as Record<string, boolean>)
      );
    }
  },

  // Alle Cookies ablehnen (außer erforderliche)
  declineAll: (): void => {
    if (typeof window !== 'undefined' && window.klaro) {
      const manager = window.klaro.getManager();
      manager.updateConsents(
        Object.keys(klaroConfig.services).reduce((acc, service) => {
          const serviceConfig = klaroConfig.services.find((s: any) => s.name === service);
          acc[service] = serviceConfig?.required || false;
          return acc;
        }, {} as Record<string, boolean>)
      );
    }
  },

  // Event Listener für Cookie-Änderungen
  onConsentChange: (callback: (consents: Record<string, boolean>) => void): void => {
    if (typeof window !== 'undefined') {
      window.addEventListener('klaro-consent-changed', (event: any) => {
        callback(event.detail);
      });
    }
  }
};

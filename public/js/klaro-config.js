// Klaro Cookie Consent Configuration für UGC-VZ
window.klaroConfig = {
  version: 1,
  elementID: 'klaro',
  styling: {
    theme: ['dark', 'top', 'wide']
  },
  lang: 'de',
  mustConsent: true,
  acceptAll: true,
  hideDeclineAll: false,
  hideLearnMore: false,
  cookieName: 'ugc-vz-klaro',
  cookieExpiresAfterDays: 365,
  default: false,

  // Deutsche Übersetzungen
  translations: {
    de: {
      consentModal: {
        title: 'Cookie-Einstellungen für UGC-VZ',
        description: 'Wir verwenden Cookies und ähnliche Technologien, um Ihnen die bestmögliche Erfahrung auf unserer UGC Creator Plattform zu bieten. Einige sind für die Funktionalität der Website erforderlich, andere helfen uns dabei, die Website zu verbessern und Ihnen relevante Inhalte anzuzeigen.',
      },
      consentNotice: {
        changeDescription: 'Es gab Änderungen seit Ihrem letzten Besuch. Bitte aktualisieren Sie Ihre Einstellungen.',
        description: 'Wir verwenden Cookies und ähnliche Technologien, um Ihnen die bestmögliche Erfahrung auf UGC-VZ zu bieten.',
        learnMore: 'Mehr erfahren',
        testing: 'Test-Modus!',
      },
      ok: 'Alle akzeptieren',
      save: 'Einstellungen speichern',
      decline: 'Alle ablehnen',
      close: 'Schließen',
      acceptAll: 'Alle akzeptieren',
      acceptSelected: 'Auswahl akzeptieren',
      service: {
        disableAll: {
          title: 'Alle Services aktivieren/deaktivieren',
          description: 'Verwenden Sie diesen Schalter, um alle Services zu aktivieren oder zu deaktivieren.',
        },
        required: {
          title: '(immer erforderlich)',
          description: 'Dieser Service ist für das ordnungsgemäße Funktionieren der Website immer erforderlich',
        },
      },
      poweredBy: 'Bereitgestellt von Klaro!',
    },
  },

  // Cookie-Services definieren
  services: [
    {
      name: 'essential',
      title: 'Essentielle Cookies',
      description: 'Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden.',
      purposes: ['functionality'],
      required: true,
      optOut: false,
      onlyOnce: true,
      cookies: [
        'ugc-vz-klaro', // Klaro selbst
        /^ugc-vz-/, // Alle UGC-VZ spezifischen Cookies
      ],
    },
    {
      name: 'analytics',
      title: 'Analyse & Performance',
      description: 'Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren.',
      purposes: ['analytics'],
      required: false,
      optOut: false,
      cookies: [
        /^_ga/, // Google Analytics
        /^_gid/,
        /^_gat/,
        /^_gtag/,
      ],
      onAccept: `
        // Analytics Cookies aktivieren
        console.log('Analytics Cookies akzeptiert - Google Analytics wird initialisiert');
        if (typeof gtag !== 'undefined') {
          gtag('consent', 'update', {
            'analytics_storage': 'granted'
          });
        }
      `,
      onDecline: `
        // Analytics Cookies deaktivieren
        console.log('Analytics Cookies abgelehnt - Google Analytics wird deaktiviert');
        if (typeof gtag !== 'undefined') {
          gtag('consent', 'update', {
            'analytics_storage': 'denied'
          });
        }
      `,
    },
    {
      name: 'marketing',
      title: 'Marketing & Werbung',
      description: 'Diese Cookies werden verwendet, um Ihnen relevante Werbung und Inhalte zu zeigen und die Effektivität unserer Werbekampagnen zu messen.',
      purposes: ['marketing'],
      required: false,
      optOut: false,
      cookies: [
        /^_fbp/, // Facebook Pixel
        /^_fbc/,
        'fr', // Facebook
      ],
      onAccept: `
        // Marketing Cookies aktivieren
        console.log('Marketing Cookies akzeptiert');
      `,
      onDecline: `
        // Marketing Cookies deaktivieren
        console.log('Marketing Cookies abgelehnt');
      `,
    },
    {
      name: 'preferences',
      title: 'Präferenzen & Funktionalität',
      description: 'Diese Cookies ermöglichen erweiterte Funktionen und Personalisierung.',
      purposes: ['preferences'],
      required: false,
      optOut: false,
      cookies: [
        /^pref_/, // Präferenz-Cookies
        'theme', // Theme-Einstellungen
      ],
      onAccept: `
        // Präferenz Cookies aktivieren
        console.log('Präferenz Cookies akzeptiert');
      `,
      onDecline: `
        // Präferenz Cookies deaktivieren
        console.log('Präferenz Cookies abgelehnt');
      `,
    },
  ],

  // Zwecke definieren
  purposes: {
    analytics: {
      title: 'Analyse',
      description: 'Sammlung von Informationen über die Nutzung der Website'
    },
    marketing: {
      title: 'Marketing',
      description: 'Anzeige von personalisierten Werbeanzeigen'
    },
    preferences: {
      title: 'Präferenzen',
      description: 'Speicherung von Benutzereinstellungen'
    },
    functionality: {
      title: 'Funktionalität',
      description: 'Grundlegende Website-Funktionen'
    },
  },

  // Callback-Funktionen
  callback: function(consent, service) {
    console.log('Klaro Callback:', consent, service);
  },

  // Zusätzliche Konfiguration
  additionalClass: 'ugc-vz-klaro',
  storageMethod: 'cookie',

  // Erweiterte Einstellungen
  groupByPurpose: true,
  disablePoweredBy: false,

  // Styling-Optionen
  styling: {
    theme: ['dark', 'top', 'wide'],
  }
};

// Debug-Informationen
console.log('Klaro Config geladen:', window.klaroConfig);

// Automatische Initialisierung wenn Klaro geladen ist
document.addEventListener('DOMContentLoaded', function() {
  function initKlaro() {
    if (window.klaro && window.klaroConfig) {
      console.log('Klaro wird initialisiert...');
      try {
        window.klaro.setup(window.klaroConfig);
        console.log('Klaro erfolgreich initialisiert');
      } catch (error) {
        console.error('Fehler bei Klaro-Initialisierung:', error);
      }
    } else {
      console.log('Klaro noch nicht bereit, versuche erneut...');
      setTimeout(initKlaro, 100);
    }
  }

  // Kurz warten, dann initialisieren
  setTimeout(initKlaro, 100);
});

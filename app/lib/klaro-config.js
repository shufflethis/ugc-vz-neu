// Klaro.js Konfiguration für UGC-VZ
export const klaroConfig = {
  // Version der Konfiguration
  version: 1,

  // Element-ID für das Klaro-Widget
  elementID: 'klaro',

  // Styling-Modus
  styling: {
    theme: ['dark', 'top', 'wide'],
  },

  // Keine Übersetzungen erforderlich, da wir nur Deutsch verwenden
  lang: 'de',

  // Einstellungen
  mustConsent: true,
  acceptAll: true,
  hideDeclineAll: false,
  hideLearnMore: false,

  // Cookie-Name für die Einstellungen
  cookieName: 'ugc-vz-klaro',

  // Cookie-Einstellungen
  cookieExpiresAfterDays: 365,

  // Standard-Einstellungen
  default: false,

  // Übersetzungen
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
        optOut: {
          title: '(Opt-Out)',
          description: 'Dieser Service ist standardmäßig geladen (Sie können sich jedoch abmelden)',
        },
        purpose: 'Zweck',
        purposes: 'Zwecke',
        required: {
          title: '(immer erforderlich)',
          description: 'Dieser Service ist für das ordnungsgemäße Funktionieren der Website immer erforderlich',
        },
      },
      poweredBy: 'Bereitgestellt von Klaro!',
    },
  },

  // Services/Apps Konfiguration
  services: [
    {
      name: 'essential',
      title: 'Essentielle Cookies',
      description: 'Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden.',
      purposes: ['functionality'],
      required: true,
      optOut: false,
      onlyOnce: true,
    },
    {
      name: 'analytics',
      title: 'Analyse & Performance',
      description: 'Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren, indem sie Informationen anonym sammeln und melden.',
      purposes: ['analytics'],
      cookies: [
        /^_ga(_.*)?/, // Google Analytics
        /^_gid/,
        /^_gat/,
        /^_gtag/,
      ],
      required: false,
      optOut: false,
      onAccept: `
        // Google Analytics aktivieren
        console.log('Analytics Cookies akzeptiert - Google Analytics wird initialisiert');
        if (typeof gtag !== 'undefined') {
          gtag('consent', 'update', {
            'analytics_storage': 'granted'
          });
        }
      `,
      onDecline: `
        // Google Analytics deaktivieren
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
      cookies: [
        /^_fbp/, // Facebook Pixel
        /^_fbc/,
        'fr', // Facebook
      ],
      required: false,
      optOut: false,
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
      description: 'Diese Cookies ermöglichen es der Website, sich an Ihre Entscheidungen zu erinnern und erweiterte Funktionen bereitzustellen.',
      purposes: ['preferences'],
      cookies: [
        'ugc-vz-preferences',
        'ugc-vz-theme',
        'ugc-vz-language',
      ],
      required: false,
      optOut: false,
    },
  ],

  // Zwecke definieren
  purposes: {
    analytics: {
      title: 'Analyse',
      description: 'Sammlung von Informationen über die Nutzung der Website',
    },
    marketing: {
      title: 'Marketing',
      description: 'Anzeige von personalisierten Werbeanzeigen',
    },
    preferences: {
      title: 'Präferenzen',
      description: 'Speicherung von Benutzereinstellungen',
    },
    functionality: {
      title: 'Funktionalität',
      description: 'Grundlegende Website-Funktionen',
    },
  },
};

import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Inter } from 'next/font/google'
import Script from 'next/script';
import "./globals.css";
import Footer from "@/src/components/FooterNew";
import SimpleCookieBanner from "@/src/components/SimpleCookieBanner";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Initialize Inter font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});


export const metadata: Metadata = {
  metadataBase: new URL("https://ugc-vz.de"),
  title: {
    default: "UGC VZ - UGC Creator finden und kostenlos anmelden",
    template: "%s | UGC VZ",
  },
  description: "UGC VZ verbindet Brands und UGC Creator in Deutschland. Unternehmen finden passende Creator kostenlos, Creator melden sich gratis mit Portfolio an.",
  applicationName: "UGC VZ",
  category: "Marketing",
  keywords: "UGC Creator, UGC Creator finden, UGC Creator anmelden, UGC Plattform Deutschland, User Generated Content, Creator Vermittlung, UGC Agentur, Content Creator, UGC Marketing",
  authors: [{ name: "UGC VZ - track by track GmbH" }],
  creator: "track by track GmbH",
  publisher: "track by track GmbH",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "UGC VZ - UGC Creator finden und kostenlos anmelden",
    description: "Kostenlose UGC Plattform fuer Brands und Creator in Deutschland: Creator suchen, Kampagne beschreiben oder als Creator mit Portfolio anmelden.",
    url: "https://ugc-vz.de",
    siteName: "UGC VZ",
    locale: "de_DE",
    type: "website",
    images: [
      {
        url: "https://ugc-vz.de/ugc-vz-logo.webp",
        width: 1200,
        height: 630,
        alt: "UGC VZ - Creator Vermittlung",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UGC VZ - UGC Creator finden und kostenlos anmelden",
    description: "Kostenlose UGC Plattform fuer Brands und Creator in Deutschland.",
    images: ["https://ugc-vz.de/ugc-vz-logo.webp"],
    creator: "@Ugc_Vz",
  },
  alternates: {
    canonical: "https://ugc-vz.de",
    languages: {
      "de-DE": "https://ugc-vz.de",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className={`${GeistSans.variable} ${GeistMono.variable} ${inter.variable}`}>
      <head>
        {/* Favicon and App Icons */}
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="UGC-VZ" />
        <link rel="manifest" href="/site.webmanifest" />

        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.kiprotect.com/klaro/latest/klaro.min.css" />
        <link rel="stylesheet" href="/styles/klaro-custom.css" />

        {/* Plausible Analytics */}
        <script defer data-domain="ugc-vz.de" src="https://analytics.polymarkt.de/js/script.file-downloads.hash.outbound-links.pageview-props.revenue.tagged-events.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`
          }}
        />

        {/* Google Analytics - wird nur geladen wenn Cookies akzeptiert wurden */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-CE33NMGRD2" data-name="analytics"></script>
        <script
          data-name="analytics"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}

              // Google Consent Mode - GDPR konform
              gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied',
                'wait_for_update': 500
              });

              gtag('js', new Date());
              gtag('config', 'G-CE33NMGRD2', {
                anonymize_ip: true,
                cookie_flags: 'SameSite=None;Secure'
              });
            `
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Klaro Cookie Consent Configuration für UGC-VZ
              window.klaroConfig = {
                version: 1,
                elementID: 'klaro',
                styling: {
                  theme: ['dark', 'top', 'wide']
                },
                lang: 'de',
                mustConsent: false,
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
                      description: 'Wir verwenden Cookies und ähnliche Technologien, um Ihnen die bestmögliche Erfahrung auf unserer UGC Creator Plattform zu bieten.',
                    },
                    consentNotice: {
                      changeDescription: 'Es gab Änderungen seit Ihrem letzten Besuch. Bitte aktualisieren Sie Ihre Einstellungen.',
                      description: 'Wir verwenden Cookies und ähnliche Technologien, um Ihnen die bestmögliche Erfahrung auf UGC-VZ zu bieten.',
                      learnMore: 'Mehr erfahren',
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
                    description: 'Diese Cookies sind für die Grundfunktionen der Website erforderlich.',
                    purposes: ['functionality'],
                    required: true,
                    optOut: false,
                    onlyOnce: true,
                  },
                  {
                    name: 'analytics',
                    title: 'Analyse & Performance',
                    description: 'Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren.',
                    purposes: ['analytics'],
                    cookies: [
                      /^_ga(_.*)?/, // Google Analytics
                      /^_gid/,
                      /^_gat/,
                      /^_gtag/,
                    ],
                    required: false,
                    optOut: false,
                    onAccept: \`
                      // Google Analytics aktivieren
                      console.log('Analytics Cookies akzeptiert - Google Analytics wird initialisiert');
                      if (typeof gtag !== 'undefined') {
                        gtag('consent', 'update', {
                          'analytics_storage': 'granted'
                        });
                      }
                    \`,
                    onDecline: \`
                      // Google Analytics deaktivieren
                      console.log('Analytics Cookies abgelehnt - Google Analytics wird deaktiviert');
                      if (typeof gtag !== 'undefined') {
                        gtag('consent', 'update', {
                          'analytics_storage': 'denied'
                        });
                      }
                    \`,
                  },
                  {
                    name: 'marketing',
                    title: 'Marketing & Werbung',
                    description: 'Diese Cookies werden verwendet, um Ihnen relevante Werbung zu zeigen.',
                    purposes: ['marketing'],
                    required: false,
                    optOut: false,
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
                  functionality: {
                    title: 'Funktionalität',
                    description: 'Grundlegende Website-Funktionen'
                  },
                },
              };

              console.log('Klaro Config geladen:', window.klaroConfig);
            `
          }}
        />
        <Script src="https://cdn.kiprotect.com/klaro/latest/klaro-no-css.min.js" strategy="beforeInteractive" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Warte bis Klaro geladen ist und initialisiere
              function initializeKlaro() {
                if (typeof window.klaro !== 'undefined' && window.klaroConfig) {
                  console.log('Initialisiere Klaro...');
                  try {
                    // Prüfe ob setup Funktion existiert
                    if (typeof window.klaro.setup === 'function') {
                      window.klaro.setup(window.klaroConfig);
                      console.log('Klaro erfolgreich initialisiert');
                    } else if (typeof window.klaro.render === 'function') {
                      // Fallback für andere Klaro-Versionen
                      window.klaro.render(window.klaroConfig);
                      console.log('Klaro mit render() initialisiert');
                    } else {
                      console.log('Klaro geladen aber keine setup/render Funktion verfügbar');
                    }
                  } catch (error) {
                    console.error('Fehler bei Klaro-Initialisierung:', error);
                  }
                } else {
                  console.log('Klaro noch nicht bereit, versuche in 100ms erneut...');
                  setTimeout(initializeKlaro, 100);
                }
              }

              // Starte Initialisierung nach DOM-Load
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initializeKlaro);
              } else {
                initializeKlaro();
              }
            `
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <main className="flex-grow">{children}</main>
        <Footer />
        <SimpleCookieBanner />
        <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} />
        <div id="klaro" />
      </body>
    </html>
  )
}

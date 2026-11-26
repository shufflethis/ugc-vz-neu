import type { Metadata } from "next";
import "@fontsource-variable/inter";
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import "./globals.css";
import Footer from "@/src/components/FooterNew";
import SiteHeader from "./components/SiteHeader";
import PromoBanner from "./components/PromoBanner";
import MotionProvider from "./components/motion/MotionProvider";
import WebMcpAgentLayer from "./components/WebMcpAgentLayer";
import PublicOnly from './components/PublicOnly';
import SiteAnalytics from './components/SiteAnalytics';
import { getActivePromo } from './lib/platform-pricing';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const metadata: Metadata = {
  metadataBase: new URL("https://ugc-vz.de"),
  title: {
    default: "UGC VZ: Creator-Kampagnen nach Views für Marken in DACH",
    template: "%s | UGC VZ",
  },
  description: "Creator-Kampagnen, die Marken nach geprüften Views bezahlen, mit fester Budget-Obergrenze. Kein Abo, 15 % Servicegebühr im Budget enthalten, 0 % für Creator.",
  applicationName: "UGC VZ",
  category: "Marketing",
  keywords: "UGC VZ, Creator Kampagnen, Pay per View UGC, UGC Creator Deutschland, User Generated Content, Creator Plattform DACH, TikTok Kampagnen, Instagram Reels Creator",
  authors: [{ name: "UGC VZ, track by track GmbH" }],
  creator: "track by track GmbH",
  publisher: "track by track GmbH",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "UGC VZ: Creator-Kampagnen nach Views für Marken in DACH",
    description: "Du legst Preis pro 1.000 Views und Budget-Obergrenze fest. Creator posten auf TikTok und Instagram. Bezahlt werden nur geprüfte Views.",
    url: "https://ugc-vz.de",
    siteName: "UGC VZ",
    locale: "de_DE",
    type: "website",
    images: [
      {
        url: "https://ugc-vz.de/og-image.png",
        width: 1200,
        height: 630,
        alt: "UGC VZ: Creator-Kampagnen nach Views",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UGC VZ: Creator-Kampagnen nach Views für Marken in DACH",
    description: "Creator-Kampagnen nach geprüften Views mit fester Budget-Obergrenze. Kein Abo, 0 % Gebühr für Creator.",
    images: ["https://ugc-vz.de/og-image.png"],
    creator: "@Ugc_Vz",
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
    <html lang="de" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* Favicon and App Icons */}
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="UGC VZ" />
        <meta name="theme-color" content="#06458F" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="flex flex-col min-h-screen bg-white text-[#202124] antialiased">
        <MotionProvider>
          <PublicOnly>
            <PromoBanner initialPromo={getActivePromo(new Date())} />
            <SiteHeader />
          </PublicOnly>
          <main className="relative isolate flex-grow">
            {children}
          </main>
          <PublicOnly>
            <Footer />
            <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} />
            {/* WebMCP: Agent-Tools via navigator.modelContext (rendert nichts) */}
            <WebMcpAgentLayer />
          </PublicOnly>
        </MotionProvider>
        <SiteAnalytics />
      </body>
    </html>
  )
}

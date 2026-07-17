import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import "./globals.css";
import Footer from "@/src/components/FooterNew";
import SimpleCookieBanner from "@/src/components/SimpleCookieBanner";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    <html lang="de" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* Favicon and App Icons */}
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="UGC-VZ" />
        <link rel="manifest" href="/site.webmanifest" />

      </head>
      <body className="flex flex-col min-h-screen">
        <main className="flex-grow">{children}</main>
        <Footer />
        <SimpleCookieBanner />
        <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} />
      </body>
    </html>
  )
}

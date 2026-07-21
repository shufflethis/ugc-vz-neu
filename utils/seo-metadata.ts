import type { Metadata } from 'next';

const SITE_URL = 'https://ugc-vz.de';
const SITE_NAME = 'UGC VZ';

// Next.js merged Metadata nur flach: Sobald eine Seite `openGraph` setzt, ersetzt
// das den kompletten Block des Root-Layouts — images, siteName und locale gehen
// dabei verloren. Dieser Helper baut den Block vollstaendig auf, damit Unterseiten
// eine korrekte og:url bekommen, ohne ihr Vorschaubild zu verlieren.
const OG_IMAGE = {
  url: `${SITE_URL}/ugc-vz-logo.webp`,
  width: 1200,
  height: 630,
  alt: 'UGC VZ - Creator Vermittlung',
};

type PageMetadataInput = {
  /** Pfad mit fuehrendem Slash, z. B. '/brands/ugc-agentur-berlin' */
  path: string;
  /** Ohne Markensuffix — das haengt das title.template des Root-Layouts an. */
  title: string;
  description: string;
  keywords?: string;
};

export function pageMetadata({ path, title, description, keywords }: PageMetadataInput): Metadata {
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: url },
    openGraph: {
      // og:title erbt das title.template nicht, daher hier explizit mit Suffix.
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'de_DE',
      type: 'website',
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

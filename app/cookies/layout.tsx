import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie-Richtlinie | UGC VZ',
  description: 'Cookie-Richtlinie der UGC VZ Plattform. Informationen über die verwendeten Cookies und Ihre Einstellungsmöglichkeiten.',
  alternates: {
    canonical: 'https://ugc-vz.de/cookies',
  },
};

export default function CookiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

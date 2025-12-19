import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ | UGC VZ',
  description: 'Häufig gestellte Fragen zur UGC VZ Plattform. Antworten für Creators und Unternehmen.',
  alternates: {
    canonical: 'https://ugc-vz.de/faq',
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AGB | UGC VZ',
  description: 'Allgemeine Geschäftsbedingungen der UGC VZ Plattform für die Vermittlung von UGC Creators.',
  alternates: {
    canonical: 'https://ugc-vz.de/agb',
  },
};

export default function AGBLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

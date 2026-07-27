import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookies und Reichweitenmessung',
  description: 'Informationen zur cookielosen Reichweitenmessung mit Plausible Analytics auf UGC VZ.',
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

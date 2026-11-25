import type { Metadata } from 'next';
import VerifyClient from './VerifyClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Brand-Anmeldung bestätigen',
  robots: { index: false, follow: false },
};

export default function BrandVerifyPage({ searchParams }: { searchParams?: { token?: string } }) {
  return <VerifyClient token={searchParams?.token || ''} />;
}

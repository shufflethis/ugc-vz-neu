import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { authorizeSiteDemo } from '@/app/lib/collab-demo-auth';
import { CREATOR_COUNT_LABEL } from '@/app/lib/creator-count';
import UgcVzV2Shell from './UgcVzV2Shell';
import type { DemoSection } from './data';

export const demoMetadata: Metadata = {
  title: 'UGC VZ 2.0 · Geschützte Vorschau',
  description: 'Passwortgeschützte Vorschau der neuen Plattform-Architektur.',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  alternates: { canonical: null, languages: {} },
  openGraph: {
    title: 'UGC VZ 2.0 · Private Vorschau',
    description: 'Geschützte Vorschau.',
    url: undefined,
    images: [],
  },
  twitter: {
    title: 'UGC VZ 2.0 · Private Vorschau',
    description: 'Geschützte Vorschau.',
    images: [],
  },
};

export async function renderDemoSection(section: DemoSection) {
  if (!(await authorizeSiteDemo(headers().get('authorization')))) {
    notFound();
  }
  return (
    <UgcVzV2Shell
      initialSection={section}
      creatorCountLabel={CREATOR_COUNT_LABEL}
    />
  );
}

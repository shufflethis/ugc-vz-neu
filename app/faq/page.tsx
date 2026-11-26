import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import FAQSchema from '../components/FAQSchema';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import FaqTabsClient from './FaqTabsClient';
import { FAQ_GROUPS } from './faq-data';

export const metadata: Metadata = {
  title: 'Häufige Fragen (FAQ)',
  description:
    'Klare Antworten zu UGC VZ: View-Kampagnen, Budget-Obergrenze, Gebühren, Auszahlungen für Creator, Werbekennzeichnung und Datenschutz.',
  keywords: 'UGC VZ FAQ, View Kampagne Kosten, UGC Creator Auszahlung, Gewerbe UGC, Datenschutz UGC VZ',
  openGraph: {
    title: 'Häufige Fragen (FAQ) | UGC VZ',
    description: 'Antworten für Marken und Creator zu Kampagnen nach Views, Abrechnung und Technik.',
    url: 'https://ugc-vz.de/faq',
    siteName: 'UGC VZ',
    locale: 'de_DE',
    type: 'website',
  },
  alternates: {
    canonical: 'https://ugc-vz.de/faq',
  },
};

const allFaqItems = FAQ_GROUPS.flatMap((group) => group.items);

export default function FAQPage() {
  const breadcrumbs = [
    { name: 'Home', url: 'https://ugc-vz.de' },
    { name: 'FAQ', url: 'https://ugc-vz.de/faq' },
  ];

  return (
    <div className="min-h-screen bg-white text-[#121212]">
      <FAQSchema faqItems={allFaqItems} />
      <BreadcrumbSchema items={breadcrumbs} />

      <section className="bg-[#F7F6F2] px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[880px] text-center">
          <p className="text-sm font-medium text-[#6C2BD9]">Hilfe &amp; Antworten</p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight tracking-[-0.02em] sm:text-5xl">
            Häufige Fragen zu UGC VZ
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#5C5A55] sm:text-lg">
            Kurze, klare Antworten für Marken und Creator zu View-Kampagnen, Abrechnung und Datenschutz.
          </p>
        </div>
      </section>

      <section className="bg-white px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[820px]">
          <FaqTabsClient groups={FAQ_GROUPS} />

          <div className="mt-14 rounded-[24px] bg-[#121212] p-8 text-center text-[#F7F6F2] sm:p-10">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Deine Frage war nicht dabei?
            </h2>
            <p className="mx-auto mt-2.5 max-w-md text-sm leading-6 text-[#F7F6F2]/75 sm:text-base">
              Schreib uns kurz an hi@ugc-vz.de oder buche direkt 15 Minuten mit unserem Team in Berlin.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="btn-press inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#F7F6F2] px-6 text-sm font-semibold text-[#121212] hover:opacity-90"
              >
                <span>Kontakt aufnehmen</span>
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link
                href="/brand?tab=signup"
                className="btn-press inline-flex min-h-[48px] items-center rounded-full border border-white/25 px-6 text-sm font-semibold text-[#F7F6F2] hover:border-white/60"
              >
                Kampagne starten
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

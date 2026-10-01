'use client';

import Image from 'next/image';

interface PartnerLogo {
  name: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

const partnerLogos: PartnerLogo[] = [
  {
    name: 'Vattenfall',
    src: '/images/partners/vattenfall-logo.png',
    alt: 'Vattenfall Logo',
    width: 120,
    height: 60,
  },
  {
    name: 'Casio',
    src: '/images/partners/casio-logo.png',
    alt: 'Casio Logo',
    width: 120,
    height: 60,
  },
  {
    name: 'Oxford',
    src: '/images/partners/oxford-logo.png',
    alt: 'Oxford Logo',
    width: 120,
    height: 60,
  },
  {
    name: 'Rewe',
    src: '/images/partners/rewe-logo.png',
    alt: 'Rewe Logo',
    width: 120,
    height: 60,
  },
  {
    name: 'Autohero',
    src: '/images/partners/autohero-logo.png',
    alt: 'Autohero Logo',
    width: 120,
    height: 60,
  },
  {
    name: 'Fleurop',
    src: '/images/partners/fleurop-logo.png',
    alt: 'Fleurop Logo',
    width: 120,
    height: 60,
  },
];

export default function TrustElements({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`${compact ? 'border-y border-hairline py-8 sm:py-10' : 'py-20 bg-surface'} px-5 sm:px-8 md:px-16 lg:px-24`}>
      <div className="mx-auto max-w-6xl">
        {/* Section Heading */}
        <div className={`text-center ${compact ? 'mb-6' : 'mb-16'}`}>
          <h2 className={compact ? 'text-xs font-medium leading-5 text-ink-soft sm:text-sm' : 'text-2xl sm:text-3xl md:text-4xl font-bold text-ink mb-8'}>
            Folgende Partner vertrauen auf unsere{' '}
            <span className={compact ? '' : 'gradient-text'}>Agenturarbeit</span>
          </h2>
        </div>

        {/* Partner Logos Grid */}
        <div className={`grid ${compact ? 'grid-cols-3 gap-5 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12'} items-center justify-items-center`}>
          {partnerLogos.map((logo) => (
            <div
              key={logo.name}
              className={`group flex items-center justify-center w-full ${compact ? 'h-10' : 'h-20 sm:h-24 md:h-28'}`}
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                className={`${compact ? 'max-w-[100px]' : 'max-w-full'} max-h-full object-contain partner-logo`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

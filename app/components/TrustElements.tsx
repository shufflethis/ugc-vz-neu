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

export default function TrustElements() {
  return (
    <section className="py-20 px-4 sm:px-8 md:px-16 lg:px-24 bg-gradient-to-b from-[#0D0D0D] to-[#1A1A1A]/50">
      <div className="container mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-8">
            Folgende Partner vertrauen auf unsere{' '}
            <span className="gradient-text">Agenturarbeit</span>
          </h2>
        </div>

        {/* Partner Logos Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12 items-center justify-items-center">
          {partnerLogos.map((logo) => (
            <div
              key={logo.name}
              className="group flex items-center justify-center transition-all duration-300 hover:scale-110 w-full h-20 sm:h-24 md:h-28"
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                className="max-w-full max-h-full object-contain partner-logo"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

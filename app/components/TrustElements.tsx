'use client';

import Image from 'next/image';

interface PartnerLogo {
  name: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

const PARTNER_LOGOS: PartnerLogo[] = [
  { name: 'Vattenfall', src: '/images/partners/vattenfall-logo.png', alt: 'Vattenfall', width: 128, height: 48 },
  { name: 'Casio', src: '/images/partners/casio-logo.png', alt: 'Casio', width: 128, height: 48 },
  { name: 'Oxford', src: '/images/partners/oxford-logo.png', alt: 'Oxford', width: 128, height: 48 },
  { name: 'Rewe', src: '/images/partners/rewe-logo.png', alt: 'Rewe', width: 128, height: 48 },
  { name: 'Autohero', src: '/images/partners/autohero-logo.png', alt: 'Autohero', width: 128, height: 48 },
  { name: 'Fleurop', src: '/images/partners/fleurop-logo.png', alt: 'Fleurop', width: 128, height: 48 },
];

export default function TrustElements({ compact = false }: { compact?: boolean }) {
  return (
    <section
      aria-label="Agentur-Referenzen von famefact"
      className={`${compact ? 'border-y border-[#DCE2EA] bg-white py-8 sm:py-10' : 'border-y border-[#DCE2EA] bg-[#F5F7FA] py-16 sm:py-20'} px-5 sm:px-8`}
    >
      <div className="mx-auto max-w-[1200px]">
        <p className="mb-6 text-center text-xs font-medium text-[#5C6470] sm:text-sm">
          Marken, für die das Team hinter UGC VZ bei famefact arbeitet
        </p>

        {/* Desktop: ruhige einzeilige Reihe mit mindestens 28px Hoehe */}
        <div className="hidden items-center justify-between gap-8 sm:grid sm:grid-cols-6">
          {PARTNER_LOGOS.map((logo) => (
            <div key={logo.name} className="flex h-10 items-center justify-center">
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                className="h-7 max-h-9 w-auto object-contain grayscale opacity-60 transition-[filter,opacity] duration-200 hover:grayscale-0 hover:opacity-100"
              />
            </div>
          ))}
        </div>

        {/* Mobil: langsamer Laufband-Loop (pausiert bei reduced-motion) */}
        <div className="overflow-hidden sm:hidden">
          <div className="logo-marquee-track flex w-max items-center gap-10">
            {[...PARTNER_LOGOS, ...PARTNER_LOGOS].map((logo, idx) => (
              <div
                key={`${logo.name}-${idx}`}
                aria-hidden={idx >= PARTNER_LOGOS.length}
                className="flex h-9 shrink-0 items-center justify-center"
              >
                <Image
                  src={logo.src}
                  alt={idx < PARTNER_LOGOS.length ? logo.alt : ''}
                  width={logo.width}
                  height={logo.height}
                  className="h-7 w-auto object-contain grayscale opacity-65"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

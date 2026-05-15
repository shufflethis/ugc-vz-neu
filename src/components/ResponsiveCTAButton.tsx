'use client';

import Link from 'next/link';
import { trackUGCEvents } from '../../app/lib/analytics';

interface ResponsiveCTAButtonProps {
  href?: string;
  className?: string;
}

export default function ResponsiveCTAButton({
  href = "https://tally.so/r/w25dBp",
  className = ""
}: ResponsiveCTAButtonProps) {

  const handleClick = () => {
    // Track CTA button click
    trackUGCEvents.ctaClick('header');
  };

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`
        bg-geo-violet hover:bg-geo-violet-soft
        text-white font-semibold py-2 px-4 rounded-md text-sm
        whitespace-nowrap transition-all duration-200
        shadow-md hover:shadow-lg
        transform hover:scale-105 hover:-translate-y-0.5
        ${className}
      `}
    >
      Jetzt mitmachen
    </Link>
  );
}

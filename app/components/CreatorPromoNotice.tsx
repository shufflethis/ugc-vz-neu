'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ActivePromoState } from '@/app/lib/platform-pricing';

export default function CreatorPromoNotice({ initialPromo }: { initialPromo: ActivePromoState }) {
  const [active, setActive] = useState(initialPromo.active);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/pricing/status', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ActivePromoState | null) => {
        if (!cancelled && data) setActive(Boolean(data.active));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!active) return null;

  return (
    <div className="mx-auto mb-8 max-w-3xl rounded-[12px] border border-[#06458F]/20 bg-[#EBF2FA] px-5 py-4 text-left text-sm leading-6 text-[#202124]">
      <p>
        <strong className="text-[#06458F]">Black Friday bei den Marken:</strong> Bis Montag starten Marken günstiger. Bei gleichem Budget geht mehr Geld an Creator. Schau rein, welche Kampagnen neu sind.{' '}
        <Link href="/konto" className="font-semibold text-[#06458F] underline underline-offset-2">
          Kampagnen ansehen
        </Link>
      </p>
    </div>
  );
}

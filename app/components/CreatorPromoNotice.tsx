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
    <div className="mx-auto mb-8 max-w-3xl rounded-2xl border border-[#121212]/15 bg-[#C8F04B]/25 px-5 py-4 text-left text-sm leading-6 text-[#121212]">
      <p>
        <strong>Black Friday bei den Marken:</strong> Bis Montag starten Marken günstiger. Bei gleichem Budget geht mehr Geld an Creator. Schau rein, welche Kampagnen neu sind.{' '}
        <Link href="/konto" className="font-semibold underline underline-offset-2">
          Kampagnen ansehen
        </Link>
      </p>
    </div>
  );
}

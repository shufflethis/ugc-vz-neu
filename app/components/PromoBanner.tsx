'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import {
  BLACK_FRIDAY_PROMO,
  formatCountdownParts,
  getActivePromo,
  type ActivePromoState,
} from '@/app/lib/platform-pricing';

const DISMISS_KEY = 'ugcvz_bf2026_banner_dismissed';

// Banner erscheint ausschliesslich auf Marken-Seiten (nie auf Creator-Seiten).
function isBrandPromoPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === '/' ||
    pathname === '/brands' ||
    pathname === '/preise' ||
    pathname === '/brand' ||
    pathname === '/brand/login'
  );
}

export default function PromoBanner({ initialPromo }: { initialPromo: ActivePromoState }) {
  const pathname = usePathname();
  const [promo, setPromo] = useState<ActivePromoState>(initialPromo);
  const [clockOffsetMs, setClockOffsetMs] = useState<number>(() => {
    const serverMs = Date.parse(initialPromo.serverNowIso);
    return Number.isFinite(serverMs) ? serverMs - Date.now() : 0;
  });
  const [nowMs, setNowMs] = useState<number>(() => Date.parse(initialPromo.serverNowIso) || Date.now());
  const [dismissed, setDismissed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const visibleOnRoute = isBrandPromoPath(pathname);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(DISMISS_KEY) === '1') {
        setDismissed(true);
      }
    } catch {
      // ignore storage errors
    }

    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mq) {
      setReducedMotion(mq.matches);
      const handler = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
      mq.addEventListener?.('change', handler);
      return () => mq.removeEventListener?.('change', handler);
    }
  }, []);

  // Synchronisiere echte Serverzeit (wichtig bei statisch gecachten Routen wie / oder /preise)
  useEffect(() => {
    if (!visibleOnRoute) return;
    let cancelled = false;
    fetch('/api/pricing/status', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ActivePromoState | null) => {
        if (cancelled || !data?.serverNowIso) return;
        const serverMs = Date.parse(data.serverNowIso);
        if (Number.isFinite(serverMs)) {
          setClockOffsetMs(serverMs - Date.now());
          setNowMs(serverMs);
          setPromo(data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [visibleOnRoute]);

  const liveState = useMemo(() => getActivePromo(new Date(nowMs)), [nowMs]);

  useEffect(() => {
    if (!visibleOnRoute || dismissed || !liveState.active) return;
    if (reducedMotion) return;
    const interval = window.setInterval(() => {
      const currentServerMs = Date.now() + clockOffsetMs;
      setNowMs(currentServerMs);
      if (currentServerMs > Date.parse(BLACK_FRIDAY_PROMO.endIso)) {
        setPromo(getActivePromo(new Date(currentServerMs)));
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [visibleOnRoute, dismissed, liveState.active, reducedMotion, clockOffsetMs]);

  if (!visibleOnRoute || dismissed || !liveState.active || !promo.active) {
    return null;
  }

  const countdown = formatCountdownParts(liveState.remainingMs);
  const headline = liveState.isCyberMonday
    ? 'Letzter Tag: nur noch heute 10 % Servicegebühr.'
    : 'Black Friday bis Cyber Monday: 10 % statt regulär 15 % Servicegebühr.';

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
  };

  return (
    <div
      role="region"
      aria-label="Aktionsangebot"
      className="border-b border-[#2a2a2a] bg-[#121212] text-[#F7F6F2]"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 text-xs sm:px-8 sm:text-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center rounded-full bg-[#C8F04B] px-2.5 py-0.5 text-[11px] font-bold text-[#121212]">
            10 % Aktion
          </span>
          <p className="font-medium leading-snug">
            {headline}{' '}
            <span className="font-mono font-semibold tabular-nums text-[#C8F04B] transition-opacity duration-200">
              {reducedMotion ? 'Bis Mo 30.11., 23:59 Uhr.' : `Noch ${countdown.label}`}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/brand?tab=signup"
            className="inline-flex min-h-[32px] items-center rounded-full bg-[#C8F04B] px-3.5 text-xs font-bold text-[#121212] transition-opacity hover:opacity-90"
          >
            Kampagne starten
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Aktionshinweis schließen"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#F7F6F2]/70 transition-colors hover:bg-white/10 hover:text-[#F7F6F2]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

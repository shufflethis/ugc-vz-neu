'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  calculateCampaignBudgetBreakdown,
  formatEuroFromCents,
  getActivePromo,
  type ActivePromoState,
} from '@/app/lib/platform-pricing';

interface ViewBudgetCalculatorProps {
  initialPromo?: ActivePromoState;
  defaultBudgetEur?: number;
  defaultRateEur?: number;
  compact?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
}

export default function ViewBudgetCalculator({
  initialPromo,
  defaultBudgetEur = 1000,
  defaultRateEur = 2,
  compact = false,
  ctaHref = '/brand?tab=signup',
  ctaLabel = 'Kampagne starten',
}: ViewBudgetCalculatorProps) {
  const [budgetEur, setBudgetEur] = useState(defaultBudgetEur);
  const [rateEur, setRateEur] = useState(defaultRateEur);
  const [promo, setPromo] = useState<ActivePromoState>(() => initialPromo ?? getActivePromo(new Date()));

  useEffect(() => {
    let cancelled = false;
    fetch('/api/pricing/status', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ActivePromoState | null) => {
        if (!cancelled && data?.serverNowIso) setPromo(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const serverDate = new Date(Date.parse(promo.serverNowIso) || Date.now());
  const breakdown = calculateCampaignBudgetBreakdown(budgetEur, rateEur, serverDate);
  const feePercent = Math.round(breakdown.feeRate * 100);

  return (
    <div className="rounded-[20px] border border-[#E4E1D8] bg-white p-6 shadow-[0_1px_2px_rgba(18,18,18,.06),0_8px_24px_rgba(18,18,18,.06)] sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-[#5C5A55]">Budget-Rechner</p>
          <h2 className={`${compact ? 'text-xl' : 'text-2xl'} mt-0.5 font-bold tracking-tight text-[#121212]`}>
            Rechne dein Kampagnenbudget durch
          </h2>
        </div>
        {breakdown.promoActive && (
          <span className="inline-flex items-center rounded-full bg-[#C8F04B] px-3 py-1 text-xs font-bold text-[#121212]">
            Aktion: 10 % statt 15 %
          </span>
        )}
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <label htmlFor="calc-budget" className="font-medium text-[#121212]">
              Budget-Obergrenze
            </label>
            <span className="font-mono text-base font-bold tabular-nums text-[#121212]">
              {budgetEur.toLocaleString('de-DE')} €
            </span>
          </div>
          <input
            id="calc-budget"
            type="range"
            min={200}
            max={20000}
            step={100}
            value={budgetEur}
            onChange={(e) => setBudgetEur(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#E4E1D8] accent-[#121212]"
          />
          <div className="mt-1 flex justify-between text-xs tabular-nums text-[#5C5A55]">
            <span>200 €</span>
            <span>20.000 €</span>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <label htmlFor="calc-rate" className="font-medium text-[#121212]">
              Preis pro 1.000 Views
            </label>
            <span className="font-mono text-base font-bold tabular-nums text-[#121212]">
              {rateEur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </span>
          </div>
          <input
            id="calc-rate"
            type="range"
            min={1}
            max={10}
            step={0.5}
            value={rateEur}
            onChange={(e) => setRateEur(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#E4E1D8] accent-[#121212]"
          />
          <div className="mt-1 flex justify-between text-xs tabular-nums text-[#5C5A55]">
            <span>1,00 €</span>
            <span>10,00 €</span>
          </div>
        </div>
      </div>

      {/* Aufschluesselung nach Spec 8.7 */}
      <dl className="mt-6 space-y-2.5 rounded-2xl bg-[#F7F6F2] p-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-[#5C5A55]">Budget gesamt</dt>
          <dd className="font-mono font-bold tabular-nums text-[#121212]">
            {formatEuroFromCents(breakdown.budgetCents, { hideZeroDecimals: true })}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-[#5C5A55]">davon an Creator (0 % Abzug)</dt>
          <dd className="rounded-lg bg-[#C8F04B] px-2 py-0.5 font-mono font-bold tabular-nums text-[#121212] transition-opacity duration-200">
            {formatEuroFromCents(breakdown.creatorPoolCents, { hideZeroDecimals: true })}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-[#5C5A55]">davon Servicegebühr ({feePercent} %)</dt>
          <dd className="font-mono font-semibold tabular-nums text-[#121212]">
            {formatEuroFromCents(breakdown.feeCents, { hideZeroDecimals: true })}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[#E4E1D8] pt-2.5">
          <dt className="font-medium text-[#121212]">Rechnerische Views</dt>
          <dd className="font-mono text-lg font-bold tabular-nums text-[#121212] transition-opacity duration-200">
            bis zu {breakdown.estimatedViews.toLocaleString('de-DE')} Views
          </dd>
        </div>
      </dl>

      {breakdown.promoActive && breakdown.promoBonusForCreatorsCents > 0 && (
        <div className="mt-3 rounded-xl border border-[#121212]/15 bg-[#C8F04B]/30 px-4 py-3 text-xs leading-5 text-[#121212]">
          <strong>Aktion: 10 % statt 15 %.</strong> Bei{' '}
          {formatEuroFromCents(breakdown.budgetCents, { hideZeroDecimals: true })} Budget gehen{' '}
          <strong className="tabular-nums">
            {formatEuroFromCents(breakdown.creatorPoolCents, { hideZeroDecimals: true })}
          </strong>{' '}
          statt{' '}
          <span className="tabular-nums">
            {formatEuroFromCents(breakdown.standardCreatorPoolCents, { hideZeroDecimals: true })}
          </span>{' '}
          an Creator, also{' '}
          <strong className="tabular-nums">
            {formatEuroFromCents(breakdown.promoBonusForCreatorsCents, { hideZeroDecimals: true })}
          </strong>{' '}
          mehr für Views. Gilt bis Mo 30.11.2026, 23:59 Uhr.
        </div>
      )}

      <p className="mt-4 text-sm font-medium text-[#121212]">
        Davon gehen {formatEuroFromCents(breakdown.creatorPoolCents, { hideZeroDecimals: true })} an Creator,{' '}
        {formatEuroFromCents(breakdown.feeCents, { hideZeroDecimals: true })} Servicegebühr. Mehr zahlst du nie.
      </p>
      <p className="mt-1 text-xs text-[#5C5A55]">
        Rechenbeispiel, keine garantierte Reichweite. Gezählt werden nur geprüfte Beiträge in vollen 1.000er-Schritten.
      </p>

      <div className="mt-5">
        <Link
          href={ctaHref}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#121212] px-6 text-sm font-semibold text-[#F7F6F2] transition-opacity hover:opacity-90"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}

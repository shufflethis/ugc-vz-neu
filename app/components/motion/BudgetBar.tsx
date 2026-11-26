'use client';

interface BudgetBarProps {
  /** Fraction spent in percent (0..100). Clamped automatically. */
  usedPercent: number;
  label?: string;
  darkSurface?: boolean;
  className?: string;
}

/**
 * Budget progress bar (Spec 8.10 `budget_bar`):
 * - Animates exclusively via `transform: scaleX(...)`
 * - Switches to warning `#E8A317` at >= 80 %
 * - Clamped strictly to [0, 100] %
 */
export default function BudgetBar({
  usedPercent,
  label = 'Budget-Fortschritt',
  darkSurface = false,
  className = '',
}: BudgetBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(usedPercent)));
  const isWarning = clamped >= 80;
  const fillColor = isWarning ? 'bg-[#F2072A]' : 'bg-[#06458F]';
  const trackColor = darkSurface ? 'bg-white/20' : 'bg-[#DCE2EA]';

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={`h-2.5 w-full overflow-hidden rounded-full ${trackColor} ${className}`}
    >
      <div
        className={`h-full w-full origin-left rounded-full ${fillColor} transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none`}
        style={{ transform: `scaleX(${clamped / 100})` }}
      />
    </div>
  );
}

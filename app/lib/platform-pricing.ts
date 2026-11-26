/**
 * Zentrale Plattformgebuehr- und Aktionslogik fuer UGC VZ (Spec 8.7 & 8.9).
 *
 * Verbindliche Entscheidungen (Flo, 26.11.2026):
 * - Regulaer: 15 % feste Servicegebuehr, zahlt die Marke, im Budget enthalten.
 * - Creator zahlen 0 % (der Satz pro 1.000 Views kommt vollstaendig beim Creator an).
 * - Black-Friday-bis-Cyber-Monday-Aktion: 10 % statt 15 % Servicegebuehr fuer
 *   Buchungen/Aufladungen von Fr 27.11.2026 00:00:00 MEZ bis Mo 30.11.2026 23:59:59 MEZ.
 *   Danach automatisch wieder 15 % (Serverzeit als Referenz).
 * - Einheitliche Cent-Berechnung nach Spec 8.9:
 *   feeCents = Math.round(budgetCents * rate); creatorPoolCents = budgetCents - feeCents.
 *   Beispiel 1.000 EUR: regulaer 850 EUR an Creator / 150 EUR Gebuehr;
 *   Black Friday 900 EUR an Creator / 100 EUR Gebuehr (+50 EUR mehr fuer Views).
 */

export const STANDARD_BRAND_FEE_RATE = 0.15;
export const STANDARD_BRAND_FEE_BPS = 1500;
export const CREATOR_FEE_RATE = 0;
export const CREATOR_FEE_BPS = 0;

export const BLACK_FRIDAY_PROMO = {
  code: 'BLACK_FRIDAY_2026',
  name: 'Black Friday bis Cyber Monday',
  rate: 0.1,
  rateBps: 1000,
  startIso: '2026-11-27T00:00:00+01:00',
  cyberMondayStartIso: '2026-11-30T00:00:00+01:00',
  endIso: '2026-11-30T23:59:59+01:00',
} as const;

export interface ActivePromoState {
  active: boolean;
  isCyberMonday: boolean;
  code: string | null;
  name: string | null;
  rate: number;
  rateBps: number;
  standardRate: number;
  standardRateBps: number;
  creatorFeeRate: number;
  creatorFeeBps: number;
  startsAtIso: string;
  endsAtIso: string;
  remainingMs: number;
  serverNowIso: string;
}

export interface CampaignBudgetBreakdown {
  budgetCents: number;
  ratePer1000Cents: number;
  feeRate: number;
  feeRateBps: number;
  feeCents: number;
  creatorPoolCents: number;
  standardFeeCents: number;
  standardCreatorPoolCents: number;
  promoBonusForCreatorsCents: number;
  estimatedViews: number;
  standardEstimatedViews: number;
  promoActive: boolean;
  isCyberMonday: boolean;
}

const PROMO_START_MS = Date.parse(BLACK_FRIDAY_PROMO.startIso);
const CYBER_MONDAY_START_MS = Date.parse(BLACK_FRIDAY_PROMO.cyberMondayStartIso);
const PROMO_END_MS = Date.parse(BLACK_FRIDAY_PROMO.endIso);

export function getActivePromo(now: Date = new Date()): ActivePromoState {
  const nowMs = now.getTime();
  const active = nowMs >= PROMO_START_MS && nowMs <= PROMO_END_MS;
  const isCyberMonday = active && nowMs >= CYBER_MONDAY_START_MS;

  return {
    active,
    isCyberMonday,
    code: active ? BLACK_FRIDAY_PROMO.code : null,
    name: active ? BLACK_FRIDAY_PROMO.name : null,
    rate: active ? BLACK_FRIDAY_PROMO.rate : STANDARD_BRAND_FEE_RATE,
    rateBps: active ? BLACK_FRIDAY_PROMO.rateBps : STANDARD_BRAND_FEE_BPS,
    standardRate: STANDARD_BRAND_FEE_RATE,
    standardRateBps: STANDARD_BRAND_FEE_BPS,
    creatorFeeRate: CREATOR_FEE_RATE,
    creatorFeeBps: CREATOR_FEE_BPS,
    startsAtIso: BLACK_FRIDAY_PROMO.startIso,
    endsAtIso: BLACK_FRIDAY_PROMO.endIso,
    remainingMs: active ? Math.max(0, PROMO_END_MS - nowMs) : 0,
    serverNowIso: now.toISOString(),
  };
}

export function calculateCampaignBudgetBreakdown(
  budgetEur: number,
  ratePer1000Eur: number,
  now: Date = new Date(),
): CampaignBudgetBreakdown {
  const promo = getActivePromo(now);
  const safeBudgetEur = Number.isFinite(budgetEur) && budgetEur > 0 ? budgetEur : 0;
  const safeRateEur = Number.isFinite(ratePer1000Eur) && ratePer1000Eur > 0 ? ratePer1000Eur : 0;

  const budgetCents = Math.round(safeBudgetEur * 100);
  const ratePer1000Cents = Math.round(safeRateEur * 100);

  const feeCents = Math.round(budgetCents * promo.rate);
  const creatorPoolCents = budgetCents - feeCents;

  const standardFeeCents = Math.round(budgetCents * STANDARD_BRAND_FEE_RATE);
  const standardCreatorPoolCents = budgetCents - standardFeeCents;
  const promoBonusForCreatorsCents = promo.active ? Math.max(0, creatorPoolCents - standardCreatorPoolCents) : 0;

  const estimatedViews =
    ratePer1000Cents > 0 ? Math.floor((creatorPoolCents / ratePer1000Cents) * 1000) : 0;
  const standardEstimatedViews =
    ratePer1000Cents > 0 ? Math.floor((standardCreatorPoolCents / ratePer1000Cents) * 1000) : 0;

  return {
    budgetCents,
    ratePer1000Cents,
    feeRate: promo.rate,
    feeRateBps: promo.rateBps,
    feeCents,
    creatorPoolCents,
    standardFeeCents,
    standardCreatorPoolCents,
    promoBonusForCreatorsCents,
    estimatedViews,
    standardEstimatedViews,
    promoActive: promo.active,
    isCyberMonday: promo.isCyberMonday,
  };
}

export function formatEuroFromCents(cents: number, options?: { hideZeroDecimals?: boolean }): string {
  const euros = cents / 100;
  const isWhole = cents % 100 === 0;
  if (options?.hideZeroDecimals && isWhole) {
    return `${Math.round(euros).toLocaleString('de-DE')} €`;
  }
  return `${euros.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

export function formatCountdownParts(remainingMs: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  label: string;
} {
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const label =
    days > 0
      ? `${days} T ${pad(hours)}:${pad(minutes)}:${pad(seconds)} Std.`
      : `${pad(hours)}:${pad(minutes)}:${pad(seconds)} Std.`;
  return { days, hours, minutes, seconds, label };
}

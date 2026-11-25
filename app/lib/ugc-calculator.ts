// Reine Kalkulations- und Vergleichslogik fuer den UGC-Kostenrechner.
// Basiswerte orientieren sich an der verbindlichen Preisreferenz auf
// /brands/ugc-creator-preise sowie (wo vorhanden) den echten DB-Medianen je Nische.

export type VideoFormatId = 'social_clip' | 'product_test' | 'testimonial' | 'tutorial' | 'branded_story';
export type UsageRightsId = 'organic' | 'paid_3m' | 'paid_12m' | 'buyout_24m';
export type ExperienceLevelId = 'starter' | 'experienced' | 'pro';

export interface FormatOption {
  id: VideoFormatId;
  label: string;
  lengthLabel: string;
  baseMin: number;
  baseMedian: number;
  baseMax: number;
  /** Faktoren relativ zum Einstiegsformat (Social Clip), wenn ein echter Nischen-Median vorliegt. */
  nicheMultiplier: number;
  /** Vergleichspreis Speekly (15/30/60s laut Preisseite, Stand 14.08.2026). */
  speeklyPerVideo: number;
  /** Vergleichspreis Noovid (ab 75/99/129/149 € je Laenge laut Anbieterseite). */
  noovidPerVideo: number;
}

export const VIDEO_FORMATS: FormatOption[] = [
  {
    id: 'social_clip',
    label: 'Social Clip (TikTok / Reels)',
    lengthLabel: '15–30 Sek.',
    baseMin: 150,
    baseMedian: 350,
    baseMax: 600,
    nicheMultiplier: 1.0,
    speeklyPerVideo: 119,
    noovidPerVideo: 99,
  },
  {
    id: 'product_test',
    label: 'Produkttest / Demo',
    lengthLabel: '45–60 Sek.',
    baseMin: 300,
    baseMedian: 650,
    baseMax: 1200,
    nicheMultiplier: 1.35,
    speeklyPerVideo: 139,
    noovidPerVideo: 149,
  },
  {
    id: 'testimonial',
    label: 'Testimonial / Erfahrung',
    lengthLabel: '60–90 Sek.',
    baseMin: 400,
    baseMedian: 850,
    baseMax: 1500,
    nicheMultiplier: 1.55,
    speeklyPerVideo: 139,
    noovidPerVideo: 149,
  },
  {
    id: 'tutorial',
    label: 'Tutorial / Erklärvideo',
    lengthLabel: '90–120 Sek.',
    baseMin: 500,
    baseMedian: 1100,
    baseMax: 2000,
    nicheMultiplier: 1.85,
    speeklyPerVideo: 139,
    noovidPerVideo: 149,
  },
  {
    id: 'branded_story',
    label: 'Branded Story / Hero-Ad',
    lengthLabel: 'ab 120 Sek.',
    baseMin: 800,
    baseMedian: 1500,
    baseMax: 2500,
    nicheMultiplier: 2.2,
    speeklyPerVideo: 139,
    noovidPerVideo: 149,
  },
];

export const USAGE_RIGHTS_OPTIONS: {
  id: UsageRightsId;
  label: string;
  hint: string;
  surchargePct: number;
}[] = [
  { id: 'organic', label: 'Nur organisch (inkl.)', hint: 'Eigene Social-Kanäle & Produktseite', surchargePct: 0 },
  { id: 'paid_3m', label: 'Paid Ads · 3 Monate', hint: 'Meta, TikTok & YouTube Ads (+30 %)', surchargePct: 30 },
  { id: 'paid_12m', label: 'Paid Ads · 12 Monate', hint: 'Standard für Performance-Kampagnen (+70 %)', surchargePct: 70 },
  { id: 'buyout_24m', label: 'Exklusiv / Buyout · 24 Mon.', hint: 'Umfassende Rechte + Branchen-Exklusivität (+110 %)', surchargePct: 110 },
];

export const EXPERIENCE_OPTIONS: {
  id: ExperienceLevelId;
  label: string;
  hint: string;
  factor: number;
}[] = [
  { id: 'starter', label: 'Einsteiger', hint: 'Erste Portfolios, sehr gutes Preis-Leistungs-Verhältnis', factor: 0.75 },
  { id: 'experienced', label: 'Erfahren', hint: 'Solide Ad-Erfahrung & starke Hooks (Standard)', factor: 1.0 },
  { id: 'pro', label: 'Profi / Spezialist', hint: 'Hohe Conversion-Erfahrung, Top-Equipment', factor: 1.45 },
];

export interface NichePriceBenchmark {
  slug: string;
  label: string;
  count: number;
  p25: number;
  median: number;
  p75: number;
  n: number;
}

export interface CalculatorInput {
  nicheSlug: string;
  nicheLabel: string;
  formatId: VideoFormatId;
  videoCount: number;
  extraHooks: number;
  includeRawFiles: boolean;
  usageRights: UsageRightsId;
  includeWhitelisting: boolean;
  experience: ExperienceLevelId;
  benchmark?: NichePriceBenchmark | null;
}

export interface CalculatorResult {
  perVideoLow: number;
  perVideoMid: number;
  perVideoHigh: number;
  baseProductionTotal: number;
  addonsTotal: number;
  rightsTotal: number;
  bundleDiscountPct: number;
  bundleDiscountEuro: number;
  totalLow: number;
  totalMid: number;
  totalHigh: number;
  usedLiveBenchmark: boolean;
  /** Vergleich: Was kostet dieselbe Anzahl Videos nach oeffentlichen Listenpreisen? */
  comparison: {
    ugcVzFee: number;
    speeklyEstimate: number;
    noovidEstimate: number;
    influeeExtraFeesEurApprox: number;
    tkpEstimatedViewsAt350: number;
  };
}

const roundTo5 = (value: number) => Math.max(0, Math.round(value / 5) * 5);

export function calculateUgcBudget(input: CalculatorInput): CalculatorResult {
  const format = VIDEO_FORMATS.find((f) => f.id === input.formatId) || VIDEO_FORMATS[0];
  const usage = USAGE_RIGHTS_OPTIONS.find((u) => u.id === input.usageRights) || USAGE_RIGHTS_OPTIONS[0];
  const exp = EXPERIENCE_OPTIONS.find((e) => e.id === input.experience) || EXPERIENCE_OPTIONS[1];

  const count = Math.max(1, Math.min(50, Math.round(input.videoCount || 1)));
  const extraHooks = Math.max(0, Math.min(5, Math.round(input.extraHooks || 0)));

  const useLive = Boolean(input.benchmark && input.benchmark.n >= 8 && input.benchmark.median > 0);
  const rawLow = useLive ? input.benchmark!.p25 * format.nicheMultiplier : format.baseMin;
  const rawMid = useLive ? input.benchmark!.median * format.nicheMultiplier : format.baseMedian;
  const rawHigh = useLive ? input.benchmark!.p75 * format.nicheMultiplier : format.baseMax;

  const basePerVideoLow = rawLow * exp.factor;
  const basePerVideoMid = rawMid * exp.factor;
  const basePerVideoHigh = rawHigh * exp.factor;

  const addonPct = extraHooks * 15 + (input.includeRawFiles ? 25 : 0);
  const rightsPct = usage.surchargePct + (input.includeWhitelisting ? 35 : 0);

  const bundleDiscountPct = count >= 10 ? 15 : count >= 5 ? 10 : count >= 3 ? 5 : 0;
  const discountFactor = 1 - bundleDiscountPct / 100;

  const totalMultiplier = (1 + addonPct / 100 + rightsPct / 100) * discountFactor;

  const perVideoLow = roundTo5(basePerVideoLow * totalMultiplier);
  const perVideoMid = roundTo5(basePerVideoMid * totalMultiplier);
  const perVideoHigh = roundTo5(basePerVideoHigh * totalMultiplier);

  const baseProductionTotal = roundTo5(basePerVideoMid * count);
  const addonsTotal = roundTo5(basePerVideoMid * (addonPct / 100) * count);
  const rightsTotal = roundTo5(basePerVideoMid * (rightsPct / 100) * count);
  const grossMid = baseProductionTotal + addonsTotal + rightsTotal;
  const bundleDiscountEuro = roundTo5(grossMid * (bundleDiscountPct / 100));

  const totalLow = roundTo5(perVideoLow * count);
  const totalMid = Math.max(0, grossMid - bundleDiscountEuro);
  const totalHigh = roundTo5(perVideoHigh * count);

  // Oeffentliche Referenzpreise (ohne Schaetzung fuer nicht-oeffentliche Anbieter)
  const speeklyEstimate = format.speeklyPerVideo * count;
  const noovidEstimate = format.noovidPerVideo * count;
  // Influee: $229 Monatsabo (~215 € Richtwert) + 10 % Marketplace-Fee auf das Creator-Honorar
  const influeeExtraFeesEurApprox = roundTo5(215 + totalMid * 0.1);
  // Orientierungswert fuer Pay-per-View / TKP-Vergleich bei 3,50 € / 1.000 Views
  const tkpEstimatedViewsAt350 = totalMid > 0 ? Math.round((totalMid / 3.5) * 1000) : 0;

  return {
    perVideoLow,
    perVideoMid,
    perVideoHigh,
    baseProductionTotal,
    addonsTotal,
    rightsTotal,
    bundleDiscountPct,
    bundleDiscountEuro,
    totalLow,
    totalMid,
    totalHigh,
    usedLiveBenchmark: useLive,
    comparison: {
      ugcVzFee: 0,
      speeklyEstimate,
      noovidEstimate,
      influeeExtraFeesEurApprox,
      tkpEstimatedViewsAt350,
    },
  };
}

export function buildBriefingQueryFromCalculator(input: CalculatorInput, result: CalculatorResult): string {
  const format = VIDEO_FORMATS.find((f) => f.id === input.formatId) || VIDEO_FORMATS[0];
  const usage = USAGE_RIGHTS_OPTIONS.find((u) => u.id === input.usageRights) || USAGE_RIGHTS_OPTIONS[0];
  const nichePart = input.nicheSlug && input.nicheSlug !== 'allgemein' ? `im Bereich ${input.nicheLabel}` : 'für unser Produkt';
  const extras = [
    input.extraHooks > 0 ? `inkl. ${input.extraHooks} Extra-Hooks` : '',
    input.includeRawFiles ? 'inkl. Rohmaterial' : '',
    input.includeWhitelisting ? 'inkl. Whitelisting/Spark Ads' : '',
  ].filter(Boolean).join(', ');
  return `Ich suche deutschsprachige UGC Creator ${nichePart} für ${input.videoCount}× ${format.label} (${format.lengthLabel}), Nutzung: ${usage.label}${extras ? `, ${extras}` : ''}. Budgetrahmen ca. ${result.perVideoMid} € pro Video (bezahlt).`;
}

export function buildBudgetSummaryText(input: CalculatorInput, result: CalculatorResult): string {
  const format = VIDEO_FORMATS.find((f) => f.id === input.formatId) || VIDEO_FORMATS[0];
  const usage = USAGE_RIGHTS_OPTIONS.find((u) => u.id === input.usageRights) || USAGE_RIGHTS_OPTIONS[0];
  const exp = EXPERIENCE_OPTIONS.find((e) => e.id === input.experience) || EXPERIENCE_OPTIONS[1];
  const fmt = (n: number) => `${n.toLocaleString('de-DE')} €`;
  return [
    'UGC-Budgetkalkulation (erstellt auf ugc-vz.de)',
    '---------------------------------------------',
    `Branche / Nische: ${input.nicheLabel}`,
    `Format: ${input.videoCount}× ${format.label} (${format.lengthLabel})`,
    `Creator-Level: ${exp.label}`,
    `Nutzungsrechte: ${usage.label}${input.includeWhitelisting ? ' + Whitelisting/Spark Ads' : ''}`,
    `Zusatzoptionen: ${input.extraHooks} Extra-Hooks${input.includeRawFiles ? ', Rohmaterial inklusive' : ''}`,
    '',
    `Richtwert pro Video: ca. ${fmt(result.perVideoMid)} (Spanne ${fmt(result.perVideoLow)} – ${fmt(result.perVideoHigh)})`,
    `Geschätztes Gesamtbudget: ca. ${fmt(result.totalMid)} netto (Spanne ${fmt(result.totalLow)} – ${fmt(result.totalHigh)})`,
    result.bundleDiscountPct > 0 ? `Inkl. Paket-Rabattannahme: −${result.bundleDiscountPct} % (−${fmt(result.bundleDiscountEuro)})` : '',
    'UGC VZ Vermittlungsgebühr: 0 € (Direktkontakt ohne Provision)',
    '',
    'Hinweis: Richtwerte auf Basis deutscher Markt- und Verzeichnisdaten, keine verbindlichen Festpreise.',
  ].filter(Boolean).join('\n');
}

export type IndustryCategory =
  | 'standard'
  | 'crypto_web3'
  | 'peptides_supplements'
  | 'cbd_health'
  | 'igaming_trading'
  | 'other_high_risk';

export type BrandBillingTier = 'stripe_standard' | 'high_risk_custom';
export type BrandComplianceStatus = 'approved' | 'review_required' | 'custom_psp_active' | 'rejected';
export type PreferredHighRiskPsp = 'invoice_sepa' | 'high_risk_psp' | 'crypto_usdc';

export interface IndustryCategoryMeta {
  id: IndustryCategory;
  label: string;
  shortLabel: string;
  isHighRisk: boolean;
  defaultFeeBps: number; // 1500 = 15%, 2200 = 22%, 2500 = 25%
  stripeAllowed: boolean;
  description: string;
  availableRails: string[];
}

export const INDUSTRY_CATEGORIES: Record<IndustryCategory, IndustryCategoryMeta> = {
  standard: {
    id: 'standard',
    label: 'Standard (D2C, Kosmetik, Food, Fashion, Apps, SaaS)',
    shortLabel: 'Standard',
    isHighRisk: false,
    defaultFeeBps: 1500,
    stripeAllowed: true,
    description: 'Sofortige Selbstbedienung über Stripe Connect (SEPA & DE-IBAN 0 % Aufschlag, Karte +3 %).',
    availableRails: ['SEPA-Lastschrift (0 %)', 'Virtuelle DE-IBAN (0 %)', 'Kreditkarte / Apple Pay (+3 %)'],
  },
  crypto_web3: {
    id: 'crypto_web3',
    label: 'Krypto, Web3, Token & Trading-Apps (z. B. Wallets, Exchanges)',
    shortLabel: 'Krypto / Web3',
    isHighRisk: true,
    defaultFeeBps: 2200,
    stripeAllowed: false,
    description: 'Stripe Restricted Business: Abwicklung über SEPA-Vorkasse, High-Risk-PSP oder USDC/EUR-Settlement mit Sonderzuschlag.',
    availableRails: ['SEPA-Vorkasse / Rechnung', 'High-Risk-PSP (nach Prüfung)', 'USDC / Stablecoin-Settlement'],
  },
  peptides_supplements: {
    id: 'peptides_supplements',
    label: 'Peptide, Biohacking, Nootropics & High-Risk Supplements',
    shortLabel: 'Peptide / Supplements',
    isHighRisk: true,
    defaultFeeBps: 2200,
    stripeAllowed: false,
    description: 'Peptide & regulierte Wirkstoffe erfordern Compliance-Check (Kosmetik vs. Research). Abrechnung über Sonder-Zahlungsweg mit High-Risk-Zuschlag.',
    availableRails: ['SEPA-Vorkasse / Rechnung', 'High-Risk-PSP (nach Produkt-Check)'],
  },
  cbd_health: {
    id: 'cbd_health',
    label: 'CBD, Hanf, Vapes, Telemedizin & regulierte Health-Produkte',
    shortLabel: 'CBD / Health',
    isHighRisk: true,
    defaultFeeBps: 2200,
    stripeAllowed: false,
    description: 'Stripe akzeptiert diese Branche nicht direkt. Abrechnung per Vorkasse-Rechnung oder High-Risk-PSP nach Compliance-Freigabe.',
    availableRails: ['SEPA-Vorkasse / Rechnung', 'High-Risk-PSP (nach Prüfung)'],
  },
  igaming_trading: {
    id: 'igaming_trading',
    label: 'iGaming, Sportwetten, CFD / Forex & High-Risk FinTech',
    shortLabel: 'iGaming / Trading',
    isHighRisk: true,
    defaultFeeBps: 2500,
    stripeAllowed: false,
    description: 'Erhöhte Compliance- & Chargeback-Anforderungen: individuelle Freigabe + 25 % High-Risk-Servicegebühr.',
    availableRails: ['SEPA-Vorkasse / Rechnung', 'High-Risk-PSP (nach Prüfung)'],
  },
  other_high_risk: {
    id: 'other_high_risk',
    label: 'Sonstige Sonderbranche (Stripe-Restricted / individuelle Prüfung)',
    shortLabel: 'Sonderbranche',
    isHighRisk: true,
    defaultFeeBps: 2200,
    stripeAllowed: false,
    description: 'Individuelle Abrechnung per Vorkasse oder Spezial-PSP nach kurzem Call oder E-Mail-Abstimmung.',
    availableRails: ['SEPA-Vorkasse / Rechnung', 'High-Risk-PSP (nach Prüfung)'],
  },
};

export const INDUSTRY_CATEGORY_LIST: IndustryCategoryMeta[] = Object.values(INDUSTRY_CATEGORIES);

export function normalizeIndustryCategory(raw: unknown): IndustryCategory {
  const val = String(raw ?? '').trim().toLowerCase();
  if (val in INDUSTRY_CATEGORIES) return val as IndustryCategory;
  return 'standard';
}

export function isHighRiskCategory(category: IndustryCategory | string | null | undefined): boolean {
  const norm = normalizeIndustryCategory(category);
  return INDUSTRY_CATEGORIES[norm].isHighRisk;
}

export function getHighRiskFeeBps(category: IndustryCategory | string | null | undefined): number {
  const norm = normalizeIndustryCategory(category);
  return INDUSTRY_CATEGORIES[norm].defaultFeeBps;
}

interface KeywordRule {
  category: Exclude<IndustryCategory, 'standard'>;
  patterns: Array<{ label: string; regex: RegExp }>;
}

const HIGH_RISK_RULES: KeywordRule[] = [
  {
    category: 'peptides_supplements',
    patterns: [
      { label: 'Peptide', regex: /\bpeptid\w*/i },
      { label: 'SARMs', regex: /\bsarms?\b/i },
      { label: 'Nootropics', regex: /\bnootropic\w*/i },
      { label: 'Research Chemicals', regex: /research[\s-]*chemical/i },
      { label: 'BPC-157 / TB-500', regex: /\b(bpc[\s-]?157|tb[\s-]?500|semaglutid\w*|tirzepatid\w*)\b/i },
    ],
  },
  {
    category: 'crypto_web3',
    patterns: [
      { label: 'Krypto / Crypto', regex: /\b(krypto|crypto|cryptocurrency)\w*/i },
      { label: 'Web3 / DeFi', regex: /\b(web3|defi|memecoin|altcoin|stablecoin|airdrop)\b/i },
      { label: 'Blockchain / Token', regex: /\b(bitcoin|ethereum|solana|blockchain|crypto[\s-]?wallet|nft)\b/i },
      { label: 'Trading-App', regex: /\b(krypto[\s-]?trading|crypto[\s-]?trading|token[\s-]?trading)\b/i },
    ],
  },
  {
    category: 'cbd_health',
    patterns: [
      { label: 'CBD / THC', regex: /\b(cbd|thc|cannabis|cannabinoid|hanföl|kratom)\b/i },
      { label: 'Vape / Nikotin', regex: /\b(e[\s-]?zigarette|vape|vaping|snus|nikotinbeutel)\b/i },
      { label: 'Telemedizin / Rezept', regex: /\b(telemedizin|rezeptpflichtig|apotheken[\s-]?versand)\b/i },
    ],
  },
  {
    category: 'igaming_trading',
    patterns: [
      { label: 'Casino / Glücksspiel', regex: /\b(casino|online[\s-]?casino|glücksspiel|sportwetten|igaming|spielothek)\b/i },
      { label: 'Forex / CFD', regex: /\b(forex|cfd[\s-]?trading|binary[\s-]?options|hebelzertifikat)\b/i },
      { label: 'Adult / 18+', regex: /\b(onlyfans|escort|adult[\s-]?content)\b/i },
    ],
  },
];

export interface HighRiskDetectionResult {
  flagged: boolean;
  suggestedCategory: IndustryCategory;
  matchedTerms: string[];
  feePercent: number;
  skincareNuance: boolean;
  summary: string;
}

/**
 * Erkennt typische Stripe-Restricted / High-Risk Begriffe in Marke, Domain, E-Mail, Nische oder Briefing.
 * Schuetzt das Haupt-Stripe-Konto und zeigt direkt transparente Sonderkonditionen + Call/E-Mail-Check an.
 */
export function detectHighRiskKeywords(...fields: Array<string | null | undefined>): HighRiskDetectionResult {
  const combined = fields
    .map((f) => String(f ?? ''))
    .join(' ')
    .trim();

  if (!combined) {
    return {
      flagged: false,
      suggestedCategory: 'standard',
      matchedTerms: [],
      feePercent: 15,
      skincareNuance: false,
      summary: '',
    };
  }

  for (const rule of HIGH_RISK_RULES) {
    const matched: string[] = [];
    for (const p of rule.patterns) {
      if (p.regex.test(combined)) {
        matched.push(p.label);
      }
    }
    if (matched.length > 0) {
      const meta = INDUSTRY_CATEGORIES[rule.category];
      const skincareNuance =
        rule.category === 'peptides_supplements'
        && /\b(skincare|kosmetik|serum|creme|hautpflege)\b/i.test(combined);
      const feePercent = Math.round(meta.defaultFeeBps / 100);
      const summary = skincareNuance
        ? `Hinweis (${matched.join(', ')}): Topische Skincare kann nach kurzem Produkt-Check regulär über Stripe laufen; Research-Peptide & Supplements fallen unter Stripe-Restricted (Sonder-Zahlungsweg mit ${feePercent} % Servicegebühr).`
        : `Sonderbranche erkannt (${matched.join(', ')}): Stripe akzeptiert diese Branche nicht regulär. Abrechnung läuft über Vorkasse, High-Risk-PSP oder Sonder-Settlement (${feePercent} % Servicegebühr) nach kurzem Call oder E-Mail-Check.`;

      return {
        flagged: true,
        suggestedCategory: rule.category,
        matchedTerms: matched,
        feePercent,
        skincareNuance,
        summary,
      };
    }
  }

  return {
    flagged: false,
    suggestedCategory: 'standard',
    matchedTerms: [],
    feePercent: 15,
    skincareNuance: false,
    summary: '',
  };
}

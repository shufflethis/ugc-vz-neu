import type { getDatabase } from '@/app/lib/database';

type SqlClient = ReturnType<typeof getDatabase>;

export type PayInMethod =
  | 'sepa_debit'
  | 'bank_transfer'
  | 'card'
  | 'apple_pay'
  | 'google_pay'
  | 'paypal';

export type PayoutSpeed = 'standard' | 'instant';
export type TaxCountry = 'DE' | 'AT' | 'CH';
export type OnboardingStatus = 'not_started' | 'pending' | 'verified' | 'restricted';

export const CARD_SURCHARGE_RATE = 0.03;
export const CARD_SURCHARGE_LABEL = 'Kartengebühr';
export const INSTANT_PAYOUT_FEE_RATE = 0.01;
export const INSTANT_PAYOUT_MIN_CENTS = 40;
export const INSTANT_PAYOUT_MAX_CENTS = 999_900; // 9.999 EUR
export const DEFAULT_CREATOR_MIN_PAYOUT_CENTS = Number(process.env.CREATOR_MIN_PAYOUT_CENTS || 2500);

export interface BrandWalletSnapshot {
  brandId: string;
  stripeCustomerId: string | null;
  virtualIban: string | null;
  virtualBic: string | null;
  virtualBankName: string | null;
  virtualAccountHolder: string | null;
  availableCents: number;
  reservedCents: number;
  currency: 'EUR';
}

export interface CampaignReservationSnapshot {
  campaignId: string;
  brandId: string;
  budgetCapCents: number;
  platformFeeBps: number;
  creatorPoolCapCents: number;
  reservedCents: number;
  releasedCreatorCents: number;
  releasedFeeCents: number;
  status: 'active' | 'closed';
}

export interface CreatorBalanceSnapshot {
  creatorId: string;
  stripeConnectAccountId: string | null;
  stripeOnboardingStatus: OnboardingStatus;
  pendingCents: number;
  availableCents: number;
  paidOutCents: number;
}

export interface CreatorTaxProfile {
  creatorId: string;
  legalName: string;
  country: TaxCountry;
  smallBusiness: boolean;
  taxNumber: string;
  vatId: string;
  taxId: string;
  dateOfBirth: string | null;
  street: string;
  postalCode: string;
  city: string;
  selfBillingAgreedAt: string | null;
}

export interface PayoutPreview {
  amountCents: number;
  platformFeeCents: 0;
  instantFeeCents: number;
  netPayoutCents: number;
  payoutSpeed: PayoutSpeed;
}

/**
 * Spec 8.9: 3 % Kartengebühr auf card/apple_pay/google_pay, 0 % auf sepa_debit & bank_transfer.
 */
export function calculatePayInSurchargeCents(
  amountCents: number,
  method: PayInMethod,
): { surchargeCents: number; surchargeLabel: string; totalChargedCents: number } {
  const safeAmount = Math.max(0, Math.round(amountCents));
  if (method === 'card' || method === 'apple_pay' || method === 'google_pay') {
    const surchargeCents = Math.round(safeAmount * CARD_SURCHARGE_RATE);
    return {
      surchargeCents,
      surchargeLabel: CARD_SURCHARGE_LABEL,
      totalChargedCents: safeAmount + surchargeCents,
    };
  }
  return {
    surchargeCents: 0,
    surchargeLabel: '',
    totalChargedCents: safeAmount,
  };
}

/**
 * Spec 8.8 & 8.9: Creator-Plattformgebühr immer 0 %.
 * Optional Instant Payout (nur DE/AT): 1 % Stripe-Gebühr (min 0,40 €, max 9.999 € Auszahlung).
 */
export function calculateCreatorPayoutPreview(
  amountCents: number,
  payoutSpeed: PayoutSpeed,
  country: TaxCountry = 'DE',
): PayoutPreview {
  const safeAmount = Math.max(0, Math.round(amountCents));
  if (payoutSpeed === 'instant') {
    if (country !== 'DE' && country !== 'AT') {
      throw new Error('Instant Payout ist nur für Bankkonten in Deutschland und Österreich verfügbar.');
    }
    if (safeAmount > INSTANT_PAYOUT_MAX_CENTS) {
      throw new Error('Instant Payout ist bis maximal 9.999,00 € pro Auszahlung möglich.');
    }
    const instantFeeCents = Math.max(
      INSTANT_PAYOUT_MIN_CENTS,
      Math.round(safeAmount * INSTANT_PAYOUT_FEE_RATE),
    );
    const netPayoutCents = safeAmount - instantFeeCents;
    if (netPayoutCents <= 0) {
      throw new Error('Der Betrag ist für eine Instant-Auszahlung zu niedrig.');
    }
    return {
      amountCents: safeAmount,
      platformFeeCents: 0,
      instantFeeCents,
      netPayoutCents,
      payoutSpeed: 'instant',
    };
  }

  return {
    amountCents: safeAmount,
    platformFeeCents: 0,
    instantFeeCents: 0,
    netPayoutCents: safeAmount,
    payoutSpeed: 'standard',
  };
}

/**
 * Spec 8.9 Cent-Aufteilung beim Kampagnenstart:
 * fee = Math.round(budgetCapCents * feeBps / 10000), creatorPool = budgetCapCents - fee.
 */
export function splitBudgetCapCents(budgetCapCents: number, platformFeeBps: number): {
  creatorPoolCapCents: number;
  platformFeeCapCents: number;
} {
  const safeBudget = Math.max(0, Math.round(budgetCapCents));
  const safeBps = Math.max(0, Math.min(5000, Math.round(platformFeeBps)));
  const platformFeeCapCents = Math.round((safeBudget * safeBps) / 10000);
  return {
    creatorPoolCapCents: safeBudget - platformFeeCapCents,
    platformFeeCapCents,
  };
}

export function validateCreatorTaxProfileForPayout(
  profile: CreatorTaxProfile | null,
): { valid: boolean; missingFields: string[] } {
  if (!profile) {
    return {
      valid: false,
      missingFields: [
        'Vollständiger Name',
        'Anschrift',
        'Geburtsdatum (DAC7)',
        'Steuer-ID (DAC7)',
        'Steuernummer oder USt-IdNr.',
        'Zustimmung zum Gutschriftverfahren',
      ],
    };
  }
  const missing: string[] = [];
  if (!profile.legalName.trim()) missing.push('Vollständiger Name');
  if (!profile.street.trim() || !profile.postalCode.trim() || !profile.city.trim()) {
    missing.push('Vollständige Anschrift');
  }
  if (!profile.dateOfBirth) missing.push('Geburtsdatum (DAC7)');
  if (!profile.taxId.trim()) missing.push('Steuer-ID (DAC7)');
  if (profile.country === 'AT' && !profile.vatId.trim()) {
    missing.push('USt-IdNr. (AT Reverse Charge)');
  } else if (!profile.taxNumber.trim() && !profile.vatId.trim()) {
    missing.push('Steuernummer oder USt-IdNr.');
  }
  if (!profile.selfBillingAgreedAt) {
    missing.push('Zustimmung zum Gutschriftverfahren (§ 14 Abs. 2 UStG)');
  }
  return { valid: missing.length === 0, missingFields: missing };
}

export async function ensureBrandWallet(sql: SqlClient, brandId: string): Promise<BrandWalletSnapshot> {
  await sql.query(
    `INSERT INTO brand_wallets (brand_id) VALUES ($1) ON CONFLICT (brand_id) DO NOTHING`,
    [brandId],
  );
  const [row] = await sql.query(
    `SELECT brand_id, stripe_customer_id, virtual_iban, virtual_bic, virtual_bank_name,
            virtual_account_holder, available_cents, reserved_cents, currency
     FROM brand_wallets WHERE brand_id = $1`,
    [brandId],
  );
  return {
    brandId: String(row.brand_id),
    stripeCustomerId: row.stripe_customer_id ? String(row.stripe_customer_id) : null,
    virtualIban: row.virtual_iban ? String(row.virtual_iban) : null,
    virtualBic: row.virtual_bic ? String(row.virtual_bic) : null,
    virtualBankName: row.virtual_bank_name ? String(row.virtual_bank_name) : null,
    virtualAccountHolder: row.virtual_account_holder ? String(row.virtual_account_holder) : null,
    availableCents: Number(row.available_cents || 0),
    reservedCents: Number(row.reserved_cents || 0),
    currency: 'EUR',
  };
}

export async function recordWebhookEventOnce(
  sql: SqlClient,
  eventId: string,
  eventType: string,
): Promise<boolean> {
  const rows = await sql.query(
    `INSERT INTO stripe_webhook_events (event_id, event_type)
     VALUES ($1, $2)
     ON CONFLICT (event_id) DO NOTHING
     RETURNING event_id`,
    [eventId, eventType],
  );
  return rows.length > 0;
}

export async function createPendingTopup(
  sql: SqlClient,
  input: {
    brandId: string;
    amountCents: number;
    method: PayInMethod;
    providerRef: string;
  },
): Promise<{
  id: string;
  amountCents: number;
  surchargeCents: number;
  surchargeLabel: string;
  totalChargedCents: number;
  invoiceNumber: string;
}> {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error('Aufladebetrag muss eine positive Ganzzahl in Cent sein.');
  }
  await ensureBrandWallet(sql, input.brandId);
  const { surchargeCents, surchargeLabel, totalChargedCents } = calculatePayInSurchargeCents(
    input.amountCents,
    input.method,
  );
  const year = new Date().getFullYear();
  const suffix = Math.floor(100000 + Math.random() * 900000);
  const invoiceNumber = `RE-${year}-${suffix}`;

  const [row] = await sql.query(
    `INSERT INTO wallet_topups (
       brand_id, amount_cents, surcharge_cents, surcharge_label, total_charged_cents,
       method, provider_ref, status, invoice_number
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
     RETURNING id, amount_cents, surcharge_cents, surcharge_label, total_charged_cents, invoice_number`,
    [
      input.brandId,
      input.amountCents,
      surchargeCents,
      surchargeLabel,
      totalChargedCents,
      input.method,
      input.providerRef,
      invoiceNumber,
    ],
  );
  return {
    id: String(row.id),
    amountCents: Number(row.amount_cents),
    surchargeCents: Number(row.surcharge_cents),
    surchargeLabel: String(row.surcharge_label || ''),
    totalChargedCents: Number(row.total_charged_cents),
    invoiceNumber: String(row.invoice_number),
  };
}

/**
 * Idempotentes Gutschreiben eines Top-ups im Brand-Wallet nach Stripe Webhook payment_intent.succeeded / checkout.session.completed / customer_balance.
 */
export async function settleTopupIdempotently(
  sql: SqlClient,
  input: {
    providerRef: string;
    brandId?: string;
    amountCents?: number;
    method?: PayInMethod;
  },
): Promise<{ settledNow: boolean; brandId: string; creditedCents: number }> {
  // 1. Versuche bestehendes pending Top-up atomar auf succeeded zu setzen
  const updated = await sql.query(
    `UPDATE wallet_topups
     SET status = 'succeeded', settled_at = now()
     WHERE provider_ref = $1 AND status = 'pending'
     RETURNING brand_id, amount_cents`,
    [input.providerRef],
  );

  if (updated.length > 0) {
    const brandId = String(updated[0].brand_id);
    const amountCents = Number(updated[0].amount_cents);
    await ensureBrandWallet(sql, brandId);
    await sql.query(
      `UPDATE brand_wallets
       SET available_cents = available_cents + $1, updated_at = now()
       WHERE brand_id = $2`,
      [amountCents, brandId],
    );
    return { settledNow: true, brandId, creditedCents: amountCents };
  }

  // Prüfe, ob providerRef bereits existiert (z. B. doppelter Webhook!)
  const existing = await sql.query(
    `SELECT brand_id, status, amount_cents FROM wallet_topups WHERE provider_ref = $1 LIMIT 1`,
    [input.providerRef],
  );
  if (existing.length > 0) {
    return {
      settledNow: false,
      brandId: String(existing[0].brand_id),
      creditedCents: 0,
    };
  }

  // 2. Direkter Eingang (z. B. Überweisung auf virtuelle DE-IBAN via Stripe customer_balance)
  if (!input.brandId || !input.amountCents || input.amountCents <= 0) {
    throw new Error('Unbekannte providerRef ohne brandId/amountCents.');
  }
  const method = input.method || 'bank_transfer';
  const { surchargeCents, surchargeLabel, totalChargedCents } = calculatePayInSurchargeCents(
    input.amountCents,
    method,
  );
  const year = new Date().getFullYear();
  const suffix = Math.floor(100000 + Math.random() * 900000);
  const invoiceNumber = `RE-${year}-${suffix}`;

  const inserted = await sql.query(
    `INSERT INTO wallet_topups (
       brand_id, amount_cents, surcharge_cents, surcharge_label, total_charged_cents,
       method, provider_ref, status, invoice_number, settled_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'succeeded', $8, now())
     ON CONFLICT (provider_ref) DO NOTHING
     RETURNING brand_id, amount_cents`,
    [
      input.brandId,
      input.amountCents,
      surchargeCents,
      surchargeLabel,
      totalChargedCents,
      method,
      input.providerRef,
      invoiceNumber,
    ],
  );

  if (inserted.length === 0) {
    return { settledNow: false, brandId: input.brandId, creditedCents: 0 };
  }

  await ensureBrandWallet(sql, input.brandId);
  await sql.query(
    `UPDATE brand_wallets
     SET available_cents = available_cents + $1, updated_at = now()
     WHERE brand_id = $2`,
    [input.amountCents, input.brandId],
  );

  return { settledNow: true, brandId: input.brandId, creditedCents: input.amountCents };
}

/**
 * Spec 8.5 Invariante: Kampagne startet nur, wenn brand_wallet.available_cents >= budget_cap_cents.
 * Atomare Abbuchung von available_cents -> reserved_cents.
 */
export async function reserveCampaignBudget(
  sql: SqlClient,
  input: {
    brandId: string;
    campaignId: string;
    budgetCapCents: number;
    platformFeeBps: number;
  },
): Promise<CampaignReservationSnapshot> {
  if (!Number.isInteger(input.budgetCapCents) || input.budgetCapCents <= 0) {
    throw new Error('budget_cap_cents muss größer als 0 sein.');
  }

  await ensureBrandWallet(sql, input.brandId);

  // Prüfe, ob bereits reserviert (idempotent)
  const existing = await sql.query(
    `SELECT campaign_id, brand_id, budget_cap_cents, platform_fee_bps, creator_pool_cap_cents,
            reserved_cents, released_creator_cents, released_fee_cents, status
     FROM campaign_reservations WHERE campaign_id = $1 LIMIT 1`,
    [input.campaignId],
  );
  if (existing.length > 0) {
    const r = existing[0];
    return {
      campaignId: String(r.campaign_id),
      brandId: String(r.brand_id),
      budgetCapCents: Number(r.budget_cap_cents),
      platformFeeBps: Number(r.platform_fee_bps),
      creatorPoolCapCents: Number(r.creator_pool_cap_cents),
      reservedCents: Number(r.reserved_cents),
      releasedCreatorCents: Number(r.released_creator_cents),
      releasedFeeCents: Number(r.released_fee_cents),
      status: String(r.status) as 'active' | 'closed',
    };
  }

  // Atomarer Guard: available_cents >= budget_cap_cents
  const debited = await sql.query(
    `UPDATE brand_wallets
     SET available_cents = available_cents - $1,
         reserved_cents = reserved_cents + $1,
         updated_at = now()
     WHERE brand_id = $2 AND available_cents >= $1
     RETURNING brand_id`,
    [input.budgetCapCents, input.brandId],
  );

  if (debited.length === 0) {
    throw new Error('Nicht genügend verfügbares Guthaben im Marken-Wallet für diese Budget-Obergrenze.');
  }

  const { creatorPoolCapCents } = splitBudgetCapCents(input.budgetCapCents, input.platformFeeBps);

  const [created] = await sql.query(
    `INSERT INTO campaign_reservations (
       campaign_id, brand_id, budget_cap_cents, platform_fee_bps,
       creator_pool_cap_cents, reserved_cents, status
     ) VALUES ($1, $2, $3, $4, $5, $3, 'active')
     RETURNING campaign_id, brand_id, budget_cap_cents, platform_fee_bps, creator_pool_cap_cents,
               reserved_cents, released_creator_cents, released_fee_cents, status`,
    [input.campaignId, input.brandId, input.budgetCapCents, input.platformFeeBps, creatorPoolCapCents],
  );

  return {
    campaignId: String(created.campaign_id),
    brandId: String(created.brand_id),
    budgetCapCents: Number(created.budget_cap_cents),
    platformFeeBps: Number(created.platform_fee_bps),
    creatorPoolCapCents: Number(created.creator_pool_cap_cents),
    reservedCents: Number(created.reserved_cents),
    releasedCreatorCents: Number(created.released_creator_cents),
    releasedFeeCents: Number(created.released_fee_cents),
    status: String(created.status) as 'active' | 'closed',
  };
}

/**
 * Spec 8.5 & 8.7 Concurrency-sichere Freigabe einer geprüften Submission:
 * - counted_thousands = floor(viewsAtCutoff / 1000)
 * - Atomares Row-Locking auf campaign_reservations garantiert:
 *   released_creator_cents <= creator_pool_cap_cents UND
 *   released_creator_cents + released_fee_cents <= budget_cap_cents — selbst bei 5+ gleichzeitigen Requests!
 */
export async function settleCountedSubmission(
  sql: SqlClient,
  input: {
    campaignId: string;
    submissionId: string;
    creatorId: string;
    viewsAtCutoff: number;
    ratePer1000Cents: number;
    reviewNote?: string;
  },
): Promise<{
  settledNow: boolean;
  countedThousands: number;
  grantedCreatorCents: number;
  grantedFeeCents: number;
  remainingReservedCents: number;
}> {
  const safeViews = Math.max(0, Math.floor(input.viewsAtCutoff));
  const countedThousands = Math.floor(safeViews / 1000);
  const requestedCreatorCents = countedThousands * Math.max(0, Math.round(input.ratePer1000Cents));

  // 1. Idempotenz-Lock auf submission_id
  const claim = await sql.query(
    `INSERT INTO submission_settlements (
       submission_id, campaign_id, creator_id, views_at_cutoff, counted_thousands,
       rate_per_1000_cents, amount_cents, platform_fee_cents, status, review_note
     ) VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 'in_review', $7)
     ON CONFLICT (submission_id) DO NOTHING
     RETURNING id`,
    [
      input.submissionId,
      input.campaignId,
      input.creatorId,
      safeViews,
      countedThousands,
      Math.max(0, Math.round(input.ratePer1000Cents)),
      input.reviewNote || '',
    ],
  );

  if (claim.length === 0) {
    const [existing] = await sql.query(
      `SELECT counted_thousands, amount_cents, platform_fee_cents FROM submission_settlements WHERE submission_id = $1`,
      [input.submissionId],
    );
    const [resRow] = await sql.query(
      `SELECT reserved_cents FROM campaign_reservations WHERE campaign_id = $1`,
      [input.campaignId],
    );
    return {
      settledNow: false,
      countedThousands: Number(existing?.counted_thousands || 0),
      grantedCreatorCents: Number(existing?.amount_cents || 0),
      grantedFeeCents: Number(existing?.platform_fee_cents || 0),
      remainingReservedCents: Number(resRow?.reserved_cents || 0),
    };
  }

  // 2. Atomare Buchung gegen campaign_reservations (PostgreSQL serialisiert Schreibzugriffe auf dieselbe Zeile!)
  const updatedRes = await sql.query(
    `UPDATE campaign_reservations
     SET
       last_delta_creator_cents = LEAST($1::bigint, GREATEST(0::bigint, creator_pool_cap_cents - released_creator_cents)),
       last_delta_fee_cents = LEAST(
         budget_cap_cents - (released_creator_cents + LEAST($1::bigint, GREATEST(0::bigint, creator_pool_cap_cents - released_creator_cents))),
         COALESCE(
           ROUND(
             (released_creator_cents + LEAST($1::bigint, GREATEST(0::bigint, creator_pool_cap_cents - released_creator_cents)))::numeric
             * platform_fee_bps::numeric
             / NULLIF(10000 - platform_fee_bps, 0)
           )::bigint,
           0::bigint
         )
       ) - released_fee_cents,
       released_creator_cents = released_creator_cents + LEAST($1::bigint, GREATEST(0::bigint, creator_pool_cap_cents - released_creator_cents)),
       released_fee_cents = LEAST(
         budget_cap_cents - (released_creator_cents + LEAST($1::bigint, GREATEST(0::bigint, creator_pool_cap_cents - released_creator_cents))),
         COALESCE(
           ROUND(
             (released_creator_cents + LEAST($1::bigint, GREATEST(0::bigint, creator_pool_cap_cents - released_creator_cents)))::numeric
             * platform_fee_bps::numeric
             / NULLIF(10000 - platform_fee_bps, 0)
           )::bigint,
           0::bigint
         )
       ),
       reserved_cents = GREATEST(
         0::bigint,
         budget_cap_cents
         - (released_creator_cents + LEAST($1::bigint, GREATEST(0::bigint, creator_pool_cap_cents - released_creator_cents)))
         - LEAST(
             budget_cap_cents - (released_creator_cents + LEAST($1::bigint, GREATEST(0::bigint, creator_pool_cap_cents - released_creator_cents))),
             COALESCE(
               ROUND(
                 (released_creator_cents + LEAST($1::bigint, GREATEST(0::bigint, creator_pool_cap_cents - released_creator_cents)))::numeric
                 * platform_fee_bps::numeric
                 / NULLIF(10000 - platform_fee_bps, 0)
               )::bigint,
               0::bigint
             )
           )
       )
     WHERE campaign_id = $2 AND status = 'active'
     RETURNING brand_id, last_delta_creator_cents, last_delta_fee_cents, reserved_cents`,
    [requestedCreatorCents, input.campaignId],
  );

  if (updatedRes.length === 0) {
    await sql.query(`DELETE FROM submission_settlements WHERE submission_id = $1`, [input.submissionId]);
    throw new Error('Keine aktive Budget-Reservierung für diese Kampagne gefunden.');
  }

  const brandId = String(updatedRes[0].brand_id);
  const grantedCreatorCents = Math.max(0, Number(updatedRes[0].last_delta_creator_cents || 0));
  const grantedFeeCents = Math.max(0, Number(updatedRes[0].last_delta_fee_cents || 0));
  const remainingReservedCents = Number(updatedRes[0].reserved_cents || 0);
  const totalReleasedDelta = grantedCreatorCents + grantedFeeCents;

  // 3. Finalisiere submission_settlements, reduziere brand_wallets.reserved_cents, schreibe creator_balances.available_cents gut
  await sql.query(
    `UPDATE submission_settlements
     SET amount_cents = $1, platform_fee_cents = $2, status = 'counted', settled_at = now()
     WHERE submission_id = $3`,
    [grantedCreatorCents, grantedFeeCents, input.submissionId],
  );

  if (totalReleasedDelta > 0) {
    await sql.query(
      `UPDATE brand_wallets
       SET reserved_cents = GREATEST(0, reserved_cents - $1), updated_at = now()
       WHERE brand_id = $2`,
      [totalReleasedDelta, brandId],
    );
  }

  if (grantedCreatorCents > 0) {
    await sql.query(
      `INSERT INTO creator_balances (creator_id, available_cents)
       VALUES ($1, $2)
       ON CONFLICT (creator_id) DO UPDATE
         SET available_cents = creator_balances.available_cents + EXCLUDED.available_cents,
             updated_at = now()`,
      [input.creatorId, grantedCreatorCents],
    );
  }

  return {
    settledNow: true,
    countedThousands,
    grantedCreatorCents,
    grantedFeeCents,
    remainingReservedCents,
  };
}

/**
 * Spec 8.5 Schritt "close": Ungenutztes Restreservat fließt atomar zurück in brand_wallets.available_cents.
 */
export async function closeCampaignReservation(
  sql: SqlClient,
  campaignId: string,
): Promise<{ closedNow: boolean; brandId: string; returnedCents: number }> {
  const closed = await sql.query(
    `UPDATE campaign_reservations
     SET status = 'closed',
         closed_at = now(),
         last_delta_creator_cents = reserved_cents,
         reserved_cents = 0
     WHERE campaign_id = $1 AND status = 'active'
     RETURNING brand_id, last_delta_creator_cents`,
    [campaignId],
  );

  if (closed.length === 0) {
    const [existing] = await sql.query(
      `SELECT brand_id FROM campaign_reservations WHERE campaign_id = $1 LIMIT 1`,
      [campaignId],
    );
    return {
      closedNow: false,
      brandId: existing ? String(existing.brand_id) : '',
      returnedCents: 0,
    };
  }

  const brandId = String(closed[0].brand_id);
  const returnedCents = Math.max(0, Number(closed[0].last_delta_creator_cents || 0));

  if (returnedCents > 0) {
    await sql.query(
      `UPDATE brand_wallets
       SET reserved_cents = GREATEST(0, reserved_cents - $1),
           available_cents = available_cents + $1,
           updated_at = now()
       WHERE brand_id = $2`,
      [returnedCents, brandId],
    );
  }

  return { closedNow: true, brandId, returnedCents };
}

export async function ensureCreatorBalance(
  sql: SqlClient,
  creatorId: string,
): Promise<CreatorBalanceSnapshot> {
  await sql.query(
    `INSERT INTO creator_balances (creator_id) VALUES ($1) ON CONFLICT (creator_id) DO NOTHING`,
    [creatorId],
  );
  const [row] = await sql.query(
    `SELECT creator_id, stripe_connect_account_id, stripe_onboarding_status,
            pending_cents, available_cents, paid_out_cents
     FROM creator_balances WHERE creator_id = $1`,
    [creatorId],
  );
  return {
    creatorId: String(row.creator_id),
    stripeConnectAccountId: row.stripe_connect_account_id ? String(row.stripe_connect_account_id) : null,
    stripeOnboardingStatus: String(row.stripe_onboarding_status || 'not_started') as OnboardingStatus,
    pendingCents: Number(row.pending_cents || 0),
    availableCents: Number(row.available_cents || 0),
    paidOutCents: Number(row.paid_out_cents || 0),
  };
}

export async function getCreatorTaxProfile(
  sql: SqlClient,
  creatorId: string,
): Promise<CreatorTaxProfile | null> {
  const [row] = await sql.query(
    `SELECT creator_id, legal_name, country, small_business, tax_number, vat_id,
            tax_id, date_of_birth, street, postal_code, city, self_billing_agreed_at
     FROM creator_tax_profiles WHERE creator_id = $1 LIMIT 1`,
    [creatorId],
  );
  if (!row) return null;
  return {
    creatorId: String(row.creator_id),
    legalName: String(row.legal_name || ''),
    country: (String(row.country || 'DE') as TaxCountry),
    smallBusiness: Boolean(row.small_business),
    taxNumber: String(row.tax_number || ''),
    vatId: String(row.vat_id || ''),
    taxId: String(row.tax_id || ''),
    dateOfBirth: row.date_of_birth ? String(row.date_of_birth).slice(0, 10) : null,
    street: String(row.street || ''),
    postalCode: String(row.postal_code || ''),
    city: String(row.city || ''),
    selfBillingAgreedAt: row.self_billing_agreed_at ? new Date(String(row.self_billing_agreed_at)).toISOString() : null,
  };
}

export async function upsertCreatorTaxProfile(
  sql: SqlClient,
  input: Omit<CreatorTaxProfile, 'selfBillingAgreedAt'> & { agreeSelfBilling?: boolean },
): Promise<CreatorTaxProfile> {
  const country: TaxCountry = ['DE', 'AT', 'CH'].includes(input.country) ? input.country : 'DE';
  await sql.query(
    `INSERT INTO creator_tax_profiles (
       creator_id, legal_name, country, small_business, tax_number, vat_id,
       tax_id, date_of_birth, street, postal_code, city, self_billing_agreed_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::date, $9, $10, $11, CASE WHEN $12 THEN now() ELSE NULL END, now())
     ON CONFLICT (creator_id) DO UPDATE SET
       legal_name = EXCLUDED.legal_name,
       country = EXCLUDED.country,
       small_business = EXCLUDED.small_business,
       tax_number = EXCLUDED.tax_number,
       vat_id = EXCLUDED.vat_id,
       tax_id = EXCLUDED.tax_id,
       date_of_birth = EXCLUDED.date_of_birth,
       street = EXCLUDED.street,
       postal_code = EXCLUDED.postal_code,
       city = EXCLUDED.city,
       self_billing_agreed_at = COALESCE(creator_tax_profiles.self_billing_agreed_at, EXCLUDED.self_billing_agreed_at),
       updated_at = now()`,
    [
      input.creatorId,
      input.legalName.trim().slice(0, 160),
      country,
      Boolean(input.smallBusiness),
      input.taxNumber.trim().slice(0, 60),
      input.vatId.trim().slice(0, 40),
      input.taxId.trim().slice(0, 40),
      input.dateOfBirth || null,
      input.street.trim().slice(0, 160),
      input.postalCode.trim().slice(0, 20),
      input.city.trim().slice(0, 120),
      Boolean(input.agreeSelfBilling),
    ],
  );
  const updated = await getCreatorTaxProfile(sql, input.creatorId);
  if (!updated) throw new Error('Steuerprofil konnte nicht gespeichert werden.');
  return updated;
}

/**
 * Spec 8.5 & 8.8 Guardrails vor jeder Creator-Auszahlung:
 * 1. KYC verifiziert (`stripe_onboarding_status === 'verified'`)
 * 2. DAC7- & UStG-Steuerprofil vollständig inkl. Self-Billing-Zustimmung
 * 3. Mindestauszahlungsbetrag erreicht
 * 4. available_cents >= amountCents (atomar abgebucht!)
 * 5. Creator-Plattformgebühr immer 0 Cent!
 */
export async function reserveCreatorPayout(
  sql: SqlClient,
  input: {
    creatorId: string;
    amountCents: number;
    payoutSpeed?: PayoutSpeed;
    minPayoutCents?: number;
  },
): Promise<{
  payoutId: string;
  preview: PayoutPreview;
  stripeConnectAccountId: string;
  taxProfile: CreatorTaxProfile;
}> {
  const minCents = input.minPayoutCents ?? DEFAULT_CREATOR_MIN_PAYOUT_CENTS;
  if (!Number.isInteger(input.amountCents) || input.amountCents < minCents) {
    throw new Error(
      `Der Mindestauszahlungsbetrag beträgt ${(minCents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €.`,
    );
  }

  const balance = await ensureCreatorBalance(sql, input.creatorId);
  if (balance.stripeOnboardingStatus !== 'verified' || !balance.stripeConnectAccountId) {
    throw new Error('Bitte schließe zuerst die Auszahlungs-Verifizierung (KYC) bei Stripe ab.');
  }

  const taxProfile = await getCreatorTaxProfile(sql, input.creatorId);
  const taxValidation = validateCreatorTaxProfileForPayout(taxProfile);
  if (!taxValidation.valid || !taxProfile) {
    throw new Error(`Steuerprofil unvollständig: ${taxValidation.missingFields.join(', ')}.`);
  }

  const preview = calculateCreatorPayoutPreview(
    input.amountCents,
    input.payoutSpeed || 'standard',
    taxProfile.country,
  );

  // Atomarer Abzug von available_cents -> pending_cents
  const debited = await sql.query(
    `UPDATE creator_balances
     SET available_cents = available_cents - $1,
         pending_cents = pending_cents + $1,
         updated_at = now()
     WHERE creator_id = $2 AND available_cents >= $1
     RETURNING creator_id`,
    [preview.amountCents, input.creatorId],
  );
  if (debited.length === 0) {
    throw new Error('Dein auszahlbares Guthaben reicht für diesen Betrag nicht aus.');
  }

  const [payout] = await sql.query(
    `INSERT INTO creator_payouts (
       creator_id, amount_cents, platform_fee_cents, instant_fee_cents,
       net_payout_cents, payout_speed, status
     ) VALUES ($1, $2, 0, $3, $4, $5, 'requested')
     RETURNING id`,
    [
      input.creatorId,
      preview.amountCents,
      preview.instantFeeCents,
      preview.netPayoutCents,
      preview.payoutSpeed,
    ],
  );

  return {
    payoutId: String(payout.id),
    preview,
    stripeConnectAccountId: balance.stripeConnectAccountId,
    taxProfile,
  };
}

export async function finalizeCreatorPayoutPaid(
  sql: SqlClient,
  input: {
    payoutId: string;
    providerTransferRef?: string;
    providerPayoutRef?: string;
  },
): Promise<{ transitionedNow: boolean; creatorId: string; amountCents: number }> {
  const updated = await sql.query(
    `UPDATE creator_payouts
     SET status = 'paid',
         paid_at = now(),
         provider_transfer_ref = COALESCE($2, provider_transfer_ref),
         provider_payout_ref = COALESCE($3, provider_payout_ref)
     WHERE id = $1 AND status IN ('requested', 'processing')
     RETURNING creator_id, amount_cents`,
    [input.payoutId, input.providerTransferRef || null, input.providerPayoutRef || null],
  );

  if (updated.length === 0) {
    const [existing] = await sql.query(
      `SELECT creator_id, amount_cents FROM creator_payouts WHERE id = $1 LIMIT 1`,
      [input.payoutId],
    );
    return {
      transitionedNow: false,
      creatorId: existing ? String(existing.creator_id) : '',
      amountCents: existing ? Number(existing.amount_cents) : 0,
    };
  }

  const creatorId = String(updated[0].creator_id);
  const amountCents = Number(updated[0].amount_cents);

  await sql.query(
    `UPDATE creator_balances
     SET pending_cents = GREATEST(0, pending_cents - $1),
         paid_out_cents = paid_out_cents + $1,
         updated_at = now()
     WHERE creator_id = $2`,
    [amountCents, creatorId],
  );

  return { transitionedNow: true, creatorId, amountCents };
}

export async function revertCreatorPayoutFailed(
  sql: SqlClient,
  payoutId: string,
): Promise<boolean> {
  const updated = await sql.query(
    `UPDATE creator_payouts
     SET status = 'failed'
     WHERE id = $1 AND status IN ('requested', 'processing')
     RETURNING creator_id, amount_cents`,
    [payoutId],
  );
  if (updated.length === 0) return false;
  const creatorId = String(updated[0].creator_id);
  const amountCents = Number(updated[0].amount_cents);
  await sql.query(
    `UPDATE creator_balances
     SET pending_cents = GREATEST(0, pending_cents - $1),
         available_cents = available_cents + $1,
         updated_at = now()
     WHERE creator_id = $2`,
    [amountCents, creatorId],
  );
  return true;
}

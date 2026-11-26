import Stripe from 'stripe';
import type { getDatabase } from '@/app/lib/database';
import {
  CARD_SURCHARGE_LABEL,
  calculatePayInSurchargeCents,
  ensureBrandWallet,
  ensureCreatorBalance,
  type PayInMethod,
  type PayoutSpeed,
  type TaxCountry,
} from '@/app/lib/payments-ledger';

type SqlClient = ReturnType<typeof getDatabase>;

let cachedStripe: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Stripe Connect ist noch nicht konfiguriert (STRIPE_SECRET_KEY fehlt).');
  }
  if (!cachedStripe) {
    cachedStripe = new Stripe(key);
  }
  return cachedStripe;
}

/**
 * Stellt sicher, dass die Marke einen Stripe Customer plus virtuelle DE-IBAN (customer_balance) hat.
 */
export async function ensureStripeBrandCustomerAndVirtualIban(
  sql: SqlClient,
  brand: { id: string; email: string; companyName: string; contactName: string },
): Promise<{
  stripeCustomerId: string;
  virtualIban: string | null;
  virtualBic: string | null;
  virtualBankName: string | null;
  virtualAccountHolder: string | null;
}> {
  const wallet = await ensureBrandWallet(sql, brand.id);
  const stripe = getStripeClient();

  let customerId = wallet.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: brand.email,
      name: brand.companyName || brand.contactName || brand.email,
      metadata: { ugc_vz_brand_id: brand.id },
    });
    customerId = customer.id;
    await sql.query(
      `UPDATE brand_wallets SET stripe_customer_id = $1, updated_at = now() WHERE brand_id = $2`,
      [customerId, brand.id],
    );
  }

  let virtualIban = wallet.virtualIban;
  let virtualBic = wallet.virtualBic;
  let virtualBankName = wallet.virtualBankName;
  let virtualAccountHolder = wallet.virtualAccountHolder;

  if (!virtualIban) {
    try {
      const instructions = await stripe.customers.createFundingInstructions(customerId, {
        funding_type: 'bank_transfer',
        currency: 'eur',
        bank_transfer: {
          type: 'eu_bank_transfer',
          eu_bank_transfer: { country: 'DE' },
        },
      });
      const financial = instructions.bank_transfer?.financial_addresses?.[0]?.iban;
      if (financial?.iban) {
        virtualIban = financial.iban;
        virtualBic = financial.bic || null;
        virtualBankName = 'Stripe / Virtuelle DE-IBAN';
        virtualAccountHolder = financial.account_holder_name || 'Stripe Payments Europe Ltd.';
        await sql.query(
          `UPDATE brand_wallets
           SET virtual_iban = $1, virtual_bic = $2, virtual_bank_name = $3,
               virtual_account_holder = $4, updated_at = now()
           WHERE brand_id = $5`,
          [virtualIban, virtualBic, virtualBankName, virtualAccountHolder, brand.id],
        );
      }
    } catch (err) {
      console.warn(
        'Stripe virtual IBAN funding instructions unavailable',
        err instanceof Error ? err.message : 'unknown error',
      );
    }
  }

  return {
    stripeCustomerId: customerId,
    virtualIban,
    virtualBic,
    virtualBankName,
    virtualAccountHolder,
  };
}

/**
 * Erzeugt eine Stripe Checkout Session für SEPA-Lastschrift (0 % Gebühr) oder Karte inkl. Apple/Google Pay (+3 % Kartengebühr als eigene Zeile).
 */
export async function createBrandCheckoutTopupSession(input: {
  stripeCustomerId: string;
  brandId: string;
  amountCents: number;
  method: Exclude<PayInMethod, 'bank_transfer'>;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ sessionId: string; checkoutUrl: string; surchargeCents: number; totalChargedCents: number }> {
  const stripe = getStripeClient();
  const { surchargeCents, totalChargedCents } = calculatePayInSurchargeCents(
    input.amountCents,
    input.method,
  );

  const allowedPaymentMethodTypes: Stripe.Checkout.SessionCreateParams.AllowedPaymentMethodType[] =
    input.method === 'sepa_debit'
      ? ['sepa_debit']
      : input.method === 'paypal'
        ? ['paypal']
        : ['card'];

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: input.amountCents,
        product_data: {
          name: 'UGC VZ Kampagnenguthaben',
          description: 'Guthaben für geprüfte Creator-Kampagnen (inkl. Servicegebühr)',
        },
      },
    },
  ];

  // Spec 8.9: Kartengebühr 3 % als eigene, klar benannte Zeile ausweisen!
  if (surchargeCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: surchargeCents,
        product_data: {
          name: `${CARD_SURCHARGE_LABEL} (3 %)`,
          description: 'Zahlungsgebühr bei Kartenzahlung (SEPA & Überweisung sind kostenfrei)',
        },
      },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: input.stripeCustomerId,
    allowed_payment_method_types: allowedPaymentMethodTypes,
    line_items: lineItems,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: {
      ugc_vz_brand_id: input.brandId,
      topup_amount_cents: String(input.amountCents),
      topup_surcharge_cents: String(surchargeCents),
      topup_method: input.method,
    },
  });

  if (!session.url) {
    throw new Error('Stripe Checkout URL konnte nicht erzeugt werden.');
  }

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
    surchargeCents,
    totalChargedCents,
  };
}

/**
 * Spec 8.8: Stripe Connect Hosted Onboarding (Express / manuelle Auszahlungen) — erst bei erster Auszahlung ausgelöst!
 */
export async function createCreatorOnboardingLink(
  sql: SqlClient,
  input: {
    creatorId: string;
    email: string;
    country: TaxCountry;
    returnUrl: string;
    refreshUrl: string;
  },
): Promise<{ accountId: string; onboardingUrl: string }> {
  const balance = await ensureCreatorBalance(sql, input.creatorId);
  const stripe = getStripeClient();

  let accountId = balance.stripeConnectAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: input.country,
      email: input.email,
      capabilities: {
        transfers: { requested: true },
      },
      settings: {
        payouts: {
          schedule: { interval: 'manual' },
        },
      },
      metadata: { ugc_vz_creator_id: input.creatorId },
    });
    accountId = account.id;
    await sql.query(
      `UPDATE creator_balances
       SET stripe_connect_account_id = $1, stripe_onboarding_status = 'pending', updated_at = now()
       WHERE creator_id = $2`,
      [accountId, input.creatorId],
    );
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: input.refreshUrl,
    return_url: input.returnUrl,
    type: 'account_onboarding',
  });

  return { accountId, onboardingUrl: link.url };
}

/**
 * Spec 8.5 & 8.8: Separate Charges & Transfers -> Transfer auf Connected Account + manueller Payout (Standard oder Instant).
 */
export async function executeCreatorStripePayout(input: {
  payoutId: string;
  creatorId: string;
  stripeConnectAccountId: string;
  netPayoutCents: number;
  payoutSpeed: PayoutSpeed;
}): Promise<{ transferId: string; payoutRef: string }> {
  const stripe = getStripeClient();

  const transfer = await stripe.transfers.create(
    {
      amount: input.netPayoutCents,
      currency: 'eur',
      destination: input.stripeConnectAccountId,
      metadata: {
        ugc_vz_payout_id: input.payoutId,
        ugc_vz_creator_id: input.creatorId,
      },
    },
    { idempotencyKey: `ugc-vz-transfer-${input.payoutId}` },
  );

  const payout = await stripe.payouts.create(
    {
      amount: input.netPayoutCents,
      currency: 'eur',
      method: input.payoutSpeed === 'instant' ? 'instant' : 'standard',
      metadata: {
        ugc_vz_payout_id: input.payoutId,
        ugc_vz_creator_id: input.creatorId,
      },
    },
    {
      stripeAccount: input.stripeConnectAccountId,
      idempotencyKey: `ugc-vz-payout-${input.payoutId}`,
    },
  );

  return { transferId: transfer.id, payoutRef: payout.id };
}

export function getConfiguredStripeWebhookSecrets(): string[] {
  const raw = [
    process.env.STRIPE_WEBHOOK_SECRET || '',
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET || '',
  ];
  const secrets = raw
    .flatMap((entry) => entry.split(','))
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(secrets));
}

export function constructVerifiedStripeEvent(
  rawBody: string,
  signature: string | null,
): Stripe.Event {
  const secrets = getConfiguredStripeWebhookSecrets();
  if (secrets.length === 0 || !signature) {
    throw new Error('Stripe Webhook Signatur oder Secret fehlt.');
  }
  const stripe = getStripeClient();
  let lastError: unknown;
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('Ungültige Stripe Webhook Signatur.');
}

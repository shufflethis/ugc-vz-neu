-- Migration 024: Stripe Connect Wallets, Top-ups, Campaign Reservations,
-- Creator Balances, DAC7 Tax Profiles, Payouts, Credit Notes (ZUGFeRD) & Webhook Idempotency.
-- Spec 8.5, 8.7, 8.8, 8.9 (all monetary amounts stored as integer cents in EUR).

CREATE TABLE IF NOT EXISTS brand_wallets (
  brand_id uuid PRIMARY KEY REFERENCES brand_accounts(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE,
  virtual_iban text,
  virtual_bic text,
  virtual_bank_name text,
  virtual_account_holder text,
  available_cents bigint NOT NULL DEFAULT 0 CHECK (available_cents >= 0),
  reserved_cents bigint NOT NULL DEFAULT 0 CHECK (reserved_cents >= 0),
  currency text NOT NULL DEFAULT 'EUR' CHECK (currency = 'EUR'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
ALTER TABLE brand_wallets ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint

CREATE TABLE IF NOT EXISTS wallet_topups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brand_accounts(id) ON DELETE CASCADE,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  surcharge_cents bigint NOT NULL DEFAULT 0 CHECK (surcharge_cents >= 0),
  surcharge_label text NOT NULL DEFAULT '',
  total_charged_cents bigint NOT NULL CHECK (total_charged_cents > 0),
  method text NOT NULL CHECK (method IN ('sepa_debit', 'bank_transfer', 'card', 'apple_pay', 'google_pay', 'paypal')),
  provider_ref text UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  invoice_number text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_wallet_topups_brand
  ON wallet_topups (brand_id, created_at DESC);
-- statement-breakpoint
ALTER TABLE wallet_topups ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint

CREATE TABLE IF NOT EXISTS campaign_reservations (
  campaign_id uuid PRIMARY KEY REFERENCES brand_campaigns(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES brand_accounts(id) ON DELETE CASCADE,
  budget_cap_cents bigint NOT NULL CHECK (budget_cap_cents > 0),
  platform_fee_bps integer NOT NULL DEFAULT 1500 CHECK (platform_fee_bps >= 0 AND platform_fee_bps <= 5000),
  creator_pool_cap_cents bigint NOT NULL CHECK (creator_pool_cap_cents >= 0),
  reserved_cents bigint NOT NULL CHECK (reserved_cents >= 0),
  released_creator_cents bigint NOT NULL DEFAULT 0 CHECK (released_creator_cents >= 0),
  released_fee_cents bigint NOT NULL DEFAULT 0 CHECK (released_fee_cents >= 0),
  last_delta_creator_cents bigint NOT NULL DEFAULT 0,
  last_delta_fee_cents bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  CHECK (released_creator_cents <= creator_pool_cap_cents),
  CHECK (released_creator_cents + released_fee_cents <= budget_cap_cents)
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_campaign_reservations_brand
  ON campaign_reservations (brand_id, status, created_at DESC);
-- statement-breakpoint
ALTER TABLE campaign_reservations ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint

CREATE TABLE IF NOT EXISTS submission_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL UNIQUE REFERENCES brand_campaign_submissions(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES brand_campaigns(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  views_at_cutoff integer NOT NULL DEFAULT 0 CHECK (views_at_cutoff >= 0),
  counted_thousands integer NOT NULL DEFAULT 0 CHECK (counted_thousands >= 0),
  rate_per_1000_cents integer NOT NULL DEFAULT 0 CHECK (rate_per_1000_cents >= 0),
  amount_cents bigint NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  platform_fee_cents bigint NOT NULL DEFAULT 0 CHECK (platform_fee_cents >= 0),
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_review', 'counted', 'rejected', 'appealed')),
  review_note text NOT NULL DEFAULT '',
  settled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_submission_settlements_campaign
  ON submission_settlements (campaign_id, created_at DESC);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_submission_settlements_creator
  ON submission_settlements (creator_id, created_at DESC);
-- statement-breakpoint
ALTER TABLE submission_settlements ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint

CREATE TABLE IF NOT EXISTS creator_balances (
  creator_id uuid PRIMARY KEY REFERENCES creator_profiles(id) ON DELETE CASCADE,
  stripe_connect_account_id text UNIQUE,
  stripe_onboarding_status text NOT NULL DEFAULT 'not_started'
    CHECK (stripe_onboarding_status IN ('not_started', 'pending', 'verified', 'restricted')),
  pending_cents bigint NOT NULL DEFAULT 0 CHECK (pending_cents >= 0),
  available_cents bigint NOT NULL DEFAULT 0 CHECK (available_cents >= 0),
  paid_out_cents bigint NOT NULL DEFAULT 0 CHECK (paid_out_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
ALTER TABLE creator_balances ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint

CREATE TABLE IF NOT EXISTS creator_tax_profiles (
  creator_id uuid PRIMARY KEY REFERENCES creator_profiles(id) ON DELETE CASCADE,
  legal_name text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT 'DE' CHECK (country IN ('DE', 'AT', 'CH')),
  small_business boolean NOT NULL DEFAULT true,
  tax_number text NOT NULL DEFAULT '',
  vat_id text NOT NULL DEFAULT '',
  tax_id text NOT NULL DEFAULT '',
  date_of_birth date,
  street text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  self_billing_agreed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
ALTER TABLE creator_tax_profiles ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint

CREATE TABLE IF NOT EXISTS creator_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  platform_fee_cents bigint NOT NULL DEFAULT 0 CHECK (platform_fee_cents = 0),
  instant_fee_cents bigint NOT NULL DEFAULT 0 CHECK (instant_fee_cents >= 0),
  net_payout_cents bigint NOT NULL CHECK (net_payout_cents > 0),
  payout_speed text NOT NULL DEFAULT 'standard' CHECK (payout_speed IN ('standard', 'instant')),
  provider_transfer_ref text UNIQUE,
  provider_payout_ref text UNIQUE,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'paid', 'failed')),
  credit_note_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_creator_payouts_creator
  ON creator_payouts (creator_id, created_at DESC);
-- statement-breakpoint
ALTER TABLE creator_payouts ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint

CREATE TABLE IF NOT EXISTS credit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE,
  creator_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  payout_id uuid UNIQUE REFERENCES creator_payouts(id) ON DELETE SET NULL,
  period text NOT NULL,
  net_cents bigint NOT NULL CHECK (net_cents >= 0),
  vat_rate_type text NOT NULL CHECK (vat_rate_type IN ('0', '19', 'reverse_charge')),
  vat_cents bigint NOT NULL DEFAULT 0 CHECK (vat_cents >= 0),
  gross_cents bigint NOT NULL CHECK (gross_cents >= 0),
  small_business boolean NOT NULL DEFAULT true,
  xml_payload text NOT NULL DEFAULT '',
  issued_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_credit_notes_creator
  ON credit_notes (creator_id, issued_at DESC);
-- statement-breakpoint
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

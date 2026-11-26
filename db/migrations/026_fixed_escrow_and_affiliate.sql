-- Migration 026: Pay-per-Video Fixed Escrow Settlements + Affiliate / Kickback Tracking & Payouts
-- Enables Brands to run Pay-per-View (TKP), Pay-per-Video (Fixed), Hybrid, and Affiliate / Kickback
-- campaigns completely inside the UGC VZ SaaS Portal with Stripe Wallet budget reservation.

ALTER TABLE brand_campaigns
  DROP CONSTRAINT IF EXISTS brand_campaigns_compensation_model_check;
-- statement-breakpoint
ALTER TABLE brand_campaigns
  ADD CONSTRAINT brand_campaigns_compensation_model_check
  CHECK (compensation_model IN ('fixed', 'tkp', 'hybrid', 'affiliate', 'barter'));
-- statement-breakpoint
ALTER TABLE brand_campaigns
  ADD COLUMN IF NOT EXISTS affiliate_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS affiliate_type text NOT NULL DEFAULT 'percent'
    CHECK (affiliate_type IN ('percent', 'fixed_per_sale')),
  ADD COLUMN IF NOT EXISTS affiliate_rate_bps integer
    CHECK (affiliate_rate_bps IS NULL OR (affiliate_rate_bps >= 0 AND affiliate_rate_bps <= 8000)),
  ADD COLUMN IF NOT EXISTS affiliate_fixed_cents integer
    CHECK (affiliate_fixed_cents IS NULL OR affiliate_fixed_cents >= 0),
  ADD COLUMN IF NOT EXISTS affiliate_target_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS affiliate_webhook_secret text NOT NULL DEFAULT '';
-- statement-breakpoint
ALTER TABLE brand_campaign_applications
  ADD COLUMN IF NOT EXISTS affiliate_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS affiliate_clicks integer NOT NULL DEFAULT 0
    CHECK (affiliate_clicks >= 0);
-- statement-breakpoint
ALTER TABLE submission_settlements
  ADD COLUMN IF NOT EXISTS settlement_mode text NOT NULL DEFAULT 'tkp'
    CHECK (settlement_mode IN ('tkp', 'fixed_video', 'hybrid')),
  ADD COLUMN IF NOT EXISTS fixed_amount_cents bigint NOT NULL DEFAULT 0
    CHECK (fixed_amount_cents >= 0);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES brand_campaigns(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES brand_campaign_applications(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  external_order_ref text NOT NULL DEFAULT '',
  order_amount_cents bigint NOT NULL DEFAULT 0 CHECK (order_amount_cents >= 0),
  commission_cents bigint NOT NULL CHECK (commission_cents > 0),
  platform_fee_cents bigint NOT NULL DEFAULT 0 CHECK (platform_fee_cents >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv', 'webhook')),
  note text NOT NULL DEFAULT '',
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_conversions_campaign_order
  ON affiliate_conversions (campaign_id, external_order_ref)
  WHERE external_order_ref <> '';
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_campaign
  ON affiliate_conversions (campaign_id, created_at DESC);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_creator
  ON affiliate_conversions (creator_id, created_at DESC);
-- statement-breakpoint
ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint
INSERT INTO schema_migrations (version)
VALUES ('026_fixed_escrow_and_affiliate')
ON CONFLICT (version) DO NOTHING;

-- Migration 027: Core-Creator Retainer (Layer 4), In-Portal-Nachrichten & High-Risk / Stripe-Restricted Compliance Shield
-- Schuetzt das Haupt-Stripe-Konto vor Restricted-Business-Sperren (Krypto, Peptide, CBD, iGaming) und
-- ermoeglicht wiederkehrende Core-Creator-Retainer + direkte Portal-Kommunikation ohne Off-Platform-Abfluss.

ALTER TABLE brand_accounts
  ADD COLUMN IF NOT EXISTS industry_category text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS billing_tier text NOT NULL DEFAULT 'stripe_standard'
    CHECK (billing_tier IN ('stripe_standard', 'high_risk_custom')),
  ADD COLUMN IF NOT EXISTS compliance_status text NOT NULL DEFAULT 'approved'
    CHECK (compliance_status IN ('approved', 'review_required', 'custom_psp_active', 'rejected')),
  ADD COLUMN IF NOT EXISTS high_risk_fee_bps integer NOT NULL DEFAULT 2200
    CHECK (high_risk_fee_bps >= 1500 AND high_risk_fee_bps <= 4500),
  ADD COLUMN IF NOT EXISTS compliance_notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS compliance_requested_at timestamptz;
-- statement-breakpoint
ALTER TABLE brand_campaigns
  DROP CONSTRAINT IF EXISTS brand_campaigns_compensation_model_check;
-- statement-breakpoint
ALTER TABLE brand_campaigns
  ADD CONSTRAINT brand_campaigns_compensation_model_check
  CHECK (compensation_model IN ('fixed', 'tkp', 'hybrid', 'affiliate', 'retainer', 'barter'));
-- statement-breakpoint
ALTER TABLE brand_campaigns
  ADD COLUMN IF NOT EXISTS retainer_monthly_eur integer
    CHECK (retainer_monthly_eur IS NULL OR retainer_monthly_eur >= 0),
  ADD COLUMN IF NOT EXISTS retainer_videos_per_month integer
    CHECK (retainer_videos_per_month IS NULL OR retainer_videos_per_month >= 0),
  ADD COLUMN IF NOT EXISTS retainer_min_months integer
    CHECK (retainer_min_months IS NULL OR retainer_min_months >= 1),
  ADD COLUMN IF NOT EXISTS retainer_perks text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS requires_high_risk_billing boolean NOT NULL DEFAULT false;
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS campaign_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES brand_campaigns(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES brand_campaign_applications(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('brand', 'creator')),
  sender_name text NOT NULL DEFAULT '',
  body text NOT NULL CHECK (length(btrim(body)) > 0 AND length(body) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_campaign_messages_application
  ON campaign_messages (application_id, created_at ASC);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign
  ON campaign_messages (campaign_id, created_at DESC);
-- statement-breakpoint
ALTER TABLE campaign_messages ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS brand_compliance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brand_accounts(id) ON DELETE CASCADE,
  industry_category text NOT NULL,
  preferred_contact text NOT NULL DEFAULT 'call' CHECK (preferred_contact IN ('call', 'email')),
  phone_or_handle text NOT NULL DEFAULT '',
  preferred_psp text NOT NULL DEFAULT 'invoice_sepa'
    CHECK (preferred_psp IN ('invoice_sepa', 'high_risk_psp', 'crypto_usdc')),
  estimated_monthly_budget_eur integer CHECK (estimated_monthly_budget_eur IS NULL OR estimated_monthly_budget_eur >= 0),
  website_url text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'contacted', 'approved', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_brand_compliance_requests_brand
  ON brand_compliance_requests (brand_id, created_at DESC);
-- statement-breakpoint
ALTER TABLE brand_compliance_requests ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint
INSERT INTO schema_migrations (version)
VALUES ('027_retainer_messages_and_high_risk')
ON CONFLICT (version) DO NOTHING;

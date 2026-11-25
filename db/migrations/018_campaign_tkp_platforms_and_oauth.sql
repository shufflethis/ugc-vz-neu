-- 018_campaign_tkp_platforms_and_oauth.sql
-- Additive schema for Performance/TKP cap campaigns, creator platform/product selection,
-- and optional TikTok/Instagram OAuth account linking.

ALTER TABLE brand_campaigns
  ADD COLUMN IF NOT EXISTS requires_product_choice BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS product_choice_prompt TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS discount_code TEXT NOT NULL DEFAULT '';
-- statement-breakpoint

ALTER TABLE brand_campaign_applications
  ADD COLUMN IF NOT EXISTS target_platforms TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS product_choice TEXT NOT NULL DEFAULT '';
-- statement-breakpoint

ALTER TABLE creator_social_accounts
  ADD COLUMN IF NOT EXISTS provider_account_id TEXT,
  ADD COLUMN IF NOT EXISTS oauth_scope TEXT;
-- statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_creator_social_provider_account
  ON creator_social_accounts (platform, provider_account_id)
  WHERE provider_account_id IS NOT NULL;
-- statement-breakpoint

INSERT INTO schema_migrations (version)
VALUES ('018_campaign_tkp_platforms_and_oauth')
ON CONFLICT (version) DO NOTHING;

-- Migration 022: Plattformgebuehr-Satz pro Kampagne fix speichern (Spec 8.7 & 8.9).
-- 1500 bps = 15 % regulaer, 1000 bps = 10 % Black Friday bis Cyber Monday, 0 bps fuer Creator.

ALTER TABLE brand_campaigns
  ADD COLUMN IF NOT EXISTS platform_fee_bps integer NOT NULL DEFAULT 1500;
-- statement-breakpoint
ALTER TABLE brand_campaigns
  ADD COLUMN IF NOT EXISTS fee_promo_code text;
-- statement-breakpoint
ALTER TABLE brand_campaigns
  ADD COLUMN IF NOT EXISTS creator_fee_bps integer NOT NULL DEFAULT 0;

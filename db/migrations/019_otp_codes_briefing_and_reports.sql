-- 019_otp_codes_briefing_and_reports.sql
-- Additive schema for 6-digit email OTP codes (Brand & Creator), campaign briefing checklists,
-- required mentions/hashtags, submission review notes, and shareable live report links.

ALTER TABLE brand_login_tokens
  ADD COLUMN IF NOT EXISTS otp_code_hash TEXT,
  ADD COLUMN IF NOT EXISTS otp_attempts INTEGER NOT NULL DEFAULT 0;
-- statement-breakpoint

ALTER TABLE creator_verification_tokens
  ADD COLUMN IF NOT EXISTS otp_code_hash TEXT,
  ADD COLUMN IF NOT EXISTS otp_attempts INTEGER NOT NULL DEFAULT 0;
-- statement-breakpoint

ALTER TABLE brand_campaigns
  ADD COLUMN IF NOT EXISTS briefing_checklist TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS required_mention TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS required_hashtags TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS report_share_token TEXT;
-- statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_campaigns_report_share_token
  ON brand_campaigns (report_share_token)
  WHERE report_share_token IS NOT NULL;
-- statement-breakpoint

ALTER TABLE brand_campaign_submissions
  ADD COLUMN IF NOT EXISTS review_note TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS checklist_passed BOOLEAN NOT NULL DEFAULT FALSE;
-- statement-breakpoint

INSERT INTO schema_migrations (version)
VALUES ('019_otp_codes_briefing_and_reports')
ON CONFLICT (version) DO NOTHING;

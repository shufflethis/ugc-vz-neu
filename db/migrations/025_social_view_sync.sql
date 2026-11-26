-- 025_social_view_sync.sql
-- Additive schema for official social API view tracking (TikTok Display API v2,
-- Instagram Graph API Insights, YouTube Data API v3) with AES-256-GCM encrypted
-- creator OAuth tokens and deleted-post detection for campaign submissions.

ALTER TABLE creator_social_accounts
  ADD COLUMN IF NOT EXISTS oauth_access_token_enc TEXT,
  ADD COLUMN IF NOT EXISTS oauth_refresh_token_enc TEXT,
  ADD COLUMN IF NOT EXISTS oauth_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS oauth_last_error TEXT NOT NULL DEFAULT '';
-- statement-breakpoint

ALTER TABLE brand_campaign_submissions
  ADD COLUMN IF NOT EXISTS external_post_id TEXT,
  ADD COLUMN IF NOT EXISTS post_deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_sync_error TEXT NOT NULL DEFAULT '';
-- statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_brand_campaign_subs_sync_queue
  ON brand_campaign_submissions (status, last_tracked_at ASC NULLS FIRST)
  WHERE status IN ('submitted', 'approved');
-- statement-breakpoint

INSERT INTO schema_migrations (version)
VALUES ('025_social_view_sync')
ON CONFLICT (version) DO NOTHING;

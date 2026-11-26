-- 023_creator_taxonomy_and_consent.sql
-- Spec 8.6: Feste 20er-Kategorien-Taxonomie, explizites KI-Opt-in & Widerruf,
-- 30-Tage-Rohdaten-Aufbewahrung, 90-Tage-Refresh und erweitertes Such-Logging.

ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS primary_category text;
-- statement-breakpoint
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS secondary_categories text[] NOT NULL DEFAULT '{}';
-- statement-breakpoint
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS suggested_categories jsonb NOT NULL DEFAULT '[]'::jsonb;
-- statement-breakpoint
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS categories_confirmed_at timestamptz;
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS creator_profiles_primary_category_idx
  ON creator_profiles (primary_category)
  WHERE status = 'active' AND primary_category IS NOT NULL;
-- statement-breakpoint
ALTER TABLE creator_ai_profiles
  ADD COLUMN IF NOT EXISTS consent_at timestamptz;
-- statement-breakpoint
ALTER TABLE creator_ai_profiles
  ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz;
-- statement-breakpoint
ALTER TABLE creator_ai_profiles
  ADD COLUMN IF NOT EXISTS next_refresh_at timestamptz;
-- statement-breakpoint
ALTER TABLE creator_ai_profiles
  ADD COLUMN IF NOT EXISTS raw_expires_at timestamptz;
-- statement-breakpoint
ALTER TABLE creator_ai_profiles
  ADD COLUMN IF NOT EXISTS creator_edits jsonb NOT NULL DEFAULT '[]'::jsonb;
-- statement-breakpoint
ALTER TABLE creator_ai_profiles
  DROP CONSTRAINT IF EXISTS creator_ai_profiles_status_check;
-- statement-breakpoint
ALTER TABLE creator_ai_profiles
  ADD CONSTRAINT creator_ai_profiles_status_check
  CHECK (status IN ('pending', 'analyzing', 'draft_ready', 'approved', 'rejected', 'withdrawn', 'failed'));
-- statement-breakpoint
ALTER TABLE search_log
  ADD COLUMN IF NOT EXISTS detected_category text;
-- statement-breakpoint
ALTER TABLE search_log
  ADD COLUMN IF NOT EXISTS clicked_creator_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
-- statement-breakpoint
ALTER TABLE search_log
  ADD COLUMN IF NOT EXISTS requested_outreach boolean NOT NULL DEFAULT false;
-- statement-breakpoint
INSERT INTO schema_migrations (version)
VALUES ('023_creator_taxonomy_and_consent')
ON CONFLICT (version) DO NOTHING;

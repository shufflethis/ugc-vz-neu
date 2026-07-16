CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_label text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS creator_profiles (
  id uuid PRIMARY KEY,
  public_id text NOT NULL UNIQUE,
  import_key text UNIQUE,
  status text NOT NULL DEFAULT 'pending_verification'
    CHECK (status IN ('active', 'pending_verification', 'pending_review', 'quarantined', 'archived')),
  display_name text NOT NULL,
  legal_name text,
  stage_name text,
  birth_year smallint CHECK (birth_year IS NULL OR birth_year BETWEEN 1930 AND 2010),
  gender text,
  city text,
  country_code char(2) NOT NULL DEFAULT 'DE',
  height_cm smallint CHECK (height_cm IS NULL OR height_cm BETWEEN 120 AND 230),
  special_traits text,
  experience_since text,
  industries text,
  topics text,
  skin_type text,
  pet_context text,
  children_context text,
  preferred_content text,
  equipment text,
  rate_text text,
  reach_text text,
  total_reach integer NOT NULL DEFAULT 0 CHECK (total_reach >= 0),
  profile_image_url text,
  profile_quality_score smallint NOT NULL DEFAULT 0 CHECK (profile_quality_score BETWEEN 0 AND 100),
  source_priority smallint NOT NULL DEFAULT 0,
  submitted_at timestamptz,
  last_reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS creator_private_contacts (
  creator_id uuid PRIMARY KEY REFERENCES creator_profiles(id) ON DELETE CASCADE,
  email text,
  phone text,
  contact_text text,
  email_verified_at timestamptz,
  project_notifications_enabled boolean NOT NULL DEFAULT true,
  notification_paused_at timestamptz,
  newsletter_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS creator_private_contacts_email_unique
  ON creator_private_contacts (lower(email)) WHERE email IS NOT NULL;

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS creator_social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  platform text NOT NULL DEFAULT 'other',
  handle text,
  url text NOT NULL,
  followers integer CHECK (followers IS NULL OR followers >= 0),
  is_primary boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'native',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creator_id, url)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS creator_portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'portfolio',
  url text NOT NULL,
  title text,
  sort_order smallint NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'native',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creator_id, url)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('platform', 'project_notifications', 'newsletter')),
  granted boolean NOT NULL,
  text_version text NOT NULL,
  source text NOT NULL,
  source_reference text NOT NULL,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_reference, purpose)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS creator_source_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES creator_profiles(id) ON DELETE SET NULL,
  import_batch_id uuid REFERENCES import_batches(id) ON DELETE SET NULL,
  source text NOT NULL,
  source_row integer NOT NULL,
  source_record_id text,
  source_submitted_at timestamptz,
  source_fingerprint text NOT NULL,
  import_status text NOT NULL DEFAULT 'imported'
    CHECK (import_status IN ('imported', 'merged', 'quarantined', 'review')),
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_row)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS creator_import_review (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES creator_profiles(id) ON DELETE CASCADE,
  source text NOT NULL,
  source_row integer NOT NULL,
  issue_type text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (source, source_row, issue_type)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS creator_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  purpose text NOT NULL DEFAULT 'verify_email' CHECK (purpose IN ('verify_email', 'edit_profile')),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS brand_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL,
  company text,
  search_query text,
  message text,
  source_url text,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS lead_creator_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES brand_leads(id) ON DELETE CASCADE,
  creator_id uuid REFERENCES creator_profiles(id) ON DELETE SET NULL,
  creator_public_id text NOT NULL,
  creator_snapshot jsonb NOT NULL,
  rank smallint NOT NULL DEFAULT 0,
  creator_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lead_id, creator_public_id)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES brand_leads(id) ON DELETE SET NULL,
  creator_id uuid REFERENCES creator_profiles(id) ON DELETE SET NULL,
  resend_email_id text,
  audience text NOT NULL CHECK (audience IN ('brand', 'creator', 'internal', 'verification')),
  event_type text NOT NULL,
  recipient_hash text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS creator_profiles_status_idx ON creator_profiles (status);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS creator_profiles_birth_year_idx ON creator_profiles (birth_year);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS creator_social_accounts_creator_idx ON creator_social_accounts (creator_id);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS creator_portfolio_items_creator_idx ON creator_portfolio_items (creator_id);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS consent_events_creator_idx ON consent_events (creator_id, purpose, occurred_at DESC);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS creator_source_records_creator_idx ON creator_source_records (creator_id);

-- statement-breakpoint
ALTER TABLE creator_private_contacts ENABLE ROW LEVEL SECURITY;

-- statement-breakpoint
ALTER TABLE consent_events ENABLE ROW LEVEL SECURITY;

-- statement-breakpoint
ALTER TABLE creator_source_records ENABLE ROW LEVEL SECURITY;

-- statement-breakpoint
ALTER TABLE creator_verification_tokens ENABLE ROW LEVEL SECURITY;

-- statement-breakpoint
DROP VIEW IF EXISTS creator_search_public;

-- statement-breakpoint
CREATE VIEW creator_search_public AS
SELECT
  p.id,
  p.public_id,
  p.display_name,
  p.stage_name,
  p.birth_year,
  p.gender,
  p.city,
  p.country_code,
  p.height_cm,
  p.special_traits,
  p.experience_since,
  p.industries,
  p.topics,
  p.skin_type,
  p.pet_context,
  p.children_context,
  p.preferred_content,
  p.equipment,
  p.rate_text,
  p.reach_text,
  p.total_reach,
  p.profile_image_url,
  p.profile_quality_score,
  COALESCE(s.networks, ARRAY[]::text[]) AS networks,
  COALESCE(s.social_links, '') AS social_links,
  COALESCE(f.portfolio_links, '') AS portfolio_links
FROM creator_profiles p
LEFT JOIN LATERAL (
  SELECT
    array_agg(DISTINCT platform ORDER BY platform) AS networks,
    string_agg(url, E'\n' ORDER BY is_primary DESC, created_at) AS social_links
  FROM creator_social_accounts
  WHERE creator_id = p.id
) s ON true
LEFT JOIN LATERAL (
  SELECT string_agg(url, E'\n' ORDER BY sort_order, created_at) AS portfolio_links
  FROM creator_portfolio_items
  WHERE creator_id = p.id
) f ON true
WHERE p.status = 'active';

-- statement-breakpoint
COMMENT ON VIEW creator_search_public IS
  'Public creator search projection. Deliberately excludes email, phone, consent, tokens and source metadata.';

-- statement-breakpoint
INSERT INTO schema_migrations (version)
VALUES ('001_creator_platform')
ON CONFLICT (version) DO NOTHING;

-- Brand Workspace, Kampagnen-Ausschreibungen, Creator-Bewerbungen,
-- Performance-Tracking & Social-Account-Verifizierung (Bio-Code / OAuth-ready).

CREATE TABLE IF NOT EXISTS brand_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  contact_name text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  website text,
  email_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS brand_accounts_email_lower_idx
  ON brand_accounts (lower(email));
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS brand_login_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brand_accounts(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  redirect_to text,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS brand_login_tokens_brand_idx
  ON brand_login_tokens (brand_id, created_at DESC);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS brand_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE CHECK (public_id ~ '^CMP-[A-F0-9]{8}$'),
  brand_id uuid NOT NULL REFERENCES brand_accounts(id) ON DELETE CASCADE,
  title text NOT NULL,
  brand_display_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  niche text NOT NULL DEFAULT '',
  platforms text[] NOT NULL DEFAULT '{}',
  deliverables text NOT NULL DEFAULT '',
  compensation_model text NOT NULL DEFAULT 'fixed'
    CHECK (compensation_model IN ('fixed', 'tkp', 'hybrid', 'barter')),
  budget_per_video_eur integer CHECK (budget_per_video_eur IS NULL OR budget_per_video_eur >= 0),
  total_budget_eur integer CHECK (total_budget_eur IS NULL OR total_budget_eur >= 0),
  tkp_eur_cents integer CHECK (tkp_eur_cents IS NULL OR tkp_eur_cents >= 0),
  usage_rights text NOT NULL DEFAULT '',
  deadline text NOT NULL DEFAULT '',
  visibility text NOT NULL DEFAULT 'open'
    CHECK (visibility IN ('invite_only', 'open')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  source_lead_public_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS brand_campaigns_brand_idx
  ON brand_campaigns (brand_id, created_at DESC);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS brand_campaigns_open_idx
  ON brand_campaigns (status, visibility, created_at DESC);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS brand_campaign_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES brand_campaigns(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'invited' CHECK (source IN ('invited', 'applied')),
  status text NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited', 'applied', 'shortlisted', 'selected', 'delivered', 'approved', 'declined')),
  creator_pitch text NOT NULL DEFAULT '',
  proposed_fee_eur integer CHECK (proposed_fee_eur IS NULL OR proposed_fee_eur >= 0),
  availability_note text NOT NULL DEFAULT '',
  brand_note text NOT NULL DEFAULT '',
  invited_at timestamptz,
  responded_at timestamptz,
  selected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, creator_id)
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS brand_campaign_apps_creator_idx
  ON brand_campaign_applications (creator_id, updated_at DESC);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS brand_campaign_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES brand_campaigns(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES brand_campaign_applications(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  platform text NOT NULL DEFAULT 'other'
    CHECK (platform IN ('tiktok', 'instagram', 'youtube', 'other')),
  content_url text NOT NULL,
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'revision_requested', 'approved', 'rejected')),
  views integer NOT NULL DEFAULT 0 CHECK (views >= 0),
  likes integer NOT NULL DEFAULT 0 CHECK (likes >= 0),
  comments integer NOT NULL DEFAULT 0 CHECK (comments >= 0),
  shares integer NOT NULL DEFAULT 0 CHECK (shares >= 0),
  spend_eur_cents integer NOT NULL DEFAULT 0 CHECK (spend_eur_cents >= 0),
  metrics_source text NOT NULL DEFAULT 'manual'
    CHECK (metrics_source IN ('manual', 'oembed', 'api')),
  last_tracked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS brand_campaign_subs_campaign_idx
  ON brand_campaign_submissions (campaign_id, created_at DESC);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS brand_campaign_metric_snapshots (
  id bigserial PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES brand_campaign_submissions(id) ON DELETE CASCADE,
  views integer NOT NULL DEFAULT 0 CHECK (views >= 0),
  likes integer NOT NULL DEFAULT 0 CHECK (likes >= 0),
  comments integer NOT NULL DEFAULT 0 CHECK (comments >= 0),
  shares integer NOT NULL DEFAULT 0 CHECK (shares >= 0),
  captured_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS brand_campaign_snapshots_sub_idx
  ON brand_campaign_metric_snapshots (submission_id, captured_at DESC);
-- statement-breakpoint
ALTER TABLE creator_social_accounts
  ADD COLUMN IF NOT EXISTS canonical_handle text,
  ADD COLUMN IF NOT EXISTS verification_code text,
  ADD COLUMN IF NOT EXISTS verification_method text
    CHECK (verification_method IS NULL OR verification_method IN ('bio_code', 'oauth')),
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;
-- statement-breakpoint
ALTER TABLE brand_accounts ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint
ALTER TABLE brand_login_tokens ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint
ALTER TABLE brand_campaigns ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint
ALTER TABLE brand_campaign_applications ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint
ALTER TABLE brand_campaign_submissions ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint
ALTER TABLE brand_campaign_metric_snapshots ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint
INSERT INTO schema_migrations (version) VALUES ('017_brand_workspace')
ON CONFLICT DO NOTHING;

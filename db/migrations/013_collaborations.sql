-- Campaigns are private drafts until the operator explicitly approves their terms.
CREATE TABLE IF NOT EXISTS collab_campaigns (
  slug text PRIMARY KEY CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,59}$'),
  content jsonb NOT NULL,
  published_content jsonb,
  state text NOT NULL DEFAULT 'draft' CHECK (state IN ('draft','live','paused')),
  version integer NOT NULL DEFAULT 1,
  approved_at timestamptz,
  approval_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (state <> 'live' OR (approved_at IS NOT NULL AND length(approval_note) >= 10))
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS collab_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_slug text NOT NULL REFERENCES collab_campaigns(slug),
  creator_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','accepted','ready','handed_over','confirmed','declined')),
  details jsonb NOT NULL DEFAULT '{}',
  accepted_at timestamptz,
  terms_version integer,
  terms_snapshot jsonb,
  consent_version text,
  handed_over_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by text,
  confirmation_evidence text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_slug, creator_id)
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS collab_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL REFERENCES collab_memberships(id) ON DELETE CASCADE,
  token_hash text UNIQUE NOT NULL,
  token_encrypted text NOT NULL,
  recipient text NOT NULL,
  personal_note text NOT NULL,
  batch_id uuid NOT NULL,
  delivery text NOT NULL DEFAULT 'prepared' CHECK (delivery IN ('prepared','sending','sent','failed','unknown','suppressed')),
  provider_id text,
  provider_event text,
  provider_event_at timestamptz,
  send_started_at timestamptz,
  sent_at timestamptz,
  expires_at timestamptz,
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS collab_active_invitation ON collab_invitations(membership_id) WHERE revoked_at IS NULL;
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS collab_sessions (
  token_hash text PRIMARY KEY,
  invitation_id uuid NOT NULL REFERENCES collab_invitations(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS collab_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL REFERENCES collab_memberships(id) ON DELETE CASCADE,
  kind text NOT NULL,
  actor text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  idempotency_key text UNIQUE,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS collab_membership_creator ON collab_memberships(creator_id);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS collab_invitation_batch ON collab_invitations(batch_id);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS collab_event_membership ON collab_events(membership_id,occurred_at);
-- statement-breakpoint
ALTER TABLE collab_campaigns ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint
ALTER TABLE collab_memberships ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint
ALTER TABLE collab_invitations ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint
ALTER TABLE collab_sessions ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint
ALTER TABLE collab_events ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint
INSERT INTO schema_migrations(version) VALUES ('013_collaborations') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS creator_registration_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS creator_registration_email_idx
  ON creator_registration_submissions (lower(email), created_at DESC);

-- statement-breakpoint
ALTER TABLE creator_registration_submissions ENABLE ROW LEVEL SECURITY;

-- statement-breakpoint
INSERT INTO schema_migrations (version)
VALUES ('002_creator_registration')
ON CONFLICT (version) DO NOTHING;

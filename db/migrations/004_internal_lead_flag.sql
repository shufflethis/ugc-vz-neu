ALTER TABLE brand_leads
  ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT false;

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS brand_leads_is_internal_idx
  ON brand_leads (is_internal, created_at DESC);

-- statement-breakpoint
INSERT INTO schema_migrations (version)
VALUES ('004_internal_lead_flag')
ON CONFLICT (version) DO NOTHING;

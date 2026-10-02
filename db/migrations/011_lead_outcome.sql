-- Rueckmeldung der Brand per Link in der Brand-Mail (app/api/lead-feedback).
ALTER TABLE brand_leads
  ADD COLUMN IF NOT EXISTS outcome text CHECK (outcome IN ('booked', 'replied', 'silent')),
  ADD COLUMN IF NOT EXISTS outcome_note text,
  ADD COLUMN IF NOT EXISTS outcome_at timestamptz;

-- statement-breakpoint
INSERT INTO schema_migrations (version)
VALUES ('011_lead_outcome')
ON CONFLICT (version) DO NOTHING;

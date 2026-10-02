-- Freischaltung ueber das Freitier hinaus (siehe app/lib/lead-gate.ts).
-- Eintragen: INSERT INTO brand_allowlist (email, note) VALUES ('name@firma.de', 'Grund');
CREATE TABLE IF NOT EXISTS brand_allowlist (
  email text PRIMARY KEY CHECK (email = lower(email)),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS brand_leads_email_created_idx
  ON brand_leads (email, created_at DESC);

-- statement-breakpoint
INSERT INTO schema_migrations (version)
VALUES ('009_brand_allowlist')
ON CONFLICT (version) DO NOTHING;

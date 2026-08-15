-- 005_agent_layer.sql
-- AP2-Vorbereitung: unveraenderliches Log + Hash-Felder fuer spaetere Mandates.
-- Nur Datenmodell, keine Payment-Logik (Spec 2026-08-15, §4.5).

ALTER TABLE brand_leads
  ADD COLUMN IF NOT EXISTS brief_hash text,
  ADD COLUMN IF NOT EXISTS agent_request_id text;

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS brand_leads_agent_request_idx
  ON brand_leads (agent_request_id)
  WHERE agent_request_id IS NOT NULL;

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS lead_agent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES brand_leads(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload_hash text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS lead_agent_events_lead_idx
  ON lead_agent_events (lead_id, occurred_at);

-- statement-breakpoint
INSERT INTO schema_migrations (version)
VALUES ('005_agent_layer')
ON CONFLICT (version) DO NOTHING;

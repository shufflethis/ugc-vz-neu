-- 006_creator_profile_edits.sql
-- Self-Service: Aenderungsprotokoll fuer Creator-Profilaenderungen.
-- Unveraenderliches Feld-Log, damit Aenderungen nachvollziehbar bleiben und
-- bei Issues zurueckgerollt werden koennen.

CREATE TABLE IF NOT EXISTS creator_profile_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS creator_profile_edits_creator_idx
  ON creator_profile_edits (creator_id, changed_at DESC);

-- statement-breakpoint
INSERT INTO schema_migrations (version)
VALUES ('006_creator_profile_edits')
ON CONFLICT (version) DO NOTHING;

-- 021_creator_ai_profiles.sql
-- Stores multimodal AI-generated creator profile summaries, inferred niches, visual signals,
-- and creator-reviewed / voice-refined approvals used to enrich hybrid search.
-- Never stores private contact data or OAuth secrets.

CREATE TABLE IF NOT EXISTS creator_ai_profiles (
  creator_id uuid PRIMARY KEY REFERENCES creator_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'analyzing', 'draft_ready', 'approved', 'failed')),
  draft_summary text,
  approved_summary text,
  inferred_niches text[] NOT NULL DEFAULT '{}',
  approved_niches text[] NOT NULL DEFAULT '{}',
  visual_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  content_style jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_hash text,
  creator_voice_transcript text,
  analyzed_at timestamptz,
  approved_at timestamptz,
  last_attempt_at timestamptz,
  fail_count integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS creator_ai_profiles_status_idx
  ON creator_ai_profiles (status, last_attempt_at ASC NULLS FIRST);

-- statement-breakpoint
INSERT INTO schema_migrations (version)
VALUES ('021_creator_ai_profiles')
ON CONFLICT (version) DO NOTHING;

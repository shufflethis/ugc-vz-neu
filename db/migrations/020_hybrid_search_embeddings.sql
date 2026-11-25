-- 020_hybrid_search_embeddings.sql
-- Hybrid search index (German full-text tsvector + vector embeddings) for creator discovery.
-- Deliberately stores only public profile text; never includes email, phone, legal_name, or consent.

CREATE TABLE IF NOT EXISTS creator_search_index (
  creator_id uuid PRIMARY KEY REFERENCES creator_profiles(id) ON DELETE CASCADE,
  document_text text NOT NULL,
  document_hash text NOT NULL,
  search_tsv tsvector,
  embedding_model text,
  embedding_dim integer,
  embedding_values real[],
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS creator_search_index_tsv_idx
  ON creator_search_index USING GIN (search_tsv);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS creator_search_index_hash_idx
  ON creator_search_index (document_hash);

-- statement-breakpoint
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
  -- Local test engines (e.g. PGlite without pgvector) still run full-text + real[] cosine search.
  NULL;
END $$;

-- statement-breakpoint
INSERT INTO schema_migrations (version)
VALUES ('020_hybrid_search_embeddings')
ON CONFLICT (version) DO NOTHING;

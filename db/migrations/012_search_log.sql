-- Anonymes Suchprotokoll: Welche Suchtexte kommen an, und liefern sie Treffer?
-- Kein Nutzerbezug (keine IP, keine Kennung). Loeschung nach 90 Tagen erfolgt
-- beim Schreiben (app/lib/search-log.ts).
CREATE TABLE IF NOT EXISTS search_log (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  query text NOT NULL,
  result_count integer NOT NULL,
  source text NOT NULL CHECK (source IN ('web', 'agent'))
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS search_log_created_at_idx ON search_log (created_at);

-- statement-breakpoint
INSERT INTO schema_migrations (version)
VALUES ('012_search_log')
ON CONFLICT (version) DO NOTHING;

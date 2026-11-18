ALTER TABLE creator_portfolio_items
  ADD COLUMN IF NOT EXISTS skateboard_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cap_image_url text;

-- statement-breakpoint
INSERT INTO schema_migrations (version) VALUES ('015_casting_portfolio')
ON CONFLICT (version) DO NOTHING;

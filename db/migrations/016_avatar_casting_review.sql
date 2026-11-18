-- A review applies only to the exact image that was seen.
ALTER TABLE creator_social_avatars ADD COLUMN IF NOT EXISTS cap_image_sha256 bytea;

-- statement-breakpoint
INSERT INTO schema_migrations (version) VALUES ('016_avatar_casting_review')
ON CONFLICT (version) DO NOTHING;

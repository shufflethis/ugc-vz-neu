CREATE TABLE IF NOT EXISTS mcp_event_subscriptions (
  id text PRIMARY KEY,
  owner_hash text NOT NULL,
  event_name text NOT NULL,
  arguments jsonb NOT NULL,
  callback_url text NOT NULL,
  secret_encrypted text NOT NULL,
  previous_secret_encrypted text,
  rotate_until timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS mcp_creator_event_seen (
  creator_id uuid PRIMARY KEY REFERENCES creator_profiles(id) ON DELETE CASCADE,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS mcp_event_deliveries (
  event_id text NOT NULL,
  subscription_id text NOT NULL REFERENCES mcp_event_subscriptions(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  PRIMARY KEY (event_id, subscription_id)
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS mcp_event_delivery_due_idx ON mcp_event_deliveries(next_attempt_at) WHERE finished_at IS NULL;
-- statement-breakpoint
ALTER TABLE mcp_event_subscriptions ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint
ALTER TABLE mcp_creator_event_seen ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint
ALTER TABLE mcp_event_deliveries ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint
-- Existing eligible profiles establish the baseline; never announce them as new.
INSERT INTO mcp_creator_event_seen (creator_id)
SELECT p.id FROM creator_profiles p
JOIN creator_private_contacts c ON c.creator_id = p.id
WHERE p.status = 'active' AND c.email_verified_at IS NOT NULL
  AND EXISTS (SELECT 1 FROM creator_social_accounts s WHERE s.creator_id = p.id)
  AND EXISTS (SELECT 1 FROM creator_portfolio_items f WHERE f.creator_id = p.id)
  AND NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '008_mcp_events')
ON CONFLICT DO NOTHING;
-- statement-breakpoint
INSERT INTO schema_migrations(version) VALUES ('008_mcp_events') ON CONFLICT DO NOTHING;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION queue_new_verified_creator_event() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE profile_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'creator_profiles' THEN profile_id := NEW.id;
  ELSE profile_id := NEW.creator_id;
  END IF;
  WITH newly_seen AS (
    INSERT INTO mcp_creator_event_seen(creator_id)
    SELECT p.id FROM creator_profiles p JOIN creator_private_contacts c ON c.creator_id = p.id
    WHERE p.id = profile_id AND p.status = 'active' AND c.email_verified_at IS NOT NULL
      AND EXISTS (SELECT 1 FROM creator_social_accounts a WHERE a.creator_id = p.id)
      AND EXISTS (SELECT 1 FROM creator_portfolio_items f WHERE f.creator_id = p.id)
    ON CONFLICT DO NOTHING RETURNING creator_id, occurred_at
  )
  INSERT INTO mcp_event_deliveries(event_id, subscription_id, creator_id, payload)
  SELECT 'evt_creator_' || p.id::text, s.id, p.id,
    jsonb_build_object('eventId', 'evt_creator_' || p.id::text, 'name', 'creator.verified',
      'timestamp', to_char(n.occurred_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'cursor', NULL, 'data', jsonb_build_object('creator_public_id', p.public_id,
        'display_name', p.display_name, 'city', COALESCE(p.city,''), 'topics', COALESCE(p.topics,''),
        'human_verification_level', 1, 'url', 'https://ugc-vz.de/api/v1/creators/' || p.public_id))
  FROM newly_seen n JOIN creator_profiles p ON p.id = n.creator_id
  JOIN mcp_event_subscriptions s ON s.active AND s.expires_at > now()
    AND s.created_at <= n.occurred_at AND s.event_name = 'creator.verified'
  WHERE (NOT s.arguments ? 'city' OR strpos(lower(COALESCE(p.city,'')), s.arguments->>'city') > 0)
    AND (NOT s.arguments ? 'topics' OR EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(s.arguments->'topics') topic
      WHERE strpos(lower(COALESCE(p.topics,'')), topic) > 0))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
-- statement-breakpoint
CREATE OR REPLACE TRIGGER mcp_creator_profile_event AFTER INSERT OR UPDATE ON creator_profiles
FOR EACH ROW EXECUTE FUNCTION queue_new_verified_creator_event();
-- statement-breakpoint
CREATE OR REPLACE TRIGGER mcp_creator_contact_event AFTER INSERT OR UPDATE ON creator_private_contacts
FOR EACH ROW EXECUTE FUNCTION queue_new_verified_creator_event();
-- statement-breakpoint
CREATE OR REPLACE TRIGGER mcp_creator_social_event AFTER INSERT OR UPDATE ON creator_social_accounts
FOR EACH ROW EXECUTE FUNCTION queue_new_verified_creator_event();
-- statement-breakpoint
CREATE OR REPLACE TRIGGER mcp_creator_portfolio_event AFTER INSERT OR UPDATE ON creator_portfolio_items
FOR EACH ROW EXECUTE FUNCTION queue_new_verified_creator_event();

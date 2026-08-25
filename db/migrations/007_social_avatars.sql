-- 007_social_avatars.sql
-- Automatisch geholte Social-Profilbilder (Instagram/TikTok), als Bytes persistiert.
-- Instagram-CDN-URLs sind signiert und laufen ab; Hotlinks rotten deshalb weg.
-- Der Fetch laeuft primaer per VPS-Cron (scripts/fetch-social-avatars.mjs), weil
-- Instagram Vercel-IPs blockt. Ausgeliefert wird ueber /api/avatar/[publicId].

CREATE TABLE IF NOT EXISTS creator_social_avatars (
  creator_id uuid PRIMARY KEY REFERENCES creator_profiles(id) ON DELETE CASCADE,
  image bytea,
  content_type text,
  source_platform text,
  source_handle text,
  fetched_at timestamptz,
  last_attempt_at timestamptz,
  fail_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
-- has_social_avatar haengt als letzte Spalte an, weil CREATE OR REPLACE VIEW
-- bestehende Spalten nicht umsortieren darf.
CREATE OR REPLACE VIEW creator_search_public AS
 SELECT p.id,
    p.public_id,
    p.display_name,
    p.stage_name,
    p.birth_year,
    p.gender,
    p.city,
    p.country_code,
    p.height_cm,
    p.special_traits,
    p.experience_since,
    p.industries,
    p.topics,
    p.skin_type,
    p.pet_context,
    p.children_context,
    p.preferred_content,
    p.equipment,
    p.rate_text,
    p.reach_text,
    p.total_reach,
    p.profile_image_url,
    p.profile_quality_score,
    COALESCE(s.networks, ARRAY[]::text[]) AS networks,
    COALESCE(s.social_links, ''::text) AS social_links,
    COALESCE(f.portfolio_links, ''::text) AS portfolio_links,
    EXISTS (
      SELECT 1 FROM creator_social_avatars a
      WHERE a.creator_id = p.id AND a.image IS NOT NULL
    ) AS has_social_avatar
   FROM creator_profiles p
     LEFT JOIN LATERAL ( SELECT array_agg(DISTINCT creator_social_accounts.platform ORDER BY creator_social_accounts.platform) AS networks,
            string_agg(creator_social_accounts.url, E'\n'::text ORDER BY creator_social_accounts.is_primary DESC, creator_social_accounts.created_at) AS social_links
           FROM creator_social_accounts
          WHERE creator_social_accounts.creator_id = p.id) s ON true
     LEFT JOIN LATERAL ( SELECT string_agg(creator_portfolio_items.url, E'\n'::text ORDER BY creator_portfolio_items.sort_order, creator_portfolio_items.created_at) AS portfolio_links
           FROM creator_portfolio_items
          WHERE creator_portfolio_items.creator_id = p.id) f ON true
  WHERE p.status = 'active'::text;

-- statement-breakpoint
INSERT INTO schema_migrations (version)
VALUES ('007_social_avatars')
ON CONFLICT (version) DO NOTHING;

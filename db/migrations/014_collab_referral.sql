-- Fortlaufende Vermittlungs-ID je Teilnahme (Anzeige: UGCVZ-<SLUG>-0001), vergeben beim Anlegen der Einladung.
ALTER TABLE collab_memberships ADD COLUMN IF NOT EXISTS referral_no bigserial;
-- statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS collab_membership_referral ON collab_memberships(referral_no);
-- statement-breakpoint
INSERT INTO schema_migrations(version) VALUES ('014_collab_referral') ON CONFLICT DO NOTHING;

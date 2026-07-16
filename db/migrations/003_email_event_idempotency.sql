CREATE UNIQUE INDEX IF NOT EXISTS email_events_webhook_id_unique
  ON email_events ((metadata ->> 'webhook_id'))
  WHERE metadata ? 'webhook_id';

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS email_events_resend_id_idx
  ON email_events (resend_email_id, occurred_at DESC);

-- statement-breakpoint
INSERT INTO schema_migrations (version)
VALUES ('003_email_event_idempotency')
ON CONFLICT (version) DO NOTHING;

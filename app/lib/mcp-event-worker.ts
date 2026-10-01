import { getDatabase } from './database';
import { configuredTokenHashes } from './mcp-events';
import { decryptSecret, postSigned } from './mcp-event-webhook';

export async function runEventWorker() {
  const sql = getDatabase();
  // Database triggers enqueue events in the same transaction as eligibility.
  const rows = await sql.query(`WITH due AS (
    SELECT event_id, subscription_id FROM mcp_event_deliveries
    WHERE finished_at IS NULL AND next_attempt_at <= now() AND attempts < 6
    ORDER BY next_attempt_at LIMIT 4 FOR UPDATE SKIP LOCKED
  ), claimed AS (
    UPDATE mcp_event_deliveries d SET attempts = d.attempts + 1,
      next_attempt_at = now() + interval '2 minutes'
    FROM due WHERE d.event_id = due.event_id AND d.subscription_id = due.subscription_id
    RETURNING d.*
  ) SELECT claimed.*, s.owner_hash, s.callback_url, s.secret_encrypted,
    s.previous_secret_encrypted, s.rotate_until
    FROM claimed JOIN mcp_event_subscriptions s ON s.id = claimed.subscription_id`);
  const results = await Promise.all(rows.map(async (delivery: any) => {
    const [eligible] = await sql.query(`SELECT 1 FROM mcp_event_subscriptions s
      JOIN creator_profiles p ON p.id = $2
      JOIN creator_private_contacts c ON c.creator_id = p.id
      WHERE s.id = $1 AND s.active AND s.expires_at > now() AND p.status = 'active'
        AND c.email_verified_at IS NOT NULL
        AND EXISTS (SELECT 1 FROM creator_social_accounts a WHERE a.creator_id = p.id)
        AND EXISTS (SELECT 1 FROM creator_portfolio_items f WHERE f.creator_id = p.id)`,
      [delivery.subscription_id, delivery.creator_id]);
    let status = 0;
    let terminal = !eligible || !configuredTokenHashes().includes(delivery.owner_hash);
    if (!terminal) {
      try {
        const secrets = [decryptSecret(delivery.secret_encrypted)];
        if (delivery.previous_secret_encrypted && new Date(delivery.rotate_until).getTime() > Date.now()) secrets.push(decryptSecret(delivery.previous_secret_encrypted));
        const result = await postSigned(delivery.callback_url, delivery.subscription_id,
          delivery.event_id, JSON.stringify(delivery.payload), secrets);
        status = result.status;
        terminal = (status >= 200 && status < 300) || (status < 500 && status !== 429);
        if (status === 410) await sql.query('UPDATE mcp_event_subscriptions SET active = false WHERE id = $1', [delivery.subscription_id]);
      } catch { /* Network failures retry with the same event ID. No secrets in logs. */ }
    }
    terminal ||= delivery.attempts >= 6;
    const delaySeconds = Math.min(3600, 60 * 2 ** delivery.attempts);
    await sql.query(`UPDATE mcp_event_deliveries SET
      finished_at = CASE WHEN $4 THEN now() ELSE NULL END,
      next_attempt_at = now() + ($5::integer * interval '1 second')
      WHERE event_id = $1 AND subscription_id = $2 AND attempts = $3`,
      [delivery.event_id, delivery.subscription_id, delivery.attempts, terminal, delaySeconds]);
    return { status, finished: terminal };
  }));
  await sql.query(`UPDATE mcp_event_deliveries SET finished_at = now()
    WHERE finished_at IS NULL AND attempts >= 6 AND next_attempt_at <= now()`);
  return { processed: results.length, finished: results.filter(result => result.finished).length };
}

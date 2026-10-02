import { Resend } from 'resend';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { MAX_CREATORS_PER_REQUEST } from '@/app/lib/lead-limits';
import { renderCreatorOutreachEmail, type SelectedCreator } from '@/app/lib/lead-email';

export type CreatorOutreachResult = {
  queued: number;
  failed: number;
  skippedNoEmail: number;
  skippedDaily: number;
  skippedLimit: number;
  // Namen fuer den Slack-Report; noEmail mit Social-Links zum manuellen Nachfassen.
  reached: string[];
  failedNames: string[];
  dailyNames: string[];
  noEmail: { name: string; links: string }[];
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (value: unknown, max: number) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

// Brands schreiben "Hallo [Name]," / "Hallo {name},": pro Creator ersetzen, damit
// eine Anfrage mit mehreren Creatorn trotzdem persoenlich anspricht.
export const fillCreatorName = (message: string, name: string) =>
  message.replace(/\{\{?\s*name\s*\}?\}|\[\s*name\s*\]/gi, name);

/**
 * Creator-Mails gehen erst raus, wenn Resend die Brand-Mail als zugestellt
 * meldet (Webhook email.delivered) -- eine erfundene Brand-Adresse erreicht so
 * nie einen Creator. Doppelaufrufe (Webhook-Retry) sind harmlos: creator_notified_at
 * wird atomar beansprucht. Tageslimit pro Creator ebenfalls ueber diese Spalte
 * (haelt ueber Serverless-Instanzen hinweg).
 */
export async function sendCreatorOutreach(leadId: string): Promise<CreatorOutreachResult | null> {
  if (process.env.SEND_CREATOR_OUTREACH_EMAILS !== 'true' || !process.env.RESEND_API_KEY || !isDatabaseConfigured()) {
    return null;
  }
  const sql = getDatabase();

  const [lead] = await sql.query(
    `SELECT id, name, email, company, search_query, message, is_internal FROM brand_leads WHERE public_id = $1`,
    [leadId],
  );
  if (!lead || lead.is_internal) return null;

  const pending = (await sql.query(
    `SELECT creator_public_id FROM lead_creator_matches
     WHERE lead_id = $1 AND creator_notified_at IS NULL ORDER BY rank`,
    [lead.id],
  )).map((row: any) => String(row.creator_public_id));
  if (!pending.length) return null;

  const rows = await sql.query(`
    SELECT v.public_id, v.display_name, v.reach_text, v.rate_text, v.social_links,
           array_to_string(v.networks, ', ') AS network_names,
           CASE WHEN c.project_notifications_enabled AND c.notification_paused_at IS NULL THEN c.email END AS contact_email
    FROM creator_search_public v
    LEFT JOIN creator_private_contacts c ON c.creator_id = v.id
    WHERE v.public_id IN (${pending.map((_, i) => `$${i + 1}`).join(', ')})
  `, pending);
  const byId = new Map((rows as any[]).map((row) => [String(row.public_id), row]));

  const withEmail = pending.filter((id) => emailRegex.test(String(byId.get(id)?.contact_email || '')));
  const configuredMax = Number.parseInt(process.env.CREATOR_OUTREACH_MAX_PER_LEAD || '8', 10);
  const maxPerLead = Number.isFinite(configuredMax) ? Math.max(0, Math.min(MAX_CREATORS_PER_REQUEST, configuredMax)) : 8;
  const limited = withEmail.slice(0, maxPerLead);

  const claimed = (await sql.query(`
    UPDATE lead_creator_matches m SET creator_notified_at = now()
    WHERE m.lead_id = $1 AND m.creator_notified_at IS NULL
      AND m.creator_public_id IN (SELECT jsonb_array_elements_text($2::jsonb))
      AND NOT EXISTS (
        SELECT 1 FROM lead_creator_matches o
        WHERE o.creator_public_id = m.creator_public_id AND o.creator_notified_at > now() - interval '1 day'
      )
    RETURNING m.creator_public_id
  `, [lead.id, JSON.stringify(limited)])).map((row: any) => String(row.creator_public_id));

  const nameOf = (id: string) => text(byId.get(id)?.display_name, 100) || 'UGC Creator';
  const result: CreatorOutreachResult = {
    queued: 0,
    failed: 0,
    skippedNoEmail: pending.length - withEmail.length,
    skippedDaily: limited.length - claimed.length,
    skippedLimit: withEmail.length - limited.length,
    reached: [],
    failedNames: [],
    dailyNames: limited.filter((id) => !claimed.includes(id)).map(nameOf),
    noEmail: pending
      .filter((id) => !withEmail.includes(id))
      .map((id) => ({ name: nameOf(id), links: text(byId.get(id)?.social_links, 160) })),
  };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM || 'UGC VZ <hi@ugc-vz.de>';
  const internalEmail = process.env.UGC_INTERNAL_EMAIL || 'hi@ugc-vz.de';
  const searchQuery = lead.search_query === 'creator_match' ? '' : String(lead.search_query || '');
  const today = new Date().toISOString().slice(0, 10);

  for (const id of claimed) {
    const row = byId.get(id);
    const creator: SelectedCreator = {
      id,
      name: text(row.display_name, 100) || 'UGC Creator',
      reach: text(row.reach_text, 300),
      networks: text(row.network_names, 300),
      priceRange: text(row.rate_text, 200),
      contactEmail: String(row.contact_email),
      socialLinks: text(row.social_links, 500),
    };
    const email = renderCreatorOutreachEmail({
      leadId,
      creator,
      clientInfo: { name: lead.name, email: lead.email, company: lead.company || '', message: fillCreatorName(lead.message || '', creator.name), searchQuery },
      internalEmail,
    });
    let ok = false;
    try {
      const response = await resend.emails.send({
        from,
        to: creator.contactEmail as string,
        replyTo: lead.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        tags: [
          { name: 'category', value: 'creator_match' },
          { name: 'audience', value: 'creator' },
          { name: 'lead_id', value: leadId },
          { name: 'creator_id', value: id },
        ],
      }, { idempotencyKey: `ugc-vz/creator/${id}/${today}` });
      ok = !response.error;
    } catch {
      ok = false;
    }
    if (ok) {
      result.queued += 1;
      result.reached.push(creator.name);
    } else {
      result.failed += 1;
      result.failedNames.push(creator.name);
      // Fehlversand darf den Creator nicht fuer den Tag sperren.
      await sql.query(
        `UPDATE lead_creator_matches SET creator_notified_at = NULL WHERE lead_id = $1 AND creator_public_id = $2`,
        [lead.id, id],
      );
    }
    // Resend: 5 Requests/s Grundlimit.
    await new Promise((resolve) => setTimeout(resolve, 225));
  }

  return result;
}

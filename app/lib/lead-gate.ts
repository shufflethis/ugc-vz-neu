import { createHash } from 'crypto';
import { Resolver } from 'dns/promises';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { FREE_CREATORS_PER_30D, FREE_DOMAIN_LEADS_PER_30D, FREE_LEADS_PER_30D } from '@/app/lib/lead-limits';

// message: Deutsch fuer die Web-UI, messageEn: fuer Agenten (REST/MCP/A2A).
export type GateRejection = { status: number; code: string; message: string; messageEn: string };

const FREEMAIL = new Set([
  'gmail.com', 'googlemail.com', 'gmx.de', 'gmx.net', 'web.de', 'outlook.com', 'outlook.de',
  'hotmail.com', 'hotmail.de', 'yahoo.com', 'yahoo.de', 'icloud.com', 't-online.de',
  'proton.me', 'protonmail.com',
]);


// Reservierte Domains (RFC 2606) sind nie zustellbar - Agenten erfinden gern
// Adressen wie jane@brand.example.
const RESERVED_DOMAIN_RE = /(^|\.)(example|test|invalid|localhost)$|^example\.(com|org|net)$/;

const NO_RECORD = new Set(['ENOTFOUND', 'ENODATA']);
const isNoRecord = (error: unknown) => NO_RECORD.has(String((error as { code?: string })?.code));

/**
 * Kann die Domain ueberhaupt Mail empfangen? false nur bei eindeutigem Befund:
 * MX zeigt ausschliesslich auf "."/localhost, oder es gibt weder MX noch
 * A/AAAA (RFC 5321: ohne MX gilt der A-Record als Mailserver). Timeout,
 * SERVFAIL o. Ae. zaehlen als zustellbar -- ein DNS-Schluckauf darf keinen
 * Lead kosten.
 */
export async function domainAcceptsMail(domain: string): Promise<boolean> {
  const resolver = new Resolver({ timeout: 2000, tries: 2 });
  try {
    const mx = await resolver.resolveMx(domain);
    if (mx.length) return mx.some(({ exchange }) => !['', '.', 'localhost'].includes(exchange.toLowerCase()));
  } catch (error) {
    if (!isNoRecord(error)) return true;
  }
  const hasAddress = async (lookup: () => Promise<string[]>) => {
    try {
      return (await lookup()).length > 0;
    } catch (error) {
      return !isNoRecord(error);
    }
  };
  return (await hasAddress(() => resolver.resolve4(domain))) || (await hasAddress(() => resolver.resolve6(domain)));
}

/**
 * Prueft Brand-Anfragen gegen die Datenbank (haelt ueber Serverless-Instanzen
 * hinweg, anders als die In-Memory-Rate-Limits): (1) Adresse ist in den letzten
 * 30 Tagen gebounct, (2) Freitier ueberschritten und nicht freigeschaltet.
 * Fail-open: ein DB-Fehler darf keinen Lead kosten.
 */
export async function checkBrandGate({
  email,
  leadId,
  newCreators,
}: {
  email: string;
  leadId: string;
  newCreators: number;
}): Promise<GateRejection | null> {
  const domain = email.split('@')[1] || '';
  if (RESERVED_DOMAIN_RE.test(domain)) {
    return {
      status: 422,
      code: 'email_undeliverable',
      message: 'Diese E-Mail-Adresse existiert nicht. Bitte geben Sie eine funktionierende Adresse an.',
      messageEn: 'This e-mail address cannot exist (reserved domain). Please provide a working e-mail address of the requesting brand.',
    };
  }
  if (!FREEMAIL.has(domain) && !(await domainAcceptsMail(domain))) {
    return {
      status: 422,
      code: 'email_undeliverable',
      message: `Die Domain „${domain}“ kann keine E-Mails empfangen. Bitte prüfen Sie die Adresse auf Tippfehler. Falls sie stimmt, schreiben Sie uns kurz an hi@ugc-vz.de – wir helfen weiter.`,
      messageEn: `The domain "${domain}" cannot receive e-mail. Do not guess an address - ask the user for the real, working e-mail address of the requesting brand. If the address is correct, the user can write to hi@ugc-vz.de for help.`,
    };
  }
  if (!isDatabaseConfigured()) return null;
  try {
    const [r] = await getDatabase().query(`
      WITH recent AS (
        SELECT l.id, l.email FROM brand_leads l
        WHERE NOT l.is_internal AND l.public_id <> $4
          AND l.created_at > now() - interval '30 days'
          AND EXISTS (SELECT 1 FROM lead_creator_matches m WHERE m.lead_id = l.id)
      )
      SELECT
        (SELECT count(*) FROM recent WHERE email = $1)::int AS email_leads,
        (SELECT count(DISTINCT m.creator_public_id) FROM lead_creator_matches m
           JOIN recent r ON r.id = m.lead_id WHERE r.email = $1)::int AS email_creators,
        (SELECT count(*) FROM recent WHERE $2::text <> '' AND split_part(email, '@', 2) = $2::text)::int AS domain_leads,
        EXISTS (SELECT 1 FROM brand_allowlist WHERE email = $1) AS allowed,
        EXISTS (SELECT 1 FROM email_events
                WHERE audience = 'brand' AND recipient_hash = $3
                  AND event_type IN ('email.bounced', 'email.suppressed', 'email.complained')
                  AND occurred_at > now() - interval '30 days') AS bounced
    `, [
      email,
      FREEMAIL.has(domain) ? '' : domain,
      createHash('sha256').update(email).digest('hex'),
      leadId,
    ]);

    if (r.bounced) {
      return {
        status: 422,
        code: 'email_undeliverable',
        message: 'An diese E-Mail-Adresse konnte keine Nachricht zugestellt werden. Bitte geben Sie eine funktionierende Adresse an.',
        messageEn: 'Delivery to this e-mail address failed. Please provide a working e-mail address of the requesting brand.',
      };
    }
    if (r.allowed || newCreators === 0) return null;
    if (
      r.email_leads >= FREE_LEADS_PER_30D
      || r.email_creators + newCreators > FREE_CREATORS_PER_30D
      || r.domain_leads >= FREE_DOMAIN_LEADS_PER_30D
    ) {
      return {
        status: 429,
        code: 'unlock_required',
        message: `Das kostenlose Kontingent (${FREE_LEADS_PER_30D} Anfragen bzw. ${FREE_CREATORS_PER_30D} Creator pro 30 Tage) ist aufgebraucht. Schreiben Sie uns kurz über das Kontaktformular (ugc-vz.de/contact) oder an hi@ugc-vz.de, wofür Sie die Creator brauchen – wir schalten Sie kostenlos frei.`,
        messageEn: `Free allowance (${FREE_LEADS_PER_30D} requests / ${FREE_CREATORS_PER_30D} creators per 30 days) used up. Please send a short note (project, timeframe, rough budget) via https://ugc-vz.de/contact or hi@ugc-vz.de - we unlock free of charge, we just want to know what for.`,
      };
    }
    return null;
  } catch (error) {
    console.error(`[${leadId}] Lead-Gate fehlgeschlagen (fail-open)`, error instanceof Error ? error.message : 'unknown');
    return null;
  }
}

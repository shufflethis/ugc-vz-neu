// Rueckmeldung der Brand zu einer Anfrage (Link aus der Brand-Mail). GET zeigt
// nur die Seite, erst der POST schreibt - so loesen Mail-Scanner, die Links
// vorab abrufen, keine Antwort aus.
import { IncomingWebhook } from '@slack/webhook';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { verifyLeadFeedback } from '@/app/lib/lead-feedback';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ANSWERS: Record<string, string> = {
  booked: '✅ Ja – wir arbeiten mit einem Creator zusammen',
  replied: '💬 Creator haben geantwortet, noch offen',
  silent: '⏳ Bisher keine Antwort',
};

const esc = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const page = (body: string, status = 200) => new Response(
  `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Rückmeldung | UGC VZ</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:520px;margin:48px auto;padding:0 20px;color:#21172a}button{display:block;width:100%;margin:10px 0;padding:14px;border:1px solid #dfd0eb;border-radius:10px;background:#fff;font:inherit;font-weight:600;cursor:pointer;text-align:left}button:hover{background:#f5f1f8}textarea{width:100%;padding:10px;border:1px solid #dfd0eb;border-radius:10px;font:inherit;box-sizing:border-box}</style></head><body>${body}</body></html>`,
  { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } },
);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lead = url.searchParams.get('lead') || '';
  const token = url.searchParams.get('t') || '';
  if (!verifyLeadFeedback(lead, token)) return page('<h1>Link ungültig</h1><p>Bitte öffne den Link direkt aus der E-Mail.</p>', 400);
  return page(`<h1>Hat sich ein Creator gemeldet?</h1>
<p>Eine kurze Rückmeldung hilft uns, UGC VZ für Brands und Creator besser zu machen. Anfrage ${esc(lead)}</p>
<form method="post">
<input type="hidden" name="lead" value="${esc(lead)}"><input type="hidden" name="t" value="${esc(token)}">
<p><textarea name="note" rows="3" maxlength="500" placeholder="Optional: Was hat gefehlt oder gut geklappt?"></textarea></p>
${Object.entries(ANSWERS).map(([key, label]) => `<button name="answer" value="${key}">${esc(label)}</button>`).join('')}
</form>`);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const lead = String(form.get('lead') || '');
  const token = String(form.get('t') || '');
  const answer = String(form.get('answer') || '');
  const note = String(form.get('note') || '').replace(/\s+/g, ' ').trim().slice(0, 500);
  if (!verifyLeadFeedback(lead, token) || !ANSWERS[answer]) return page('<h1>Link ungültig</h1>', 400);
  if (!isDatabaseConfigured()) return page('<h1>Gerade nicht möglich</h1><p>Bitte später erneut versuchen.</p>', 503);

  try {
    const rows = await getDatabase().query(
      `UPDATE brand_leads SET outcome = $2, outcome_note = $3, outcome_at = now() WHERE public_id = $1 RETURNING id`,
      [lead, answer, note || null],
    );
    if (!rows.length) return page('<h1>Anfrage nicht gefunden</h1>', 404);
  } catch (error) {
    console.error(`[${lead}] Rückmeldung nicht gespeichert`, error instanceof Error ? error.message : 'unknown');
    return page('<h1>Gerade nicht möglich</h1><p>Bitte später erneut versuchen.</p>', 500);
  }

  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await new IncomingWebhook(process.env.SLACK_WEBHOOK_URL).send({
        text: `📬 Rückmeldung zu Lead ${lead}: ${ANSWERS[answer]}${note ? `\nNotiz: ${note.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string)}` : ''}`,
      });
    } catch (error) {
      console.error(`[${lead}] Slack-Rückmeldung fehlgeschlagen`, error instanceof Error ? error.message : 'unknown');
    }
  }
  return page('<h1>Danke für deine Rückmeldung!</h1><p>Wir melden uns, falls wir helfen können. <a href="https://ugc-vz.de">Zu UGC VZ</a></p>');
}

import { createHmac, timingSafeEqual } from 'crypto';

export const LEAD_ID_RE = /^UGC-[A-Z0-9]{8,16}$/;

const secret = () => process.env.LEAD_LINK_SECRET || process.env.RESEND_WEBHOOK_SECRET || '';

const sign = (leadId: string) => createHmac('sha256', secret()).update(`lead-feedback:${leadId}`).digest('hex').slice(0, 32);

/** Signierter Link, damit nur Empfaenger der Brand-Mail Rueckmeldungen setzen koennen. */
export function leadFeedbackUrl(leadId: string): string | null {
  if (!secret() || !LEAD_ID_RE.test(leadId)) return null;
  return `https://ugc-vz.de/api/lead-feedback?lead=${leadId}&t=${sign(leadId)}`;
}

export function verifyLeadFeedback(leadId: string, token: string): boolean {
  if (!secret() || !LEAD_ID_RE.test(leadId)) return false;
  const expected = Buffer.from(sign(leadId));
  const supplied = Buffer.from(token);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

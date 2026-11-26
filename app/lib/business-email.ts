/**
 * Geschäftliche E-Mail-Prüfung für Marken-Accounts & Kampagnen-Starts.
 * Creator dürfen selbstverständlich private E-Mail-Adressen nutzen; für Brands & Agenturen
 * verlangen wir eine eigene Unternehmens-Domain (Schutz vor Spam, Fake-Anfragen & Scraping).
 *
 * Bewusst ohne Node-spezifische Imports (crypto/dns), damit die Prüfung identisch
 * sowohl clientseitig (sofortiges Feedback) als auch serverseitig (harter Block) läuft.
 */

export const CONSUMER_FREEMAIL_DOMAINS = new Set<string>([
  // International
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'outlook.de',
  'outlook.at',
  'outlook.ch',
  'hotmail.com',
  'hotmail.de',
  'hotmail.at',
  'hotmail.ch',
  'live.com',
  'live.de',
  'live.at',
  'msn.com',
  'yahoo.com',
  'yahoo.de',
  'yahoo.at',
  'yahoo.ch',
  'ymail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'aol.de',
  'proton.me',
  'protonmail.com',
  'pm.me',
  'zoho.com',
  'yandex.com',
  'yandex.ru',
  'mail.com',
  'mail.ru',
  'fastmail.com',
  // DACH Freemail / ISP
  'gmx.de',
  'gmx.net',
  'gmx.at',
  'gmx.ch',
  'gmx.com',
  'web.de',
  't-online.de',
  'freenet.de',
  'arcor.de',
  'vodafone.de',
  'vodafonemail.de',
  'o2online.de',
  'telekom.de',
  'magenta.de',
  'online.de',
  '1und1.de',
  'mail.de',
  'email.de',
  'posteo.de',
  'posteo.net',
  'mailbox.org',
  'bluewin.ch',
  'hispeed.ch',
  'sunrise.ch',
  'aon.at',
  'chello.at',
  'a1.net',
  'utanet.at',
  // Wegwerf-Adressen
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'yopmail.com',
  'trashmail.com',
  'trashmail.de',
  'sharklasers.com',
  'discard.email',
]);

export const FREEMAIL_REJECTION_MESSAGE =
  'Bitte nutze eine geschäftliche E-Mail-Adresse deiner Marke oder Agentur (keine Free-Mail wie Gmail, GMX oder Web.de).';

export function extractEmailDomain(email: string): string {
  const parts = String(email || '').trim().toLowerCase().split('@');
  return parts.length === 2 ? parts[1].trim() : '';
}

export function isFreeEmailAddress(email: string): boolean {
  const domain = extractEmailDomain(email);
  if (!domain) return false;
  return CONSUMER_FREEMAIL_DOMAINS.has(domain);
}

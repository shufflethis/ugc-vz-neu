export const INVITATION_DAYS = 14;
export const COLLAB_SESSION_COOKIE = 'ugcvz_collaboration';
export const CONSENT_VERSION = 'collaboration-2026-10-v2';
// Einwilligung nach Flos Content-Paket 8.3 (Firmierung von fomo noch offen).
export const consentText = (contact:string, company='fomo') => `Ich bin einverstanden, dass UGC VZ meinen Namen, meine E-Mail-Adresse, meine Social Profile und meine Vermittlungs ID an ${company} weitergibt, damit ${company} meine Teilnahme prüfen und mich ins Onboarding aufnehmen kann. Ich kann diese Einwilligung jederzeit per Mail an ${contact} widerrufen. Mehr in der Datenschutzerklärung.`;
export const ADULT_TEXT = 'Ich bin mindestens 18 Jahre alt.';
export const DECLINE_REASONS = ['Gerade keine Zeit','Krypto ist nicht meins','Konditionen passen nicht','Vielleicht später','Anderer Grund'] as const;
export type CampaignContent = {
  brand: string; title: string; summary: string; benefit: string;
  task: string; requirements: string; reward: string; terms: string;
  guideUrl: string; contactName: string; contactEmail: string;
};
export type Campaign = { slug: string; content: CampaignContent; state: 'draft'|'live'|'paused'; version: number; approval_note?: string };
export type Details = { name: string; language: string; availability: string; socialUrl: string; discord: string };
export type MemberStatus = 'invited'|'accepted'|'ready'|'handed_over'|'confirmed'|'declined';
export const STATUS: Record<MemberStatus,string> = { invited:'Eingeladen', accepted:'Angaben ergänzen', ready:'Bereit zur Übergabe', handed_over:'Übergabe erfolgt', confirmed:'Aufnahme bestätigt', declined:'Abgesagt' };
export type Member = { referral_no?:string|number|null; gender?:string|null; id:string; creator_id:string; campaign_slug:string; status:MemberStatus; details:Partial<Details>; version:number; accepted_at:string|null; terms_version:number|null; terms_snapshot:CampaignContent|null; consent_version:string|null; confirmed_by:string|null; confirmation_evidence:string|null; confirmed_at:string|null; name:string; email:string; social_url:string|null; content:CampaignContent; campaign_state:Campaign['state']; campaign_version:number };
export const missingDetails = (details: Partial<Details>): string[] => [!details.language && 'Posting-Sprache',!details.availability && 'Startdatum / Verfügbarkeit',!details.socialUrl && 'Social-Profil',!details.name && 'Name'].filter(Boolean) as string[];
export function isCollaborationPath(path: string) { return /^\/(kooperationen|einladung)(\/|$)/.test(path) || /^\/konto\/kooperationen(\/|$)/.test(path) || /^\/admin\/kooperationen(\/|$)/.test(path) || /^\/api\/collaborations(\/|$)/.test(path); }

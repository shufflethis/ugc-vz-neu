export type VerificationLevel = 0 | 1;

export const VERIFICATION_LEVELS = {
  0: {
    name: 'self_reported',
    criteria: 'Profil vorhanden; Angaben stammen vom Creator selbst.',
    issued: true,
  },
  1: {
    name: 'self_reported_with_portfolio',
    criteria: 'Mindestens ein Portfolio-Link UND mindestens ein Social-Link am Profil hinterlegt.',
    issued: true,
  },
  2: {
    name: 'identity_verified',
    criteria: 'Reserviert. Es existiert derzeit kein Identitaetspruefprozess; diese Stufe wird nicht vergeben.',
    issued: false,
    reserved: true,
  },
} as const;

export function deriveVerificationLevel(input: { portfolioCount: number; socialCount: number }): {
  level: VerificationLevel;
  name: (typeof VERIFICATION_LEVELS)[0]['name'] | (typeof VERIFICATION_LEVELS)[1]['name'];
} {
  if (input.portfolioCount >= 1 && input.socialCount >= 1) {
    return { level: 1, name: VERIFICATION_LEVELS[1].name };
  }
  return { level: 0, name: VERIFICATION_LEVELS[0].name };
}

import assert from 'node:assert/strict';
import { signSession, verifySession } from '../app/lib/creator-session';
import { buildCreatorLoginEmail, CREATOR_LOGIN_TTL_MINUTES } from '../app/lib/creator-login-email';
import { diffProfile, type CreatorProfileView } from '../app/lib/creator-profile';

process.env.CREATOR_SESSION_SECRET = 'test-secret-00000000000000000000000000000000';

// Session: sign/verify round-trip + tamper rejection.
const token = signSession('123e4567-e89b-12d3-a456-426614174000');
assert.equal(verifySession(token), '123e4567-e89b-12d3-a456-426614174000');
assert.equal(verifySession(undefined), null);
assert.equal(verifySession(''), null);
assert.equal(verifySession(`${token}x`), null);
assert.equal(verifySession(token.replace(/\./g, '').slice(0, 10)), null);

// Login email: contains the link, the name, and the referral hint.
const email = buildCreatorLoginEmail({ name: 'Alex Test', loginUrl: 'https://ugc-vz.de/api/creator/login/verify?token=abc' });
assert.match(email.subject, /Anmeldelink/);
assert.match(email.html, /Alex/);
assert.match(email.html, /token=abc/);
assert.match(email.html, /Sag es weiter/);
assert.match(email.text, new RegExp(String(CREATOR_LOGIN_TTL_MINUTES)));

// Diff: only changed fields are reported.
const before: CreatorProfileView = {
  publicId: 'UGC-ABC123',
  name: 'Alex Test',
  stageName: '',
  email: 'alex@example.com',
  birthYear: 1995,
  gender: 'Weiblich',
  city: 'Berlin',
  topics: 'Beauty, Food',
  preferredContent: 'Reels',
  industries: '',
  rateText: 'Video ab 180 €',
  reachText: 'Instagram 2.400',
  equipment: '',
  specialTraits: '',
  childrenContext: '',
  petContext: '',
  socialLinks: ['https://instagram.com/alex', 'https://tiktok.com/@alex'],
  portfolioLinks: ['https://drive.google.com/a'],
  newsletterConsent: false,
};

const after: CreatorProfileView = {
  ...before,
  city: 'Hamburg',
  portfolioLinks: ['https://drive.google.com/a', 'https://youtube.com/watch'],
  newsletterConsent: true,
};

const edits = diffProfile(before, after);
const fields = edits.map((edit) => edit.field_name);
assert.deepEqual(fields.sort(), ['city', 'newsletter_enabled', 'portfolio_links']);

// Reordering links alone is not a content change.
const reordered: CreatorProfileView = { ...before, socialLinks: [...before.socialLinks].reverse() };
assert.deepEqual(diffProfile(before, reordered), []);

console.log('Creator dashboard helpers: OK');

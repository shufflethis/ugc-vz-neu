import assert from 'node:assert/strict';
import { buildCreatorVerificationEmail } from '../app/lib/creator-registration-email';
import { calculateReach, normalizeWebUrls, socialPlatform } from '../app/lib/creator-registration';

const urls = normalizeWebUrls([
  'https://www.instagram.com/beispiel/?utm_source=qr',
  'www.tiktok.com/@beispiel?_t=tracking',
  'javascript:alert(1)',
]);

assert.equal(urls.length, 2);
assert.equal(urls[0], 'https://www.instagram.com/beispiel/');
assert.equal(urls[1], 'https://www.tiktok.com/@beispiel');
assert.equal(socialPlatform(urls[0]), 'instagram');
assert.equal(calculateReach('Instagram 10.400, TikTok 2,5k'), 12_900);

const email = buildCreatorVerificationEmail({
  name: 'Alex <Test>',
  verificationUrl: 'https://ugc-vz.de/api/creators/verify?token=abc&safe=1',
});
assert.match(email.subject, /Bestätige/);
assert.match(email.html, /Alex/);
assert.doesNotMatch(email.html, /Alex <Test>/);
assert.match(email.html, /token=abc&amp;safe=1/);
assert.match(email.text, /24 Stunden/);

console.log('Creator registration helpers: OK');

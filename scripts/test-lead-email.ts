import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import {
  isInternalRequest,
  renderBrandMatchEmail,
  renderCreatorOutreachEmail,
  renderInternalLeadEmail,
  type LeadClientInfo,
  type SelectedCreator,
} from '../app/lib/lead-email';

const clientInfo: LeadClientInfo = {
  name: 'Beispiel Brand',
  email: 'brand@example.test',
  message: 'Drei Videos für eine Paid-Social-Kampagne',
  searchQuery: 'Beauty Creator aus Berlin, TikTok, Budget bis 1.000 Euro',
  sourceUrl: 'https://ugc-vz.de/',
  submissionId: 'email-template-test-123456',
};

const selectedCreators: SelectedCreator[] = [{
  id: 'recPreview123456',
  name: 'Anna Beispiel',
  reach: 'TikTok: 42k',
  networks: 'TikTok, Instagram',
  priceRange: '500–800 €',
  contactEmail: 'anna@example.test',
  socialLinks: 'https://instagram.com/anna?igsh=tracking&utm_source=qr',
}, {
  id: 'recPreview654321',
  name: 'Beispiel ohne Reichweitenzahl',
  reach: 'Als UGC-Creator konzentriere ich mich auf authentischen Content für Marken; meine eigene Reichweite steht für die Produktion nicht im Vordergrund.',
  networks: 'www.tiktok.com/@beispiel',
  priceRange: '',
  socialLinks: 'www.tiktok.com/@beispiel',
}];

const brand = renderBrandMatchEmail({
  leadId: 'UGC-PREVIEW123',
  clientInfo,
  selectedCreators,
  internalEmail: 'hi@ugc-vz.de',
});

const internal = renderInternalLeadEmail({
  leadId: 'UGC-PREVIEW123',
  kind: 'creator_match',
  clientInfo,
  selectedCreators,
  brandDelivery: { status: 'queued', id: 'resend-preview' },
});

const creator = renderCreatorOutreachEmail({
  leadId: 'UGC-PREVIEW123',
  creator: selectedCreators[0],
  clientInfo,
  internalEmail: 'hi@ugc-vz.de',
});

assert.match(brand.html, /Anna Beispiel/);
assert.match(brand.html, /500–800 €/);
assert.match(brand.html, /anna@example\.test/);
assert.match(brand.html, /Instagram öffnen/);
assert.match(brand.html, /https:\/\/instagram\.com\/anna/);
assert.doesNotMatch(brand.html, /igsh=|utm_source=qr/);
assert.equal((brand.html.match(/https:\/\/instagram\.com\/anna/g) || []).length, 1);
assert.match(brand.html, /Keine konkrete Reichweite angegeben/);
assert.doesNotMatch(brand.html, /meine eigene Reichweite steht/);
assert.match(brand.html, /Kampagnen-Support/);
assert.match(brand.html, /geo-agentur/);
assert.match(brand.text, /anna@example\.test/);
assert.match(internal.html, /Von Resend angenommen/);
assert.match(creator.html, /Eine Brand interessiert sich für dein Profil/);
assert.match(creator.html, /Interesse &amp; Verfügbarkeit senden/);
assert.match(creator.html, /Profilangaben aktualisieren/);
assert.match(creator.html, /keine Vermittlungsgebühr oder Provision/);
assert.match(creator.html, /Benachrichtigungen pausieren/);
assert.ok(Buffer.byteLength(brand.html) > 8_000);

// Domainerkennung: das Ziel-Postfach ist die einzige Authentifizierung,
// deshalb muss der Suffix-Anker exakt sitzen.
assert.equal(isInternalRequest('info@famefact.com'), true);
assert.equal(isInternalRequest('Name@FameFact.com'), true);
assert.equal(isInternalRequest('  info@famefact.com  '), true);
assert.equal(isInternalRequest('angreifer@famefact.com.evil.de'), false);
assert.equal(isInternalRequest('x@notfamefact.com'), false);
assert.equal(isInternalRequest('famefact.com@gmail.com'), false);
assert.equal(isInternalRequest('info@sub.famefact.com'), false);
assert.equal(isInternalRequest(''), false);

writeFileSync('/tmp/ugc-creator-email-preview.html', creator.html, 'utf8');

console.log(JSON.stringify({
  subject: brand.subject,
  brandHtmlBytes: Buffer.byteLength(brand.html),
  brandTextBytes: Buffer.byteLength(brand.text),
  internalHtmlBytes: Buffer.byteLength(internal.html),
  creatorHtmlBytes: Buffer.byteLength(creator.html),
  result: 'passed',
}, null, 2));

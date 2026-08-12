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
import { renderInternalMatchEmail } from '../app/lib/internal-dossier-email';

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

const internalCreators: SelectedCreator[] = [{
  id: 'UGC-A1B2C3D4E5',
  name: 'Anna Beispiel',
  reach: 'TikTok: 42k, Instagram: 12k',
  networks: 'TikTok, Instagram',
  priceRange: '500–800 € pro Video, Nutzungsrechte 3 Monate inklusive',
  contactEmail: 'anna@example.test',
  socialLinks: 'https://instagram.com/anna',
  internal: {
    birthYear: 1998,
    approxAge: 28,
    gender: 'weiblich',
    city: 'Berlin',
    countryCode: 'DE',
    heightCm: 172,
    phone: '+49 170 1234567',
    contactText: 'Am besten per WhatsApp erreichbar',
    emailVerifiedAt: '2026-03-01T10:00:00.000Z',
    notificationsPaused: false,
    socialAccounts: [
      { platform: 'tiktok', handle: '@annabeispiel', url: 'https://tiktok.com/@annabeispiel', followers: 42000, isPrimary: true },
      { platform: 'instagram', handle: '@anna', url: 'https://instagram.com/anna', followers: 12000, isPrimary: false },
    ],
    portfolioLinks: 'https://example.test/portfolio',
    totalReach: 54000,
    industries: 'Beauty, Food',
    topics: 'Skincare-Routinen',
    preferredContent: 'Testimonials, Unboxing',
    equipment: 'iPhone 15 Pro, Ringlicht',
    experienceSince: '2021',
    specialTraits: 'Zwillinge im Haushalt',
    skinType: 'Mischhaut',
    petContext: 'Hund',
    childrenContext: 'Zwei Kinder',
    profileQualityScore: 87,
  },
}, {
  id: 'UGC-F6G7H8I9J0',
  name: 'Pausierter Creator',
  reach: '',
  networks: 'TikTok',
  priceRange: '',
  contactEmail: 'pausiert@example.test',
  socialLinks: '',
  internal: {
    birthYear: null,
    approxAge: null,
    gender: '',
    city: '',
    countryCode: 'DE',
    heightCm: null,
    phone: '',
    contactText: '',
    emailVerifiedAt: null,
    notificationsPaused: true,
    socialAccounts: [],
    portfolioLinks: '',
    totalReach: 0,
    industries: '',
    topics: '',
    preferredContent: '',
    equipment: '',
    experienceSince: '',
    specialTraits: '',
    skinType: '',
    petContext: '',
    childrenContext: '',
    profileQualityScore: 12,
  },
}];

const dossier = renderInternalMatchEmail({
  leadId: 'UGC-PREVIEW123',
  clientInfo: { ...clientInfo, name: 'Team famefact', email: 'info@famefact.com' },
  selectedCreators: internalCreators,
  internalEmail: 'hi@ugc-vz.de',
});

// Entscheidungsdaten muessen sichtbar sein
assert.match(dossier.subject, /\[INTERN\]/);
assert.match(dossier.html, /\+49 170 1234567/);
assert.match(dossier.html, /ca\. 28 Jahre/);
assert.match(dossier.html, /42\.000/);
assert.match(dossier.html, /Berlin/);
assert.match(dossier.html, /Nutzungsrechte 3 Monate inklusive/);
assert.match(dossier.html, /tel:\+491701234567/);
assert.match(dossier.html, /Am besten per WhatsApp erreichbar/);
assert.match(dossier.html, /Mischhaut/);
assert.match(dossier.text, /\+49 170 1234567/);

// Pausierte Creator: Kontakt sichtbar, aber deutlich markiert
assert.match(dossier.html, /Benachrichtigungen pausiert/);
assert.match(dossier.html, /pausiert@example\.test/);

// Leere Felder werden ausgelassen statt als "Nicht angegeben" gerendert
assert.doesNotMatch(dossier.html, /Hauttyp<\/td>\s*<td[^>]*><\/td>/);

// Kein Marketing im internen Dossier
assert.doesNotMatch(dossier.html, /geo-agentur/);
assert.doesNotMatch(dossier.html, /Kampagnen-Support/);

// Die externe Brand-Mail darf keine Privatdaten enthalten, auch nicht wenn
// derselbe Creator-Datensatz mit befuelltem internal-Feld durchgereicht wird.
const brandWithInternalData = renderBrandMatchEmail({
  leadId: 'UGC-PREVIEW123',
  clientInfo,
  selectedCreators: internalCreators,
  internalEmail: 'hi@ugc-vz.de',
});
assert.doesNotMatch(brandWithInternalData.html, /\+49 170 1234567/);
assert.doesNotMatch(brandWithInternalData.html, /1998/);
assert.doesNotMatch(brandWithInternalData.html, /Mischhaut/);
assert.doesNotMatch(brandWithInternalData.text, /\+49 170 1234567/);

writeFileSync('/tmp/ugc-creator-email-preview.html', creator.html, 'utf8');

console.log(JSON.stringify({
  subject: brand.subject,
  brandHtmlBytes: Buffer.byteLength(brand.html),
  brandTextBytes: Buffer.byteLength(brand.text),
  internalHtmlBytes: Buffer.byteLength(internal.html),
  creatorHtmlBytes: Buffer.byteLength(creator.html),
  dossierHtmlBytes: Buffer.byteLength(dossier.html),
  result: 'passed',
}, null, 2));

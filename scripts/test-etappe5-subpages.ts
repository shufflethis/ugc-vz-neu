import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { FAQ_GROUPS } from '../app/faq/faq-data';
import { buildCreatorVerificationEmail } from '../app/lib/creator-registration-email';

const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function run() {
  // 1. /brands checks
  const brands = stripComments(read('app/brands/page.tsx'));
  assert.equal((brands.match(/<h1\b/g) || []).length, 1, '/brands must have exactly one <h1>');
  assert.equal(/optionales?\s+budget/i.test(brands), false, '/brands must not describe budget as optional');
  assert.equal(/Warum ist das kostenlos/i.test(brands), false, '/brands must not contain "Warum ist das kostenlos"');
  assert.equal(/Kontaktdaten kostenlos/i.test(brands), false, '/brands must not promise "Kontaktdaten kostenlos"');
  const headingMatches = brands.match(/<h[1-3]\b[^>]*>[\s\S]*?<\/h[1-3]>/g) || [];
  for (const h of headingMatches) {
    assert.equal(/\bTKP\b/.test(h), false, `/brands heading must not contain "TKP": ${h}`);
  }
  assert.ok(brands.includes('ViewBudgetCalculator'), '/brands must embed ViewBudgetCalculator');
  assert.ok(brands.includes('VerificationProofSection'), '/brands must embed VerificationProofSection');
  assert.ok(brands.includes('FloFounderCard'), '/brands must embed FloFounderCard');
  assert.ok(brands.includes('Beispielansicht'), '/brands dashboard preview must be labeled Beispielansicht');

  // 2. /brands/ugc-creator-finden checks
  const finden = stripComments(read('app/brands/ugc-creator-finden/page.tsx'));
  assert.equal((finden.match(/<h1\b/g) || []).length, 1, '/brands/ugc-creator-finden must have exactly one <h1>');
  assert.equal(/ohne provision/i.test(finden), false, '/brands/ugc-creator-finden must not claim "ohne Provision"');
  assert.equal(/Kontaktdaten kostenlos/i.test(finden), false, '/brands/ugc-creator-finden must not claim "Kontaktdaten kostenlos"');
  assert.ok(finden.includes('<SearchBox'), '/brands/ugc-creator-finden must render SearchBox');

  // 3. /creator & 2-field Step-1 signup + OTP checks
  const creatorPage = stripComments(read('app/creator/page.tsx'));
  assert.equal((creatorPage.match(/<h1\b/g) || []).length, 1, '/creator must have exactly one <h1>');
  assert.ok(creatorPage.includes('Verdiene pro 1.000 Views'), '/creator H1 must highlight Views earnings');
  assert.ok(creatorPage.includes('stats.highestTkpEurCents'), '/creator big number must come from live campaign stats');
  assert.ok(creatorPage.includes('So wird dein Profil stark'), '/creator must include collapsed profile tips accordion');
  assert.equal(/Lea\s*·\s*München/.test(creatorPage), false, '/creator must not contain unlabelled fake profile Lea');

  const creatorForm = stripComments(read('app/creator/CreatorRegistrationForm.tsx'));
  assert.equal(creatorForm.includes('birthYear'), false, 'Creator Step 1 signup must not ask for birthYear');
  assert.equal(/\bgender\b/.test(creatorForm), false, 'Creator Step 1 signup must not ask for gender');
  assert.ok(creatorForm.includes('role="progressbar"'), 'Creator signup must expose accessible progressbar');
  assert.ok(creatorForm.includes('scaleX'), 'Creator signup progress bar must animate via scaleX');
  assert.ok(creatorForm.includes('<OtpInput'), 'Creator signup must allow direct 6-digit OTP verification in browser');
  assert.ok(creatorForm.includes('/api/creators/verify'), 'Creator signup must POST OTP code to /api/creators/verify');

  const otpEmail = buildCreatorVerificationEmail({
    name: 'Mina',
    verificationUrl: 'https://ugc-vz.de/api/creators/verify?token=abc',
    otpCode: '482910',
  });
  assert.ok(otpEmail.subject.includes('482910'), 'Verification email subject must contain OTP code when provided');
  assert.ok(otpEmail.html.includes('482910'), 'Verification email HTML must contain OTP code');

  // 4. /about checks
  const about = stripComments(read('app/about/page.tsx'));
  assert.equal((about.match(/<h1\b/g) || []).length, 1, '/about must have exactly one <h1>');
  assert.equal(/kostenloses?\s+.*verzeichnis/i.test(about), false, '/about must not use "kostenloses Verzeichnis"');
  assert.equal(/Join the Movement/i.test(about), false, '/about must not contain "Join the Movement"');
  assert.equal(/Brücke|demokratisieren/i.test(about), false, '/about must not contain banned clichés');
  assert.ok(about.includes('FloFounderCard'), '/about must feature FloFounderCard prominently');

  // 5. /faq checks (4 SSR tabs, <= 60 words per answer, all 6 mandatory new questions)
  const faqTabs = read('app/faq/FaqTabsClient.tsx');
  assert.ok(faqTabs.includes('until-found'), '/faq tabs must render inactive panels with hidden="until-found"');
  assert.equal(FAQ_GROUPS.length, 4, '/faq must have exactly 4 tab groups');
  assert.deepEqual(
    FAQ_GROUPS.map((g) => g.label),
    ['Für Marken', 'Für Creator', 'Abrechnung', 'Technik & Datenschutz'],
  );
  const allQuestions = FAQ_GROUPS.flatMap((g) => g.items);
  const mandatoryQuestions = [
    'Was kostet eine View-Kampagne?',
    'Wann und wie zahle ich?',
    'Was passiert, wenn mein Budget aufgebraucht ist?',
    'Wann bekomme ich als Creator mein Geld?',
    'Muss ich Werbung kennzeichnen?',
    'Brauche ich ein Gewerbe?',
  ];
  for (const requiredQ of mandatoryQuestions) {
    assert.ok(
      allQuestions.some((item) => item.question === requiredQ),
      `/faq missing required question: "${requiredQ}"`,
    );
  }
  for (const item of allQuestions) {
    const wc = wordCount(item.answer);
    assert.ok(wc <= 60, `/faq answer exceeds 60 words (${wc}): "${item.question}"`);
    assert.equal(/Kontaktdaten kostenlos/i.test(item.answer), false, `/faq must not mention Kontaktdaten kostenlos`);
    assert.equal(/[\u2013\u2014]/.test(item.question + item.answer), false, `/faq must not contain en/em dashes`);
  }

  // 6. /wissen checks
  const wissenClient = stripComments(read('app/wissen/ClientWissenContent.tsx'));
  for (const label of ['Marken', 'Creator', 'Recht', 'Preise']) {
    assert.ok(wissenClient.includes(`label: '${label}'`), `/wissen must provide filter chip "${label}"`);
  }
  assert.ok(wissenClient.includes('Geprüft:'), '/wissen cards must show review date');

  // 7. Global Spec 8.1 guardrails across all Etappe 5 files
  const etappe5Files = [
    'app/brands/page.tsx',
    'app/brands/ugc-creator-finden/page.tsx',
    'app/creator/page.tsx',
    'app/creator/CreatorRegistrationForm.tsx',
    'app/about/page.tsx',
    'app/faq/page.tsx',
    'app/faq/FaqTabsClient.tsx',
    'app/wissen/WissenListingPage.tsx',
    'app/wissen/ClientWissenContent.tsx',
    'app/lib/creator-registration-email.ts',
  ];
  const forbiddenCliches = /\b(tauche ein|revolutionär|nahtlos|demokratisieren)\b/i;

  for (const rel of etappe5Files) {
    const clean = stripComments(read(rel));
    assert.equal(/[\u2013\u2014]/.test(clean), false, `${rel} must not contain en/em dashes`);
    assert.equal(forbiddenCliches.test(clean), false, `${rel} must not contain forbidden clichés`);
    assert.equal(/\bUGC-VZ\b/.test(clean), false, `${rel} must consistently write "UGC VZ"`);
  }

  console.log(`OK Etappe 5 Subpages (${allQuestions.length} FAQ items <= 60 words, 4 SSR tabs, 2-field Creator signup + OTP, /brands, /about, /wissen).`);
}

run();

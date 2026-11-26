import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

function run() {
  // 1. Header checks (Spec 8.2 global.header)
  const header = read('app/components/SiteHeader.tsx');
  const navMatches = header.match(/href:\s*'\/(brands|creator|preise|wissen)'/g) || [];
  assert.equal(navMatches.length, 4, 'Header must expose exactly 4 top-level nav links');
  assert.ok(header.includes('Anmelden'), 'Header must contain Anmelden dropdown');
  assert.ok(header.includes('Kampagne starten'), 'Header must contain brand CTA');
  assert.ok(header.includes('Kostenlos mitmachen'), 'Header must contain creator CTA');

  // 2. Footer checks (Spec 8.2 global.footer)
  const footer = stripComments(read('src/components/FooterNew.tsx'));
  assert.equal(/<h[1-4]\b/i.test(footer), false, 'Footer must not contain any H1-H4 headings');
  assert.equal(/ohne provision/i.test(footer), false, 'Footer must not claim "Ohne Provision"');
  assert.equal(/free directory|free for brands/i.test(footer), false, 'Footer must not claim "free directory"');
  assert.equal(/\bUGC-VZ\b/.test(footer), false, 'Footer must consistently write "UGC VZ" in visible text');
  assert.ok(footer.includes('/alle-seiten'), 'Footer must link to /alle-seiten HTML sitemap');
  assert.ok(footer.includes('Auch für KI-Agenten'), 'Footer must include compact AI agent line');

  // 3. Homepage checks (Spec 8.1, 8.2, 8.3, 8.10 + user request to keep search)
  const home = stripComments(read('app/page.tsx'));
  const h1Count = (home.match(/<h1\b/g) || []).length;
  assert.equal(h1Count, 1, 'Homepage must have exactly one <h1>');
  assert.equal(/Kontaktinfos kostenlos/i.test(home), false, 'Homepage must not promise "Kontaktinfos kostenlos"');
  assert.equal(/ohne provision/i.test(home), false, 'Homepage must not claim "ohne Provision"');
  assert.ok(home.includes('QuickBriefCard'), 'Homepage must render QuickBriefCard');
  assert.ok(home.includes('<SearchBox'), 'Homepage must preserve interactive SearchBox per user instruction');
  assert.ok(home.includes('CampaignHowTabs'), 'Homepage must render CampaignHowTabs');
  assert.ok(home.includes('VerificationProofSection'), 'Homepage must render VerificationProofSection');
  assert.ok(home.includes('FloFounderCard'), 'Homepage must render FloFounderCard');
  assert.ok(home.includes('HOME_FAQS.map'), 'Homepage FAQPage JSON-LD must reuse visible HOME_FAQS');

  // 4. Spec 8.1 copy guardrails across all Etappe 4 files
  const newFiles = [
    'app/page.tsx',
    'app/components/SiteHeader.tsx',
    'src/components/FooterNew.tsx',
    'app/components/TrustElements.tsx',
    'app/components/home/QuickBriefCard.tsx',
    'app/components/home/CampaignHowTabs.tsx',
    'app/components/home/VerificationProofSection.tsx',
    'app/components/home/FloFounderCard.tsx',
    'app/alle-seiten/page.tsx',
  ];
  const forbiddenCliches = /\b(tauche ein|revolutionär|nahtlos|demokratisieren)\b/i;

  for (const rel of newFiles) {
    const clean = stripComments(read(rel));
    assert.equal(
      /[\u2013\u2014]/.test(clean),
      false,
      `${rel} must not contain en-dash (U+2013) or em-dash (U+2014)`,
    );
    assert.equal(
      forbiddenCliches.test(clean),
      false,
      `${rel} must not contain forbidden AI clichés`,
    );
  }

  // 5. SSR Tabs check
  const howTabs = read('app/components/home/CampaignHowTabs.tsx');
  assert.ok(howTabs.includes('until-found'), 'CampaignHowTabs must render inactive panel with hidden="until-found"');

  // 6. Quick Brief localStorage pre-fill check
  const workspace = read('app/brand/BrandWorkspaceClient.tsx');
  assert.ok(workspace.includes('loadQuickBriefDraft'), 'BrandWorkspaceClient must pre-fill from loadQuickBriefDraft');
  assert.ok(workspace.includes('clearQuickBriefDraft'), 'BrandWorkspaceClient must clear Quick Brief draft after creation');

  // 7. Layout checks: no .page-glow gradient blob, MotionProvider enabled, self-hosted fonts
  const layout = read('app/layout.tsx');
  assert.equal(layout.includes('page-glow'), false, 'RootLayout must not render legacy .page-glow gradient blob');
  assert.ok(layout.includes('MotionProvider'), 'RootLayout must wrap app in MotionProvider');
  assert.ok(layout.includes('@fontsource-variable/bricolage-grotesque'), 'RootLayout must load Bricolage Grotesque');
  assert.ok(layout.includes('@fontsource-variable/inter'), 'RootLayout must load Inter');

  console.log('OK Etappe 4 UI, SEO, Design-System, Copy & Quick-Brief checks passed.');
}

run();

// Uses only mocked API responses; production DB and mail are disabled as a second guard.
// Optional runner: PLAYWRIGHT_MODULE_PATH=/path/to/playwright/index.mjs node scripts/test-discovery-ui.mjs
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const base = 'http://127.0.0.1:3998';
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3998', '-H', '127.0.0.1'], {
  env: { ...process.env, DATABASE_URL: '', RESEND_API_KEY: '', RESEND_WEBHOOK_SECRET: '', SLACK_WEBHOOK_URL: '', SEND_CREATOR_OUTREACH_EMAILS: 'false', NEXT_TELEMETRY_DISABLED: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
server.stdout.on('data', chunk => { logs += chunk; });
server.stderr.on('data', chunk => { logs += chunk; });
let browser;
try {
  const deadline = Date.now() + 30000;
  while (!/Ready in/.test(logs)) {
    if (server.exitCode !== null || Date.now() > deadline) throw new Error(`Server failed: ${logs}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
    const context = await browser.newContext({ viewport });
    await context.addInitScript(() => { window.__events = []; window.plausible = (name, options) => window.__events.push({ name, options }); });
    let mode = 'results';
    let submitted = 0;
    let detailFails = true;
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin !== base) return route.abort();
      const path = url.pathname;
      const json = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
      if (path === '/api/creators/featured') return json({ creators: [
        { id: 'UGC-AAAAAAAAAA', name: 'Alex', image: '/ugc-vz-logo.webp', reach: 'Instagram', networks: ['instagram'], priceRange: '250 € für ein Produktvideo', topics: 'Food', preferredContent: 'Produktdemo', city: 'Berlin' },
        { id: 'UGC-BBBBBBBBBB', name: 'Sam', image: '/ugc-vz-logo.webp', reach: 'TikTok', networks: ['tiktok'], priceRange: '', topics: 'Tech', preferredContent: 'App-Demo', city: 'Hamburg' },
      ] });
      if (path === '/api/search') {
        if (mode === 'error') return json({ success: false }, 503);
        return json({ success: true, creators: mode === 'empty' ? [] : [
          { id: 'UGC-AAAAAAAAAA', name: 'Alex', image: '/ugc-vz-logo.webp', reach: 'Instagram', networks: [], priceRange: '250 € für ein Produktvideo', topics: 'Food', preferredContent: 'Produktdemo', city: 'Berlin' },
          { id: 'UGC-BBBBBBBBBB', name: 'Sam', image: '/ugc-vz-logo.webp', reach: 'TikTok', networks: [], priceRange: '', topics: 'Tech', preferredContent: 'App-Demo', city: 'Hamburg' },
        ] });
      }
      if (path === '/api/v1/creators/UGC-AAAAAAAAAA') {
        if (detailFails) { detailFails = false; return json({}, 503); }
        return json({ public_id: 'UGC-AAAAAAAAAA', display_name: 'Alex', city: 'Berlin', topics: 'Food', preferred_content: 'Produktdemo', rate_text: '250 € für ein Produktvideo', equipment: null, portfolio: ['https://portfolio.example/work', 'javascript:alert(1)'], socials: [], humanVerification: { level: 1 } });
      }
      if (path === '/api/submit-request') { submitted++; return json({ success: true, leadId: 'mock-lead' }); }
      if (path === '/api/creators/register') return json({ success: true });
      if (path.startsWith('/api/')) return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/brands`);
    await page.getByRole('button', { name: 'Food-Videos', exact: true }).click();
    const input = page.getByRole('textbox', { name: 'Beschreibe dein Produkt und den gewünschten Content' });
    assert.match(await input.inputValue(), /Food-Creator/);
    assert.ok((await input.boundingBox()).width >= 200, 'briefing input is too narrow');
    const privateBriefing = 'UniquePrivateName user@example.test Produktvideo';
    await input.fill(privateBriefing);
    await page.getByRole('button', { name: 'Suche starten', exact: true }).click();
    const select = page.getByRole('button', { name: 'Alex zur Auswahl hinzufügen', exact: true });
    await select.waitFor();
    assert.equal(await submitted, 0);
    assert.ok(await page.getByText('Preisvorstellung:').count() > 0);
    await select.click();
    const profileButton = page.getByRole('button', { name: 'Profil von Alex ansehen', exact: true });
    await profileButton.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('alert').waitFor();
    await dialog.getByRole('button', { name: 'Erneut versuchen' }).click();
    await dialog.getByRole('link', { name: /Arbeitsprobe 1 ansehen/ }).waitFor();
    assert.equal(await dialog.locator('a[href^="javascript:"]').count(), 0);
    assert.equal(await dialog.getByRole('link').count(), 1);
    await page.screenshot({ path: `/tmp/ugc-vz-profile-${viewport.width}.png`, fullPage: true });
    for (let i = 0; i < 10; i++) { await page.keyboard.press('Tab'); assert.equal(await dialog.evaluate(node => node.contains(document.activeElement)), true); }
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await profileButton.evaluate(node => document.activeElement === node), true);
    assert.equal(await page.getByRole('button', { name: 'Alex aus Auswahl entfernen' }).getAttribute('aria-pressed'), 'true');
    const overflow = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, elements: [...document.querySelectorAll('body *')].filter(node => { const r = node.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1; }).slice(0,12).map(node => ({ tag: node.tagName, class: node.className, right: node.getBoundingClientRect().right })) }));
    assert.ok(overflow.scroll <= overflow.width + 1, JSON.stringify(overflow));
    const openRequest = page.getByRole('button', { name: 'Kostenlos Anfrage senden', exact: true });
    await openRequest.click();
    await page.getByLabel(/^Ihr Name/).fill('UniquePrivateName');
    await page.getByLabel(/E-Mail Adresse/).fill('user@example.test');
    const send = page.locator('button[type="submit"]').filter({ hasText: /Anfrage/ });
    await send.click();
    await page.getByText('Geschafft!', { exact: false }).waitFor();
    assert.equal(submitted, 1);
    const events = await page.evaluate(() => window.__events);
    for (const name of ['search_start', 'creator_view', 'creator_selected', 'request_success']) assert.ok(events.some(event => event.name === name), name);
    assert.equal(JSON.stringify(events).includes('user@example.test'), false);
    assert.equal(JSON.stringify(events).includes('UniquePrivateName'), false);

    mode = 'error';
    await page.getByRole('button', { name: 'Suche starten', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Die Suche ist gerade' }).waitFor();
    assert.equal(await page.getByRole('heading', { name: 'Leider keine Ergebnisse gefunden' }).count(), 0);
    mode = 'empty';
    await page.getByRole('button', { name: 'Suche erneut versuchen' }).click();
    await page.getByRole('heading', { name: 'Leider keine Ergebnisse gefunden' }).waitFor();

    await page.goto(`${base}/wissen/ugc-portfolio-so-ueberzeugst-du-brands-in-7-schritten`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'portfolio page overflow');
    await page.getByRole('link', { name: 'Dein Portfolio im Creator-Profil zeigen', exact: true }).click();
    await page.getByRole('textbox', { name: /Vor- und Nachname/ }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'registration page overflow');
    await page.screenshot({ path: `/tmp/ugc-vz-registration-${viewport.width}.png`, fullPage: true });
    await page.getByRole('textbox', { name: /Vor- und Nachname/ }).fill('UniquePrivateName');
    await page.getByRole('textbox', { name: /E-Mail-Adresse/ }).fill('user@example.test');
    await page.getByRole('button', { name: 'Weiter', exact: true }).click();
    await page.getByLabel('Themen und Interessen').fill('Food');
    await page.getByLabel(/Welche Inhalte erstellst du/).fill('Produktvideos');
    await page.getByLabel('Preisvorstellung').fill('250 € Produktvideo');
    await page.getByRole('button', { name: 'Weiter', exact: true }).click();
    await page.getByRole('textbox', { name: /^Social-Links/ }).fill('https://instagram.com/test');
    const requiredConsents = page.getByRole('checkbox', { name: /^Pflicht:/ });
    for (const checkbox of await requiredConsents.all()) await checkbox.check();
    await page.locator('button[type="submit"]').click();
    await page.getByRole('heading', { name: 'Prüfe jetzt dein Postfach' }).waitFor();
    const registrationEvents = await page.evaluate(() => window.__events);
    for (const name of ['article_cta', 'creator_registration_start', 'creator_registration_submitted']) assert.ok(registrationEvents.some(event => event.name === name), name);
    assert.equal(registrationEvents.some(event => event.name === 'creator_registration_confirmed'), false);
    assert.equal(JSON.stringify(registrationEvents).includes('user@example.test'), false);
    await page.goto(`${base}/creator?verified=1&confirmed=1#creator-form`);
    await page.getByText('Dein Profil ist bestätigt', { exact: true }).waitFor();
    await page.waitForFunction(() => window.__events.some(event => event.name === 'creator_registration_confirmed'));
    assert.ok((await page.evaluate(() => window.__events)).some(event => event.name === 'creator_registration_confirmed'));
    assert.equal(new URL(page.url()).searchParams.has('confirmed'), false);
    await page.reload();
    assert.equal((await page.evaluate(() => window.__events)).some(event => event.name === 'creator_registration_confirmed'), false);
    await page.goto(`${base}/wissen/ugc-video-preise-komplette-kosten-uebersicht-2025`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'price article overflow');
    await page.getByRole('link', { name: 'Creator mit Preisvorstellung entdecken', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('textarea')?.value.includes('Preisvorstellungen'));
    assert.match(await input.inputValue(), /Preisvorstellungen/);
    assert.equal(await page.getByRole('button', { name: 'Profil von Alex ansehen' }).count(), 0);
    await page.goto(base);
    await page.getByRole('heading', { name: 'Ein Einblick ins Verzeichnis' }).waitFor();
    const searchButton = page.getByRole('button', { name: 'Suche starten', exact: true });
    assert.match(await searchButton.innerText(), /Creator suchen/);
    assert.ok((await searchButton.boundingBox()).y < viewport.height - 52, 'search action must be visible in the first viewport');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    assert.equal(await page.getByText('95%', { exact: true }).count(), 0);
    await page.getByText('Ist UGC VZ wirklich kostenlos?', { exact: true }).click();
    await page.getByText('Ja. Creator suchen, Profile prüfen, Kontaktdaten anfordern', { exact: false }).waitFor();
    await page.screenshot({ path: `/tmp/ugc-vz-home-${viewport.width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Alex zur Auswahl hinzufügen', exact: true }).click();
    await page.getByRole('button', { name: 'Profil von Alex ansehen', exact: true }).click();
    await page.getByRole('dialog').getByRole('link', { name: /Arbeitsprobe 1 ansehen/ }).waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('button', { name: 'Alex aus Auswahl entfernen' }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: 'Kostenlos Anfrage senden', exact: true }).click();
    await page.getByLabel(/^Ihr Name/).fill('UniquePrivateName');
    await page.getByLabel(/E-Mail Adresse/).fill('user@example.test');
    await page.locator('button[type="submit"]').filter({ hasText: /Anfrage/ }).click();
    await page.getByText('Geschafft!', { exact: false }).waitFor();
    assert.equal(submitted, 2, 'featured creators use the normal outreach flow');
    await page.getByRole('button', { name: 'Alex zur Auswahl hinzufügen', exact: true }).click();
    mode = 'results';
    await input.fill('Food Produktvideos');
    await searchButton.click();
    await page.getByRole('heading', { name: 'Deine Creator-Vorschläge', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Alex zur Auswahl hinzufügen', exact: true }).getAttribute('aria-pressed'), 'false', 'new searches reset stale selections');
    assert.equal(await page.getByRole('heading', { name: 'Ein Einblick ins Verzeichnis' }).count(), 0);
    const featureUnavailable = await context.newPage();
    await featureUnavailable.route('**/api/creators/featured', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"creators":[]}' }));
    await featureUnavailable.goto(base);
    await featureUnavailable.getByRole('button', { name: 'Food-Videos', exact: true }).click();
    await featureUnavailable.getByRole('button', { name: 'Suche starten', exact: true }).click();
    await featureUnavailable.getByRole('heading', { name: 'Deine Creator-Vorschläge', exact: true }).waitFor();
    await featureUnavailable.close();
    if (viewport.width === 375) {
      const small = await context.newPage();
      await small.setViewportSize({ width: 320, height: 568 });
      await small.goto(base);
      await small.getByRole('heading', { name: 'Ein Einblick ins Verzeichnis' }).waitFor();
      const smallSearch = await small.getByRole('button', { name: 'Suche starten', exact: true }).boundingBox();
      assert.ok(smallSearch.y + smallSearch.height <= 568, 'search action must fit the smallest phone viewport');
      assert.equal(await small.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      const preview = small.getByRole('region', { name: 'Creator-Vorschau', exact: true });
      assert.ok(await preview.evaluate(node => node.scrollWidth > node.clientWidth), 'preview scrolls within its own container');
      await preview.focus();
      await small.keyboard.press('ArrowRight');
      await small.waitForFunction(() => document.querySelector('[aria-label="Creator-Vorschau"]').scrollLeft > 0);
      await small.close();
    }
    assert.deepEqual(errors, []);
    console.log(`Discovery UI ${viewport.width}px: profile/retry/focus/selection, mocked request, privacy, article CTA, registration, confirmation, featured outreach/fallback and search states OK`);
    await context.close();
  }
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}

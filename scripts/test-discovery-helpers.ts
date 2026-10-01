import assert from 'node:assert/strict';
import { safePortfolioUrl } from '../app/lib/creator-public';
import { getArticleQuickStart } from '../app/lib/article-quick-start';
import { trackUGCEvents } from '../app/lib/analytics';

// Creator-provided links must never execute scripts or expose URL credentials.
for (const url of ['javascript:alert(1)', 'data:text/html,test', 'ftp://example.com', 'https://private:secret@example.com', '/relative']) {
  assert.equal(safePortfolioUrl(url), null, url);
}
assert.equal(safePortfolioUrl('https://portfolio.example/work'), 'https://portfolio.example/work');

// Search analytics must not receive briefing text, which can contain contact data.
const events: unknown[] = [];
Object.assign(globalThis, { window: { plausible: (...args: unknown[]) => events.push(args) } });
const privateBriefing = 'Contact person@example.test about our secret product';
trackUGCEvents.searchStart(privateBriefing);
trackUGCEvents.search(privateBriefing, 2);
trackUGCEvents.searchNoResults(privateBriefing);
trackUGCEvents.searchError();
trackUGCEvents.registrationSubmitted();
trackUGCEvents.registrationConfirmed();
assert.equal(JSON.stringify(events).includes(privateBriefing), false);
assert.equal(JSON.stringify(events).includes('person@example.test'), false);
assert.equal(events.length, 6);
assert.notDeepEqual(events[4], events[5]);

// A price-article CTA preserves a prepared briefing without starting a search or
// creating a crawler-visible query parameter variant.
const action = getArticleQuickStart('ugc-video-preise-komplette-kosten-uebersicht-2025');
assert.equal(action?.target, 'brand');
const href = new URL(action!.href, 'https://ugc-vz.de');
assert.equal(href.pathname, '/brands');
assert.equal(href.search, '');
assert.ok(href.hash.startsWith('#q='));
assert.ok(decodeURIComponent(href.hash.slice(3)).includes('Preisvorstellungen'));
delete (globalThis as { window?: unknown }).window;
console.log('Discovery helpers: safe portfolio links, private analytics and prepared CTA OK');

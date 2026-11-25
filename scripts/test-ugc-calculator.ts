import assert from 'node:assert/strict';
import {
  buildBriefingQueryFromCalculator,
  buildBudgetSummaryText,
  calculateUgcBudget,
  type CalculatorInput,
} from '../app/lib/ugc-calculator';

const baseInput: CalculatorInput = {
  nicheSlug: 'allgemein',
  nicheLabel: 'Branchenübergreifend (DE-Schnitt)',
  formatId: 'social_clip',
  videoCount: 1,
  extraHooks: 0,
  includeRawFiles: false,
  usageRights: 'organic',
  includeWhitelisting: false,
  experience: 'experienced',
  benchmark: null,
};

// 1. Canonical baseline: 1x Social Clip, organic, experienced => 350 EUR (range 150-600)
const single = calculateUgcBudget(baseInput);
assert.equal(single.usedLiveBenchmark, false);
assert.equal(single.perVideoMid, 350);
assert.equal(single.totalLow, 150);
assert.equal(single.totalMid, 350);
assert.equal(single.totalHigh, 600);
assert.equal(single.bundleDiscountPct, 0);
assert.equal(single.comparison.ugcVzFee, 0);

// 2. Paid Ads 12m + extra hooks + raw files + bundle discount at 5 videos
const campaign = calculateUgcBudget({
  ...baseInput,
  videoCount: 5,
  extraHooks: 2,
  includeRawFiles: true,
  usageRights: 'paid_12m',
  includeWhitelisting: true,
});
assert.equal(campaign.bundleDiscountPct, 10);
assert.ok(campaign.rightsTotal > 0);
assert.ok(campaign.addonsTotal > 0);
assert.ok(campaign.totalMid > single.totalMid * 5);
assert.ok(campaign.comparison.tkpEstimatedViewsAt350 > 0);

// 3. Live DB benchmark overrides canonical baseline when n >= 8
const withLive = calculateUgcBudget({
  ...baseInput,
  nicheSlug: 'beauty',
  nicheLabel: 'Beauty-Reels',
  benchmark: { slug: 'beauty', label: 'Beauty-Reels', count: 40, p25: 180, median: 240, p75: 320, n: 22 },
});
assert.equal(withLive.usedLiveBenchmark, true);
assert.equal(withLive.perVideoLow, 180);
assert.equal(withLive.perVideoMid, 240);
assert.equal(withLive.perVideoHigh, 320);

// 4. Briefing query & summary text include key details without leaking garbage
const query = buildBriefingQueryFromCalculator(
  { ...baseInput, nicheSlug: 'beauty', nicheLabel: 'Beauty-Reels', videoCount: 4, extraHooks: 2, usageRights: 'paid_12m' },
  withLive,
);
assert.match(query, /Beauty-Reels/);
assert.match(query, /4×/);
assert.match(query, /2 Extra-Hooks/);
assert.match(query, /Paid Ads · 12 Monate/);

const summary = buildBudgetSummaryText(baseInput, single);
assert.match(summary, /UGC VZ Vermittlungsgebühr: 0 €/);
assert.match(summary, /350 €/);

console.log('OK: ugc-calculator (baselines, rights/addons/discounts, live benchmark, briefing & summary)');

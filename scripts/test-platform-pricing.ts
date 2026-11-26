import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import {
  BLACK_FRIDAY_PROMO,
  CREATOR_FEE_RATE,
  STANDARD_BRAND_FEE_RATE,
  calculateCampaignBudgetBreakdown,
  formatCountdownParts,
  getActivePromo,
} from '../app/lib/platform-pricing';
import { getDatabase } from '../app/lib/database';
import { createBrandCampaign, upsertBrandAccount } from '../app/lib/brand-workspace';
import { GET as getLlmsTxt } from '../app/llms.txt/route';
import { GET as getLlmsFullTxt } from '../app/llms-full.txt/route';
import { GET as getWebMcp } from '../app/.well-known/webmcp/route';
import { GET as getMcpManifest } from '../app/.well-known/mcp.json/route';
import { GET as getSitemap } from '../app/sitemap.xml/route';

async function main() {
  // 1. Exact Black Friday -> Cyber Monday promo window tests (CET +01:00)
  const beforeStart = getActivePromo(new Date('2026-11-26T23:59:59+01:00'));
  assert.equal(beforeStart.active, false);
  assert.equal(beforeStart.isCyberMonday, false);
  assert.equal(beforeStart.rate, STANDARD_BRAND_FEE_RATE);
  assert.equal(beforeStart.rateBps, 1500);
  assert.equal(beforeStart.creatorFeeRate, CREATOR_FEE_RATE);

  const atStart = getActivePromo(new Date('2026-11-27T00:00:00+01:00'));
  assert.equal(atStart.active, true);
  assert.equal(atStart.isCyberMonday, false);
  assert.equal(atStart.rate, BLACK_FRIDAY_PROMO.rate);
  assert.equal(atStart.rateBps, 1000);
  assert.equal(atStart.code, 'BLACK_FRIDAY_2026');
  assert.ok(atStart.remainingMs > 0);

  const cyberMonday = getActivePromo(new Date('2026-11-30T12:00:00+01:00'));
  assert.equal(cyberMonday.active, true);
  assert.equal(cyberMonday.isCyberMonday, true);
  assert.equal(cyberMonday.rate, 0.1);

  const lastSecond = getActivePromo(new Date('2026-11-30T23:59:59+01:00'));
  assert.equal(lastSecond.active, true);
  assert.equal(lastSecond.isCyberMonday, true);

  const afterEnd = getActivePromo(new Date('2026-12-01T00:00:00+01:00'));
  assert.equal(afterEnd.active, false);
  assert.equal(afterEnd.isCyberMonday, false);
  assert.equal(afterEnd.rate, 0.15);
  assert.equal(afterEnd.rateBps, 1500);
  assert.equal(afterEnd.remainingMs, 0);

  // 2. Budget math consistency with Spec 8.9 (1.000 EUR -> 850/150 regular, 900/100 Black Friday)
  const regular1000 = calculateCampaignBudgetBreakdown(1000, 2, new Date('2026-12-05T12:00:00+01:00'));
  assert.equal(regular1000.budgetCents, 100_000);
  assert.equal(regular1000.feeCents, 15_000);
  assert.equal(regular1000.creatorPoolCents, 85_000);
  assert.equal(regular1000.feeCents + regular1000.creatorPoolCents, regular1000.budgetCents);
  assert.equal(regular1000.promoBonusForCreatorsCents, 0);
  assert.equal(regular1000.estimatedViews, 425_000);

  const bf1000 = calculateCampaignBudgetBreakdown(1000, 2, new Date('2026-11-28T12:00:00+01:00'));
  assert.equal(bf1000.budgetCents, 100_000);
  assert.equal(bf1000.feeCents, 10_000);
  assert.equal(bf1000.creatorPoolCents, 90_000);
  assert.equal(bf1000.standardCreatorPoolCents, 85_000);
  assert.equal(bf1000.promoBonusForCreatorsCents, 5_000); // 50 EUR mehr fuer Views!
  assert.equal(bf1000.feeCents + bf1000.creatorPoolCents, bf1000.budgetCents);
  assert.equal(bf1000.estimatedViews, 450_000);

  const countdown = formatCountdownParts(90_061_000); // 1d 1h 1m 1s
  assert.equal(countdown.days, 1);
  assert.equal(countdown.hours, 1);
  assert.equal(countdown.minutes, 1);
  assert.equal(countdown.seconds, 1);

  // 3. Migration 022 stores platform_fee_bps & creator_fee_bps per campaign
  process.env.DATABASE_URL = 'postgres://test:test@platform-pricing.invalid/test';
  const db = new PGlite();
  const client = getDatabase();
  Object.defineProperty(client, 'query', {
    value: async (sql: string, params: unknown[] = []) => (await db.query(sql, params)).rows,
  });

  try {
    for (const migration of [
      '001_creator_platform',
      '002_creator_registration',
      '006_creator_profile_edits',
      '007_social_avatars',
      '010_contact_reachable',
      '015_casting_portfolio',
      '016_avatar_casting_review',
      '017_brand_workspace',
      '018_campaign_tkp_platforms_and_oauth',
      '019_otp_codes_briefing_and_reports',
      '022_campaign_fee_rate',
    ]) {
      const sql = await readFile(`db/migrations/${migration}.sql`, 'utf8');
      await db.exec(sql.replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;', ''));
    }

    const brand = await upsertBrandAccount(client, {
      email: 'pricing@brand.test',
      contactName: 'Pricing Tester',
      companyName: 'Pricing GmbH',
    });
    const created = await createBrandCampaign(client, brand, {
      title: 'Fee Snapshot Campaign',
      platforms: ['tiktok'],
      compensationModel: 'tkp',
      tkpEurCents: 200,
      totalBudgetEur: 1000,
    });
    const { rows: [campRow] } = await db.query<{
      platform_fee_bps: number;
      creator_fee_bps: number;
    }>('SELECT platform_fee_bps, creator_fee_bps FROM brand_campaigns WHERE id = $1', [created.id]);
    assert.ok(campRow.platform_fee_bps === 1500 || campRow.platform_fee_bps === 1000);
    assert.equal(campRow.creator_fee_bps, 0);
  } finally {
    await db.close();
  }

  // 4. Discovery endpoints (llms.txt, llms-full.txt, .well-known/webmcp, mcp.json, sitemap.xml)
  delete process.env.DATABASE_URL;
  const llmsRes = await getLlmsTxt();
  assert.equal(llmsRes.status, 200);
  const llmsText = await llmsRes.text();
  assert.ok(llmsText.includes('15 %'));
  assert.ok(llmsText.includes('https://ugc-vz.de/preise'));
  assert.equal(/kostenloses verzeichnis|ohne provision|kostenlos und provisionsfrei/i.test(llmsText), false);

  const llmsFullRes = await getLlmsFullTxt();
  assert.equal(llmsFullRes.status, 200);
  const llmsFullText = await llmsFullRes.text();
  assert.ok(llmsFullText.includes('Was kostet mich UGC VZ als Marke?'));
  assert.equal(/kostenloses verzeichnis|ohne provision|kostenlos und provisionsfrei/i.test(llmsFullText), false);

  const webmcpRes = await getWebMcp();
  assert.equal(webmcpRes.status, 200);
  const webmcpJson = await webmcpRes.json();
  assert.equal(webmcpJson.name, 'ugc-vz-webmcp');
  assert.ok(Array.isArray(webmcpJson.tools) && webmcpJson.tools.length >= 6);

  const mcpJsonRes = await getMcpManifest();
  const mcpJson = await mcpJsonRes.json();
  assert.equal(/kostenloses verzeichnis|ohne provision/i.test(mcpJson.description), false);

  const agentGatewaySource = await readFile('app/lib/agent-gateway.ts', 'utf8');
  assert.equal(agentGatewaySource.includes('free and without commission'), false);

  const sitemapRes = await getSitemap();
  assert.equal(sitemapRes.status, 200);
  const sitemapXml = await sitemapRes.text();
  assert.ok(sitemapXml.includes('<loc>https://ugc-vz.de/preise</loc>'));
  const preiseEntry = sitemapXml.match(/<loc>https:\/\/ugc-vz\.de\/preise<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/);
  assert.ok(preiseEntry && !preiseEntry[1].startsWith('2026-09-30'), 'Static pages must use real per-page lastmod instead of stale 2026-09-30');
  const uniqueLastmods = new Set([...sitemapXml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1].slice(0, 10)));
  assert.ok(uniqueLastmods.size >= 2, 'Sitemap should contain distinct real lastmod dates');

  console.log('OK: Platform-Pricing (Black Friday window, 15%/10%/0% cent math, migration 022, llms.txt, llms-full.txt, webmcp, sitemap)');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

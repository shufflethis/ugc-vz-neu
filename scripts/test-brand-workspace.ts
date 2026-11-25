import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { NextRequest } from 'next/server';
import { getDatabase } from '../app/lib/database';
import { humanizePriceText } from '../app/lib/creator-public';
import { signSession, CREATOR_SESSION_COOKIE } from '../app/lib/creator-session';
import { signBrandSession, BRAND_SESSION_COOKIE } from '../app/lib/brand-session';
import {
  buildCampaignReportCsv,
  computeCampaignReport,
  consumeBrandLoginToken,
  createBrandCampaign,
  createBrandLoginToken,
  detectSubmissionPlatform,
  getBrandCampaignDetail,
  listCreatorCampaigns,
  normalizeSocialHandle,
  upsertBrandAccount,
} from '../app/lib/brand-workspace';
import { GET as getBrandCampaign } from '../app/api/brand/campaigns/[id]/route';
import { PATCH as patchApplication } from '../app/api/brand/campaigns/[id]/applications/[appId]/route';
import { PATCH as patchSubmission } from '../app/api/brand/campaigns/[id]/submissions/[subId]/route';
import { GET as getReportCsv } from '../app/api/brand/campaigns/[id]/report.csv/route';
import { POST as creatorApply } from '../app/api/creator/campaigns/[id]/apply/route';
import { POST as creatorSubmit } from '../app/api/creator/campaigns/[id]/submit/route';
import { POST as creatorSocialVerify } from '../app/api/creator/social-verify/route';
import { createPkcePair, signOAuthState, verifyOAuthState } from '../app/lib/social-oauth';

async function main() {
  // 1. Unit tests for quick-fix price sanitization & social handle parsing
  assert.equal(humanizePriceText('Nein, Ihr?!'), '');
  assert.equal(humanizePriceText('nein'), '');
  assert.equal(humanizePriceText('Nein.'), '');
  assert.equal(humanizePriceText('Nein- 1x fertiges Video ca 170€'), '1x fertiges Video ca 170€');
  assert.equal(humanizePriceText('Nein, ab mindestens 150–250 €.'), 'Ab mindestens 150–250 €.');
  assert.equal(humanizePriceText('Nein. Videos gehen ab 180€ los.'), 'Videos gehen ab 180€ los.');
  assert.equal(humanizePriceText('250'), '250 €');
  assert.equal(humanizePriceText('Ab 250 € pro Video'), 'Ab 250 € pro Video');

  assert.deepEqual(normalizeSocialHandle('instagram', '@Nordic.Creator'), {
    handle: 'nordic.creator',
    url: 'https://www.instagram.com/nordic.creator/',
  });
  assert.deepEqual(normalizeSocialHandle('tiktok', 'https://www.tiktok.com/@ugctest_de?lang=de'), {
    handle: 'ugctest_de',
    url: 'https://www.tiktok.com/@ugctest_de',
  });
  assert.equal(detectSubmissionPlatform('https://www.tiktok.com/@user/video/12345'), 'tiktok');
  assert.equal(detectSubmissionPlatform('https://www.instagram.com/reel/ABC123/'), 'instagram');
  assert.equal(detectSubmissionPlatform('https://youtube.com/shorts/XYZ789'), 'youtube');

  // 2. Full PGlite integration tests for Brand Workspace + Creator Campaign Board
  process.env.DATABASE_URL = 'postgres://test:test@brand-workspace.invalid/test';
  process.env.CREATOR_SESSION_SECRET = 'local-test-secret-for-brand-workspace-integration';
  delete process.env.BRAND_SESSION_SECRET;

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
    ]) {
      const sql = await readFile(`db/migrations/${migration}.sql`, 'utf8');
      await db.exec(sql.replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;', ''));
    }

    // Seed 2 active creators
    await db.exec(`
      INSERT INTO creator_profiles (id, public_id, display_name, city, topics, rate_text, status)
      VALUES
        (gen_random_uuid(), 'UGC-1111111111', 'Lukas Test', 'Berlin', 'Männerpflege, Skincare', 'Nein. Videos gehen ab 220€ los.', 'active'),
        (gen_random_uuid(), 'UGC-2222222222', 'Sarah Test', 'München', 'Beauty, Lifestyle', '250', 'active');
    `);
    const { rows: [creator1] } = await db.query<{ id: string }>(
      "SELECT id FROM creator_profiles WHERE public_id = 'UGC-1111111111'",
    );
    const { rows: [creator2] } = await db.query<{ id: string }>(
      "SELECT id FROM creator_profiles WHERE public_id = 'UGC-2222222222'",
    );
    await db.query(
      `INSERT INTO creator_private_contacts (creator_id, email, project_notifications_enabled)
       VALUES ($1, 'lukas@creator.test', true), ($2, 'sarah@creator.test', false)`,
      [creator1.id, creator2.id],
    );

    // Brand A & Brand B accounts
    const brandA = await upsertBrandAccount(client, {
      email: 'team@nordic-grooming.test',
      contactName: 'Anna Brand',
      companyName: 'Nordic Grooming GmbH',
    });
    const brandB = await upsertBrandAccount(client, {
      email: 'other@competitor.test',
      contactName: 'Bob Other',
      companyName: 'Competitor AG',
    });

    // Magic-link token is single-use
    const rawToken = await createBrandLoginToken(client, brandA.id, '/brand/kampagnen/CMP-12345678');
    const firstConsume = await consumeBrandLoginToken(client, rawToken);
    assert.ok(firstConsume);
    assert.equal(firstConsume.brandId, brandA.id);
    assert.equal(firstConsume.redirectTo, '/brand/kampagnen/CMP-12345678');
    const secondConsume = await consumeBrandLoginToken(client, rawToken);
    assert.equal(secondConsume, null, 'Magic link token must be strictly single-use');

    // Brand A creates open campaign and invites Creator 1
    const campaign = await createBrandCampaign(client, brandA, {
      title: '=Q3 Grooming Launch',
      brandDisplayName: 'Nordic Grooming GmbH',
      description: '3 Produktvideos zu Rasieröl',
      platforms: ['tiktok', 'instagram'],
      deliverables: '2x TikTok + 1x Reel',
      compensationModel: 'hybrid',
      budgetPerVideoEur: 250,
      totalBudgetEur: 1000,
      usageRights: '12 Monate Paid Ads',
      deadline: 'In 14 Tagen',
      visibility: 'open',
      creatorPublicIds: ['UGC-1111111111'],
    });
    assert.match(campaign.publicId, /^CMP-[A-F0-9]{8}$/);
    assert.equal(campaign.invitedCount, 1);

    // Creator 1 sees personal invite; Creator 2 sees open campaign
    const c1Board = await listCreatorCampaigns(client, creator1.id);
    assert.equal(c1Board.myCampaigns.length, 1);
    assert.equal(c1Board.myCampaigns[0].status, 'invited');
    const c2Board = await listCreatorCampaigns(client, creator2.id);
    assert.equal(c2Board.myCampaigns.length, 0);
    assert.equal(c2Board.openCampaigns.length, 1);
    assert.equal(c2Board.openCampaigns[0].campaignPublicId, campaign.publicId);

    const brandACookie = `${BRAND_SESSION_COOKIE}=${signBrandSession(brandA.id)}`;
    const brandBCookie = `${BRAND_SESSION_COOKIE}=${signBrandSession(brandB.id)}`;
    const creator1Cookie = `${CREATOR_SESSION_COOKIE}=${signSession(creator1.id)}`;
    const creator2Cookie = `${CREATOR_SESSION_COOKIE}=${signSession(creator2.id)}`;

    // Creator 1 responds to invite, Creator 2 applies to open campaign
    const apply1Res = await creatorApply(
      new NextRequest(`https://ugc-vz.de/api/creator/campaigns/${campaign.publicId}/apply`, {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', cookie: creator1Cookie },
        body: JSON.stringify({ pitch: 'Ich mache authentische Grooming-Reviews!', proposedFeeEur: 240, availabilityNote: 'Ab sofort' }),
      }),
      { params: { id: campaign.publicId } },
    );
    assert.equal(apply1Res.status, 200);
    const apply1Json = await apply1Res.json();
    assert.equal(apply1Json.status, 'applied');

    const apply2Res = await creatorApply(
      new NextRequest(`https://ugc-vz.de/api/creator/campaigns/${campaign.publicId}/apply`, {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', cookie: creator2Cookie },
        body: JSON.stringify({ pitch: 'Kann Partner-Perspektive abdecken', proposedFeeEur: 260 }),
      }),
      { params: { id: campaign.publicId } },
    );
    assert.equal(apply2Res.status, 201);
    const apply2Json = await apply2Res.json();

    // Creator 1 starts Instagram bio-code verification
    const verifyStartRes = await creatorSocialVerify(
      new NextRequest('https://ugc-vz.de/api/creator/social-verify', {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', cookie: creator1Cookie },
        body: JSON.stringify({ action: 'start', platform: 'instagram', handle: '@lukas.grooming' }),
      }),
    );
    assert.equal(verifyStartRes.status, 200);
    const verifyStartJson = await verifyStartRes.json();
    assert.match(verifyStartJson.code, /^UGCVZ-[A-F0-9]{6}$/);

    // IDOR check: Brand B must NOT read or modify Brand A's campaign
    const idorGet = await getBrandCampaign(
      new NextRequest(`https://ugc-vz.de/api/brand/campaigns/${campaign.publicId}`, {
        headers: { cookie: brandBCookie },
      }),
      { params: { id: campaign.publicId } },
    );
    assert.equal(idorGet.status, 404, 'Brand B must not read Brand A campaign');

    const idorPatchApp = await patchApplication(
      new NextRequest(`https://ugc-vz.de/api/brand/campaigns/${campaign.publicId}/applications/${apply1Json.applicationId}`, {
        method: 'PATCH',
        headers: { origin: 'https://ugc-vz.de', cookie: brandBCookie },
        body: JSON.stringify({ status: 'selected' }),
      }),
      { params: { id: campaign.publicId, appId: apply1Json.applicationId } },
    );
    assert.equal(idorPatchApp.status, 404, 'Brand B must not mutate Brand A application');

    // Creator 1 cannot submit content before being selected
    const prematureSub = await creatorSubmit(
      new NextRequest(`https://ugc-vz.de/api/creator/campaigns/${campaign.publicId}/submit`, {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', cookie: creator1Cookie },
        body: JSON.stringify({ contentUrl: 'https://www.tiktok.com/@lukas/video/111' }),
      }),
      { params: { id: campaign.publicId } },
    );
    assert.equal(prematureSub.status, 403);

    // Brand A selects Creator 1 & Creator 2
    for (const appId of [apply1Json.applicationId, apply2Json.applicationId]) {
      const selRes = await patchApplication(
        new NextRequest(`https://ugc-vz.de/api/brand/campaigns/${campaign.publicId}/applications/${appId}`, {
          method: 'PATCH',
          headers: { origin: 'https://ugc-vz.de', cookie: brandACookie },
          body: JSON.stringify({ status: 'selected', brandNote: 'Passt perfekt zur Zielgruppe' }),
        }),
        { params: { id: campaign.publicId, appId } },
      );
      assert.equal(selRes.status, 200);
    }

    // Creator 1 submits 1 TikTok + 1 Instagram Reel
    const sub1Res = await creatorSubmit(
      new NextRequest(`https://ugc-vz.de/api/creator/campaigns/${campaign.publicId}/submit`, {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', cookie: creator1Cookie },
        body: JSON.stringify({
          contentUrl: 'https://www.tiktok.com/@lukas/video/111',
          title: '=Hook 1 Rasur',
          views: 10000,
          likes: 500,
        }),
      }),
      { params: { id: campaign.publicId } },
    );
    assert.equal(sub1Res.status, 201);
    const sub1 = (await sub1Res.json()).submission;

    const sub2Res = await creatorSubmit(
      new NextRequest(`https://ugc-vz.de/api/creator/campaigns/${campaign.publicId}/submit`, {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', cookie: creator1Cookie },
        body: JSON.stringify({
          contentUrl: 'https://www.instagram.com/reel/XYZ999/',
          title: 'Reel Routine',
          views: 5000,
          likes: 300,
        }),
      }),
      { params: { id: campaign.publicId } },
    );
    assert.equal(sub2Res.status, 201);
    const sub2 = (await sub2Res.json()).submission;

    // IDOR check on submission PATCH
    const idorPatchSub = await patchSubmission(
      new NextRequest(`https://ugc-vz.de/api/brand/campaigns/${campaign.publicId}/submissions/${sub1.id}`, {
        method: 'PATCH',
        headers: { origin: 'https://ugc-vz.de', cookie: brandBCookie },
        body: JSON.stringify({ status: 'approved', views: 999999 }),
      }),
      { params: { id: campaign.publicId, subId: sub1.id } },
    );
    assert.equal(idorPatchSub.status, 404);

    // Brand A approves and records final metrics on sub1 & sub2
    const upd1 = await patchSubmission(
      new NextRequest(`https://ugc-vz.de/api/brand/campaigns/${campaign.publicId}/submissions/${sub1.id}`, {
        method: 'PATCH',
        headers: { origin: 'https://ugc-vz.de', cookie: brandACookie },
        body: JSON.stringify({ status: 'approved', views: 40000, likes: 1600, comments: 200, shares: 200, spendEur: 240 }),
      }),
      { params: { id: campaign.publicId, subId: sub1.id } },
    );
    assert.equal(upd1.status, 200);

    const upd2 = await patchSubmission(
      new NextRequest(`https://ugc-vz.de/api/brand/campaigns/${campaign.publicId}/submissions/${sub2.id}`, {
        method: 'PATCH',
        headers: { origin: 'https://ugc-vz.de', cookie: brandACookie },
        body: JSON.stringify({ status: 'approved', views: 10000, likes: 400, comments: 50, shares: 50, spendEur: 160 }),
      }),
      { params: { id: campaign.publicId, subId: sub2.id } },
    );
    assert.equal(upd2.status, 200);

    // Verify metric snapshots recorded
    const { rows: snapRows } = await db.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM brand_campaign_metric_snapshots',
    );
    assert.equal(Number(snapRows[0].count), 4, '2 initial + 2 updated metric snapshots expected');

    // Verify detail, sanitized price, contact opt-in gating & report calculations
    const detail = await getBrandCampaignDetail(client, brandA.id, campaign.publicId);
    assert.ok(detail);
    const appLukas = detail.applications.find((a) => a.creatorPublicId === 'UGC-1111111111');
    const appSarah = detail.applications.find((a) => a.creatorPublicId === 'UGC-2222222222');
    assert.equal(appLukas?.creatorPrice, 'Videos gehen ab 220€ los.');
    assert.equal(appLukas?.contactEmail, 'lukas@creator.test');
    assert.equal(appSarah?.creatorPrice, '250 €');
    assert.equal(appSarah?.contactEmail, null, 'Creator without notification opt-in must not expose email');

    const report = computeCampaignReport(detail.submissions, detail.campaign.totalBudgetEur);
    assert.equal(report.totalSubmissions, 2);
    assert.equal(report.approvedSubmissions, 2);
    assert.equal(report.totalViews, 50000);
    assert.equal(report.totalEngagements, 2500); // 1600+200+200 + 400+50+50
    assert.equal(report.engagementRatePct, 5); // 2500 / 50000 = 5%
    assert.equal(report.totalSpendEur, 400);
    assert.equal(report.effectiveCpmEur, 8); // 400 / 50 = 8 € TKP
    assert.equal(report.budgetUtilizationPct, 40); // 400 / 1000 = 40%
    assert.equal(report.byPlatform.length, 2);
    assert.equal(report.byCreator.length, 1);

    // Verify CSV report export & formula-injection neutralization
    const csvRes = await getReportCsv(
      new NextRequest(`https://ugc-vz.de/api/brand/campaigns/${campaign.publicId}/report.csv`, {
        headers: { cookie: brandACookie },
      }),
      { params: { id: campaign.publicId } },
    );
    assert.equal(csvRes.status, 200);
    const csvText = await csvRes.text();
    assert.ok(csvText.includes(`"'=Hook 1 Rasur"`), 'Formula-like CSV cells must be neutralized');
    assert.equal(csvText, buildCampaignReportCsv(detail));

    // 3. Test TKP + Budget-Cap (2 EUR / 1.000 Views, 500 EUR Cap) + Platform & Product-Choice Flow
    const tkpCamp = await createBrandCampaign(client, brandA, {
      title: 'Performance TKP Test (500 EUR Cap)',
      brandDisplayName: 'Nordic Grooming GmbH',
      platforms: ['tiktok', 'instagram', 'tiktok_shop'],
      compensationModel: 'tkp',
      tkpEurCents: 200,
      totalBudgetEur: 500,
      requiresProductChoice: true,
      productChoicePrompt: 'Welche Variante möchtest du testen?',
      discountCode: '20 % Shop-Rabatt',
      visibility: 'open',
    });

    // Empty targetPlatforms rejected
    const badPlatRes = await creatorApply(
      new NextRequest(`https://ugc-vz.de/api/creator/campaigns/${tkpCamp.publicId}/apply`, {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', cookie: creator2Cookie },
        body: JSON.stringify({ targetPlatforms: [], productChoice: 'Classic Schwarz' }),
      }),
      { params: { id: tkpCamp.publicId } },
    );
    assert.equal(badPlatRes.status, 400);

    // Missing required productChoice rejected
    const badProdRes = await creatorApply(
      new NextRequest(`https://ugc-vz.de/api/creator/campaigns/${tkpCamp.publicId}/apply`, {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', cookie: creator2Cookie },
        body: JSON.stringify({ targetPlatforms: ['tiktok', 'tiktok_shop'], productChoice: '' }),
      }),
      { params: { id: tkpCamp.publicId } },
    );
    assert.equal(badProdRes.status, 400);

    // Valid TKP application with targetPlatforms + productChoice
    const tkpApplyRes = await creatorApply(
      new NextRequest(`https://ugc-vz.de/api/creator/campaigns/${tkpCamp.publicId}/apply`, {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', cookie: creator2Cookie },
        body: JSON.stringify({
          pitch: 'Ich poste auf TikTok & TikTok Shop!',
          targetPlatforms: ['tiktok', 'tiktok_shop'],
          productChoice: 'Classic Schwarz (Gr. M)',
        }),
      }),
      { params: { id: tkpCamp.publicId } },
    );
    assert.equal(tkpApplyRes.status, 201);
    const tkpAppId = (await tkpApplyRes.json()).applicationId;

    // Select Creator 2 & submit two clips pushing over the 500 EUR cap
    await patchApplication(
      new NextRequest(`https://ugc-vz.de/api/brand/campaigns/${tkpCamp.publicId}/applications/${tkpAppId}`, {
        method: 'PATCH',
        headers: { origin: 'https://ugc-vz.de', cookie: brandACookie },
        body: JSON.stringify({ status: 'selected' }),
      }),
      { params: { id: tkpCamp.publicId, appId: tkpAppId } },
    );

    const tkpSub1 = (
      await (
        await creatorSubmit(
          new NextRequest(`https://ugc-vz.de/api/creator/campaigns/${tkpCamp.publicId}/submit`, {
            method: 'POST',
            headers: { origin: 'https://ugc-vz.de', cookie: creator2Cookie },
            body: JSON.stringify({ contentUrl: 'https://www.tiktok.com/@sarah/video/1', views: 50000 }),
          }),
          { params: { id: tkpCamp.publicId } },
        )
      ).json()
    ).submission;

    // Brand updates views to 150.000 with autoCalculateTkp -> 300 EUR
    const tkpUpd1 = await patchSubmission(
      new NextRequest(`https://ugc-vz.de/api/brand/campaigns/${tkpCamp.publicId}/submissions/${tkpSub1.id}`, {
        method: 'PATCH',
        headers: { origin: 'https://ugc-vz.de', cookie: brandACookie },
        body: JSON.stringify({ status: 'approved', views: 150000, autoCalculateTkp: true }),
      }),
      { params: { id: tkpCamp.publicId, subId: tkpSub1.id } },
    );
    assert.equal(tkpUpd1.status, 200);
    assert.equal((await tkpUpd1.json()).submission.spendEurCents, 30000);

    const midDetail = await getBrandCampaignDetail(client, brandA.id, tkpCamp.publicId);
    assert.ok(midDetail);
    assert.deepEqual(midDetail.applications[0].targetPlatforms, ['tiktok', 'tiktok_shop']);
    assert.equal(midDetail.applications[0].productChoice, 'Classic Schwarz (Gr. M)');
    assert.equal(midDetail.report.accruedTkpEur, 300);
    assert.equal(midDetail.report.cappedPayoutEur, 300);
    assert.equal(midDetail.report.remainingBudgetEur, 200);
    assert.equal(midDetail.report.viewsUntilCap, 100000);
    assert.equal(midDetail.report.maxCapViews, 250000);
    assert.equal(midDetail.report.capReached, false);

    // Clip 2 adds 125.000 views -> raw 550 EUR -> clamped at 500 EUR Cap!
    await creatorSubmit(
      new NextRequest(`https://ugc-vz.de/api/creator/campaigns/${tkpCamp.publicId}/submit`, {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', cookie: creator2Cookie },
        body: JSON.stringify({ contentUrl: 'https://www.instagram.com/reel/CAPTEST/', views: 125000 }),
      }),
      { params: { id: tkpCamp.publicId } },
    );
    const cappedDetail = await getBrandCampaignDetail(client, brandA.id, tkpCamp.publicId);
    assert.ok(cappedDetail);
    assert.equal(cappedDetail.report.accruedTkpEur, 550);
    assert.equal(cappedDetail.report.cappedPayoutEur, 500);
    assert.equal(cappedDetail.report.remainingBudgetEur, 0);
    assert.equal(cappedDetail.report.viewsUntilCap, 0);
    assert.equal(cappedDetail.report.capReached, true);

    // Open-budget TKP report (without totalBudgetEur limit) stays uncapped
    const openBudgetReport = computeCampaignReport(cappedDetail.submissions, {
      totalBudgetEur: null,
      compensationModel: 'tkp',
      tkpEurCents: 200,
    });
    assert.equal(openBudgetReport.cappedPayoutEur, 550);
    assert.equal(openBudgetReport.remainingBudgetEur, null);
    assert.equal(openBudgetReport.capReached, false);

    // 4. Test Social OAuth PKCE & Signed State roundtrip
    const pkce = createPkcePair();
    assert.ok(pkce.codeVerifier.length >= 40 && pkce.codeChallenge.length >= 40);
    const signed = signOAuthState({ creatorId: creator1.id, provider: 'tiktok', nonce: 'nonce-123', codeVerifier: pkce.codeVerifier });
    const parsed = verifyOAuthState(signed, 'tiktok');
    assert.ok(parsed);
    assert.equal(parsed.creatorId, creator1.id);
    assert.equal(parsed.codeVerifier, pkce.codeVerifier);
    assert.equal(verifyOAuthState(signed, 'instagram'), null, 'Provider mismatch must reject OAuth state');

    console.log('OK: Brand-Workspace (Quick-Fixes, Auth, Kampagnen, TKP-Cap, Plattformen/Produktwahl, Social-Verify/OAuth, IDOR, Tracking, Reporting & CSV)');
  } finally {
    await db.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

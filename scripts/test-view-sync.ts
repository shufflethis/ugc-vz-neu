import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import {
  decryptSocialToken,
  encryptSocialToken,
  upsertVerifiedOAuthSocialAccount,
} from '../app/lib/social-oauth';
import {
  extractInstagramShortcode,
  extractTikTokVideoId,
  extractYouTubeVideoId,
  syncActiveCampaignSubmissionViews,
  type FetchLike,
} from '../app/lib/social-view-sync';

process.env.SOCIAL_TOKEN_ENCRYPTION_KEY = 'test-social-token-encryption-key-0123456789abcdef';
process.env.CREATOR_SESSION_SECRET = 'test-creator-session-secret-0123456789abcdef';
process.env.BRAND_SESSION_SECRET = 'test-brand-session-secret-0123456789abcdef';

function createPgliteAdapter(db: PGlite) {
  return {
    query: async (text: string, params: unknown[] = []) => {
      const res = await db.query(text, params);
      return res.rows;
    },
  } as unknown as Parameters<typeof syncActiveCampaignSubmissionViews>[0];
}

async function runMigrations(db: PGlite) {
  const dir = path.join(process.cwd(), 'db/migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    if (file.startsWith('020_')) continue;
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const statements = raw
      .split(/--\s*statement-breakpoint/i)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      if (/\bvector\b/i.test(stmt)) continue;
      if (/^CREATE EXTENSION/i.test(stmt)) continue;
      try {
        await db.exec(stmt);
      } catch (err) {
        if (file.startsWith('025_') || file.startsWith('017_') || file.startsWith('018_') || file.startsWith('019_')) {
          throw err;
        }
      }
    }
  }
}

async function main() {
  // 1. URL Parsers
  assert.equal(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5s'), 'dQw4w9WgXcQ');
  assert.equal(extractYouTubeVideoId('https://youtu.be/AbCdEf12345?si=abc'), 'AbCdEf12345');
  assert.equal(extractYouTubeVideoId('https://www.youtube.com/shorts/XyZ98765432'), 'XyZ98765432');
  assert.equal(extractYouTubeVideoId('https://example.com/shorts/XyZ98765432'), null);

  assert.equal(extractTikTokVideoId('https://www.tiktok.com/@creator_de/video/7412345678901234567?is_from_webapp=1'), '7412345678901234567');
  assert.equal(extractTikTokVideoId('https://www.tiktok.com/@creator_de/photo/7412345678901234568'), '7412345678901234568');
  assert.equal(extractTikTokVideoId('https://m.tiktok.com/v/7412345678901234569.html'), '7412345678901234569');
  assert.equal(extractTikTokVideoId('https://www.tiktok.com/@creator_de'), null);

  assert.equal(extractInstagramShortcode('https://www.instagram.com/reel/CxYz123AbC/'), 'CxYz123AbC');
  assert.equal(extractInstagramShortcode('https://www.instagram.com/reels/CxYz123AbC/?igsh=xyz'), 'CxYz123AbC');
  assert.equal(extractInstagramShortcode('https://www.instagram.com/p/Post999Code/'), 'Post999Code');
  assert.equal(extractInstagramShortcode('https://www.instagram.com/creator_de/reel/UserReel42/'), 'UserReel42');
  assert.equal(extractInstagramShortcode('https://www.instagram.com/creator_de/'), null);
  console.log('OK: URL-Parser fuer YouTube, TikTok und Instagram');

  // 2. AES-256-GCM Token Encryption
  const rawToken = 'act.super-secret-oauth-token-1234567890';
  const enc1 = encryptSocialToken(rawToken);
  const enc2 = encryptSocialToken(rawToken);
  assert.notEqual(enc1, enc2, 'Jede Verschluesselung braucht einen zufaelligen IV');
  assert.ok(!enc1.includes(rawToken), 'Klartext-Token darf nie im Ciphertext stehen');
  assert.equal(decryptSocialToken(enc1), rawToken);
  assert.equal(decryptSocialToken(enc2), rawToken);

  const parts = enc1.split('.');
  const tamperedLastChar = parts[3].endsWith('A') ? 'B' : 'A';
  const tampered = [parts[0], parts[1], parts[2], parts[3].slice(0, -1) + tamperedLastChar].join('.');
  assert.equal(decryptSocialToken(tampered), null, 'Manipulierter Ciphertext muss fehlschlagen');
  assert.equal(decryptSocialToken(''), null);
  assert.equal(decryptSocialToken('invalid'), null);
  console.log('OK: AES-256-GCM Token-Verschluesselung & Manipulationsschutz');

  // 3. PGlite DB Integration (Migrations 001..025 + Public View Safety + Official View Sync)
  const db = new PGlite();
  await runMigrations(db);
  const sql = createPgliteAdapter(db);

  // Verify public view never exposes oauth_* or token columns
  const publicCols = (await sql.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'creator_search_public'`,
  )) as Array<{ column_name: string }>;
  const leaked = publicCols
    .map((r) => String(r.column_name))
    .filter((name) => name.includes('oauth_') || name.includes('token'));
  assert.deepEqual(leaked, [], 'creator_search_public darf niemals OAuth- oder Token-Spalten enthalten');

  const creatorId = crypto.randomUUID();
  const brandId = crypto.randomUUID();
  const campaignId = crypto.randomUUID();
  const appId = crypto.randomUUID();

  await sql.query(
    `INSERT INTO creator_profiles (id, public_id, display_name, status)
     VALUES ($1, 'UGC-AA11BB22CC', 'Lea Test', 'active')`,
    [creatorId],
  );
  await sql.query(
    `INSERT INTO brand_accounts (id, email, contact_name, company_name)
     VALUES ($1, 'brand@example.de', 'Max Brand', 'Demo GmbH')`,
    [brandId],
  );
  // Active TKP campaign: 5.00 EUR per 1,000 views (500 cents), hard cap 100 EUR (10,000 cents)
  await sql.query(
    `INSERT INTO brand_campaigns (
       id, public_id, brand_id, title, brand_display_name, compensation_model,
       tkp_eur_cents, total_budget_eur, platforms, status
     ) VALUES (
       $1, 'CMP-AA11BB22', $2, 'Herbst View Kampagne', 'Demo GmbH', 'tkp',
       500, 100, ARRAY['tiktok','instagram','youtube'], 'active'
     )`,
    [campaignId, brandId],
  );
  await sql.query(
    `INSERT INTO brand_campaign_applications (id, campaign_id, creator_id, status)
     VALUES ($1, $2, $3, 'selected')`,
    [appId, campaignId, creatorId],
  );

  // Store encrypted TikTok & Instagram OAuth tokens via upsertVerifiedOAuthSocialAccount
  await upsertVerifiedOAuthSocialAccount(sql, {
    creatorId,
    platform: 'tiktok',
    handle: '@leatest',
    url: 'https://www.tiktok.com/@leatest',
    providerAccountId: 'tt-open-1',
    followers: 15000,
    scope: 'user.info.basic,video.list',
    accessToken: 'tiktok-live-token-xyz',
    refreshToken: 'tiktok-refresh-xyz',
    expiresInSeconds: 7200,
  });
  await upsertVerifiedOAuthSocialAccount(sql, {
    creatorId,
    platform: 'instagram',
    handle: '@leatest',
    url: 'https://www.instagram.com/leatest/',
    providerAccountId: 'ig-user-1',
    followers: 22000,
    scope: 'instagram_business_basic,instagram_business_manage_insights',
    accessToken: 'ig-long-lived-token-abc',
    expiresInSeconds: 5184000,
  });

  // Verify DB stores ciphertext, not plaintext
  const storedAccounts = (await sql.query(
    `SELECT platform, oauth_access_token_enc FROM creator_social_accounts WHERE creator_id = $1`,
    [creatorId],
  )) as Array<{ platform: string; oauth_access_token_enc: string }>;
  assert.equal(storedAccounts.length, 2);
  for (const acc of storedAccounts) {
    assert.ok(acc.oauth_access_token_enc.startsWith('v1.'), 'Token muss verschluesselt als v1.* gespeichert sein');
    assert.ok(!acc.oauth_access_token_enc.includes('token-'), 'Klartext darf nicht in der DB stehen');
  }

  // Insert 5 submissions:
  // 1) YouTube Shorts (12,000 views -> 60 EUR = 6000 cents)
  // 2) TikTok Video (10,000 views -> raw 50 EUR, capped by 100 EUR campaign cap to 40 EUR = 4000 cents!)
  // 3) Instagram Reel (4,500 views -> raw 22.50 EUR, capped at 0 cents since 100 EUR cap is full, views still tracked!)
  // 4) TikTok Deleted Video (missing in video/query -> rejected, spend=0, post_deleted_at set)
  // 5) YouTube Private/Deleted Video (empty items -> rejected, spend=0, post_deleted_at set)
  const subYtOk = crypto.randomUUID();
  const subTtOk = crypto.randomUUID();
  const subIgOk = crypto.randomUUID();
  const subTtDel = crypto.randomUUID();
  const subYtDel = crypto.randomUUID();

  const insertSub = async (id: string, platform: string, url: string, minutesAgo: number) => {
    await sql.query(
      `INSERT INTO brand_campaign_submissions (
         id, campaign_id, application_id, creator_id, platform, content_url, status, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, 'approved', now() - ($7 || ' minutes')::interval)`,
      [id, campaignId, appId, creatorId, platform, url, String(minutesAgo)],
    );
  };
  await insertSub(subYtOk, 'youtube', 'https://www.youtube.com/shorts/YtOkVideo01', 50);
  await insertSub(subTtOk, 'tiktok', 'https://www.tiktok.com/@leatest/video/7400000000000000001', 40);
  await insertSub(subIgOk, 'instagram', 'https://www.instagram.com/reel/IgReelOk99/', 30);
  await insertSub(subTtDel, 'tiktok', 'https://www.tiktok.com/@leatest/video/7400000000000000999', 20);
  await insertSub(subYtDel, 'youtube', 'https://www.youtube.com/watch?v=YtGone99999', 10);

  const mockFetch: FetchLike = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // YouTube Data API v3
    if (url.startsWith('https://www.googleapis.com/youtube/v3/videos')) {
      const parsed = new URL(url);
      const vid = parsed.searchParams.get('id');
      if (vid === 'YtOkVideo01') {
        return new Response(JSON.stringify({
          items: [{
            id: 'YtOkVideo01',
            status: { privacyStatus: 'public' },
            statistics: { viewCount: '12000', likeCount: '640', commentCount: '42' },
          }],
        }), { status: 200 });
      }
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    }

    // TikTok Display API v2 video/query
    if (url.startsWith('https://open.tiktokapis.com/v2/video/query/')) {
      assert.equal((init?.headers as Record<string, string>)?.Authorization, 'Bearer tiktok-live-token-xyz');
      const body = JSON.parse(String(init?.body || '{}')) as { filters?: { video_ids?: string[] } };
      const vid = body.filters?.video_ids?.[0];
      if (vid === '7400000000000000001') {
        return new Response(JSON.stringify({
          data: {
            videos: [{
              id: '7400000000000000001',
              view_count: 10000,
              like_count: 910,
              comment_count: 55,
              share_count: 130,
            }],
          },
          error: { code: 'ok', message: '' },
        }), { status: 200 });
      }
      // Deleted video: not present in videos array
      return new Response(JSON.stringify({
        data: { videos: [] },
        error: { code: 'ok', message: '' },
      }), { status: 200 });
    }

    // Instagram Graph API me/media
    if (url.startsWith('https://graph.instagram.com/me/media')) {
      assert.ok(url.includes('access_token=ig-long-lived-token-abc'));
      return new Response(JSON.stringify({
        data: [{
          id: '17999999999999999',
          permalink: 'https://www.instagram.com/reel/IgReelOk99/',
          like_count: 320,
          comments_count: 19,
        }],
      }), { status: 200 });
    }

    // Instagram Graph API insights
    if (url.startsWith('https://graph.instagram.com/17999999999999999/insights')) {
      return new Response(JSON.stringify({
        data: [
          { name: 'views', values: [{ value: 4500 }] },
          { name: 'shares', values: [{ value: 80 }] },
        ],
      }), { status: 200 });
    }

    throw new Error(`Unexpected fetch URL in test: ${url}`);
  };

  const summary = await syncActiveCampaignSubmissionViews(sql, {
    limit: 20,
    fetchFn: mockFetch,
    youtubeApiKey: 'yt-test-api-key',
  });

  assert.equal(summary.checked, 5);
  assert.equal(summary.updated, 3);
  assert.equal(summary.deletedMarked, 2);
  assert.equal(summary.skippedUnconfigured, 0);
  assert.deepEqual(summary.errors, []);

  const updatedSubs = (await sql.query(
    `SELECT id, status, views, likes, comments, shares, spend_eur_cents, metrics_source, external_post_id, post_deleted_at, review_note
     FROM brand_campaign_submissions`,
  )) as Array<Record<string, unknown>>;
  const byId = new Map(updatedSubs.map((r) => [String(r.id), r]));

  const ytOk = byId.get(subYtOk)!;
  assert.equal(ytOk.views, 12000);
  assert.equal(ytOk.spend_eur_cents, 6000);
  assert.equal(ytOk.metrics_source, 'api');
  assert.equal(ytOk.external_post_id, 'YtOkVideo01');

  const ttOk = byId.get(subTtOk)!;
  assert.equal(ttOk.views, 10000);
  assert.equal(ttOk.shares, 130);
  assert.equal(ttOk.spend_eur_cents, 4000, 'Kampagnen-Deckel 100 EUR darf nicht ueberschritten werden');

  const igOk = byId.get(subIgOk)!;
  assert.equal(igOk.views, 4500);
  assert.equal(igOk.shares, 80);
  assert.equal(igOk.spend_eur_cents, 0, 'Deckel bereits ausgeschoepft -> 0 Cent weiterer Spend');
  assert.equal(igOk.external_post_id, '17999999999999999');

  const ttDel = byId.get(subTtDel)!;
  assert.equal(ttDel.status, 'rejected');
  assert.equal(ttDel.spend_eur_cents, 0);
  assert.ok(ttDel.post_deleted_at, 'Geloeschter TikTok-Post muss post_deleted_at setzen');
  assert.ok(String(ttDel.review_note).includes('nicht mehr öffentlich'));

  const ytDel = byId.get(subYtDel)!;
  assert.equal(ytDel.status, 'rejected');
  assert.equal(ytDel.spend_eur_cents, 0);
  assert.ok(ytDel.post_deleted_at, 'Geloeschter/privater YouTube-Post muss post_deleted_at setzen');

  const [snapCount] = (await sql.query(`SELECT count(*)::int AS cnt FROM brand_campaign_metric_snapshots`)) as Array<{ cnt: number }>;
  assert.equal(snapCount.cnt, 3, '3 aktive Beitraege muessen 3 Metric-Snapshots erzeugen');

  // Verify graceful skip when creator has no OAuth token & YouTube key missing
  const creatorNoAuth = crypto.randomUUID();
  const appNoAuth = crypto.randomUUID();
  const subUnconfigured = crypto.randomUUID();
  await sql.query(
    `INSERT INTO creator_profiles (id, public_id, display_name, status) VALUES ($1, 'UGC-DD33EE44FF', 'Ohne OAuth', 'active')`,
    [creatorNoAuth],
  );
  await sql.query(
    `INSERT INTO brand_campaign_applications (id, campaign_id, creator_id, status) VALUES ($1, $2, $3, 'selected')`,
    [appNoAuth, campaignId, creatorNoAuth],
  );
  await sql.query(
    `INSERT INTO brand_campaign_submissions (id, campaign_id, application_id, creator_id, platform, content_url, status)
     VALUES ($1, $2, $3, $4, 'instagram', 'https://www.instagram.com/reel/NoTokenReel/', 'approved')`,
    [subUnconfigured, campaignId, appNoAuth, creatorNoAuth],
  );

  const skipSummary = await syncActiveCampaignSubmissionViews(sql, {
    limit: 1,
    fetchFn: mockFetch,
    youtubeApiKey: '',
  });
  assert.equal(skipSummary.skippedUnconfigured, 1);
  assert.equal(skipSummary.deletedMarked, 0);

  await db.close();
  console.log('OK: Alle View-Sync Tests (TikTok, Instagram, YouTube, Budget-Deckel, Deleted-Post-Regel, Graceful Skip) bestanden.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

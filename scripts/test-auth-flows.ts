import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { NextRequest } from 'next/server';
import { getDatabase } from '../app/lib/database';
import {
  resetAuthDeliveryStateForTests,
  setAuthDeliveryOverridesForTests,
  type AuthEmailSender,
} from '../app/lib/auth-delivery';
import {
  BRAND_SESSION_COOKIE,
  BRAND_SESSION_TTL_MS,
  BRAND_SHORT_SESSION_TTL_MS,
  signBrandSession,
  verifyBrandSession,
} from '../app/lib/brand-session';
import {
  CREATOR_SESSION_COOKIE,
  SESSION_TTL_MS,
  SHORT_SESSION_TTL_MS,
  verifySession,
} from '../app/lib/creator-session';
import { POST as postCreatorLogin } from '../app/api/creator/login/route';
import { POST as postCreatorVerify } from '../app/api/creator/login/verify/route';
import { POST as postBrandLogin } from '../app/api/brand/login/route';
import { POST as postBrandVerify } from '../app/api/brand/login/verify/route';
import { POST as postBrandCampaigns } from '../app/api/brand/campaigns/route';
import { POST as postStartCampaign } from '../app/api/brand/start-campaign/route';

function extractCookie(setCookieHeader: string | null, name: string): { value: string; maxAge: number | null } | null {
  if (!setCookieHeader) return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = setCookieHeader.match(new RegExp(`${escaped}=([^;]+)`));
  if (!match) return null;
  const maxAgeMatch = setCookieHeader.match(/Max-Age=(\d+)/i);
  return {
    value: match[1],
    maxAge: maxAgeMatch ? Number(maxAgeMatch[1]) : null,
  };
}

function extractOtpFromSubject(subject: string): string {
  const match = subject.match(/\b(\d{6})\b/);
  assert.ok(match, `Expected 6-digit OTP code in email subject, got: "${subject}"`);
  return match[1];
}

async function main() {
  process.env.DATABASE_URL = 'postgres://test:test@auth-flows.invalid/test';
  process.env.CREATOR_SESSION_SECRET = 'local-test-secret-for-auth-flows-integration';
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
      '019_otp_codes_briefing_and_reports',
    ]) {
      const sql = await readFile(`db/migrations/${migration}.sql`, 'utf8');
      await db.exec(sql.replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;', ''));
    }

    // Seed active creator (with trailing whitespace + mixed case in DB!) & pending creator
    await db.exec(`
      INSERT INTO creator_profiles (id, public_id, display_name, status)
      VALUES
        (gen_random_uuid(), 'UGC-AAA1111111', 'Active Creator', 'active'),
        (gen_random_uuid(), 'UGC-BBB2222222', 'Pending Flo', 'pending_verification');
    `);
    const { rows: [activeCreator] } = await db.query<{ id: string }>(
      "SELECT id FROM creator_profiles WHERE public_id = 'UGC-AAA1111111'",
    );
    const { rows: [pendingCreator] } = await db.query<{ id: string }>(
      "SELECT id FROM creator_profiles WHERE public_id = 'UGC-BBB2222222'",
    );
    await db.query(
      `INSERT INTO creator_private_contacts (creator_id, email)
       VALUES ($1, '  Active.Creator@Example.DE  '), ($2, 'pending.flo@famefact.test')`,
      [activeCreator.id, pendingCreator.id],
    );

    const sentEmails: Array<{ to: string; subject: string; html: string; text: string }> = [];
    const alerts: Array<{ flow: string; errorCountInWindow: number; lastErrorCode: string }> = [];

    const mockOkSender: AuthEmailSender = async (params) => {
      sentEmails.push({ to: params.to, subject: params.subject, html: params.html, text: params.text });
      return { id: `msg-${sentEmails.length}`, error: null };
    };

    resetAuthDeliveryStateForTests();
    setAuthDeliveryOverridesForTests({
      sender: mockOkSender,
      sleep: async () => {},
      alertNotifier: async (payload) => {
        alerts.push({
          flow: payload.flow,
          errorCountInWindow: payload.errorCountInWindow,
          lastErrorCode: payload.lastErrorCode,
        });
      },
    });

    // 1. Creator login: unknown email returns 200 generic, sends NO email
    const unknownCreatorRes = await postCreatorLogin(
      new NextRequest('https://ugc-vz.de/api/creator/login', {
        method: 'POST',
        headers: { 'x-forwarded-for': '203.0.113.10' },
        body: JSON.stringify({ email: 'nobody@unknown.test' }),
      }),
    );
    assert.equal(unknownCreatorRes.status, 200);
    assert.equal(sentEmails.length, 0);

    // 2. Creator login: active profile with case mismatch + whitespace in DB -> email sent with code in subject
    const activeLoginRes = await postCreatorLogin(
      new NextRequest('https://ugc-vz.de/api/creator/login', {
        method: 'POST',
        headers: { 'x-forwarded-for': '203.0.113.11' },
        body: JSON.stringify({ email: 'active.creator@example.de' }),
      }),
    );
    assert.equal(activeLoginRes.status, 200);
    assert.equal(sentEmails.length, 1);
    const activeMail = sentEmails[0];
    const activeOtp = extractOtpFromSubject(activeMail.subject);
    assert.equal(/[–—]/.test(activeMail.subject + activeMail.text), false, 'Login mail must not contain en/em dashes');
    assert.equal(activeMail.html.includes('Kostenlose Creator-Vermittlung'), false);

    // 3. Creator login cooldown rate limit (60s) -> HTTP 429 + Retry-After
    const cooldownRes = await postCreatorLogin(
      new NextRequest('https://ugc-vz.de/api/creator/login', {
        method: 'POST',
        headers: { 'x-forwarded-for': '203.0.113.11' },
        body: JSON.stringify({ email: 'active.creator@example.de' }),
      }),
    );
    assert.equal(cooldownRes.status, 429);
    assert.ok(Number(cooldownRes.headers.get('retry-after')) >= 1);

    // 4. Creator OTP verify with rememberMe=false -> 24h cookie
    const activeVerifyShort = await postCreatorVerify(
      new NextRequest('https://ugc-vz.de/api/creator/login/verify', {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de' },
        body: JSON.stringify({ email: 'active.creator@example.de', code: activeOtp, rememberMe: false }),
      }),
    );
    assert.equal(activeVerifyShort.status, 200);
    const shortCreatorCookie = extractCookie(activeVerifyShort.headers.get('set-cookie'), CREATOR_SESSION_COOKIE);
    assert.ok(shortCreatorCookie);
    assert.equal(shortCreatorCookie.maxAge, Math.floor(SHORT_SESSION_TTL_MS / 1000));
    assert.equal(verifySession(shortCreatorCookie.value), activeCreator.id);

    // 5. Pending creator login -> sends activation OTP -> verify activates profile & sets 30-day session cookie!
    const pendingLoginRes = await postCreatorLogin(
      new NextRequest('https://ugc-vz.de/api/creator/login', {
        method: 'POST',
        headers: { 'x-forwarded-for': '203.0.113.12' },
        body: JSON.stringify({ email: 'pending.flo@famefact.test' }),
      }),
    );
    assert.equal(pendingLoginRes.status, 200);
    assert.equal(sentEmails.length, 2);
    const pendingOtp = extractOtpFromSubject(sentEmails[1].subject);

    const pendingVerifyRes = await postCreatorVerify(
      new NextRequest('https://ugc-vz.de/api/creator/login/verify', {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de' },
        body: JSON.stringify({ email: 'pending.flo@famefact.test', code: pendingOtp, rememberMe: true }),
      }),
    );
    assert.equal(pendingVerifyRes.status, 200);
    const longCreatorCookie = extractCookie(pendingVerifyRes.headers.get('set-cookie'), CREATOR_SESSION_COOKIE);
    assert.ok(longCreatorCookie);
    assert.equal(longCreatorCookie.maxAge, Math.floor(SESSION_TTL_MS / 1000));
    assert.equal(longCreatorCookie.maxAge, 30 * 24 * 60 * 60);
    const { rows: [activatedCreator] } = await db.query<{ status: string }>(
      'SELECT status FROM creator_profiles WHERE id = $1',
      [pendingCreator.id],
    );
    assert.equal(activatedCreator.status, 'active');

    // 6. Brand login mode='login' with unknown email -> 404 account_not_found & does NOT create account
    const unknownBrandRes = await postBrandLogin(
      new NextRequest('https://ugc-vz.de/api/brand/login', {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', 'x-forwarded-for': '203.0.113.20' },
        body: JSON.stringify({ mode: 'login', email: 'newbrand@company.test' }),
      }),
    );
    assert.equal(unknownBrandRes.status, 404);
    const unknownBrandJson = await unknownBrandRes.json();
    assert.equal(unknownBrandJson.code, 'account_not_found');
    assert.equal(unknownBrandJson.suggestedMode, 'signup');
    const { rows: [countAfterMissing] } = await db.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM brand_accounts WHERE email = 'newbrand@company.test'",
    );
    assert.equal(Number(countAfterMissing.count), 0, 'Login with unknown email must not create brand account');

    // 7. Brand signup missing name/company -> 400
    resetAuthDeliveryStateForTests();
    setAuthDeliveryOverridesForTests({ sender: mockOkSender, sleep: async () => {} });
    const badSignupRes = await postBrandLogin(
      new NextRequest('https://ugc-vz.de/api/brand/login', {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', 'x-forwarded-for': '203.0.113.21' },
        body: JSON.stringify({ mode: 'signup', email: 'newbrand@company.test', name: '' }),
      }),
    );
    assert.equal(badSignupRes.status, 400);

    // 8. Brand signup valid -> 200, creates brand, sends OTP code in subject
    resetAuthDeliveryStateForTests();
    setAuthDeliveryOverridesForTests({ sender: mockOkSender, sleep: async () => {} });
    const okSignupRes = await postBrandLogin(
      new NextRequest('https://ugc-vz.de/api/brand/login', {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', 'x-forwarded-for': '203.0.113.22' },
        body: JSON.stringify({
          mode: 'signup',
          email: 'newbrand@company.test',
          name: 'Florian Runge',
          company: 'famefact GmbH',
        }),
      }),
    );
    assert.equal(okSignupRes.status, 200);
    const okSignupJson = await okSignupRes.json();
    assert.equal(okSignupJson.switchedToLogin, false);
    const signupMail = sentEmails[sentEmails.length - 1];
    const brandOtp1 = extractOtpFromSubject(signupMail.subject);
    assert.equal(/[–—]/.test(signupMail.subject + signupMail.text), false);

    // 9. Brand signup with EXISTING email -> auto-switches to login (NO error, NO duplicate!)
    resetAuthDeliveryStateForTests();
    setAuthDeliveryOverridesForTests({ sender: mockOkSender, sleep: async () => {} });
    const existingSignupRes = await postBrandLogin(
      new NextRequest('https://ugc-vz.de/api/brand/login', {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', 'x-forwarded-for': '203.0.113.23' },
        body: JSON.stringify({
          mode: 'signup',
          email: 'newbrand@company.test',
          name: 'Other Name',
          company: 'Other Co',
        }),
      }),
    );
    assert.equal(existingSignupRes.status, 200);
    const existingSignupJson = await existingSignupRes.json();
    assert.equal(existingSignupJson.switchedToLogin, true);
    const { rows: [brandCount] } = await db.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM brand_accounts WHERE email = 'newbrand@company.test'",
    );
    assert.equal(Number(brandCount.count), 1, 'Existing brand email must not create duplicate account');

    // 10. Brand OTP verify -> sets 30-day session cookie when rememberMe=true & 24h when false
    const brandOtp2 = extractOtpFromSubject(sentEmails[sentEmails.length - 1].subject);
    assert.notEqual(brandOtp1, '');
    const brandVerifyLong = await postBrandVerify(
      new NextRequest('https://ugc-vz.de/api/brand/login/verify', {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de' },
        body: JSON.stringify({ email: 'newbrand@company.test', code: brandOtp2, rememberMe: true }),
      }),
    );
    assert.equal(brandVerifyLong.status, 200);
    const longBrandCookie = extractCookie(brandVerifyLong.headers.get('set-cookie'), BRAND_SESSION_COOKIE);
    assert.ok(longBrandCookie);
    assert.equal(longBrandCookie.maxAge, Math.floor(BRAND_SESSION_TTL_MS / 1000));
    assert.equal(longBrandCookie.maxAge, 30 * 24 * 60 * 60);
    const verifiedBrandId = verifyBrandSession(longBrandCookie.value);
    assert.ok(verifiedBrandId);

    // Test rememberMe=false on brand login
    resetAuthDeliveryStateForTests();
    setAuthDeliveryOverridesForTests({ sender: mockOkSender, sleep: async () => {} });
    const loginExistingRes = await postBrandLogin(
      new NextRequest('https://ugc-vz.de/api/brand/login', {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', 'x-forwarded-for': '203.0.113.24' },
        body: JSON.stringify({ mode: 'login', email: 'newbrand@company.test' }),
      }),
    );
    assert.equal(loginExistingRes.status, 200);
    const brandOtp3 = extractOtpFromSubject(sentEmails[sentEmails.length - 1].subject);
    const brandVerifyShort = await postBrandVerify(
      new NextRequest('https://ugc-vz.de/api/brand/login/verify', {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de' },
        body: JSON.stringify({ email: 'newbrand@company.test', code: brandOtp3, rememberMe: false }),
      }),
    );
    assert.equal(brandVerifyShort.status, 200);
    const shortBrandCookie = extractCookie(brandVerifyShort.headers.get('set-cookie'), BRAND_SESSION_COOKIE);
    assert.ok(shortBrandCookie);
    assert.equal(shortBrandCookie.maxAge, Math.floor(BRAND_SHORT_SESSION_TTL_MS / 1000));

    // 11. Provider 429 -> returns 429 (never 502)
    resetAuthDeliveryStateForTests();
    setAuthDeliveryOverridesForTests({
      sender: async () => ({ error: { name: 'rate_limit_exceeded', message: 'Too many requests', statusCode: 429 } }),
      sleep: async () => {},
    });
    const provider429Res = await postBrandLogin(
      new NextRequest('https://ugc-vz.de/api/brand/login', {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', 'x-forwarded-for': '203.0.113.30' },
        body: JSON.stringify({ mode: 'login', email: 'newbrand@company.test' }),
      }),
    );
    assert.equal(provider429Res.status, 429);

    // 12. Provider transient 500 -> retries once and succeeds!
    resetAuthDeliveryStateForTests();
    let flakyAttempt = 0;
    setAuthDeliveryOverridesForTests({
      sender: async (params) => {
        flakyAttempt += 1;
        if (flakyAttempt === 1) {
          return { error: { name: 'internal_server_error', message: 'Upstream glitch', statusCode: 500 } };
        }
        return mockOkSender(params);
      },
      sleep: async () => {},
    });
    const flakyRes = await postBrandLogin(
      new NextRequest('https://ugc-vz.de/api/brand/login', {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', 'x-forwarded-for': '203.0.113.31' },
        body: JSON.stringify({ mode: 'login', email: 'newbrand@company.test' }),
      }),
    );
    assert.equal(flakyRes.status, 200);
    assert.equal(flakyAttempt, 2, 'Transient 500 must retry once and succeed');

    // 13. Provider persistent 5xx -> returns controlled 503 (never 502) & triggers tech alert after >3 errors in 5 min
    resetAuthDeliveryStateForTests();
    alerts.length = 0;
    const failSender: AuthEmailSender = async () => ({
      error: { name: 'application_error', message: 'Resend outage', statusCode: 500 },
    });
    const captureAlert = async (payload: { flow: string; errorCountInWindow: number; lastErrorCode: string }) => {
      alerts.push({
        flow: payload.flow,
        errorCountInWindow: payload.errorCountInWindow,
        lastErrorCode: payload.lastErrorCode,
      });
    };
    setAuthDeliveryOverridesForTests({ sender: failSender, sleep: async () => {}, alertNotifier: captureAlert });

    for (let i = 1; i <= 4; i += 1) {
      // Seed distinct brand accounts to avoid 60s email cooldown while testing 5xx window
      const testMail = `outage${i}@company.test`;
      await db.query(
        `INSERT INTO brand_accounts (email, contact_name, company_name) VALUES ($1, 'Outage', 'Test GmbH')`,
        [testMail],
      );
      const res = await postBrandLogin(
        new NextRequest('https://ugc-vz.de/api/brand/login', {
          method: 'POST',
          headers: { origin: 'https://ugc-vz.de', 'x-forwarded-for': `203.0.113.${40 + i}` },
          body: JSON.stringify({ mode: 'login', email: testMail }),
        }),
      );
      assert.equal(res.status, 503, 'Persistent provider 5xx must return controlled 503, never raw 502');
      const json = await res.json();
      assert.ok(json.error.includes('hi@ugc-vz.de'));
    }
    assert.equal(alerts.length, 1, 'Tech alert must fire once when >3 5xx errors happen within 5 minutes');
    assert.equal(alerts[0].errorCountInWindow, 4);

    // 14. Campaign business rules: tkp requires budget_cap & at least 1 platform
    const brandCookie = `${BRAND_SESSION_COOKIE}=${signBrandSession(verifiedBrandId!)}`;

    const noCapRes = await postBrandCampaigns(
      new NextRequest('https://ugc-vz.de/api/brand/campaigns', {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', cookie: brandCookie },
        body: JSON.stringify({
          title: 'View Kampagne ohne Cap',
          compensationModel: 'tkp',
          tkpEurCents: 200,
          totalBudgetEur: null,
          platforms: ['tiktok'],
        }),
      }),
    );
    assert.equal(noCapRes.status, 400, 'View campaign without budget_cap must be rejected');

    const noPlatformRes = await postBrandCampaigns(
      new NextRequest('https://ugc-vz.de/api/brand/campaigns', {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', cookie: brandCookie },
        body: JSON.stringify({
          title: 'View Kampagne ohne Plattform',
          compensationModel: 'tkp',
          tkpEurCents: 200,
          totalBudgetEur: 500,
          platforms: [],
        }),
      }),
    );
    assert.equal(noPlatformRes.status, 400, 'Campaign without platform must be rejected');

    const okTkpRes = await postBrandCampaigns(
      new NextRequest('https://ugc-vz.de/api/brand/campaigns', {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', cookie: brandCookie },
        body: JSON.stringify({
          title: 'View Kampagne mit Cap',
          compensationModel: 'tkp',
          tkpEurCents: 200,
          totalBudgetEur: 500,
          platforms: ['tiktok', 'instagram'],
        }),
      }),
    );
    assert.equal(okTkpRes.status, 201);

    const startNoCapRes = await postStartCampaign(
      new NextRequest('https://ugc-vz.de/api/brand/start-campaign', {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', cookie: brandCookie },
        body: JSON.stringify({
          title: 'Start Campaign ohne Cap',
          compensationModel: 'tkp',
          tkpEurCents: 200,
          totalBudgetEur: 0,
          platforms: ['tiktok'],
        }),
      }),
    );
    assert.equal(startNoCapRes.status, 400, 'start-campaign must also enforce budget_cap for tkp');

    console.log(
      'OK: Auth-Flows (Creator pending/active/trim, Brand login/signup auto-switch, 30d cookies, 429/retry/503+5xx alert, budget_cap & platform rules)',
    );
  } finally {
    resetAuthDeliveryStateForTests();
    await db.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

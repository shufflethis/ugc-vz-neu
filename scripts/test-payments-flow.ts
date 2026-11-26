import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import {
  calculateAffiliateCommissionCents,
  calculateCreatorPayoutPreview,
  calculatePayInSurchargeCents,
  closeCampaignReservation,
  createPendingTopup,
  ensureBrandWallet,
  ensureCreatorAffiliateCode,
  ensureCreatorBalance,
  finalizeCreatorPayoutPaid,
  listCampaignAffiliateConversions,
  recordAndSettleAffiliateConversion,
  recordWebhookEventOnce,
  reserveCampaignBudget,
  reserveCreatorPayout,
  revertCreatorPayoutFailed,
  settleCountedSubmission,
  settleFixedVideoSubmission,
  settleTopupIdempotently,
  upsertCreatorTaxProfile,
} from '../app/lib/payments-ledger';
import {
  calculateCreditNoteTax,
  generateBrandTopupInvoicePdf,
  generateCreditNotePdfWithZugferd,
  issueCreditNoteForPayout,
} from '../app/lib/credit-note-generator';
import Stripe from 'stripe';
import { constructVerifiedStripeEvent } from '../app/lib/stripe-connect';

function createPgliteSqlAdapter(db: PGlite) {
  const queryFn = async (text: string, params: unknown[] = []) => {
    const res = await db.query(text, params);
    return res.rows as Record<string, unknown>[];
  };
  const tagged = (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = '';
    strings.forEach((s, i) => {
      text += s + (i < values.length ? `$${i + 1}` : '');
    });
    return queryFn(text, values);
  };
  (tagged as unknown as { query: typeof queryFn }).query = queryFn;
  return tagged as unknown as Parameters<typeof ensureBrandWallet>[0];
}

async function applyMigrations(db: PGlite) {
  const migrationsDir = path.join(process.cwd(), 'db/migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    // 020 uses pgvector extension which is not bundled in vanilla PGlite
    if (file.startsWith('020_')) continue;
    const raw = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const statements = raw
      .split('-- statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      if (/\bvector\b/i.test(stmt)) continue;
      try {
        await db.exec(stmt);
      } catch (err) {
        // Ignore optional pgvector or RLS role issues in PGlite while strictly failing on 024 & 026
        if (file.startsWith('024_') || file.startsWith('026_')) throw err;
      }
    }
  }
}

async function run() {
  // 1. Pure Surcharge Policy Tests (Spec 8.9)
  assert.deepEqual(calculatePayInSurchargeCents(100_000, 'sepa_debit'), {
    surchargeCents: 0,
    surchargeLabel: '',
    totalChargedCents: 100_000,
  });
  assert.deepEqual(calculatePayInSurchargeCents(100_000, 'bank_transfer'), {
    surchargeCents: 0,
    surchargeLabel: '',
    totalChargedCents: 100_000,
  });
  assert.deepEqual(calculatePayInSurchargeCents(100_000, 'card'), {
    surchargeCents: 3_000,
    surchargeLabel: 'Kartengebühr',
    totalChargedCents: 103_000,
  });
  assert.equal(calculatePayInSurchargeCents(50_000, 'apple_pay').surchargeCents, 1_500);
  assert.equal(calculatePayInSurchargeCents(50_000, 'google_pay').surchargeCents, 1_500);

  // 2. Creator Payout Preview Tests (0 % Plattformgebühr, 1 % Instant DE/AT)
  const stdPreview = calculateCreatorPayoutPreview(10_000, 'standard', 'DE');
  assert.equal(stdPreview.platformFeeCents, 0);
  assert.equal(stdPreview.instantFeeCents, 0);
  assert.equal(stdPreview.netPayoutCents, 10_000);

  const instantPreview = calculateCreatorPayoutPreview(10_000, 'instant', 'AT');
  assert.equal(instantPreview.platformFeeCents, 0);
  assert.equal(instantPreview.instantFeeCents, 100);
  assert.equal(instantPreview.netPayoutCents, 9_900);

  assert.throws(() => calculateCreatorPayoutPreview(10_000, 'instant', 'CH'), /Deutschland und Österreich/);

  // 3. PGlite Integration & Concurrency Tests
  const db = new PGlite();
  await applyMigrations(db);
  const sql = createPgliteSqlAdapter(db);

  // Seed brand + 5 creators + 2 campaigns + applications + 5 submissions
  const [brand] = await sql.query(
    `INSERT INTO brand_accounts (email, contact_name, company_name)
     VALUES ('finance@marke.de', 'Max', 'Marke GmbH') RETURNING id`,
  );
  const brandId = String(brand.id);

  const [camp1] = await sql.query(
    `INSERT INTO brand_campaigns (public_id, brand_id, title, brand_display_name, compensation_model, total_budget_eur, tkp_eur_cents, platforms)
     VALUES ('CMP-1111AAAA', $1, 'Concurrency Camp', 'Marke GmbH', 'tkp', 1000, 200, ARRAY['tiktok']) RETURNING id`,
    [brandId],
  );
  const camp1Id = String(camp1.id);

  const [camp2] = await sql.query(
    `INSERT INTO brand_campaigns (public_id, brand_id, title, brand_display_name, compensation_model, total_budget_eur, tkp_eur_cents, platforms)
     VALUES ('CMP-2222BBBB', $1, 'Partial Camp', 'Marke GmbH', 'tkp', 500, 200, ARRAY['instagram']) RETURNING id`,
    [brandId],
  );
  const camp2Id = String(camp2.id);

  const creatorIds: string[] = [];
  const submissionIds: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const [c] = await sql.query(
      `INSERT INTO creator_profiles (id, public_id, status, display_name)
       VALUES ($1, $2, 'active', $3) RETURNING id`,
      [crypto.randomUUID(), `UGC-PAYTEST00${i}`, `Creator ${i}`],
    );
    const creatorId = String(c.id);
    creatorIds.push(creatorId);

    const [app] = await sql.query(
      `INSERT INTO brand_campaign_applications (campaign_id, creator_id, status)
       VALUES ($1, $2, 'selected') RETURNING id`,
      [camp1Id, creatorId],
    );
    const [sub] = await sql.query(
      `INSERT INTO brand_campaign_submissions (campaign_id, application_id, creator_id, platform, content_url, status)
       VALUES ($1, $2, $3, 'tiktok', $4, 'approved') RETURNING id`,
      [camp1Id, app.id, creatorId, `https://tiktok.com/@c${i}/video/${i}`],
    );
    submissionIds.push(String(sub.id));
  }

  // 3a. Top-up + Idempotent Webhook (100 % Schutz vor Doppelbuchung)
  assert.equal(await recordWebhookEventOnce(sql, 'evt_test_1', 'checkout.session.completed'), true);
  assert.equal(await recordWebhookEventOnce(sql, 'evt_test_1', 'checkout.session.completed'), false);

  const pending = await createPendingTopup(sql, {
    brandId,
    amountCents: 150_000, // 1.500 EUR
    method: 'card',
    providerRef: 'cs_test_1',
  });
  assert.equal(pending.surchargeCents, 4_500); // 3 % Kartengebühr
  assert.equal(pending.totalChargedCents, 154_500);

  const firstSettle = await settleTopupIdempotently(sql, { providerRef: 'cs_test_1' });
  const duplicateSettle = await settleTopupIdempotently(sql, { providerRef: 'cs_test_1' });
  assert.equal(firstSettle.settledNow, true);
  assert.equal(duplicateSettle.settledNow, false);

  let wallet = await ensureBrandWallet(sql, brandId);
  assert.equal(wallet.availableCents, 150_000, 'Duplicate webhook must not credit twice');

  // 3b. Reservation Guard: available < budget_cap must fail
  await assert.rejects(
    () =>
      reserveCampaignBudget(sql, {
        brandId,
        campaignId: camp1Id,
        budgetCapCents: 200_000,
        platformFeeBps: 1500,
      }),
    /Nicht genügend verfügbares Guthaben/,
  );

  // Valid reservation: 1.000 EUR (850 EUR creator pool + 150 EUR platform fee)
  const res1 = await reserveCampaignBudget(sql, {
    brandId,
    campaignId: camp1Id,
    budgetCapCents: 100_000,
    platformFeeBps: 1500,
  });
  assert.equal(res1.creatorPoolCapCents, 85_000);
  assert.equal(res1.reservedCents, 100_000);

  wallet = await ensureBrandWallet(sql, brandId);
  assert.equal(wallet.availableCents, 50_000);
  assert.equal(wallet.reservedCents, 100_000);

  // 3c. CONCURRENCY TEST: 5 simultaneous settlements each claiming 30.000 Cent (= 150.000 > 85.000 cap!)
  const concurrentResults = await Promise.all(
    submissionIds.map((subId, idx) =>
      settleCountedSubmission(sql, {
        campaignId: camp1Id,
        submissionId: subId,
        creatorId: creatorIds[idx],
        viewsAtCutoff: 150_499, // floor = 150 * 200 cents = 30.000 cents each
        ratePer1000Cents: 200,
      }),
    ),
  );

  const totalGrantedCreator = concurrentResults.reduce((s, r) => s + r.grantedCreatorCents, 0);
  const totalGrantedFee = concurrentResults.reduce((s, r) => s + r.grantedFeeCents, 0);

  assert.equal(totalGrantedCreator, 85_000, 'Concurrent settlements must cap creator payouts at exact creator_pool_cap');
  assert.ok(
    totalGrantedCreator + totalGrantedFee <= 100_000,
    `Sum of creator + fee (${totalGrantedCreator + totalGrantedFee}) must NEVER exceed budget_cap (100.000)`,
  );

  const [camp1Row] = await sql.query(
    `SELECT released_creator_cents, released_fee_cents, reserved_cents FROM campaign_reservations WHERE campaign_id = $1`,
    [camp1Id],
  );
  assert.equal(Number(camp1Row.released_creator_cents), 85_000);
  assert.equal(Number(camp1Row.released_fee_cents), 15_000);
  assert.equal(Number(camp1Row.reserved_cents), 0);

  // 3d. Partial Campaign Close returns exact unused reservation back to brand_wallet.available_cents
  await reserveCampaignBudget(sql, {
    brandId,
    campaignId: camp2Id,
    budgetCapCents: 50_000,
    platformFeeBps: 1000, // 10 % Black Friday promo -> 45.000 creator pool / 5.000 fee
  });
  const [app2] = await sql.query(
    `INSERT INTO brand_campaign_applications (campaign_id, creator_id, status)
     VALUES ($1, $2, 'selected') RETURNING id`,
    [camp2Id, creatorIds[0]],
  );
  const [sub2] = await sql.query(
    `INSERT INTO brand_campaign_submissions (campaign_id, application_id, creator_id, platform, content_url, status)
     VALUES ($1, $2, $3, 'instagram', 'https://instagram.com/reel/abc', 'approved') RETURNING id`,
    [camp2Id, app2.id, creatorIds[0]],
  );
  const partialSettle = await settleCountedSubmission(sql, {
    campaignId: camp2Id,
    submissionId: String(sub2.id),
    creatorId: creatorIds[0],
    viewsAtCutoff: 45_000, // 45 * 200 = 9.000 cents creator + 1.000 cents fee = 10.000 cents total
    ratePer1000Cents: 200,
  });
  assert.equal(partialSettle.grantedCreatorCents, 9_000);
  assert.equal(partialSettle.grantedFeeCents, 1_000);

  const closeRes = await closeCampaignReservation(sql, camp2Id);
  assert.equal(closeRes.closedNow, true);
  assert.equal(closeRes.returnedCents, 40_000);

  wallet = await ensureBrandWallet(sql, brandId);
  assert.equal(wallet.availableCents, 40_000, 'Unused reservation must flow back to available_cents');
  assert.equal(wallet.reservedCents, 0);

  // 4. Creator Payout Guardrails + DAC7 + Credit Note Issuance
  const payoutCreatorId = creatorIds[0];
  const balBefore = await ensureCreatorBalance(sql, payoutCreatorId);
  assert.ok(balBefore.availableCents >= 9_000, 'Creator should have earned balance from settled campaigns');

  // Guard 1: Blocked without Stripe KYC
  await assert.rejects(
    () => reserveCreatorPayout(sql, { creatorId: payoutCreatorId, amountCents: 5_000 }),
    /Verifizierung \(KYC\)/,
  );

  // Simulate Stripe account.updated -> verified
  await sql.query(
    `UPDATE creator_balances
     SET stripe_connect_account_id = 'acct_test_123', stripe_onboarding_status = 'verified'
     WHERE creator_id = $1`,
    [payoutCreatorId],
  );

  // Guard 2: Blocked without DAC7 tax profile & Self-Billing agreement
  await assert.rejects(
    () => reserveCreatorPayout(sql, { creatorId: payoutCreatorId, amountCents: 5_000 }),
    /Steuerprofil unvollständig/,
  );

  // Save complete DAC7 & UStG tax profile
  const taxProfile = await upsertCreatorTaxProfile(sql, {
    creatorId: payoutCreatorId,
    legalName: 'Anna Muster',
    country: 'DE',
    smallBusiness: true,
    taxNumber: '12/345/67890',
    vatId: '',
    taxId: '12345678901',
    dateOfBirth: '1997-04-12',
    street: 'Musterstr. 10',
    postalCode: '10115',
    city: 'Berlin',
    agreeSelfBilling: true,
  });

  // Guard 3: Blocked below minimum payout (25 EUR)
  await assert.rejects(
    () => reserveCreatorPayout(sql, { creatorId: payoutCreatorId, amountCents: 1_000 }),
    /Mindestauszahlungsbetrag/,
  );

  // Valid payout reservation + failed revert test + successful paid finalization
  const failedAttempt = await reserveCreatorPayout(sql, {
    creatorId: payoutCreatorId,
    amountCents: 5_000,
    payoutSpeed: 'standard',
  });
  assert.equal(failedAttempt.preview.platformFeeCents, 0);
  assert.equal(await revertCreatorPayoutFailed(sql, failedAttempt.payoutId), true);
  assert.equal((await ensureCreatorBalance(sql, payoutCreatorId)).availableCents, balBefore.availableCents);

  const reservedPayout = await reserveCreatorPayout(sql, {
    creatorId: payoutCreatorId,
    amountCents: 5_000,
    payoutSpeed: 'standard',
  });
  const paid = await finalizeCreatorPayoutPaid(sql, {
    payoutId: reservedPayout.payoutId,
    providerTransferRef: 'tr_test_1',
    providerPayoutRef: 'po_test_1',
  });
  assert.equal(paid.transitionedNow, true);

  const issued = await issueCreditNoteForPayout(sql, {
    payoutId: reservedPayout.payoutId,
    creatorId: payoutCreatorId,
    amountCents: 5_000,
    taxProfile,
    period: '2026-11',
  });
  assert.match(issued.number, /^GS-\d{4}-000001$/);
  assert.equal(Buffer.from(issued.pdfBytes).subarray(0, 5).toString('ascii'), '%PDF-');
  assert.ok(issued.xml.includes('<ram:TypeCode>389</ram:TypeCode>'), 'ZUGFeRD XML must use TypeCode 389 (Self-billed Gutschrift)');
  assert.ok(issued.xml.includes('DE814954842'), 'ZUGFeRD XML must contain buyer VAT ID');

  // 5. All 4 DACH VAT Tax Cases for Gutschriften
  const deSmall = calculateCreditNoteTax(10_000, { country: 'DE', smallBusiness: true });
  assert.equal(deSmall.vatRateType, '0');
  assert.equal(deSmall.vatCents, 0);
  assert.equal(deSmall.grossCents, 10_000);
  assert.ok(deSmall.legalNote.includes('§ 19 UStG'));

  const deRegular = calculateCreditNoteTax(10_000, { country: 'DE', smallBusiness: false });
  assert.equal(deRegular.vatRateType, '19');
  assert.equal(deRegular.vatCents, 1_900);
  assert.equal(deRegular.grossCents, 11_900);

  const atReverse = calculateCreditNoteTax(10_000, { country: 'AT', smallBusiness: false });
  assert.equal(atReverse.vatRateType, 'reverse_charge');
  assert.equal(atReverse.vatCents, 0);
  assert.equal(atReverse.taxCategoryCode, 'AE');
  assert.ok(atReverse.legalNote.includes('Reverse Charge'));

  const chThird = calculateCreditNoteTax(10_000, { country: 'CH', smallBusiness: false });
  assert.equal(chThird.vatRateType, '0');
  assert.equal(chThird.vatCents, 0);
  assert.equal(chThird.taxCategoryCode, 'O');

  const regPdf = await generateCreditNotePdfWithZugferd({
    number: 'GS-2026-000002',
    issuedAtIso: '2026-11-26T12:00:00Z',
    period: '2026-11',
    creator: {
      legalName: 'Max Regelbesteuert',
      street: 'Hauptstr. 1',
      postalCode: '80331',
      city: 'München',
      country: 'DE',
      smallBusiness: false,
      taxNumber: '143/123/45678',
      vatId: 'DE299999999',
    },
    netCents: 10_000,
  });
  assert.equal(regPdf.tax.grossCents, 11_900);
  assert.equal(Buffer.from(regPdf.pdfBytes).subarray(0, 5).toString('ascii'), '%PDF-');

  // 6. Brand Invoice PDF with separate Kartengebühr line
  const brandInvoicePdf = await generateBrandTopupInvoicePdf({
    invoiceNumber: 'RE-2026-123456',
    issuedAtIso: '2026-11-26T12:00:00Z',
    brandCompany: 'Marke GmbH',
    brandEmail: 'finance@marke.de',
    amountCents: 100_000,
    surchargeCents: 3_000,
    surchargeLabel: 'Kartengebühr',
    totalChargedCents: 103_000,
    methodLabel: 'Kreditkarte',
    platformFeePercent: 15,
  });
  assert.equal(Buffer.from(brandInvoicePdf).subarray(0, 5).toString('ascii'), '%PDF-');

  // 7. Dual Stripe Webhook Secrets (Account + Connect webhook on same endpoint)
  process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_for_webhook_verification_only';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_account_secret_12345';
  process.env.STRIPE_CONNECT_WEBHOOK_SECRET = 'whsec_test_connect_secret_67890';
  const dummyStripe = new Stripe('sk_test_dummy_for_webhook_verification_only');
  const acctPayload = JSON.stringify({ id: 'evt_acct_1', type: 'checkout.session.async_payment_succeeded', data: { object: {} } });
  const connPayload = JSON.stringify({ id: 'evt_conn_1', type: 'account.updated', data: { object: {} } });
  const acctSig = dummyStripe.webhooks.generateTestHeaderString({
    payload: acctPayload,
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  });
  const connSig = dummyStripe.webhooks.generateTestHeaderString({
    payload: connPayload,
    secret: process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
  });
  const badSig = dummyStripe.webhooks.generateTestHeaderString({
    payload: connPayload,
    secret: 'whsec_wrong_secret',
  });
  assert.equal(constructVerifiedStripeEvent(acctPayload, acctSig).id, 'evt_acct_1');
  assert.equal(constructVerifiedStripeEvent(connPayload, connSig).id, 'evt_conn_1');
  assert.throws(() => constructVerifiedStripeEvent(connPayload, badSig));

  // 8. Migration 026: Pay-per-Video Fixed Escrow + Affiliate / Kickback Settlements
  const [campFixed] = await sql.query(
    `INSERT INTO brand_campaigns (
       public_id, brand_id, title, brand_display_name, compensation_model,
       budget_per_video_eur, total_budget_eur, platforms,
       affiliate_enabled, affiliate_type, affiliate_rate_bps, affiliate_target_url
     ) VALUES (
       'CMP-3333CCCC', $1, 'Fixpreis + Affiliate Camp', 'Marke GmbH', 'fixed',
       200, 300, ARRAY['tiktok', 'instagram'],
       true, 'percent', 1000, 'https://shop.marke.de/produkt'
     ) RETURNING id`,
    [brandId],
  );
  const campFixedId = String(campFixed.id);

  // Reserve 300 EUR (255 EUR creator pool + 45 EUR platform fee) from remaining 400 EUR available wallet
  const fixedRes = await reserveCampaignBudget(sql, {
    brandId,
    campaignId: campFixedId,
    budgetCapCents: 30_000,
    platformFeeBps: 1500,
  });
  assert.equal(fixedRes.creatorPoolCapCents, 25_500);

  const [appFixed] = await sql.query(
    `INSERT INTO brand_campaign_applications (campaign_id, creator_id, status)
     VALUES ($1, $2, 'selected') RETURNING id`,
    [campFixedId, creatorIds[1]],
  );
  const [subFixed1] = await sql.query(
    `INSERT INTO brand_campaign_submissions (campaign_id, application_id, creator_id, platform, content_url, status, spend_eur_cents)
     VALUES ($1, $2, $3, 'tiktok', 'https://tiktok.com/@c2/video/fixed1', 'approved', 20000) RETURNING id`,
    [campFixedId, appFixed.id, creatorIds[1]],
  );

  const c2BalBefore = (await ensureCreatorBalance(sql, creatorIds[1])).availableCents;
  const fixedSettle1 = await settleFixedVideoSubmission(sql, {
    brandId,
    campaignId: campFixedId,
    submissionId: String(subFixed1.id),
    creatorId: creatorIds[1],
    fixedAmountCents: 20_000, // 200 EUR -> covered from 255 EUR reservation pool
  });
  assert.equal(fixedSettle1.settledNow, true);
  assert.equal(fixedSettle1.fundingSource, 'reservation');
  assert.equal(fixedSettle1.grantedCreatorCents, 20_000);

  // Idempotent replay must NOT double-credit
  const fixedSettle1Replay = await settleFixedVideoSubmission(sql, {
    brandId,
    campaignId: campFixedId,
    submissionId: String(subFixed1.id),
    creatorId: creatorIds[1],
    fixedAmountCents: 20_000,
  });
  assert.equal(fixedSettle1Replay.settledNow, false);
  assert.equal(fixedSettle1Replay.fundingSource, 'already_settled');
  assert.equal((await ensureCreatorBalance(sql, creatorIds[1])).availableCents, c2BalBefore + 20_000);

  // Second fixed video (80 EUR): reservation only has 55 EUR left, so falls back cleanly to wallet (100 EUR available >= 80 + 12 = 92 EUR)
  const [subFixed2] = await sql.query(
    `INSERT INTO brand_campaign_submissions (campaign_id, application_id, creator_id, platform, content_url, status, spend_eur_cents)
     VALUES ($1, $2, $3, 'instagram', 'https://instagram.com/reel/fixed2', 'approved', 8000) RETURNING id`,
    [campFixedId, appFixed.id, creatorIds[1]],
  );
  const fixedSettle2 = await settleFixedVideoSubmission(sql, {
    brandId,
    campaignId: campFixedId,
    submissionId: String(subFixed2.id),
    creatorId: creatorIds[1],
    fixedAmountCents: 8_000,
  });
  assert.equal(fixedSettle2.settledNow, true);
  assert.equal(fixedSettle2.fundingSource, 'wallet');
  assert.equal(fixedSettle2.grantedCreatorCents, 8_000);
  assert.equal(fixedSettle2.grantedFeeCents, 1_200);
  assert.equal((await ensureCreatorBalance(sql, creatorIds[1])).availableCents, c2BalBefore + 28_000);

  // Third fixed video (500 EUR): neither reservation nor wallet covers -> must fail closed & leave no dangling settlement row
  const [subFixed3] = await sql.query(
    `INSERT INTO brand_campaign_submissions (campaign_id, application_id, creator_id, platform, content_url, status, spend_eur_cents)
     VALUES ($1, $2, $3, 'tiktok', 'https://tiktok.com/@c2/video/fixed3', 'approved', 50000) RETURNING id`,
    [campFixedId, appFixed.id, creatorIds[1]],
  );
  await assert.rejects(
    () =>
      settleFixedVideoSubmission(sql, {
        brandId,
        campaignId: campFixedId,
        submissionId: String(subFixed3.id),
        creatorId: creatorIds[1],
        fixedAmountCents: 50_000,
      }),
    /Nicht genügend Guthaben im Marken-Wallet/,
  );
  const danglingFixed = await sql.query(`SELECT id FROM submission_settlements WHERE submission_id = $1`, [subFixed3.id]);
  assert.equal(danglingFixed.length, 0, 'Failed fixed settlement must clean up its claim row');

  // 8b. Affiliate Code + Kickback Commission Calculation + Conversion Settlement & Idempotency
  const affCode1 = await ensureCreatorAffiliateCode(sql, String(appFixed.id), 'Creator 2');
  const affCode2 = await ensureCreatorAffiliateCode(sql, String(appFixed.id), 'Creator 2');
  assert.equal(affCode1, affCode2, 'Affiliate code generation must be idempotent');
  assert.match(affCode1, /^[A-Z0-9]+-[A-Z0-9]{4}$/);

  assert.equal(
    calculateAffiliateCommissionCents({
      affiliateType: 'percent',
      affiliateRateBps: 1000,
      affiliateFixedCents: null,
      orderAmountCents: 12_000,
    }),
    1_200,
  );
  assert.equal(
    calculateAffiliateCommissionCents({
      affiliateType: 'fixed_per_sale',
      affiliateRateBps: null,
      affiliateFixedCents: 1_500,
      orderAmountCents: 9_900,
    }),
    1_500,
  );

  // Record confirmed sale (120 EUR order -> 12 EUR kickback + 1.80 EUR fee = 13.80 EUR, funded from remaining 55 EUR reservation!)
  const conv1 = await recordAndSettleAffiliateConversion(sql, {
    brandId,
    campaignId: campFixedId,
    applicationId: String(appFixed.id),
    creatorId: creatorIds[1],
    externalOrderRef: 'ORD-TEST-1001',
    orderAmountCents: 12_000,
    commissionCents: 1_200,
    platformFeeBps: 1500,
    source: 'webhook',
    autoApprove: true,
  });
  assert.equal(conv1.createdNow, true);
  assert.equal(conv1.status, 'approved');
  assert.equal(conv1.commissionCents, 1_200);
  assert.equal(conv1.platformFeeCents, 180);

  // Duplicate externalOrderRef must be idempotent
  const conv1Dup = await recordAndSettleAffiliateConversion(sql, {
    brandId,
    campaignId: campFixedId,
    applicationId: String(appFixed.id),
    creatorId: creatorIds[1],
    externalOrderRef: 'ORD-TEST-1001',
    orderAmountCents: 12_000,
    commissionCents: 1_200,
    platformFeeBps: 1500,
    source: 'webhook',
    autoApprove: true,
  });
  assert.equal(conv1Dup.createdNow, false);
  assert.equal(conv1Dup.conversionId, conv1.conversionId);
  assert.equal((await ensureCreatorBalance(sql, creatorIds[1])).availableCents, c2BalBefore + 29_200);

  const listedConvs = await listCampaignAffiliateConversions(sql, campFixedId);
  assert.equal(listedConvs.length, 1);
  assert.equal(listedConvs[0].creatorName, 'Creator 2');
  assert.equal(listedConvs[0].affiliateCode, affCode1);
  assert.equal(listedConvs[0].externalOrderRef, 'ORD-TEST-1001');

  // Affiliate sale exceeding remaining reservation + wallet must fail closed
  await assert.rejects(
    () =>
      recordAndSettleAffiliateConversion(sql, {
        brandId,
        campaignId: campFixedId,
        applicationId: String(appFixed.id),
        creatorId: creatorIds[1],
        externalOrderRef: 'ORD-TEST-TOOBIG',
        orderAmountCents: 500_000,
        commissionCents: 50_000,
        platformFeeBps: 1500,
        source: 'manual',
        autoApprove: true,
      }),
    /Nicht genügend Guthaben im Marken-Wallet/,
  );

  await db.close();
  console.log(
    'OK: Etappe 6 + Mig 026 Payments Flow (0% SEPA / 3% Karte, Dual-Secret Webhooks, idempotent Webhooks, 5x Concurrency Cap-Safety, Close Refund, KYC+DAC7 Guardrails, 4x DACH ZUGFeRD Gutschrift PDFs, Brand Invoice PDF, Fixed-Video Escrow & Affiliate Kickbacks).',
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

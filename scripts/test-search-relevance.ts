import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { POST } from '../app/api/search/route';
import { getDatabase } from '../app/lib/database';
import {
  analyzeQueryDeterministically,
  calculateTotalReach,
  parsePriceValue,
  textMatchesTopic,
} from '../app/lib/search-scoring';

async function runUnitChecks() {
  // 1. Substring false-positive elimination ("skincare" != "car", "Preise" != "reise", etc.)
  assert.equal(textMatchesTopic('Beauty, Skincare, Haircare, Selfcare, Mascara', 'automotive'), false);
  assert.equal(textMatchesTopic('Automatisch generierter Content, Autorin', 'automotive'), false);
  assert.equal(textMatchesTopic('KFZ, Autopflege, Fahrzeugpflege, Tuning', 'automotive'), true);
  assert.equal(textMatchesTopic('Ich liebe mein E-Auto und mache Auto-Creator Videos', 'automotive'), true);
  assert.equal(textMatchesTopic('Car Detailing & Motorsport', 'automotive'), true);

  assert.equal(textMatchesTopic('Skincare, Haircare, Daily Routine, Kinder, Happy', 'tech'), false);
  assert.equal(textMatchesTopic('App-Demo, SaaS, KI Tools, Smartphone', 'tech'), true);

  assert.equal(textMatchesTopic('Preise auf Anfrage', 'travel'), false);
  assert.equal(textMatchesTopic('Reisen, Camping und Roadtrip', 'travel'), true);

  assert.equal(textMatchesTopic('Interessen: Kunst, wohnt in Hessen', 'food'), false);
  assert.equal(textMatchesTopic('Kochen, Rezepte, Food und Kaffee', 'food'), true);

  assert.equal(textMatchesTopic('Detailorientiert, gut sortiert, kompetent', 'pets'), false);
  assert.equal(textMatchesTopic('Golden Retriever Welpe, Hundefutter', 'pets'), true);

  assert.equal(textMatchesTopic('Moderne Moderation und Model-Erfahrung', 'fashion'), false);
  assert.equal(textMatchesTopic('Mode, Streetwear und Outfits', 'fashion'), true);

  // 2. Reach parsing fixes
  assert.equal(calculateTotalReach('TikTok: 1.5k'), 1500);
  assert.equal(calculateTotalReach('Instagram: 2,5k, TikTok: 10.000'), 12500);
  assert.equal(calculateTotalReach('YouTube: 1.25M'), 1250000);
  assert.equal(calculateTotalReach('Seit 2024 aktiv, Instagram 5k, ab 250 €'), 5000);
  assert.equal(calculateTotalReach('Instagram 10k - 20k'), 15000);

  // 3. Price parsing fixes
  assert.equal(parsePriceValue('10% Rabatt ab 3 Videos, 450 € pro Paket'), 450);
  assert.equal(parsePriceValue('Video ab 180 Euro'), 180);
  assert.equal(parsePriceValue('3 Videos für 600 €'), 600);
  assert.equal(parsePriceValue('250'), 250);

  // 4. Deterministic query analyzer: no stopword Levenshtein explosions & no age/price collisions
  const budgetQuery = analyzeQueryDeterministically('Ich suche auch noch Creator mit Budget bis 500 € ohne Agentur');
  assert.equal(budgetQuery.priceRange.max, 500);
  assert.equal(budgetQuery.ageRange.min, null);
  assert.equal(budgetQuery.ageRange.max, null);
  assert.equal(budgetQuery.topics.includes('automotive'), false, '"auch" must not trigger automotive');
  assert.equal(budgetQuery.topics.includes('tech'), false, '"noch" must not trigger tech');
  assert.equal(budgetQuery.topics.includes('home'), false, '"ohne" must not trigger home');

  const ageQuery = analyzeQueryDeterministically('Ich suche Mamas zwischen 30 und 45 mit Kindern (2 bis 8 Jahre) für Alltagsvideos');
  assert.equal(ageQuery.gender, 'female');
  assert.equal(ageQuery.ageRange.min, 30);
  assert.equal(ageQuery.ageRange.max, 45);
  assert.equal(ageQuery.priceRange.max, null, 'Age must not collide with priceRange');
  assert.equal(ageQuery.topics.includes('family'), true);

  const hierQuery = analyzeQueryDeterministically('Hier suche ich jemanden für Foto Content');
  assert.equal(hierQuery.topics.includes('pets'), false, '"hier" must not trigger pets');
  assert.equal(hierQuery.topics.includes('food'), false, '"foto" must not trigger food');
}

async function runIntegrationChecks() {
  process.env.DATABASE_URL = 'postgres://test:test@relevance.invalid/test';
  delete process.env.OPENROUTER_API_KEY;

  const db = new PGlite();
  const client = getDatabase();
  Object.defineProperty(client, 'query', {
    value: async (sql: string, params: unknown[] = []) => (await db.query(sql, params)).rows,
  });

  try {
    for (const migration of [
      '001_creator_platform',
      '007_social_avatars',
      '010_contact_reachable',
      '012_search_log',
      '015_casting_portfolio',
      '016_avatar_casting_review',
    ]) {
      const sql = await readFile(`db/migrations/${migration}.sql`, 'utf8');
      await db.exec(sql.replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;', ''));
    }

    // Seed mixed realistic pool:
    // - High-reach Beauty/Skincare creators with portfolios & reachable email (previously dominated "Auto Creator"!)
    // - Genuine Automotive creators (lower reach, no portfolio)
    // - Family creator whose kid info lives ONLY in children_context
    // - Pet creator whose dog info lives ONLY in pet_context
    // - Niche keyword creators outside the 15 topic buckets (Kaffeemaschine, Photovoltaik)
    await db.exec(`
      INSERT INTO creator_profiles (
        id, public_id, display_name, gender, birth_year, city,
        topics, industries, preferred_content, rate_text, reach_text, total_reach,
        children_context, pet_context, profile_quality_score, status
      ) VALUES
        (gen_random_uuid(), 'UGC-BEAUTY0001', 'Carina Glow', 'Weiblich', 1998, 'Berlin',
         'Beauty, Skincare, Haircare, Selfcare, Mascara', 'Kosmetik', 'Reels, Unboxing', 'Preise ab 250 €', 'Instagram: 450k', 450000,
         null, null, 95, 'active'),
        (gen_random_uuid(), 'UGC-BEAUTY0002', 'Carolin Style', 'Weiblich', 1996, 'München',
         'Beauty, Mode, Lifestyle, Skincare, Make-up', 'Fashion', 'TikTok, GRWM', '300 € pro Video', 'TikTok: 800k', 800000,
         null, null, 98, 'active'),
        (gen_random_uuid(), 'UGC-AUTO000001', 'Markus Schrauber', 'Männlich', 1991, 'Stuttgart',
         'Auto, KFZ, Fahrzeugpflege, Tuning, Oldtimer', 'Automotive', 'Produktdemo, Werkstatt-Test', '220 €', 'TikTok: 4.5k', 4500,
         null, null, 60, 'active'),
        (gen_random_uuid(), 'UGC-AUTO000002', 'Jonas Mobil', 'Männlich', 1989, 'Köln',
         'E-Auto, Wallbox, Mobilität, Gebrauchtwagen', 'Automotive', 'Talking-Head, Testbericht', '350 €', 'YouTube: 12k', 12000,
         null, null, 70, 'active'),
        (gen_random_uuid(), 'UGC-TRAVEL0001', 'Lukas Vanlife', 'Männlich', 1993, 'Hamburg',
         'Camping, Outdoor, Roadtrip', 'Reisen', 'Vlog, B-Roll', '200 €', 'Instagram: 15k', 15000,
         null, null, 75, 'active'),
        (gen_random_uuid(), 'UGC-MAMA000001', 'Sarah Alltag', 'Weiblich', 1990, 'Berlin',
         'Alltag, Lifestyle', 'Haushalt', 'Authentische Alltagsvideos', '180 €', 'Instagram: 8k', 8000,
         'Zwei Kinder (3 und 6 Jahre), Kleinkind-Alltag', null, 80, 'active'),
        (gen_random_uuid(), 'UGC-PAPA000001', 'Tom Alltag', 'Männlich', 1988, 'Berlin',
         'Alltag, Familie', 'Haushalt', 'Alltagsvideos', '180 €', 'Instagram: 20k', 20000,
         'Ein Kind (4 Jahre)', null, 85, 'active'),
        (gen_random_uuid(), 'UGC-DOG0000001', 'Lisa Outdoor', 'Weiblich', 1994, 'Leipzig',
         'Alltag, Spaziergänge', 'Lifestyle', 'Produktdemo', '160 €', 'TikTok: 6k', 6000,
         null, 'Golden Retriever Welpe, liebt Hundefutter-Tests', 75, 'active'),
        (gen_random_uuid(), 'UGC-SOLAR00001', 'Stefan Energie', 'Männlich', 1984, 'München',
         'Eigenheim, Photovoltaik, Balkonkraftwerk, Speicher', 'Energie', 'Erklärvideo, Unboxing', '400 €', 'YouTube: 9k', 9000,
         null, null, 70, 'active'),
        (gen_random_uuid(), 'UGC-COFFEE0001', 'Elena Barista', 'Weiblich', 1995, 'Hamburg',
         'Siebträger-Kaffeemaschine, Espresso, Latte Art', 'Genuss', 'Rezeptvideo, Produktdemo', '240 €', 'Instagram: 18k', 18000,
         null, null, 80, 'active');

      -- Give Beauty creators reachable email & portfolio (maximum static popularity bonus!)
      INSERT INTO creator_private_contacts (creator_id, email, project_notifications_enabled)
      SELECT id, lower(public_id) || '@example.test', true FROM creator_profiles;

      INSERT INTO creator_portfolio_items (creator_id, url)
      SELECT id, 'https://example.test/portfolio/' || public_id
      FROM creator_profiles WHERE public_id IN ('UGC-BEAUTY0001', 'UGC-BEAUTY0002');

      INSERT INTO creator_social_accounts (creator_id, platform, url)
      SELECT id, 'instagram', 'https://instagram.com/' || lower(public_id) FROM creator_profiles;
    `);

    async function search(body: Record<string, unknown>) {
      const res = await POST(new Request('https://example.test/api/search', {
        method: 'POST',
        headers: { 'x-test-request': 'false' },
        body: JSON.stringify(body),
      }));
      assert.equal(res.status, 200, await res.clone().text());
      return res.json();
    }

    // TEST 1: "Auto Creator" MUST return ONLY real Auto creators, ZERO Beauty/Skincare girls!
    const autoResult = await search({ query: 'Ich suche einen Auto Creator oder jemand der dazu passt' });
    const autoIds = autoResult.creators.map((c: any) => c.id);
    assert.equal(autoIds.length, 2, `Expected 2 auto creators, got ${JSON.stringify(autoIds)}`);
    assert.ok(autoIds.includes('UGC-AUTO000001'));
    assert.ok(autoIds.includes('UGC-AUTO000002'));
    assert.equal(autoIds.includes('UGC-BEAUTY0001'), false, 'Carina Glow (Skincare) MUST NOT appear in Auto search');
    assert.equal(autoIds.includes('UGC-BEAUTY0002'), false, 'Carolin Style (Beauty) MUST NOT appear in Auto search');
    // Alternatives may include adjacent Travel/Vanlife, NEVER Beauty!
    const autoAltIds = autoResult.alternatives.map((c: any) => c.id);
    assert.equal(autoAltIds.includes('UGC-BEAUTY0001'), false, 'Beauty must not leak into Auto alternatives');
    assert.equal(autoAltIds.includes('UGC-BEAUTY0002'), false, 'Beauty must not leak into Auto alternatives');

    // TEST 2: "Mama mit Kleinkind" uses children_context + female filter (excludes Tom!)
    const mamaResult = await search({ query: 'Ich suche Mamas zwischen 30 und 45 mit Kindern für Alltagsvideos' });
    const mamaIds = mamaResult.creators.map((c: any) => c.id);
    assert.deepEqual(mamaIds, ['UGC-MAMA000001']);
    assert.equal(mamaResult.analysis.gender, 'female');

    // TEST 3: "Hundefutter" uses pet_context (previously never selected from DB!)
    const petResult = await search({ query: 'Creator mit Hund für Hundefutter Produktvideo' });
    const petIds = petResult.creators.map((c: any) => c.id);
    assert.deepEqual(petIds, ['UGC-DOG0000001']);

    // TEST 4: Free niche keywords outside the 15 buckets ("Photovoltaik" & "Kaffeemaschine")
    const solarResult = await search({ query: 'Suche Creator für Photovoltaik Erklärvideo' });
    assert.deepEqual(solarResult.creators.map((c: any) => c.id), ['UGC-SOLAR00001']);

    const coffeeResult = await search({ query: 'Suche Creator für Kaffeemaschine Produktdemo' });
    assert.deepEqual(coffeeResult.creators.map((c: any) => c.id), ['UGC-COFFEE0001']);

    // TEST 5: Completely non-existent niche returns 0 creators (no Beauty filler!)
    const emptyResult = await search({ query: 'Suche Creator für Quantencomputer Kryptographie' });
    assert.equal(emptyResult.creators.length, 0, 'Unmatched niche must return 0 primary creators, not random filler');

    // TEST 6: Pre-cap humanVerificationLevelMin filter works properly
    const verifiedOnly = await search({ query: 'Beauty Skincare Creator', humanVerificationLevelMin: 1 });
    assert.equal(verifiedOnly.creators.length, 2);
    assert.ok(verifiedOnly.creators.every((c: any) => c.id.startsWith('UGC-BEAUTY')));

    const autoVerifiedOnly = await search({ query: 'Auto Creator', humanVerificationLevelMin: 1 });
    assert.equal(autoVerifiedOnly.creators.length, 0, 'Auto creators without portfolio must be filtered out when level >= 1');

    console.log('OK: Phase 1 search relevance, word-boundary matching, DB context columns, and parser fixes verified.');
  } finally {
    await db.close();
  }
}

async function main() {
  await runUnitChecks();
  await runIntegrationChecks();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

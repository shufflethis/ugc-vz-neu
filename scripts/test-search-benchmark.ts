import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { getDatabase } from '../app/lib/database';
import { setEmbeddingProviderForTests } from '../app/lib/search-index';
import { setRerankerForTests } from '../app/lib/search-rerank';
import {
  CREATOR_CATEGORY_IDS,
  detectCategoriesFromQuery,
  getCategoryLabel,
  type CreatorCategoryId,
} from '../app/lib/creator-taxonomy';
import { diversifyAndRotateCandidates } from '../app/lib/search-diversify';
import { getVocab } from '../app/lib/agent-gateway';
import { POST as searchCreators } from '../app/api/search/route';

async function execMigration(db: PGlite, file: string) {
  const raw = await readFile(`db/migrations/${file}.sql`, 'utf8');
  const statements = raw
    .replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;', '')
    .split(/^-- statement-breakpoint\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await db.exec(stmt);
  }
}

// 30 typische DACH-Marken-Suchen mit erwarteter Zielkategorie (Spec 8.6 Benchmark)
const BENCHMARK_30_QUERIES: Array<{ query: string; expectedCategory: CreatorCategoryId }> = [
  { query: 'Auto', expectedCategory: 'auto_mobilitaet' },
  { query: 'Autos', expectedCategory: 'auto_mobilitaet' },
  { query: 'KFZ Werkstatt', expectedCategory: 'auto_mobilitaet' },
  { query: 'Autohaus TikTok Creator', expectedCategory: 'auto_mobilitaet' },
  { query: 'Automotive Zubehör', expectedCategory: 'auto_mobilitaet' },
  { query: 'E-Auto Wallbox', expectedCategory: 'auto_mobilitaet' },
  { query: 'Hundefutter', expectedCategory: 'haustiere' },
  { query: 'Katzenfutter und Tierbedarf', expectedCategory: 'haustiere' },
  { query: 'Gaming Headset', expectedCategory: 'gaming' },
  { query: 'PS5 Controller Gaming Setup', expectedCategory: 'gaming' },
  { query: 'Skincare Serum', expectedCategory: 'beauty_pflege' },
  { query: 'Haarpflege Shampoo', expectedCategory: 'beauty_pflege' },
  { query: 'Sneaker Streetwear Mode', expectedCategory: 'mode_schmuck' },
  { query: 'Proteinriegel und Kaffee', expectedCategory: 'food_getraenke' },
  { query: 'Vegane Snacks Rezepte', expectedCategory: 'food_getraenke' },
  { query: 'Fitness Workout Gym', expectedCategory: 'fitness_sport' },
  { query: 'Supplements Vitamine Schlaf', expectedCategory: 'gesundheit' },
  { query: 'Babybrei und Kinderwagen', expectedCategory: 'familie_kinder' },
  { query: 'Möbel und Balkon Garten', expectedCategory: 'home_garten' },
  { query: 'Saugroboter Haushalt Putzen', expectedCategory: 'haushalt_putzen' },
  { query: 'Smartphone Powerbank Kopfhörer', expectedCategory: 'tech_gadgets' },
  { query: 'Camping Vanlife Outdoor', expectedCategory: 'reisen_outdoor' },
  { query: 'ETF Finanzen Versicherung', expectedCategory: 'finanzen_business' },
  { query: 'Produktivitäts App Software SaaS', expectedCategory: 'apps_software' },
  { query: 'Sprachkurs Onlinekurs Lernen', expectedCategory: 'bildung' },
  { query: 'Balkonkraftwerk Solar Nachhaltigkeit', expectedCategory: 'nachhaltigkeit' },
  { query: 'Festival Brettspiel Geschenk', expectedCategory: 'events_freizeit' },
  { query: 'Gitarre Podcast Musik', expectedCategory: 'musik_kultur' },
  { query: 'Werkzeug Akkuschrauber DIY', expectedCategory: 'handwerk_diy' },
  { query: 'Renovieren Baumarkt Heimwerken', expectedCategory: 'handwerk_diy' },
];

let reqSeq = 0;

async function runQuery(query: string, sessionSeed = 'bench-session-1') {
  reqSeq += 1;
  const res = await searchCreators(
    new Request('https://ugc-vz.de/api/search', {
      method: 'POST',
      headers: { 'x-forwarded-for': `203.0.113.${(reqSeq % 200) + 1}` },
      body: JSON.stringify({ query, sessionSeed }),
    }),
  );
  assert.equal(res.status, 200);
  return (await res.json()) as {
    success: boolean;
    creators: Array<{ id: string; name: string; primaryCategory?: string; categories?: string[]; matchReason?: string }>;
    totalCount: number;
    detectedCategory: string | null;
    searchLogId: number | null;
  };
}

async function main() {
  assert.equal(CREATOR_CATEGORY_IDS.length, 20, 'Taxonomy must contain exactly 20 canonical categories');

  // 1. Query category detection checks for all 30 benchmark queries
  let detectedExact = 0;
  for (const item of BENCHMARK_30_QUERIES) {
    const detected = detectCategoriesFromQuery(item.query);
    if (detected[0]?.id === item.expectedCategory && detected[0].confidence >= 0.7) {
      detectedExact += 1;
    } else {
      throw new Error(
        `Query "${item.query}" expected ${item.expectedCategory} (>=0.7), got ${JSON.stringify(detected.slice(0, 2))}`,
      );
    }
  }
  assert.equal(detectedExact, 30);

  // 2. Full DB benchmark with realistic German creator pool including Beauty "Bauchladen" generalists
  process.env.DATABASE_URL = 'postgres://test:test@search-benchmark.invalid/test';
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.OPENAI_API_KEY;
  setEmbeddingProviderForTests(null);
  setRerankerForTests(null);

  const db = new PGlite();
  const client = getDatabase();
  Object.defineProperty(client, 'query', {
    value: async (sql: string, params: unknown[] = []) => (await db.query(sql, params)).rows,
  });

  try {
    for (const m of [
      '001_creator_platform',
      '007_social_avatars',
      '010_contact_reachable',
      '012_search_log',
      '015_casting_portfolio',
      '016_avatar_casting_review',
      '020_hybrid_search_embeddings',
      '021_creator_ai_profiles',
      '023_creator_taxonomy_and_consent',
    ]) {
      await execMigration(db, m);
    }

    // Seed specialists across categories + 6 heavy Beauty/Fashion generalists ("Bauchladen")
    const seedCreators: Array<{
      id: string;
      name: string;
      city: string;
      primary: CreatorCategoryId;
      secondary: CreatorCategoryId[];
      topics: string;
      industries: string;
      formats: string;
      reach: number;
    }> = [
      // Auto & Mobilität specialists
      { id: 'UGC-AUTO000001', name: 'Endurostube', city: 'München', primary: 'auto_mobilitaet', secondary: ['handwerk_diy'], topics: 'Auto, KFZ, Autopflege, Motorrad, Werkstatt, E-Auto', industries: 'Automotive, Autohaus', formats: 'Tutorial, Talking Head', reach: 45000 },
      { id: 'UGC-AUTO000002', name: 'KFZ-Tobias', city: 'Stuttgart', primary: 'auto_mobilitaet', secondary: ['tech_gadgets'], topics: 'Autos, Automotive, Tuning, Dashcam, Wallbox, Autohaus', industries: 'Automotive, Mobilität', formats: 'Unboxing, Tutorial', reach: 28000 },
      { id: 'UGC-AUTO000003', name: 'CarCheckMax', city: 'Köln', primary: 'auto_mobilitaet', secondary: ['reisen_outdoor'], topics: 'Auto, Gebrauchtwagen, Fahrzeugpflege, E-Auto, KFZ', industries: 'Autohaus, Werkstatt', formats: 'Vorher/Nachher, Voiceover', reach: 33000 },
      // Haustiere specialists
      { id: 'UGC-PETS000001', name: 'BelloLab', city: 'Hamburg', primary: 'haustiere', secondary: ['familie_kinder'], topics: 'Hunde, Hundefutter, Welpe, Tierbedarf', industries: 'Haustiere, Tierfutter', formats: 'Unboxing, Talking Head', reach: 52000 },
      { id: 'UGC-PETS000002', name: 'KatzenWelt', city: 'Berlin', primary: 'haustiere', secondary: [], topics: 'Katzen, Katzenfutter, Haustiere, Tierpflege', industries: 'Tierbedarf', formats: 'Voiceover, ASMR', reach: 19000 },
      // Gaming specialists
      { id: 'UGC-GAME000001', name: 'PixelJonas', city: 'Leipzig', primary: 'gaming', secondary: ['tech_gadgets'], topics: 'Gaming, Gaming Headset, PS5, PC Gaming, Streaming', industries: 'Gaming, Elektronik', formats: 'Unboxing, Tutorial', reach: 80000 },
      { id: 'UGC-GAME000002', name: 'EsportNina', city: 'Frankfurt', primary: 'gaming', secondary: ['apps_software'], topics: 'Gaming, Headset, Controller, Gaming Setup, Twitch', industries: 'Gaming', formats: 'Talking Head, Comedy', reach: 41000 },
      // Beauty & Fashion (including Bauchladen generalists with huge reach who MUST NOT leak into Auto/Pets/Gaming!)
      { id: 'UGC-BEAU000001', name: 'SkincareLena', city: 'Berlin', primary: 'beauty_pflege', secondary: ['mode_schmuck'], topics: 'Beauty, Skincare, Serum, Haarpflege, Kosmetik, Make-up', industries: 'Kosmetik, Beauty', formats: 'Tutorial, Vorher/Nachher', reach: 350000 },
      { id: 'UGC-BEAU000002', name: 'GlowJana', city: 'Düsseldorf', primary: 'beauty_pflege', secondary: ['mode_schmuck'], topics: 'Beauty, Skincare, Haircare, Makeup, Parfum, Mode, Lifestyle, Fitness, Reisen, Food, Tech, Haushalt', industries: 'Beauty, Fashion, Kosmetik', formats: 'Unboxing, Talking Head', reach: 620000 },
      { id: 'UGC-MODE000001', name: 'StyleMira', city: 'Hamburg', primary: 'mode_schmuck', secondary: ['beauty_pflege'], topics: 'Mode, Fashion, Sneaker, Streetwear, Schmuck, Outfits', industries: 'Mode, Schmuck', formats: 'Unboxing, Talking Head', reach: 290000 },
      // Other categories covering all 30 queries
      { id: 'UGC-FOOD000001', name: 'KuechenPaul', city: 'Wien', primary: 'food_getraenke', secondary: ['nachhaltigkeit'], topics: 'Food, Kaffee, Proteinriegel, Vegane Snacks, Rezepte, Kochen', industries: 'Lebensmittel, Getränke', formats: 'Tutorial, ASMR', reach: 64000 },
      { id: 'UGC-FIT0000001', name: 'FitSven', city: 'Köln', primary: 'fitness_sport', secondary: ['gesundheit'], topics: 'Fitness, Workout, Gym, Kraftsport, Laufen, Supplements', industries: 'Sport, Fitness', formats: 'Talking Head, Vorher/Nachher', reach: 95000 },
      { id: 'UGC-HLTH000001', name: 'VitalClara', city: 'Zürich', primary: 'gesundheit', secondary: ['food_getraenke'], topics: 'Gesundheit, Supplements, Vitamine, Schlaf, Wellness', industries: 'Gesundheit, Apotheke', formats: 'Talking Head, Tutorial', reach: 37000 },
      { id: 'UGC-FAM0000001', name: 'MamaHannah', city: 'München', primary: 'familie_kinder', secondary: ['haushalt_putzen'], topics: 'Familie, Baby, Babybrei, Kinderwagen, Eltern, Kinder', industries: 'Baby, Familie', formats: 'Unboxing, Talking Head', reach: 48000 },
      { id: 'UGC-HOME000001', name: 'WohnLisa', city: 'Berlin', primary: 'home_garten', secondary: ['handwerk_diy'], topics: 'Home, Möbel, Balkon, Garten, Interior, Deko', industries: 'Wohnen, Garten', formats: 'Vorher/Nachher, Voiceover', reach: 53000 },
      { id: 'UGC-CLN0000001', name: 'CleanSarah', city: 'Essen', primary: 'haushalt_putzen', secondary: ['home_garten'], topics: 'Haushalt, Putzen, Saugroboter, Reinigung, Waschmittel', industries: 'Haushalt', formats: 'Vorher/Nachher, Tutorial', reach: 44000 },
      { id: 'UGC-TECH000001', name: 'GadgetTim', city: 'Berlin', primary: 'tech_gadgets', secondary: ['apps_software'], topics: 'Tech, Smartphone, Powerbank, Kopfhörer, Gadgets, Elektronik', industries: 'Elektronik, Tech', formats: 'Unboxing, Tutorial', reach: 71000 },
      { id: 'UGC-TRAV000001', name: 'VanlifeBen', city: 'Freiburg', primary: 'reisen_outdoor', secondary: ['nachhaltigkeit'], topics: 'Reisen, Camping, Vanlife, Outdoor, Wandern, Wohnmobil', industries: 'Reisen, Outdoor', formats: 'Voiceover, Talking Head', reach: 66000 },
      { id: 'UGC-FIN0000001', name: 'FinanzFelix', city: 'Frankfurt', primary: 'finanzen_business', secondary: ['apps_software'], topics: 'Finanzen, ETF, Versicherung, Steuern, Business, Investieren', industries: 'Finanzen, B2B', formats: 'Talking Head, Tutorial', reach: 39000 },
      { id: 'UGC-APPS000001', name: 'SaasMarie', city: 'Berlin', primary: 'apps_software', secondary: ['bildung'], topics: 'Apps, Software, SaaS, Produktivität, KI, Tools', industries: 'Software, SaaS', formats: 'Tutorial, Talking Head', reach: 24000 },
      { id: 'UGC-EDU0000001', name: 'LernLukas', city: 'Leipzig', primary: 'bildung', secondary: ['apps_software'], topics: 'Bildung, Sprachkurs, Onlinekurs, Lernen, Studium, Bücher', industries: 'Bildung', formats: 'Talking Head, Tutorial', reach: 21000 },
      { id: 'UGC-ECO0000001', name: 'SolarJule', city: 'Freiburg', primary: 'nachhaltigkeit', secondary: ['home_garten'], topics: 'Nachhaltigkeit, Solar, Balkonkraftwerk, Bio, Umwelt', industries: 'Energie, Nachhaltigkeit', formats: 'Tutorial, Talking Head', reach: 29000 },
      { id: 'UGC-EVT0000001', name: 'EventAlex', city: 'Köln', primary: 'events_freizeit', secondary: ['musik_kultur'], topics: 'Events, Festival, Brettspiel, Geschenk, Freizeit, Erlebnis', industries: 'Events, Freizeit', formats: 'Comedy, Unboxing', reach: 31000 },
      { id: 'UGC-MUS0000001', name: 'SoundKlara', city: 'Berlin', primary: 'musik_kultur', secondary: ['events_freizeit'], topics: 'Musik, Gitarre, Podcast, Kultur, Audio, Instrument', industries: 'Musik, Kultur', formats: 'ASMR, Talking Head', reach: 27000 },
      { id: 'UGC-DIY0000001', name: 'WerkbankOli', city: 'Dortmund', primary: 'handwerk_diy', secondary: ['home_garten'], topics: 'Handwerk, Werkzeug, Akkuschrauber, DIY, Renovieren, Baumarkt, Heimwerken', industries: 'Baumarkt, Handwerk', formats: 'Tutorial, Vorher/Nachher', reach: 58000 },
    ];

    for (const c of seedCreators) {
      await db.query(
        `INSERT INTO creator_profiles (
           id, public_id, display_name, city, topics, industries, preferred_content,
           rate_text, reach_text, total_reach, status, primary_category, secondary_categories, categories_confirmed_at
         ) VALUES (
           gen_random_uuid(), $1, $2, $3, $4, $5, $6, '250 €', $7, $8, 'active', $9, $10::text[], now()
         )`,
        [c.id, c.name, c.city, c.topics, c.industries, c.formats, `TikTok: ${c.reach}`, c.reach, c.primary, c.secondary],
      );
      await db.query(
        `INSERT INTO creator_social_accounts (creator_id, platform, url)
         SELECT id, 'tiktok', 'https://www.tiktok.com/@' || lower(public_id)
         FROM creator_profiles WHERE public_id = $1`,
        [c.id],
      );
    }

    // Check 1: "Auto" Top 20 contains ZERO beauty_pflege or mode_schmuck primary profiles
    const autoRes = await runQuery('Auto');
    assert.ok(autoRes.creators.length >= 3, `Expected >= 3 Auto creators, got ${autoRes.creators.length}`);
    for (const c of autoRes.creators.slice(0, 20)) {
      assert.notEqual(c.primaryCategory, 'beauty_pflege', `Beauty profile ${c.name} leaked into Auto Top 20`);
      assert.notEqual(c.primaryCategory, 'mode_schmuck', `Fashion profile ${c.name} leaked into Auto Top 20`);
      assert.ok(c.matchReason, 'Every hit must include matchReason');
      assert.ok(Array.isArray(c.categories) && c.categories.length > 0, 'Every hit must include categories');
    }

    // Check 2: "Auto", "Hundefutter", "Gaming Headset", "Skincare" share <= 2 profiles in Top 10
    const petsRes = await runQuery('Hundefutter');
    const gamingRes = await runQuery('Gaming Headset');
    const skincareRes = await runQuery('Skincare');
    const sets = [
      { name: 'Auto', ids: new Set(autoRes.creators.slice(0, 10).map((c) => c.id)) },
      { name: 'Hundefutter', ids: new Set(petsRes.creators.slice(0, 10).map((c) => c.id)) },
      { name: 'Gaming Headset', ids: new Set(gamingRes.creators.slice(0, 10).map((c) => c.id)) },
      { name: 'Skincare', ids: new Set(skincareRes.creators.slice(0, 10).map((c) => c.id)) },
    ];
    for (let i = 0; i < sets.length; i += 1) {
      for (let j = i + 1; j < sets.length; j += 1) {
        const overlap = [...sets[i].ids].filter((id) => sets[j].ids.has(id)).length;
        assert.ok(
          overlap <= 2,
          `Overlap between ${sets[i].name} and ${sets[j].name} is ${overlap} (max allowed: 2)`,
        );
      }
    }

    // Check 3: Synonyms 'Auto', 'Autos', 'KFZ', 'Autohaus', 'Automotive' produce largely identical Top 10
    const synonymResults = await Promise.all(['Auto', 'Autos', 'KFZ', 'Autohaus', 'Automotive'].map((q) => runQuery(q)));
    const baseAutoIds = new Set(synonymResults[0].creators.slice(0, 10).map((c) => c.id));
    for (let i = 1; i < synonymResults.length; i += 1) {
      const otherIds = synonymResults[i].creators.slice(0, 10).map((c) => c.id);
      const shared = otherIds.filter((id) => baseAutoIds.has(id)).length;
      assert.ok(shared >= Math.min(2, baseAutoIds.size), `Synonym query #${i} must overlap strongly with "Auto"`);
    }

    // Check 4: Run all 30 benchmark queries and measure Top-10 category precision
    let totalTop10Hits = 0;
    let relevantTop10Hits = 0;
    for (const item of BENCHMARK_30_QUERIES) {
      const res = await runQuery(item.query);
      assert.ok(res.creators.length > 0, `Benchmark query "${item.query}" returned 0 creators`);
      assert.ok(res.searchLogId && res.searchLogId > 0, 'Every search must be logged in search_log');
      const top10 = res.creators.slice(0, 10);
      const expectedLabel = getCategoryLabel(item.expectedCategory);
      for (const c of top10) {
        totalTop10Hits += 1;
        if (c.primaryCategory === item.expectedCategory || c.categories?.includes(expectedLabel)) {
          relevantTop10Hits += 1;
        }
      }
    }
    const precisionPct = Math.round((relevantTop10Hits / Math.max(1, totalTop10Hits)) * 100);
    assert.ok(precisionPct >= 85, `30-query benchmark precision too low: ${precisionPct}%`);

    // Check 5: Search logging captured detected_category
    const { rows: logRows } = await db.query<{ detected_category: string | null }>(
      "SELECT detected_category FROM search_log WHERE detected_category = 'auto_mobilitaet' LIMIT 1",
    );
    assert.equal(logRows.length, 1, 'search_log must store detected_category');

    // Check 6: Clean /api/v1/vocab (20 canonical categories, no messy duplicates)
    const vocab = (await getVocab()) as { categories: Array<{ id: string }>; pricing: string };
    assert.equal(vocab.categories.length, 20);
    assert.equal(vocab.pricing.includes('ohne Provision'), false);

    // Check 7: Session-stable MMR rotation
    const equalPool = Array.from({ length: 6 }, (_, idx) => ({
      id: `UGC-EQ0000000${idx}`,
      score: 100,
      relevanceScore: 100,
      primaryCategory: idx % 2 === 0 ? 'auto_mobilitaet' : 'handwerk_diy',
      categories: [idx % 2 === 0 ? 'Auto & Mobilität' : 'Handwerk & DIY'],
      city: idx % 3 === 0 ? 'Berlin' : 'München',
      topics: `Topic ${idx}`,
      hasCustomImage: true,
      totalReach: 10000,
    }));
    const runA1 = diversifyAndRotateCandidates(equalPool, { sessionSeed: 'seed-alpha' }).map((x) => x.id);
    const runA2 = diversifyAndRotateCandidates(equalPool, { sessionSeed: 'seed-alpha' }).map((x) => x.id);
    assert.deepEqual(runA1, runA2, 'Same sessionSeed must produce stable order');

    console.log(
      `OK: 30-Query-Benchmark (${precisionPct}% Top-10 Precision, 0 Beauty/Fashion in Auto Top-20, Synonym Overlap OK, Clean Vocab 20 Categories, Session-Stable MMR)`,
    );
  } finally {
    await db.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

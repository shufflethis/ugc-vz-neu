import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { POST } from '../app/api/search/route';
import { getDatabase } from '../app/lib/database';
import {
  buildCreatorSearchDocument,
  setEmbeddingProviderForTests,
  upsertCreatorSearchIndex,
} from '../app/lib/search-index';
import { setRerankerForTests, type RerankCandidatePayload } from '../app/lib/search-rerank';

// Deterministic semantic concept vector generator for tests:
// Dimension 0: automotive/mobility, Dimension 1: beauty/skincare, Dimension 2: coffee/food, Dimension 3: diy/craft
function mockConceptVector(text: string): number[] {
  const lower = text.toLowerCase();
  const auto = /(auto|kfz|fahrzeug|motorsport|werkstatt|schrauber|rallye|zylinder|motoren|cabrio|tüv|lack)/.test(lower) ? 1 : 0;
  const beauty = /(beauty|skincare|kosmetik|serum|makeup|haircare|mascara)/.test(lower) ? 1 : 0;
  const coffee = /(kaffee|espresso|barista|siebträger|rösterei)/.test(lower) ? 1 : 0;
  const diy = /(werkzeug|holz|renovier|heimwerk|garten)/.test(lower) ? 1 : 0;
  return [auto + 0.01, beauty + 0.01, coffee + 0.01, diy + 0.01];
}

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

async function main() {
  process.env.DATABASE_URL = 'postgres://test:test@hybrid.invalid/test';
  delete process.env.OPENROUTER_API_KEY;

  const db = new PGlite();
  const client = getDatabase();
  Object.defineProperty(client, 'query', {
    value: async (sql: string, params: unknown[] = []) => (await db.query(sql, params)).rows,
  });

  try {
    // Verify migration 020 is strictly idempotent (run twice!)
    for (const m of [
      '001_creator_platform',
      '007_social_avatars',
      '010_contact_reachable',
      '012_search_log',
      '015_casting_portfolio',
      '016_avatar_casting_review',
      '020_hybrid_search_embeddings',
      '020_hybrid_search_embeddings',
    ]) {
      await execMigration(db, m);
    }

    // Verify search document strips accidentally pasted PII (email/phone)
    const sanitizedDoc = buildCreatorSearchDocument({
      displayName: 'Max',
      topics: 'Motorsport, Kontakt max.secret@example.com oder +49 170 12345678',
    });
    assert.equal(sanitizedDoc.includes('max.secret@example.com'), false, 'Email must be scrubbed from search document');
    assert.equal(sanitizedDoc.includes('12345678'), false, 'Phone must be scrubbed from search document');

    await db.exec(`
      INSERT INTO creator_profiles (
        id, public_id, display_name, legal_name, gender, birth_year, city,
        topics, industries, preferred_content, rate_text, reach_text, total_reach, status
      ) VALUES
        (gen_random_uuid(), 'UGC-HYBRID0001', 'Benni Lack', 'Benjamin Geheimname', 'Männlich', 1992, 'Stuttgart',
         'Rallye, Motoren, Lackpolitur, TÜV-Checks', 'Technik', 'Unboxing, Produktdemo', '250 €', 'TikTok: 15k', 15000, 'active'),
        (gen_random_uuid(), 'UGC-HYBRID0002', 'Carina Skincare', 'Carina Privat', 'Weiblich', 1997, 'Berlin',
         'Beauty, Skincare, Haircare, Mascara', 'Kosmetik', 'Reels, GRWM', '220 €', 'Instagram: 500k', 500000, 'active'),
        (gen_random_uuid(), 'UGC-HYBRID0003', 'Timo Holz', 'Timo Privat', 'Männlich', 1989, 'Köln',
         'Heimwerken, Werkzeug, Renovieren', 'Handwerk', 'Tutorial', '280 €', 'YouTube: 30k', 30000, 'active');

      INSERT INTO creator_private_contacts (creator_id, email, phone, project_notifications_enabled)
      SELECT id, lower(public_id) || '@private.secret.test', '+49 151 99998888', true FROM creator_profiles;
    `);

    setEmbeddingProviderForTests(async (texts) => texts.map(mockConceptVector));

    const creators = await db.query<{ id: string; public_id: string }>('SELECT id, public_id FROM creator_profiles');
    for (const c of creators.rows) {
      const res = await upsertCreatorSearchIndex(client, c.id);
      assert.equal(res.updated, true);
      assert.equal(res.embedded, true);
    }

    // Re-running without profile changes should NOT re-embed (hash deduplication)
    let embedCalls = 0;
    setEmbeddingProviderForTests(async (texts) => {
      embedCalls += 1;
      return texts.map(mockConceptVector);
    });
    const repeat = await upsertCreatorSearchIndex(client, creators.rows[0].id);
    assert.equal(repeat.embedded, false, 'Unchanged document hash must skip embedding');
    assert.equal(embedCalls, 0);

    async function search(query: string) {
      const res = await POST(new Request('https://example.test/api/search', {
        method: 'POST',
        body: JSON.stringify({ query }),
      }));
      assert.equal(res.status, 200, await res.clone().text());
      return res.json();
    }

    // TEST 1: Semantic retrieval WITHOUT exact keyword overlap!
    // Benni has "Rallye, Motoren, Lackpolitur, TÜV-Checks" (none of the exact automotive TOPIC_RULES words),
    // yet vector similarity promotes him cleanly for "Auto Creator"!
    setRerankerForTests(null);
    const semanticOnly = await search('Ich suche einen Auto Creator');
    assert.equal(semanticOnly.pool.hybridUsed, true);
    assert.deepEqual(
      semanticOnly.creators.map((c: any) => c.id),
      ['UGC-HYBRID0001'],
      'Semantic vector search must find Benni Lack for "Auto Creator" and exclude Carina Skincare',
    );
    assert.equal(semanticOnly.creators.some((c: any) => c.id === 'UGC-HYBRID0002'), false);

    // TEST 2: Grounded LLM Reranker verifies:
    // - Zero PII in candidate payloads sent to LLM
    // - "reject" drops candidates completely, "exact" -> creators, "related" -> alternatives, matchReason attached
    let seenPayloads: RerankCandidatePayload[] = [];
    setRerankerForTests(async ({ candidates }) => {
      seenPayloads = candidates;
      return candidates.map((c) => {
        if (c.id === 'UGC-HYBRID0001') {
          return { id: c.id, fit: 'exact', score: 94, reason: 'Zeigt Rallye, Motoren und Lackpolitur im Profil.' };
        }
        if (c.id === 'UGC-HYBRID0003') {
          return { id: c.id, fit: 'related', score: 52, reason: 'Handwerk- und Werkzeug-Fokus im verwandten Umfeld.' };
        }
        return { id: c.id, fit: 'reject', score: 5, reason: 'Kein Bezug zu Autos.' };
      });
    });

    const reranked = await search('Ich suche einen Auto Creator');
    assert.equal(reranked.pool.reranked, true);
    assert.equal(reranked.creators.length, 1);
    assert.equal(reranked.creators[0].id, 'UGC-HYBRID0001');
    assert.equal(reranked.creators[0].matchReason, 'Zeigt Rallye, Motoren und Lackpolitur im Profil.');
    assert.equal(reranked.alternatives.some((c: any) => c.id === 'UGC-HYBRID0003'), true);
    assert.equal(reranked.creators.some((c: any) => c.id === 'UGC-HYBRID0002'), false);
    assert.equal(reranked.alternatives.some((c: any) => c.id === 'UGC-HYBRID0002'), false);

    // Verify zero PII leaked into LLM payloads
    const serializedPayloads = JSON.stringify(seenPayloads);
    assert.equal(serializedPayloads.includes('private.secret.test'), false, 'No email allowed in reranker payload');
    assert.equal(serializedPayloads.includes('99998888'), false, 'No phone allowed in reranker payload');
    assert.equal(serializedPayloads.includes('Geheimname'), false, 'No legal_name allowed in reranker payload');

    // TEST 3: Reranker timeout/error gracefully falls back to deterministic + hybrid RRF
    setRerankerForTests(async () => {
      throw new Error('Simulated OpenRouter timeout');
    });
    const fallback = await search('Ich suche einen Auto Creator');
    assert.equal(fallback.pool.reranked, false);
    assert.deepEqual(fallback.creators.map((c: any) => c.id), ['UGC-HYBRID0001']);

    console.log('OK: Phase 2 hybrid full-text + vector search, hash deduplication, grounded LLM reranking, and PII safety verified.');
  } finally {
    setEmbeddingProviderForTests(null);
    setRerankerForTests(null);
    await db.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

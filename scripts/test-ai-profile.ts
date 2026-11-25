import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { NextRequest } from 'next/server';
import { getDatabase } from '../app/lib/database';
import { CREATOR_SESSION_COOKIE, signSession } from '../app/lib/creator-session';
import {
  AiProfileDraftSchema,
  isSafeExternalUrl,
  setSocialAnalyzerForTests,
  setVoiceRefinerForTests,
} from '../app/lib/creator-social-analyzer';
import { setEmbeddingProviderForTests } from '../app/lib/search-index';
import { setRerankerForTests } from '../app/lib/search-rerank';
import { GET as getAiProfile } from '../app/api/creator/ai-profile/route';
import { POST as analyzeAiProfile } from '../app/api/creator/ai-profile/analyze/route';
import { POST as voiceRefine } from '../app/api/creator/ai-profile/voice/route';
import { POST as approveAiProfile } from '../app/api/creator/ai-profile/approve/route';
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

function runSecurityAndSchemaUnitChecks() {
  // 1. SSRF protection
  assert.equal(isSafeExternalUrl('https://www.instagram.com/marco_kfz/')?.hostname, 'www.instagram.com');
  assert.equal(isSafeExternalUrl('https://www.tiktok.com/@marco_kfz')?.hostname, 'www.tiktok.com');

  assert.equal(isSafeExternalUrl('http://instagram.com/marco'), null, 'Non-HTTPS must be blocked');
  assert.equal(isSafeExternalUrl('file:///etc/passwd'), null, 'file:// must be blocked');
  assert.equal(isSafeExternalUrl('https://localhost/secret'), null, 'localhost must be blocked');
  assert.equal(isSafeExternalUrl('https://127.0.0.1/admin'), null, 'loopback IPv4 must be blocked');
  assert.equal(isSafeExternalUrl('https://169.254.169.254/latest/meta-data/'), null, 'cloud metadata IP must be blocked');
  assert.equal(isSafeExternalUrl('https://10.0.0.5/internal'), null, 'RFC1918 10/8 must be blocked');
  assert.equal(isSafeExternalUrl('https://192.168.1.10/'), null, 'RFC1918 192.168/16 must be blocked');
  assert.equal(isSafeExternalUrl('https://172.16.0.1/'), null, 'RFC1918 172.16/12 must be blocked');
  assert.equal(isSafeExternalUrl('https://[::1]/'), null, 'IPv6 loopback must be blocked');
  assert.equal(isSafeExternalUrl('https://user:pass@instagram.com/a'), null, 'URL credentials must be blocked');
  assert.equal(isSafeExternalUrl('https://example.com:8443/a'), null, 'Non-443 port must be blocked');

  // 2. Strict Zod schema rejects malformed / too-short LLM responses
  assert.equal(AiProfileDraftSchema.safeParse({ draft_summary: 'Kurz' }).success, false);
  assert.equal(AiProfileDraftSchema.safeParse({}).success, false);
  assert.equal(
    AiProfileDraftSchema.safeParse({
      draft_summary: 'Authentischer UGC-Creator mit Fokus auf Fahrzeugpflege, Werkzeug-Tests und Werkstatt-Content.',
      inferred_niches: ['Fahrzeugpflege', 'Werkstatt'],
      visual_signals: [{ signal: 'Garage sichtbar', category: 'automotive', evidence: 'Instagram-Beiträge' }],
    }).success,
    true,
  );
}

async function main() {
  runSecurityAndSchemaUnitChecks();

  process.env.DATABASE_URL = 'postgres://test:test@aiprofile.invalid/test';
  process.env.CREATOR_SESSION_SECRET = 'test-secret-for-ai-profile-e2e-verification-0123456789';
  delete process.env.OPENROUTER_API_KEY;

  const db = new PGlite();
  const client = getDatabase();
  Object.defineProperty(client, 'query', {
    value: async (sql: string, params: unknown[] = []) => (await db.query(sql, params)).rows,
  });

  try {
    for (const m of [
      '001_creator_platform',
      '006_creator_profile_edits',
      '007_social_avatars',
      '010_contact_reachable',
      '012_search_log',
      '015_casting_portfolio',
      '016_avatar_casting_review',
      '020_hybrid_search_embeddings',
      '021_creator_ai_profiles',
      '021_creator_ai_profiles', // idempotency check
    ]) {
      await execMigration(db, m);
    }

    await db.exec(`
      INSERT INTO creator_profiles (
        id, public_id, display_name, gender, birth_year, city,
        topics, industries, preferred_content, rate_text, reach_text, total_reach, status
      ) VALUES
        (gen_random_uuid(), 'UGC-AIE2E00001', 'Marco', 'Männlich', 1991, 'München',
         'Lifestyle, Alltag', 'Allgemein', 'Reels, Produktdemo', '220 €', 'TikTok: 12k', 12000, 'active'),
        (gen_random_uuid(), 'UGC-BEAUTY9999', 'Carina', 'Weiblich', 1998, 'Berlin',
         'Beauty, Skincare, Haircare, Selfcare', 'Kosmetik', 'Reels, Unboxing', '250 €', 'Instagram: 600k', 600000, 'active');

      INSERT INTO creator_private_contacts (creator_id, email, project_notifications_enabled)
      SELECT id, lower(public_id) || '@example.test', true FROM creator_profiles;

      INSERT INTO creator_social_accounts (creator_id, platform, url)
      SELECT id, 'tiktok', 'https://www.tiktok.com/@' || lower(public_id) FROM creator_profiles;
    `);

    const { rows: [marco] } = await db.query<{ id: string }>(
      "SELECT id FROM creator_profiles WHERE public_id = 'UGC-AIE2E00001'",
    );
    const cookieHeader = `${CREATOR_SESSION_COOKIE}=${signSession(marco.id)}`;

    // 1. Auth & Origin protection checks -> 401
    const unauthGet = await getAiProfile(new NextRequest('https://ugc-vz.de/api/creator/ai-profile'));
    assert.equal(unauthGet.status, 401);

    const unauthAnalyze = await analyzeAiProfile(
      new NextRequest('https://ugc-vz.de/api/creator/ai-profile/analyze', {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de' },
      }),
    );
    assert.equal(unauthAnalyze.status, 401);

    const badOriginApprove = await approveAiProfile(
      new NextRequest('https://ugc-vz.de/api/creator/ai-profile/approve', {
        method: 'POST',
        headers: { origin: 'https://evil.example', cookie: cookieHeader },
        body: JSON.stringify({ summary: 'Eine hinreichend lange Zusammenfassung über Autos.', niches: ['Auto'] }),
      }),
    );
    assert.equal(badOriginApprove.status, 401);

    // 2. Before AI profile approval: searching "Auto Creator für Fahrzeugpflege" returns 0 matches (Marco only has "Lifestyle, Alltag")
    setEmbeddingProviderForTests(null);
    setRerankerForTests(null);
    const searchBeforeRes = await searchCreators(
      new Request('https://ugc-vz.de/api/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'Auto Creator für Fahrzeugpflege' }),
      }),
    );
    const searchBefore = await searchBeforeRes.json();
    assert.equal(searchBefore.creators.length, 0, 'Before AI summary approval, Marco should not yet match automotive');

    // 3. Creator triggers AI analysis -> creates draft_ready (NOT auto-approved!)
    setSocialAnalyzerForTests(async () => ({
      draft_summary:
        'Authentischer Creator aus München. Auf seinen verlinkten Kanälen zeigt er praxisnahe Videos rund um Autopflege, Werkstatt-Projekte und DIY-Werkzeug.',
      inferred_niches: ['Autopflege', 'Werkstatt', 'DIY-Werkzeug'],
      visual_signals: [
        { signal: 'Garage & Fahrzeug sichtbar', category: 'automotive', evidence: 'TikTok-Thumbnails zeigen Fahrzeugpflege' },
      ],
      content_style: {
        formats: ['Produktdemo', 'Hands-on-Test'],
        tone: 'sachlich, praxisnah',
        setting: 'Garage & Outdoor',
        productionQuality: 'Tageslicht, klare Nahaufnahmen',
      },
    }));

    const analyzeRes = await analyzeAiProfile(
      new NextRequest('https://ugc-vz.de/api/creator/ai-profile/analyze', {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', cookie: cookieHeader },
      }),
    );
    assert.equal(analyzeRes.status, 200, await analyzeRes.clone().text());
    const analyzeJson = await analyzeRes.json();
    assert.equal(analyzeJson.aiProfile.status, 'draft_ready');
    assert.equal(analyzeJson.aiProfile.visualSignals.length, 1);

    // Human-in-the-loop invariant: unapproved draft_ready MUST NOT leak into live search yet!
    const searchWhileDraftRes = await searchCreators(
      new Request('https://ugc-vz.de/api/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'Auto Creator für Fahrzeugpflege' }),
      }),
    );
    const searchWhileDraft = await searchWhileDraftRes.json();
    assert.equal(searchWhileDraft.creators.length, 0, 'Unapproved draft must not enter search before creator approval');

    // 4. Oversized audio upload (> 5 MB) is rejected with 413
    const hugeForm = new FormData();
    hugeForm.append('audio', new Blob([new Uint8Array(5 * 1024 * 1024 + 100)], { type: 'audio/mp4' }), 'big.m4a');
    const hugeRes = await voiceRefine(
      new NextRequest('https://ugc-vz.de/api/creator/ai-profile/voice', {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', cookie: cookieHeader },
        body: hugeForm,
      }),
    );
    assert.equal(hugeRes.status, 413);

    // 5. Creator records iOS-Safari-compatible audio/mp4 voice note to add "BMW E36 Restaurierung & Kfz-Pflege"
    setVoiceRefinerForTests(async ({ audioFormat, audioBase64 }) => {
      assert.equal(audioFormat, 'mp4');
      assert.ok(audioBase64 && audioBase64.length > 0);
      return {
        transcript: 'Ergänze bitte noch, dass ich einen alten BMW E36 restauriere und Kfz-Pflege sowie Fahrzeugpflege-Tests mache.',
        updatedSummary:
          'Authentischer Auto-Creator aus München mit Fokus auf BMW E36 Restaurierung, Fahrzeugpflege, Kfz-Pflege und praxisnahe Werkstatt- und Werkzeug-Tests.',
        updatedNiches: ['BMW E36 Restaurierung', 'Fahrzeugpflege', 'Kfz-Pflege', 'Werkstatt'],
        changesSummary: 'BMW E36 Restaurierung und Fahrzeugpflege-Schwerpunkt ergänzt.',
      };
    });

    const voiceForm = new FormData();
    voiceForm.append('audio', new Blob([Buffer.from('fake-mp4-audio-bytes')], { type: 'audio/mp4' }), 'note.m4a');
    voiceForm.append('currentSummary', analyzeJson.aiProfile.draftSummary);
    const voiceRes = await voiceRefine(
      new NextRequest('https://ugc-vz.de/api/creator/ai-profile/voice', {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', cookie: cookieHeader },
        body: voiceForm,
      }),
    );
    assert.equal(voiceRes.status, 200, await voiceRes.clone().text());
    const voiceJson = await voiceRes.json();
    assert.match(voiceJson.transcript, /BMW E36/);
    assert.match(voiceJson.updatedSummary, /Fahrzeugpflege/);

    // 6. Creator approves the summary -> persists approved_summary, logs edit, refreshes creator_search_index immediately!
    const approveRes = await approveAiProfile(
      new NextRequest('https://ugc-vz.de/api/creator/ai-profile/approve', {
        method: 'POST',
        headers: { origin: 'https://ugc-vz.de', cookie: cookieHeader, 'content-type': 'application/json' },
        body: JSON.stringify({
          summary: voiceJson.updatedSummary,
          niches: voiceJson.updatedNiches,
        }),
      }),
    );
    assert.equal(approveRes.status, 200, await approveRes.clone().text());
    const approveJson = await approveRes.json();
    assert.equal(approveJson.aiProfile.status, 'approved');
    assert.equal(approveJson.searchIndexed, true);

    // Verify edit was audited in creator_profile_edits
    const edits = await db.query<{ field_name: string }>(
      "SELECT field_name FROM creator_profile_edits WHERE creator_id = $1 AND field_name = 'ai_profile_summary'",
      [marco.id],
    );
    assert.equal(edits.rows.length, 1);

    // 7. END-TO-END PROOF: Search immediately finds Marco at #1 for BOTH "Auto Creator für Fahrzeugpflege" AND "BMW E36 Restaurierung", with ZERO Beauty girls!
    const searchAfterAutoRes = await searchCreators(
      new Request('https://ugc-vz.de/api/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'Auto Creator für Fahrzeugpflege' }),
      }),
    );
    const searchAfterAuto = await searchAfterAutoRes.json();
    assert.deepEqual(
      searchAfterAuto.creators.map((c: any) => c.id),
      ['UGC-AIE2E00001'],
      'Approved AI summary must make Marco #1 for "Auto Creator für Fahrzeugpflege" with 0 Beauty profiles',
    );

    const searchAfterBmwRes = await searchCreators(
      new Request('https://ugc-vz.de/api/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'Creator für BMW E36 Restaurierung' }),
      }),
    );
    const searchAfterBmw = await searchAfterBmwRes.json();
    assert.deepEqual(
      searchAfterBmw.creators.map((c: any) => c.id),
      ['UGC-AIE2E00001'],
      'Voice-added detail ("BMW E36 Restaurierung") must be immediately searchable after approval',
    );

    // GET /api/creator/ai-profile reflects approved state
    const getRes = await getAiProfile(
      new NextRequest('https://ugc-vz.de/api/creator/ai-profile', {
        headers: { cookie: cookieHeader },
      }),
    );
    assert.equal(getRes.status, 200);
    const getJson = await getRes.json();
    assert.equal(getJson.aiProfile.status, 'approved');

    console.log('OK: Phase 3 AI social analyzer, SSRF guard, auth/size limits, iOS voice refinement, approval & live search E2E verified.');
  } finally {
    setSocialAnalyzerForTests(null);
    setVoiceRefinerForTests(null);
    setEmbeddingProviderForTests(null);
    setRerankerForTests(null);
    await db.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

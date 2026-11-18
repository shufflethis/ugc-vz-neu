import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { NextRequest } from 'next/server';
import { POST as editProfile } from '../app/api/creator/profile/route';
import { signSession, CREATOR_SESSION_COOKIE } from '../app/lib/creator-session';
import { POST } from '../app/api/search/route';
import { getDatabase } from '../app/lib/database';
import { castingFilters, directorySearchWords } from '../app/lib/casting';
import { isTeamAdminPath } from '../app/lib/collaborations/model';

async function main() {
  process.env.DATABASE_URL = 'postgres://test:test@casting.invalid/test';
  delete process.env.OPENROUTER_API_KEY;
  process.env.CREATOR_SESSION_SECRET = 'local-test-secret-for-casting-profile-edits';
  const db = new PGlite();
  const client = getDatabase();
  // Exercise the route and its actual SQL locally, including reads after a tag change.
  Object.defineProperty(client, 'query', {
    value: async (sql: string, params: unknown[] = []) => (await db.query(sql, params)).rows,
  });
  try {
    for (const migration of ['001_creator_platform', '006_creator_profile_edits', '007_social_avatars', '010_contact_reachable', '012_search_log', '015_casting_portfolio']) {
      const sql = await readFile('db/migrations/' + migration + '.sql', 'utf8');
      await db.exec(sql.replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;', ''));
    }
    await db.exec(`
      INSERT INTO creator_profiles(id, public_id, display_name, gender, topics, status)
      SELECT gen_random_uuid(), name, name, gender, topics, status FROM (VALUES
        ('Alex', 'Männlich', 'Sport, Skateboarding', 'active'),
        ('Kai', 'Male', 'Fitness', 'active'),
        ('Ria', 'Female', 'Ich fahre Skateboard.', 'active'),
        ('Kim', null, 'Skateboard', 'active'),
        ('Archiv', 'Male', 'Skateboarding', 'archived'),
        ('Andi', 'Männlich', 'Kein Skateboard', 'active')
      ) AS creators(name, gender, topics, status);
      INSERT INTO creator_portfolio_items(creator_id, url)
      SELECT id, 'https://example.org/work' FROM creator_profiles WHERE public_id='Kai';
    `);
    async function search(query: string, removedFilters: string[] = []) {
      const res = await POST(new Request('https://example.test/api/search', {
        method: 'POST', body: JSON.stringify({ query, removedFilters }),
      }));
      assert.equal(res.status, 200);
      return res.json();
    }
    for (const query of ['männlicher Skater', 'einen männlichen Skater', 'maennliche Skateboarder']) {
      const result = await search(query);
      assert.deepEqual(result.analysis.castingFilters, ['male', 'skateboard']);
      assert.deepEqual(result.creators.map((c: { name: string }) => c.name), ['Alex']);
      assert.match(result.creators[0].evidence[0].label, /Profilangabe.*Skateboarding/);
    }
    assert.deepEqual(directorySearchWords('Ich suche nach einem männlichen Skater in Berlin'), ['berlin']);
    assert.deepEqual(castingFilters('CapCut und Skateboardlook'), []);
    assert.equal((await search('männlicher Skater', ['male'])).totalCount, 3);
    assert.equal((await search('männlicher Skater', ['skateboard'])).totalCount, 3);
    assert.equal((await search('Cap-Träger')).totalCount, 0);
    await db.exec("UPDATE creator_portfolio_items SET cap_image_url='https://example.org/cap.jpg', skateboard_verified=true");
    const confirmed = await search('männlichen Skater mit Cap');
    assert.equal(confirmed.totalCount, 1);
    assert.equal(confirmed.creators[0].name, 'Kai');
    assert.equal(confirmed.creators[0].evidence[1].image, 'https://example.org/cap.jpg');
    assert.equal(confirmed.creators[0].evidence[0].url, 'https://example.org/work');
    assert.equal((await search('weibliche Cap-Träger')).totalCount, 0);
    await db.exec("UPDATE creator_portfolio_items SET cap_image_url=null, skateboard_verified=false, title='Mein Skateboard-Clip'");
    assert.equal((await search('Cap-Träger')).totalCount, 0);
    assert.equal((await search('männliche Skater')).totalCount, 2);
    const { rows: [kai] } = await db.query<{ id: string }>("SELECT id FROM creator_profiles WHERE public_id='Kai'");
    async function changePortfolio(links: string[]) {
      const response = await editProfile(new NextRequest('https://example.test/api/creator/profile', {
        method: 'POST',
        headers: { origin: 'https://example.test', cookie: CREATOR_SESSION_COOKIE + '=' + signSession(kai.id) },
        body: JSON.stringify({
          name: 'Kai', gender: 'Männlich', topics: 'Lifestyle', preferredContent: 'Reels', rateText: '250 €',
          socialLinks: ['https://example.test/kai'], portfolioLinks: links,
        }),
      }));
      assert.equal(response.status, 200, await response.text());
    }
    await db.exec("UPDATE creator_portfolio_items SET cap_image_url='https://example.org/cap.jpg'");
    await changePortfolio(['https://example.org/work', 'https://example.org/new']);
    assert.equal((await search('Cap-Träger')).totalCount, 1, 'An unrelated profile edit retains the tag');
    await changePortfolio(['https://example.org/new']);
    assert.equal((await search('Cap-Träger')).totalCount, 0, 'Removing the sample removes its evidence');
    assert.equal(isTeamAdminPath('/admin/creators'), true);
    assert.equal(isTeamAdminPath('/admin/creators-extra'), false);
    console.log('OK: Casting-Filter, Sichtbarkeit, Belege, Profilbestand und aktuelle Portfolio-Merkmale');
  } finally {
    await db.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });

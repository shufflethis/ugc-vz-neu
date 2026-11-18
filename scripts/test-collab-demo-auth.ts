import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { authorizeCollabDemo, authorizeSiteDemo, directoryRole } from '../app/lib/collab-demo-auth';
import { isCollabDemoPath, isProtectedDemoPath, isSiteDemoPath } from '../app/lib/collab-demo-path';

async function main() {
  const password = 'test-only-32-character-password-123';
  const sitePassword = 'separate-32-char-site-demo-pw-456';
  const auth = (username: string, pw: string) => `Basic ${Buffer.from(`${username}:${pw}`).toString('base64')}`;
  assert.equal(await authorizeCollabDemo(auth('ugc-vz', password), password), true);
  assert.equal(await authorizeSiteDemo(auth('ugc-vz', password), undefined, password), true);
  assert.equal(await authorizeSiteDemo(auth('ugc-vz', sitePassword), sitePassword, password), true);
  assert.equal(await authorizeSiteDemo(auth('ugc-vz', password), '', ''), false);
  for (const header of [null, '', 'Bearer abc', 'Basic %%%', 'Basic ', auth('other', password), auth('ugc-vz', 'wrong'), auth('ugc-vz', password + 'x'), 'Basic ' + 'a'.repeat(3000)]) {
    assert.equal(await authorizeCollabDemo(header, password), false, `Must deny ${header?.slice(0, 20)}`);
    assert.equal(await authorizeSiteDemo(header, sitePassword, password), false, `Must deny ${header?.slice(0, 20)}`);
  }
  assert.equal(await authorizeCollabDemo(auth('ugc-vz', password), ''), false, 'Missing configuration must deny access');
  assert.equal(await authorizeCollabDemo(auth('ugc-vz', 'short'), 'short'), false);
  const reader = auth('reader', sitePassword);
  process.env.COLLAB_ADMIN_PASSWORD = password;
  process.env.CREATOR_DIRECTORY_READER_HASH = createHash('sha256').update('reader:' + sitePassword).digest('hex');
  assert.equal(await directoryRole(reader), 'reader');
  assert.equal(await directoryRole(auth('ugc-vz', password)), 'admin');
  assert.equal(await directoryRole(auth('other', sitePassword)), null);
  assert.equal(await directoryRole(null), null);
  assert.equal(await authorizeCollabDemo(reader, password), false);
  delete process.env.CREATOR_DIRECTORY_READER_HASH;
  assert.equal(await directoryRole(reader), null);
  for (const path of ['/demo/kooperationen', '/demo/kooperationen/', '/demo/kooperationen/fomo/bewerben', '/demo/kooperationen/tracking', '/demo/kooperationen/praesentation']) assert.equal(isCollabDemoPath(path), true);
  for (const path of ['/', '/creator', '/demo/kooperationen-public']) assert.equal(isCollabDemoPath(path), false);
  for (const path of ['/demo', '/demo/', '/demo/konto', '/demo/bounties', '/demo/brands', '/demo/brands/creator-affiliate-programm', '/demo/creator', '/demo/creator/mit-views-geld-verdienen', '/demo/agenturen', '/demo/vergleich', '/demo/strategie', '/demo/kooperationen']) assert.equal(isProtectedDemoPath(path), true);
  for (const path of ['/', '/creator', '/demopage']) assert.equal(isProtectedDemoPath(path), false);
  assert.equal(isSiteDemoPath('/demo'), true);
  assert.equal(isSiteDemoPath('/demo/bounties'), true);
  assert.equal(isSiteDemoPath('/demo/kooperationen'), false);
  console.log('PASS: demo authentication, malformed credentials, fail-closed configuration, route boundary.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });

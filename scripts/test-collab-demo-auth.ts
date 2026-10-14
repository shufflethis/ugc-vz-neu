import assert from 'node:assert/strict';
import { authorizeCollabDemo } from '../app/lib/collab-demo-auth';
import { isCollabDemoPath } from '../app/lib/collab-demo-path';

async function main() {
  const password = 'test-only-32-character-password-123';
  const auth = (username: string, pw: string) => `Basic ${Buffer.from(`${username}:${pw}`).toString('base64')}`;
  assert.equal(await authorizeCollabDemo(auth('ugc-vz', password), password), true);
  for (const header of [null, '', 'Bearer abc', 'Basic %%%', 'Basic ', auth('other', password), auth('ugc-vz', 'wrong'), auth('ugc-vz', password + 'x'), 'Basic ' + 'a'.repeat(3000)]) {
    assert.equal(await authorizeCollabDemo(header, password), false, `Must deny ${header?.slice(0, 20)}`);
  }
  assert.equal(await authorizeCollabDemo(auth('ugc-vz', password), ''), false, 'Missing configuration must deny access');
  assert.equal(await authorizeCollabDemo(auth('ugc-vz', 'short'), 'short'), false);
  for (const path of ['/demo/kooperationen', '/demo/kooperationen/', '/demo/kooperationen/fomo/bewerben', '/demo/kooperationen/tracking', '/demo/kooperationen/praesentation']) assert.equal(isCollabDemoPath(path), true);
  for (const path of ['/', '/creator', '/demo/kooperationen-public']) assert.equal(isCollabDemoPath(path), false);
  console.log('PASS: demo authentication, malformed credentials, fail-closed configuration, route boundary.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });

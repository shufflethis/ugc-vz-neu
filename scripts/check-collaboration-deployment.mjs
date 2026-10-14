// Read-only production smoke check. Never searches creators or sends invitations.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from 'dotenv';
const origin='https://ugc-vz.de';
const config=parse(readFileSync('.env.collaborations.local'));
const demo=parse(readFileSync('.env.demo.local'));
const auth=password=>'Basic '+Buffer.from('ugc-vz:'+password).toString('base64');
for(const path of ['/admin/kooperationen','/api/collaborations/admin','/demo/kooperationen/konto','/demo/kooperationen/einladung']){
 const r=await fetch(origin+path);assert.equal(r.status,401,path);assert.match(r.headers.get('cache-control'),/no-store/);
}
assert.equal((await fetch(origin+'/admin/kooperationen',{headers:{authorization:auth(demo.COLLAB_DEMO_PASSWORD)}})).status,401);
const response=await fetch(origin+'/api/collaborations/admin?slug=fomo',{headers:{authorization:auth(config.COLLAB_ADMIN_PASSWORD)}});
assert.equal(response.status,200);
const data=await response.json();
assert.equal(data.campaigns.find(c=>c.slug==='fomo')?.state,'draft');
assert.equal(data.sendEnabled,false);assert.equal(data.rows.length,0);
assert.equal(data.senderConfigured,true);assert.equal(data.providerConfigured,true);assert.equal(data.webhookConfigured,true);
assert.equal((await fetch(origin+'/kooperationen/fomo')).status,404);
assert.equal((await fetch(origin+'/konto/kooperationen')).status,200);
assert.equal((await fetch(origin+'/admin/kooperationen',{headers:{authorization:auth(config.COLLAB_ADMIN_PASSWORD)}})).status,200);
console.log('PASS: production admin protection and separate credentials; database ready; FOMO draft; zero prepared invitations; sending disabled; existing sender/provider/webhook configured; private account available. Read-only checks, no mail.');

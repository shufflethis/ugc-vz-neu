import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {CollabStore} from '../app/lib/collaborations/store';
import {decryptToken} from '../app/lib/collaborations/security';
import {fomoDraft} from '../app/lib/collaborations/fomo-draft';
import {signSession} from '../app/lib/creator-session';
async function main(){
  process.env.COLLAB_TOKEN_SECRET='b'.repeat(64);process.env.CREATOR_SESSION_SECRET='isolated-collaboration-test-session-secret';
  const db=new PGlite();
  for(const file of ['001_creator_platform','002_creator_registration','006_creator_profile_edits','013_collaborations','014_collab_referral']){
    const source=(await readFile(`db/migrations/${file}.sql`,'utf8')).replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;','');await db.exec(source);
  }
  await db.exec(`INSERT INTO creator_profiles(id,public_id,status,display_name,legal_name,topics,gender) VALUES
    ('00000000-0000-0000-0000-000000000001','TEST-ONE','active','Alex Beispiel','Alex Beispiel','Tech','Weiblich'),
    ('00000000-0000-0000-0000-000000000002','TEST-TWO','active','Sam Beispiel','Sam Beispiel','Tech',null);
    INSERT INTO creator_private_contacts(creator_id,email,project_notifications_enabled) VALUES
    ('00000000-0000-0000-0000-000000000001','alex@example.com',true),('00000000-0000-0000-0000-000000000002','sam@example.com',true);
    INSERT INTO creator_social_accounts(creator_id,url,is_primary) VALUES('00000000-0000-0000-0000-000000000001','https://example.com/alex',true);`);
  const store=new CollabStore(async(q,p)=>(await db.query(q,p)).rows as any);
  await store.saveCampaign({slug:'fomo',version:0,state:'live',content:{...fomoDraft,terms:'Ausschließlich fiktive Testbedingungen. Keine echte Zusammenarbeit und keine Zahlungen. Diese Kampagne läuft nur in der isolierten Testdatenbank.'},approvalNote:'Freigabe nur für isolierte Browsertests'});
  const batch='10000000-0000-0000-0000-000000000001',id=await store.prepare('fomo','TEST-ONE','Deine Beispielvideos passen zu unserer Testkampagne.',batch);
  await store.claimSend(id);await store.finishSend(id,'fake-provider-no-mail-sent');
  const [invite]=await store.batch(batch);
  await writeFile('/tmp/ugc-collab-test-fixture.json',JSON.stringify({token:decryptToken(invite.token_encrypted),id:invite.membership_id,creatorSession:signSession('00000000-0000-0000-0000-000000000001'),otherSession:signSession('00000000-0000-0000-0000-000000000002')}),{mode:0o600});
  const execute=async(db:any,q:any)=>{const r=await db.query(q.query,q.params);return {fields:r.fields,rows:r.rows.map((row:any)=>r.fields.map((f:any)=>{const v=row[f.name];if(v===null||v===undefined)return null;if(f.dataTypeID===3802||f.dataTypeID===114)return JSON.stringify(v);if(typeof v==='boolean')return v?'t':'f';if(v instanceof Date)return v.toISOString().replace('T',' ').replace('Z','+00');return String(v);})),rowCount:r.affectedRows??r.rows.length,command:'SELECT'};};
  const server=createServer(async(req,res)=>{if(req.url!=='/sql'){res.writeHead(404);res.end();return;}try{let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw);const result=body.queries?await db.transaction(async tx=>({results:await Promise.all(body.queries.map((q:any)=>execute(tx,q)))})):await execute(db,body);res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result));}catch(e){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({message:e instanceof Error?e.message:'test SQL error'}));}});
  server.listen(3143,'127.0.0.1',()=>console.log('Isolated collaboration SQL test server ready; synthetic profiles only.'));
}
main().catch(e=>{console.error(e);process.exit(1);});

import { readFile } from 'node:fs/promises';
import { getDatabase } from '../app/lib/database';
import { fomoDraft } from '../app/lib/collaborations/fomo-draft';
async function main(){
  const sql=getDatabase();
  const migration=await readFile('db/migrations/013_collaborations.sql','utf8');
  // Only this additive migration; never replay unrelated migrations/imports.
  const statements=migration.split(/^-- statement-breakpoint\s*$/m).map(s=>s.trim()).filter(Boolean);
  await sql.transaction(statements.map(s=>sql.query(s)));
  await sql.query("INSERT INTO collab_campaigns(slug,content,state) VALUES ('fomo',$1::jsonb,'draft') ON CONFLICT(slug) DO NOTHING",[JSON.stringify(fomoDraft)]);
  const [row]=await sql.query("SELECT state,version FROM collab_campaigns WHERE slug='fomo'");
  console.log(JSON.stringify({migration:'013_collaborations',fomoState:row.state,version:row.version,emailsSent:0}));
}
main().catch(()=>{console.error('Collaboration setup failed. No invitations were sent.');process.exit(1);});

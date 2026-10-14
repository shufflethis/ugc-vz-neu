import { readFile } from 'node:fs/promises';
import { getDatabase } from '../app/lib/database';
import { fomoDraft } from '../app/lib/collaborations/fomo-draft';
async function main(){
  const sql=getDatabase();
  // Only these additive migrations; never replay unrelated migrations/imports.
  for(const file of ['013_collaborations','014_collab_referral']) {
    const migration=await readFile(`db/migrations/${file}.sql`,'utf8');
    const statements=migration.split(/^-- statement-breakpoint\s*$/m).map(s=>s.trim()).filter(Boolean);
    await sql.transaction(statements.map(s=>sql.query(s)));
  }
  await sql.query("INSERT INTO collab_campaigns(slug,content,state) VALUES ('fomo',$1::jsonb,'draft') ON CONFLICT(slug) DO NOTHING",[JSON.stringify(fomoDraft)]);
  // Drafts mirror fomo-draft.ts; approved or paused campaigns are never touched here.
  await sql.query("UPDATE collab_campaigns SET content=$1::jsonb,version=version+1,updated_at=now() WHERE slug='fomo' AND state='draft' AND content<>$1::jsonb",[JSON.stringify(fomoDraft)]);
  const [row]=await sql.query("SELECT state,version FROM collab_campaigns WHERE slug='fomo'");
  console.log(JSON.stringify({migrations:['013_collaborations','014_collab_referral'],fomoState:row.state,version:row.version,emailsSent:0}));
}
main().catch(()=>{console.error('Collaboration setup failed. No invitations were sent.');process.exit(1);});

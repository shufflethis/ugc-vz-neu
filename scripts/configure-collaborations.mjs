// One-time production preparation. Keeps sending disabled and preserves existing secrets.
import {readFileSync,writeFileSync,existsSync,chmodSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {parse} from 'dotenv';
const file='.env.collaborations.local';
const previous=existsSync(file)?parse(readFileSync(file)):{};
const values={
  COLLABORATIONS_ENABLED:'true',
  COLLAB_ADMIN_PASSWORD:previous.COLLAB_ADMIN_PASSWORD||randomBytes(32).toString('base64url'),
  COLLAB_TOKEN_SECRET:previous.COLLAB_TOKEN_SECRET||randomBytes(32).toString('hex'),
  COLLAB_SEND_ENABLED:'false',
};
// Reuse RESEND_FROM at runtime. Vercel exports sensitive values as [SENSITIVE];
// never copy that placeholder into another production variable.
writeFileSync(file,Object.entries(values).map(([k,v])=>`${k}=${JSON.stringify(v)}`).join('\n')+'\n',{mode:0o600});chmodSync(file,0o600);
for(const [name,value] of Object.entries(values)){
  execFileSync('vercel',['env','add',name,'production','--sensitive','--force','--yes'],{input:value,stdio:['pipe','pipe','pipe']});
  console.log(`${name}: configured for production`);
}
console.log(JSON.stringify({sendingEnabled:false,secretsFile:file,sender:'existing RESEND_FROM is reused at runtime'}));

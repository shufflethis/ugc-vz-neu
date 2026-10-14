// Development-only preload for browser tests. Never used by the deployed app.
if(process.env.NODE_ENV==='production'||process.env.DATABASE_URL!=='postgresql://test:test@collab-test.invalid/test')throw new Error('Test fetch requires an isolated test database');
const original=globalThis.fetch;
globalThis.fetch=(input,init)=>{
  const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;
  if(['collab-test.invalid','api.invalid'].includes(new URL(url).hostname))return original('http://127.0.0.1:3143/sql',init);
  if(!['localhost','127.0.0.1'].includes(new URL(url).hostname))throw new Error('External server fetch blocked during collaboration tests');
  return original(input,init);
};

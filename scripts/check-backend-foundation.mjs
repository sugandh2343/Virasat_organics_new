import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createServer} from 'vite';
const root='backend/database';
const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
assert.equal(Object.keys(manifest.tables).length,41);
for(const m of manifest.migrations)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(root+'/'+m.file)).digest('hex'),m.sha256);
const schema=fs.readFileSync(root+'/migrations/001_tables.sql','utf8');
assert.doesNotMatch(schema,/product_variants|FLOAT|DOUBLE/i);
assert.equal((schema.match(/CREATE TABLE IF NOT EXISTS /g)||[]).length,41);
assert.equal((schema.match(/ENGINE=InnoDB DEFAULT CHARSET=utf8mb4/g)||[]).length,41);
for(const [table,def]of Object.entries(manifest.tables))for(const ref of def.foreign){
 assert.ok(manifest.tables[ref.target]?.columns[ref.targetColumn],table+' invalid FK');
 assert.ok(ref.name.length<=64);
}
for(const name of schema.matchAll(/CONSTRAINT (\w+)/g))assert.ok(name[1].length<=64,name[1]);
const seed=fs.readFileSync(root+'/seeds/003_core_catalogue.sql','utf8');
assert.equal((seed.match(/INSERT INTO products /g)||[]).length,5);
assert.equal((seed.match(/'coming_soon',NULL,NULL/g)||[]).length,5);
assert.equal((seed.match(/INSERT INTO inventory_balances /g)||[]).length,5);
assert.doesNotMatch(seed,/INSERT INTO (customers|orders|admin_users|payments)/);
const app=fs.readFileSync('backend/bootstrap/app.php','utf8');
assert.equal((app.match(/\$router->add\(/g)||[]).length,2);
assert.match(app,/'\/api\/health'/);assert.match(app,/'\/api\/ready'/);
assert.doesNotMatch(fs.readFileSync('backend/deployment/public_html/api/index.php','utf8'),/password|migration/i);
const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
try{
 const {createApiClient,ApiError}=await vite.ssrLoadModule('/src/services/apiClient.js');
 const calls=[];
 const client=createApiClient({fetchImpl:async(...args)=>{calls.push(args);return new Response(JSON.stringify({data:{status:'ok'},requestId:'test'}),{status:200});}});
 assert.equal((await client('/health')).data.status,'ok');assert.equal(calls[0][1].credentials,'omit');
 await assert.rejects(()=>client('//evil.invalid'),/relative API path/);
 assert.throws(()=>createApiClient({baseUrl:'http://example.invalid/api'}),/HTTPS/);
 const failure=createApiClient({fetchImpl:async()=>new Response(JSON.stringify({error:{code:'VALIDATION_FAILED',message:'Invalid',fields:{name:'Required'}},requestId:'x'}),{status:422})});
 await assert.rejects(()=>failure('/health'),e=>e instanceof ApiError&&e.status===422&&e.fields.name==='Required');
 const invalid=createApiClient({fetchImpl:async()=>new Response('<html>proxy error</html>',{status:502})});
 await assert.rejects(()=>invalid('/health'),e=>e.code==='INVALID_RESPONSE');
 const none=createApiClient({fetchImpl:async()=>new Response(null,{status:204})});assert.equal((await none('/health')).data,null);
 const timeout=createApiClient({timeoutMs:5,fetchImpl:(_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted'))))});
 await assert.rejects(()=>timeout('/health'),e=>e.code==='ABORTED');
 const controller=new AbortController();controller.abort();
 const abort=createApiClient({fetchImpl:async(_url,{signal})=>{if(signal.aborted)throw new Error('aborted');}});
 await assert.rejects(()=>abort('/health',{signal:controller.signal}),e=>e.code==='ABORTED');
 console.log('PASS: 41-table schema manifest/checksums/FKs, five honest seeds, preserved health/ready registration, API client success/error/timeout/abort. MySQL execution and remote HTTP remain BLOCKED.');
}finally{await vite.close();}

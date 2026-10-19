// Opt-in live HTTP/2 checks. No credentials, cookies or CSRF tokens are printed.
import http2 from 'node:http2';
import fs from 'node:fs';
import assert from 'node:assert/strict';
if (!process.argv.includes('--run')) { console.log('SKIP: browser protocol checks require --run'); process.exit(0); }
const client=http2.connect('https://localhost:5190',{ca:fs.readFileSync('C:/ProgramData/VirasatOrganics/localhost-tls/localhost.pem')});
client.on('error',()=>{});
let cookie='';
function call(path,extra={}) {
 return new Promise((resolve,reject)=>{
 const req=client.request({':path':path,':method':'GET',referer:'https://localhost:5190/admin/login','sec-fetch-site':'same-origin','sec-fetch-mode':'cors',...(cookie?{cookie}:{}),...extra});
 let headers,raw='';
 req.on('response',h=>{headers=h;if(h['set-cookie'])cookie=h['set-cookie'].map(c=>c.split(';')[0]).join('; ');});
 req.on('data',c=>raw+=c);req.on('error',reject);req.setTimeout(15000,()=>req.close());
 req.on('end',()=>resolve({headers,body:JSON.parse(raw)}));req.end(extra[':method']==='POST'?'{}':undefined);
 });
}
try {
 const session=await call('/api/admin/session');assert.equal(session.headers[':status'],200);
 const again=await call('/api/admin/session');assert.ok(again.body.data.csrfToken===session.body.data.csrfToken,'Session persistence');
 const products=await call('/api/admin/products');assert.equal(products.headers[':status'],401);
 const foreign=await call('/api/admin/session',{origin:'https://evil.example.invalid'});assert.equal(foreign.headers[':status'],403);
 const otherHost=await call('/api/admin/session',{':authority':'127.0.0.1:5190'});assert.equal(otherHost.headers[':status'],403);
 const missing=await call('/api/admin/login',{':method':'POST','content-type':'application/json',origin:'https://localhost:5190'});assert.equal(missing.headers[':status'],403);
 console.log(JSON.stringify({protocol:'h2',session:200,persisted:true,anonymousProducts:{status:401,body:products.body},foreignOrigin:403,ipAuthority:403,missingCsrf:403,contentType:session.headers['content-type'],secureCookie:session.headers['set-cookie']?.every(c=>/;\s*secure/i.test(c)&&/;\s*httponly/i.test(c)),result:'PASS'},null,2));
} finally { client.close(); }
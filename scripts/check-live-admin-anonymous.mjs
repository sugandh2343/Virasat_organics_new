// Explicit opt-in: live anonymous and synthetic-invalid requests only. Never accepts real credentials.
import https from 'node:https';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
if(!process.argv.includes('--run')){console.log('SKIP: live anonymous checks require --run');process.exit(0);}
const origin='https://localhost:5190';
const ca=fs.readFileSync('C:/ProgramData/VirasatOrganics/localhost-tls/localhost.pem');
let cookies='';
async function call(path,{method='GET',body,csrf,requestOrigin=origin}={}){
 return new Promise((resolve,reject)=>{
  const req=https.request(origin+path,{ca,method,headers:{Origin:requestOrigin,...(cookies?{Cookie:cookies}:{}),...(body?{'Content-Type':'application/json'}:{}),...(csrf?{'X-CSRF-Token':csrf}:{})}},res=>{
   if(res.headers['set-cookie'])cookies=res.headers['set-cookie'].map(c=>c.split(';')[0]).join('; ');
   let raw='';res.on('data',chunk=>raw+=chunk);res.on('end',()=>{
    let payload;try{payload=JSON.parse(raw);}catch{payload={};}
    resolve({status:res.statusCode,payload,secureCookie:(res.headers['set-cookie']||[]).some(c=>/;\s*secure/i.test(c)&&/;\s*httponly/i.test(c)&&/;\s*samesite=lax/i.test(c))});
   });
  });req.setTimeout(20000,()=>req.destroy(new Error('Timeout')));req.on('error',reject);req.end(body?JSON.stringify(body):undefined);
 });
}
const report={};
try{
 const session=await call('/api/admin/session');report.sessionStatus=session.status;
 assert.equal(session.status,200);assert.equal(session.payload.data.admin,null);report.secureCookie=session.secureCookie;assert.ok(session.secureCookie);
 const csrf=session.payload.data.csrfToken;assert.equal(typeof csrf,'string');
 const httpOrigin=await call('/api/admin/session',{requestOrigin:'http://localhost:5190'});report.exactHttpOrigin=httpOrigin.status;assert.equal(httpOrigin.status,200);
 const badCsrf=await call('/api/admin/login',{method:'POST',requestOrigin:'http://localhost:5190',csrf:'synthetic-invalid-csrf',body:{email:'invalid-auth-check@example.invalid',password:crypto.randomBytes(24).toString('hex')}});report.invalidCsrf=badCsrf.status;assert.equal(badCsrf.status,403);
 const denied=await call('/api/admin/products');report.anonymousProtected=denied.status;assert.equal(denied.status,401);
 const noCsrf=await call('/api/admin/login',{method:'POST',body:{email:'invalid-auth-check@example.invalid',password:crypto.randomBytes(24).toString('hex')}});report.csrfRejected=noCsrf.status;assert.equal(noCsrf.status,403);
 const invalid=await call('/api/admin/login',{method:'POST',csrf,body:{email:'invalid-auth-check@example.invalid',password:crypto.randomBytes(24).toString('hex')}});report.invalidLogin=invalid.status;assert.equal(invalid.status,401);
 const products=await call('/api/products');report.productsStatus=products.status;assert.equal(products.status,200);report.productCount=products.payload.data.length;
 const categories=await call('/api/categories');report.categoriesStatus=categories.status;assert.equal(categories.status,200);report.categoryCount=categories.payload.data.length;
 const logout=await call('/api/admin/logout',{method:'POST',csrf,body:{}});report.anonymousLogout=logout.status;assert.equal(logout.status,200);
 const hostile=await call('/api/admin/session',{requestOrigin:'https://untrusted.example.invalid'});report.proxyOriginDenied=hostile.status;assert.equal(hostile.status,403);
 report.result='PASS';
}catch{report.result='FAILED';process.exitCode=1;}
console.log(JSON.stringify(report,null,2)); // Status/count metadata only; never cookies, tokens or credentials.

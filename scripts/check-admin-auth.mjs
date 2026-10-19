import assert from 'node:assert/strict';
import {createServer} from 'vite';
const original=globalThis.fetch;
const vite=await createServer({define:{'import.meta.env.VITE_DATA_MODE':'"api"'},server:{middlewareMode:true,hmr:false},appType:'custom'});
try{
 const api=await vite.ssrLoadModule('/src/services/catalogueApi.js');
 const {adminReturnPath}=await vite.ssrLoadModule('/src/components/admin/AdminApiGate.jsx');
 assert.equal(adminReturnPath('/admin/products'),'/admin/products');
 for(const bad of ['//evil.test','https://evil.test','/admin/login','/admin/../shop','/admin\\evil'])assert.equal(adminReturnPath(bad),'/admin');
 let notifications=0;const off=api.subscribeAdminAuth(()=>notifications++);
 const reply=(data,status=200)=>new Response(JSON.stringify(status===200?{data}:{error:data}),{status});
 let steps=[];
 globalThis.fetch=async(url,options)=>{
  steps.push({url,options});
  if(url.endsWith('/admin/session'))return reply({admin:null,csrfToken:'synthetic-csrf'});
  if(url.endsWith('/admin/login')){
   assert.equal(options.credentials,'include');assert.equal(options.headers['X-CSRF-Token'],'synthetic-csrf');
   return reply({admin:{id:'synthetic-admin'},csrfToken:'synthetic-auth-csrf'});
  }
  if(url.endsWith('/admin/logout')){assert.equal(options.headers['X-CSRF-Token'],'synthetic-auth-csrf');return reply({admin:null,csrfToken:'synthetic-logout'});}
  throw new Error('Unexpected request');
 };
 assert.equal((await api.adminSession()).admin,null);
 assert.equal((await api.adminLogin('synthetic@example.invalid','synthetic-only')).admin.id,'synthetic-admin');
 assert.equal(steps.filter(s=>s.url.endsWith('/admin/session')).length,2);
 await api.adminLogout();assert.equal(notifications,1);
 globalThis.fetch=async()=>reply({code:'SESSION_EXPIRED',message:'Expired'},401);
 await assert.rejects(api.adminCollections(),e=>e.status===401);
 assert.ok(notifications>1);
 globalThis.fetch=async()=>reply({code:'CSRF_FAILED',message:'CSRF rejected'},403);
 await assert.rejects(api.adminSession(),e=>e.status===403);
 globalThis.fetch=async url=>url.endsWith('/admin/session')?reply({admin:null,csrfToken:'synthetic-csrf'}):reply({code:'INVALID_LOGIN',message:'Invalid login'},401);
 await assert.rejects(api.adminLogin('synthetic@example.invalid','synthetic-only'),e=>e.code==='INVALID_LOGIN');
 off();
 console.log('PASS: safe admin redirects, anonymous session, CSRF login handshake, mocked success, logout invalidation, expiry, CSRF rejection and invalid login. No live credentials.');
}finally{globalThis.fetch=original;await vite.close();}

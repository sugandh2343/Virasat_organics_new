import assert from 'node:assert/strict';
import {createServer} from 'vite';
const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
const original=globalThis.fetch;
try{
 const api=await vite.ssrLoadModule('/src/services/catalogueApi.js');
 assert.equal(api.apiMode,false);
 assert.equal(api.paise('12.34'),1234);assert.equal(api.paise('0'),0);assert.equal(api.paise(''),null);
 for(const value of ['1.001','-1','1e3','9007199254740992'])assert.throws(()=>api.paise(value));
 const p={id:'test',name:'Test',size:'500 ml',pricePaise:null,compareAtPricePaise:null,version:1,images:[],videos:[]};
 let calls=0;
 globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify({data:[p],meta:{total:2},requestId:'test'}),{status:200});};
 assert.equal((await api.publicProducts()).length,2);assert.equal(calls,2);
 globalThis.fetch=async()=>new Response(JSON.stringify({error:{code:'NOT_FOUND',message:'Missing'}}),{status:404});
 assert.equal(await api.publicProduct('inactive'),null);
 globalThis.fetch=async()=>new Response(JSON.stringify({error:{code:'SERVICE_UNAVAILABLE',message:'Unavailable'}}),{status:503});
 await assert.rejects(api.publicProducts(),/Unavailable/); // no mock fallback
 globalThis.fetch=async()=>new Response('not json',{status:200});
 await assert.rejects(api.publicProducts(),/invalid response/);
 globalThis.fetch=async()=>{throw new Error('offline');};
 await assert.rejects(api.publicProducts(),/could not be reached/);
 console.log('PASS: explicit mock default, exact paise conversion, pagination, hidden detail and API failures without fallback.');
}finally{globalThis.fetch=original;await vite.close();}

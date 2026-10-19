import assert from 'node:assert/strict';
import {createServer} from 'vite';
const original=globalThis.fetch;
const vite=await createServer({define:{'import.meta.env.VITE_DATA_MODE':'"api"'},server:{middlewareMode:true,hmr:false},appType:'custom'});
try{
 const api=await vite.ssrLoadModule('/src/services/catalogueApi.js');assert.equal(api.apiMode,true);
 const {getProducts}=await vite.ssrLoadModule('/src/services/productService.js');
 let calls=[];
 globalThis.fetch=async(url,options)=>{calls.push([url,options]);return new Response(JSON.stringify({data:[],meta:{total:0}}),{status:200});};
 assert.deepEqual(await getProducts({includeInactive:true}),[]);assert.match(calls[0][0],/\/api\/products\?/);assert.doesNotMatch(calls[0][0],/admin/);
 globalThis.fetch=async()=>new Response(JSON.stringify({error:{message:'Login required',code:'UNAUTHENTICATED'}}),{status:401});
 await assert.rejects(api.adminCollections(),/Login required/);
 const {createDemoOrder}=await vite.ssrLoadModule('/src/services/checkoutService.js');
 assert.throws(()=>createDemoOrder({},{}),/Live checkout is not enabled/);
 console.log('PASS: actual API-mode service branch, public-only reads, admin denial without fallback, live demo-checkout blocked.');
}finally{globalThis.fetch=original;await vite.close();}

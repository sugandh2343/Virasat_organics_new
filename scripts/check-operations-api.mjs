import assert from 'node:assert/strict';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {readFileSync} from 'node:fs';
const vite=await createServer({define:{'import.meta.env.VITE_DATA_MODE':'"api"'},server:{middlewareMode:true,hmr:false},appType:'custom'});
const original=globalThis.fetch,calls=[];
try{
 globalThis.fetch=async(url,options={})=>{calls.push({url,options});return new Response(JSON.stringify({data:url.endsWith('/admin/session')?{admin:{id:'synthetic'},csrfToken:'synthetic-token'}:[],meta:{page:2,pageSize:20,total:21}}));};
 const api=await vite.ssrLoadModule('/src/services/operationsApi.js');
 const list=await api.operationRead('reports/cod',{range:'custom',from:'2026-01-01',to:'2026-01-02',page:2,productId:'product'});assert.equal(list.meta.total,21);assert.match(calls.at(-1).url,/reports\/cod\?range=custom/);assert.match(calls.at(-1).url,/page=2/);
 await api.operationWrite('orders/order/collect-cod',{amountPaise:100,referenceNote:'Synthetic',confirmed:true},4,{key:'synthetic-stable-key'});let call=calls.at(-1);assert.equal(call.options.headers['X-CSRF-Token'],'synthetic-token');assert.equal(call.options.headers['If-Match'],'4');assert.equal(call.options.headers['Idempotency-Key'],'synthetic-stable-key');assert.equal(call.options.credentials,'include');assert.equal(JSON.parse(call.options.body).confirmed,true);
 await api.operationWrite('operations/inventory/product',{threshold:null},2,{method:'PATCH'});assert.equal(calls.at(-1).options.method,'PATCH');
 const {OperationTable,DateFilters,default:Screen}=await vite.ssrLoadModule('/src/pages/admin/LiveOperations.jsx');
 const markup=renderToStaticMarkup(React.createElement(OperationTable,{rows:[{id:'x',name:'<script>bad</script>',totalPaise:100,lowStockThreshold:null}]}));assert.doesNotMatch(markup,/<script>/);assert.match(markup,/&lt;script&gt;/);assert.match(markup,/Not configured/);assert.match(markup,/1.00/);
 const dates=renderToStaticMarkup(React.createElement(DateFilters,{value:{range:'custom'},onChange(){}}));assert.match(dates,/type="date"/);assert.match(dates,/India Standard Time/);
 for(const kind of ['dashboard','reports','customers','inventory','notifications','orders','delivery-operations']){const html=renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(Screen,{kind})));assert.match(html,/Loading business records/);assert.doesNotMatch(html,/Total Demo Orders/);}
 globalThis.fetch=async()=>new Response(JSON.stringify({error:{code:'FORBIDDEN',message:'Permission denied'}}),{status:403});await assert.rejects(api.operationRead('dashboard'),/Permission denied/);
 globalThis.fetch=async()=>new Response(JSON.stringify({error:{code:'SERVICE_UNAVAILABLE',message:'Synthetic unavailable'}}),{status:503});await assert.rejects(api.operationRead('customers'),/Synthetic unavailable/);
 const source=readFileSync('src/pages/admin/LiveOperations.jsx','utf8');assert.match(source,/Record received cash/);assert.match(source,/Export this page CSV/);assert.doesNotMatch(source,/localStorage|dangerouslySetInnerHTML/);
 const controller=readFileSync('backend/app/Controllers/CommerceController.php','utf8');assert.match(controller,/Public ordering awaits Phase 7H acceptance/);assert.match(controller,/LaunchGate::enabled\(\$owner\)/);
 console.log('PASS: operations API-mode requests, pagination, CSRF/version/idempotency, safe rendering, honest loading/error states, no fallback and public COD hold. Synthetic fixtures only.');
}finally{globalThis.fetch=original;await vite.close();}

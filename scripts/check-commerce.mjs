import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
const vite=await createServer({define:{'import.meta.env.VITE_DATA_MODE':'"api"'},server:{middlewareMode:true,hmr:false},appType:'custom'});
const original=globalThis.fetch;const calls=[];
try{
 const api=await vite.ssrLoadModule('/src/services/commerceApi.js');
 globalThis.fetch=async(url,options={})=>{calls.push({url,options});if(url.endsWith('/auth/csrf'))return new Response(JSON.stringify({data:{csrfToken:'synthetic-csrf'}}));if(url.endsWith('/admin/session'))return new Response(JSON.stringify({data:{admin:{id:'synthetic'},csrfToken:'synthetic-admin-csrf'}}));return new Response(JSON.stringify({data:{id:'synthetic-order'},meta:{total:1,page:1,pageSize:20}}));};
 await api.checkoutQuote('owned-address',[{productId:'product',quantity:2,price:1,role:'admin'}]);let call=calls.at(-1);assert.equal(call.options.credentials,'include');assert.equal(call.options.headers['X-CSRF-Token'],'synthetic-csrf');assert.deepEqual(JSON.parse(call.options.body),{addressId:'owned-address',items:[{productId:'product',quantity:2}],paymentMethod:'cod'});
 await api.placeCodOrder('quote','synthetic-idempotency-key','Doorbell');call=calls.at(-1);assert.equal(call.options.headers['Idempotency-Key'],'synthetic-idempotency-key');assert.deepEqual(JSON.parse(call.options.body),{quoteId:'quote',paymentMethod:'cod',deliveryInstructions:'Doorbell'});
 await api.placeCodOrder('quote','synthetic-idempotency-key','Doorbell');assert.equal(calls.at(-1).options.headers['Idempotency-Key'],call.options.headers['Idempotency-Key']);
 await api.cancelCustomerOrder('order',7);assert.equal(calls.at(-1).options.headers['If-Match'],'7');
 await api.updateOrder('order',3,'confirmed','internal');assert.equal(calls.at(-1).options.headers['X-CSRF-Token'],'synthetic-admin-csrf');assert.equal(calls.at(-1).options.headers['If-Match'],'3');
 const page=await api.customerOrders(2,'placed');assert.equal(page.meta.total,1);assert.match(calls.at(-1).url,/page=2&pageSize=20&status=placed/);
 assert.equal(api.paiseText(101),'₹1.01');assert.equal(api.paiseText(null),'Not configured');assert.equal(api.nextStatus.delivered,undefined);
 const {CommerceTotals,LiveOrderDetail}=await vite.ssrLoadModule('/src/pages/LiveCommerce.jsx');const totals=renderToStaticMarkup(React.createElement(CommerceTotals,{value:{subtotalPaise:100,shippingPaise:0,taxPaise:5,totalPaise:105}}));assert.match(totals,/1.05/);assert.doesNotMatch(totals,/Illustrative/);
 const order={id:'one',orderNumber:'SYNTHETIC',status:'placed',createdAt:'2026-01-01T00:00:00Z',paymentStatus:'pending',items:[],statusEvents:[{id:'event',status:'placed',occurredAt:'2026-01-01T00:00:00Z'}],address:{recipient:'Synthetic',coordinatesConfirmed:false,latitude:0,longitude:0},customer:{phoneE164:'synthetic'},internalNotes:[{id:'note',note:'SECRET-INTERNAL-NOTE'}],totalPaise:100};
 const customer=renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(LiveOrderDetail,{order,onChanged:()=>{}})));assert.doesNotMatch(customer,/SECRET-INTERNAL-NOTE|google.com\/maps/);assert.match(customer,/Unpaid/);
 const admin=renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(LiveOrderDetail,{order:{...order,address:{...order.address,coordinatesConfirmed:true}},admin:true,onChanged:()=>{}})));assert.match(admin,/SECRET-INTERNAL-NOTE/);assert.match(admin,/google.com\/maps/);
 globalThis.fetch=async()=>new Response(JSON.stringify({error:{code:'ORDER_ACCEPTANCE_DISABLED',message:'Ordering disabled'}}),{status:503});await assert.rejects(api.placeCodOrder('q','synthetic-key'),/Ordering disabled/);
 const checkout=fs.readFileSync('src/pages/LiveCommerce.jsx','utf8');assert.match(checkout,/orderAcceptanceEnabled===true/);assert.match(checkout,/lock.current/);assert.match(checkout,/navigate\('\/order-success\/'\+encodeURIComponent\(order.id\)/);
 console.log('PASS: API quote allowlist, integer display, CSRF, stable idempotency retries, version headers, pagination, server errors, unpaid COD, internal-note isolation and confirmed-only navigation links. No live orders.');
}finally{globalThis.fetch=original;await vite.close();}

import assert from 'node:assert/strict';
import {createServer} from 'vite';
const vite=await createServer({define:{'import.meta.env.VITE_DATA_MODE':'"api"'},server:{middlewareMode:true,hmr:false},appType:'custom'});
const oldFetch=globalThis.fetch;let calls=[];
try{
 const api=await vite.ssrLoadModule('/src/services/paymentProvider.js');
 assert.deepEqual([...api.checkoutPaymentMethods],['cod']);
 assert.equal(api.validPaymentOrder({}),false);
 await assert.rejects(api.loadRazorpaySdk({enabled:false}),/not enabled/); // no window/document access
 const valid={enabled:true,keyId:'rzp_test_synthetic',providerOrderId:'order_synthetic',amountPaise:100,currency:'INR'};
 assert.equal(api.validPaymentOrder(valid),true);
 for(const change of [{enabled:false},{keyId:''},{providerOrderId:''},{amountPaise:1.1},{currency:'USD'}])assert.equal(api.validPaymentOrder({...valid,...change}),false);
 globalThis.fetch=async(url,options={})=>{calls.push({url,options});return new Response(JSON.stringify({data:url.endsWith('/auth/csrf')?{csrfToken:'synthetic'}:valid}));};
 await api.createRazorpayOrder('owned-order','synthetic-stable-key');let call=calls.at(-1);assert.equal(call.options.credentials,'include');assert.equal(call.options.headers['X-CSRF-Token'],'synthetic');assert.equal(call.options.headers['Idempotency-Key'],'synthetic-stable-key');assert.deepEqual(JSON.parse(call.options.body),{orderId:'owned-order'});
 await api.verifyRazorpayPayment('owned-order',{razorpay_order_id:'order_synthetic',razorpay_payment_id:'pay_synthetic',razorpay_signature:'synthetic-signature',paid:true});assert.deepEqual(JSON.parse(calls.at(-1).options.body),{orderId:'owned-order',razorpayOrderId:'order_synthetic',razorpayPaymentId:'pay_synthetic',signature:'synthetic-signature'});
 globalThis.fetch=async()=>new Response(JSON.stringify({error:{code:'PAYMENT_UNAVAILABLE',message:'Online payments unavailable'}}),{status:503});await assert.rejects(api.openOnlinePayment({orderId:'owned',idempotencyKey:'synthetic-key'}),/unavailable/);
 console.log('PASS: disabled COD-only choices, SDK gating, exact payloads, cookie/CSRF/idempotency transport and fail-closed errors. Synthetic fixtures only.');
}finally{globalThis.fetch=oldFetch;await vite.close();}

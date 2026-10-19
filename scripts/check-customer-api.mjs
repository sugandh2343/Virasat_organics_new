import assert from 'node:assert/strict';
import fs from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {createServer} from 'vite';
const original=globalThis.fetch;
const vite=await createServer({define:{'import.meta.env.VITE_DATA_MODE':'"api"','import.meta.env.VITE_FIREBASE_API_KEY':'""','import.meta.env.VITE_FIREBASE_AUTH_DOMAIN':'""','import.meta.env.VITE_FIREBASE_PROJECT_ID':'""','import.meta.env.VITE_FIREBASE_APP_ID':'""','import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY':'""'},server:{middlewareMode:true,hmr:false},appType:'custom'});
try{
 const firebase=await vite.ssrLoadModule('/src/services/firebasePhone.js');assert.equal(firebase.firebaseConfigured,false);assert.match(firebase.phoneSetupMessage(),/not configured/);assert.equal(firebase.validOtp('123'),false);assert.equal(firebase.validOtp('987654'),true);assert.match(firebase.firebaseMessage({code:'auth/code-expired'}),/expired/);
 const maps=await vite.ssrLoadModule('/src/services/mapsService.js');assert.equal(maps.mapsConfigured,false);await assert.rejects(maps.loadMaps(),/not configured/);assert.equal(maps.coordinates(91,1),false);assert.equal(maps.coordinates(0,0),true);assert.deepEqual(maps.placeAddress(),{});
 const {StorefrontProvider}=await vite.ssrLoadModule('/src/state/StorefrontContext.jsx');const {default:AuthFlow}=await vite.ssrLoadModule('/src/components/auth/AuthFlow.jsx');
 const html=renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(StorefrontProvider,null,React.createElement(AuthFlow))));assert.match(html,/Firebase not configured/);assert.doesNotMatch(html,/Continue as Demo Customer/);assert.match(html,/disabled/);
 const {default:Location}=await vite.ssrLoadModule('/src/components/account/RealLocationSelector.jsx');const location=renderToStaticMarkup(React.createElement(Location,{onSelect(){}}));assert.match(location,/Manual address entry remains available/);assert.doesNotMatch(location,/DEMO suggestion/);
 const api=await vite.ssrLoadModule('/src/services/customerApi.js');let calls=[];let invalidated=0;const off=api.subscribeCustomerExpiry(()=>invalidated++);
 globalThis.fetch=async(url,options)=>{calls.push({url,options});assert.equal(options.credentials,'include');return new Response(JSON.stringify({data:url.endsWith('/csrf')?{csrfToken:'synthetic-csrf'}:url.endsWith('/firebase-session')?{customer:{id:'synthetic'},csrfToken:'rotated-synthetic'}:url.endsWith('/auth/me')?{customer:{id:'synthetic'},csrfToken:'rotated-synthetic'}:url.endsWith('/logout')?{customer:null,csrfToken:'logged-out-synthetic'}:[]}));};
 assert.equal((await api.exchangeFirebase('synthetic-test-only')).id,'synthetic');assert.equal(calls[1].options.headers['X-CSRF-Token'],'synthetic-csrf');assert.equal((await api.restoreCustomer()).id,'synthetic');
 await api.saveAddress({type:'Home'},null,null,'synthetic-address-key');assert.equal(calls.at(-1).options.headers['Idempotency-Key'],'synthetic-address-key');
 await api.patchProfile({name:'Synthetic',email:'',mobile:'untrusted'},1);assert.deepEqual(JSON.parse(calls.at(-1).options.body),{name:'Synthetic',email:''});assert.equal(calls.at(-1).options.headers['If-Match'],'1');
 await api.setWishlist('product',false);assert.equal(calls.at(-1).options.method,'POST');await api.setWishlist('product',true);assert.equal(calls.at(-1).options.method,'DELETE');await api.logoutCustomer();
 globalThis.fetch=async()=>new Response(JSON.stringify({error:{code:'UNAUTHENTICATED',message:'Sign in required'}}),{status:401});await assert.rejects(api.restoreCustomer(),/Sign in required/);assert.equal(invalidated,1);off();
 for(const path of ['src/services/customerApi.js','src/services/firebasePhone.js','src/state/useCustomerAccount.js'])assert.doesNotMatch(fs.readFileSync(path,'utf8'),/localStorage|console\.log|appVerificationDisabledForTesting|connectAuthEmulator/);
 console.log('PASS: API-mode Firebase-unconfigured UI, OTP checks, Maps fallback, CSRF exchange, restoration, logout, profile allowlist, wishlist writes and expiry without mock fallback. Provider network calls not tested.');
}finally{globalThis.fetch=original;await vite.close();}

import assert from 'node:assert/strict';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
const vite=await createServer({define:{'import.meta.env.VITE_DATA_MODE':'"api"'},server:{middlewareMode:true,hmr:false},appType:'custom'});
const original=globalThis.fetch;const calls=[];
try{
 const {homeContent}=await vite.ssrLoadModule('/src/mock-data/home.js');
 const api=await vite.ssrLoadModule('/src/services/cmsApi.js');const content=await vite.ssrLoadModule('/src/services/contentService.js');
 globalThis.fetch=async(url,options={})=>{calls.push({url,options});let data=[];
 if(url.endsWith('/admin/session'))data={csrfToken:'synthetic',admin:{id:'editor'}};
 else if(url.includes('/homepage'))data={...homeContent,version:4,title:'Database title'};
 else if(url.includes('/settings/public'))data={name:'Database business',store:{active:true,acceptOrders:false},seo:{},gstin:{value:null,visible:false},fssai:{value:null,visible:false},socialLinks:[]};
 else if(options.method&&options.method!=='GET')data={id:'saved',version:2};
 return new Response(JSON.stringify({data,...(Array.isArray(data)?{meta:{page:1,pageSize:100,total:0}}:{})}));};
 assert.equal((await content.getHomepageContent()).title,'Database title');assert.equal((await content.getBusinessSettings()).name,'Database business');assert.deepEqual(await content.getBlogPosts(),[]);
 await api.saveHome({...homeContent,version:4,chrome:{previewNotice:'ignored'},publishConfirmed:true});let call=calls.at(-1);let body=JSON.parse(call.options.body);assert.equal(body.publish,true);assert.equal(call.options.headers['If-Match'],'4');assert.equal(call.options.headers['X-CSRF-Token'],'synthetic');assert.equal(call.options.credentials,'include');assert.equal(body.content.chrome,undefined);
 await api.saveRecord('banners',{title:'Reviewed',status:'inactive',sortOrder:'2',desktop:{mediaId:'image',src:'/api/media/image'}},null);call=calls.at(-1);body=JSON.parse(call.options.body);assert.equal(body.sortOrder,2);assert.deepEqual(body.desktop,{mediaId:'image'});const key=call.options.headers['Idempotency-Key'];await api.saveRecord('banners',{title:'Reviewed',status:'inactive',sortOrder:'2',desktop:{mediaId:'image',src:'/api/media/image'}},null);assert.equal(calls.at(-1).options.headers['Idempotency-Key'],key);
 await api.saveSettings({version:3,name:'Genuine',codEnabled:true,delivery:{shipping:999},razorpayKeySecret:'must-not-send',store:{acceptOrders:false},gstin:{value:null,visible:false}});body=JSON.parse(calls.at(-1).options.body);assert.equal(body.codEnabled,undefined);assert.equal(body.delivery,undefined);assert.equal(body.razorpayKeySecret,undefined);
 await api.blogPage({page:2,q:'mustard',category:'one'});assert.match(calls.at(-1).url,/page=2&pageSize=12&q=mustard&category=one/);
 const {StructuredContent}=await vite.ssrLoadModule('/src/components/admin/ContentDocument.jsx');const markup=renderToStaticMarkup(React.createElement(StructuredContent,{blocks:[{id:'one',type:'paragraph',text:'<script>alert(1)</script>'}]}));assert.doesNotMatch(markup,/<script>/);assert.match(markup,/&lt;script&gt;/);
 const {HomeEditor,SettingsEditor}=await vite.ssrLoadModule('/src/pages/admin/CMSWorkspace.jsx');const business={name:'Virasat',version:1,store:{active:true,acceptOrders:false},socialLinks:[],seo:{},gstin:{value:null,visible:false},fssai:{value:null,visible:false}};const data={homepage:{...homeContent,version:1},business,media:[],blog:[],categories:[]};
 const home=renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(HomeEditor,{data})));assert.match(home,/Publish homepage/);assert.doesNotMatch(home,/Reset this section to defaults/);
 const settings=renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(SettingsEditor,{data,kind:'settings'})));assert.match(settings,/Legal company name/);assert.doesNotMatch(settings,/Restore default settings/);
 globalThis.fetch=async()=>new Response(JSON.stringify({error:{code:'SERVICE_UNAVAILABLE',message:'Synthetic server unavailable'}}),{status:503});await assert.rejects(content.getHomepageContent(),/Synthetic server unavailable/);await assert.rejects(content.getBusinessSettings(),/Synthetic server unavailable/);await assert.rejects(api.cmsAdminData('homepage'),/Synthetic server unavailable/);
 globalThis.fetch=async()=>new Response(JSON.stringify({error:{code:'NOT_FOUND',message:'Unpublished'}}),{status:404});assert.equal(await content.getCMSPageBySlug('privacy-policy'),null);assert.equal(await content.getBlogPostBySlug('draft'),null);
 console.log('PASS: API-only CMS reads/writes, publish intent, CSRF/version/idempotency, no delivery/secret writes, pagination, escaped blocks, preserved editors and no mock fallback. Synthetic fixtures only.');
}finally{globalThis.fetch=original;await vite.close();}

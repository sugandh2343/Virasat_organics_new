import assert from 'node:assert/strict';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
const vite=await createServer({define:{'import.meta.env.VITE_DATA_MODE':'"api"'},server:{middlewareMode:true,hmr:false},appType:'custom'});const prior=globalThis.fetch;
try{
 const {default:Picker,validateInlineFile}=await vite.ssrLoadModule('/src/components/admin/InlineMediaPicker.jsx');
 const markup=renderToStaticMarkup(React.createElement(Picker,{label:'Gallery image',media:[],onChange:()=>{}}));assert.match(markup,/type="file"/);assert.match(markup,/Upload gallery image from computer/);assert.match(markup,/image\/webp/);
 validateInlineFile({type:'image/png',size:1024},'image');validateInlineFile({type:'video/mp4',size:1024},'video');
 for(const file of [{type:'image/svg+xml',size:20},{type:'image/png',size:0},{type:'image/png',size:11*1024*1024},{type:'video/mp4',size:20}])assert.throws(()=>validateInlineFile(file,'image'));
 const api=await vite.ssrLoadModule('/src/services/catalogueApi.js');const store=await vite.ssrLoadModule('/src/services/mockStore.js');let refreshed=0;const off=store.subscribeMock(()=>refreshed++);let sent;
 globalThis.fetch=async(url,options={})=>{if(url.endsWith('/admin/session'))return new Response(JSON.stringify({data:{csrfToken:'synthetic',admin:{id:'test'}}}));sent=options;return new Response(JSON.stringify({data:[{id:'uploaded',kind:'image',src:'/api/media/uploaded',version:1}]}));};
 const file=new File(['synthetic'],'test.png',{type:'image/png'});const rows=await api.upload([file],{notify:false});assert.equal(rows[0].id,'uploaded');assert.equal(refreshed,0);assert.ok(sent.body instanceof FormData);assert.equal(sent.body.getAll('files[]').length,1);assert.equal(sent.credentials,'include');assert.equal(sent.headers['X-CSRF-Token'],'synthetic');
 await api.upload([file]);assert.equal(refreshed,1);off();
 globalThis.fetch=async()=>new Response(JSON.stringify({error:{code:'FORBIDDEN',message:'Permission denied'}}),{status:403});await assert.rejects(api.upload([file],{notify:false}),/Permission denied/);
 const {default:Hero}=await vite.ssrLoadModule('/src/components/home/HomeHero.jsx');const {homeContent}=await vite.ssrLoadModule('/src/mock-data/home.js');const content=structuredClone(homeContent);content.showcase.image={src:'/api/media/hero',alt:'Owner supplied hero'};
 const html=renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(Hero,{content})));assert.match(html,/Owner supplied hero/);assert.doesNotMatch(html,/pantry-silhouette/);
 console.log('PASS: inline picker, MIME/size validation, multipart+CSRF+cookie transport, no draft-refresh notification, permission rejection and full hero image rendering. Synthetic only.');
}finally{globalThis.fetch=prior;await vite.close();}

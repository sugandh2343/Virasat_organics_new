import assert from 'node:assert/strict';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
const vite=await createServer({define:{'import.meta.env.VITE_DATA_MODE':'\"api\"'},server:{middlewareMode:true,hmr:false},appType:'custom'});
try{
 const {default:Footer}=await vite.ssrLoadModule('/src/components/Footer.jsx');
 const {BusinessContext}=await vite.ssrLoadModule('/src/state/BusinessContext.jsx');
 const {businessDefaults}=await vite.ssrLoadModule('/src/domain/contentSelectors.js');
 const apiBusiness=businessDefaults({name:'API business',socialLinks:[],gstin:{visible:false},fssai:{visible:false}});
 assert.deepEqual(apiBusiness.socialPlaceholders,[]);
 for(const value of [apiBusiness,businessDefaults({name:'Minimal'}),businessDefaults({name:'Nullable',socialLinks:null,socialPlaceholders:null})]){
 const footer=renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(BusinessContext.Provider,{value},React.createElement(Footer))));
 assert.match(footer,/Social links coming soon/);assert.doesNotMatch(footer,/Instagram link coming soon/);
 }
 const configured=businessDefaults({...apiBusiness,socialLinks:[{label:'Instagram',url:'https://example.com/brand'}]});
 const footer=renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(BusinessContext.Provider,{value:configured},React.createElement(Footer))));
 assert.match(footer,/https:\/\/example.com\/brand/);assert.doesNotMatch(footer,/Social links coming soon/);
console.log('PASS: API footer renders empty, missing, null and configured social lists without mock social placeholders.');
}finally{await vite.close();}

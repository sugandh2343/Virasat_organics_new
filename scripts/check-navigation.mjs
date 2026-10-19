import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
const vite = await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
try {
  const {searchProducts} = await vite.ssrLoadModule('/src/services/searchService.js');
  const {products} = await vite.ssrLoadModule('/src/mock-data/products.js');
  for (const [query,count] of [['ATTA',1],['flour',1],['mustard oils',4],['500ml',2],['1 litre',2],['black 500 ml',1],['sarson',4],['unknown',0],['   ',0]]) assert.equal(searchProducts(query).length,count,query);
  assert.equal(searchProducts('atta',products.map(p=>({...p,status:'inactive'}))).length,0);
  const {getHeaderCounts} = await vite.ssrLoadModule('/src/mock-data/headerState.js');
  assert.deepEqual(getHeaderCounts(),{cart:0,wishlist:0});
  assert.deepEqual(getHeaderCounts([{quantity:2},{quantity:3},{quantity:-1}],['a','a','b']),{cart:5,wishlist:2});
  console.log('Search and counts passed');
  const {default:Footer} = await vite.ssrLoadModule('/src/components/Footer.jsx');
  const {business} = await vite.ssrLoadModule('/src/mock-data/business.js');
  const render = () => renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(Footer)));
  assert.doesNotMatch(render(),/GSTIN:|FSSAI:|href="#"/);
  assert.match(render(),/Details coming soon/);
  business.gstin={visible:false,value:'TEST-ONLY'};
  assert.doesNotMatch(render(),/TEST-ONLY/);
  business.gstin.visible=true;
  assert.doesNotMatch(render(),/TEST-ONLY/);
  business.gstin.value='07AAAAA0000A1Z0'; // Synthetic format-only QA value, not an actual registration.
  assert.match(render(),/07AAAAA0000A1Z0/);
  const nav = await vite.ssrLoadModule('/src/mock-data/navigation.js');
  const routes=new Set(['/', '/shop', '/search', ...nav.shopCategories.map(p=>p.path), ...nav.informationPages.map(p=>p.path)]);
  for (const link of [...nav.navigation,...nav.shopLinks,...nav.companyLinks,...nav.supportLinks,...nav.accountLinks]) assert.ok(routes.has(link.path.split('?')[0]),link.path);
  console.log('PASS: search matching, units, inactive exclusion, empty results, counts, registration flags and navigation route coverage.');
} finally {await vite.close();}



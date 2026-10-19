import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {createServer} from 'vite';
const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
try {
 const {configuredValue,productSpecifications,quantityLimit,relatedProducts}=await vite.ssrLoadModule('/src/domain/productDetailSelectors.js');
 const {products}=await vite.ssrLoadModule('/src/mock-data/products.js');
 const {ProductInformation}=await vite.ssrLoadModule('/src/pages/ProductPage.jsx');
 const {deliverySettings}=await vite.ssrLoadModule('/src/mock-data/delivery.js');
 const {isValidPin,evaluateDelivery,checkDelivery}=await vite.ssrLoadModule('/src/services/deliveryService.js');
 const {initialState,storefrontReducer}=await vite.ssrLoadModule('/src/state/store.js');
 assert.equal(configuredValue({a:null,b:' ',c:[],d:{none:''}}),null);
 assert.deepEqual(configuredValue({zero:0,missing:null}),{zero:0});
 assert.equal(productSpecifications(products[0]).netQuantity,'5 kg');
 assert.ok(!('sellingPrice' in productSpecifications(products[0])));
 const render=(product,policies=[])=>renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(ProductInformation,{product,policies})));
 const blocks=[{type:'paragraph',text:'Published CMS shipping <script>unsafe</script>'}];
 assert.match(render(products[0],[{id:'cms',status:'published',blocks}]),/Published CMS shipping &lt;script&gt;/);
 assert.doesNotMatch(render(products[0],[{id:'cms',status:'draft',blocks}]),/Published CMS shipping/);
 const empty=render(products[0]);
 assert.doesNotMatch(empty,/>Ingredients<|>Nutritional Information<|>Storage Instructions<|Shelf life|FSSAI information/);
 assert.match(empty,/Net quantity/);assert.match(empty,/shipping-policy/);assert.match(empty,/returns-refunds/);
 const configured=render({...products[0],ingredients:['Fixture ingredient'],specifications:{shelfLife:'Fixture value',fssai:null}},[{id:'test',status:'published',title:'Policy',body:'Fixture policy'}]);
 assert.match(configured,/Fixture ingredient/);assert.match(configured,/Fixture value/);assert.match(configured,/Fixture policy/);
 assert.doesNotMatch(render(products[0],[{id:'draft',status:'placeholder',body:'Unpublished promise'}]),/Unpublished promise/);
 for(const pin of ['', '123', '012345','12345x','1234567']) assert.equal(isValidPin(pin),false);
 assert.equal(isValidPin(' 110001 '),true);
 assert.equal((await checkDelivery('110001')).status,'unconfigured');
 assert.equal((await checkDelivery('bad')).status,'invalid');
 const fixture={...deliverySettings,configured:true,serviceablePins:['110001']};
 assert.equal(evaluateDelivery('110001',fixture).status,'serviceable');
 assert.equal(evaluateDelivery('110002',fixture).status,'unserviceable');
 assert.equal(evaluateDelivery('110001',{...fixture,serviceablePins:[]}).status,'unserviceable');
 assert.equal(evaluateDelivery('110001',{...fixture,configured:false}).status,'unconfigured');
 assert.match(evaluateDelivery('110001',fixture).message,/Demo coverage/);
 assert.equal(relatedProducts([...products,{...products[1],id:'hidden',status:'inactive'}],products[1]).length,3);
 const eligible={...products[0],status:'active',price:50,stock:2};
 let state=storefrontReducer(initialState,{type:'cart/add',product:eligible,quantity:10});
 assert.equal(state.cart[0].quantity,2);assert.equal(quantityLimit(eligible,state.cart),0);
 for(const patch of [{price:null},{stock:null},{status:'coming_soon'},{status:'out_of_stock'},{status:'inactive'}]) {
  assert.equal(storefrontReducer(initialState,{type:'cart/add',product:{...eligible,...patch}}),initialState);
 }
 console.log('PASS: configured-only product/policy information, recursive empty values, PIN validation and explicit demo coverage, related exclusions, stock/cart eligibility.');
} finally {await vite.close();}

import assert from 'node:assert/strict';
import fs from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import {createServer} from 'vite';
const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
try {
 const {products}=await vite.ssrLoadModule('/src/mock-data/products.js');
 const {checkoutFixture}=await vite.ssrLoadModule('/src/dev/checkoutFixture.js');
 const {initialState,storefrontReducer:reduce,sanitizePersisted}=await vite.ssrLoadModule('/src/state/store.js');
 const {checkoutEligibility,createDemoOrder,getSessionDemoOrder}=await vite.ssrLoadModule('/src/services/checkoutService.js');
 const {saveDemoAddress,defaultDemoAddress}=await vite.ssrLoadModule('/src/services/customerService.js');
 const {safeReturnPath}=await vite.ssrLoadModule('/src/services/authService.js');
 const {StorefrontProvider}=await vite.ssrLoadModule('/src/state/StorefrontContext.jsx');
 const {default:Checkout}=await vite.ssrLoadModule('/src/pages/CheckoutPreview.jsx');
 const {default:Success}=await vite.ssrLoadModule('/src/pages/OrderSuccessPage.jsx');
 const {CheckoutItems}=await vite.ssrLoadModule('/src/components/checkout/CheckoutParts.jsx');
 assert.equal(products.length,5);
 for(const product of products){assert.equal(product.status,'coming_soon');assert.equal(product.price,null);assert.equal(product.stock,null);}
 assert.ok(checkoutFixture.catalogue.every(sample=>!products.some(product=>product.id===sample.id)));
 let state={...initialState,...structuredClone(checkoutFixture),checkoutFixture:true};
 assert.match(checkoutEligibility(state).reason,/demo identity/);
 state=reduce(state,{type:'session/demo'});
 assert.equal(safeReturnPath('/checkout'),'/checkout');
 assert.match(checkoutEligibility(state).reason,/delivery address/);
 const input={type:'Home',recipient:'QA Demo',phone:'9876543210',line1:'QA building',line2:'QA street',locality:'QA locality',city:'QA city',state:'QA state',postalCode:'110001'};
 let addresses=await saveDemoAddress(state.session,input);
 state=reduce(state,{type:'session/addresses',sessionId:state.session.instanceId,addresses});
 state=reduce(state,{type:'session/address-select',id:addresses[0].id});
 assert.ok(checkoutEligibility(state).addressValid);
 assert.ok(checkoutEligibility(state).eligible);
 addresses=await saveDemoAddress(state.session,{...input,line1:'Edited QA building'},addresses[0].id);
 state=reduce(state,{type:'session/addresses',sessionId:state.session.instanceId,addresses});
 assert.equal(checkoutEligibility(state).address.line1,'Edited QA building');
 addresses=await saveDemoAddress(state.session,{...input,type:'Work'});
 state=reduce(state,{type:'session/addresses',sessionId:state.session.instanceId,addresses});
 addresses=await defaultDemoAddress(state.session,addresses[1].id);
 state=reduce(state,{type:'session/addresses',sessionId:state.session.instanceId,addresses});
 assert.ok(state.session.addresses[1].isDefault);
 const eligibility=checkoutEligibility(state);
 assert.equal(eligibility.summary.subtotal,350);assert.equal(eligibility.summary.total,370);
 for(const patch of [{price:null},{status:'coming_soon'},{status:'out_of_stock'},{status:'inactive'},{stock:0},{stock:1}]){
  const changed={...state,catalogue:state.catalogue.map((p,i)=>i===0?{...p,...patch}:p)};
  assert.equal(checkoutEligibility(changed).eligible,false);
  assert.throws(()=>createDemoOrder(changed,{requestId:'blocked'}));
 }
 for(const patch of [{shipping:null},{tax:null},{shipping:NaN},{codEnabled:false}]){
  assert.equal(checkoutEligibility({...state,checkoutSettings:{...state.checkoutSettings,...patch}}).eligible,false);
 }
 assert.equal(checkoutEligibility({...state,cart:[]}).eligible,false);
 assert.equal(checkoutEligibility({...state,checkoutFixture:false}).eligible,false);
 assert.throws(()=>createDemoOrder(state,{requestId:'online',paymentMethod:'razorpay'}),/Coming Soon/);
 assert.throws(()=>createDemoOrder(state,{requestId:'long',instructions:'x'.repeat(201)}));
 const action={type:'checkout/place',sessionId:state.session.instanceId,requestId:'qa-request',paymentMethod:'cod',instructions:'Demo instruction'};
 const stale=reduce(state,{...action,sessionId:'other'});assert.equal(stale,state);
 const failed=reduce({...state,checkoutSettings:{...state.checkoutSettings,shipping:null}},action);
 assert.match(failed.checkoutError,/not fully configured/);assert.equal(failed.cart.length,2);assert.ok(!failed.session.orders);
 const placed=reduce(state,action);
 assert.equal(placed.cart.length,0);assert.equal(placed.session.orders.length,1);
 const order=placed.session.orders[0];
 assert.match(order.id,/^DEMO-/);assert.equal(order.status,'Placed');assert.equal(order.paymentMethod,'COD');assert.equal(order.total,370);
 assert.equal(reduce(placed,action),placed);
 const again=reduce(placed,{...action,requestId:'different'});assert.equal(again.session.orders.length,1);
 assert.notEqual(order.address,state.session.addresses[0]);assert.equal(order.instructions,'Demo instruction');
 assert.equal(getSessionDemoOrder(placed.session,order.id),order);
 assert.equal(getSessionDemoOrder(placed.session,'nonexistent'),null);
 assert.equal(getSessionDemoOrder({...placed.session,instanceId:'other'},order.id),null);
 assert.equal(getSessionDemoOrder(reduce(placed,{type:'session/clear'}).session,order.id),null);
 assert.equal('session' in sanitizePersisted(placed),false);
 const render=element=>renderToStaticMarkup(React.createElement(MemoryRouter,null,element));
 const html=render(React.createElement(StorefrontProvider,{developmentFixture:state},React.createElement(Checkout)));
 assert.match(html,/Delivery address/);assert.match(html,/QA Demo/);assert.match(html,/Edit Home/);assert.match(html,/370.00/);assert.match(html,/STATIC DEMO/);
 const invalid=render(React.createElement(StorefrontProvider,null,React.createElement(Success)));
 assert.match(invalid,/Demo order unavailable/);assert.doesNotMatch(invalid,/Your demo is complete/);
 const confirmed=render(React.createElement(StorefrontProvider,{developmentFixture:placed},React.createElement(Routes,null,React.createElement(Route,{path:'/',element:React.createElement(Success)}))));
 // Resolve the real success route so useParams reads the requested session reference.
 const confirmation=renderToStaticMarkup(React.createElement(MemoryRouter,{initialEntries:['/order-success/'+order.id]},React.createElement(StorefrontProvider,{developmentFixture:placed},React.createElement(Routes,null,React.createElement(Route,{path:'/order-success/:orderId',element:React.createElement(Success)})))));
 assert.match(confirmation,/Your demo is complete/);assert.match(confirmation,/No live purchase/);assert.match(confirmation,/DEMO STATUS/);assert.match(confirmation,/Edited QA building/);assert.match(confirmation,/370.00/);
 const items=render(React.createElement(CheckoutItems,{items:order.items}));
 assert.match(items,/Illustrative pantry sample/);assert.match(items,/Quantity 2/);
 const page=fs.readFileSync('src/pages/CheckoutPreview.jsx','utf8');
 assert.match(page,/Navigate to="\/login\?returnTo=%2Fcheckout"/);
 assert.match(page,/Online Payment/);assert.match(page,/Coming Soon/);assert.match(page,/if\(lock.current\)return/);
 assert.match(page,/import AddressForm from/);
 const app=fs.readFileSync('src/App.jsx','utf8');
 assert.match(app,/import.meta.env.DEV \? lazy\(\(\) => import\('\.\/dev\/CheckoutDevelopmentPreview'\)/);
 const provider=fs.readFileSync('src/state/StorefrontContext.jsx','utf8');
 assert.match(provider,/if\(isolated \|\| !state.ready\)return/);assert.match(provider,/if\(isolated\)return/);
 const bundle=fs.readdirSync('dist/assets').filter(x=>x.endsWith('.js')).map(x=>fs.readFileSync('dist/assets/'+x,'utf8')).join('');
 assert.doesNotMatch(bundle,/checkout-ui-sample|Illustrative pantry sample|DEVELOPMENT FIXTURE ONLY|\/dev\/checkout/);
 console.log('PASS: checkout login return, shared address add/edit/default/selection, cart eligibility, missing price/charges, COD-only placement, fixture isolation, atomic duplicate prevention, snapshots, cart clearing, invalid/session-scoped confirmations and production fixture exclusion.');
} finally {await vite.close();}




import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { matchRoutes } from 'react-router-dom';
const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
try {
  const load=p=>vite.ssrLoadModule('/src/'+p);
  const {getProducts,getProductBySlug,updateProduct}=await load('services/productService.js');
  const {resetMockData}=await load('services/mockStore.js');
  const {searchCatalogue}=await load('services/searchService.js');
  const {isProductVisible,isProductPurchasable}=await load('domain/productSelectors.js');
  const products=await getProducts();
  assert.equal(products.length,5);
  const fields=['id','slug','sku','name','size','category','price','compareAtPrice','stock','status','shortDescription','longDescription','images','videos','ingredients','nutrition','storage','specifications','seo'];
  for(const p of products) {for(const field of fields) assert.ok(field in p,field); assert.equal(isProductPurchasable(p),false); assert.ok(!('variants' in p));}
  for(const field of ['id','slug','sku']) assert.equal(new Set(products.map(p=>p[field])).size,5);
  const p=products[0];
  p.name='mutated returned copy'; assert.notEqual((await getProducts())[0].name,p.name);
  await updateProduct(p.id,{status:'inactive'});
  assert.equal((await getProducts()).length,4); assert.equal(await getProductBySlug(p.slug),null); assert.equal((await searchCatalogue('atta')).length,0);
  assert.equal((await getProducts({includeInactive:true})).length,5);
  await updateProduct(p.id,{status:'active',price:100,stock:2});
  assert.equal(isProductPurchasable(await getProductBySlug(p.slug)),true);
  await updateProduct(p.id,{stock:0}); assert.equal(isProductPurchasable(await getProductBySlug(p.slug)),false);
  assert.equal(isProductVisible({status:'unknown'}),false);
  await assert.rejects(updateProduct(p.id,{status:'bogus'}));
  await assert.rejects(updateProduct(p.id,{slug:products[1].slug}));
  await resetMockData(); assert.equal((await getProducts())[0].price,null);
  const {getCategories,getHomepageContent,getBlogPosts}=await load('services/contentService.js');
  assert.equal((await getCategories()).length,2); assert.ok((await getHomepageContent()).id); assert.deepEqual(await getBlogPosts(),[]);
  const {getCustomerOrders}=await load('services/customerService.js'); assert.deepEqual(await getCustomerOrders('demo-customer'),[]);
  const {sanitizePersisted,storefrontReducer,initialState}=await load('state/store.js');
  assert.deepEqual(sanitizePersisted({cart:[null,{quantity:-1}],wishlist:['a','a',null],location:{postalCode:'bad'},session:{mode:'verified'}}),{cart:[],wishlist:['a'],location:null});
  assert.equal(storefrontReducer(initialState,{type:'session/demo'}).session.mode,'demo');
  const registry=await load('routes/registry.js');
  const routes=[...registry.publicRoutes,...registry.customerRoutes,...registry.adminRoutes]; assert.ok(routes.length>=34);
  assert.equal(new Set(routes.map(r=>r.path)).size,routes.length);
  for(const route of routes) assert.ok(matchRoutes(routes.map(r=>({path:r.path})),route.path.replace(':slug','sample').replace(':orderId','sample')));
  console.log('PASS: original and extended routes; product contracts; isolated mock writes; visibility/search consistency; unavailable stock; empty customer data; persistence sanitation; mock-only session.');
} finally {await vite.close();}


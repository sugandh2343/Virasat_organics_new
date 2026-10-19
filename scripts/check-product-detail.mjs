import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
try {
 const {products}=await vite.ssrLoadModule('/src/mock-data/products.js');
 const {getProductBySlug,updateProduct}=await vite.ssrLoadModule('/src/services/productService.js');
 const {quantityLimit,clampQuantity,relatedProducts}=await vite.ssrLoadModule('/src/domain/productDetailSelectors.js');
 const {getProductAvailability}=await vite.ssrLoadModule('/src/domain/productSelectors.js');
 const {productGalleryItems}=await vite.ssrLoadModule('/src/components/media/ProductMediaViewer.jsx');
 const {VideoPlayer}=await vite.ssrLoadModule('/src/components/media/VideoModal.jsx');
 const {storefrontReducer,initialState}=await vite.ssrLoadModule('/src/state/store.js');
 for(const product of products) {
  assert.equal((await getProductBySlug(product.slug)).id,product.id);
  assert.equal(quantityLimit(product),0);
  assert.equal(getProductAvailability(product).purchasable,false);
  assert.equal(productGalleryItems(product).length,5);
 }
 assert.equal(await getProductBySlug('unknown'),null);
 await updateProduct(products[0].id,{status:'inactive'});
 assert.equal(await getProductBySlug(products[0].slug),null);
 const eligible={...products[1],status:'active',price:100,stock:3};
 assert.equal(quantityLimit(eligible),3);
 assert.equal(quantityLimit(eligible,[{productId:eligible.id,quantity:2}]),1);
 assert.equal(clampQuantity(8,3),3);assert.equal(clampQuantity(-4,3),1);
 for(const patch of [{price:null},{stock:null},{stock:0},{status:'out_of_stock'},{status:'coming_soon'},{status:'inactive'}])assert.equal(quantityLimit({...eligible,...patch}),0);
 let state=storefrontReducer(initialState,{type:'cart/add',product:eligible,quantity:2});
 assert.equal(state.cart[0].quantity,2);
 state=storefrontReducer(state,{type:'cart/add',product:eligible,quantity:2});
 assert.equal(state.cart[0].quantity,3);
 assert.equal(storefrontReducer(state,{type:'cart/add',product:eligible,quantity:-1}),state);
 const related=relatedProducts([...products,{...eligible,id:'hidden',status:'inactive'}],products[1]);
 assert.equal(related.length,3);assert.ok(related.every(p=>p.id!==products[1].id && p.status!=='inactive'));
 assert.equal(relatedProducts(products,products[0]).length,0);
 const media=productGalleryItems({...products[0],images:['/first.webp',{src:'/second.webp',alt:'Back photo'}],videos:[{src:null,title:'Product film'}]});
 assert.equal(media.length,3);assert.equal(media[1].caption,'Back photo');assert.equal(media[2].type,'video');
 const fallback=renderToStaticMarkup(React.createElement(VideoPlayer,{media:{src:null}}));
 assert.match(fallback,/Video coming soon/);assert.doesNotMatch(fallback,/<video/);
 console.log('PASS: five slug lookups, unknown/inactive exclusion, status and price/stock gates, quantity/cart boundaries, related filtering, gallery arrays and absent video.');
} finally {await vite.close();}

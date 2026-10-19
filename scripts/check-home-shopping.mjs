import assert from 'node:assert/strict';
import { createServer } from 'vite';
const vite = await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
try {
  const {storefrontReducer,initialState} = await vite.ssrLoadModule('/src/state/store.js');
  const {products} = await vite.ssrLoadModule('/src/mock-data/products.js');
  for (const status of ['inactive','coming_soon','out_of_stock']) {
    assert.deepEqual(storefrontReducer(initialState,{type:'cart/add',product:{...products[0],status,price:100,stock:2}}).cart,[]);
  }
  assert.deepEqual(storefrontReducer(initialState,{type:'cart/add',product:{...products[0],status:'active'}}).cart,[]);
  const eligible={...products[0],status:'active',price:100,stock:2}; // Synthetic test values only.
  let state=initialState;
  for(let i=0;i<4;i++) state=storefrontReducer(state,{type:'cart/add',product:eligible});
  assert.deepEqual(state.cart,[{productId:eligible.id,quantity:2}]);
  state=storefrontReducer(state,{type:'wishlist/toggle',id:eligible.id});
  assert.deepEqual(state.wishlist,[eligible.id]);
  assert.deepEqual(storefrontReducer(state,{type:'wishlist/toggle',id:eligible.id}).wishlist,[]);
  console.log('PASS: unavailable products cannot enter cart; eligible quantity capped by stock; wishlist toggles independently.');
} finally {await vite.close();}

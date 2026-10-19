import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
try {
  const {default:Viewer}=await vite.ssrLoadModule('/src/components/media/ProductMediaViewer.jsx');
  const {default:VideoModal}=await vite.ssrLoadModule('/src/components/media/VideoModal.jsx');
  const {homeContent}=await vite.ssrLoadModule('/src/mock-data/home.js');
  const {products}=await vite.ssrLoadModule('/src/mock-data/products.js');
  assert.equal(homeContent.media.gallery.items.length,7);
  assert.equal(new Set(homeContent.media.gallery.items.map(i=>i.id)).size,7);
  assert.equal(homeContent.video.src,null);
  assert.match(renderToStaticMarkup(React.createElement(Viewer,{product:products[0]})),/Photography pending/);
  const fixture={...products[0],images:['/assets/products/test-one.webp',{src:'/assets/products/test-two.webp',alt:'Second photo'}],videos:[{src:'/assets/videos/test.mp4',title:'Product film'}]};
  const html=renderToStaticMarkup(React.createElement(Viewer,{product:fixture}));
  assert.match(html,/Enlarge Atta/);assert.match(html,/View Second photo/);assert.match(html,/View Product film/);
  const fallback=renderToStaticMarkup(React.createElement(VideoModal,{open:true,onClose:()=>{},media:homeContent.video}));
  assert.match(fallback,/Video coming soon/);assert.ok(!fallback.includes('<video'));
  console.log('PASS: seven unique gallery slots; absent-media fallback; reusable multi-image/video record support; missing video renders no broken player.');
} finally {await vite.close();}

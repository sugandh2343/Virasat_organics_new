import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, matchRoutes } from 'react-router-dom';
import { createServer } from 'vite';
const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
try {
 const {homeContent:home}=await vite.ssrLoadModule('/src/mock-data/home.js');
 const {getEditorialPreviews,getBlogPosts,getBlogPostBySlug}=await vite.ssrLoadModule('/src/services/contentService.js');
 const {Testimonials,Newsletter,StoryPreview,JournalCards}=await vite.ssrLoadModule('/src/components/home/HomeEditorial.jsx');
 const {publicRoutes}=await vite.ssrLoadModule('/src/routes/registry.js');
 const render=element=>renderToStaticMarkup(React.createElement(MemoryRouter,null,element));
 assert.deepEqual(home.sections.filter(s=>s.enabled).sort((a,b)=>a.order-b.order).map(s=>s.id),['hero','categories','collection','introduction','gallery','story','values','journal','newsletter']);
 assert.equal(new Set(home.sections.map(s=>s.id)).size,home.sections.length);
 assert.equal(render(React.createElement(Testimonials,{content:home.testimonials})), '');
 assert.deepEqual(home.testimonials.items,[]);
 const posts=await getEditorialPreviews();assert.equal(posts.length,3);assert.deepEqual(await getBlogPosts(),[]);
 for(const post of posts){assert.equal(post.status,'editorial_draft');assert.equal(post.author,null);assert.equal(post.publishedAt,null);assert.equal(post.body,null);assert.equal((await getBlogPostBySlug(post.slug)).id,post.id);assert.ok(matchRoutes(publicRoutes,'/blog/'+post.slug));}
 assert.match(render(React.createElement(JournalCards,{posts})),/Editorial draft/);
 assert.match(render(React.createElement(StoryPreview,{content:home.story})),/href="\/our-story"/);
 assert.match(render(React.createElement(Newsletter,{content:home.newsletter})),/type="email"/);
 assert.equal(home.newsletter.pendingMessage,'Newsletter subscriptions will be available soon');
 const editorial=await readFile('src/components/home/HomeEditorial.jsx','utf8');
 assert.ok(!/localStorage|sessionStorage|fetch\(|axios|subscribed successfully/i.test(editorial));
 assert.ok(!/certified|chemical-free|pesticide-free|5-star/i.test(JSON.stringify([home.story,home.values,home.testimonials,posts])));
 const hero=await readFile('src/components/home/HomeHero.jsx','utf8');const media=await readFile('src/components/home/HomeMedia.jsx','utf8');
 for(const source of [hero,media]){assert.match(source,/import VideoModal/);assert.ok(!source.includes('<video'));}
 const page=await readFile('src/pages/HomePage.jsx','utf8');assert.match(page,/video=\{content.video\}/);
 console.log('PASS: configured section order; empty testimonials hidden; honest newsletter; draft provenance and article routes; story CTA; one shared video implementation; no fabricated review/certification data.');
}finally{await vite.close();}

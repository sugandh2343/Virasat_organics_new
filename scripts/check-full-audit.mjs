import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createServer} from 'vite';
import {matchRoutes} from 'react-router-dom';
const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
try {
 const load=path=>vite.ssrLoadModule('/src/'+path);
 const {publicRoutes,customerRoutes,adminRoutes,legacyAliases}=await load('routes/registry.js');
 const routes=[...publicRoutes,...customerRoutes,...adminRoutes,...legacyAliases];
 assert.equal(new Set(routes.map(r=>r.path)).size,routes.length);
 for(const route of routes)assert.ok(matchRoutes([{path:route.path}],route.path.replace(/:[^/]+/g,'audit-example')));
 const {getCategories}=await load('services/contentService.js');
 const {updateMockRecord,resetMockData,readMock}=await load('services/mockStore.js');
 const initial=await getCategories();
 await updateMockRecord('categories',initial[0].id,{name:'Audit category',slug:'audit-category'});
 assert.equal((await getCategories()).find(c=>c.id===initial[0].id).slug,'audit-category');
 await updateMockRecord('categories',initial[0].id,{status:'inactive'});
 assert.ok(!(await getCategories()).some(c=>c.id===initial[0].id));
 const footer=fs.readFileSync('src/components/Footer.jsx','utf8');
 assert.match(footer,/const shopLinks=useCatalogueLinks\(\)/);
 assert.doesNotMatch(footer,/import\s*\{\s*shopLinks/);
 await resetMockData();
 const products=await readMock('products');
 assert.equal(products.length,5);
 assert.ok(products.every(p=>p.status==='coming_soon'&&p.price===null&&p.stock===null));
 let imported=0;
 const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(dir+'/'+entry.name):[dir+'/'+entry.name]);
 for(const file of walk('src').filter(p=>/\.(js|jsx)$/.test(p)&&p!=='src/main.jsx')){await vite.ssrLoadModule('/'+file);imported++;}
 const luminance=hex=>{const channels=hex.match(/\w\w/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;};
 for(const foreground of ['183D2B','203429','596353','65552F'])for(const background of ['FAF8F2','F3EFE5'])assert.ok((luminance(background)+.05)/(luminance(foreground)+.05)>=4.5);
 console.log('PASS: '+routes.length+' registry routes, '+imported+' SSR module imports; category mutation/hiding and footer hook wiring; reset restores five unpriced Coming Soon products; primary text token contrast >=4.5:1. Browser verification excluded.');
}finally{await vite.close();}

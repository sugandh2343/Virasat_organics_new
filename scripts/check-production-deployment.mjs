import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createServer,loadEnv} from 'vite';
const env=loadEnv('production',process.cwd(),'VITE_');
const required=['VITE_FIREBASE_API_KEY','VITE_FIREBASE_AUTH_DOMAIN','VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_APP_ID','VITE_GOOGLE_MAPS_BROWSER_KEY'];
for(const name of required)assert.ok(env[name]?.trim(),name+' must be configured before packaging');
const allowed=new Set([...required,'VITE_DATA_MODE','VITE_API_BASE_URL','VITE_API_PROXY_ENABLED']);
assert.ok(Object.keys(env).every(name=>allowed.has(name)),'Review unexpected browser-exposed environment variable names');
const vite=await createServer({mode:'production',define:{'import.meta.env.PROD':'true','import.meta.env.DEV':'false'},server:{middlewareMode:true,hmr:false},appType:'custom'});
const original=globalThis.fetch;
try{
 const api=await vite.ssrLoadModule('/src/services/catalogueApi.js');assert.equal(api.apiMode,true);
 const {createApiClient}=await vite.ssrLoadModule('/src/services/apiClient.js');
 let captured;await createApiClient({credentials:'include',fetchImpl:async(url,options)=>{captured={url,options};return new Response(JSON.stringify({data:{}}));}})('/auth/csrf');
 assert.equal(captured.url,'/api/auth/csrf');assert.equal(captured.options.credentials,'include');
 assert.equal(api.media({src:'/api/media/example'}).src,'/api/media/example');
 const {createDemoOrder}=await vite.ssrLoadModule('/src/services/checkoutService.js');assert.throws(()=>createDemoOrder({},{}));
 const rules=fs.readFileSync('public/.htaccess','utf8');
 assert.ok(rules.indexOf('^api')<rules.indexOf('^ index.html'));assert.match(rules,/\\\.php/);
 const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):[dir+'/'+e.name]);
 const files=walk('dist');
 assert.ok(files.includes('dist/index.html'));assert.ok(files.includes('dist/.htaccess'));
 assert.ok(!files.some(f=>/CheckoutDevelopmentPreview|DesignSystemPage|\.map$/.test(f)));
 const html=fs.readFileSync('dist/index.html','utf8');
 for(const match of html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g))assert.ok(fs.existsSync('dist'+match[1]),'Missing built asset');
 for(const file of files.filter(f=>/\.(js|html|css)$/.test(f))){const text=fs.readFileSync(file,'utf8');assert.ok(!/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----|"type"\s*:\s*"service_account"/.test(text),'Private key material must never ship');}
 console.log('PASS: production configuration present (values withheld), same-origin API/media, session credentials, demo-order denial, SPA exclusions, root assets and no dev chunks/private-key material. Apache/provider execution requires upload.');
}finally{globalThis.fetch=original;await vite.close();}

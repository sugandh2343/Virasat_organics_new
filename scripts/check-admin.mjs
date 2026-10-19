import { transform } from 'esbuild';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter,Routes,Route,matchRoutes} from 'react-router-dom';
import {createServer} from 'vite';
const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
try {
 const load=path=>vite.ssrLoadModule('/src/'+path);
 const {getAdminSnapshot,calculateAdminDashboard}=await load('services/adminService.js');
 const {queryAdminRows}=await load('domain/adminSelectors.js');
 const {adminRoutes,adminGroups,adminQuickActions}=await load('routes/adminRegistry.js');
 const {publicRoutes,customerRoutes}=await load('routes/registry.js');
 const {StorefrontProvider}=await load('state/StorefrontContext.jsx');
 const {default:AdminLayout}=await load('layouts/AdminLayout.jsx');
 const {default:AdminSidebar}=await load('components/admin/AdminSidebar.jsx');
 const {default:AdminTopbar}=await load('components/admin/AdminTopbar.jsx');
 const {AdminDataTable}=await load('components/admin/AdminUI.jsx');
 const {AdminManagementView}=await load('pages/admin/AdminManagementPage.jsx');
 const data=await getAdminSnapshot({mode:'guest'});
 assert.equal(data.products.length,5);assert.equal(data.dashboard.totalProducts,5);
 assert.deepEqual(data.dashboard.statusCounts,{active:0,inactive:0,out_of_stock:0,coming_soon:5});
 assert.equal(data.dashboard.totalDemoOrders,0);assert.equal(data.dashboard.pendingDemoOrders,0);
 assert.equal(data.dashboard.lowStock,null);assert.deepEqual(data.dashboard.recentContent,[]);
 assert.deepEqual(data.customers,[]);assert.deepEqual(data.orders,[]);
 assert.ok(!('revenue' in data.dashboard));
 const session={mode:'demo',instanceId:'qa-session',customerId:'qa-customer',orders:[
  {id:'DEMO-QA',demo:true,sessionId:'qa-session',customerId:'qa-customer',status:'Placed',createdAt:'2026-01-01T00:00:00Z'},
  {id:'DEMO-FOREIGN',demo:true,sessionId:'foreign',customerId:'qa-customer',status:'Placed'},
 ]};
 const scoped=await getAdminSnapshot(session);
 assert.equal(scoped.orders.length,1);assert.equal(scoped.dashboard.totalDemoOrders,1);assert.equal(scoped.dashboard.pendingDemoOrders,1);
 assert.equal((await getAdminSnapshot({...session,mode:'guest'})).orders.length,0);
 const configured=calculateAdminDashboard([{id:'qa',stock:2,status:'active'}],[],[{id:'draft',updatedAt:'2026-01-01T00:00:00Z'}],{lowStockThreshold:3});
 assert.equal(configured.lowStock.length,1);assert.equal(configured.recentContent.length,1);
 data.products[0].name='changed returned copy';
 assert.equal((await getAdminSnapshot()).products[0].name,'Atta');
 const fresh=await getAdminSnapshot();
 assert.equal(queryAdminRows(fresh.products,{query:' BLACK ',searchKeys:['name']}).total,2);
 assert.equal(queryAdminRows(fresh.products,{status:'active'}).total,0);
 assert.equal(queryAdminRows(fresh.products,{query:'oil',status:'coming_soon',searchKeys:['name']}).total,4);
 assert.equal(queryAdminRows(fresh.products,{sortKey:'name',direction:'asc'}).rows[0].name,'Atta');
 assert.equal(queryAdminRows(fresh.products,{sortKey:'name',direction:'desc'}).rows[0].name,'Yellow Mustard Oil');
 const paged=queryAdminRows(fresh.products,{page:99,pageSize:2});
 assert.equal(paged.pages,3);assert.equal(paged.page,3);assert.equal(paged.rows.length,1);
 assert.equal(queryAdminRows([]).pages,1);assert.equal(queryAdminRows(fresh.products,{query:'missing'}).total,0);
 assert.equal(new Set(adminRoutes.map(route=>route.path)).size,adminRoutes.length);
 const all=[...publicRoutes,...customerRoutes,...adminRoutes].map(route=>({path:route.path}));
 for(const group of adminGroups)for(const [path] of group.items)assert.ok(matchRoutes(all,path));
 for(const action of adminQuickActions)assert.ok(matchRoutes(all,action.to));
 for(const path of ['/admin','/admin/products','/admin/categories','/admin/orders','/admin/customers','/admin/content','/admin/blog','/admin/media','/admin/settings'])assert.ok(adminRoutes.some(route=>route.path===path));
 const render=element=>renderToStaticMarkup(React.createElement(MemoryRouter,null,element));
 const sidebar=render(React.createElement(AdminSidebar,{collapsed:true,onLogout:()=>{}}));
 for(const group of adminGroups)for(const [,label] of group.items)assert.ok(sidebar.includes(label));
 assert.match(sidebar,/aria-label="Admin navigation"/);assert.match(sidebar,/View Website/);assert.match(sidebar,/Logout \/ leave preview/);
 const topbar=render(React.createElement(AdminTopbar,{mobileOpen:false,collapsed:false,dense:false}));
 assert.match(topbar,/aria-controls="admin-mobile-drawer"/);assert.match(topbar,/aria-expanded="false"/);assert.match(topbar,/Compact table rows/);
 const layout=render(React.createElement(StorefrontProvider,null,React.createElement(Routes,null,React.createElement(Route,{element:React.createElement(AdminLayout)},React.createElement(Route,{path:'/',element:React.createElement('p',null,'Admin test content')})))));
 assert.match(layout,/Admin test content/);assert.match(layout,/No admin authentication/);assert.match(layout,/Skip to admin content/);
 assert.doesNotMatch(layout,/site-header|site-footer|<footer/);
 for(const route of adminRoutes){
  const html=render(React.createElement(AdminManagementView,{route,data:fresh}));
  assert.ok(html.length>100,route.path);
  assert.doesNotMatch(html,/₹|Sales revenue|Payment captured/);
 }
 const dashboard=render(React.createElement(AdminManagementView,{route:adminRoutes[0],data:fresh}));
 assert.match(dashboard,/Total Products/);assert.match(dashboard,/Coming Soon/);assert.match(dashboard,/No demo orders/);assert.match(dashboard,/Update history is not configured/);
 const table=render(React.createElement(AdminDataTable,{title:'Products',rows:fresh.products,columns:[{key:'name',label:'Product'},{key:'status',label:'Status'}]}));
 assert.match(table,/<caption>Products/);assert.match(table,/aria-sort="ascending"/);assert.match(table,/Search records/);assert.match(table,/pagination/);assert.match(table,/tabindex="0"/);
 const empty=render(React.createElement(AdminDataTable,{title:'Customers',rows:[],columns:[{key:'name',label:'Name'}]}));
 assert.match(empty,/No records yet/);
 const css=await transform(fs.readFileSync('src/styles/admin.css','utf8'),{loader:'css',minify:true});assert.deepEqual(css.warnings,[]);
 const source=fs.readFileSync('src/layouts/AdminLayout.jsx','utf8');
 assert.match(source,/onClose=\{\(\)=>setMobileOpen\(false\)\}/);assert.match(source,/setMobileOpen\(false\)/);
 assert.doesNotMatch(source,/session\/clear|password|SiteLayout/);
 assert.doesNotMatch(fs.readFileSync('src/services/adminService.js','utf8'),/fetch\(|axios|https:\/\//);
 console.log('PASS: admin routes/sidebar/quick actions, accessible table and drawer wiring, separate layout, honest metrics, session-scoped orders, no fabricated customers/revenue, unconfigured stock/content, search/filter/sort/pagination and all management shells.');
}finally{await vite.close();}


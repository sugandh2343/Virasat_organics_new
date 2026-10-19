import {apiMode,adminCollections} from './catalogueApi';
import { getAdminSessionOrders,getAdminDemoCustomers } from './orderAdminService';
import { readMock } from './mockStore';

import { adminSettings } from '../mock-data/admin';
// Read-only local adapter. No authentication, server API, sales ledger or customer directory.
export function calculateAdminDashboard(products,orders,content,settings=adminSettings) {
 const statusCounts=Object.fromEntries(['active','inactive','out_of_stock','coming_soon'].map(status=>[status,products.filter(product=>product.status===status).length]));
 const configured=products.filter(product=>Number.isInteger(product.stock)&&product.stock>=0);
 const threshold=settings.lowStockThreshold;
 return {
  totalProducts:products.length,statusCounts,totalDemoOrders:orders.length,deliveredDemoOrders:orders.filter(order=>order.status==='Delivered').length,cancelledDemoOrders:orders.filter(order=>order.status==='Cancelled').length,
  pendingDemoOrders:orders.filter(order=>['Placed','Confirmed','Packed','Shipped','Out for Delivery'].includes(order.status)).length,
  recentOrders:[...orders].sort((a,b)=>(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0)).slice(0,5),
  configuredStockCount:configured.length,lowStockThreshold:threshold,
  lowStock:configured.length&&Number.isInteger(threshold)&&threshold>=0?configured.filter(product=>product.stock<=threshold):null,
  recentContent:content.filter(item=>item.updatedAt && Number.isFinite(Date.parse(item.updatedAt))).sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt)).slice(0,5),
 };
}
export async function getAdminSnapshot(session) {
 if(apiMode)return {...await adminCollections(),orders:[],customers:[],pages:[],blog:[],banners:[],homepage:null,business:null,orderScope:'Live catalogue only. Other modules load their protected APIs independently.'};
 let [products,categories,media,pages,blog,homepage,banners,business,inventoryActivity]=await Promise.all(['products','categories','productMedia','cmsPages','blogPosts','homepage','banners','business','inventoryActivity'].map(readMock));
 // Preserve session ownership. Never turn the empty shared fixture into invented global orders.
 const orders=[...getAdminSessionOrders(session)];
 const content=[...pages,...blog];
 return structuredClone({products,categories,orders,media,pages,blog,homepage,banners,business,inventoryActivity,customers:getAdminDemoCustomers(session),dashboard:calculateAdminDashboard(products,orders,content),orderScope:'Current local customer session only; not a store-wide order ledger.'});
}





import { orderStages } from '../mock-data/orderPresentation';
import { isProductPurchasable } from './productSelectors';
export function filterDemoOrders(orders,{query='',status='All',sort='newest'}={}) {
 const search=query.trim().toLowerCase();
 return orders.filter(order=>(order.orderId || order.id).toLowerCase().includes(search) && (status==='All'||order.status===status))
  .sort((a,b)=>{const delta=(Date.parse(a.createdAt)||0)-(Date.parse(b.createdAt)||0);return sort==='oldest'?delta:-delta;});
}
export function orderTimeline(order) {
 const events=Array.isArray(order.statusEvents)?order.statusEvents:[];
 return orderStages.map(status=>({status,event:events.find(event=>event.status===status)||null}));
}
export const canCancelDemoOrder=order=>!!order && ['Placed','Confirmed'].includes(order.status) && !(order.statusEvents || []).some(event=>['Packed','Shipped','Out for Delivery','Delivered','Cancelled'].includes(event.status));
export function reorderEligibility(order,catalogue,cart=[]) {
 if(!order?.items?.length)return {eligible:false,reason:'There are no historical items to reorder.',items:[]};
 const quantities=new Map();
 for(const item of order.items){
  if(!Number.isInteger(item.quantity)||item.quantity<1)return {eligible:false,reason:'A historical quantity is invalid.',items:[]};
  quantities.set(item.productId,(quantities.get(item.productId)||0)+item.quantity);
 }
 const items=[];const unavailable=[];
 for(const [productId,quantity] of quantities){
  const product=catalogue.find(product=>product.id===productId);
  const existing=cart.filter(item=>item.productId===productId).reduce((sum,item)=>sum+item.quantity,0);
  if(!isProductPurchasable(product)||quantity+existing>Math.min(product.stock,99))unavailable.push(order.items.find(item=>item.productId===productId)?.name || 'Historical item');
  else items.push({product,quantity});
 }
 return {eligible:!unavailable.length,items:unavailable.length?[]:items,reason:unavailable.length?'Cannot reorder: '+unavailable.join(', ')+'. Current price, availability or stock does not allow the full quantity.':'Uses current prices and stock. Adds to cart only; no new order is placed.'};
}
export function formatOrderDate(value) {
 const date=new Date(value);
 return value && Number.isFinite(date.getTime())?new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short'}).format(date):'Date not recorded';
}


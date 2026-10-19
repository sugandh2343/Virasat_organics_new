import { getSessionDemoOrders, getSessionDemoOrder, cancelSessionDemoOrder } from './checkoutService';
import { canCancelDemoOrder } from '../domain/orderSelectors';
import { sessionAddresses } from './customerService';
export const fulfilmentStages=['Placed','Confirmed','Packed','Shipped','Out for Delivery','Delivered'];
export const operationStatuses=[...fulfilmentStages,'Cancelled'];
export const knownAmount=value=>typeof value==='number' && Number.isFinite(value) && value>=0;
export const orderAddress=order=>order.deliveryAddressSnapshot || order.address || {};
export const orderContact=order=>({name:order.customerSnapshot?.name || orderAddress(order).recipient || '',mobile:order.customerSnapshot?.mobile || orderAddress(order).phone || ''});
// This adapter reads the existing session, never a separate order/customer database.
export function getAdminSessionOrders(session){return import.meta.env.DEV?getSessionDemoOrders(session):[];}
export function allowedOrderTransitions(order){
 if(!order || ['Delivered','Cancelled'].includes(order.status))return [];
 const index=fulfilmentStages.indexOf(order.status);
 if(index<0)return [];
 return [fulfilmentStages[index+1],...(canCancelDemoOrder(order)?['Cancelled']:[])].filter(Boolean);
}
export function updateAdminDemoOrder(session,{orderId,status,note='',expectedStatus}){
 if(!import.meta.env.DEV)throw new Error('Order administration is development-only.');
 const order=getSessionDemoOrder(session,orderId);
 if(!order)throw new Error('Order unavailable in this demo session.');
 if(typeof note!=='string'||note.trim().length>1000)throw new Error('Use 1,000 characters or fewer for internal notes.');
 if(expectedStatus!==order.status)throw new Error('The order changed. Review its current status before continuing.');
 if(!allowedOrderTransitions(order).includes(status))throw new Error('This status transition is not allowed. Delivered and Cancelled are terminal.');
 const occurredAt=new Date().toISOString();
 const orders=status==='Cancelled'?cancelSessionDemoOrder(session,orderId):session.orders.map(item=>item.id===orderId?{...item,status,statusEvents:[...(item.statusEvents || []),{id:crypto.randomUUID(),status,occurredAt,note:'Status recorded in the local admin demo. No delivery or payment is confirmed.'}]}:item);
 return orders.map(item=>item.id===orderId && note.trim()?{...item,adminNotes:[...(item.adminNotes || []),{id:crypto.randomUUID(),text:note.trim(),occurredAt,status}]}:item);
}
export function queryOperationsOrders(orders,{query='',status='All',paymentMethod='All',paymentStatus='All',from='',to='',sort='newest',page=1,pageSize=10}={}){
 const term=query.trim().replace(/\s+/g,' ').toLowerCase();
 const localDay=value=>{const d=new Date(value);return Number.isFinite(d.getTime())?[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'):'';};
 const filtered=orders.filter(order=>{
 const contact=orderContact(order),day=localDay(order.createdAt);
 return (!term||[order.orderId||order.id,contact.name,contact.mobile].some(value=>String(value).toLowerCase().includes(term))) && (status==='All'||status===order.status) && (paymentMethod==='All'||paymentMethod===order.paymentMethod) && (paymentStatus==='All'||paymentStatus===order.paymentStatus) && (!from||day&&day>=from) && (!to||day&&day<=to);
 }).sort((a,b)=>{
 if(sort.startsWith('amount')){if(!knownAmount(a.total))return knownAmount(b.total)?1:0;if(!knownAmount(b.total))return -1;return sort==='amount-asc'?a.total-b.total:b.total-a.total;}
 const delta=(Date.parse(a.createdAt)||0)-(Date.parse(b.createdAt)||0);return sort==='oldest'?delta:-delta;
 });
 const size=Number.isInteger(pageSize)&&pageSize>0?Math.min(pageSize,100):10;
 const pages=Math.max(1,Math.ceil(filtered.length/size));const current=Math.max(1,Math.min(pages,Number.isInteger(page)?page:1));
 return {rows:filtered.slice((current-1)*size,current*size),total:filtered.length,pages,page:current};
}
export function getAdminDemoCustomers(session){
 if(!import.meta.env.DEV || session?.mode!=='demo' || !session.instanceId || !session.customerId)return [];
 const orders=getAdminSessionOrders(session);const profile=session.profile || {};const addresses=sessionAddresses(session);
 if(!orders.length&&!addresses.length&&!Object.values(profile).some(Boolean))return [];
 const sorted=[...orders].sort((a,b)=>(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0));
 const totals=orders.filter(order=>knownAmount(order.total));
 return [{id:session.customerId,name:profile.name || '',mobile:profile.mobile || '',email:profile.email || '',status:'Unverified demo session',addresses:structuredClone(addresses),orders,orderCount:orders.length,lastOrderAt:sorted[0]?.createdAt || null,totalSpend:orders.length&&totals.length===orders.length?totals.reduce((sum,order)=>sum+order.total,0):null}];
}
export function deliveryLocation(address={}){
 const text=['recipient','line1','line2','landmark','locality','city','state','postalCode','country'].map(key=>address[key]).filter(Boolean).join(', ');
 const {latitude,longitude,coordinatesConfirmed}=address;
 const confirmed=coordinatesConfirmed===true && typeof latitude==='number' && Number.isFinite(latitude) && Math.abs(latitude)<=90 && typeof longitude==='number' && Number.isFinite(longitude) && Math.abs(longitude)<=180;
 const coordinates=confirmed?`${latitude},${longitude}`:null;
 return {text,coordinates,mapUrl:coordinates?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(coordinates):null};
}

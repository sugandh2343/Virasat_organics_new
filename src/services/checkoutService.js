import { canCancelDemoOrder } from '../domain/orderSelectors';
import { cartSummary } from '../domain/cartSelectors';
import { sessionAddresses, validateAddress } from './customerService';
import { checkoutSettings } from '../mock-data/checkout';
// In-memory simulation adapter. These checks are UI safeguards, never server authorization.
export function checkoutEligibility(state) {
 const settings=state.checkoutFixture && import.meta.env.DEV ? state.checkoutSettings : checkoutSettings;
 const summary=cartSummary(state.cart,state.catalogue || [],settings);
 const address=sessionAddresses(state.session).find(item=>item.id===state.session.deliveryAddressId);
 const addressValid=!!address && Object.keys(validateAddress(address)).length===0;
 const reason=state.session.mode!=='demo'?'Continue with an unverified demo identity first.'
  :!addressValid?'Select a complete demo delivery address.'
  :!summary.canCheckout?summary.reason
  :summary.total===null || !Number.isFinite(summary.total)?'Shipping and tax rules are not fully configured. Demo placement is blocked.'
  :!settings.codEnabled?'Cash on Delivery is not configured.'
  :!(import.meta.env.DEV && state.checkoutFixture)?'Order placement is available only in the isolated development preview.'
  :null;
 return {settings,summary,address,addressValid,reason,eligible:!reason};
}
export function createDemoOrder(state,{requestId,instructions='',paymentMethod='cod'}) {
 if(import.meta.env?.VITE_DATA_MODE==='api')throw new Error('Live checkout is not enabled. No order or payment was created.');
 if(typeof requestId!=='string'||!requestId)throw new Error('A demo request reference is required.');
 const existing=getSessionDemoOrders(state.session).find(order=>order.requestId===requestId);
 if(existing)return existing;
 const result=checkoutEligibility(state);
 if(result.reason)throw new Error(result.reason);
 if(paymentMethod!=='cod')throw new Error('Online Payment is Coming Soon. No online payment can be captured.');
 if(typeof instructions!=='string'||instructions.length>200)throw new Error('Use 200 characters or fewer for delivery instructions.');
 const {summary,settings,address}=result;
 const orderId='DEMO-'+crypto.randomUUID();const createdAt=new Date().toISOString();const snapshot=structuredClone(address);
 return {
  id:orderId,orderId,requestId,sessionId:state.session.instanceId,
  customerId:state.session.customerId,demo:true,status:'Placed',paymentMethod:'COD',
  customerSnapshot:structuredClone(state.session.profile || {}),createdAt,address:snapshot,deliveryAddressSnapshot:snapshot,instructions:instructions.trim(),deliveryInstructions:instructions.trim(),
  paymentStatus:'Not collected (demo)',statusEvents:[{id:crypto.randomUUID(),status:'Placed',occurredAt:createdAt,note:'Placed in the local demo. Nothing was submitted to the business.'}],
  items:summary.items.map(({product,quantity,lineTotal})=>({productId:product.id,sku:product.sku || product.SKU || null,name:product.name,size:product.size,images:structuredClone(product.images || []),quantity,unitPrice:product.price,lineTotal})),
  subtotal:summary.subtotal,shipping:settings.shipping,tax:settings.tax,total:summary.total,
 };
}
export function getSessionDemoOrders(session) {
 return session?.mode==='demo'?(session.orders || []).filter(order=>order.demo===true && order.sessionId===session.instanceId && order.customerId===session.customerId):[];
}
export function getSessionDemoOrder(session,id){return getSessionDemoOrders(session).find(order=>order.id===id) || null;}

export function cancelSessionDemoOrder(session,orderId) {
 const order=getSessionDemoOrder(session,orderId);
 if(!order)throw new Error('Demo order unavailable in this session.');
 if(order.status==='Cancelled')return session.orders;
 if(!canCancelDemoOrder(order))throw new Error('Only Placed or Confirmed demo orders can be cancelled.');
 const updated={...order,status:'Cancelled',statusEvents:[...(order.statusEvents || []),{id:crypto.randomUUID(),status:'Cancelled',occurredAt:new Date().toISOString(),note:'Cancelled in this demo session only. No business cancellation or refund was requested.'}]};
 return session.orders.map(item=>item.id===order.id?updated:item);
}


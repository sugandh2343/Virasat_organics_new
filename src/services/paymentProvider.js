import {customerWrite} from './customerApi';
// This release deliberately offers COD only. No client flag can enable the gateway.
export const checkoutPaymentMethods=Object.freeze(['cod']);
export const onlinePaymentNotice='Online payments unavailable';
let sdkPromise;
export function validPaymentOrder(value){return value?.enabled===true&&/^rzp_(test|live)_[a-zA-Z0-9]+$/.test(value.keyId??'')&&/^order_[a-zA-Z0-9]+$/.test(value.providerOrderId??'')&&Number.isSafeInteger(value.amountPaise)&&value.amountPaise>=100&&value.currency==='INR';}
export function loadRazorpaySdk(order){
 if(!validPaymentOrder(order))return Promise.reject(new Error('Online payments are not enabled for this order.'));
 if(window.Razorpay)return Promise.resolve(window.Razorpay);
 if(!sdkPromise)sdkPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.async=true;
  const fail=()=>{clearTimeout(timer);script.remove();sdkPromise=undefined;reject(new Error('Payment provider could not be loaded.'));};
  const timer=setTimeout(fail,15000);script.onerror=fail;script.onload=()=>{clearTimeout(timer);if(window.Razorpay)resolve(window.Razorpay);else fail();};document.head.appendChild(script);
 });return sdkPromise;
}
export const createRazorpayOrder=(orderId,idempotencyKey)=>customerWrite('/payments/razorpay/order',{method:'POST',idempotencyKey,body:{orderId}});
export const verifyRazorpayPayment=(orderId,result)=>customerWrite('/payments/razorpay/verify',{method:'POST',body:{orderId,razorpayOrderId:result.razorpay_order_id,razorpayPaymentId:result.razorpay_payment_id,signature:result.razorpay_signature}});
// Prepared entry point; intentionally not offered by checkout in this disabled release.
// Caller must hold a server-created online order; COD cannot be converted by this adapter.
export async function openOnlinePayment({orderId,idempotencyKey}){
 const order=await createRazorpayOrder(orderId,idempotencyKey);
 const Razorpay=await loadRazorpaySdk(order);
 return new Promise((resolve,reject)=>{
  const checkout=new Razorpay({key:order.keyId,order_id:order.providerOrderId,amount:order.amountPaise,currency:order.currency,name:'Virasat Organics',
   handler:async result=>{try{resolve(await verifyRazorpayPayment(orderId,result));}catch(e){reject(e);}},
   modal:{ondismiss:()=>resolve({paymentStatus:'unconfirmed',dismissed:true})}});
  checkout.on('payment.failed',()=>reject(new Error('Payment was not confirmed. Check your order before retrying.')));
  checkout.open();
 });
}

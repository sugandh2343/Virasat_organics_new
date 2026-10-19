import {apiMode} from '../services/catalogueApi';
import {lazy,Suspense} from 'react';
const LiveOrderConfirmation=lazy(()=>import('./LiveCommerce').then(m=>({default:m.LiveOrderConfirmation}))); 
import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Container, PrimaryButton, SecondaryButton, EmptyState } from '../components/ui';
import { useStorefront } from '../state/StorefrontContext';
import { getSessionDemoOrder } from '../services/checkoutService';
import { CheckoutItems, CheckoutTotals, AddressDetails } from '../components/checkout/CheckoutParts';
import { checkoutNotice, checkoutSteps } from '../mock-data/checkout';
import '../styles/checkout.css';
function DemoOrderSuccessPage({ordersPath='/account/orders'}){
 const {orderId}=useParams();const {state}=useStorefront();const heading=useRef(null);
 const order=getSessionDemoOrder(state.session,orderId);
 useEffect(()=>{heading.current?.focus();},[orderId]);
 if(!order)return <Container className="page-section"><EmptyState title="Demo order unavailable." description="This reference does not belong to the current demo session, or the session has ended. No live order was created."><SecondaryButton to="/shop">Continue Shopping</SecondaryButton></EmptyState></Container>;
 return <Container className="page-section checkout-page"><header className="checkout-confirmation"><span className="checkout-check"><Check aria-hidden="true"/></span><p className="eyebrow">DEMO STATUS Ã‚Â· {order.status.toUpperCase()}</p><h1 ref={heading} tabIndex={-1}>Your demo is complete.</h1><p>No live purchase has been made.</p><p className="checkout-reference">Demo reference: {order.id}</p></header><p className="checkout-demo-notice">{checkoutNotice}</p><ol className="checkout-progress" aria-label="Checkout progress">{checkoutSteps.map((label,index)=><li key={label} aria-current={index===3?"step":undefined} className={index<3?"is-complete":""}><span>{String(index+1).padStart(2,"0")}</span>{label}</li>)}</ol><div className="checkout-layout"><section className="checkout-panel"><h2>Demo item summary</h2><CheckoutItems items={order.items}/><h2>Selected address</h2><AddressDetails address={order.address}/>{order.instructions&&<p>Instructions: {order.instructions}</p>}<p>Payment method: COD Ã‚Â· No payment collected</p><div className="checkout-actions"><SecondaryButton to={ordersPath+"/"+encodeURIComponent(order.id)}>View Demo Order Details</SecondaryButton><SecondaryButton to={ordersPath}>View Demo Orders</SecondaryButton><PrimaryButton to="/shop">Continue Shopping</PrimaryButton></div><p className="quiet-note">This demo reference and its recorded history are cleared on refresh or logout.</p></section><aside className="checkout-summary"><h2>Demo totals</h2><CheckoutTotals summary={order} settings={order}/></aside></div></Container>;
}




export default function OrderSuccessPage(props){const {state}=useStorefront();return apiMode&&!state.checkoutFixture?<Suspense fallback={<p role="status">Loading your order…</p>}><LiveOrderConfirmation/></Suspense>:<DemoOrderSuccessPage {...props}/>;}

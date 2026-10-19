import {apiMode} from '../services/catalogueApi';
import {lazy,Suspense} from 'react';
const LiveCheckout=lazy(()=>import('./LiveCommerce').then(m=>({default:m.LiveCheckout}))); 
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Leaf, MapPin, Banknote, CreditCard, ArrowRight } from 'lucide-react';
import { Container, PrimaryButton, SecondaryButton, ModalShell, Breadcrumbs } from '../components/ui';
import { LoadingState, ErrorState } from '../components/ui/PageStates';
import AddressForm from '../components/account/AddressForm';
import { CheckoutItems, CheckoutTotals, AddressDetails } from '../components/checkout/CheckoutParts';
import { useStorefront } from '../state/StorefrontContext';
import { sessionAddresses, defaultDemoAddress } from '../services/customerService';
import { checkoutEligibility } from '../services/checkoutService';
import { checkoutNotice, checkoutSteps } from '../mock-data/checkout';
import '../styles/checkout.css';

function CheckoutFlow({successBase,editCartPath}) {
 const {state,dispatch}=useStorefront();const navigate=useNavigate();
 const [step,setStep]=useState(0);const [editing,setEditing]=useState(undefined);
 const [instructions,setInstructions]=useState(()=>sessionAddresses(state.session).find(item=>item.id===state.session.deliveryAddressId)?.instructions || '');const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);const lock=useRef(false);const request=useRef(null);const heading=useRef(null);
 const {settings,summary,address,addressValid,reason,eligible}=checkoutEligibility(state);
 const addresses=sessionAddresses(state.session);
 useEffect(()=>{heading.current?.focus();},[step]);
 useEffect(()=>{if(step>0&&!addressValid)setStep(0);},[addressValid,step]);
 useEffect(()=>{
  if(!request.current)return;
  const order=state.session.orders?.find(item=>item.requestId===request.current);
  if(order){navigate(successBase+'/'+order.id,{replace:true});return;}
  if(state.checkoutError){setMessage(state.checkoutError);setBusy(false);lock.current=false;request.current=null;}
 },[state,navigate,successBase]);
 const commit=values=>dispatch({type:'session/addresses',sessionId:state.session.instanceId,addresses:values});
 const select=selected=>{dispatch({type:'session/address-select',id:selected.id});setInstructions(selected.instructions || '');};
 const submit=()=>{
  if(lock.current)return;
  if(!eligible){setMessage(reason);return;}
  lock.current=true;setBusy(true);setMessage('');request.current=crypto.randomUUID();
  dispatch({type:'checkout/place',sessionId:state.session.instanceId,requestId:request.current,instructions,paymentMethod:'cod'});
 };
 return <Container className="page-section checkout-page">
  <Breadcrumbs items={[{label:'Home',to:'/'},{label:'Cart',to:editCartPath},{label:'Checkout'}]}/>
  <header className="checkout-heading"><div><p className="eyebrow">YOUR EVERYDAY VIRASAT</p><h1>A thoughtful finish.</h1><p>Review your essentials, one considered step at a time.</p></div><Leaf size={48} strokeWidth={.8} aria-hidden="true"/></header>
  <p className="checkout-demo-notice"><strong>STATIC DEMO Ãƒâ€šÃ‚Â· Unverified customer identity</strong><br/>{checkoutNotice}</p>
  <ol className="checkout-progress" aria-label="Checkout progress">{checkoutSteps.map((label,index)=><li key={label} aria-current={step===index?'step':undefined} className={index<step?'is-complete':''}><span>{String(index+1).padStart(2,'0')}</span>{label}</li>)}</ol>
  <div className="checkout-layout"><section className="checkout-panel" aria-labelledby="checkout-step-title">
   <p className="eyebrow">STEP {step+1} OF 4</p><h2 id="checkout-step-title" tabIndex={-1} ref={heading}>{checkoutSteps[step]}</h2>
   {step===0&&<>
    <p className="checkout-muted">Use demo details. Selecting an address does not confirm delivery coverage.</p>
    <div className="checkout-address-heading"><MapPin size={20} aria-hidden="true"/><h3>Your saved addresses</h3><SecondaryButton onClick={()=>setEditing(null)}>Add address</SecondaryButton></div>
    {!addresses.length&&<div className="checkout-empty"><h3>Where should your essentials go?</h3><p>Add a demo address to explore the next step.</p></div>}
    <fieldset className="checkout-addresses"><legend className="sr-only">Choose delivery address</legend>{addresses.map(item=><article className={'checkout-address '+(address?.id===item.id?'is-selected':'')} key={item.id}>
     <label className="checkout-address-choice"><input type="radio" name="delivery-address" checked={address?.id===item.id} onChange={()=>select(item)}/><span>{item.type}{item.isDefault?' Ãƒâ€šÃ‚Â· Default':''} Ãƒâ€šÃ‚Â· {item.recipient}</span></label>
     <AddressDetails address={item}/><div className="account-actions"><SecondaryButton onClick={()=>setEditing(item)}>Edit {item.type}</SecondaryButton>{!item.isDefault&&<SecondaryButton onClick={async()=>{try{commit(await defaultDemoAddress(state.session,item.id));setMessage('Default updated in this demo session.');}catch(error){setMessage(error.message);}}}>Make default</SecondaryButton>}</div>
    </article>)}</fieldset>
    <label className="checkout-instructions" htmlFor="checkout-instructions">Delivery instructions (optional)<textarea id="checkout-instructions" rows={3} maxLength={200} value={instructions} onChange={event=>setInstructions(event.target.value)} placeholder="Use demo instructions only"/></label>
    <PrimaryButton disabled={!addressValid} onClick={()=>{setMessage('');setStep(1);}}>Continue to order review <ArrowRight size={16}/></PrimaryButton>
   </>}
   {step===1&&<>
    {summary.items.length?<CheckoutItems items={summary.items}/>:<div className="checkout-empty"><h3>Your basket is waiting.</h3><p>No eligible products have been added.</p></div>}
    <SecondaryButton to={editCartPath}>Edit Cart</SecondaryButton>
    {address&&<div className="checkout-review-address"><p className="eyebrow">DELIVERY ADDRESS Ãƒâ€šÃ‚Â· UNVERIFIED</p><AddressDetails address={address}/>{instructions&&<p>Instructions: {instructions}</p>}</div>}
    {!summary.canCheckout&&<p className="checkout-warning" role="status">{summary.reason}</p>}
    <div className="checkout-actions"><SecondaryButton onClick={()=>setStep(0)}>Back to address</SecondaryButton><PrimaryButton disabled={!summary.canCheckout} onClick={()=>{setMessage('');setStep(2);}}>Continue to payment</PrimaryButton></div>
   </>}
   {step===2&&<>
    <fieldset className="checkout-payment"><legend>Choose a payment method</legend><label className={settings.codEnabled?'is-selected':''}><input type="radio" name="payment" value="cod" checked={!!settings.codEnabled} disabled={!settings.codEnabled} readOnly/><Banknote size={24} aria-hidden="true"/><span><strong>Cash on Delivery</strong><small>{settings.codEnabled?'Selected for this illustrative flow.':'Not configured'}</small></span></label><label><input type="radio" name="payment" disabled/><CreditCard size={24} aria-hidden="true"/><span><strong>Online Payment</strong><small>Coming Soon</small></span></label></fieldset>
    <p className="checkout-muted">COD normally means paying on delivery. Here it is only a demo choice: no payment is collected and no delivery is arranged.</p>
    {reason&&<p className="checkout-warning" role="status">{reason}</p>}
    <div className="checkout-actions"><SecondaryButton disabled={busy} onClick={()=>setStep(1)}>Back to review</SecondaryButton><PrimaryButton disabled={!eligible} loading={busy} onClick={submit}>Place Demo Order</PrimaryButton></div>
   </>}
   <p className="checkout-feedback" role="status" aria-live="polite">{message}</p>
  </section>
  <aside className="checkout-summary" aria-label="Checkout order summary"><p className="eyebrow">A LITTLE EVERYDAY GOODNESS</p><h2>Your order summary</h2><p>{summary.items.reduce((sum,item)=>sum+item.quantity,0)} items Ãƒâ€šÃ‚Â· Local preview</p><CheckoutTotals summary={summary} settings={settings}/>{summary.total===null&&<p className="checkout-warning">Pricing or charges are unconfigured. A final payable total cannot be shown.</p>}<p className="quiet-note">All calculations are illustrative and client-side. No order is submitted to the business.</p><SecondaryButton to={editCartPath}>Edit Cart</SecondaryButton><div className="checkout-signoff">Rooted in tradition.<br/><em>Considered for your everyday.</em></div></aside></div>
  <ModalShell open={editing!==undefined} onClose={()=>setEditing(undefined)} title={editing?'Edit address':'Add address'} className="address-modal">{editing!==undefined&&<AddressForm key={editing?.id||'new'} address={editing} onCancel={()=>setEditing(undefined)} onSave={values=>{commit(values);if(editing?.id===address?.id)setInstructions(values.find(item=>item.id===address.id)?.instructions || '');setEditing(undefined);setMessage('Address saved in this demo session. Select it to continue.');}}/>}</ModalShell>
 </Container>;
}
export default function CheckoutPreview({successBase='/order-success',editCartPath='/cart',fixture=false}) {
 const {state,loading,error,retry}=useStorefront();
 if(apiMode&&!fixture)return <Suspense fallback={<LoadingState/>}><LiveCheckout/></Suspense>;
 if(state.session.mode!=='demo')return fixture?<Container className="page-section"><h1>Explore demo checkout.</h1><p>Begin an isolated, unverified demo session from the preview controls above.</p></Container>:<Navigate to="/login?returnTo=%2Fcheckout" replace/>;
 if(loading)return <LoadingState/>;
 if(error)return <ErrorState retry={retry}/>;
 return <CheckoutFlow key={state.session.instanceId} successBase={successBase} editCartPath={editCartPath}/>;
}



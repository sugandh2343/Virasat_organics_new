import {apiMode} from '../../services/catalogueApi';
import {checkDelivery as liveCheck} from '../../services/commerceApi';
import { subscribeMock } from '../../services/mockStore';
import { useEffect, useId, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from '../ui';
import { useStorefront } from '../../state/StorefrontContext';
import { checkDelivery, isValidPin } from '../../services/deliveryService';
import { deliverySettings } from '../../mock-data/delivery';
function DemoDeliveryPreview() {
 const {state,dispatch}=useStorefront();
 const [pin,setPin]=useState(state.location?.postalCode || '');
 const [result,setResult]=useState(null);
 const [pending,setPending]=useState(false);
 const request=useRef(0);
 const input=useRef(null);
 const id=useId();
 useEffect(()=>subscribeMock(()=>{request.current++;setResult(null);setPending(false);}),[]);
 useEffect(()=>()=>{request.current++;},[]);
 useEffect(()=>{const next=state.location?.postalCode||'';if(pin!==next){request.current++;setPin(next);setResult(null);setPending(false);}},[state.location?.postalCode]);
 const edit=value=>{request.current++;setPending(false);setPin(value);setResult(null);};
 async function check(event) {
  event.preventDefault();
  const version=++request.current;
  setPending(true);setResult(null);
  try {
   const next=await checkDelivery(pin);
   if(version!==request.current)return;
   setResult(next);
   if(isValidPin(next.postalCode))dispatch({type:'location/set',value:{postalCode:next.postalCode}});
  } catch {if(version===request.current)setResult({status:'error',message:deliverySettings.messages.error});}
  finally {if(version===request.current)setPending(false);}
 }
 return <section className="product-delivery" aria-labelledby={id+'title'}><MapPin size={20} aria-hidden="true"/><div className="delivery-content"><h2 id={id+'title'}>Check delivery availability</h2><p>Static preview only Â· no live delivery check.</p>
 <form onSubmit={check} noValidate><label htmlFor={id+'pin'}>PIN code</label><div className="delivery-input-row"><input ref={input} id={id+'pin'} inputMode="numeric" autoComplete="postal-code" maxLength={6} value={pin} onChange={event=>edit(event.target.value)} aria-invalid={result?.status==='invalid'||undefined} aria-describedby={id+'message'} placeholder="Six-digit PIN"/><PrimaryButton type="submit" loading={pending}>Check</PrimaryButton></div></form>
 <p id={id+'message'} role="status">{pending?'Checking static settingsâ€¦':result?.message || deliverySettings.messages.idle}</p>
 {pin&&<SecondaryButton onClick={()=>{edit('');dispatch({type:'location/set',value:null});input.current?.focus();}}>Change PIN</SecondaryButton>}
 <SecondaryButton onClick={()=>dispatch({type:'overlay/set',value:'location'})}>Choose delivery location</SecondaryButton><p className="quiet-note">A valid checked PIN is saved only in this browser. No delivery dates or charges are confirmed.</p></div></section>;
}



function LiveDeliveryPreview(){
 const [pin,setPin]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);const generation=useRef(0);
 useEffect(()=>()=>{generation.current++;},[]);
 return <section className="product-delivery"><MapPin size={20} aria-hidden="true"/><div className="delivery-content"><h2>Check delivery availability</h2><p>Coverage is checked against configured delivery zones. A map location alone does not confirm delivery.</p><form onSubmit={async e=>{e.preventDefault();if(busy)return;const epoch=++generation.current;setBusy(true);setMessage('');try{const result=await liveCheck(pin);if(epoch===generation.current)setMessage(result.serviceable?'This PIN is in a configured delivery zone. Final charges and COD eligibility are confirmed at checkout.':'Delivery is unavailable.');}catch(e){if(epoch===generation.current)setMessage(e.message);}finally{if(epoch===generation.current)setBusy(false);}}}><label>PIN code<input inputMode="numeric" maxLength={6} pattern="[1-9][0-9]{5}" required value={pin} disabled={busy} onChange={e=>{setPin(e.target.value);setMessage('');}}/></label><PrimaryButton type="submit" loading={busy}>Check</PrimaryButton></form><p role="status">{message}</p></div></section>;
}
export default function DeliveryPreview(){return apiMode?<LiveDeliveryPreview/>:<DemoDeliveryPreview/>;}

import { useId, useState, useRef, useEffect } from 'react';
import { PrimaryButton, SecondaryButton } from '../ui';
import { useStorefront } from '../../state/StorefrontContext';
import { addressFields } from '../../mock-data/account';
import { saveDemoAddress } from '../../services/customerService';
import { LocationSelector } from './LocationSelector';
import '../../styles/account.css';
export default function AddressForm({address,onSave,onCancel,saveHandler}){
 const requestKey=useRef(crypto.randomUUID());
 const {state,customer}=useStorefront();const id=useId();const form=useRef(null);
 const [value,setValue]=useState(address || {type:'Home',recipient:'',phone:state.session.profile.mobile,...Object.fromEntries(addressFields.filter(([key])=>key!=='phone').map(([key])=>[key,'']))});
 const [errors,setErrors]=useState({});const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [location,setLocation]=useState(false);
 useEffect(()=>{if(Object.keys(errors).some(key=>errors[key]))form.current?.querySelector('[aria-invalid="true"]')?.focus();},[errors]);
 return <form ref={form} className="account-form" noValidate onSubmit={async event=>{event.preventDefault();setBusy(true);try{const addresses=await (saveHandler?saveHandler(value,requestKey.current):saveDemoAddress(state.session,value,address?.id));onSave(addresses);}catch(error){setErrors(error.fields||{});setMessage(error.message);}finally{setBusy(false);}}}><label htmlFor={id+'type'}>Address type<select id={id+'type'} value={value.type} onChange={event=>setValue({...value,type:event.target.value})}>{['Home','Work','Other'].map(type=><option key={type}>{type}</option>)}</select></label>
 <div className="address-fields">{addressFields.map(([key,label,required])=><label key={key} htmlFor={id+key}>{label}{required?' *':' (optional)'}<input aria-label={label+(required?' *':' (optional)')} id={id+key} value={value[key]||''} maxLength={key==='postalCode'?6:200} inputMode={key==='postalCode'?'numeric':key==='phone'?'tel':undefined} onChange={event=>{requestKey.current=crypto.randomUUID();setValue({...value,[key]:event.target.value,...(['line1','line2','locality','city','state','postalCode'].includes(key)?{latitude:null,longitude:null,coordinatesConfirmed:false}:{})});}} aria-invalid={!!errors[key]} aria-describedby={errors[key]?id+key+'error':undefined}/>{errors[key]&&<span className="field-error" id={id+key+'error'}>{errors[key]}</span>}</label>)}</div><p>Country: India · Address is unverified.</p>
 <SecondaryButton onClick={()=>setLocation(!location)}>{location?'Hide':'Choose'} location tools</SecondaryButton>{location&&<div className="address-location-tools" onKeyDown={event=>{if(event.key==="Enter" && event.target.tagName==="INPUT")event.preventDefault();}}><LocationSelector embedded initialPin={value.postalCode} onSelect={selection=>{requestKey.current=crypto.randomUUID();setValue({...value,...selection});setLocation(false);}}/></div>}
 <p role="status">{message}</p><div className="account-actions"><PrimaryButton type="submit" loading={busy}>Save address</PrimaryButton><SecondaryButton onClick={onCancel}>Cancel</SecondaryButton></div></form>;
}



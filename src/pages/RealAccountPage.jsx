import {LiveOrders} from './LiveCommerce';
import { useState } from 'react';
import { Navigate,NavLink,useLocation } from 'react-router-dom';
import { Container,PrimaryButton,SecondaryButton,ModalShell,EmptyState } from '../components/ui';
import { useStorefront } from '../state/StorefrontContext';
import { accountNavigation } from '../mock-data/account';
import AddressForm from '../components/account/AddressForm';
import { addressFields } from '../mock-data/account';
function Profile({customer}){
 const [value,setValue]=useState(customer.session.profile),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 return <><h1>My Profile</h1><p>Your mobile is verified. Changing it requires a separate verification process.</p><form className="account-form" onSubmit={async e=>{e.preventDefault();setBusy(true);try{await customer.saveProfile(value);setMessage('Profile saved.');}catch(e){setMessage(e.message);}finally{setBusy(false);}}}>
 <label>Full name (optional)<input maxLength={80} value={value.name} onChange={e=>setValue({...value,name:e.target.value})}/></label><label>Verified mobile<input value={'+91 '+value.mobile} readOnly/></label><label>Email (optional, not verified)<input type="email" maxLength={254} value={value.email} onChange={e=>setValue({...value,email:e.target.value})}/></label><p>Member since {value.createdAt}</p><PrimaryButton type="submit" loading={busy}>Save profile</PrimaryButton><p role="status">{message}</p></form></>;
}
function Addresses({customer,dispatch}){
 const [editing,setEditing]=useState(undefined),[deleting,setDeleting]=useState(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const addresses=customer.session.addresses;
 async function action(fn){if(busy)return;setBusy(true);setMessage('');try{await fn();}catch(e){setMessage(e.message);}finally{setBusy(false);}}
 return <><div className="account-title-row"><h1>My Addresses</h1><SecondaryButton onClick={()=>setEditing(null)}>Add address</SecondaryButton></div><p>Saved securely to your account. An address does not confirm delivery coverage.</p><p role="status">{message}</p>
 <div className="address-grid">{addresses.map(a=><article className="account-card" key={a.id}><p className="eyebrow">{a.type}{a.isDefault?' Â· Default':''}</p><h2>{a.recipient}</h2><p>{a.line1}, {a.line2}, {a.locality}</p><p>{a.city}, {a.state} {a.postalCode}</p><p>{a.phone}</p><div className="account-actions"><SecondaryButton onClick={()=>setEditing(a)}>Edit {a.type}</SecondaryButton><SecondaryButton onClick={()=>setDeleting(a)}>Delete {a.type}</SecondaryButton>{!a.isDefault&&<SecondaryButton disabled={busy} onClick={()=>action(()=>customer.saveAddress({isDefault:true},a.id,a.version))}>Make default</SecondaryButton>}<PrimaryButton onClick={()=>{dispatch({type:'session/address-select',id:a.id});setMessage('Address selected. Delivery coverage is not confirmed.');}}>{customer.session.deliveryAddressId===a.id?'Selected for delivery':'Select for delivery'}</PrimaryButton></div></article>)}</div>
 {!addresses.length&&<EmptyState title="A place for your everyday essentials." description="Add your first delivery address."/>}
 <ModalShell open={editing!==undefined} onClose={()=>setEditing(undefined)} title={editing?'Edit address':'Add address'} className="address-modal">{editing!==undefined&&<AddressForm key={editing?.id||'new'} address={editing} onCancel={()=>setEditing(undefined)} saveHandler={(value,key)=>{const body=Object.fromEntries([...addressFields.map(([k])=>k),'type','latitude','longitude','coordinatesConfirmed'].filter(k=>value[k]!==undefined).map(k=>[k,value[k]]));return customer.saveAddress(body,editing?.id,editing?.version,key);}} onSave={()=>{setEditing(undefined);setMessage('Address saved.');}}/>}</ModalShell>
 <ModalShell open={!!deleting} onClose={()=>setDeleting(null)} title="Delete this address?" footer={<><SecondaryButton onClick={()=>setDeleting(null)}>Keep address</SecondaryButton><PrimaryButton loading={busy} onClick={()=>action(async()=>{await customer.deleteAddress(deleting.id,deleting.version);setDeleting(null);setMessage('Address deleted.');})}>Delete address</PrimaryButton></>}/></>;
}
export default function RealAccountPage(){
 const {customer,dispatch}=useStorefront();const {pathname}=useLocation();
 if(customer.loading)return <Container className="page-section"><p role="status">Loading your accountâ€¦</p></Container>;
 if(customer.error)return <Container className="page-section"><p role="alert">{customer.error}</p><SecondaryButton onClick={customer.refresh}>Retry account connection</SecondaryButton></Container>;
 if(customer.session.mode!=='authenticated')return <Navigate to={'/login?returnTo='+encodeURIComponent(pathname)} replace/>;
 const profile=customer.session.profile;
 return <Container className="page-section customer-account"><div className="account-layout"><aside className="account-sidebar"><nav aria-label="Customer navigation">{accountNavigation.map(([to,label])=><NavLink key={to} to={to} end={to==='/account'}>{label}</NavLink>)}</nav><SecondaryButton onClick={()=>customer.logout().catch(()=>{})}>Logout</SecondaryButton></aside><section className="account-content">{pathname==='/account/profile'?<Profile customer={customer}/>:pathname==='/account/addresses'?<Addresses customer={customer} dispatch={dispatch}/>:pathname.startsWith('/account/orders')?<LiveOrders/>:<><p className="eyebrow">YOUR EVERYDAY VIRASAT</p><h1>Welcome{profile.name?', '+profile.name:''}.</h1><div className="account-dashboard-grid"><article className="account-card"><h2>Your profile</h2><p>+91 {profile.mobile} Â· Verified</p><SecondaryButton to="/account/profile">Edit profile</SecondaryButton></article><article className="account-card"><h2>Saved addresses</h2><p>{customer.session.addresses.length} saved</p><SecondaryButton to="/account/addresses">Manage addresses</SecondaryButton></article></div></>}</section></div></Container>;
}

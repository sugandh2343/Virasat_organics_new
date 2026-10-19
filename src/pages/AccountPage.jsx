import { lazy,Suspense } from 'react';
const RealAccountPage=lazy(()=>import('./RealAccountPage'));
import { OrderHistory,OrderDetail,RecentDemoOrders } from '../components/orders/OrderScreens';
import { useId,useState } from 'react';
import { NavLink,Navigate,useLocation } from 'react-router-dom';
import { Container,PrimaryButton,SecondaryButton,ModalShell,EmptyState } from '../components/ui';

import { useStorefront } from '../state/StorefrontContext';
import { accountNavigation } from '../mock-data/account';
import { sessionAddresses,saveDemoProfile,deleteDemoAddress,defaultDemoAddress } from '../services/customerService';
import AddressForm from '../components/account/AddressForm';
import '../styles/account.css';
function Profile(){
 const {state,dispatch}=useStorefront();const [value,setValue]=useState({...state.session.profile});const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const id=useId();
 return <><h1>My Profile</h1><p>Your mobile number remains unverified. Use demo details.</p><form className="account-form" noValidate onSubmit={async event=>{event.preventDefault();setBusy(true);try{const profile=await saveDemoProfile(state.session,value);dispatch({type:'session/profile',sessionId:state.session.instanceId,profile});setMessage('Saved in this demo session. Mobile number is not verified.');}catch(error){setMessage(error.message);}finally{setBusy(false);}}}>{[['name','Full name'],['mobile','Mobile number · unverified'],['email','Email (optional)']].map(([key,label])=><label key={key} htmlFor={id+key}>{label}<input id={id+key} type={key==='email'?'email':key==='mobile'?'tel':'text'} value={value[key]||''} maxLength={key==='email'?254:80} onChange={event=>setValue({...value,[key]:event.target.value})} aria-describedby={id+'message'}/></label>)}<PrimaryButton type="submit" loading={busy}>Save profile</PrimaryButton><p id={id+'message'} role="status">{message}</p></form></>;
}
function Addresses(){
 const {state,dispatch}=useStorefront();const addresses=sessionAddresses(state.session);const [editing,setEditing]=useState(undefined);const [deleting,setDeleting]=useState(null);const [message,setMessage]=useState('');
 const commit=values=>dispatch({type:'session/addresses',sessionId:state.session.instanceId,addresses:values});
 return <><div className="account-title-row"><h1>My Addresses</h1><SecondaryButton onClick={()=>setEditing(null)}>Add address</SecondaryButton></div><p>Session-only demo addresses. Nothing is verified or sent to a server.</p><p role="status">{message}</p>
 {addresses.length?<div className="address-grid">{addresses.map(address=><article className="account-card" key={address.id}><p className="eyebrow">{address.type}{address.isDefault?' · Default':''}</p><h2>{address.recipient}</h2><p>{address.line1}, {address.line2}</p><p>{address.locality}, {address.city}, {address.state} {address.postalCode}</p><p>India · {address.phone}</p>{address.landmark&&<p>Landmark: {address.landmark}</p>}{address.instructions&&<p>{address.instructions}</p>}<div className="account-actions"><SecondaryButton onClick={()=>setEditing(address)}>Edit {address.type}</SecondaryButton><SecondaryButton onClick={()=>setDeleting(address)}>Delete {address.type}</SecondaryButton>{!address.isDefault&&<SecondaryButton onClick={async()=>{try{commit(await defaultDemoAddress(state.session,address.id));setMessage('Default address updated in this demo session.');}catch(error){setMessage(error.message);}}}>Make default</SecondaryButton>}<PrimaryButton disabled={state.session.deliveryAddressId===address.id} onClick={()=>{dispatch({type:'session/address-select',id:address.id});setMessage('Delivery address selected for this demo. Coverage is not confirmed.');}}>{state.session.deliveryAddressId===address.id?'Selected for delivery':'Select for delivery'}</PrimaryButton></div></article>)}</div>:<EmptyState title="A place for your everyday essentials." description="Add your first demo delivery address."/>}
 <ModalShell open={editing!==undefined} onClose={()=>setEditing(undefined)} title={editing?'Edit address':'Add address'} className="address-modal">{editing!==undefined&&<AddressForm key={editing?.id||'new'} address={editing} onCancel={()=>setEditing(undefined)} onSave={values=>{commit(values);setEditing(undefined);setMessage('Address saved in this demo session.');}}/>}</ModalShell>
 <ModalShell open={!!deleting} onClose={()=>setDeleting(null)} title="Delete this address?" description="This removes the address from your current demo session." footer={<><SecondaryButton onClick={()=>setDeleting(null)}>Keep address</SecondaryButton><PrimaryButton onClick={async()=>{try{commit(await deleteDemoAddress(state.session,deleting.id));setDeleting(null);setMessage('Address deleted from this demo session.');}catch(error){setMessage(error.message);}}}>Delete address</PrimaryButton></>}/></>;
}
function Overview({basePath='/account'}){
 const {state}=useStorefront();const profile=state.session.profile;const addresses=sessionAddresses(state.session);
 return <><p className="eyebrow">YOUR EVERYDAY VIRASAT</p><h1>Welcome{profile.name?', '+profile.name:''}.</h1><div className="account-dashboard-grid"><article className="account-card"><h2>Your profile</h2><p>{profile.name||'Demo Customer'}</p><p>{profile.mobile?'+91 '+profile.mobile+' · unverified':'No mobile number configured.'}</p>{profile.email&&<p>{profile.email}</p>}<SecondaryButton to={basePath+'/profile'}>Edit profile</SecondaryButton></article><article className="account-card"><h2>Saved addresses</h2><p>{addresses.length} in this demo session</p><SecondaryButton to={basePath+'/addresses'}>Manage addresses</SecondaryButton></article><RecentDemoOrders basePath={basePath}/></div><div className="account-actions">{accountNavigation.slice(1).map(([to,label])=><SecondaryButton key={to} to={to.startsWith('/account')?basePath+to.slice(8):to}>{label}</SecondaryButton>)}</div></>;
}
export default function AccountPage({basePath='/account',cartPath='/cart',fixture=false}){
 const {state,dispatch,customer}=useStorefront();const {pathname}=useLocation();
 if(customer.enabled&&!fixture)return <Suspense fallback={<p role="status">Loading your account…</p>}><RealAccountPage/></Suspense>;
 if(state.session.mode!=='demo' && fixture)return <Container className='page-section'><EmptyState title='Start an isolated demo session.' description='Use the preview controls above. No orders are loaded for guests.'/></Container>;
 if(state.session.mode!=='demo')return <Navigate to={'/login?returnTo='+encodeURIComponent(pathname)} replace/>;
 return <Container className="page-section customer-account" key={state.session.instanceId}><p className="auth-demo-label">Demo Customer · identity not verified</p><p className="quiet-note">Profile, addresses and demo orders are cleared on refresh or logout. Use demo details.</p><div className="account-layout"><aside className="account-sidebar"><nav aria-label="Customer navigation">{accountNavigation.map(([to,label])=><NavLink key={to} to={to.startsWith('/account')?basePath+to.slice(8):to} end={to==='/account'}>{label}</NavLink>)}</nav><SecondaryButton onClick={()=>dispatch({type:'session/clear'})}>Logout</SecondaryButton></aside><section className="account-content">{pathname===basePath?<Overview basePath={basePath}/>:pathname===basePath+'/profile'?<Profile/>:pathname===basePath+'/addresses'?<Addresses/>:pathname===basePath+'/orders'?<OrderHistory basePath={basePath}/>:<OrderDetail basePath={basePath} cartPath={cartPath}/>}</section></div></Container>;
}








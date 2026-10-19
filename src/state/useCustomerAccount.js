import { useState,useEffect,useRef,useCallback } from 'react';
import * as api from '../services/customerApi';
import { signOutFirebase } from '../services/firebasePhone';
const guest={mode:'guest',customerId:null};
export function useCustomerAccount(enabled,rawDispatch){
 const [session,setSession]=useState(guest);const [wishlist,setWishlist]=useState([]);
 const [loading,setLoading]=useState(enabled);const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [actionError,setActionError]=useState('');
 const generation=useRef(0);const current=useRef(session);current.current=session;const pending=useRef(false);
 const clear=useCallback(()=>{generation.current++;setSession(guest);setWishlist([]);setActionError('');setLoading(false);},[]);
 const hydrate=useCallback(async(profile,epoch)=>{
  const [addresses,ids]=await Promise.all([api.loadAddresses(),api.loadWishlist()]);
  if(epoch!==generation.current)return;
  setSession(previous=>({mode:'authenticated',customerId:profile.id,instanceId:profile.id,verified:true,profile,addresses,deliveryAddressId:previous.customerId===profile.id&&addresses.some(a=>a.id===previous.deliveryAddressId)?previous.deliveryAddressId:null}));setWishlist(ids);
 },[]);
 const refresh=useCallback(async()=>{
  if(!enabled)return;const epoch=++generation.current;setLoading(true);setError('');
  try{const profile=await api.restoreCustomer();await hydrate(profile,epoch);}catch(e){if(epoch===generation.current){setSession(guest);setWishlist([]);setError(e.status===401?'':e.status===404?'Customer APIs are not deployed yet. Complete the Phase 7C backend upload.':e.message);}}
  finally{if(epoch===generation.current)setLoading(false);}
 },[enabled,hydrate]);
 useEffect(()=>{if(!enabled)return;refresh();const off=api.subscribeCustomerExpiry(clear);window.addEventListener('focus',refresh);return()=>{generation.current++;off();window.removeEventListener('focus',refresh);};},[enabled,refresh,clear]);
 async function login(token){const epoch=++generation.current;setError('');try{const profile=await api.exchangeFirebase(token);await hydrate(profile,epoch);if(epoch!==generation.current)throw new Error('Sign-in was interrupted. Try again.');}finally{await signOutFirebase();}}
 async function logout(){setError('');try{await api.logoutCustomer();clear();await signOutFirebase();rawDispatch({type:'location/set',value:null});}catch(e){setError(e.message);setActionError(e.message);throw e;}}
 async function mutate(fn,apply){const epoch=generation.current;setError('');const value=await fn();if(epoch!==generation.current)throw new Error('Your session changed. Please reload.');apply(value);return value;}
 async function commitAddresses(fn){
  return mutate(async()=>({addresses:await fn(),profile:await api.restoreCustomer()}),({addresses,profile})=>{
   const previous=current.current;const selected=addresses.find(a=>a.id===previous.deliveryAddressId);
   if(previous.deliveryAddressId)rawDispatch({type:'location/set',value:selected?{postalCode:selected.postalCode}:null});
   setSession(s=>({...s,profile,addresses,deliveryAddressId:selected?.id||null}));
  });
 }
 const account={enabled,session,wishlist,loading,error,actionError,busy,refresh,login,logout,
  saveProfile:value=>mutate(()=>api.patchProfile(value,current.current.profile.version),profile=>setSession(s=>({...s,profile}))),
  saveAddress:(value,id,version,key)=>commitAddresses(()=>api.saveAddress(value,id,version,key)),
  deleteAddress:(id,version)=>commitAddresses(()=>api.deleteAddress(id,version)),
 };
 function dispatch(action){
  if(!enabled)return rawDispatch(action);
  if(action.type==='session/demo'||action.type==='session/profile'||action.type==='session/addresses')return;
  if(action.type==='session/clear'){void logout().catch(()=>{});return;}
  if(action.type==='session/address-select'){
   const address=current.current.addresses?.find(a=>a.id===action.id);if(address){setSession(s=>({...s,deliveryAddressId:address.id}));rawDispatch({type:'location/set',value:{postalCode:address.postalCode}});}return;
  }
  if(action.type==='wishlist/toggle'){
   if(current.current.mode!=='authenticated'){rawDispatch({type:'overlay/set',value:'auth'});return;}
   if(pending.current)return;pending.current=true;setBusy(true);setActionError('');
   void mutate(()=>api.setWishlist(action.id,wishlist.includes(action.id)),setWishlist).catch(e=>setActionError(e.message)).finally(()=>{pending.current=false;setBusy(false);});return;
  }
  rawDispatch(action);
 }
 const dispatchRef=useRef(dispatch);dispatchRef.current=dispatch;
 const stableDispatch=useCallback(action=>dispatchRef.current(action),[]);
 return {...account,dispatch:enabled?stableDispatch:rawDispatch};
}

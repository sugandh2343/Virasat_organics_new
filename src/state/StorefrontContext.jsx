import { apiMode } from '../services/catalogueApi';
import { useCustomerAccount } from './useCustomerAccount';
import { subscribeMock } from '../services/mockStore';
import { createContext, useContext, useEffect, useReducer, useCallback, useRef } from 'react';
import { initialState, sanitizePersisted, storefrontReducer, STORAGE_KEY } from './store';
import { getProducts } from '../services/productService';
const Context = createContext(null);
export function decodeStorage(raw) {try{return sanitizePersisted(JSON.parse(raw));}catch{return sanitizePersisted(null);}}
export function StorefrontProvider({children,storageKey=STORAGE_KEY,developmentFixture=null}) {
 const [state,dispatch]=useReducer(storefrontReducer,initialState,base=>import.meta.env.DEV && developmentFixture ? {...base,...developmentFixture,checkoutFixture:true,ready:true} : base);
 const [status,setStatus]=useReducer((state,patch)=>({...state,...patch}),{loading:!(import.meta.env.DEV && developmentFixture),error:false});
 const isolated=import.meta.env.DEV && !!developmentFixture;
 const customer=useCustomerAccount(apiMode&&!isolated,dispatch);
 const ready=useRef(false);
 const refresh=useCallback(async()=>{
  try {
   if(isolated){setStatus({loading:false,error:false});return;}
   setStatus({loading:!ready.current,error:false});
   const products=await getProducts({includeInactive:true});
   let persisted;
   if(!ready.current){try{persisted=decodeStorage(localStorage.getItem(storageKey));}catch{persisted=sanitizePersisted(null);}}
   dispatch({type:'catalogue/load',products,persisted});
   ready.current=true;setStatus({loading:false,error:false});
  }catch{setStatus({loading:false,error:true});}
 },[storageKey,isolated]);
 useEffect(()=>{if(isolated)return;return subscribeMock(refresh);},[isolated,refresh]);
 useEffect(()=>{refresh();window.addEventListener('focus',refresh);return ()=>window.removeEventListener('focus',refresh);},[refresh]);
 useEffect(()=>{
  if(isolated || !state.ready)return;
  const value=JSON.stringify({cart:state.cart,wishlist:apiMode?[]:state.wishlist,location:apiMode?null:(state.session.deliveryAddressId?null:state.location)});
  try{if(localStorage.getItem(storageKey)!==value)localStorage.setItem(storageKey,value);}catch{/* Memory-only fallback */}
 },[state.cart,state.wishlist,state.location,state.session.deliveryAddressId,state.ready,storageKey,isolated]);
 useEffect(()=>{
  if(isolated)return;
  const sync=event=>{if((event.key===storageKey || event.key===null) && ready.current && event.storageArea===localStorage)dispatch({type:'storage/sync',value:decodeStorage(event.newValue)});};
  window.addEventListener('storage',sync);return ()=>window.removeEventListener('storage',sync);
 },[storageKey,isolated]);
 const setNavigationOpen=useCallback(open=>dispatch({type:'overlay/set',value:open?'navigation':null}),[]);
 return <Context.Provider value={{state:customer.enabled?{...state,session:customer.session,wishlist:customer.wishlist}:state,dispatch:customer.dispatch,customer,setNavigationOpen,catalogue:state.catalogue || [],loading:status.loading,error:status.error,retry:refresh}}>{children}</Context.Provider>;
}
export function useStorefront(){const value=useContext(Context);if(!value)throw new Error('StorefrontProvider is required');return value;}






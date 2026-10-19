import { createApiClient } from './apiClient';
const transport=createApiClient({credentials:'include'});
let csrf=null;
const listeners=new Set();
export const subscribeCustomerExpiry=fn=>{listeners.add(fn);return()=>listeners.delete(fn);};
async function request(path,options){
 try{return (await transport(path,options)).data;}catch(error){
  if(error.status===401||error.code==='CSRF_FAILED'){csrf=null;for(const fn of listeners)fn();}
  throw error;
 }
}
async function write(path,options={}){
 if(!csrf)csrf=(await request('/auth/csrf')).csrfToken;
 return request(path,{...options,csrfToken:csrf});
}
export async function restoreCustomer(){const data=await request('/auth/me');csrf=data.csrfToken;return data.customer;}
export async function exchangeFirebase(idToken){
 csrf=(await request('/auth/csrf')).csrfToken;
 const data=await write('/auth/firebase-session',{method:'POST',body:{idToken}});csrf=data.csrfToken;return data.customer;
}
export async function logoutCustomer(){const data=await write('/auth/logout',{method:'POST',body:{}});csrf=data.csrfToken;}
export const loadAddresses=()=>request('/me/addresses');
export const loadWishlist=()=>request('/me/wishlist');
export const patchProfile=(value,version)=>write('/me',{method:'PATCH',body:{name:value.name,email:value.email},version});
export const saveAddress=(value,id,version,key)=>write('/me/addresses'+(id?'/'+encodeURIComponent(id):''),{method:id?'PATCH':'POST',body:value,version,idempotencyKey:id?undefined:key});
export const deleteAddress=(id,version)=>write('/me/addresses/'+encodeURIComponent(id),{method:'DELETE',version});
export const setWishlist=(id,remove)=>write('/me/wishlist'+(remove?'/'+encodeURIComponent(id):''),{method:remove?'DELETE':'POST',...(remove?{}:{body:{productId:id}})});

export {write as customerWrite};
export async function customerPage(path){try{return await transport(path);}catch(error){if(error.status===401||error.code==='CSRF_FAILED'){csrf=null;for(const fn of listeners)fn();}throw error;}}

import { readMock, updateMockSettings, updateMockRecord } from './mockStore';
// Customer IDs here are fixture selectors, never authorization credentials.
export const getCustomerProfile = () => readMock('customer');
export const getCustomerAddresses = async customerId => (await readMock('addresses')).filter(address => address.customerId === customerId);
export const getCustomerOrders = async customerId => (await readMock('orders')).filter(order => order.customerId === customerId);
export const getCustomerOrder = async (customerId, orderId) => (await getCustomerOrders(customerId)).find(order => order.id === orderId) ?? null;
export const updateCustomerProfile = patch => updateMockSettings('customer', patch);
export const updateCustomerAddress = (id, patch) => updateMockRecord('addresses', id, patch);


import { isValidMobile, normalizeMobile, validateProfile } from './authService';
import { isValidPin, normalizePin } from './deliveryService';
import { addressFields } from '../mock-data/account';
export function validateAddress(value) {
 const errors={};
 for(const [key,label,required] of addressFields){
  const text=String(value[key] ?? '').trim();
  if(required && !text)errors[key]=label+' is required.';
  else if(text.length>200)errors[key]='Use 200 characters or fewer.';
 }
 if(!isValidMobile(value.phone))errors.phone='Enter a valid 10-digit Indian mobile number.';
 if(!isValidPin(value.postalCode))errors.postalCode='Enter a valid six-digit Indian PIN.';
 if(!['Home','Work','Other'].includes(value.type))errors.type='Choose Home, Work or Other.';
 return errors;
}
function requireDemo(session){if(session?.mode!=='demo'||!session.instanceId)throw new Error('Start a demo session first.');}
export function sessionAddresses(session){return (session?.addresses || []).filter(address=>address.sessionId===session.instanceId && address.customerId===session.customerId);}
export async function saveDemoProfile(session,patch){
 requireDemo(session);const error=validateProfile(patch);if(error)throw new Error(error);
 return {name:patch.name.trim(),mobile:normalizeMobile(patch.mobile),email:(patch.email || '').trim()};
}
export async function saveDemoAddress(session,input,id=null){
 requireDemo(session);
 const errors=validateAddress(input);if(Object.keys(errors).length){const error=new Error('Please review the highlighted fields.');error.fields=errors;throw error;}
 const list=sessionAddresses(session);
 const existing=id?list.find(address=>address.id===id):null;
 if(id&&!existing)throw new Error('Address does not belong to this demo session.');
 const values=Object.fromEntries(addressFields.map(([key])=>[key,String(input[key]??'').trim()]));
 const address={...values,id:existing?.id || crypto.randomUUID(),customerId:session.customerId,sessionId:session.instanceId,type:input.type,country:'India',phone:normalizeMobile(input.phone),postalCode:normalizePin(input.postalCode),isDefault:existing?.isDefault || list.length===0};
 return existing?list.map(item=>item.id===id?address:item):[...list,address];
}
export async function deleteDemoAddress(session,id){
 requireDemo(session);const list=sessionAddresses(session);if(!list.some(address=>address.id===id))throw new Error('Address not found in this demo session.');
 const next=list.filter(address=>address.id!==id);if(next.length&&!next.some(address=>address.isDefault))next[0]={...next[0],isDefault:true};return next;
}
export async function defaultDemoAddress(session,id){
 requireDemo(session);const list=sessionAddresses(session);if(!list.some(address=>address.id===id))throw new Error('Address not found in this demo session.');
 return list.map(address=>({...address,isDefault:address.id===id}));
}


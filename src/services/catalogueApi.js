import {notifyDataChange} from './mockStore';
import { createApiClient } from './apiClient';
export const apiMode = import.meta.env.PROD || import.meta.env.VITE_DATA_MODE !== 'mock';
if (import.meta.env.VITE_DATA_MODE && !['mock','api'].includes(import.meta.env.VITE_DATA_MODE)) throw new Error('VITE_DATA_MODE must be mock or api.');
const base=import.meta.env.PROD?'/api':import.meta.env.VITE_API_PROXY_ENABLED==='true'?'/api':(import.meta.env.VITE_API_BASE_URL||'https://virasatorganics.com/api');
const transport=createApiClient({credentials:'include'});
const mediaTransport=createApiClient({credentials:'include',timeoutMs:120000});
const authListeners=new Set();
export const subscribeAdminAuth=listener=>{authListeners.add(listener);return()=>authListeners.delete(listener);};
function invalidateAdmin(){csrf=null;versions.clear();for(const listener of authListeners)listener();}
async function request(path,options){
 try{return await (options?.body instanceof FormData?mediaTransport:transport)(path,options);}
 catch(error){
  if(path.startsWith('/admin/')&&path!=='/admin/login'&&(error.status===401||error.code==='CSRF_FAILED'))invalidateAdmin();
  throw error;
 }
}
let csrf=null;
const versions=new Map();
const remember=(type,item)=>{if(item?.id&&item.version)versions.set(type+'/'+item.id,item.version);return item;};
const mediaURL=value=>value?.startsWith('/api/')?base.replace(/\/api$/,'')+value:value;
export const media=item=>item?{...item,src:mediaURL(item.src),poster:mediaURL(item.poster)}:item;
export const product=item=>item?{...remember('products',item),price:item.pricePaise===null?null:item.pricePaise/100,compareAtPrice:item.compareAtPricePaise===null?null:item.compareAtPricePaise/100,packageSize:item.size,SKU:item.sku,SEO:item.seo,description:item.longDescription||'',images:(item.images||[]).map(media),videos:(item.videos||[]).map(media),relatedProducts:item.relatedProducts?.map(product)}:null;
const category=item=>({...remember('categories',item),productCategory:item.name,image:media(item.image)});
export async function all(path,map=x=>x){
 let page=1,out=[];
 for(;;){const response=await request(path+'?page='+page+'&pageSize=100');out.push(...response.data.map(map));if(!response.meta||out.length>=response.meta.total)break;if(!response.data.length)throw new Error('Incomplete API pagination.');page++;}
 return out;
}
export const publicProducts=()=>all('/products',product);
export async function publicProduct(slug){try{return product((await request('/products/'+encodeURIComponent(slug))).data);}catch(e){if(e.status===404)return null;throw e;}}
export const publicCategories=()=>all('/categories',category);
export async function adminSession(){const data=(await request('/admin/session')).data;csrf=data.csrfToken;return data;}
export async function adminLogin(email,password){await adminSession();const data=(await request('/admin/login',{method:'POST',csrfToken:csrf,body:{email,password}})).data;csrf=data.csrfToken;return data;}
export async function adminLogout(){
 try{if(!csrf)await adminSession();const result=await request('/admin/logout',{method:'POST',csrfToken:csrf,body:{}});invalidateAdmin();return result.data;}
 catch(error){if(error.status===401){invalidateAdmin();return {admin:null};}throw error;}
}
export async function adminCollections(){
 const [products,categories,media]=await Promise.all([all('/admin/products',product),all('/admin/categories',category),all('/admin/media',x=>remember('media',x))]);
 const inventoryActivity=[]; // History is loaded by the independently authorized inventory screen.
 return {products,categories,media:media.map(x=>({...x,src:mediaURL(x.src)})),inventoryActivity};
}
export async function mutate(path,{method='POST',body={},type,id,version,idempotencyKey,notify=true}={}){
 if(!csrf)await adminSession();
 const match=version??(id?versions.get(type+'/'+id):undefined);
 if(id&&match===undefined)throw new Error('Reload this record before saving.');
 const response=await request(path,{method,body:method==='DELETE'?undefined:body,csrfToken:csrf,idempotencyKey:method==='POST'?(idempotencyKey??crypto.randomUUID()):undefined,version:match});
 if(notify)notifyDataChange();
 return response.data;
}
export function paise(value){
 if(value===''||value==null)return null;
 const text=String(value);if(!/^\d+(?:\.\d{1,2})?$/.test(text))throw new Error('Prices require at most two decimal places.');
 const [whole,fraction='']=text.split('.');const result=BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));
 if(result>BigInt(Number.MAX_SAFE_INTEGER))throw new Error('Price exceeds supported range.');return Number(result);
}
export function productBody(value){
 if(value.taxRate!==undefined&&value.taxRate!==''&&value.taxRate!==null)throw new Error('Tax configuration belongs to the future checkout API; leave this field blank.');
 if(value.lowStockThreshold!==undefined&&value.lowStockThreshold!==''&&value.lowStockThreshold!==null)throw new Error('Per-product thresholds are not in the Phase 7A schema; leave this field blank.');
 const body={};
 for(const key of ['name','slug','sku','size','categoryId','status','shortDescription','longDescription','ingredients','nutrition','storage','specifications','seo','keywords','imageIds','videoIds','stockNote'])if(value[key]!==undefined)body[key]=value[key];
 body.pricePaise=paise(value.price);body.compareAtPricePaise=paise(value.compareAtPrice);
 if(value.stock!==undefined)body.stock=value.stock===''||value.stock===null?null:Number(value.stock);
 return body;
}
export const saveProduct=async(value,id)=>product(await mutate('/admin/products'+(id?'/'+id:''),{method:id?'PATCH':'POST',body:productBody(value),type:'products',id,version:value.version}));
export const saveCategory=async(value,id)=>category(await mutate('/admin/categories'+(id?'/'+id:''),{method:id?'PATCH':'POST',type:'categories',id,version:value.version,body:{name:value.name,slug:value.slug,description:value.description||null,status:value.status,sortOrder:Number(value.sortOrder||0),imageId:value.imageId||null}}));
export async function upload(files,{notify=true}={}){const body=new FormData();for(const file of files)body.append('files[]',file);return (await mutate('/admin/media',{body,notify})).map(x=>media(remember('media',x)));}


export {request as adminRequest};

export const rememberMedia=item=>media(remember('media',item));

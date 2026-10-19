import {createApiClient} from './apiClient';
import {all,adminRequest,mutate,media} from './catalogueApi';
const read=createApiClient();
const createKeys=new Map();
function requestKey(scope,value){const key=scope+':'+JSON.stringify(value);if(!createKeys.has(key))createKeys.set(key,crypto.randomUUID());return createKeys.get(key);}
const urls=value=>Array.isArray(value)?value.map(urls):value&&typeof value==='object'?media(Object.fromEntries(Object.entries(value).map(([k,v])=>[k,urls(v)]))):value;
export const publicContent=async path=>urls((await read(path,{cache:'no-cache'})).data);
export async function contentDetail(path){try{return await publicContent(path);}catch(e){if(e.status===404)return null;throw e;}}
export const contentList=async path=>urls(await all(path));
export const blogPage=async({page=1,q='',category=''}={})=>{const v=await read('/blog?'+new URLSearchParams({page,pageSize:12,q,...(category?{category}:{})}));return {...v,data:urls(v.data)};};
const clean=value=>Array.isArray(value)?value.map(clean):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([k])=>!['src','poster','logoSrc','updatedAt','createdAt','publishedAt','localPreview','body'].includes(k)).map(([k,v])=>[k,clean(v)])):value;
const fields=(v,keys)=>Object.fromEntries(keys.filter(k=>v[k]!==undefined).map(k=>[k,clean(v[k])]));
export async function cmsAdminData(kind){
 const settings=['settings','payment','compliance'].includes(kind);
 const mediaList=await all('/admin/media',media);
 if(settings)return {business:(await adminRequest('/admin/settings')).data,media:mediaList,pages:[],blog:[],banners:[]};
 const [pages,blog,banners,categories]=await Promise.all(['pages','blog','banners','blog-categories'].map(k=>all('/admin/'+k)));
 const business=await publicContent('/settings/public');
 const homepage=kind==='homepage'?(await adminRequest('/admin/homepage')).data:null;
 return {homepage,business,pages,blog,banners,categories,media:mediaList};
}
export async function saveHome(value){const result=await mutate('/admin/homepage',{method:'PUT',version:value.version,body:{content:clean({...value,chrome:undefined,publishConfirmed:undefined}),publish:value.publishConfirmed===true}});return {...result,chrome:value.chrome};}
const collection={blogPosts:'blog',cmsPages:'pages',banners:'banners'};
export const saveRecord=(type,value,id)=>mutate('/admin/'+collection[type]+(id?'/'+encodeURIComponent(id):''),{method:id?'PATCH':'POST',idempotencyKey:id?undefined:requestKey(type,value),version:value.version,body:{...fields(value,type==='banners'?['title','name','description','desktop','mobile','alt','ctaLabel','destination','sortOrder','status','publishConfirmed']:['title','slug','description','excerpt','categoryId','image','video','blocks','seo','status','publishConfirmed','authorDisplay']),...(type==='banners'?{sortOrder:Number(value.sortOrder??0)}:{})}});
export const deleteRecord=(type,id,version)=>mutate('/admin/'+collection[type]+'/'+encodeURIComponent(id),{method:'DELETE',version});
export const saveSettings=value=>mutate('/admin/settings',{method:'PUT',version:value.version,body:fields(value,['name','legalName','hindiName','tagline','logoMediaId','logoAlt','introduction','email','phone','whatsapp','address','operatingHours','contactsVisible','announcementEnabled','previewNotice','footerDescriptionVisible','footerNote','store','currency','seo','gstin','fssai','registrationDetails','socialLinks'])});
export const saveBlogCategory=value=>mutate('/admin/blog-categories'+(value.id?'/'+value.id:''),{method:value.id?'PATCH':'POST',idempotencyKey:value.id?undefined:requestKey('blog-category',value),version:value.version,body:fields(value,['name','slug','status'])});
export const deleteBlogCategory=value=>mutate('/admin/blog-categories/'+value.id,{method:'DELETE',version:value.version});

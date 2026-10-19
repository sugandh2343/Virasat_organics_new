export const safeWebUrl=value=>{try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}};
export const safeDestination=value=>typeof value==='string' && (/^\/(?!\/)[a-zA-Z0-9/_?=&%#.-]*$/.test(value)||safeWebUrl(value));
export const validGSTIN=value=>typeof value==='string'&&/^(0[1-9]|[12][0-9]|3[0-8])[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value);
export const validFSSAI=value=>typeof value==='string'&&/^[1-9][0-9]{13}$/.test(value);
export const visibleCompliance=(record,kind)=>record?.visible===true && (kind==='gstin'?validGSTIN(record.value):validFSSAI(record.value));
export function businessDefaults(value={}){
 return {...value,socialLinks:Array.isArray(value.socialLinks)?value.socialLinks:[],socialPlaceholders:Array.isArray(value.socialPlaceholders)?value.socialPlaceholders:[],operatingHours:value.operatingHours || '',registrationDetails:value.registrationDetails || '',announcementEnabled:value.announcementEnabled!==false,footerDescriptionVisible:value.footerDescriptionVisible!==false,contactsVisible:value.contactsVisible!==false,currency:'INR',store:{active:true,acceptOrders:false,...value.store},delivery:{configured:false,serviceablePins:[],shipping:null,freeShippingThreshold:null,minimumOrder:null,origin:'',...value.delivery},codEnabled:value.codEnabled===true,razorpayEnabled:false,seo:{title:value.name || '',description:'',siteUrl:'',...value.seo}};
}
export function resolveMediaReferences(value,media){
 if(Array.isArray(value))return value.map(item=>resolveMediaReferences(item,media));
 if(!value||typeof value!=='object')return value;
 const out=Object.fromEntries(Object.entries(value).map(([key,item])=>[key,resolveMediaReferences(item,media)]));
 if(value.mediaId){const item=media.find(item=>item.id===value.mediaId);out.src=item?.src || null;out.alt=value.alt || item?.alt || '';out.caption=value.caption || item?.caption || '';}
 if('posterMediaId' in value)out.poster=media.find(item=>item.id===value.posterMediaId)?.src || null;
 if('logoMediaId' in value)out.logoSrc=media.find(item=>item.id===value.logoMediaId)?.src || null;
 return out;
}
export function hasMediaReference(value,id){return !!value&&typeof value==='object'&&(Object.entries(value).some(([key,item])=>(['mediaId','posterMediaId','logoMediaId'].includes(key)&&item===id)||hasMediaReference(item,id)));}

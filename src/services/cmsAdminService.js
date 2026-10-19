import {apiMode} from './catalogueApi';
import * as cmsApi from './cmsApi';
import { publicRoutes,customerRoutes } from '../routes/registry';
import { mutateCatalogue,readMock } from './mockStore';
import { homeContent } from '../mock-data/home';
import { business } from '../mock-data/business';
import { safeDestination,safeWebUrl,validGSTIN,validFSSAI,businessDefaults } from '../domain/contentSelectors';
const text=value=>String(value??'').trim();
const fail=errors=>{if(Object.keys(errors).length){const error=new Error('Please review the highlighted fields.');error.fields=errors;throw error;}};
const now=()=>new Date().toISOString();
export function validateBlocks(blocks=[]){
 if(!Array.isArray(blocks)||blocks.length>100)throw new Error('Use at most 100 structured blocks.');
 return blocks.map(block=>{if(!['paragraph','heading','quote','list','image'].includes(block.type))throw new Error('Choose a supported block type. Raw HTML is not supported.');if(text(block.text).length>10000)throw new Error('Use at most 10,000 characters per block.');return {id:block.id || crypto.randomUUID(),type:block.type,text:text(block.text),mediaId:block.mediaId || null,alt:text(block.alt)};});
}
function knownDestination(value,data){
 if(safeWebUrl(value))return true;if(!safeDestination(value))return false;const path=value.split(/[?#]/)[0];
 if([...publicRoutes,...customerRoutes].some(route=>!route.path.includes(':')&&route.path===path))return true;
 return data.products.some(item=>item.status!=='inactive'&&path==='/product/'+item.slug)||data.categories.some(item=>item.status==='active'&&path==='/shop/category/'+item.slug)||data.blogPosts.some(item=>(item.status==='published'||item.status==='editorial_draft'&&item.previewEnabled)&&path==='/blog/'+item.slug);
}
function validateReferences(value,data,path=''){
 if(!value||typeof value!=='object')return;
 for(const [key,item] of Object.entries(value)){
  if(['mediaId','posterMediaId','logoMediaId'].includes(key)&&item&&!data.productMedia.some(media=>media.id===item&&media.kind===(key==='mediaId'&&path.split('.').at(-1)==='video'?'video':'image')))throw new Error('A selected media file is no longer available. Choose it again.');
  if((['to','destination','actionTo'].includes(key))&&item&&!knownDestination(item,data))throw new Error('Choose an existing public route or a safe HTTPS destination.');
  validateReferences(item,data,path?path+'.'+key:key);
 }
}
export async function saveHomepage(input){
 if(apiMode)return cmsApi.saveHome(input);
 return mutateCatalogue(data=>{const value=structuredClone(input);const errors={};
  const ids=homeContent.sections.map(section=>section.id);
  if(!Array.isArray(value.sections)||value.sections.length!==ids.length||new Set(value.sections.map(section=>section.id)).size!==ids.length||value.sections.some(section=>!ids.includes(section.id)||typeof section.enabled!=='boolean'||!Number.isInteger(section.order)||section.order<0))errors.sections='Keep every original section once; use the ordering controls.';
  if(Array.isArray(value.sections)&&new Set(value.sections.map(section=>section.order)).size!==value.sections.length)errors.sections='Each section needs a unique position.';
  if(!text(value.title))errors.title='A hero heading is required.';
  for(const [key,action] of [['action',value.action],['secondaryAction',value.secondaryAction],['story.action',value.story?.action],['journal.action',value.journal?.action]])if(!text(action?.label)||!text(action?.to))errors[key]='Keep a label and destination for this CTA.';
  if(value.values?.items?.length!==4)errors.values='Keep the four brand values.';
  if(JSON.stringify(value.testimonials?.items)!==JSON.stringify(data.homepage.testimonials.items))errors.testimonials='Only existing approved testimonials can be displayed. New reviews require a future approval workflow.';
  fail(errors);validateReferences(value,data);
  const chrome=value.chrome;delete value.chrome;if(chrome){for(const key of ['announcementEnabled','previewNotice','introduction','footerDescriptionVisible'])if(key in chrome)data.business[key]=chrome[key];data.business.localPreview=true;data.business.updatedAt=now();}
  data.homepage={...value,id:data.homepage.id,updatedAt:now(),localPreview:true};return {...data.homepage,...(chrome?{chrome}:{})};
 });
}
export function resetHomepageSection(value,id){
 const result=structuredClone(value);const defaults=structuredClone(homeContent);
 if(['announcement','footer'].includes(id)){const keys=id==='announcement'?['announcementEnabled','previewNotice']:['introduction','footerDescriptionVisible'];const original=businessDefaults(business);for(const key of keys)result.chrome[key]=original[key];return result;}
 const groups={hero:['eyebrow','title','emphasis','description','action','secondaryAction','showcase','highlights'],categories:['shopping'],collection:['shopping'],introduction:['video'],gallery:['media'],story:['story'],values:['values'],journal:['journal'],testimonials:['testimonials'],newsletter:['newsletter']};
 if(id==='categories'||id==='collection')result.shopping[id]=defaults.shopping[id];
 else if(id==='gallery')result.media.gallery=defaults.media.gallery;
 else if(id==='introduction'){result.video=defaults.video;result.media.introduction=defaults.media.introduction;}
 else for(const key of groups[id]||[])result[key]=defaults[key];
 const section=result.sections.find(section=>section.id===id);if(section){const original=defaults.sections.find(section=>section.id===id);section.enabled=original.enabled;const ordered=result.sections.slice().sort((a,b)=>a.order-b.order).filter(item=>item.id!==id);ordered.splice(original.order,0,section);result.sections=ordered.map((item,order)=>({...item,order}));}
 return result;
}
export async function saveContentRecord(collection,input,id=null){
 if(apiMode)return cmsApi.saveRecord(collection,input,id);
 if(!['blogPosts','cmsPages','banners'].includes(collection))throw new Error('Unsupported content collection.');
 return mutateCatalogue(data=>{
  const old=id?data[collection].find(item=>item.id===id):null;if(id&&!old)throw new Error('Content no longer exists.');
  const value={...old,...structuredClone(input),title:text(input.title)};const errors={};
  if(!value.title||value.title.length>200)errors.title='Enter a title up to 200 characters.';
  if(collection==='banners'){
   if(!['active','inactive'].includes(value.status))errors.status='Choose active or inactive.';
   value.sortOrder=Number(value.sortOrder??0);if(!Number.isSafeInteger(value.sortOrder)||value.sortOrder<0)errors.sortOrder='Use a nonnegative whole number.';
   if(value.destination&&!safeDestination(value.destination))errors.destination='Use a relative path or HTTPS URL.';
   if(value.ctaLabel&&!value.destination)errors.destination='Enter a CTA destination.';
  }else{
   value.slug=text(value.slug);if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug)||data[collection].some(item=>item.id!==id&&item.slug===value.slug))errors.slug='Choose a unique lowercase hyphenated slug.';
   if(collection==='cmsPages'&&old?.slug!==value.slug)errors.slug='Core page routes cannot be renamed.';
   if(!['draft','editorial_draft','published','archived'].includes(value.status))errors.status='Choose a demo publishing status.';
   try{value.blocks=validateBlocks(value.blocks || []);}catch(error){errors.blocks=error.message;}
   if(value.status==='published'&&!value.blocks?.some(block=>block.text||block.mediaId))errors.blocks='Add reviewed content before publishing in this demo.';
   if(value.status==='published'&&old?.status!=='published'&&value.publishConfirmed!==true)errors.status='Confirm local demo publication first.';
   value.body=null;value.seo={title:text(value.seo?.title),description:text(value.seo?.description)};
  }
  fail(errors);validateReferences(value,data);delete value.publishConfirmed;
  value.id=old?.id || crypto.randomUUID();value.updatedAt=now();value.localPreview=true;
  if(collection==='blogPosts'){value.previewEnabled=old?.previewEnabled===true;value.publishedAt=null;}
  if(old)data[collection][data[collection].indexOf(old)]=value;else data[collection].push(value);
  return value;
 });
}
export async function deleteContentRecord(collection,id,version){
 if(apiMode)return cmsApi.deleteRecord(collection,id,version);
 if(!['blogPosts','banners'].includes(collection))throw new Error('Core pages cannot be deleted.');
 return mutateCatalogue(data=>{const record=data[collection].find(item=>item.id===id);if(!record)throw new Error('Content not found.');if(collection==='blogPosts'&&id.startsWith('draft-'))throw new Error('Archive the original editorial idea instead; seed ideas are preserved.');data[collection]=data[collection].filter(item=>item.id!==id);if(collection==='blogPosts')data.homepage.journal.postIds=data.homepage.journal.postIds.filter(item=>item!==id);return record;});
}
export function validateBusiness(input){
 const value=businessDefaults(structuredClone(input)),errors={};
 value.name=text(value.name);if(!value.name)errors.name='Enter the company display name.';
 if(value.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email))errors.email='Enter a valid email or leave it blank.';
 for(const key of ['phone','whatsapp'])if(value[key]&&(!/^\+?[0-9 ()-]{8,20}$/.test(value[key])||value[key].replace(/\D/g,'').length<8||value[key].replace(/\D/g,'').length>15))errors[key]='Use a phone number with 8–20 digits/separators or leave blank.';
 for(const kind of ['gstin','fssai']){value[kind]={value:text(value[kind]?.value).toUpperCase()||null,visible:value[kind]?.visible===true};if(value[kind].value&&!(kind==='gstin'?validGSTIN:validFSSAI)(value[kind].value))errors[kind+'.value']='Invalid format. Format checks do not verify registration.';if(value[kind].visible&&!value[kind].value)errors[kind+'.value']='Supply a valid value or turn visibility off.';}
 if(!Array.isArray(value.socialLinks)||value.socialLinks.some(link=>!text(link.label)||!safeWebUrl(link.url)))errors.socialLinks='Social links need a label and HTTPS URL without credentials.';
 if(value.seo.siteUrl&&!safeWebUrl(value.seo.siteUrl))errors['seo.siteUrl']='Use an HTTPS URL or leave blank.';
 const delivery=value.delivery;delivery.serviceablePins=Array.isArray(delivery.serviceablePins)?[...new Set(delivery.serviceablePins.map(text).filter(Boolean))]:[];
 if(delivery.serviceablePins.some(pin=>!/^[1-9][0-9]{5}$/.test(pin)))errors['delivery.serviceablePins']='Every PIN must contain six digits and start with 1–9.';
 if(delivery.configured&&!delivery.serviceablePins.length)errors['delivery.serviceablePins']='Add allowed PIN codes before enabling demo coverage.';
 for(const key of ['shipping','freeShippingThreshold','minimumOrder']){const raw=delivery[key];delivery[key]=raw===''||raw==null?null:Number(raw);if(delivery[key]!==null&&(!Number.isFinite(delivery[key])||delivery[key]<0||Math.abs(delivery[key]*100-Math.round(delivery[key]*100))>0.000001))errors['delivery.'+key]='Use a nonnegative amount with at most two decimals.';}
 if(input.currency&&input.currency!=='INR')errors.currency='Only INR is supported.';
 const credentials=value=>value&&typeof value==='object'&&Object.entries(value).some(([key,item])=>/secret|password|apiKey|razorpayKey/i.test(key)||credentials(item));
 if(input.razorpayEnabled===true||credentials(input))errors.razorpayEnabled='Payment credentials are not accepted in this frontend.';
 value.razorpayEnabled=false;fail(errors);return value;
}
export async function saveBusinessSettings(input){if(apiMode)return cmsApi.saveSettings(input);return mutateCatalogue(data=>{const value=validateBusiness(input);validateReferences(value,data);data.business={...value,id:data.business.id,updatedAt:now(),localPreview:true};return data.business;});}
export const getContentAdminData=async(kind)=>{if(apiMode)return cmsApi.cmsAdminData(kind);const [homepage,business,pages,blog,banners,media]=await Promise.all(['homepage','business','cmsPages','blogPosts','banners','productMedia'].map(readMock));return {homepage,business:businessDefaults(business),pages,blog,banners,media};};
export const originalBusiness=()=>businessDefaults(structuredClone(business));

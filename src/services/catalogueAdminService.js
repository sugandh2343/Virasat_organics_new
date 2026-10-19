import * as api from './catalogueApi';
import { hasMediaReference } from '../domain/contentSelectors';
import { mutateCatalogue,readMock } from './mockStore';
import { products as seedProducts } from '../mock-data/products';
import { createPreviewURL,releasePreviewURL } from './mediaUrls';
export const catalogueStatuses=['active','inactive','out_of_stock','coming_soon'];
const trim=value=>String(value??'').trim();
const nullable=value=>value===''||value==null?null:Number(value);
function invalid(fields){const error=new Error('Please review the highlighted fields.');error.fields=fields;throw error;}
function unique(records,key,value,id){return !records.some(item=>item.id!==id && String(item[key]).toLowerCase()===value.toLowerCase());}
const now=()=>new Date().toISOString();
export function validateProduct(input,data,id){
 const errors={};const value={...input,name:trim(input.name),slug:trim(input.slug),sku:trim(input.sku),size:trim(input.size)};
 for(const key of ['name','sku','size'])if(!value[key]||value[key].length>150)errors[key]='Required; use up to 150 characters.';
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug))errors.slug='Use lowercase words separated by hyphens.';
 if(!unique(data.products,'slug',value.slug,id))errors.slug='This slug is already used.';
 if(!unique(data.products,'sku',value.sku,id))errors.sku='This SKU is already used (case-insensitive).';
 if(!data.categories.some(item=>item.id===value.categoryId))errors.categoryId='Choose an existing category.';
 if(!catalogueStatuses.includes(value.status))errors.status='Choose a valid publishing status.';
 if('variants' in input)errors.size='Variants are not supported; each pack is independent.';
 for(const key of ['price','compareAtPrice','taxRate','stock','lowStockThreshold']){
  value[key]=nullable(input[key]);const number=value[key];
  if(number!==null && (!Number.isFinite(number)||number<0||(['stock','lowStockThreshold'].includes(key)&&!Number.isSafeInteger(number))||(['price','compareAtPrice'].includes(key)&&Math.abs(number*100-Math.round(number*100))>0.000001)))errors[key]='Use a non-negative value; stock must be a whole number and prices have at most two decimals.';
 }
 if(value.taxRate!==null&&value.taxRate>100)errors.taxRate='Tax rate must be 0–100.';
 if(value.price!==null&&value.compareAtPrice!==null&&value.compareAtPrice<value.price)errors.compareAtPrice='MRP cannot be below the selling price.';
 const previous=data.products.find(item=>item.id===id);
 if((previous?.stock??null)!==value.stock&&!trim(input.stockNote))errors.stockNote='Explain the stock change.';
 if(Object.keys(errors).length)invalid(errors);
 return value;
}
function mediaFor(data,ids,kind){
 if(new Set(ids).size!==ids.length)throw new Error('Select each media item only once.');
 return ids.map(id=>{const item=data.productMedia.find(item=>item.id===id&&item.kind===kind);if(!item)throw new Error('A selected media item is missing or has the wrong type.');return item;});
}
function projectMedia(data,item){
 const poster=data.productMedia.find(media=>media.id===item.posterMediaId&&media.kind==='image');
 return {mediaId:item.id,src:item.src,alt:item.alt,caption:item.caption,title:item.caption || item.name,poster:poster?.src || null,isPreview:true};
}
function applyProductMedia(data,product,imageIds,videoIds){
 product.images=mediaFor(data,imageIds,'image').map(item=>projectMedia(data,item));
 product.videos=mediaFor(data,videoIds,'video').map(item=>projectMedia(data,item));
}
function logStock(data,product,before,reason){
 data.inventoryActivity.unshift({id:crypto.randomUUID(),productId:product.id,productName:product.name,createdAt:now(),before,after:product.stock,delta:before===null||product.stock===null?null:product.stock-before,reason:trim(reason)});
}
export async function saveCatalogueProduct(input,id=null){
 if(api.apiMode){return api.saveProduct(input,id);}

 return mutateCatalogue(data=>{
  const old=id?data.products.find(item=>item.id===id):null;if(id&&!old)throw new Error('Product no longer exists.');
  const value=validateProduct(input,data,id);const category=data.categories.find(item=>item.id===value.categoryId);
  const product={...old,...value,id:old?.id || crypto.randomUUID(),category:category.name,SKU:value.sku,packageSize:value.size,description:value.longDescription || '',updatedAt:now(),images:old?.images || [],videos:old?.videos || [],ingredients:value.ingredients || [],specifications:value.specifications || {},seo:value.seo || {},SEO:value.seo || {}};
  delete product.imageIds;delete product.videoIds;delete product.stockNote;
  if(input.imageIds || input.videoIds)applyProductMedia(data,product,input.imageIds || [],input.videoIds || []);
  if((old?.stock??null)!==product.stock)logStock(data,product,old?.stock??null,input.stockNote);
  if(old)data.products[data.products.indexOf(old)]=product;else data.products.push(product);
  return product;
 });
}
export async function setCatalogueStatus(id,status){
 if(api.apiMode){return api.product(await api.mutate('/admin/products/'+id,{method:'PATCH',body:{status},type:'products',id}));}

 return mutateCatalogue(data=>{const product=data.products.find(item=>item.id===id);if(!product||!catalogueStatuses.includes(status))throw new Error('Product or status is invalid.');product.status=status;product.updatedAt=now();return product;});
}
export async function duplicateCatalogueProduct(id){
 if(api.apiMode){return api.product(await api.mutate('/admin/products/'+id+'/duplicate'));}

 return mutateCatalogue(data=>{
  const original=data.products.find(item=>item.id===id);if(!original)throw new Error('Product not found.');
  let suffix=1;while(!unique(data.products,'sku',original.sku+'-COPY-'+suffix)||!unique(data.products,'slug',original.slug+'-copy-'+suffix))suffix++;
  const product={...original,id:crypto.randomUUID(),name:original.name+' (copy)',slug:original.slug+'-copy-'+suffix,sku:original.sku+'-COPY-'+suffix,status:'inactive',stock:null,price:null,compareAtPrice:null,updatedAt:now()};
  product.SKU=product.sku;data.products.push(product);return product;
 });
}
export async function deleteCatalogueProduct(id,session){
 if(api.apiMode){return api.mutate('/admin/products/'+id,{method:'DELETE',type:'products',id});}

 return mutateCatalogue(data=>{
  const product=data.products.find(item=>item.id===id);if(!product)throw new Error('Product not found.');
  const referenced=[...data.orders,...(session?.orders || [])].some(order=>order.items?.some(item=>item.productId===id));
  if(referenced||seedProducts.some(item=>item.id===id))throw new Error('Archive this product instead: initial catalogue and order references are preserved.');
  data.products=data.products.filter(item=>item.id!==id);return product;
 });
}
export async function saveCatalogueCategory(input,id=null){
 if(api.apiMode){return api.saveCategory(input,id);}

 return mutateCatalogue(data=>{
  const old=id?data.categories.find(item=>item.id===id):null;if(id&&!old)throw new Error('Category not found.');
  const value={...input,name:trim(input.name),slug:trim(input.slug),description:trim(input.description),sortOrder:nullable(input.sortOrder)??0};const errors={};
  if(!value.name)errors.name='Category name is required.';
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug)||!unique(data.categories,'slug',value.slug,id))errors.slug='Use a unique lowercase hyphenated slug.';
  if(!Number.isSafeInteger(value.sortOrder)||value.sortOrder<0)errors.sortOrder='Use a non-negative whole number.';
  if(!['active','inactive'].includes(value.status))errors.status='Choose visible or hidden.';
  const image=input.imageId?data.productMedia.find(item=>item.id===input.imageId&&item.kind==='image'):null;
  if(input.imageId&&!image)errors.imageId='Choose an existing image.';
  if(Object.keys(errors).length)invalid(errors);
  const category={...old,...value,id:old?.id||crypto.randomUUID(),productCategory:value.name,image:image?projectMedia(data,image):null,updatedAt:now()};
  if(old)data.categories[data.categories.indexOf(old)]=category;else data.categories.push(category);
  for(const product of data.products.filter(item=>item.categoryId===category.id))product.category=category.name;
  return category;
 });
}
export async function deleteCatalogueCategory(id){
 if(api.apiMode){return api.mutate('/admin/categories/'+id,{method:'DELETE',type:'categories',id});}

 return mutateCatalogue(data=>{if(data.products.some(product=>product.categoryId===id))throw new Error('Reassign all products before deleting this category.');const category=data.categories.find(item=>item.id===id);if(!category)throw new Error('Category not found.');data.categories=data.categories.filter(item=>item.id!==id);return category;});
}
export async function adjustCatalogueStock(id,{mode='adjust',amount,reason,version}){
 if(api.apiMode){return api.product(await api.mutate('/admin/inventory/adjustments',{type:'products',id,version,body:{productId:id,mode,amount:Number(amount),reason}}));}

 return mutateCatalogue(data=>{
  const product=data.products.find(item=>item.id===id);if(!product)throw new Error('Product not found.');
  const number=Number(amount);const errors={};
  if(!trim(reason))errors.reason='A reason is required.';
  if(trim(amount)===''||!Number.isSafeInteger(number)||(mode==='adjust'&&number===0))errors.amount='Enter a nonzero whole adjustment or a non-negative initial quantity.';
  if(!['set','adjust'].includes(mode))errors.amount='Choose a valid adjustment mode.';
  if(mode==='adjust'&&product.stock===null)errors.amount='Configure an initial quantity first.';
  const next=mode==='set'?number:product.stock+number;
  if(!Number.isSafeInteger(next)||next<0)errors.amount='Stock cannot become negative.';
  if(Object.keys(errors).length)invalid(errors);
  const before=product.stock;product.stock=next;product.updatedAt=now();logStock(data,product,before,reason);return product;
 });
}
export function validateMediaFile(file){
 const types={'image/jpeg':['jpg','jpeg'],'image/png':['png'],'image/webp':['webp'],'image/gif':['gif'],'video/mp4':['mp4']};
 const ext=file.name?.split('.').pop()?.toLowerCase();
 if(!types[file.type]?.includes(ext))throw new Error('Choose JPEG, PNG, WebP, GIF or MP4 files with matching extensions.');
 const max=file.type==='video/mp4'?100*1024*1024:10*1024*1024;
 if(!Number.isFinite(file.size)||file.size<=0||file.size>max)throw new Error('Images must be 1 byte–10 MB; MP4 videos must be 1 byte–100 MB.');
 return file.type==='video/mp4'?'video':'image';
}
export async function addCatalogueMedia(files){
 if(api.apiMode){return api.upload(files);}

 const list=Array.from(files);if(!list.length)throw new Error('Select one or more files.');const kinds=list.map(validateMediaFile);const created=[];
 try{
  const records=list.map((file,index)=>{const src=createPreviewURL(file);created.push(src);return {id:crypto.randomUUID(),name:file.name,kind:kinds[index],src,alt:'',caption:'',posterMediaId:null,isPreview:true,createdAt:now()};});
  return mutateCatalogue(data=>{data.productMedia.push(...records);return records;});
 }catch(error){created.forEach(releasePreviewURL);throw error;}
}
export async function updateCatalogueMedia(id,patch){
 if(api.apiMode){return api.media(await api.mutate('/admin/media/'+id,{method:'PATCH',type:'media',id,body:{alt:patch.alt??null,caption:patch.caption??null,...(patch.posterMediaId!==undefined?{posterMediaId:patch.posterMediaId||null}:{})}}));}

 return mutateCatalogue(data=>{
  const media=data.productMedia.find(item=>item.id===id);if(!media)throw new Error('Media is missing.');
  if(patch.posterMediaId&&!data.productMedia.some(item=>item.id===patch.posterMediaId&&item.kind==='image'))throw new Error('Choose an image for the poster.');
  for(const key of ['alt','caption','posterMediaId'])if(key in patch)media[key]=patch[key];
  for(const product of data.products)for(const key of ['images','videos'])product[key]=product[key].map(item=>item.mediaId===id||media.kind==='image'&&data.productMedia.some(video=>video.id===item.mediaId&&video.posterMediaId===id)?projectMedia(data,data.productMedia.find(entry=>entry.id===item.mediaId)):item);
  for(const category of data.categories)if(category.image?.mediaId===id)category.image=projectMedia(data,media);
  return media;
 });
}
export async function reorderCatalogueMedia(ids){
 if(api.apiMode){throw new Error('Library order is newest first in API mode. Order product photos in the product editor.');}

 return mutateCatalogue(data=>{if(ids.length!==data.productMedia.length||new Set(ids).size!==ids.length||ids.some(id=>!data.productMedia.some(item=>item.id===id)))throw new Error('Media list changed; reload and try again.');data.productMedia=ids.map(id=>data.productMedia.find(item=>item.id===id));return data.productMedia;});
}
export async function assignCatalogueMedia(productId,imageIds,videoIds){
 if(api.apiMode){return api.product(await api.mutate('/admin/products/'+productId,{method:'PATCH',type:'products',id:productId,body:{imageIds,videoIds}}));}

 return mutateCatalogue(data=>{const product=data.products.find(item=>item.id===productId);if(!product)throw new Error('Choose a product.');applyProductMedia(data,product,imageIds,videoIds);product.updatedAt=now();return product;});
}
export async function removeCatalogueMedia(id){
 if(api.apiMode){return api.mutate('/admin/media/'+id,{method:'DELETE',type:'media',id});}

 const removed=mutateCatalogue(data=>{
  if([data.homepage,data.business,data.cmsPages,data.blogPosts,data.banners].some(value=>hasMediaReference(value,id)))throw new Error('Unassign this media from CMS content and settings before removing it.');
  if(data.products.some(product=>[...product.images,...product.videos].some(item=>item.mediaId===id))||data.categories.some(category=>category.image?.mediaId===id)||data.productMedia.some(item=>item.posterMediaId===id))throw new Error('Unassign this media from products, categories and video posters before removing it.');
  const item=data.productMedia.find(item=>item.id===id);if(!item)throw new Error('Media not found.');data.productMedia=data.productMedia.filter(item=>item.id!==id);return item;
 });releasePreviewURL(removed.src);return removed;
}
export const getCatalogueActivity=()=>readMock('inventoryActivity');

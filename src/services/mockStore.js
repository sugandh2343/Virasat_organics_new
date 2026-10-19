import { releaseAllPreviewURLs } from './mediaUrls';
import { products } from '../mock-data/products';
import { categories } from '../mock-data/categories';
import { homeContent } from '../mock-data/home';
import { banners } from '../mock-data/banners';
import { business } from '../mock-data/business';
import { customerProfile } from '../mock-data/customer';
import { addresses } from '../mock-data/addresses';
import { orders } from '../mock-data/orders';
import { blogPosts } from '../mock-data/blogPosts';
import { cmsPages } from '../mock-data/cmsPages';
import { productMedia } from '../mock-data/productMedia';
const clone = value => structuredClone(value);
const seed = {products,categories,homepage:homeContent,banners,business,customer:customerProfile,addresses,orders,blogPosts,cmsPages,productMedia,inventoryActivity:[]};
let data = clone(seed);
const listeners=new Set();
export const subscribeMock = listener=>{listeners.add(listener);return()=>listeners.delete(listener);};
function notify(){for(const listener of listeners)listener();}
export function mutateCatalogue(change){
 const next=clone(data);const result=change(next);data=next;notify();return clone(result);
}
// In-memory mock adapter only. Writes disappear on refresh; no network or database.
export async function readMock(key) {
  if (!(key in data)) throw new Error('Unknown mock collection');
  return clone(data[key]);
}
export async function updateMockRecord(key, id, patch) {
  if (!['products','categories','addresses','orders','blogPosts','cmsPages','productMedia','banners'].includes(key)) throw new Error('Unsupported mock collection');
  const index = data[key].findIndex(record => record.id === id);
  if(index < 0) throw new Error('Mock record not found');
  const next = {...data[key][index], ...clone(patch), id};
  if(key === 'products') {
    if(!['active','inactive','out_of_stock','coming_soon'].includes(next.status)) throw new Error('Invalid product status');
    if(typeof next.slug !== 'string' || !next.slug.trim() || data.products.some(p => p.id !== id && p.slug === next.slug)) throw new Error('Invalid or duplicate product slug');
    if('variants' in patch) throw new Error('Product variants are unsupported');
    next.SKU = next.sku; next.packageSize = next.size;
  }
  data[key][index] = next; notify();
  return clone(next);
}
export async function updateMockSettings(key, patch) {
  if(!['homepage','business','customer'].includes(key)) throw new Error('Unsupported mock settings');
  data[key] = {...data[key], ...clone(patch), ...(data[key].id ? {id:data[key].id} : {})}; notify();
  return clone(data[key]);
}
export async function resetMockData() { releaseAllPreviewURLs();data = clone(seed);notify(); }





// Notify presentation subscribers after a confirmed API mutation; no mock data changed.
export const notifyDataChange=()=>notify();

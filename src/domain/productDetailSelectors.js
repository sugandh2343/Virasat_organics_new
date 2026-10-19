import { isProductPurchasable, isProductVisible } from './productSelectors';
export function quantityLimit(product, cart = []) {
  if (!isProductPurchasable(product)) return 0;
  const held = cart.find(item => item.productId === product.id)?.quantity || 0;
  return Math.max(0, Math.min(product.stock,99)-held);
}
export function clampQuantity(value, limit) { return Math.max(1,Math.min(Number.isInteger(value)?value:1,Math.max(1,limit))); }
export function relatedProducts(products, product) { return products.filter(item=>item.id!==product.id && item.categoryId===product.categoryId && isProductVisible(item)); }

export function configuredValue(value) {
 if(value == null || typeof value==='boolean')return null;
 if(typeof value==='string')return value.trim() || null;
 if(typeof value==='number')return Number.isFinite(value)?value:null;
 if(Array.isArray(value)){const items=value.map(configuredValue).filter(item=>item!==null);return items.length?items:null;}
 if(typeof value==='object'){const entries=Object.entries(value).map(([key,item])=>[key,configuredValue(item)]).filter(([,item])=>item!==null);return entries.length?Object.fromEntries(entries):null;}
 return null;
}
export function productSpecifications(product) {
 return configuredValue({netQuantity:product.size,sku:product.sku || product.SKU,category:product.category,sellingPrice:typeof product.price==='number' && Number.isFinite(product.price) && product.price>=0?product.price:null,...product.specifications});
}

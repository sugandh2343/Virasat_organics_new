import { getProductAvailability, isProductVisible, isProductPurchasable, isValidPrice } from './productSelectors';
export function reconcileShopping(value, products) {
 const byId=new Map(products.filter(isProductVisible).map(product=>[product.id,product]));
 const quantities=new Map();
 for(const entry of value.cart || []) {
  const product=byId.get(entry.productId);
  if(!product || !Number.isInteger(entry.quantity) || entry.quantity<1)continue;
  const limit=Number.isInteger(product.stock)&&product.stock>0?Math.min(product.stock,99):99;
  quantities.set(product.id,Math.min(limit,(quantities.get(product.id)||0)+entry.quantity));
 }
 return {cart:[...quantities].map(([productId,quantity])=>({productId,quantity})),wishlist:[...new Set(value.wishlist || [])].filter(id=>byId.has(id))};
}
const cents=value=>Math.round(value*100);
export function cartSummary(cart,products,settings={}) {
 const items=cart.flatMap(entry=>{
  const product=products.find(item=>item.id===entry.productId && isProductVisible(item));
  return product?[{...entry,product,availability:getProductAvailability(product),lineTotal:isValidPrice(product.price)?cents(product.price)*entry.quantity/100:null}]:[];
 });
 const priced=items.every(item=>item.lineTotal!==null && Number.isFinite(item.lineTotal));
 const subtotal=priced?items.reduce((sum,item)=>sum+cents(item.lineTotal),0)/100:null;
 const canCheckout=items.length>0 && items.length===cart.length && priced && items.every(item=>isProductPurchasable(item.product)&&Number.isInteger(item.quantity)&&item.quantity>0&&item.quantity<=Math.min(item.product.stock,99));
 const reason=!items.length?'Add an available product to continue.':!priced?'Pricing not configured for one or more items.':'Some items are unavailable or exceed current stock. Please update your cart.';
 const total=subtotal!==null && isValidPrice(settings.shipping) && isValidPrice(settings.tax)?(cents(subtotal)+cents(settings.shipping)+cents(settings.tax))/100:null;
 return {items,subtotal,total,canCheckout,reason:canCheckout?null:reason};
}

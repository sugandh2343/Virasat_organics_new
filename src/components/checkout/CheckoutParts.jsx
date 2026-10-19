import { ResponsiveImage } from '../ui';
import { normalizeImage } from '../ui/ProductGallery';
import { money } from '../cart/CartContents';
export function CheckoutItems({items}) {
 return <div className="checkout-items">{items.map(item=>{
  const product=item.product || item;
  return <article className="checkout-item" key={item.productId}><ResponsiveImage {...normalizeImage(product.images?.[0])} alt={product.name} aspectRatio="1" fit="contain"/><div><h3>{product.name}</h3><p>{product.size} · Quantity {item.quantity}</p><p className="caption">{money(item.product?product.price:item.unitPrice)} each</p><p>Line total <strong>{money(item.lineTotal)}</strong></p></div></article>;
 })}</div>;
}
export function CheckoutTotals({summary,settings}) {
 return <dl className="checkout-totals"><div><dt>Subtotal</dt><dd>{money(summary.subtotal)}</dd></div><div><dt>Shipping</dt><dd>{settings.shipping===null?'Not configured':money(settings.shipping)}</dd></div><div><dt>Taxes</dt><dd>{settings.tax===null?'Not configured':money(settings.tax)}</dd></div><div className="checkout-total"><dt>Illustrative total</dt><dd>{summary.total===null?'Not available':money(summary.total)}</dd></div></dl>;
}
export function AddressDetails({address}) {
 return <div className="checkout-address-details"><strong>{address.recipient}</strong><p>{address.line1}, {address.line2}</p>{address.landmark&&<p>{address.landmark}</p>}<p>{address.locality}, {address.city}, {address.state} {address.postalCode}</p><p>{address.country} · {address.phone}</p></div>;
}

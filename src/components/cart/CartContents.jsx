import {apiMode} from '../../services/catalogueApi';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { IconButton, PrimaryButton, SecondaryButton, EmptyState, ResponsiveImage } from '../ui';
import { normalizeImage } from '../ui/ProductGallery';
import { useStorefront } from '../../state/StorefrontContext';
import { cartSettings, cartContent } from '../../mock-data/cart';
import { isValidPrice } from '../../domain/productSelectors';
export const money=value=>isValidPrice(value)?new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(value):'Pricing not configured';
export function CartItems({items,onNavigate}) {
 const {dispatch}=useStorefront();
 return <div className="cart-items">{items.map(({product,quantity,availability,lineTotal})=><article className="cart-item" key={product.id}>
 <Link className="cart-item-image" to={'/product/'+product.slug} onClick={onNavigate} aria-label={product.name+' '+product.size}><ResponsiveImage {...normalizeImage(product.images?.[0])} alt={product.name+' '+product.size} aspectRatio="1" fit="contain"/></Link>
 <div className="cart-item-info"><h3><Link to={'/product/'+product.slug} onClick={onNavigate}>{product.name}</Link></h3><p>{product.size}</p><p>{money(product.price)} <span className="caption">each</span></p>{!availability.purchasable&&<p className="cart-item-warning">{availability.label} Â· unavailable for checkout</p>}
 <div className="cart-item-controls"><div className="cart-stepper" role="group" aria-label={'Quantity for '+product.name+' '+product.size}><IconButton label={'Decrease '+product.name+' '+product.size} disabled={!availability.purchasable||quantity<=1} onClick={()=>dispatch({type:'cart/quantity',id:product.id,quantity:quantity-1})}><Minus size={16}/></IconButton><output aria-live="polite">{quantity}</output><IconButton label={'Increase '+product.name+' '+product.size} disabled={!availability.purchasable||quantity>=Math.min(product.stock,99)} onClick={()=>dispatch({type:'cart/quantity',id:product.id,quantity:quantity+1})}><Plus size={16}/></IconButton></div><IconButton label={'Remove '+product.name+' '+product.size+' from cart'} onClick={()=>dispatch({type:'cart/remove',id:product.id})}><Trash2 size={18}/></IconButton></div>
 <p className="cart-line-total">Line total <strong>{money(lineTotal)}</strong></p></div></article>)}</div>;
}
export function CartSummary({summary,onNavigate,drawer=false}) {
 return <aside className="cart-summary" aria-label="Order summary"><h2>Order summary</h2><dl><div><dt>Subtotal</dt><dd>{money(summary.subtotal)}</dd></div><div><dt>Shipping</dt><dd>{apiMode?'Calculated at checkout':isValidPrice(cartSettings.shipping)?money(cartSettings.shipping):'Not configured'}</dd></div><div><dt>Taxes</dt><dd>{apiMode?'Calculated at checkout':isValidPrice(cartSettings.tax)?money(cartSettings.tax):'Not configured'}</dd></div>{summary.total!==null&&<div><dt>Total</dt><dd>{money(summary.total)}</dd></div>}</dl>{summary.total===null&&<p className="quiet-note">{apiMode?'Review a server quote at checkout for shipping, tax and the final total.':cartContent.shippingNote}</p>}
 {summary.reason&&<p className="cart-checkout-reason" role="status">{summary.reason}</p>}
 <PrimaryButton to="/checkout" disabled={!summary.canCheckout} onClick={onNavigate}>Continue to checkout</PrimaryButton>
 {drawer&&<SecondaryButton to="/cart" onClick={onNavigate}>View Cart</SecondaryButton>}
 <p className="quiet-note">{cartContent.localNotice}</p></aside>;
}
export function EmptyCart({onNavigate}) {return <EmptyState title={cartContent.emptyTitle} description={cartContent.emptyDescription}><SecondaryButton to="/shop" onClick={onNavigate}>Continue Shopping</SecondaryButton></EmptyState>;}

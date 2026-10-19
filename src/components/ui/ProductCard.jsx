import { Heart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PrimaryButton, IconButton } from './Buttons';
import PriceDisplay from './PriceDisplay';
import StatusBadge from './StatusBadge';
import ResponsiveImage from './ResponsiveImage';
import { normalizeImage } from './ProductGallery';
import { getProductAvailability } from '../../domain/productSelectors';
export { getProductAvailability } from '../../domain/productSelectors';
export default function ProductCard({ product, onAddToCart, onWishlist, wishlisted = false }) {
  const availability = getProductAvailability(product);
  if (!availability.visible) return null;
  const image = normalizeImage(product.images?.[0]);
  const second = normalizeImage(product.images?.[1]);
  const url = '/product/' + product.slug;
  return <article className="product-card"><div className="product-card-media"><Link to={url} aria-label={product.name + ' — ' + product.packageSize}><ResponsiveImage {...image} alt={image.alt || product.name + ' — ' + product.packageSize} />{second.src && <div className="product-card-secondary"><ResponsiveImage {...second} alt={second.alt || product.name + ' — alternate view'} /></div>}</Link><div className="product-card-badge"><StatusBadge status={availability.status} /></div><IconButton className="product-wishlist" label={onWishlist ? (wishlisted ? 'Remove ' : 'Save ') + product.name + ' ' + product.packageSize + (wishlisted ? ' from wishlist' : ' to wishlist') : 'Wishlist coming soon for ' + product.name + ' ' + product.packageSize} disabled={!onWishlist} aria-pressed={wishlisted} onClick={() => onWishlist?.(product)}><Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} aria-hidden="true" /></IconButton></div>
    <div className="product-card-body"><p className="eyebrow">{product.category}</p><h3 className="product-title"><Link to={url}>{product.name}</Link></h3><p className="pack-size">{product.packageSize}</p><PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} /><PrimaryButton disabled={!availability.purchasable || !onAddToCart} onClick={() => onAddToCart?.(product)}><ShoppingBag size={16} aria-hidden="true" />{availability.purchasable && !onAddToCart ? 'Shopping coming soon' : availability.label}</PrimaryButton></div>
  </article>;
}




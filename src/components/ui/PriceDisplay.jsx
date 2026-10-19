import { isValidPrice } from '../../domain/productSelectors';
export { isValidPrice } from '../../domain/productSelectors';
export default function PriceDisplay({ price, compareAtPrice, currency = 'INR' }) {
  if (!isValidPrice(price)) return <span className="price-coming">Price coming soon</span>;
  const format = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
  return <span className="price-display"><span><span className="sr-only">Price: </span>{format(price)}</span>{isValidPrice(compareAtPrice) && compareAtPrice > price && <span className="price-mrp"><span>MRP </span><del>{format(compareAtPrice)}</del></span>}</span>;
}



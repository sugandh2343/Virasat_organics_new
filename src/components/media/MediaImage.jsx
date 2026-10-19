import { Wheat, Sprout, Droplets, Flower2, Package, CircleDot } from 'lucide-react';
import ResponsiveImage from '../ui/ResponsiveImage';
const icons = { field: Wheat, grain: Wheat, flour: CircleDot, seeds: Sprout, flowers: Flower2, oil: Droplets, products: Package };
export default function MediaImage({ item, aspectRatio = '4 / 3', loading = 'lazy', fit = 'cover' }) {
  const Icon = icons[item.subject] || Sprout;
  if (item.src) return <ResponsiveImage {...item} alt={item.alt || item.caption} aspectRatio={aspectRatio} loading={loading} fit={fit} sizes="(min-width: 64rem) 40vw, (min-width: 48rem) 50vw, 100vw" />;
  return <div className={'editorial-placeholder editorial-placeholder--' + (item.subject || 'products')} style={{aspectRatio}} role="img" aria-label={item.caption + ' — preview placeholder'}><span className="media-art-orbit" aria-hidden="true"><Icon size={72} strokeWidth={.7} /></span><span>{item.caption}</span><small>Preview placeholder · Photography pending</small></div>;
}

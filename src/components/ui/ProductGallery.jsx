import { useState } from 'react';
import ResponsiveImage from './ResponsiveImage';
export const normalizeImage = image => typeof image === 'string' ? { src: image } : (image || {});
export default function ProductGallery({ images = [], name, fit = 'contain' }) {
  const [selected, setSelected] = useState(0);
  const index = selected < images.length ? selected : 0;
  const photo = normalizeImage(images[index]);
  return <div className="product-gallery"><ResponsiveImage {...photo} alt={photo.alt || name + ' — photo ' + (index + 1)} fit={fit} />{images.length > 1 && <div className="gallery-thumbnails" aria-label={name + ' photos'}>{images.map((image, i) => { const item = normalizeImage(image); return <button type="button" key={i} aria-label={'View ' + name + ' photo ' + (i + 1)} aria-pressed={i === index} onClick={() => setSelected(i)}><ResponsiveImage {...item} alt={item.alt || name + ' thumbnail ' + (i + 1)} aspectRatio="1" /></button>; })}</div>}</div>;
}


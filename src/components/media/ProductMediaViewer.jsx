import { useState } from 'react';
import { Play, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { normalizeImage } from '../ui/ProductGallery';
import { IconButton } from '../ui/Buttons';
import { productPhotoSlots } from '../../mock-data/productDetail';
import MediaImage from './MediaImage';
import MediaLightbox from './MediaLightbox';
import { VideoPlayer } from './VideoModal';
import '../../styles/media.css';
export function productGalleryItems(product) {
 const images=product.images?.length?product.images:productPhotoSlots.map(caption=>({src:null,alt:product.name+' — '+caption,subject:'products'}));
 return [...images.map((image,i)=>({...normalizeImage(image),id:'image-'+i,type:'image',caption:normalizeImage(image).caption || normalizeImage(image).alt || product.name+' — photo '+(i+1)})),...(product.videos || []).map((video,i)=>({...normalizeImage(video),id:'video-'+i,type:'video',caption:normalizeImage(video).title || product.name+' — video '+(i+1)}))];
}
export default function ProductMediaViewer({ product }) {
 const items=productGalleryItems(product);
 const [selected,setSelected]=useState(0);
 const [lightbox,setLightbox]=useState(null);
 const index=selected<items.length?selected:0;
 const item=items[index];
 const move=direction=>setSelected((index+direction+items.length)%items.length);
 return <div className="product-media-viewer" onKeyDown={event=>{if(event.target.closest('dialog,video'))return;if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}}}>
 <div className="product-media-active">{item.type==='video'?<VideoPlayer key={item.src || item.id} media={item}/>:<button type="button" className="product-media-zoom" onClick={()=>setLightbox(index)} aria-label={'Enlarge '+item.caption}><MediaImage item={item} aspectRatio="4 / 3" fit="contain" loading="eager"/><ZoomIn aria-hidden="true"/></button>}</div>
 <div className="product-gallery-controls"><IconButton label="Previous product media" onClick={()=>move(-1)} disabled={items.length<2}><ChevronLeft/></IconButton><span aria-live="polite">{index+1} / {items.length}</span><IconButton label="Next product media" onClick={()=>move(1)} disabled={items.length<2}><ChevronRight/></IconButton></div>
 <div className="product-media-thumbnails" aria-label="Product media">{items.map((entry,i)=><button type="button" key={entry.id} aria-label={'View '+entry.caption} aria-pressed={index===i} onClick={()=>setSelected(i)}>{entry.type==='video'?<>{entry.poster&&<img src={entry.poster} alt="" onError={event=>{event.currentTarget.hidden=true;}}/>}<Play size={22} aria-hidden="true"/><span>Video</span></>:<MediaImage item={entry} aspectRatio="1" fit="contain"/>}</button>)}</div>
 <MediaLightbox items={items} index={lightbox} onChange={setLightbox} onClose={()=>setLightbox(null)}/></div>;
}


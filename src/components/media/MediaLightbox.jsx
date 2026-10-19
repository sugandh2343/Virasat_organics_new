import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ModalShell from '../ui/ModalShell';
import { IconButton } from '../ui/Buttons';
import MediaImage from './MediaImage';
import { VideoPlayer } from './VideoModal';
export default function MediaLightbox({ items, index, onChange, onClose }) {
  const touch = useRef(null);
  const open = index !== null && items.length > 0;
  const current = open ? items[index % items.length] : null;
  const move = direction => onChange((index + direction + items.length) % items.length);
  return <ModalShell open={open} onClose={onClose} title={current?.caption || 'Media preview'} className="media-lightbox" onKeyDown={event => { if (!open || event.target.closest('video')) return; if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); } }}>
    {current && <div onTouchStart={event => {touch.current=[event.touches[0].clientX,event.touches[0].clientY];}} onTouchEnd={event => {if(!touch.current || current.type==='video')return;const dx=event.changedTouches[0].clientX-touch.current[0];const dy=event.changedTouches[0].clientY-touch.current[1];if(Math.abs(dx)>60 && Math.abs(dx)>Math.abs(dy))move(dx<0?1:-1);touch.current=null;}}>
      <div className="lightbox-stage">{current.type === 'video' ? <VideoPlayer key={current.src || current.id} media={{...current,title:current.caption}} /> : <MediaImage item={current} aspectRatio="16 / 10" fit="contain" loading="eager" />}</div>
      <div className="lightbox-controls"><IconButton label="Previous image" onClick={()=>move(-1)} disabled={items.length<2}><ChevronLeft aria-hidden="true" /></IconButton><p aria-live="polite">{index + 1} / {items.length}<span>{current.caption}</span></p><IconButton label="Next image" onClick={()=>move(1)} disabled={items.length<2}><ChevronRight aria-hidden="true" /></IconButton></div>
    </div>}
  </ModalShell>;
}


import { useEffect, useRef, useState } from 'react';
import { Film } from 'lucide-react';
import ModalShell from '../ui/ModalShell';
import '../../styles/media.css';
export function VideoPlayer({ media }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { const video = ref.current; return () => { video?.pause(); }; }, []);
  if (!media.src || failed) return <div className="media-video-empty" role="status"><Film size={40} strokeWidth={1} aria-hidden="true" /><h3>{media.placeholder || 'Video coming soon'}</h3><p>{media.description || 'Our film is still taking shape. Please check back soon.'}</p></div>;
  return <video ref={ref} controls playsInline preload="metadata" poster={media.poster || undefined} onError={() => setFailed(true)} aria-label={media.title || 'Product video'}>
    <source src={media.src} type="video/mp4" onError={() => setFailed(true)} />
    {media.captions && <track kind="captions" src={media.captions} srcLang="en" label="English" default />}
  </video>;
}
export default function VideoModal({ open, onClose, media }) {
  return <ModalShell open={open} onClose={onClose} title={media.title} className="media-video-modal">{open && <VideoPlayer key={media.src || 'missing'} media={media} />}</ModalShell>;
}

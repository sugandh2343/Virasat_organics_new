import { useState } from 'react';
import { Play, ArrowRight } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import ResponsiveImage from '../ui/ResponsiveImage';
import VideoModal from '../media/VideoModal';
import MediaImage from '../media/MediaImage';
import MediaLightbox from '../media/MediaLightbox';
import '../../styles/media.css';
export default function HomeMedia({ content, video, section }) {
  const [videoOpen,setVideoOpen] = useState(false);
  const [index,setIndex] = useState(null);
  return <div className="home-media">
    {(!section || section === 'introduction') && <section className="intro-film-section"><div className="container intro-film-grid">
      <button type="button" className="intro-film-preview" aria-label={'Play ' + video.title} aria-haspopup="dialog" onClick={()=>setVideoOpen(true)}>
        {video.poster ? <ResponsiveImage src={video.poster} alt="Introductory film poster" aspectRatio="16 / 9" fit="cover" /> : <MediaImage item={{subject:'field',caption:content.introduction.previewLabel}} aspectRatio="16 / 9" />}
        <span className="intro-film-play"><Play size={25} fill="currentColor" aria-hidden="true" /></span>
      </button>
      <div className="intro-film-copy"><SectionHeading eyebrow={content.introduction.eyebrow} title={content.introduction.title} description={content.introduction.description} /><button type="button" className="media-text-button" onClick={()=>setVideoOpen(true)}>{content.introduction.actionLabel}<ArrowRight size={17} aria-hidden="true" /></button><p className="caption">{video.src ? video.title : video.placeholder}</p></div>
    </div></section>}
    {(!section || section === 'gallery') && <section className="container editorial-gallery" aria-label={content.gallery.title}>
      <SectionHeading eyebrow={content.gallery.eyebrow} title={content.gallery.title} description={content.gallery.description} />
      <div className="editorial-grid">{content.gallery.items.map((item,i)=><button type="button" className="editorial-tile" key={item.id} onClick={()=>setIndex(i)} aria-label={'Preview ' + item.caption} aria-haspopup="dialog"><MediaImage item={item} /><span className="editorial-tile-caption"><span>{String(i+1).padStart(2,'0')}</span>{item.caption}<ArrowRight size={16} aria-hidden="true" /></span></button>)}</div>
    </section>}
    <VideoModal open={videoOpen} onClose={()=>setVideoOpen(false)} media={video} />
    <MediaLightbox items={content.gallery.items} index={index} onChange={setIndex} onClose={()=>setIndex(null)} />
  </div>;
}


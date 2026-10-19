import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Sprout, Wheat, Heart } from 'lucide-react';
import { PrimaryButton } from '../ui/Buttons';
import VideoModal from '../media/VideoModal';
import ResponsiveImage from '../ui/ResponsiveImage';
import botanical from '../../assets/heritage-placeholder.svg';
import '../../styles/home-hero.css';

const icons = { sprout: Sprout, wheat: Wheat, heart: Heart };

function ProductShowcase({ content }) {
  return <figure className="pantry-scene">
    <div className="pantry-heading"><p className="eyebrow">{content.eyebrow}</p><p>{content.title}</p></div>
    <img className="pantry-botanical" src={botanical} alt="" aria-hidden="true" />
    <div className="pantry-products">
      {content.products.map(product => <div className={'pantry-product pantry-product--' + product.shape + (product.size === '500 ml' ? ' pantry-product--small' : '')} key={product.id}>
        <div className="pantry-object">
          {(typeof product.image==='string'?product.image:product.image?.src) ? <ResponsiveImage src={typeof product.image==='string'?product.image:product.image.src} alt={product.name + ' ' + product.size} loading="eager" /> : <div className={'pantry-silhouette pantry-silhouette--' + product.tone} aria-hidden="true"><span /></div>}
        </div>
        <p className="pantry-product-name">{product.name}<span>{product.size}</span></p>
      </div>)}
    </div>
    <figcaption>{content.caption}</figcaption>
  </figure>;
}

function StoryVideo({ content }) {
  const [open, setOpen] = useState(false);

  return <>
    <button className="hero-film" type="button" aria-haspopup="dialog" onClick={() => { setOpen(true); }}>
      <span className="hero-film-thumbnail">
        {content.poster ? <ResponsiveImage src={content.poster} alt="Story film preview" aspectRatio="16 / 9" fit="cover" /> : <img src={botanical} alt="" />}
        <span className="hero-film-play"><Play size={20} fill="currentColor" aria-hidden="true" /></span>
      </span>
      <span className="hero-film-copy"><span className="eyebrow">A LITTLE OF OUR HERITAGE</span><strong>{content.title}</strong><span>{content.src ? 'Watch the film' : content.placeholder}<ArrowRight size={14} aria-hidden="true" /></span></span>
    </button>
    <VideoModal open={open} onClose={() => setOpen(false)} media={content} />
  </>;
}

export default function HomeHero({ content }) {
  return <section className="home-hero" aria-labelledby="home-hero-title">
    <div className="container home-hero-grid">
      <div className="home-hero-copy"><p className="eyebrow"><span aria-hidden="true" />{content.eyebrow}</p>
        <h1 id="home-hero-title">{content.title}<br /><em>{content.emphasis}</em></h1>
        <p className="home-hero-description">{content.description}</p>
        <div className="home-hero-actions"><PrimaryButton to={content.action.to}>{content.action.label}<ArrowRight size={18} aria-hidden="true" /></PrimaryButton><Link className="hero-story-link" to={content.secondaryAction.to}>{content.secondaryAction.label}<ArrowRight size={16} aria-hidden="true" /></Link></div>
      </div>
      <div className="home-hero-visual">{content.showcase.image?.src ? <figure className="pantry-scene"><ResponsiveImage src={content.showcase.image.src} alt={content.showcase.image.alt||''} aspectRatio="1 / 1" loading="eager"/><figcaption>{content.showcase.caption}</figcaption></figure> : <ProductShowcase content={content.showcase} />}<StoryVideo content={content.video} /></div>
    </div>
    <div className="container hero-trust"><ul>{content.highlights.map(item => { const Icon = icons[item.icon] || Sprout; return <li key={item.id}><span><Icon size={23} strokeWidth={1.25} aria-hidden="true" /></span>{item.label}</li>; })}</ul></div>
  </section>;
}



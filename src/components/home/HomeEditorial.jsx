import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Wheat, Sprout, Heart, Leaf, Mail } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from '../ui/Buttons';
import SectionHeading from '../ui/SectionHeading';
import { LoadingState, ErrorState } from '../ui/PageStates';
import MediaImage from '../media/MediaImage';
import { getEditorialPreviews } from '../../services/contentService';
import { useAsyncData } from '../../hooks/useAsyncData';
import '../../styles/home-editorial.css';
const icons={wheat:Wheat,sprout:Sprout,heart:Heart,leaf:Leaf};
export function StoryPreview({content}) {
 return <section className="container home-story" aria-label="Our Story"><MediaImage item={content.image} aspectRatio="5 / 4"/><div><SectionHeading eyebrow={content.eyebrow} title={content.title} description={content.description}/><PrimaryButton to={content.action.to}>{content.action.label}<ArrowRight size={17} aria-hidden="true"/></PrimaryButton></div></section>;
}
export function BrandValues({content}) {
 return <section className="container home-values" aria-label={content.title}><ul>{content.items.map(item=>{const Icon=icons[item.icon]||Leaf;return <li key={item.id}><span><Icon size={28} strokeWidth={1.1} aria-hidden="true"/></span><h3>{item.title}</h3><p>{item.description}</p></li>;})}</ul></section>;
}
export function JournalCards({posts,readLabel='Read Article',draftLabel='Editorial draft'}) {
 return <div className="journal-grid">{posts.map(post=><article className="journal-card" key={post.id}><Link to={'/blog/'+post.slug} aria-label={post.title}><MediaImage item={{...(post.image||{}),src:typeof post.image==='string'?post.image:post.image?.src,subject:post.subject,caption:post.category}} aspectRatio="3 / 2"/></Link><div className="journal-card-copy"><p className="eyebrow">{post.category}</p>{post.localPreview&&post.status==='published'&&<span className="journal-draft">Published in local demo</span>}{post.status==='editorial_draft'&&<span className="journal-draft">{draftLabel}</span>}<h3><Link to={'/blog/'+post.slug}>{post.title}</Link></h3><p>{post.excerpt}</p><Link className="media-text-button" to={'/blog/'+post.slug}>{readLabel}<ArrowRight size={16} aria-hidden="true"/></Link></div></article>)}</div>;
}
export function JournalPreview({content}) {
 const loader=useCallback(async()=>{const posts=await getEditorialPreviews();return content.postIds.map(id=>posts.find(post=>post.id===id)).filter(Boolean);},[content.postIds]);
 const {data,loading,error,retry}=useAsyncData(loader);
 return <section className="container home-journal" aria-label={content.title}><SectionHeading eyebrow={content.eyebrow} title={content.title} description={content.description}><SecondaryButton to={content.action.to}>{content.action.label}<ArrowRight size={16} aria-hidden="true"/></SecondaryButton></SectionHeading>{loading?<LoadingState/>:error?<ErrorState retry={retry}/>:<JournalCards posts={data} readLabel={content.readLabel} draftLabel={content.draftLabel}/>}</section>;
}
export function Testimonials({content}) {
 const items=content.items.filter(item=>item.approved===true&&item.quote&&item.name);
 if(!items.length)return null;
 return <section className="container home-testimonials"><SectionHeading title={content.title} description={content.description}/><div className="journal-grid">{items.map(item=><figure key={item.id}><blockquote>{item.quote}</blockquote><figcaption>{item.name}</figcaption></figure>)}</div></section>;
}
export function Newsletter({content}) {
 const [email,setEmail]=useState('');const [message,setMessage]=useState('');const [invalid,setInvalid]=useState(false);
 function submit(event){event.preventDefault();const valid=event.currentTarget.elements.email.validity.valid;setInvalid(!valid);setMessage(valid?content.pendingMessage:content.invalidMessage);}
 return <section className="home-newsletter"><div className="container newsletter-inner"><div><h2>{content.title}</h2><p>{content.description}</p></div><form onSubmit={submit} noValidate><label htmlFor="newsletter-email">{content.emailLabel}</label><div className="newsletter-input"><Mail size={20} aria-hidden="true"/><input id="newsletter-email" name="email" type="email" required autoComplete="email" placeholder={content.placeholder} value={email} onChange={event=>{setEmail(event.target.value);setMessage('');setInvalid(false);}} aria-invalid={invalid} aria-describedby="newsletter-feedback newsletter-note"/><PrimaryButton type="submit">{content.actionLabel}</PrimaryButton></div><p id="newsletter-feedback" role="status" className="newsletter-feedback">{message}</p><p id="newsletter-note" className="caption">{content.privacyNote}</p></form></div></section>;
}

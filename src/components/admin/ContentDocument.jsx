import {useSEO} from '../../hooks/useSEO';
import { ResponsiveImage } from '../ui';
import { VideoPlayer } from '../media/VideoModal';
export function StructuredContent({blocks=[]}){
 return <div className="cms-body">{blocks.map((block,index)=>{const key=block.id||index;switch(block.type){case 'heading':return <h2 key={key}>{block.text}</h2>;case 'quote':return <blockquote key={key}>{block.text}</blockquote>;case 'list':return <ul key={key}>{String(block.text||'').split('\n').filter(Boolean).map((line,i)=><li key={i}>{line}</li>)}</ul>;case 'image':return <figure key={key}><ResponsiveImage src={block.src} alt={block.alt||'Content image'} aspectRatio="3 / 2"/>{block.text&&<figcaption>{block.text}</figcaption>}</figure>;default:return <p key={key}>{block.text}</p>;}})}</div>;
}
export default function ContentDocument({record,preview=false}){
 useSEO({...record.seo,title:record.seo?.title||record.title},preview);
 const showBody=preview||record.status==='published';
 return <article className="container page-section cms-document"><p className="eyebrow">{preview?'Unsaved local preview':record.localPreview?'Local session preview · not a live publication':record.status==='published'?'Published content':'Draft · not yet published'}</p><h1>{record.title}</h1>{record.authorDisplay&&<p>{record.authorDisplay}</p>}{record.updatedAt&&<p>Updated <time dateTime={record.updatedAt}>{new Date(record.updatedAt).toLocaleDateString()}</time></p>}<p className="section-description">{record.excerpt||record.description}</p>{record.image?.src&&<ResponsiveImage src={record.image.src} alt={record.image.alt||record.title} aspectRatio="3 / 2"/>}{showBody?<><StructuredContent blocks={record.blocks||[]}/>{record.video?.src&&<VideoPlayer key={record.video.src} media={record.video}/>}</>:<p>This content is being prepared and has not been published. Legal and policy content requires independent review.</p>}</article>;
}

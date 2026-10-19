import ContentBanners from '../components/home/ContentBanners';
import '../styles/cms-admin.css';
import { getHomepageContent } from '../services/contentService';
import { useAsyncData } from '../hooks/useAsyncData';
import { LoadingState, ErrorState } from '../components/ui/PageStates';
import HomeHero from '../components/home/HomeHero';
import HomeShopping from '../components/home/HomeShopping';
import HomeMedia from '../components/home/HomeMedia';
import {StoryPreview,BrandValues,JournalPreview,Testimonials,Newsletter} from '../components/home/HomeEditorial';
export default function HomePage() {
 const {data:content,loading,error,retry}=useAsyncData(getHomepageContent);
 if(loading)return <LoadingState/>;
 if(error)return <ErrorState retry={retry}/>;
 return <>{content.localPreview&&<p className="container admin-preview-notice">Local session content preview · changes disappear on reload.</p>}<ContentBanners/><HomeContent content={content}/></>;
}
export function HomeContent({content}){
 const renderers={hero:()=> <HomeHero content={content}/>,categories:()=> <HomeShopping content={content.shopping} section="categories"/>,collection:()=> <HomeShopping content={content.shopping} section="collection"/>,introduction:()=> <HomeMedia content={content.media} video={content.video} section="introduction"/>,gallery:()=> <HomeMedia content={content.media} video={content.video} section="gallery"/>,story:()=> <StoryPreview content={content.story}/>,values:()=> <BrandValues content={content.values}/>,journal:()=> <JournalPreview content={content.journal}/>,testimonials:()=> <Testimonials content={content.testimonials}/>,newsletter:()=> <Newsletter content={content.newsletter}/>};
 const seen=new Set();
 return content.sections.filter(section=>section.enabled).slice().sort((a,b)=>a.order-b.order).map(section=>{if(seen.has(section.id)||!renderers[section.id])return null;seen.add(section.id);return <div key={section.id} data-home-section={section.id}>{renderers[section.id]()}</div>;});
}

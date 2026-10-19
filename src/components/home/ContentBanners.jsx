import {LoadingState,ErrorState} from '../ui/PageStates';
import { Link } from 'react-router-dom';
import { ResponsiveImage } from '../ui';
import { useAsyncData } from '../../hooks/useAsyncData';
import { getBanners } from '../../services/contentService';
export function ContentBanner({banner,preview=false}){
 return <article className="content-banner"><div className="banner-desktop"><ResponsiveImage src={banner.desktop?.src} alt={banner.alt||banner.title} aspectRatio="3 / 1"/></div><div className="banner-mobile"><ResponsiveImage src={banner.mobile?.src||banner.desktop?.src} alt={banner.alt||banner.title} aspectRatio="3 / 2"/></div><div><h2>{banner.title}</h2>{banner.description&&<p>{banner.description}</p>}{banner.ctaLabel&&banner.destination&&(preview?<span>{banner.ctaLabel} · {banner.destination}</span>:<Link to={banner.destination}>{banner.ctaLabel}</Link>)}</div></article>;
}
export default function ContentBanners(){const {data,loading,error,retry}=useAsyncData(getBanners);if(loading)return <LoadingState/>;if(error)return <ErrorState retry={retry}/>;return data?.length?<section className="container content-banners" aria-label="Featured banners">{data.map(banner=><ContentBanner key={banner.id} banner={banner}/>)}</section>:null;}

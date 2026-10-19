import {lazy, Suspense} from 'react';
const LiveBlog=lazy(()=>import('./LiveBlog'));
import {apiMode} from '../services/catalogueApi';
import ContentDocument from '../components/admin/ContentDocument';
import { useBusiness } from '../state/BusinessContext';
import '../styles/cms-admin.css';
import { JournalCards } from '../components/home/HomeEditorial';
import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getCMSPageBySlug, getBlogPostBySlug, getBlogPosts, getEditorialPreviews } from '../services/contentService';
import { useAsyncData } from '../hooks/useAsyncData';
import { LoadingState, ErrorState, PlaceholderState } from '../components/ui/PageStates';
import NotFoundPage from './NotFoundPage';
export default function FoundationPage({route}) {
  const business=useBusiness();
  const {slug} = useParams();
  const loader = useCallback(() => route.kind === 'cms' ? getCMSPageBySlug(route.path.slice(1)) : route.kind === 'blogPost' ? getBlogPostBySlug(slug) : route.kind === 'blog' ? (apiMode?Promise.resolve(null):getEditorialPreviews()) : Promise.resolve(null), [route.path, route.kind, slug]);
  const {data,loading,error,retry} = useAsyncData(loader);
  if(apiMode&&route.kind==='blog')return <Suspense fallback={<LoadingState/>}><LiveBlog/></Suspense>;
  if(loading) return <LoadingState />;
  if(error) return <ErrorState retry={retry} />;
  if((route.kind === 'blogPost'||apiMode&&route.kind==='cms') && !data) return <NotFoundPage />;
  if(route.kind === 'blog') return <section className="container page-section"><h1>From Our Journal</h1><p className="section-description">{apiMode?'Published stories from Virasat Organics.':'Editorial previews and locally published demo articles.'}</p><JournalCards posts={data}/></section>;
  if(route.kind === 'blogPost' && data.status === 'editorial_draft') return <section className="container page-section"><p className="eyebrow">Editorial draft · Not yet published</p><h1>{data.title}</h1><p className="section-description">{data.excerpt}</p><p className="quiet-note">This article is being prepared. The full story will be available after editorial review.</p></section>;
  if(data && (route.kind==="blogPost"||route.kind==="cms"))return <><ContentDocument record={data}/>{route.path==="/contact"&&business.contactsVisible!==false&&<section className="container page-section"><h2>Contact information</h2>{business.email&&<p>Email: {business.email}</p>}{business.phone&&<p>Phone: {business.phone}</p>}{business.whatsapp&&<p>WhatsApp: {business.whatsapp}</p>}{business.address&&<address>{business.address}</address>}{business.operatingHours&&<p>Operating hours: {business.operatingHours}</p>}{!business.email&&!business.phone&&!business.address&&<p>Official contact details have not been supplied.</p>}</section>}</>;
  return <PlaceholderState title={data?.title || route.label} description={data?.description || (route.path.startsWith('/order-success') ? 'Order confirmation placeholder. No order has been placed and no payment has been collected.' : route.path === '/login' ? 'Sign-in will be implemented later. No OTP verification or authentication is available.' : undefined)} />;
}



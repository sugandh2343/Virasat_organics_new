import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {safeWebUrl} from '../domain/contentSelectors';
const entries=new Map();let baseline=null;
function render(){
 if(!baseline)baseline={title:document.title};
 const ordered=[...entries.values()].sort((a,b)=>a.priority-b.priority);const value=Object.assign({},...ordered.map(x=>x.value));document.title=value.title||baseline.title;
 for(const [key,attribute,content]of [['description','name',value.description],['og:title','property',value.title],['og:description','property',value.description],['og:image','property',value.image]]){let node=document.head.querySelector(`meta[${attribute}="${key}"]`);if(!content){if(node?.dataset.virasatSeo)node.remove();continue;}if(!node){node=document.createElement('meta');node.setAttribute(attribute,key);node.dataset.virasatSeo='true';document.head.appendChild(node);}node.content=content;}
 let link=document.head.querySelector('link[rel="canonical"]');if(value.canonical){if(!link){link=document.createElement('link');link.rel='canonical';link.dataset.virasatSeo='true';document.head.appendChild(link);}link.href=value.canonical;}else if(link?.dataset.virasatSeo)link.remove();
}
export function useSEO(seo,disabled=false,priority=1){
 const {pathname}=useLocation();const title=seo?.title||'',description=seo?.description||'',image=seo?.image?.src||'',site=seo?.siteUrl||'';
 useEffect(()=>{if(disabled||!seo)return;const key=Symbol('seo'),value={};if(title)value.title=title;if(description)value.description=description;if(image){try{const url=new URL(image,safeWebUrl(site)?site:window.location.origin).href;if(safeWebUrl(url))value.image=url;}catch{}}
 const base=safeWebUrl(site)?site:window.location.origin;if(safeWebUrl(base))value.canonical=new URL(pathname,base).href;entries.set(key,{priority,value});render();return()=>{entries.delete(key);render();};},[title,description,image,site,pathname,disabled,priority]);
}

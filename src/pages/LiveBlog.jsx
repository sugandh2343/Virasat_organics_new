import {useState,useCallback} from 'react';
import {blogPage,contentList} from '../services/cmsApi';
import {useAsyncData} from '../hooks/useAsyncData';
import {LoadingState,ErrorState} from '../components/ui/PageStates';
import {SecondaryButton} from '../components/ui';
import {JournalCards} from '../components/home/HomeEditorial';
const categories=()=>contentList('/blog/categories');
export default function LiveBlog(){
 const [q,setQ]=useState(''),[category,setCategory]=useState(''),[page,setPage]=useState(1);
 const loader=useCallback(()=>blogPage({q,category,page}),[q,category,page]);const {data,loading,error,retry}=useAsyncData(loader);const cats=useAsyncData(categories);
 return <section className="container page-section"><h1>From Our Journal</h1><p className="section-description">Published stories from Virasat Organics.</p><div className="cms-fields"><label className="catalogue-field">Search articles<input type="search" maxLength={100} value={q} onChange={e=>{setQ(e.target.value);setPage(1);}}/></label><label className="catalogue-field">Category<select value={category} onChange={e=>{setCategory(e.target.value);setPage(1);}}><option value="">All categories</option>{cats.data?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>{cats.error&&<ErrorState retry={cats.retry}/>} {loading?<LoadingState/>:error?<ErrorState retry={retry}/>:<><p>{data.meta.total} articles</p><JournalCards posts={data.data}/>{!data.data.length&&<p>No published articles match your search.</p>}<nav aria-label="Article pages"><SecondaryButton disabled={page===1} onClick={()=>setPage(page-1)}>Previous</SecondaryButton><span> Page {page} </span><SecondaryButton disabled={page*12>=data.meta.total} onClick={()=>setPage(page+1)}>Next</SecondaryButton></nav></>}</section>;
}

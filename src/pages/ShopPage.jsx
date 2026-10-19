import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Leaf, SlidersHorizontal, Search } from 'lucide-react';
import { Container, SectionHeading, ProductCard, EmptyState, SecondaryButton, PrimaryButton, Breadcrumbs, DrawerShell } from '../components/ui';
import { LoadingState, ErrorState } from '../components/ui/PageStates';
import { getProducts } from '../services/productService';
import { getCategories } from '../services/contentService';
import { useAsyncData } from '../hooks/useAsyncData';
import { useStorefront } from '../state/StorefrontContext';
import { browseProducts, defaultFilters, availabilityOptions, sortOptions, hasCataloguePrices, resolveCategory } from '../domain/catalogueSelectors';
import { searchContent } from '../mock-data/search';
import '../styles/shop.css';
async function loadCatalogue() { const [products,categories] = await Promise.all([getProducts(),getCategories()]); return {products,categories}; }
function FilterFields({value,onChange,categories,prices,id}) {
  const field = (key,label,options) => <label htmlFor={id+key}>{label}<select id={id+key} value={value[key]} onChange={event=>onChange({...value,[key]:event.target.value})}>{options.map(([key,text])=><option value={key} key={key}>{text}</option>)}</select></label>;
  return <div className="shop-filter-fields">
    {field('category','Category',[['','All'],...categories.map(category=>[category.slug,category.name])])}
    {field('availability','Availability',availabilityOptions)}
    {field('sort','Sort by',prices ? [...sortOptions,['price-asc','Price Low–High'],['price-desc','Price High–Low']] : sortOptions)}
    {prices && <fieldset><legend>Price range (₹)</legend>{['min','max'].map(key=><label key={key} htmlFor={id+key}>{key==='min'?'Minimum price':'Maximum price'}<input id={id+key} type="number" min="0" step="any" value={value[key]} onChange={event=>onChange({...value,[key]:event.target.value})}/></label>)}</fieldset>}
  </div>;
}
export default function ShopPage({searchMode=false}) {
  const {slug} = useParams(); const navigate = useNavigate();
  const [params,setParams] = useSearchParams();
  const {data,loading,error,retry} = useAsyncData(loadCatalogue);
  const {state,dispatch} = useStorefront();
  const [open,setOpen] = useState(false);
  const [draft,setDraft] = useState(defaultFilters);
  if (loading) return <LoadingState label="Loading collection…" />;
  if (error) return <ErrorState retry={retry}/>;
  const filters = Object.fromEntries(Object.keys(defaultFilters).map(key=>[key,params.get(key)||'']));
  filters.category = slug || filters.category;
  const category = resolveCategory(data.categories,filters.category);
  const query = params.get('q') || '';
  const prices = hasCataloguePrices(data.products);
  const apply = (next, q=query) => {
    const updated = new URLSearchParams();
    if(q) updated.set('q',q);
    Object.entries(next).forEach(([key,value])=>{if(value) updated.set(key,value);});
    if(slug && next.category!==slug) setParams(updated);
    else setParams(updated,{replace:true});
  };
  const change = next => {
    if(slug && next.category!==slug) {
      const updated = new URLSearchParams({...Object.fromEntries(Object.entries(next).filter(([,value])=>value)),...(query?{q:query}:{})});
      navigate('/shop' + (updated.size ? '?' + updated.toString() : ''));
    } else apply(next);
  };
  const reset = ()=>apply({...defaultFilters,category:slug||''},'');
  const results = browseProducts(data.products,data.categories,{...filters,q:query});
  const invalid = filters.category && !category;
  return <Container as="section" className="shop-page">
    <Breadcrumbs items={[{label:'Home',to:'/'},...(category?[{label:'Shop',to:'/shop'},{label:category.name}]:[{label:searchMode?'Search':'Shop'}])]} />
    <header className="shop-editorial"><Leaf className="shop-botanical" size={160} strokeWidth={.6} aria-hidden="true"/><SectionHeading as="h1" eyebrow="THE EVERYDAY PANTRY" title={invalid?'Collection not found.':category?.name || (searchMode?searchContent.title:'The Virasat Collection')} description={category?.description || (searchMode?searchContent.description:'Everyday essentials, rooted in tradition.')} /></header>
    {invalid ? <EmptyState title="This collection is not available." description="Explore our current collection instead."><SecondaryButton to="/shop">Explore all products</SecondaryButton></EmptyState> : <>
      <nav className="shop-shortcuts" aria-label="Shop categories"><Link to="/shop" aria-current={!filters.category&&!searchMode?'page':undefined}>All products</Link>{data.categories.map(item=><Link key={item.id} to={'/shop/category/'+item.slug} aria-current={category?.id===item.id?'page':undefined}>{item.name}</Link>)}</nav>
      <form className="product-search-form" role="search" onSubmit={event=>event.preventDefault()}><Search size={20} aria-hidden="true"/><label className="sr-only" htmlFor="product-search">Search products</label><input id="product-search" type="search" placeholder="Try atta, mustard oil or 500 ml" value={query} onChange={event=>apply(filters,event.target.value)} aria-describedby="shop-results"/>{query&&<button type="button" onClick={()=>apply(filters,'')} aria-label="Clear search">Clear</button>}</form>
      <div className="shop-desktop-filters"><FilterFields value={filters} onChange={change} categories={data.categories} prices={prices} id="desktop-"/><SecondaryButton onClick={reset}>Reset filters</SecondaryButton></div>
      <div className="shop-results-bar"><p id="shop-results" role="status">{results.length} {results.length===1?'product':'products'}{query.trim()?' found for “'+query.trim()+'”':''}</p><SecondaryButton className="shop-mobile-filter" onClick={()=>{setDraft(filters);setOpen(true);}}><SlidersHorizontal size={16}/>Filters & sort</SecondaryButton></div>
      {results.length?<div className="shop-product-grid">{results.map(product=><ProductCard key={product.id} product={product} wishlisted={state.wishlist.includes(product.id)} onWishlist={item=>dispatch({type:'wishlist/toggle',id:item.id})} onAddToCart={item=>dispatch({type:'cart/add',product:item})}/>)}</div>:<EmptyState title="No matches just yet." description="Try a different search or reset your filters to explore this collection."><SecondaryButton onClick={reset}>Reset search & filters</SecondaryButton></EmptyState>}
      <DrawerShell open={open} onClose={()=>setOpen(false)} title="Refine your collection" footer={<><SecondaryButton onClick={()=>setDraft({...defaultFilters,category:slug||''})}>Reset</SecondaryButton><PrimaryButton onClick={()=>{change(draft);setOpen(false);}}>Apply filters</PrimaryButton></>}><FilterFields value={draft} onChange={setDraft} categories={data.categories} prices={prices} id="mobile-"/></DrawerShell>
    </>}
  </Container>;
}



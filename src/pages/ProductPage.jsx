import {useSEO} from '../hooks/useSEO';
import { StructuredContent } from '../components/admin/ContentDocument';
import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart, Minus, Plus, ShoppingBag } from 'lucide-react';
import { getProductBySlug, getProducts } from '../services/productService';
import { getCategories, getCMSPageBySlug } from '../services/contentService';
import { getProductAvailability } from '../domain/productSelectors';
import { quantityLimit, clampQuantity, relatedProducts, configuredValue, productSpecifications } from '../domain/productDetailSelectors';
import { productDetailContent, specificationLabels } from '../mock-data/productDetail';
import { useAsyncData } from '../hooks/useAsyncData';
import { useStorefront } from '../state/StorefrontContext';
import { LoadingState, ErrorState } from '../components/ui/PageStates';
import { Breadcrumbs, PriceDisplay, StatusBadge, PrimaryButton, SecondaryButton, IconButton, ProductCard, SectionHeading } from '../components/ui';
import ProductMediaViewer from '../components/media/ProductMediaViewer';
import DeliveryPreview from '../components/product/DeliveryPreview';
import NotFoundPage from './NotFoundPage';
import '../styles/product-detail.css';
export function DetailValue({value}) {
 value=configuredValue(value); if(value===null)return null;
 if(Array.isArray(value))return <ul>{value.map((item,i)=><li key={i}><DetailValue value={item}/></li>)}</ul>;
 if(typeof value==='object')return <dl>{Object.entries(value).map(([key,item])=><div key={key}><dt>{specificationLabels[key] || key}</dt><dd><DetailValue value={item}/></dd></div>)}</dl>;
 return <p>{String(value)}</p>;
}
export function ProductInformation({product,policies=[]}) {
 return <section className="product-information" aria-label="Product information">{[
 ['Product Description',product.longDescription || product.shortDescription],
 ['Ingredients',product.ingredients],['Nutritional Information',product.nutrition],
 ['Product Specifications',productSpecifications(product)],['Storage Instructions',product.storage]
 ].filter(([,value])=>configuredValue(value)!==null).map(([title,value])=><details key={title}><summary>{title}</summary><div><DetailValue value={value}/></div></details>)}
 <details><summary>Shipping &amp; Returns</summary><div>{policies.filter(policy=>policy?.status==='published' && (configuredValue(policy.body)!==null || policy.blocks?.length>0)).map(policy=><div key={policy.id}><h3>{policy.title}</h3>{policy.blocks?.length ? <StructuredContent blocks={policy.blocks}/> : <DetailValue value={policy.body}/>}</div>)}<Link to="/shipping-policy">Shipping information</Link> · <Link to="/returns-refunds">Returns &amp; refunds</Link></div></details></section>;
}
function ProductDetail({product,products,categories,policies}) {
 useSEO({...product.seo,title:product.seo?.title||product.name,description:product.seo?.description||product.shortDescription});
 const {state,dispatch}=useStorefront();
 const [quantity,setQuantity]=useState(1);
 const availability=getProductAvailability(product);
 const limit=quantityLimit(product,state.cart);
 const amount=clampQuantity(quantity,limit);
 const category=categories.find(item=>item.id===product.categoryId);
 const related=relatedProducts(products,product);
 const saved=state.wishlist.includes(product.id);
 const cartQuantity=state.cart.find(item=>item.productId===product.id)?.quantity || 0;
 return <section className="container product-detail-page">
 <Breadcrumbs items={[{label:'Home',to:'/'},{label:'Shop',to:'/shop'},...(category?[{label:category.name,to:'/shop/category/'+category.slug}]:[]),{label:product.name+' — '+product.size}]}/>
 <div className="product-detail-grid">
 <div className="product-detail-gallery"><ProductMediaViewer key={product.id} product={product}/></div>
 <div className="product-purchase"><p className="eyebrow">{category?.name || product.category}</p><h1>{product.name}</h1><p className="product-detail-size">{product.size}</p><StatusBadge status={availability.status}/><div className="product-detail-price"><PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice}/></div><p className="product-detail-description">{product.shortDescription || productDetailContent.missing}</p>
 {(product.sku || product.SKU)&&<p className="quiet-note">SKU: {product.sku || product.SKU}</p>}
 <div className="product-purchase-controls"><div className="product-quantity" role="group" aria-label="Quantity"><IconButton label="Decrease quantity" disabled={!limit || amount<=1} onClick={()=>setQuantity(amount-1)}><Minus size={16}/></IconButton><output aria-label="Quantity" aria-live="polite">{amount}</output><IconButton label="Increase quantity" disabled={!limit || amount>=limit} onClick={()=>setQuantity(amount+1)}><Plus size={16}/></IconButton></div>
 <PrimaryButton disabled={!availability.purchasable || !limit} onClick={()=>dispatch({type:'cart/add',product,quantity:amount})}><ShoppingBag size={17}/>{!availability.purchasable?availability.label:!limit?'Cart limit reached':'Add to Cart'}</PrimaryButton></div>
 <SecondaryButton aria-pressed={saved} onClick={()=>dispatch({type:'wishlist/toggle',id:product.id})}><Heart size={17} fill={saved?'currentColor':'none'}/>{saved?'Saved to wishlist':'Save to wishlist'}</SecondaryButton>
 <p className="quiet-note">{productDetailContent.localCart}</p>{cartQuantity>0&&<p role="status">{cartQuantity} in your local preview cart.</p>}
 <DeliveryPreview/>

 </div></div>
 <ProductInformation product={product} policies={policies}/>
 {related.length>0&&<section className="product-related"><SectionHeading eyebrow="EXPLORE THE PANTRY" title="Related Products" description="More from this collection."/><div className="product-related-grid">{related.map(item=><ProductCard key={item.id} product={item} wishlisted={state.wishlist.includes(item.id)} onWishlist={entry=>dispatch({type:'wishlist/toggle',id:entry.id})} onAddToCart={entry=>dispatch({type:'cart/add',product:entry})}/>)}</div></section>}
 </section>;
}
export default function ProductPage() {
 const {slug}=useParams();
 const loader=useCallback(async()=>{const [product,products,categories,shipping,returns]=await Promise.all([getProductBySlug(slug),getProducts(),getCategories(),getCMSPageBySlug('shipping-policy'),getCMSPageBySlug('returns-refunds')]);return {product,products,categories,policies:[shipping,returns]};},[slug]);
 const {data,loading,error,retry}=useAsyncData(loader);
 if(loading)return <LoadingState label="Loading product…"/>;
 if(error)return <ErrorState retry={retry}/>;
 if(!data.product)return <NotFoundPage/>;
 return <ProductDetail key={data.product.id} {...data}/>;
}

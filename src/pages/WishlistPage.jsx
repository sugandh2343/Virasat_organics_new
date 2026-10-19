import { Container, SectionHeading, Breadcrumbs, ProductCard, EmptyState, SecondaryButton } from '../components/ui';
import { LoadingState, ErrorState } from '../components/ui/PageStates';
import { useStorefront } from '../state/StorefrontContext';
import { isProductVisible } from '../domain/productSelectors';
import { cartContent } from '../mock-data/cart';
import '../styles/cart.css';
export default function WishlistPage(){
 const {state,dispatch,catalogue,loading,error,retry,customer}=useStorefront();
 if(customer.enabled&&customer.loading)return <LoadingState label="Loading your wishlist…"/>;
 if(customer.enabled&&customer.error)return <Container className="page-section"><p role="alert">{customer.error}</p><SecondaryButton onClick={customer.refresh}>Retry</SecondaryButton></Container>;
 if(customer.enabled&&state.session.mode!=='authenticated')return <Container className="page-section"><EmptyState title="Your favourites, saved securely." description="Sign in to view your wishlist."><SecondaryButton to="/login">Sign in</SecondaryButton></EmptyState></Container>;
 if(loading)return <LoadingState label="Loading saved favourites…"/>;
 if(error)return <ErrorState retry={retry}/>;
 const products=state.wishlist.map(id=>catalogue.find(product=>product.id===id)).filter(product=>product&&isProductVisible(product));
 return <Container className="page-section wishlist-page"><Breadcrumbs items={[{label:'Home',to:'/'},{label:'Wishlist'}]}/><SectionHeading as="h1" eyebrow="SAVED FOR LATER" title={cartContent.wishlistTitle} description={cartContent.wishlistDescription}><SecondaryButton to="/shop">Continue Shopping</SecondaryButton></SectionHeading><p role="status">{products.length} saved {products.length===1?'product':'products'}</p>
 {products.length?<div className="wishlist-grid">{products.map(product=><ProductCard key={product.id} product={product} wishlisted onWishlist={item=>dispatch({type:'wishlist/toggle',id:item.id})} onAddToCart={item=>dispatch({type:'cart/add',product:item})}/>)}</div>:<EmptyState title="Make room for your favourites." description="Tap a product’s heart to keep it here for later."><SecondaryButton to="/shop">Explore the collection</SecondaryButton></EmptyState>}<p className="quiet-note">{customer.enabled?'Saved to your account.':cartContent.localNotice}</p></Container>;
}

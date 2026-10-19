import { useState } from 'react';
import { Container, SectionHeading, Breadcrumbs, SecondaryButton, PrimaryButton, ModalShell } from '../components/ui';
import { LoadingState, ErrorState } from '../components/ui/PageStates';
import { useStorefront } from '../state/StorefrontContext';
import { cartSummary } from '../domain/cartSelectors';
import { cartSettings,cartContent } from '../mock-data/cart';
import { CartItems,CartSummary,EmptyCart } from '../components/cart/CartContents';
import '../styles/cart.css';
export default function CartPage(){
 const {state,dispatch,catalogue,loading,error,retry}=useStorefront();
 const [confirm,setConfirm]=useState(false);
 if(loading)return <LoadingState label="Loading your basket…"/>;
 if(error)return <ErrorState retry={retry}/>;
 const summary=cartSummary(state.cart,catalogue,cartSettings);
 return <Container className="page-section cart-page"><Breadcrumbs items={[{label:'Home',to:'/'},{label:'Cart'}]}/><SectionHeading as="h1" eyebrow="YOUR BASKET" title={cartContent.title} description={cartContent.description}/>
 {summary.items.length?<><div className="cart-page-actions"><SecondaryButton to="/shop">Continue Shopping</SecondaryButton><SecondaryButton onClick={()=>setConfirm(true)}>Clear cart</SecondaryButton></div><div className="cart-page-grid"><CartItems items={summary.items}/><CartSummary summary={summary}/></div></>:<><EmptyCart/><CartSummary summary={summary}/></>}
 <ModalShell open={confirm} onClose={()=>setConfirm(false)} title="Clear your cart?" description="All items will be removed from this browser’s cart." footer={<><SecondaryButton onClick={()=>setConfirm(false)}>Keep items</SecondaryButton><PrimaryButton onClick={()=>{dispatch({type:'cart/clear'});setConfirm(false);}}>Remove all items</PrimaryButton></>}/>
 </Container>;
}

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DrawerShell } from '../ui';
import { LoadingState,ErrorState } from '../ui/PageStates';
import { useStorefront } from '../../state/StorefrontContext';
import { cartSummary } from '../../domain/cartSelectors';
import { cartSettings } from '../../mock-data/cart';
import { CartItems,CartSummary,EmptyCart } from './CartContents';
import '../../styles/cart.css';
export default function CartDrawer(){
 const {state,dispatch,catalogue,loading,error,retry}=useStorefront();
 const location=useLocation();
 const close=()=>dispatch({type:'overlay/set',value:null});
 useEffect(()=>{dispatch({type:'overlay/set',value:null});},[location.key,dispatch]);
 const summary=cartSummary(state.cart,catalogue,cartSettings);
 return <DrawerShell id="shopping-cart-drawer" className="cart-drawer" open={state.overlay==='cart'} onClose={close} title="Your basket" description="A little goodness, thoughtfully chosen.">
 {loading?<LoadingState/>:error?<ErrorState retry={retry}/>:<>{summary.items.length?<CartItems items={summary.items} onNavigate={close}/>:<EmptyCart onNavigate={close}/>}<CartSummary summary={summary} onNavigate={close} drawer/></>}
 </DrawerShell>;
}

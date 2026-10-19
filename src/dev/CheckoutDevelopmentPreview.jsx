import DevelopmentAdmin,{DevelopmentAdminDashboard} from './DevelopmentAdmin';
import OperationsWorkspace from '../pages/admin/OperationsWorkspace';
import AccountPage from '../pages/AccountPage';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { StorefrontProvider, useStorefront } from '../state/StorefrontContext';
import CheckoutPreview from '../pages/CheckoutPreview';
import OrderSuccessPage from '../pages/OrderSuccessPage';
import { Container, PrimaryButton, SecondaryButton } from '../components/ui';
import { PlaceholderState } from '../components/ui/PageStates';
import { CheckoutItems } from '../components/checkout/CheckoutParts';
import { cartSummary } from '../domain/cartSelectors';
import { checkoutFixture } from './checkoutFixture';
function FixtureCart(){
 const {state,dispatch}=useStorefront();
 return <Container className="page-section"><h1>Illustrative demo cart</h1><CheckoutItems items={cartSummary(state.cart,state.catalogue).items}/>{state.cart.map(item=><div className="checkout-actions" key={item.productId}><label>Quantity for {state.catalogue.find(product=>product.id===item.productId).size} <input type="number" min="1" max={state.catalogue.find(product=>product.id===item.productId).stock} value={item.quantity} onChange={event=>dispatch({type:"cart/quantity",id:item.productId,quantity:Number(event.target.value)})}/></label><SecondaryButton onClick={()=>dispatch({type:"cart/remove",id:item.productId})}>Remove {state.catalogue.find(product=>product.id===item.productId).size}</SecondaryButton></div>)}<PrimaryButton to="/dev/checkout">Return to demo checkout</PrimaryButton></Container>;
}
function Preview(){
 const {state,dispatch}=useStorefront();const navigate=useNavigate();
 return <><div className="checkout-dev-banner"><strong>DEVELOPMENT FIXTURE ONLY · Illustrative products, prices, inventory and charges</strong><p>Isolated memory store. No real catalogue data, persistent storage, business order or payment.</p>{state.session.mode!=='demo'?<PrimaryButton onClick={()=>dispatch({type:'session/demo'})}>Start isolated demo session</PrimaryButton>:<SecondaryButton onClick={()=>{dispatch({type:'session/clear'});navigate('/dev/checkout');}}>End demo session</SecondaryButton>}<SecondaryButton onClick={()=>{dispatch({type:'cart/set',value:checkoutFixture.cart});navigate('/dev/checkout');}}>Reset illustrative cart</SecondaryButton><Link to="/dev/checkout/account">Demo account</Link> · <Link to="/dev/checkout/account/orders">My Demo Orders</Link> · <Link to="/dev/checkout/admin">Demo administration</Link> · <Link to="/shop">Exit to public shop</Link></div>
 <Routes><Route path="admin" element={<DevelopmentAdmin/>}><Route index element={<DevelopmentAdminDashboard/>}/>{[['orders','orders'],['orders/:orderId','order-detail'],['customers','customers'],['customers/:customerId','customer-detail']].map(([path,kind])=><Route key={path} path={path} element={<OperationsWorkspace kind={kind} basePath="/dev/checkout/admin"/>}/>)}</Route><Route index element={<CheckoutPreview fixture successBase="/dev/checkout/order-success" editCartPath="/dev/checkout/cart"/>}/><Route path="cart" element={<FixtureCart/>}/><Route path="order-success/:orderId" element={<OrderSuccessPage ordersPath="/dev/checkout/account/orders"/>}/><Route path="orders" element={<Navigate to="/dev/checkout/account/orders" replace/>}/>{["account","account/profile","account/addresses","account/orders","account/orders/:orderId"].map(path=><Route key={path} path={path} element={<AccountPage fixture basePath="/dev/checkout/account" cartPath="/dev/checkout/cart"/>}/>)}<Route path="*" element={<PlaceholderState title="Preview unavailable"/>}/></Routes></>;
}
export default function CheckoutDevelopmentPreview(){
 return <StorefrontProvider developmentFixture={checkoutFixture}><Preview/></StorefrontProvider>;
}




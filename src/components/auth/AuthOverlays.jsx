import { Link } from 'react-router-dom';
import { DrawerShell,ModalShell,SecondaryButton } from '../ui';
import { useStorefront } from '../../state/StorefrontContext';
import { authContent } from '../../mock-data/auth';
import AuthFlow from './AuthFlow';
import '../../styles/auth.css';
export function AccountMenu({onClose}){
 const {state,dispatch,customer}=useStorefront();
 return <div className="account-menu"><p className="auth-demo-label">{customer.enabled?'Your verified mobile account':'Demo Customer · unverified'}</p>{state.session.profile?.name&&<p>{state.session.profile.name}</p>}<p className="quiet-note">{customer.enabled?'Your account is protected by a server session.':authContent.sessionNotice}</p><nav aria-label="Customer account">{authContent.links.map(link=><Link key={link.to} to={link.to} onClick={onClose}>{link.label}</Link>)}</nav><SecondaryButton onClick={()=>{dispatch({type:'session/clear'});onClose?.();}}>{customer.enabled?'Logout':'Logout and reset demo'}</SecondaryButton>{customer.error&&<p role="alert">{customer.error}</p>}</div>;
}
export default function AuthOverlays(){
 const {state,dispatch,customer}=useStorefront();
 const close=()=>dispatch({type:'overlay/set',value:null});
 return <><ModalShell open={state.overlay==='auth'} onClose={close} title="Your Virasat account" className="auth-modal">{state.overlay==='auth'&&<AuthFlow onClose={close}/>}</ModalShell><DrawerShell open={state.overlay==='account'} onClose={close} title={customer.enabled?'Your account':'Demo Customer'}>{state.overlay==='account'&&<AccountMenu onClose={close}/>}</DrawerShell></>;
}

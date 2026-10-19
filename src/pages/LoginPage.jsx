import { useSearchParams,useLocation } from 'react-router-dom';
import { Container,SecondaryButton } from '../components/ui';
import { PlaceholderState } from '../components/ui/PageStates';
import { useStorefront } from '../state/StorefrontContext';
import AuthFlow from '../components/auth/AuthFlow';
import { AccountMenu } from '../components/auth/AuthOverlays';
import { safeReturnPath } from '../services/authService';
import '../styles/auth.css';
export default function LoginPage(){
 const [params]=useSearchParams();
 const {state}=useStorefront();
 return <Container className="page-section auth-page"><h1>Your Virasat account</h1>{['demo','authenticated'].includes(state.session.mode)?<AccountMenu/>:<AuthFlow returnTo={safeReturnPath(params.get('returnTo'))}/>}</Container>;
}
export function CustomerGate({route}){
 const {state}=useStorefront();
 const location=useLocation();
 if(state.session.mode!=='demo')return <Container className="page-section auth-page"><h1>A space for your everyday goodness.</h1><p>This customer screen is a static preview. Start a demo session to explore the placeholder.</p><SecondaryButton to={'/login?returnTo='+encodeURIComponent(location.pathname)}>Open demo login</SecondaryButton></Container>;
 return <><Container className="account-session-strip"><p>Demo Customer · identity not verified</p><SecondaryButton to="/login">Manage demo session</SecondaryButton></Container><PlaceholderState title={route.label} label="Customer demo placeholder" description="This customer screen will be implemented in a later phase. The demo session is not authentication or a security boundary."/></>;
}

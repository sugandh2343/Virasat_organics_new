import {apiMode} from '../services/catalogueApi';
import {useStorefront} from '../state/StorefrontContext';
function CustomerActionNotice(){const {customer}=useStorefront();return customer.enabled&&customer.actionError?<p className="container quiet-note" role="alert">{customer.actionError}</p>:null;}
import LocationOverlay from '../components/account/LocationSelector';
import AuthOverlays from '../components/auth/AuthOverlays';
import CartDrawer from '../components/cart/CartDrawer';
import { BusinessProvider,useBusiness } from '../state/BusinessContext';
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
function StoreNotice(){const business=useBusiness();return business.store?.active===false?<p className="container admin-preview-notice">{apiMode?'The store is undergoing maintenance. Browsing remains available; new orders are paused.':'Local maintenance preview · browsing remains available. No real orders are accepted.'}</p>:null;}
export default function SiteLayout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return <BusinessProvider><div className="site"><a className="skip-link" href="#main">Skip to content</a><Header /><StoreNotice/><CustomerActionNotice/><CartDrawer /><AuthOverlays /><LocationOverlay /><main id="main" tabIndex={-1}><Outlet /></main><Footer /></div></BusinessProvider>;
}






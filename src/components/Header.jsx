import { useCatalogueLinks } from '../hooks/useCatalogueLinks';
import { useStorefront } from '../state/StorefrontContext';
import { useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { MapPin, Menu, Search, UserRound, Heart, ShoppingBag, ArrowUpRight } from 'lucide-react';
import Brand from './Brand';
import ShopDropdown from './ShopDropdown';
import { Container, DrawerShell, IconButton } from './ui';
import { navigation, accountLinks } from '../mock-data/navigation';
import { useBusiness } from '../state/BusinessContext';
import { getHeaderCounts } from '../mock-data/headerState';
const icons = { account: UserRound, wishlist: Heart, cart: ShoppingBag };
export default function Header() {
  const shopLinks=useCatalogueLinks();
  const business=useBusiness();
  const { state, dispatch, setNavigationOpen: setOpen } = useStorefront();
  const open = state.overlay === 'navigation';
  const location = useLocation();
  const counts = getHeaderCounts(state.cart, state.wishlist);
  useEffect(() => { setOpen(false); }, [location.key]);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 75rem)');
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);
  const close = () => setOpen(false);
  return <>
    {business.announcementEnabled!==false&&<div className="announcement nav-announcement">{business.previewNotice}</div>}
    <header className="site-header premium-header"><Container className="premium-header-inner">
      <IconButton className="mobile-menu-trigger" label="Open navigation" aria-expanded={open} aria-controls="mobile-site-navigation" onClick={() => setOpen(true)}><Menu size={21} aria-hidden="true" /></IconButton>
      <Brand />
      <nav className="desktop-navigation" aria-label="Main navigation">
        {navigation.map(item => item.path === '/shop' ? <ShopDropdown key={item.path} /> : <NavLink key={item.path} to={item.path} end={item.path === '/'}>{item.label}</NavLink>)}
      </nav>
      <nav className="header-actions" aria-label="Shopping tools">
        <Link className="header-tool" to="/search" aria-label="Search products" title="Search products"><Search size={20} aria-hidden="true" /><span className="search-tool-label">Search</span></Link>
        {accountLinks.map(item => { const Icon = icons[item.icon]; const count = counts[item.icon]; if(item.icon==='account')return <button type="button" key={item.path} className="header-tool header-tool--account" aria-label={state.session.mode==='authenticated'?'Customer account':state.session.mode==='demo'?'Demo Customer account':'Account'} aria-haspopup="dialog" onClick={()=>dispatch({type:'overlay/set',value:['demo','authenticated'].includes(state.session.mode)?'account':'auth'})}><Icon size={20} aria-hidden="true"/></button>; if(item.icon==='cart')return <button key={item.path} type="button" className="header-tool header-tool--cart" aria-label={'Cart, '+count+' items'} aria-haspopup="dialog" aria-controls="shopping-cart-drawer" aria-expanded={state.overlay==='cart'} onClick={()=>dispatch({type:'overlay/set',value:'cart'})}><Icon size={20} aria-hidden="true"/><span className="header-count" aria-hidden="true">{count>99?'99+':count}</span></button>; return <Link key={item.path} className={'header-tool header-tool--' + item.icon} to={item.path} aria-label={item.label + (count !== undefined ? ', ' + count + ' items' : '')} title={item.label}><Icon size={20} aria-hidden="true" />{count !== undefined && <span className="header-count" aria-hidden="true">{count > 99 ? '99+' : count}</span>}</Link>; })}
      </nav>
    </Container><div className="header-location-bar"><Container><button type="button" aria-haspopup="dialog" onClick={()=>dispatch({type:'overlay/set',value:'location'})}><MapPin size={14} aria-hidden="true"/>{state.location?.postalCode?'Deliver to: '+state.location.postalCode:'Select delivery location'}</button></Container></div></header>
    <DrawerShell open={open} onClose={close} title={<Brand onClick={close} />} className="mobile-navigation-shell" id="mobile-site-navigation" footer={<p className="caption">{business.tagline}</p>}>
      <nav className="mobile-navigation" aria-label="Mobile navigation">
        {navigation.map(item => <div key={item.path}><NavLink to={item.path} end={item.path === '/'} onClick={close}>{item.label}<ArrowUpRight size={17} aria-hidden="true" /></NavLink>
          {item.path === '/shop' && <div className="mobile-shop-links">{shopLinks.map(link => <Link key={link.path} to={link.path} onClick={close}>{link.label}</Link>)}</div>}
        </div>)}
      </nav>
      <nav className="mobile-account-links" aria-label="Your shopping tools">{accountLinks.map(item => { const Icon = icons[item.icon]; return <Link key={item.path} to={item.path} onClick={close}><Icon size={18} aria-hidden="true" />{item.label}{counts[item.icon] !== undefined && <span>{counts[item.icon]}</span>}</Link>; })}</nav>
    </DrawerShell>
  </>;
}








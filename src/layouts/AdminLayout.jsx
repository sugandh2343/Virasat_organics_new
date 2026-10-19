import {apiMode,adminLogout} from '../services/catalogueApi';
import AdminApiGate from '../components/admin/AdminApiGate';
import { useState,useEffect,useCallback,useRef } from 'react';
import { Outlet,useLocation,useNavigate,matchPath } from 'react-router-dom';
import { DrawerShell,Breadcrumbs } from '../components/ui';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminTopbar from '../components/admin/AdminTopbar';
import { AdminConfirmDialog } from '../components/admin/AdminUI';
import { adminRoutes } from '../routes/adminRegistry';
import { adminPreviewNotice } from '../mock-data/admin';
import { useStorefront } from '../state/StorefrontContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { getAdminSnapshot } from '../services/adminService';
import '../styles/admin.css';
export default function AdminLayout(){return apiMode?<AdminApiGate><AdminShell/></AdminApiGate>:<AdminShell/>;}
function AdminShell() {
 const [collapsed,setCollapsed]=useState(false);const [mobileOpen,setMobileOpen]=useState(false);const [dense,setDense]=useState(false);const [logout,setLogout]=useState(false);
 const {pathname}=useLocation();const navigate=useNavigate();const {state}=useStorefront();const main=useRef(null);const previousPath=useRef(pathname);
 const needsCatalogue=/^\/admin\/(products|categories)(?:\/|$)/.test(pathname);
 const loader=useCallback(()=>apiMode&&!needsCatalogue?Promise.resolve(null):getAdminSnapshot(state.session),[state.session,needsCatalogue]);const data=useAsyncData(loader);
 const route=adminRoutes.find(route=>matchPath(route.path,pathname));
 useEffect(()=>{setMobileOpen(false);if(previousPath.current!==pathname){main.current?.focus();previousPath.current=pathname;}},[pathname]);
 useEffect(()=>{const query=window.matchMedia('(min-width:1024px)');const close=()=>{if(query.matches)setMobileOpen(false);};query.addEventListener('change',close);return()=>query.removeEventListener('change',close);},[]);
 const leave=()=>{setMobileOpen(false);setLogout(true);};
 const [logoutError,setLogoutError]=useState('');
 const confirmLogout=async()=>{try{if(apiMode)await adminLogout();navigate(apiMode?'/admin/login':'/',{replace:true});}catch(e){setLogoutError(e.message);}};
 return <div className={'admin-root '+(collapsed?'admin-collapsed ':'')+(dense?'admin-dense':'')}><a href="#admin-main" className="skip-link">Skip to admin content</a><aside className="admin-desktop-sidebar" id="admin-desktop-sidebar"><AdminSidebar collapsed={collapsed} onLogout={leave}/></aside><DrawerShell id="admin-mobile-drawer" open={mobileOpen} onClose={()=>setMobileOpen(false)} title="Admin navigation" className="admin-mobile-drawer"><AdminSidebar onNavigate={()=>setMobileOpen(false)} onLogout={leave}/></DrawerShell><div className="admin-workspace"><AdminTopbar mobileOpen={mobileOpen} onMobileToggle={()=>setMobileOpen(true)} collapsed={collapsed} onCollapse={()=>setCollapsed(value=>!value)} dense={dense} onDensity={setDense} retry={()=>{data.retry();window.dispatchEvent(new Event('virasat:admin-refresh'));}} onLogout={leave}/><main id="admin-main" ref={main} tabIndex={-1} className="admin-main"><Breadcrumbs items={pathname==='/admin'?[{label:'Dashboard'}]:[{label:'Dashboard',to:'/admin'},{label:route?.label || 'Page unavailable'}]}/><p className="admin-preview-notice">{apiMode?'Authenticated PHP mode. Catalogue, CMS, business settings, delivery and orders use Hostinger APIs. Publication requires reviewed content.':adminPreviewNotice}</p><Outlet context={data}/></main></div><AdminConfirmDialog open={logout} onClose={()=>setLogout(false)} onConfirm={confirmLogout} title={apiMode?"Sign out of administration?":"Leave the admin preview?"} description={logoutError||(apiMode?"End the secure administrator session.":"There is no authenticated admin session to sign out of. This closes the preview and resets its display preferences. Your customer demo session is unchanged.")} confirmLabel={apiMode?"Sign out":"Leave preview"}/></div>;
}


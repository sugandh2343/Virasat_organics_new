
import OrderSuccessPage from './pages/OrderSuccessPage';
import AccountPage from './pages/AccountPage';
import LoginPage, { CustomerGate } from './pages/LoginPage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';

import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import SiteLayout from './layouts/SiteLayout';
import AdminLayout from './layouts/AdminLayout';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import SearchPage from './pages/SearchPage';
import ProductPage from './pages/ProductPage';
import FoundationPage from './pages/FoundationPage';
import NotFoundPage from './pages/NotFoundPage';
import { LoadingState, PlaceholderState } from './components/ui/PageStates';
import { publicRoutes, customerRoutes, adminRoutes, legacyAliases, productPath } from './routes/registry';
const CheckoutPreview = lazy(() => import('./pages/CheckoutPreview'));
const AdminManagementPage = lazy(() => import('./pages/admin/AdminManagementPage'));
const DesignSystemPage = import.meta.env.DEV ? lazy(() => import('./pages/DesignSystemPage')) : null;
const CheckoutDevelopmentPreview = import.meta.env.DEV ? lazy(() => import('./dev/CheckoutDevelopmentPreview')) : null;
const screens = {home:HomePage,shop:ShopPage,category:ShopPage,search:SearchPage,product:ProductPage};
function LegacyProduct() {const {slug}=useParams(); return <Navigate to={productPath(slug)} replace />;}
export default function App() {
  return <Routes>
    {import.meta.env.DEV && <Route path="/dev/checkout/*" element={<Suspense fallback={<LoadingState/>}><CheckoutDevelopmentPreview/></Suspense>}/>}
    <Route element={<SiteLayout />}>
      {[...publicRoutes,...customerRoutes].map(route => {const Screen=({'/login':LoginPage,'/cart':CartPage,'/wishlist':WishlistPage,'/checkout':CheckoutPreview,'/order-success/:orderId':OrderSuccessPage})[route.path] || screens[route.kind]; return <Route key={route.path} path={route.path} element={Screen ? <Suspense fallback={<LoadingState/>}><Screen /></Suspense> : route.path.startsWith('/account') ? <AccountPage/> : <FoundationPage route={route} />} />;})}
      {legacyAliases.map(route=><Route key={route.path} path={route.path} element={<Navigate to={route.to} replace />} />)}
      <Route path="/shop/:slug" element={<LegacyProduct />} />
      {import.meta.env.DEV && <Route path="design-system" element={<Suspense fallback={<LoadingState />}><DesignSystemPage /></Suspense>} />}
      <Route path="*" element={<NotFoundPage />} />
    </Route>
    <Route element={<AdminLayout />}>
      <Route path="/admin/login" element={null}/>
      {adminRoutes.map(route=><Route key={route.path} path={route.path} element={<Suspense fallback={<LoadingState/>}><AdminManagementPage route={route}/></Suspense>} />)}
      <Route path="/admin/*" element={<NotFoundPage />} />
    </Route>
  </Routes>;
}







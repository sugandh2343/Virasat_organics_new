import { useCallback } from 'react';
import { Link,Outlet } from 'react-router-dom';
import { useStorefront } from '../state/StorefrontContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { getAdminSnapshot } from '../services/adminService';
import AdminDashboard from '../pages/admin/AdminDashboard';
import { adminPreviewNotice } from '../mock-data/admin';
import '../styles/admin.css';
import '../styles/admin-operations.css';
export default function DevelopmentAdmin(){
 const {state}=useStorefront();
 return <section className="ops-demo-workspace"><p className="admin-preview-notice">{adminPreviewNotice} Use synthetic details only. This view shares the isolated checkout session and is excluded from production builds.</p><nav className="ops-demo-nav" aria-label="Isolated demo administration"><Link to="/dev/checkout/admin">Dashboard</Link><Link to="/dev/checkout/admin/orders">Orders</Link><Link to="/dev/checkout/admin/customers">Customers</Link><Link to="/dev/checkout/account/orders">Customer order history</Link><Link to="/dev/checkout">Demo checkout</Link></nav>{state.session.mode!=='demo'&&<p>Start the isolated demo session using the control above. No records are seeded.</p>}<Outlet/></section>;
}
export function DevelopmentAdminDashboard(){
 const {state}=useStorefront();const loader=useCallback(()=>getAdminSnapshot(state.session),[state.session]);const {data,loading,error,retry}=useAsyncData(loader);
 if(loading)return <p role="status">Loading demo overview…</p>;
 if(error)return <p role="alert">Could not load the local overview. <button onClick={retry}>Retry</button></p>;
 return <AdminDashboard data={data} basePath="/dev/checkout/admin"/>;
}


import CMSMediaWorkspace from './CMSMediaWorkspace';
import {apiMode} from '../../services/catalogueApi';
import {LiveOrders} from '../LiveCommerce';
import LiveDeliverySettings from './LiveDeliverySettings';
import { lazy,Suspense } from 'react';
const LiveOperations=lazy(()=>import('./LiveOperations'));
const CMSWorkspace=lazy(()=>import('./CMSWorkspace'));
import OperationsWorkspace from './OperationsWorkspace';
import CatalogueWorkspace from './CatalogueWorkspace';
import { useOutletContext } from 'react-router-dom';
import { SecondaryButton } from '../../components/ui';
import { AdminPageHeader,AdminFormSection,AdminDataTable,AdminStatusBadge,AdminEmptyState } from '../../components/admin/AdminUI';
import AdminDashboard from './AdminDashboard';
import { formatOrderDate } from '../../domain/orderSelectors';
const statusColumn={key:'status',label:'Status',render:row=><AdminStatusBadge status={row.status}/>};
const configurations={
 products:{source:'products',columns:[{key:'name',label:'Product'},{key:'size',label:'Pack size'},{key:'sku',label:'SKU'},statusColumn,{key:'stock',label:'Stock'}],searchKeys:['name','size','sku'],note:'Five independent products. This read-only catalogue does not change pricing, inventory or availability.'},
 inventory:{source:'products',columns:[{key:'name',label:'Product'},{key:'size',label:'Pack size'},{key:'stock',label:'Configured stock'},statusColumn],searchKeys:['name','sku','size'],note:'Unknown stock remains Not configured; it is never treated as zero.'},
 categories:{source:'categories',columns:[{key:'name',label:'Category'},{key:'slug',label:'Slug'},statusColumn]},
 orders:{source:'orders',columns:[{key:'id',label:'Demo reference'},{key:'createdAt',label:'Created',render:row=>formatOrderDate(row.createdAt)},statusColumn,{key:'paymentStatus',label:'Demo payment status'}],searchKeys:['id','status'],note:'Current local customer session only. No global order ledger or management actions are connected.'},
 customers:{source:'customers',columns:[{key:'name',label:'Customer'},{key:'email',label:'Email'},statusColumn],note:'No customer directory is configured. The unverified demo profile is not a registered customer record.'},
 media:{source:'media',columns:[{key:'id',label:'Media record'},{key:'kind',label:'Type'},{key:'alt',label:'Description'}],searchKeys:['id','alt','kind'],note:'No approved product media records are configured. Placeholder illustrations are not authentic product packaging.'},
 blog:{source:'blog',columns:[{key:'title',label:'Editorial title'},statusColumn,{key:'publishedAt',label:'Published date'}],searchKeys:['title','slug'],note:'Editorial drafts are not published articles.'},
 pages:{source:'pages',columns:[{key:'title',label:'Page'},{key:'slug',label:'Slug'},statusColumn],searchKeys:['title','slug']},
 banners:{source:'banners',columns:[{key:'title',label:'Banner'},statusColumn],searchKeys:['title','id']},
};
export function AdminManagementView({route,data}) {
 if(route.kind==='dashboard')return <AdminDashboard data={data}/>;
 const config=configurations[route.kind];
 const actions=route.kind==='products'?<SecondaryButton to="/admin/products/new">Add Product</SecondaryButton>:route.kind==='media'?<SecondaryButton to="/admin/media/upload">Upload Media</SecondaryButton>:null;
 return <><AdminPageHeader title={route.label} description={config?.note || 'Management foundation · editing and operational actions are reserved for later phases.'} actions={actions}/>{config?<AdminFormSection title={route.label+' preview'}><AdminDataTable key={route.kind} title={route.label} rows={data[config.source]} columns={config.columns} searchKeys={config.searchKeys} emptyDescription={config.note || 'No records are configured for this collection.'}/></AdminFormSection>:<AdminFormSection title={route.kind==='profile'?'Admin identity is not configured.':'This workspace is being prepared.'} description={route.kind==='profile'?'There is no admin login, password or authenticated role in this static preview.':'This is a clearly marked placeholder. No changes can be submitted from this screen.'}>{route.kind==='homepage'&&<p className="admin-muted">{data.homepage.sections?.length || 0} configured homepage sections are available in centralized mock data.</p>}<AdminEmptyState title="Editor coming in a later phase." description="Server-side authorization and real management services are required before production use."/><SecondaryButton to="/admin">Back to Dashboard</SecondaryButton></AdminFormSection>}</>;
}
export default function AdminManagementPage({route}) {
 const {data,loading,error,retry}=useOutletContext();
 if(apiMode&&['profile','dashboard','reports','orders','order-detail','order-document','customers','customer-detail','inventory','inventory-history','delivery-operations','notifications'].includes(route.kind))return <Suspense fallback={<p role="status">Loading operations…</p>}><LiveOperations key={route.path} kind={route.kind}/></Suspense>;
 if(apiMode&&route.kind==='delivery')return <LiveDeliverySettings/>;
 if(apiMode&&['homepage','banners','story','blog','blog-new','blog-edit','pages','settings','payment','compliance'].includes(route.kind))return <Suspense fallback={<p role="status">Loading content editor…</p>}><CMSWorkspace key={route.path} route={route}/></Suspense>;
 if(apiMode&&['media','upload-media'].includes(route.kind))return <CMSMediaWorkspace route={route}/>;
 if(loading)return <p role="status">Loading local admin preview…</p>;
 if(error)return <AdminFormSection title="The mock data could not be loaded."><p role="alert">Try loading the local preview again.</p><SecondaryButton onClick={retry}>Try again</SecondaryButton></AdminFormSection>;
 if(['homepage','banners','story','blog','blog-new','blog-edit','pages','settings','delivery','payment','compliance'].includes(route.kind))return <Suspense fallback={<p role="status">Loading content editor…</p>}><CMSWorkspace key={route.path} route={route}/></Suspense>;
 if(['orders','customers','order-detail','customer-detail'].includes(route.kind))return <OperationsWorkspace kind={route.kind}/>;
 if(['products','new-product','categories','inventory','media','upload-media'].includes(route.kind))return <CatalogueWorkspace route={route} data={data}/>;
 return <AdminManagementView route={route} data={data}/>;
}



import { SecondaryButton } from '../../components/ui';
import { AdminPageHeader,AdminStatCard,AdminFormSection,AdminEmptyState,AdminStatusBadge,AdminDataTable } from '../../components/admin/AdminUI';
import { adminQuickActions } from '../../routes/adminRegistry';
import { formatOrderDate } from '../../domain/orderSelectors';
export default function AdminDashboard({data,basePath='/admin'}) {
 const metrics=data.dashboard;
 return <><AdminPageHeader title="Your store, at a glance." description="A clear view of the catalogue and available local demo records."/><div className="admin-stats">{[
 ['Total Products',metrics.totalProducts,'Independent product records'],
 ['Active Products',metrics.statusCounts.active,'Recorded status; not purchase eligibility'],
 ['Out of Stock',metrics.statusCounts.out_of_stock,'Products marked Out of Stock'],
 ['Coming Soon',metrics.statusCounts.coming_soon,'Products marked Coming Soon'],
 ['Total Demo Orders',metrics.totalDemoOrders,'Current local customer session'],
 ['Pending Demo Orders',metrics.pendingDemoOrders,'Placed through Out for Delivery'],
 ['Delivered Demo Orders',metrics.deliveredDemoOrders,'Recorded demo status only'],
 ['Cancelled Demo Orders',metrics.cancelledDemoOrders,'Terminal local cancellations'],
 ].map(([label,value,note])=><AdminStatCard key={label} label={label} value={value} note={note}/>)}</div>
 <AdminFormSection title="Quick actions" description="Open catalogue, content, settings or session demo management."><div className="admin-actions">{(basePath==='/admin'?adminQuickActions:[{label:'View Demo Orders',to:basePath+'/orders'},{label:'View Demo Customers',to:basePath+'/customers'}]).map(action=><SecondaryButton key={action.to} to={action.to}>{action.label}</SecondaryButton>)}</div></AdminFormSection>
 <div className="admin-dashboard-grid"><div><AdminFormSection title="Recent Demo Orders" description={data.orderScope}><AdminDataTable title="Recent demo orders" rows={metrics.recentOrders} searchKeys={['id','status']} columns={[{key:'id',label:'Demo reference',render:row=><SecondaryButton to={basePath+'/orders/'+encodeURIComponent(row.id)}>{row.id}</SecondaryButton>},{key:'createdAt',label:'Created',render:row=>formatOrderDate(row.createdAt)},{key:'status',label:'Status',render:row=><AdminStatusBadge status={row.status}/>}]} emptyDescription="No demo orders are available in this session. Place an order in the isolated checkout workspace to begin."/></AdminFormSection><AdminFormSection title="Recent Content Updates">{metrics.recentContent.length?<ul>{metrics.recentContent.map(item=><li key={item.id}>{item.title || item.name} · {formatOrderDate(item.updatedAt)}</li>)}</ul>:<AdminEmptyState title="Update history is not configured." description="Existing drafts have no recorded update dates. No activity has been invented."/>}</AdminFormSection></div>
 <div><AdminFormSection title="Product Status Overview"><div className="admin-status-list">{Object.entries(metrics.statusCounts).map(([status,count])=><div key={status}><AdminStatusBadge status={status}/><strong>{count}</strong></div>)}</div><p className="admin-muted">Counts reflect stored product status. Prices and stock must also be configured before purchase.</p></AdminFormSection><AdminFormSection title={metrics.configuredStockCount?"Low Stock Summary":"Inventory readiness"}>{metrics.lowStock===null?<AdminEmptyState title="Stock monitoring is unconfigured." description={metrics.configuredStockCount?'Stock values exist, but a low-stock threshold has not been configured.':'No product stock quantities are configured.'}/>:metrics.lowStock.length?<ul>{metrics.lowStock.map(product=><li key={product.id}>{product.name} · {product.size}: {product.stock}</li>)}</ul>:<AdminEmptyState title="No low-stock records." description={'No configured quantities are at or below '+metrics.lowStockThreshold+'.'}/>}</AdminFormSection></div></div></>;
}




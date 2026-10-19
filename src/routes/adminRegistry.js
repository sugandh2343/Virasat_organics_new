export const adminGroups = [
 {label:'Overview',items:[['/admin','Dashboard','LayoutDashboard','dashboard']]},
 {label:'Catalogue',items:[['/admin/products','Products','Package','products'],['/admin/categories','Categories','Layers','categories'],['/admin/inventory','Inventory','Boxes','inventory'],['/admin/media','Media Library','Image','media']]},
 {label:'Sales',items:[['/admin/orders','Orders','ShoppingBag','orders'],['/admin/customers','Customers','Users','customers'],['/admin/reports','Reports','ClipboardCheck','reports'],['/admin/delivery','Delivery Operations','Truck','delivery-operations']]},
 {label:'Content',items:[['/admin/content','Homepage','House','homepage'],['/admin/banners','Banners','PanelsTopLeft','banners'],['/admin/story','Our Story','Sprout','story'],['/admin/blog','Blogs','NotebookPen','blog'],['/admin/pages','Pages','Files','pages']]},
 {label:'Configuration',items:[['/admin/settings','Business Settings','Settings','settings'],['/admin/settings/delivery','Delivery Settings','Truck','delivery'],['/admin/settings/payment','Payment Settings','CreditCard','payment'],['/admin/settings/compliance','Compliance Details','ClipboardCheck','compliance']]},
 {label:'System',items:[['/admin/profile','Admin Profile','CircleUserRound','profile'],['/admin/notifications','Notifications','ClipboardCheck','notifications']]},
];
export const adminRoutes = adminGroups.flatMap(group=>group.items.map(([path,label,icon,kind])=>({path,label,icon,kind,group:group.label}))).concat([
 {path:'/admin/orders/:orderId/document',label:'Order summary',kind:'order-document',group:'Sales'},
 {path:'/admin/inventory/history',label:'Stock movements',kind:'inventory-history',group:'Catalogue'},
 {path:'/admin/orders/:orderId',label:'Order details',kind:'order-detail',group:'Sales'},
 {path:'/admin/customers/:customerId',label:'Customer details',kind:'customer-detail',group:'Sales'},
 {path:'/admin/content/homepage',label:'Homepage',kind:'homepage',group:'Content'},
 {path:'/admin/content/banners',label:'Banners',kind:'banners',group:'Content'},
 {path:'/admin/content/story',label:'Our Story',kind:'story',group:'Content'},
 {path:'/admin/blog/new',label:'Add article',kind:'blog-new',group:'Content'},
 {path:'/admin/blog/:id/edit',label:'Edit article',kind:'blog-edit',group:'Content'},
 {path:'/admin/products/new',label:'Add Product',kind:'new-product',group:'Catalogue'},
 {path:'/admin/media/upload',label:'Upload Media',kind:'upload-media',group:'Catalogue'},
]);
export const adminQuickActions = [
 {label:'Add Product',to:'/admin/products/new'}, {label:'Manage Products',to:'/admin/products'},
 {label:'View Orders',to:'/admin/orders'}, {label:'Edit Homepage',to:'/admin/content'}, {label:'Upload Media',to:'/admin/media/upload'},
];


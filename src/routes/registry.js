export const publicRoutes = [
  ['/', 'Home', 'home'], ['/shop', 'Shop', 'shop'], ['/shop/category/:slug', 'Category', 'category'],
  ['/product/:slug', 'Product', 'product'], ['/search', 'Search', 'search'],
  ['/our-story', 'Our Story'], ['/about', 'About'], ['/blog', 'Blog', 'blog'], ['/blog/:slug', 'Blog post', 'blogPost'],
  ['/contact', 'Contact'], ['/privacy-policy', 'Privacy Policy'], ['/terms-and-conditions', 'Terms & Conditions'],
  ['/shipping-policy', 'Shipping & Delivery'], ['/returns-refunds', 'Returns & Refunds'], ['/faq', 'Frequently Asked Questions'],
].map(([path, label, kind = 'cms']) => ({ path, label, kind }));
export const customerRoutes = [
  ['/login', 'Sign in'], ['/account', 'Account'], ['/account/profile', 'Profile'], ['/account/addresses', 'Addresses'],
  ['/account/orders', 'Orders'], ['/account/orders/:orderId', 'Order details'], ['/wishlist', 'Wishlist'],
  ['/cart', 'Cart'], ['/checkout', 'Checkout'], ['/order-success/:orderId', 'Order confirmation'],
].map(([path, label]) => ({path, label, kind: 'customer'}));
export { adminRoutes } from './adminRegistry';
export const legacyAliases = [
  {path:'/journal',to:'/blog'}, {path:'/shipping-delivery',to:'/shipping-policy'},
  {path:'/terms-conditions',to:'/terms-and-conditions'}, {path:'/our-roots',to:'/our-story'},
  {path:'/track-order',to:'/account/orders'},
];
export const productPath = slug => '/product/' + encodeURIComponent(slug);
export const categoryPath = slug => '/shop/category/' + encodeURIComponent(slug);



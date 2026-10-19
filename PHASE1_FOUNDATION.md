# Phase 1 — Static foundation

## Architecture
React + Vite with React Router, plain CSS and Lucide. The existing luxury design and minimal homepage are preserved. `src/routes/registry.js` owns route metadata; `SiteLayout` serves the storefront and `AdminLayout` is an explicitly unprotected static placeholder.

Presentation reads asynchronous functions in `src/services`; `mockStore.js` returns defensive copies of local fixtures. Updates are in memory only and reset on refresh (or `resetMockData()`). A future PHP REST adapter can replace service internals. No API, authentication, payment capture or backend is connected.

## Route inventory
Public: `/`, `/shop`, `/shop/category/:slug`, `/product/:slug`, `/search`, `/our-story`, `/about`, `/blog`, `/blog/:slug`, `/contact`, `/privacy-policy`, `/terms-and-conditions`, `/shipping-policy`, `/returns-refunds`, `/faq`.

Customer placeholders: `/login`, `/account`, `/account/profile`, `/account/addresses`, `/account/orders`, `/account/orders/:orderId`, `/wishlist`, `/cart`, `/checkout`, `/order-success/:orderId`.

Admin placeholders: `/admin`, `/admin/products`, `/admin/categories`, `/admin/orders`, `/admin/customers`, `/admin/content`, `/admin/blog`, `/admin/media`, `/admin/settings`.

`/design-system` remains development-only. Legacy product, journal, roots, shipping, terms and tracking URLs redirect to canonical destinations; old shop category queries still work. Unknown routes and missing products/blog posts render a not-found page. An order-success URL never asserts that an order or payment occurred.

## Mock data modules
`src/mock-data`: `products.js`, `categories.js`, `home.js` (homepage), `banners.js`, `business.js` (settings), `customer.js`, `addresses.js`, `orders.js`, `blogPosts.js`, `cmsPages.js`, `navigation.js`, `productMedia.js`. Existing design-system/search configuration is retained. Unsupplied content uses empty collections or null values, not invented transactions or claims.

Exactly five independent products retain their stable IDs/slugs: Atta 5 kg; Black Mustard Oil 500 ml and 1 L; Yellow Mustard Oil 500 ml and 1 L. No variants. Canonical fields include sku, size, category/categoryId, pricing, stock, status, descriptions, media, ingredients, nutrition, storage, specifications and seo. Legacy SKU/packageSize/SEO fields remain compatible with earlier components. Real prices, stock and unverified details remain null/empty; all five are coming_soon.

`src/domain/productSelectors.js` centralizes visibility and purchasing rules. Inactive/unknown statuses are hidden. Active, out_of_stock and coming_soon are visible; only active products with a valid non-negative price and positive integer stock are purchasable. List, detail, search and cards share these rules. No full cart interaction is enabled.

## State and assets
`StorefrontContext` centralizes cart, wishlist, demo customer session, location and overlays. Only cart, wishlist and six-digit postal-code selection persist under localStorage key `virasat-v2:local-preview:v1`. Session/overlays remain memory-only. Data stays in this browser and is never shared with a server. Clear that key to reset persistence. Demo session state does not verify identity or OTPs. `BusinessContext` supplies asynchronously loaded settings to the existing brand/header/footer.

`public/assets` has logos, products, product-galleries, product-videos, banners, blog-images and story-images slots. Existing temporary editorial art stays in `src/assets`. Missing media has graceful placeholders; none is represented as authentic packaging or photography.

Reusable loading/error/placeholder states live in `components/ui/PageStates.jsx`; existing EmptyState is reused. `useAsyncData` handles pending/error/retry and stale responses.

## Changed files
Added route registry, domain selectors, foundation page/admin layout, async hook, state/context modules, content/customer/mock-store services, missing mock modules, foundation CSS, asset directories/README and `scripts/check-foundation.mjs`.
Updated App/main, SiteLayout, Brand/Header/Footer, Home/Shop/Search/Product pages, ProductCard/PriceDisplay, product/search services, products/home/business/navigation fixtures, navigation checks and README. Build regenerates dist. No dependencies were added.

## Validation — 15 October 2026
Passed: `npm run build`, `node scripts/check-foundation.mjs`, `node scripts/check-navigation.mjs`, `node scripts/check-design-system.mjs`.
Browser: all 34 requested route patterns plus development design-system rendered; missing blog content produced the expected not-found state. Search matched case-insensitive product/pack-size input. Mobile drawer category navigation closed correctly with no horizontal overflow. Homepage visual review preserved the existing design.
Foundation checks cover five unique complete records, service copy isolation and updates, visibility/purchasability, invalid updates, route matching and persistence sanitation. Source audit found no backend calls/dependencies. Optional Google Fonts and configured external contact links are not backend integrations.
Preview: http://127.0.0.1:5174/ . Vite startup is also independently checked on a temporary port. The previous website was not modified; nothing was committed or deployed.

## Remaining work
Approved logo/photos, verified product/business/policy content, pricing and inventory; complete homepage and storefront interactions; customer/admin screens; real authentication, checkout, payments and API integration in later phases. Admin URLs are not access-controlled. Production hosting will need SPA fallback to index.html. No implementation blockers for this static phase.

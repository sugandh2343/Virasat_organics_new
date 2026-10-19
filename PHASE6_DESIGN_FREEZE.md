# Phase 6.2 — Static UI freeze and backend readiness

17 October 2026. Existing project: D:/Virasat Organics/virasat-organics-v2.
Preview: http://127.0.0.1:5174/

## Freeze decision

Freeze the current implemented UI as the integration baseline, NOT a claim of completed visual approval. PHASE6_FULL_AUDIT.md documents blocked browser verification; historical Phase1–5 screenshots/results do not substitute for current acceptance. All route rows below have current mobile/browser QA BLOCKED. Backend plans are proposals; no PHP/MySQL/Firebase/Razorpay integration tested or implemented.

Preserve SiteLayout/Header/Footer and separate AdminLayout; hero, section order, editorial treatment, independent product cards, responsive grid rules, breadcrumbs, status/price states, search/filter behavior, native dialog/drawer patterns, dirty-edit confirmations and safe content blocks. Retain all mock notices until the corresponding real feature passes backend acceptance, not merely until an endpoint exists.

Tokens baseline: cream #FAF8F2, ivory #F3EFE5, forest #183D2B, deep #102B20, gold #B29A66, text #203429, muted text #596353, accent text #65552F. Cormorant Garamond headings, DM Sans body, existing fallback fonts. Keep src/styles/tokens.css spacing/radii/type scale, container max76rem, responsive gutters and global focus/reduced-motion behavior. No framework change or wholesale redesign during adapter integration.

Source anchors: src/App.jsx, routes/registry.js, routes/adminRegistry.js, dev/CheckoutDevelopmentPreview.jsx, layouts, components/ui, styles/tokens.css, services, domain selectors, state/store.js and StorefrontContext/BusinessContext. Existing services and phase documentation reviewed; actual leaf dispatch from AdminManagementPage and AccountPage used below. Some legacy read-only admin config remains in source but is bypassed by working workspaces; inventory reflects active dispatch, not stale explanatory strings.

Design exceptions require a verified bug/accessibility issue, minimal change, affected regression and recorded acceptance. Backend errors/loading/auth expiry/provider checkout may require wiring and honest copy; don't preserve misleading demo success as real success.

## Deliverables

- API_CONTRACTS.md: entities, paise rules, endpoint schemas/auth/errors/idempotency and security.
- DATABASE_BLUEPRINT.md: normalized table/FK/index design, seeds, migration/bootstrap and inventory/payment transactions.
- MOCK_TO_API_MATRIX.md: every service plus contexts/reducer boundaries, conversion/tests/order.
- BACKEND_ROADMAP.md: milestones7A–7F, environment needs, blockers and Hostinger topology/rewrite plan.
- This file: route-by-route current baseline and validation.

No frontend source, fixtures, dependencies or styles changed in6.2. Only these five documentation files were added; build regenerates dist. Old website untouched, no commit/deploy. Proposed source examples live only inside Markdown.

## Validation

Phase6.2 validation: npm run build PASS (Vite7.3.7, 1,730 modules, no warnings; main JS478.20kB / gzip150.26kB). All19 scripts/check-*.mjs PASS, exit0. New documentation checked against all56 registry entries, explicit routes and all13 service modules; the existing full-audit regression imports127 modules. Source/config fingerprint recorded below. No backend or hosting tests performed. Prior6.1 HTTP transport evidence covered75 paths; it was not rerun as browser evidence and does not prove rendering.
Manual acceptance: at320/375/390/430/768/1024/1280/1440 verify all public/customer/admin surfaces, direct load/refresh, unknown records, no overflow, keyboard/focus/Escape, image/video fallbacks, forms and nine integration workflows. Browser approval remains BLOCKED until this is performed.

## Route inventory

Each row states path, registered component/active leaf, behavior, current dependencies, current limitation, planned API and current QA. All APIs are future proposals. App-level customer mappings and CMS kind dispatch are retained. Customer layouts gate an unverified demo session; admin currently has no authentication.

| Route | Component / active leaf | Existing functionality | Data dependencies | Static limitation | Future API | QA |
| --- | --- | --- | --- | --- | --- | --- |
| / | HomePage → HomeContent | Hero, categories, collection, media, story, journal | homepage, products, categories, banners, blog | Labelled media; no reviews/subscription | GET store/products/categories | BLOCKED |
| /shop | ShopPage | Search/filter/sort, counts, category/empty state | productService/contentService/searchService | Five coming_soon, no prices | GET products/categories | BLOCKED |
| /shop/category/:slug | ShopPage | Search/filter/sort, counts, category/empty state | productService/contentService/searchService | Five coming_soon, no prices | GET products/categories | BLOCKED |
| /product/:slug | ProductPage → ProductDetail | Gallery, quantity gates, wishlist, policies, PIN, related | products, categories, CMS policies, delivery | Missing packaging/price/stock; purchase disabled | GET products/:slug/pages/:slug; POST delivery/check | BLOCKED |
| /search | SearchPage | Search/filter/sort, counts, category/empty state | productService/contentService/searchService | Five coming_soon, no prices | GET products/categories | BLOCKED |
| /our-story | FoundationPage → ContentDocument | Structured page / draft shell | cmsPages + business | Unreviewed draft content | GET pages/our-story | BLOCKED |
| /about | FoundationPage → ContentDocument | Structured page / draft shell | cmsPages + business | Unreviewed draft content | GET pages/about | BLOCKED |
| /blog | FoundationPage → JournalCards/ContentDocument | Journal list or article/draft detail | blogPosts/media | Three opted-in draft ideas, no real publication | GET blog or blog/:slug; store editorial excerpts | BLOCKED |
| /blog/:slug | FoundationPage → JournalCards/ContentDocument | Journal list or article/draft detail | blogPosts/media | Three opted-in draft ideas, no real publication | GET blog or blog/:slug; store editorial excerpts | BLOCKED |
| /contact | FoundationPage → ContentDocument | Structured page / draft shell | cmsPages + business | Unreviewed draft content | GET pages/contact | BLOCKED |
| /privacy-policy | FoundationPage → ContentDocument | Structured page / draft shell | cmsPages + business | Unreviewed draft content | GET pages/privacy-policy | BLOCKED |
| /terms-and-conditions | FoundationPage → ContentDocument | Structured page / draft shell | cmsPages + business | Unreviewed draft content | GET pages/terms-and-conditions | BLOCKED |
| /shipping-policy | FoundationPage → ContentDocument | Structured page / draft shell | cmsPages + business | Unreviewed draft content | GET pages/shipping-policy | BLOCKED |
| /returns-refunds | FoundationPage → ContentDocument | Structured page / draft shell | cmsPages + business | Unreviewed draft content | GET pages/returns-refunds | BLOCKED |
| /faq | FoundationPage → ContentDocument | Structured page / draft shell | cmsPages + business | Unreviewed draft content | GET pages/faq | BLOCKED |
| /login | LoginPage | OTP format preview/demo entry | authService + session | No SMS or verified identity | auth/firebase-session, auth/me/logout/csrf | BLOCKED |
| /account | AccountPage → Overview | Profile/counts/recent orders | session.profile/addresses/orders | Memory-only unverified identity | GET me/me/orders | BLOCKED |
| /account/profile | AccountPage → Profile | Profile form | customerService + session | Unverified mobile, reload clears | GET/PATCH me | BLOCKED |
| /account/addresses | AccountPage → Addresses/AddressForm | Add/edit/default/delete/select | session.addresses/location | No durable address or GPS | me/addresses CRUD | BLOCKED |
| /account/orders | AccountPage → OrderHistory | Filter/sort demo history | session.orders | Owned local demo only | GET me/orders | BLOCKED |
| /account/orders/:orderId | AccountPage → OrderDetail | Timeline/cancel/reorder | orders + catalogue selectors | No real shipment/payment | GET me/orders/:id; POST orders/:id/cancel | BLOCKED |
| /wishlist | WishlistPage | Toggle/remove/move eligible to cart | state.wishlist + catalogue | LocalStorage IDs only | me/wishlist GET/POST/DELETE | BLOCKED |
| /cart | CartPage | Quantities/remove/summary | state.cart + cartSelectors | Missing real prices/fees | GET products; quote later | BLOCKED |
| /checkout | CheckoutPreview | Address/review/COD steps | session/cart/checkoutSettings | Public order placement blocked | POST checkout/quote, orders | BLOCKED |
| /order-success/:orderId | OrderSuccessPage | Owned demo snapshot or unavailable | checkoutService session order | No fabricated confirmation | GET orders/:id | BLOCKED |
| /admin | AdminManagementPage → AdminDashboard | Derived counts/configuration gaps | adminService + mock catalogue/session | Unsecured session-only preview | GET admin/dashboard | BLOCKED |
| /admin/products | AdminManagementPage → CatalogueWorkspace | Product CRUD/status/duplicate | catalogueAdminService/mockStore | Unsecured session-only preview | admin/products | BLOCKED |
| /admin/categories | AdminManagementPage → CatalogueWorkspace | Category CRUD | catalogueAdminService/mockStore | Unsecured session-only preview | admin/categories | BLOCKED |
| /admin/inventory | AdminManagementPage → CatalogueWorkspace | Stock adjustments/activity | catalogueAdminService/mockStore | Unsecured session-only preview | admin/inventory/adjustments | BLOCKED |
| /admin/media | AdminManagementPage → CatalogueWorkspace | Local file previews/assign/metadata | catalogueAdminService/mockStore | Unsecured session-only preview | admin/media + admin/products/:id | BLOCKED |
| /admin/orders | AdminManagementPage → OperationsWorkspace | Order/customer list/detail; order transitions | orderAdminService + session.orders | DEV guarded; isolated orders stay in nested dev admin | admin/orders[/id] | BLOCKED |
| /admin/customers | AdminManagementPage → OperationsWorkspace | Order/customer list/detail; order transitions | orderAdminService + session.orders | DEV guarded; isolated orders stay in nested dev admin | admin/customers[/id] | BLOCKED |
| /admin/content | AdminManagementPage → CMSWorkspace → HomeEditor | Section order/toggles/copy/live draft | cmsAdminService + shared media | Unsecured session-only preview | admin/homepage | BLOCKED |
| /admin/banners | AdminManagementPage → CMSWorkspace → ContentEditor/list | Content edit/publish/archive | cmsAdminService + shared media | Unsecured session-only preview | admin/banners | BLOCKED |
| /admin/story | AdminManagementPage → CMSWorkspace → ContentEditor/list | Content edit/publish/archive | cmsAdminService + shared media | Unsecured session-only preview | admin/pages | BLOCKED |
| /admin/blog | AdminManagementPage → CMSWorkspace → ContentEditor/list | Content edit/publish/archive | cmsAdminService + shared media | Unsecured session-only preview | admin/blog | BLOCKED |
| /admin/pages | AdminManagementPage → CMSWorkspace → ContentEditor/list | Content edit/publish/archive | cmsAdminService + shared media | Unsecured session-only preview | admin/pages | BLOCKED |
| /admin/settings | AdminManagementPage → CMSWorkspace → SettingsEditor | Business/compliance/delivery/COD settings | cmsAdminService + shared media | Unsecured session-only preview | admin/settings | BLOCKED |
| /admin/settings/delivery | AdminManagementPage → CMSWorkspace → SettingsEditor | Business/compliance/delivery/COD settings | cmsAdminService + shared media | Unsecured session-only preview | admin/settings | BLOCKED |
| /admin/settings/payment | AdminManagementPage → CMSWorkspace → SettingsEditor | Business/compliance/delivery/COD settings | cmsAdminService + shared media | Unsecured session-only preview | admin/settings | BLOCKED |
| /admin/settings/compliance | AdminManagementPage → CMSWorkspace → SettingsEditor | Business/compliance/delivery/COD settings | cmsAdminService + shared media | Unsecured session-only preview | admin/settings | BLOCKED |
| /admin/profile | AdminManagementPage → AdminManagementView | Admin identity placeholder | No admin identity | No login/password/role configured | admin/session; PATCH admin/profile (future wiring) | BLOCKED |
| /admin/orders/:orderId | AdminManagementPage → OperationsWorkspace | Order/customer list/detail; order transitions | orderAdminService + session.orders | DEV guarded; isolated orders stay in nested dev admin | admin/orders[/id] | BLOCKED |
| /admin/customers/:customerId | AdminManagementPage → OperationsWorkspace | Order/customer list/detail; order transitions | orderAdminService + session.orders | DEV guarded; isolated orders stay in nested dev admin | admin/customers[/id] | BLOCKED |
| /admin/content/homepage | AdminManagementPage → CMSWorkspace → HomeEditor | Section order/toggles/copy/live draft | cmsAdminService + shared media | Unsecured session-only preview | admin/homepage | BLOCKED |
| /admin/content/banners | AdminManagementPage → CMSWorkspace → ContentEditor/list | Content edit/publish/archive | cmsAdminService + shared media | Unsecured session-only preview | admin/banners | BLOCKED |
| /admin/content/story | AdminManagementPage → CMSWorkspace → ContentEditor/list | Content edit/publish/archive | cmsAdminService + shared media | Unsecured session-only preview | admin/pages | BLOCKED |
| /admin/blog/new | AdminManagementPage → CMSWorkspace → ContentEditor/list | Content edit/publish/archive | cmsAdminService + shared media | Unsecured session-only preview | admin/blog | BLOCKED |
| /admin/blog/:id/edit | AdminManagementPage → CMSWorkspace → ContentEditor/list | Content edit/publish/archive | cmsAdminService + shared media | Unsecured session-only preview | admin/blog | BLOCKED |
| /admin/products/new | AdminManagementPage → CatalogueWorkspace | ProductEditor creation | catalogueAdminService/mockStore | Unsecured session-only preview | admin/products | BLOCKED |
| /admin/media/upload | AdminManagementPage → CatalogueWorkspace | Local file picker | catalogueAdminService/mockStore | Unsecured session-only preview | admin/media + admin/products/:id | BLOCKED |
| /journal | Navigate | Redirect → /blog | registry | No independent screen | Destination API | BLOCKED |
| /shipping-delivery | Navigate | Redirect → /shipping-policy | registry | No independent screen | Destination API | BLOCKED |
| /terms-conditions | Navigate | Redirect → /terms-and-conditions | registry | No independent screen | Destination API | BLOCKED |
| /our-roots | Navigate | Redirect → /our-story | registry | No independent screen | Destination API | BLOCKED |
| /track-order | Navigate | Redirect → /account/orders | registry | No independent screen | Destination API | BLOCKED |
| /shop/:slug | LegacyProduct → Navigate | Redirect → /product/:slug | route slug | Legacy alias | GET products/:slug | BLOCKED |
| /design-system | DesignSystemPage (lazy DEV) | Component/status gallery | mock design system | Excluded production | None | BLOCKED |
| /dev/checkout | CheckoutDevelopmentPreview → CheckoutPreview | Isolated checkout | nested StorefrontProvider + checkoutFixture | DEV-only; synthetic data, no persistence | checkout/quote + orders only in future real screen | BLOCKED |
| /dev/checkout/cart | CheckoutDevelopmentPreview → FixtureCart | Illustrative cart | nested StorefrontProvider + checkoutFixture | DEV-only; synthetic data, no persistence | None | BLOCKED |
| /dev/checkout/order-success/:orderId | CheckoutDevelopmentPreview → OrderSuccessPage | Demo confirmation | nested StorefrontProvider + checkoutFixture | DEV-only; synthetic data, no persistence | None | BLOCKED |
| /dev/checkout/orders | CheckoutDevelopmentPreview → Navigate | Redirect to /dev/checkout/account/orders | nested StorefrontProvider + checkoutFixture | DEV-only; synthetic data, no persistence | None | BLOCKED |
| /dev/checkout/account | CheckoutDevelopmentPreview → AccountPage → Overview | Demo overview | nested StorefrontProvider + checkoutFixture | DEV-only; synthetic data, no persistence | None | BLOCKED |
| /dev/checkout/account/profile | CheckoutDevelopmentPreview → AccountPage → Profile | Demo profile | nested StorefrontProvider + checkoutFixture | DEV-only; synthetic data, no persistence | None | BLOCKED |
| /dev/checkout/account/addresses | CheckoutDevelopmentPreview → AccountPage → Addresses | Demo addresses | nested StorefrontProvider + checkoutFixture | DEV-only; synthetic data, no persistence | None | BLOCKED |
| /dev/checkout/account/orders | CheckoutDevelopmentPreview → AccountPage → OrderHistory | Demo orders | nested StorefrontProvider + checkoutFixture | DEV-only; synthetic data, no persistence | None | BLOCKED |
| /dev/checkout/account/orders/:orderId | CheckoutDevelopmentPreview → AccountPage → OrderDetail | Demo tracking/cancel/reorder | nested StorefrontProvider + checkoutFixture | DEV-only; synthetic data, no persistence | None | BLOCKED |
| /dev/checkout/admin | CheckoutDevelopmentPreview → DevelopmentAdmin → DevelopmentAdminDashboard | Same isolated session counts | nested StorefrontProvider + checkoutFixture | DEV-only; synthetic data, no persistence | None | BLOCKED |
| /dev/checkout/admin/orders | CheckoutDevelopmentPreview → OperationsWorkspace | Demo order list | nested StorefrontProvider + checkoutFixture | DEV-only; synthetic data, no persistence | None | BLOCKED |
| /dev/checkout/admin/orders/:orderId | CheckoutDevelopmentPreview → OperationsWorkspace | Demo order transitions | nested StorefrontProvider + checkoutFixture | DEV-only; synthetic data, no persistence | None | BLOCKED |
| /dev/checkout/admin/customers | CheckoutDevelopmentPreview → OperationsWorkspace | Derived demo customers | nested StorefrontProvider + checkoutFixture | DEV-only; synthetic data, no persistence | None | BLOCKED |
| /dev/checkout/admin/customers/:customerId | CheckoutDevelopmentPreview → OperationsWorkspace | Demo customer detail | nested StorefrontProvider + checkoutFixture | DEV-only; synthetic data, no persistence | None | BLOCKED |
| * | NotFoundPage under SiteLayout | Unknown public route | None | SPA server fallback still required | None | BLOCKED |
| /admin/* | NotFoundPage under AdminLayout | Unknown admin route | None | Unsecured preview shell | None | BLOCKED |
| /dev/checkout/* | Preview nested catchall → PlaceholderState | Unknown fixture path | None | DEV-only | None | BLOCKED |

Count:56 registry entries (15 public,10 customer,26 admin,5 legacy redirects), plus legacy product redirect, design-system,14 concrete development route patterns and catchalls. /dev/checkout/* is the App parent and also owns a nested wildcard. Query-selected editors are states of existing routes, not extra registered routes.

## Reproducible source baseline

SHA-256 of sorted source/config file paths plus NUL-separated raw contents: b9c313b076cc740dab84ab12384d018ec5e28c598d2296d3260e59a67d3a4d1f (153 files: all src files, package.json, package-lock.json, index.html and vite.config.js when present). Documentation and generated dist excluded. No Git commit created; use this fingerprint with the current workspace backup for later comparison.

# Phase 5.1 — Static admin foundation

## Layout and access
/admin now uses a dedicated ivory/forest-green management layout, with no public storefront header or footer. Desktop has a fixed, scrollable, collapsible sidebar. Mobile uses the existing accessible DrawerShell with hamburger expanded state, close control, Escape handling and focus restoration. Navigation closes the drawer; crossing the desktop breakpoint closes it too.

The topbar contains mock-data refresh and a native keyboard-accessible Preferences disclosure. Compact table density and sidebar collapse are local component state for this visit only. Breadcrumbs, a skip link and main-content route focus support keyboard navigation.

Every page explicitly says Development preview with no authentication or access control. There is no admin login, password, role claim or fake security gate. Admin Profile is unconfigured. Logout / leave preview confirms navigation to the public site and resets layout preferences; it does not log out the separate customer demo session.

Production MUST implement server-side admin authorization in Phase 7. These routes are publicly reachable static UI, not an authorization boundary.

## Navigation
Central registry: src/routes/adminRegistry.js, re-exported by routes/registry.js. All original routes remain.

Overview: /admin
Catalogue: /admin/products, /admin/categories, /admin/inventory, /admin/media
Sales: /admin/orders, /admin/customers
Content: /admin/content (Homepage), /admin/banners, /admin/story, /admin/blog, /admin/pages
Configuration: /admin/settings, /admin/settings/delivery, /admin/settings/payment, /admin/settings/compliance
System: /admin/profile, Logout / leave preview, View Website (/)

Add Product (/admin/products/new) and Upload Media (/admin/media/upload) are marked future editor placeholders. Quick actions also link Manage Products, View Orders and Edit Homepage. There are 19 admin routes and 44 public/customer/admin route patterns overall.

## Components and screens
Reusable components:
- AdminPageHeader
- AdminStatCard
- AdminDataTable
- AdminFilterToolbar
- AdminStatusBadge
- AdminEmptyState
- AdminFormSection
- AdminConfirmDialog
- AdminSidebar
- AdminTopbar

Read-only tables are available for products, inventory, categories, orders, customers, media, blogs, pages and banners. They share case-insensitive search, status filtering, column sorting, reset, result counts, page-size input architecture, clamped pagination, empty states, semantic captions/headers and a keyboard-focusable horizontal overflow region. Unknown values display Not configured. Product creation/editing, uploads, order operations and CMS editors are not implemented.

Other management routes have clear placeholders. Homepage reports the existing configured section count; it does not offer a fake save action.

## Data sources and honest metrics
services/adminService.js is a read-only async adapter over the existing mockStore and session order selectors. It returns cloned records, not a second mutable admin store.

Initial dashboard:
- Total Products: 5
- Active Products: 0
- Out of Stock: 0
- Coming Soon: 5
- Total Demo Orders: 0 in the current local session
- Pending Demo Orders: 0 in the current local session

Product counts reflect recorded status, not purchasability. Null stock is never interpreted as zero. Inventory readiness stays unconfigured when no stock quantities exist. Low-stock results require actual stock and a configured threshold; no arbitrary threshold is invented.

Orders are explicitly scoped to the current local customer session with matching customerId/sessionId. The empty shared orders fixture is not expanded into fabricated transactions. The separate checkout development fixture is not imported into this admin workspace. No store-wide sales or customer totals are implied.

Pending demo orders means Placed, Confirmed, Packed, Shipped or Out for Delivery. Delivered/Cancelled are excluded. Recent orders use existing creation dates. Content updates require a real configured updatedAt value; current drafts have none, so update history is empty. The customer directory remains empty: the unverified demo identity is not a registered customer. Media and banners remain empty. No revenue, payments, customer records or timestamps are fabricated.

## Changed files
Added:
- src/routes/adminRegistry.js
- src/mock-data/admin.js
- src/domain/adminSelectors.js
- src/services/adminService.js
- src/components/admin/AdminUI.jsx
- src/components/admin/AdminSidebar.jsx
- src/components/admin/AdminTopbar.jsx
- src/pages/admin/AdminDashboard.jsx
- src/pages/admin/AdminManagementPage.jsx
- src/styles/admin.css
- scripts/check-admin.mjs
- PHASE5_ADMIN_FOUNDATION.md

Updated:
- src/layouts/AdminLayout.jsx
- src/routes/registry.js
- src/App.jsx
- scripts/check-foundation.mjs (supports added routes while checking uniqueness and matching; new admin tests explicitly retain original routes)
- dist/ regenerated

No dependencies added. Public/customer components and original product/order fixtures were not changed. Old website untouched. No commit or deployment.

## Actual validation — 17 October 2026
- npm run build: PASS, 1708 modules, 2.87 seconds, no final CSS warnings.
- All 15 scripts/check-*.mjs: PASS (14 existing scripts plus check-admin).
- Admin checks: every sidebar/quick-action route, original route preservation, rendered management shells, no public header/footer, honest metrics, clone isolation, scoped demo orders, no fabricated customers/revenue, configured-only stock/content activity, search/filter/sort/pagination/empty states, table semantics, drawer controls and CSS syntax.
- GET http://127.0.0.1:5174/admin: HTTP 200. Vite remains on port 5174.
- Browser visual checks at 320, 390, 768, 1024 and 1440px: BLOCKED by the unresolved browser URL security restriction.
- Actual drawer click-through, keyboard interaction/focus restoration and overflow measurements: BLOCKED. Markup/source checks verify wiring only, not interactive behavior. No repeated browser-navigation request or workaround was attempted.

## Future adapter boundaries and remaining phases
The current read-only snapshot adapter can be replaced with authenticated PHP endpoints:
GET /api/admin/dashboard
GET/POST/PATCH /api/admin/products
GET/POST/PATCH /api/admin/categories
GET/PATCH /api/admin/orders
GET /api/admin/customers
GET/PUT /api/admin/settings
GET/POST/PATCH /api/admin/content
POST /api/admin/media

No endpoints were implemented or called. Future work must add server-side admin authorization, validation, ownership/permissions, safe media processing, audit trails and MySQL persistence. Full product/category CRUD, order/customer management, CMS/media editors, settings/compliance forms and real operational integrations remain for later prompts.

Preview: http://127.0.0.1:5174/admin

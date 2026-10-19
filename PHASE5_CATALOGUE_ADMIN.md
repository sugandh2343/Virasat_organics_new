# Phase 5.2 — Static catalogue administration

## Delivered

The existing V2 application now manages products, categories, inventory and preview media through the shared in-memory mock store. The original five independent seed products remain unchanged; no prices, stock, certifications or nutritional facts were supplied. No variants, backend integration, deployments or commits were introduced. The old website was not accessed or modified.

### Routes and interactions

- `/admin/products`: searchable, category/status-filtered, sortable, paginated table with thumbnail, pack size, SKU, category, selling price, MRP, stock, status, modification time and actions. Edit, duplicate, preview, status change, archive and guarded deletion are available.
- `/admin/products/new`: eight-section editor for basic information, pricing, inventory, media, details, ingredients/nutrition, SEO and publishing. Product edits also open in a modal from the table.
- `/admin/categories`: add/edit categories, image assignment, slug, description, sort order, visibility and product count. Assigned categories cannot be deleted.
- `/admin/inventory`: stock overview, search/status filter, configured low-stock warnings, absolute stock setting or positive/negative adjustments and actual session activity with reasons.
- `/admin/media` and `/admin/media/upload`: multiple-file picker/drop zone, preview, accessible ordering buttons, product assignment, metadata/poster editing and guarded removal. Product editor ordering sets the primary image.
- Reset Demo Data requires confirmation and restores the immutable fixtures. Form cancellation, route changes and browser departure warn about unsaved edits.

Existing admin dashboard and other management placeholders are preserved. Public presentation is preserved; header category links now derive from current visible categories so catalogue changes cannot leave fixed stale links.

## Architecture and changed files

### New

- `src/services/catalogueAdminService.js`: validation and atomic product/category/inventory/media mutations.
- `src/services/mediaUrls.js`: allocation and cleanup of temporary object URLs.
- `src/components/admin/CatalogueFields.jsx`: labeled fields, validation focus and ordering helper.
- `src/components/admin/ProductEditor.jsx`: eight-section editor and gallery preview.
- `src/components/admin/CatalogueForms.jsx`: category, stock adjustment and media metadata forms.
- `src/components/admin/CatalogueMediaLibrary.jsx`: temporary media selection, assignment and removal.
- `src/components/admin/UnsavedGuard.jsx`: in-app and browser departure protection.
- `src/pages/admin/CatalogueWorkspace.jsx`: management screens and action coordination.
- `src/hooks/useCatalogueLinks.js`: current visible category navigation.
- `src/styles/catalogue-admin.css`: scoped responsive management styles.
- `scripts/check-catalogue-admin.mjs`: catalogue regression coverage.
- `PHASE5_CATALOGUE_ADMIN.md`: this handoff.

### Updated

- `src/services/mockStore.js`: transactional catalogue mutation, subscriptions, empty inventory activity and reset cleanup; seed data remains separate.
- `src/services/adminService.js`: current inventory activity in admin snapshots.
- `src/services/contentService.js`: visible categories in configured order.
- `src/hooks/useAsyncData.js`: refresh on shared-store updates without discarding loaded screens during mutations.
- `src/state/StorefrontContext.jsx`: reconcile cart/catalogue on mock changes; isolated checkout fixture remains separate.
- `src/components/Header.jsx` and `src/components/ShopDropdown.jsx`: dynamic category links.
- `src/components/media/ProductMediaViewer.jsx`: supplied image captions in gallery items.
- `src/pages/admin/AdminManagementPage.jsx`: catalogue workspace routing, retaining other management shells.
- `src/main.jsx`: React Router data-router wrapper to support unsaved-navigation blocking; existing route inventory retained.
- `src/App.jsx`: lazy-loaded admin management workspace.

## Validation and safeguards

SKU uniqueness is case-insensitive; slugs must be unique and URL-friendly. Product names, SKU, independent size and category are required. Empty factual values remain unconfigured. Selling price/MRP cannot be negative and support at most two decimal places; configured MRP cannot be below selling price. Tax is optional and bounded. Stock and thresholds are nonnegative safe integers. Stock changes require a reason; subtracting below zero is rejected. Only committed changes create activity.

Centralized storefront selectors enforce active/inactive/out-of-stock/coming-soon behavior. Active alone does not enable purchase: price and positive stock must be configured. Inactive products disappear from public lookup and search. Updates notify async service consumers and reconcile cart eligibility/quantity. Duplicate creates a new ID, SKU and slug with inactive status and unconfigured price/stock. Original seed products and products referenced by demo orders cannot be deleted; archival is offered instead. Categories and media with references cannot be deleted.

Images: JPEG, PNG, WebP and GIF, up to 10 MB. Videos: MP4, up to 100 MB. Browser-side MIME/extension/size validation is only preview validation, not a security guarantee or media transcoder. Existing image/video components supply fallback states. URLs are revoked after removal, reset and page departure. Files are never uploaded; metadata and catalogue edits disappear on reload. Existing cart/wishlist persistence does not persist this catalogue or selected media. Admin remains an explicitly labeled development preview, without production authentication.

## Test results — 2026-10-17

- `npm run build`: PASS, Vite 7.3.7, 1,719 modules; main JS 471.66 kB and separate admin JS 40.02 kB. No chunk-size warning.
- All 16 `scripts/check-*.mjs` scripts: PASS (account/addresses, admin, auth UI, cart/wishlist, catalogue admin, checkout, design system, foundation, homepage shopping, homepage, media, navigation, orders, product detail, product enhancements and shop).
- New catalogue tests cover initial fixtures; add/edit/duplicate; unique SKU/slug; assignment and category CRUD; price validation; stock history and negative-stock rejection; all product statuses; cart reconciliation; deletion safeguards; multi-image/video selection validation; posters and primary ordering; URL cleanup; service synchronization; reset; server-rendered editor/library markup and CSS syntax.
- HTTP request to `http://127.0.0.1:5174/admin/products`: PASS, 200. This is server availability, not proof of browser execution.
- Browser visual and interactive verification, including 320–1440px layouts, actual drag/drop, modal focus/navigation blocking and media playback: **BLOCKED** by the established preview browser security restriction. Responsive CSS and rendered markup were checked; no browser PASS is claimed.

Commands: `npm run build`; PowerShell enumeration of every `scripts/check-*.mjs` followed by `node <script>`; HTTP `Invoke-WebRequest` to the preview route. Tests use isolated synthetic records/files; those values do not alter the seed catalogue or the running browser session.

## Future PHP REST API mapping

Keep components consuming services; replace the adapter implementation rather than presentation code. Suggested endpoints (not implemented):

| Local operation | Future endpoint |
| --- | --- |
| Product list/detail/create/edit | GET/POST `/api/products`, GET/PATCH `/api/products/:id` |
| Archive/delete | PATCH status or DELETE `/api/products/:id`, with server reference checks |
| Categories | GET/POST `/api/categories`, PATCH/DELETE `/api/categories/:id` |
| Stock adjustment/history | POST/GET `/api/products/:id/inventory-adjustments` |
| Media records/assignment | POST `/api/media`, PATCH/DELETE `/api/media/:id`, PATCH product media IDs |

The server must supply authentication/authorization, authoritative validation, durable IDs/storage, transactional stock adjustment, upload scanning/validation, order-reference integrity and concurrency control. Replace object URLs with server media URLs and refresh/invalidate the same data subscriptions after successful writes. Reset Demo Data remains development-only and must not become a production deletion endpoint.

## Remaining work

Unblock browser QA and verify the listed viewport and keyboard interactions. Supply authentic product photography, videos and approved factual product data. Implement actual APIs in a later authorized phase. Admin orders, customers, CMS and settings remain outside this phase.

Preview: http://127.0.0.1:5174/admin/products


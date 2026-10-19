# Phase 5.3 — Static admin orders and customers

## Delivered

The existing V2 project now has searchable order and customer management, immutable order details, guarded fulfilment transitions, cancellation, delivery-address tools and derived dashboard metrics. All records remain session-scoped demonstrations. No customer directory, orders, coordinates, transactions or activity were seeded. The original website was not accessed or modified. No backend, dependencies, deployment or commit were added.

## Routes and preview workflow

Main routes:
- `/admin/orders`
- `/admin/orders/:orderId`
- `/admin/customers`
- `/admin/customers/:customerId`

The existing checkout fixture uses its own nested StorefrontProvider. Its orders cannot be read by the main admin provider without violating isolation. Instead, a development-only administration workspace was added **inside that same existing fixture provider**:
- `/dev/checkout/admin` — overview
- `/dev/checkout/admin/orders` and `/dev/checkout/admin/orders/:orderId`
- `/dev/checkout/admin/customers` and `/dev/checkout/admin/customers/:customerId`

To review populated records, open http://127.0.0.1:5174/dev/checkout, start the isolated demo session, supply a synthetic delivery address, select it and place a demo COD order. Use **Demo administration** in the preview banner. Move between admin and customer history using the isolated navigation. The order is the same record throughout. No orders exist before placement. Main admin screens provide a link to this workspace; they do not silently import its data. Leaving the entire fixture, refreshing or ending the session discards its records. Reset illustrative cart supports placing another order without inventing a history.

## Data flow and synchronization

`session.orders` in the existing StorefrontContext remains the sole order store. `checkoutService.createDemoOrder` captures copied product values, SKU, pack size, customer profile and delivery address at placement. Legacy records with no SKU display “Not recorded at placement”; no current-catalogue SKU is substituted into history.

`orderAdminService` reads through the existing owned-session selectors. The reducer handles `orders/admin-update`, checks session identity and expected current status, and calls the shared pure transformation. Both admin and customer views read the resulting session. Dashboard total/pending/delivered/cancelled counts and recent records derive from those orders. The adapter no longer merges a separate fixture orders collection into admin session records.

Customer rows derive only from the current demo profile, owned saved addresses or actual session orders. An entirely blank session has no customer row. Records are labeled unverified demo sessions, not registered accounts. Saved addresses show current values while order details retain their historical snapshots. Customer activity consists only of recorded order events. The financial summary is explicitly labeled recorded order value, includes cancelled orders, and is not revenue or verified spend; unknown totals remain unconfigured.

## Functionality

### Orders

Reference/customer/mobile search; status, payment method/status and inclusive local-date filters; newest/oldest sorting; amount sorting only when numeric totals exist; reset; result count and pagination. The desktop table includes order reference, date/time, customer, mobile, total quantity, total, payment method/status, order status and detail action. At narrower widths rows become labeled cards.

Details show item snapshots, SKU, size, quantities, unit/line totals, subtotal/shipping/tax/final total, COD status, delivery snapshot and instructions, recorded event timeline, internal notes and customer navigation. Unknown and foreign-session references show unavailable states.

### Status and cancellation

Allowed progression: Placed → Confirmed → Packed → Shipped → Out for Delivery → Delivered. No skipping, backwards progression or terminal edits. Every change requires confirmation. Optional notes/reasons are saved only after the local transition. Notes are internal admin fields and are not included in customer timeline text. Status events contain the actual local event timestamp and a truthful demo notice. COD payment status is never marked paid.

Cancellation reuses `cancelSessionDemoOrder` and the existing eligibility rule: Placed/Confirmed only, with no later-stage history. Repeated cancellation cannot create another event. Expected-status checking rejects stale transitions. Neither placement nor cancellation reserves/restores inventory in the existing demo, so no new stock adjustment logic was introduced. No business/customer notification is sent.

### Delivery panel

Always displays the available typed address and Copy Address. Clipboard success is reported only after `navigator.clipboard.writeText` resolves; failure offers manual copying.

Coordinates require numeric finite `latitude` and `longitude`, valid ranges and explicit `coordinatesConfirmed: true` on the immutable address snapshot. Confirmed values produce an encoded Google Maps URL and Copy Coordinates. Zero is valid. Missing/unconfirmed/string/out-of-range coordinates never produce a map link. The current address workflow does not capture GPS; this prepares for future confirmed data without generating it. No SDK, geocoding or maps API is called. An address-only order clearly states that GPS is unavailable and the typed address is not geographically verified.

## Changed files

New:
- `src/services/orderAdminService.js`
- `src/pages/admin/OperationsWorkspace.jsx`
- `src/dev/DevelopmentAdmin.jsx`
- `src/styles/admin-operations.css`
- `scripts/check-orders-customers-admin.mjs`
- `PHASE5_ORDERS_CUSTOMERS.md`

Updated:
- `src/services/checkoutService.js` — immutable customer/SKU snapshots.
- `src/state/store.js` — guarded shared admin transition action.
- `src/services/adminService.js` — one session order source, derived customers and terminal status counts.
- `src/routes/adminRegistry.js` — order/customer detail routes.
- `src/layouts/AdminLayout.jsx` — dynamic-route breadcrumb matching.
- `src/pages/admin/AdminManagementPage.jsx` — operations workspace integration.
- `src/pages/admin/AdminDashboard.jsx` — counts, detail links and scope-aware quick actions.
- `src/dev/CheckoutDevelopmentPreview.jsx` — nested administration without replacing the fixture provider.
- `dist/` — regenerated production output.

Existing catalogue administration, customer views, storefront design, checkout eligibility and cancellation services are reused. CMS, blog, homepage editing and business settings remain untouched.

## Validation — 17 October 2026

- `npm run build`: PASS, Vite 7.3.7, 1,722 modules, 3.30 seconds. Main JS 472.30 kB; admin chunk 40.85 kB. No build warnings.
- All **17** `scripts/check-*.mjs`: PASS. Existing 16 scripts plus `check-orders-customers-admin.mjs`.
- New coverage: empty state; actual isolated checkout placement and customer linkage; normalized search; composed status/payment/date filters; sorting/pagination; valid/invalid/stale transitions; actual event history; customer status synchronization; cancellation restrictions and duplicate prevention; immutable address/product/customer/SKU snapshots; confirmed-only coordinate links; customer detail/history; dashboard counts; session reset and persistence exclusion.
- Rendered markup checks cover admin order/customer routes, missing detail, internal-note separation from customer history, delivery panel, development navigation and dashboard links. CSS parses without warnings.
- Production-defined service bundle tests confirm admin order/customer selectors return no records and status mutation rejects execution outside development. Existing checks confirm checkout fixtures and illustrative records are absent from production JavaScript.
- HTTP GET `/admin/orders`, `/admin/customers`, `/dev/checkout/admin/orders`: **200** at port 5174. This confirms server availability only.
- Browser visual and interactive checks at **320–1440px: BLOCKED** by the established browser URL security restriction. Actual overflow measurements, keyboard/focus behavior, clipboard permissions, dialog click-through and visual acceptance are not claimed as passed. Responsive CSS and SSR checks are not browser verification. No workaround or repeated user navigation request was attempted.

Commands executed: `npm run build`; PowerShell enumeration of all `scripts/check-*.mjs` and `node` execution; standalone `node scripts/check-orders-customers-admin.mjs`; `Invoke-WebRequest` HTTP checks. All test records remain synthetic and isolated in the test process.

## Static and security boundaries

The admin remains an unsecured development preview, not authentication or authorization. These order/customer operations expose no session data in production builds; the root routes render a development-only notice. The separate fixture module is excluded entirely. Data is not persisted or shared between browsers/tabs, and no network mutation occurs. No payment collection, real delivery, verified identity or geographical verification is simulated. Internal notes are a UI separation only, not protected production data. Users must supply synthetic information during demonstration.

## Future PHP/MySQL integration

Replace the service adapter behind the current presentation with authenticated endpoints such as:
- GET `/api/admin/orders` with validated filters, pagination and scope.
- GET `/api/admin/orders/:id` with immutable snapshots and authoritative events.
- POST `/api/admin/orders/:id/status` with expected version, allowed transition, idempotency key and optional internal note.
- POST `/api/admin/orders/:id/cancel` reusing one server cancellation policy and transactional stock behavior.
- GET `/api/admin/customers` and `/api/admin/customers/:id` with permission-scoped profile/address/history access.
- GET `/api/admin/dashboard` for authoritative derived counts.

Server implementation must add real admin authorization, customer ownership, database transactions, concurrency/version checks, durable idempotency, audit attribution, protected notes, validated confirmed coordinates, privacy controls and authoritative timestamps. Payment collection/refunds and carrier tracking require separately authorized integrations; a status change must never imply payment capture. Preserve snapshot immutability and reconcile customer/admin views after successful writes. No proposed endpoint exists or is called in this phase.

Remaining work: unblock browser QA; implement subsequent admin features only when requested; connect real authorized backend services in their later phase.

# Phase 7D — COD checkout, delivery and orders

Implementation date: 2026-10-19. Code and manual deployment packages prepared locally. Production order acceptance remains disabled by default. No deployment, commit, live customer/order mutation, permission grant or database credential change was made.

## Evidence before commerce

Owner supplied a successful live customer account screenshot and reported login, logout and re-login working after correcting the PHP Firebase project setting. This is owner-verified authentication evidence, not a claim that Codex signed in or inspected personal MySQL rows. Earlier read-only live probes returned health 200/ok, readiness 200/ready, guest auth/me 401 UNAUTHENTICATED and anonymous admin/session 200. Existing Phase 7C code was inspected: verified Firebase identity creates a separate PHP customer session; profile/addresses/wishlist use owner-scoped PDO services; map coordinates require explicit confirmation and range validation; admin uses a separate session and permissions.

Current real profile/address persistence, cross-customer ownership, Maps/manual fallback and authenticated admin regression have not all been independently accepted in this phase. Maps working is owner-reported in the request. The private order flag stays off until those checks and isolated commerce acceptance pass. No OTP/password/token was requested or printed.

## Implemented endpoints

| Endpoint | Behavior / authority |
|---|---|
| GET /api/commerce/status | Public capability flag; false by default, COD only |
| POST /api/delivery/check | Valid PIN, configured active zone, server coverage; customer-session CSRF handshake required even for guest check |
| POST /api/delivery/quote | Authenticated owned address + cart; server-calculated delivery/tax totals, no persisted quote |
| POST /api/checkout/quote | Authenticated verified active customer; ten-minute persisted quote + item/address snapshots |
| POST /api/orders | Authenticated owner + unexpired quote + Idempotency-Key; private acceptance flag, COD, transactional stock deduction and pending payment |
| GET /api/me/orders | Owned orders, bounded page/pageSize, optional status filter |
| GET /api/me/orders/{id} | Owned immutable snapshots and recorded public status history; foreign/missing 404 |
| POST /api/me/orders/{id}/cancel | Owned Placed/Confirmed cancellation, If-Match, one transaction, once-only restock |
| GET /api/admin/orders | orders.manage permission; paginated real orders |
| GET /api/admin/orders/{id} | orders.manage; snapshots, verified customer mobile, full address, confirmed navigation coordinates, internal notes/events |
| PATCH /api/admin/orders/{id} | orders.manage + CSRF + If-Match; validated next status/cancellation and optional internal note |
| GET/PATCH /api/admin/delivery/settings | settings.write; read/full policy update with If-Match and audit |
| POST /api/admin/delivery/zones | settings.write; create reviewed zone/PIN coverage |
| PATCH /api/admin/delivery/zones/{id} | settings.write + If-Match; update zone, conflict-safe PIN mapping and audit |

Mutation requests use the existing secure cookies, same-origin checks and CSRF tokens. Unknown fields are rejected. Only public commerce/status avoids a session; public delivery/check uses the existing auth/csrf pre-session handshake. Rate limiting applies to writes. No Firebase service-account keys or new external production API dependencies were added.

Quote input: `{addressId,items:[{productId,quantity,sku?}],paymentMethod:"cod"}`. SKU, when supplied, must match the independent product ID. Each quantity is its own product, never a variant. Quotes do not reserve stock. Order input: `{quoteId,paymentMethod:"cod",deliveryInstructions?}` plus a stable Idempotency-Key; no price, stock, totals, coordinates, role or payment result is accepted from the client.

## Data and transaction behavior

Existing tables are reused: delivery_settings, delivery_zones, delivery_zone_pins, checkout_quotes, quote_items, orders, order_items, order_status_events, order_notes, inventory_balances, inventory_movements, payments, audit_logs and existing customer/address/role tables. Migration 004 adds eleven columns needed for policy/radius/estimates, quote snapshots and replay hashes. It changes no existing customer/order/media data and does not grant permissions or enable acceptance. It is a separate one-time manual migration; legacy readiness checks do not validate it.

Money uses integer INR paise with checked arithmetic (commerce cap 1,000,000,000,000 paise); each quantity is integer 1..10,000 and at most 100 unique product IDs. Duplicate product IDs are rejected. Current MySQL status, nonnull price and available on_hand minus reserved are required. Explicit zero price remains supported by the existing catalogue contract; no null value becomes free pricing.

A quote stores the owner, owned address/version/snapshot, product ID/version/SKU/name/size and prices, quantity/tax lines, delivery settings/zone versions, totals and expiry. Before placement all are recomputed under transaction locks and compared with the stored snapshot. Changed stock, address, product/policy or expiry produces a safe error requiring review. Comparisons are structural because MySQL JSON may reorder object keys. Customer coordinates are snapshot/navigation information only and never drive coverage.

Placement locks the customer (serializes retries), quote, delivery settings, owned address and product/balance rows in deterministic item order. Conditional balance UPDATE additionally requires sufficient available stock. Unique customer/idempotency, quote, reference and movement keys remain enforced. One transaction inserts the order/items, deducts inventory, records movements, consumes the quote, creates a COD payment record in created state, appends Placed and audit events. Any exception rolls back. Deadlock/lock-timeout errors become safe retry-with-same-key conflicts. The durable order request hash rejects changed payloads under a reused key. A repeated matching request returns its existing order, including after acceptance is disabled.

Status progression: placed → confirmed → packed → shipped → out_for_delivery → delivered. Cancellation is allowed only from placed/confirmed. Delivered/cancelled are terminal. A locked cancellation transaction restores quantities once, records restock movements and cancellation/audit events. Repeated empty cancellation of an already cancelled order returns the existing record without restocking again. Order address/items and prices never follow later catalogue edits. Internal notes are excluded from customer serialization. COD payment_status stays pending and payments.status stays created even after delivery; no collection workflow or Razorpay integration exists.

## Delivery model and business configuration

Exact serviceable PINs belong to one zone each. Required effective shipping/minimum settings must be configured, including explicit zero where intended; optional free-shipping thresholds apply against item subtotal. Zone settings inherit store values when null. Both store and zone COD switches must allow COD. Missing configuration fails closed.

Optional radius is a conservative server-owned PIN coverage bound: administrator-reviewed PIN centre plus coverage radius must fit inside the configured origin radius. It does not trust the customer's selected pin as evidence of their delivery location. No geocoding lookup or invented coordinates are used. Radius checks require reviewed coordinate/bound data; PIN-only coverage supports manual addresses without GPS.

Tax supports an explicitly reviewed no-additional-tax policy (zero basis points) or a single uniform exclusive basis-point rate. It rounds half-up per item line, with optional separately rounded shipping tax. No tax rates are seeded or inferred. Mixed product tax rates/inclusive-tax accounting are not supported and block launch if required by the actual business policy. Estimates are optional configured day ranges, not live shipment tracking.

## Frontend integration

- Existing storefront, header/footer, design tokens and reusable controls remain. Checkout keeps the editorial header, progress labels, address/payment controls, responsive item/summary panels and confirmation modal. API mode uses real saved addresses, quote review, integer-paise display, COD selection, pending/error states and a synchronous submission lock. Server success is required before cart clear and order confirmation navigation. Network retries retain the same key. Quotes invalidate when cart/address/customer scope changes.
- `/account/orders`, `/account/orders/:orderId` and `/order-success/:orderId` fetch real owned data. Loading/error/empty states, pagination/status filters, cancellation and only recorded timeline events are present. Stale responses and previously loaded data are excluded when owner/route scope changes.
- `/admin/orders` preserves the responsive table pattern; details use existing panels and show immutable items, customer mobile/address, totals, pending COD, confirmed-only Google navigation, transition modal, internal notes and event history. `/admin/settings/delivery` provides actual API-backed policy/zone controls. Catalogue-only roles are denied; the optional operator grant adds a dedicated commerce role without replacing existing catalogue privileges.
- Product delivery checks use real server PIN rules in API mode; cart shipping/tax text correctly says calculated at checkout. Demo fixtures remain isolated and excluded from production routing/data. Production forces API mode; no API error silently falls back to mock data.
- Checkout and commerce views are lazy-loaded to preserve bundle size. Source maps and development fixtures are absent from the production package. Other unfinished admin/customer/content modules retain their existing clearly labelled limitations.

## Validation actually executed

- `npm run build`: PASS, 1,755 modules; final main chunk about 494 kB, no chunk-size warning.
- All 29 frontend `scripts/check-*.mjs` invoked: 27 PASS; two opt-in live proxy/browser scripts SKIP. API-mode suites use synthetic fetch responses; existing mock suites run explicitly in mock mode. Final changed UI received additional targeted commerce and deployment checks after build.
- PHP lint across app/bootstrap/tests: PASS.
- Six offline PHP suites: foundation 36, configuration 13, catalogue 40, real-bootstrap dispatch 17, customer 53, commerce 83 = 242 passing assertions.
- New frontend tests: quote field allowlist, authenticated cookie/CSRF transport, stable idempotency retry, version headers, pagination metadata, exact paise formatting, server error propagation, unpaid COD, internal-note separation, confirmed-only Maps navigation and confirmation wiring.
- New PHP commerce tests: unconfigured policy, ownership and unverified identity, invalid PIN/coverage, all non-purchasable statuses, missing price, malformed/duplicate quantities and attempted price/role injection, insufficient stock, tax/shipping/free-shipping/minimum calculations, conservative radius bounds, stale address/settings versions, quote expiry/consumption, replay/hash conflict, owner-isolated history, unknown SQL-like IDs, injected post-deduction failure rollback, allowed/forbidden lifecycle transitions, delivered pending payment, once-only cancellation restock, permission segregation, CSRF/origin denial and versioned zone/PIN conflict rollback.
- Sequential competing last-stock quotes pass in SQLite. This is NOT proof of simultaneous InnoDB locking. The real concurrent harness is provided, syntax checked and confirmed to refuse execution by default; its actual MySQL race remains NOT RUN.
- Package CRC/file-set/SHA-256 verification: PASS. No private config.php, credentials, environment files, service accounts, existing media, SQL or test fixtures included in either ZIP.

No local Apache/MySQL/XAMPP services were started. Existing `C:/xampp/php/php.exe` was used solely as an available CLI binary for lint/offline tests; deployment requires ordinary Hostinger PHP, not XAMPP. Synthetic fixture values are not product data or production seeds.

## Not verified / activation blockers

1. No disposable hosted MySQL test database was supplied. True concurrent last-stock/replay behavior, InnoDB rollback/FK behavior and the new migration must be validated there. SQLite tests do not validate MySQL locks, SQL dialect or deployment configuration.
2. Newly implemented commerce endpoints are not uploaded. No browser-to-live-MySQL checkout/order/admin lifecycle test was performed; no real order was created.
3. Owner login/logout/re-login is verified by report, but profile/address persistence, another customer's isolation, explicit Maps coordinate persistence/manual fallback and current authenticated admin regression remain release gates.
4. Actual product prices/stock, delivery zones/fees/thresholds/minimum, tax policy, COD availability and optional estimates/radius data require owner configuration. No business values were assumed.
5. Full new checkout/admin browser interaction and responsive acceptance after upload remains pending. SSR/adapter tests are not visual/browser QA.
6. Payment collection, GST invoicing, mixed tax rates, carrier integration, driver tracking, notifications and Razorpay remain outside this phase. Status changes do not imply payment capture or a carrier event. Product photography remains labelled placeholders where absent.

ORDER_ACCEPTANCE_ENABLED remains false unless explicitly set by the private operator after acceptance. Enabling the test process in a disposable test environment does not authorize enabling production. See PHASE7D_UPLOAD_MAP.md for precise upload order, manual schema/role operations, acceptance gates and data-preserving rollback.

## Changed files

New runtime PHP:
- backend/app/Services/CommerceRules.php
- backend/app/Services/DeliveryService.php
- backend/app/Services/CommerceService.php
- backend/app/Controllers/CommerceController.php
- backend/config/commerce.example.php (reference only)

Updated runtime PHP: backend/bootstrap/load.php, backend/bootstrap/app.php. Existing authentication, customer, database configuration and public API entry points were not modified.

SQL: backend/database/migrations/004_cod_commerce.sql; backend/database/manual/verify_commerce.sql; backend/database/manual/grant_commerce_permissions.sql.

New frontend: src/services/commerceApi.js; src/pages/LiveCommerce.jsx; src/pages/admin/LiveDeliverySettings.jsx; src/styles/commerce.css.

Updated frontend: src/App.jsx; src/services/customerApi.js; src/services/catalogueApi.js; src/pages/CheckoutPreview.jsx; src/pages/OrderSuccessPage.jsx; src/pages/RealAccountPage.jsx; src/pages/admin/AdminManagementPage.jsx; src/layouts/AdminLayout.jsx; src/components/cart/CartContents.jsx; src/components/product/DeliveryPreview.jsx.

Tests/tooling: backend/tests/commerce.php; backend/tests/commerce-mysql.php; backend/tests/dispatch.php; scripts/check-commerce.mjs; scripts/package-phase7d.py.

Documentation/artifacts: PHASE7D_COD_ORDERS.md; PHASE7D_UPLOAD_MAP.md; dist/; backend/deployment/phase7d-commerce-incremental.zip; deployment/virasat-frontend-phase7d.zip; deployment/phase7d-checksums.json. Old website untouched; no deploy or commit.

## Package checksums

- `backend/deployment/phase7d-commerce-incremental.zip`: 13037 bytes, 7 files; SHA-256 `a5fd1c031d92b906c251e92c89fe947e4b295aa6be449ebf1c493653f0569947`.

- `deployment/virasat-frontend-phase7d.zip`: 256205 bytes, 13 files; SHA-256 `adee6b98f5236bed35ef327706d35321048ad2fd31e3258506352d79f6355b98`.

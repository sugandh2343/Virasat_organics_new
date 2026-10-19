# Phase 7G — business operations

Implemented locally on 19 October 2026 in the existing V2 project. No deployment, commit, live SQL, cash recording, real customer mutation, credential/config.php change or provider activation was performed. The old website was not touched.

## Operational audit and resulting integration

| Module | Inspected starting state | Phase 7G result |
|---|---|---|
| Admin sessions | Real PHP sessions, CSRF, secure cookies, permissions | Reused unchanged; granular operation rights added |
| Dashboard | Demo counts mixed with live catalogue snapshot | Real MySQL aggregates and IST date ranges, no demo records in API mode |
| Orders | Real transactional placement/status/cancellation; search limited | Existing service reused; search, cancellation reason, separate notes, actual COD collection, print summary added |
| Customers | Session-only demo directory | Protected real profiles/addresses/order histories and separately defined values |
| Inventory | Real catalogue adjustment ledger and locking | Reused adjustments; thresholds, ledger reconciliation and granular permission enforcement |
| Delivery | Real shared Phase 7D settings/zones/PIN/tax rules | Same authority retained; health and operational order views added |
| Reporting | No real reporting module | Nine protected report types, filters/pagination and safe current-page CSV |
| Notifications | No persistent admin event feed | Durable idempotent projection of committed events, per-admin read/unread, optional CLI cron |
| CMS | Phase 7F classes, adapters, migration and packages present locally | Verified and reused for business/seller display; live deployment not assumed |
| Payments | Phase 7E disabled Razorpay infrastructure | Left disabled; explicit COD cash recording only |

The API-mode shell loads independent modules separately, so a reports-only or customer-only role is not forced to fetch the catalogue. Catalogue editing no longer fetches inventory history unnecessarily. Explicit development mock workspaces remain unchanged in purpose and do not serve as a fallback after API failures. Verified mojibake in the shared live order display was repaired without changing its layout.

## Implemented interfaces

Existing admin navigation and styling are retained. Added /admin/reports, /admin/notifications, /admin/delivery, /admin/inventory/history and /admin/orders/:orderId/document. Existing dashboard, customer, inventory and order routes dispatch to live operations in API mode. Admin profile displays actual session identity rather than the old development placeholder. The header refresh also refreshes operations data.

Dashboard supports Today, Last 7 Days, Last 30 Days and Custom. Counts include awaiting confirmation, pending fulfilment, completed/cancelled orders, current active products, out-of-stock/low-stock, threshold gaps and customers. Order/financial totals use the selected order-placement cohort; current catalogue/customer counts are explicitly not date filtered. Today's orders is an independent current-day count.

Reports include summary, daily/monthly orders, product/category item values, status, COD, cancellations and delivery status. Product/category filter choices come from a protected metadata endpoint, including inactive historical products. Detailed results are paginated. CSV exports the current filtered page (up to 100 rows), not an unbounded whole database; filename and UI say so. Cells are quoted and formula-triggering prefixes/control/whitespace/BOM sequences are neutralized. Financial columns in CSV contain integer paise.

Order operations preserve immutable item/address/contact snapshots and authoritative customer tracking. Confirmed coordinates produce navigation links only when valid. Sequential/terminal status rules remain in CommerceRules. Admin cancellation requires an internal reason; customer cancellation still uses existing ownership restrictions. Internal/delivery notes can be saved separately with a version check. Notes remain hidden from customer responses. Stock restores once on eligible cancellation.

COD collection is restricted to the full amount of a delivered, unpaid COD order with exactly one matching uncollected COD payment. Staff must confirm actual receipt and enter a reference/note. The transaction locks the order, checks its version, writes a unique collection record, updates payment/order and audits the actor. Same-key identical retry returns the existing result; duplicate/different requests cannot record cash twice. No browser action charges money. Reversal/refund processing is not implemented; erroneous real records require operator reconciliation, not editing totals in the UI.

Customer administration exposes name, mobile verification, email/status, saved addresses and paginated owned order history. Firebase UID/tokens/session secrets are excluded. No new identity or customer-state mutation endpoint is added.

Inventory reports show actual/null stock, reserved quantities, per-product optional low-stock threshold, adjustment/order movement history and ledger reconciliation. Null quantities remain unconfigured. Missing/inconsistent historical ledgers are flagged, never repaired automatically. Adjustment reasons and actor IDs are retained. Existing transactional set/adjust validation prevents negative stock and stale product updates. Inventory permission is checked even when a stock edit is submitted through the catalogue editor.

Delivery health exposes configured policy/tax/origin/zone state and links to existing authoritative settings and status-filtered order management. There is no invented courier, location, tracking feed or ETA.

Printable HTML is labelled **Order summary — not a tax invoice**. It uses actual snapshots, recorded taxes when nonzero, genuine seller details and visible configured GSTIN/FSSAI fields. Browser Print/Save PDF is available. No GST rates, invoice numbers, billing address, registrations or receipt confirmation are fabricated.

## Protected endpoints and permissions

| Method/path | Permission / behavior |
|---|---|
| GET /api/admin/dashboard | reports.read |
| GET /api/admin/reports/{summary,daily,monthly,products,categories,status,cod,cancellations,delivery} | reports.read; optional export=csv returns safe download payload |
| GET /api/admin/operations/options | reports.read; product/category choices, bounded to 1000 each |
| GET /api/admin/customers and /customers/{id} | customers.read; detail orderPage pagination |
| GET /api/admin/orders and /orders/{id} | orders.read; existing service extended with q/from/to |
| PATCH /api/admin/orders/{id} | orders.manage; existing transitions and version checks |
| POST /api/admin/orders/{id}/notes | orders.manage; internal notes only |
| POST /api/admin/orders/{id}/collect-cod | payments.record_cod; actual full received cash, version/idempotency |
| GET /api/admin/orders/{id}/document | orders.read; reviewed business display fields only |
| GET /api/admin/operations/inventory | inventory.read; paginated stock/reconciliation |
| PATCH /api/admin/operations/inventory/{id} | inventory.write; versioned nullable threshold |
| GET /api/admin/inventory and /inventory/history | inventory.read; existing catalogue/ledger projection |
| POST /api/admin/inventory/adjustments | inventory.write; existing locked/idempotent adjustment service |
| GET /api/admin/delivery/settings and /delivery/health | delivery.read |
| PATCH delivery/settings; POST/PATCH delivery/zones | delivery.manage |
| GET /api/admin/notifications | notifications.read; bounded event projection and paginated feed |
| PATCH /api/admin/notifications/{id} | notifications.read plus CSRF; only requesting admin's read/unread state |

All writes retain session, same-origin and CSRF protection. Missing authorization fails, never falls back to mock. Financial/customer APIs do not return credentials or private configuration. Permission definitions are additive; no existing owner is silently granted new rights. The optional audited owner grant is private SQL with explicit approval and NULL defaults. See the upload map for compatibility implications and exact grant procedure.

## Accounting definitions

Dates are calendar dates in Asia/Kolkata, converted to an inclusive start/exclusive end UTC query. Custom ranges are bounded to 367 calendar days. MySQL computes daily/monthly buckets with the same +05:30 offset; no dependence on installed MySQL named-timezone tables.

- Gross order value: sum of recorded order totals in the placement-date cohort, including subsequently cancelled orders. This is not paid revenue.
- Cancelled value: recorded totals of cancelled orders in that cohort, separate from revenue.
- Collected revenue: captured payments with captured_at on orders marked paid and not cancelled. Pending/authorized/failed/refund-pending/refunded payments do not count. Delivery alone never marks paid.
- COD collected: actual cod_collections ledger amounts for orders in the cohort. Collection timestamps/actor/reference are persisted; date filtering is by order placement, not cash-receipt date.
- COD outstanding: noncancelled COD orders not marked paid. Cancelled COD is excluded.
- Product/category figures: recorded item subtotals/quantities; shipping and tax are excluded. Finalized item value requires delivered+paid and a captured payment. It is not allocated cash revenue. Categories use current catalogue membership because historical category snapshots were not stored.
- Customer lifetime order value includes cancelled orders, which are separately shown; captured paid value is separate.

No profit, accounting tax return, courier settlement, partial COD collection or automatic refund calculation is invented. Large aggregates exceeding safe display limits fail for reconciliation rather than silently rounding.

## Notifications

Order status events are already durable and committed with order transactions. OperationNotifications projects these events into operation_notifications using unique event keys. Low stock uses product ID plus balance version. Projection is bounded and retry-safe; concurrent inserts are deduplicated by the database. Each administrator has separate read/unread records. Historical committed events may appear during initial processing; they remain actual events.

The authenticated feed processes a small batch; optional private CLI cron processes larger batches, so shared hosting does not need a daemon. Email status and the email-adapter result are explicitly disabled. No external messages are sent or reported as delivered. Future real email delivery needs a reviewed adapter, consent/recipient policy and schema change. Cron instructions and absence of provider configuration are documented in PHASE7G_UPLOAD_MAP.md.

## Changed files and schema

New backend runtime: OperationsRules.php, OperationsService.php, OperationNotifications.php, OperationsController.php and bin/process-notifications.php. Updated Security.php, AdminAuth.php, CatalogueAdmin.php, CatalogueController.php, CommerceService.php, CommerceController.php and bootstrap/load.php/app.php.

007_business_operations.sql adds low_stock_threshold, cod_collections, operation_notifications, operation_notification_reads and ten permission definitions. It does not alter credentials, activate COD/Razorpay or insert business events. grant_operations_permissions.sql is separate and optional.

Frontend: new operationsApi.js, LiveOperations.jsx and business-operations.css; updated AdminManagementPage.jsx, adminRegistry.js, AdminLayout.jsx, AdminTopbar.jsx, adminService.js, catalogueApi.js and LiveCommerce.jsx. Existing tokens, public header/footer and homepage layouts were not redesigned.

Tests/support: new backend/tests/operations.php, scripts/check-operations-api.mjs and scripts/package-phase7g.py; updated the opt-in catalogue-database.php synthetic actor/permission fixture. These are not uploaded.

## Tests and actual limitations

- Final PHP lint passed for app, bootstrap, bin and test PHP files.
- Offline suites passed: foundation 36, configuration 13, catalogue 40, dispatch 17, customer 53, commerce 83, payments 54, CMS 61 and operations 84: **441 assertions**.
- All 31 pre-existing frontend scripts were run: 29 passed, two opt-in live/browser scripts skipped. New operations regression passed; total **30 passed, two skipped**. Relevant admin/auth/catalogue/API-mode/production checks were repeated after final edits.
- New tests cover accounting/unpaid COD/cancellation, duplicate collection, version conflicts, catalogue stock permission isolation, negative adjustments, customer ownership/privacy, report pagination/filters, CSV formula safety, notification deduplication/read isolation, permission denial and CSRF. SQL inputs are bound; report group identifiers are allowlisted. Synthetic SQLite translates MySQL date functions and omits locks; this is NOT a MySQL concurrency result.
- Initial new test caught a null cancellation-note validation bug; normalized absent notes and required an admin cancellation reason, then reran successfully. A targeted production regression invocation used a nonexistent short filename; it was corrected to check-production-deployment.mjs and rerun.
- Final npm run build passed: 1763 modules, main JS 498.53 kB, no chunk-size warning. Operations is lazy-loaded.
- ZIP CRC/inventory/source-byte comparisons passed and SHA-256 manifests were generated.

Not performed: deployed MySQL migration execution, simultaneous MySQL lock testing, real Hostinger API calls, actual staff login, browser/mobile interactions, print layout acceptance, provider tests or live operational mutations. The existing disposable hosted MySQL harnesses remain opt-in and must never target production. No local MySQL, Apache, XAMPP services, Docker or production Node server was started; the existing PHP executable was used only for offline CLI tests.

## Packages and Phase 7H prerequisites

Backend ZIP: D:/Virasat Organics/virasat-organics-v2/backend/deployment/phase7g-operations-incremental.zip

Frontend ZIP: D:/Virasat Organics/virasat-organics-v2/deployment/virasat-frontend-phase7g.zip

SQL: D:/Virasat Organics/virasat-organics-v2/backend/database/migrations/007_business_operations.sql

Owner grant: D:/Virasat Organics/virasat-organics-v2/backend/database/manual/grant_operations_permissions.sql

Upload map: D:/Virasat Organics/virasat-organics-v2/PHASE7G_UPLOAD_MAP.md

Checksums: D:/Virasat Organics/virasat-organics-v2/deployment/phase7g-checksums.json

Confirm 7E/F runtime/schema dependencies, backup, validate/import 007, review/grant owner permissions, then manually upload in documented order. Preserve config.php, /api, sessions and uploaded media. Detailed production acceptance remains Phase 7H.

**Public COD stays blocked at the HTTP controller in this release**, independently of editable settings. The underlying service remains testable in isolated fixtures. Phase 7H must deliberately review/remove that release hold only after successful acceptance; do not enable it through configuration now. Razorpay remains disabled and no merchant keys are requested.

Phase 7H should verify isolated MySQL races/rollback/idempotency, real browser login/expiry, mobile tables/forms, printable summaries, actual business settings, CMS publication, customer history/ownership, all role boundaries and notification cron behavior. No preview server was started in this phase; intended manual-deployment entry is https://virasatorganics.com/admin.

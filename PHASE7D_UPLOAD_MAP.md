# Phase 7D — exact manual upload map

Prepared 2026-10-19. This is a handoff, not a deployment. ORDER_ACCEPTANCE_ENABLED is false by default. No real order, database mutation, role grant, provider payment or Hostinger upload was performed.

## Artifacts

Project: `D:/Virasat Organics/virasat-organics-v2/`

- Backend ZIP: `backend/deployment/phase7d-commerce-incremental.zip` (seven PHP files; paths relative to private backend root).
- Frontend ZIP: `deployment/virasat-frontend-phase7d.zip` (contents of dist, no wrapping directory).
- Separate migration: `backend/database/migrations/004_cod_commerce.sql`.
- Separate read-only verification: `backend/database/manual/verify_commerce.sql`.
- Optional, separately reviewed role grant: `backend/database/manual/grant_commerce_permissions.sql` (target email defaults to NULL; no grant until operator edits it).
- Checksum inventory: `deployment/phase7d-checksums.json`.
- Implementation/test report: `PHASE7D_COD_ORDERS.md`.

Every relative local path in this guide is under the project path above. Existing Phase 7C packages remain rollback artifacts; use the Phase 7D packages for this release.

## Before upload

1. Back up the selected V2 MySQL database through phpMyAdmin Export and keep it private, outside public_html. Back up the existing private bootstrap/app.php and bootstrap/load.php, any matching seven files, and existing frontend index.html/root .htaccess/assets. Record existing filenames. Do not copy secrets into a public backup directory.
2. Verify existing health/ready, customer OTP/session/profile/addresses, Maps/manual fallback and admin login. Login/logout/re-login has owner evidence; persisted profile/address ownership still needs explicit acceptance. Keep order acceptance off regardless of whether code upload succeeds.
3. Confirm PHP 8+, 64-bit integers, PDO MySQL/InnoDB transactions, existing private writable sessions and current Phase 7C files. No production Node, Laravel, local MySQL or Apache installation is needed. Existing database/session/Firebase configuration remains unchanged.
4. In phpMyAdmin select the intended V2 database. Inspect new columns using verify_commerce.sql BEFORE import: before first import none of its eleven listed new columns should exist. Existing 001/002 schema and Phase 7C 003 UID collation are prerequisites. Do not rerun old migrations or seed files.

## SQL import — manual, separate from ZIPs

Import `D:/Virasat Organics/virasat-organics-v2/backend/database/migrations/004_cod_commerce.sql` through phpMyAdmin's Import tab in the correct database.

This adds eleven nullable/defaulted columns to existing delivery/quote/order tables, inserts an unconfigured settings singleton only if absent, and adds two permission definitions. It does not grant roles, enable COD/order acceptance, replace existing settings, alter real prices/stock, erase orders or create sample customers/products.

MySQL DDL auto-commits. This is a one-time additive migration, not an idempotent migration runner entry. If interrupted or partially applied, inspect information_schema and execute ONLY missing ALTER statements/columns; do not blindly retry the whole script. The existing /api/ready manifest validates earlier migrations only and does not certify Phase 7D.

Run `backend/database/manual/verify_commerce.sql` afterward. Require exactly the eleven specified columns with expected types, the delivery-settings singleton, orders.manage/settings.write definitions, zero invalid balances and the existing unique order indexes. Do not modify balances to force a test pass. Existing records/snapshots remain intact; pre-7D quotes without snapshots are deliberately rejected as stale.

## Every production PHP file and upload order

Extract backend ZIP into a PRIVATE staging location or upload the entries individually to the following destinations. Upload class files first, then load.php, then app.php LAST. Never extract the private ZIP under public_html. Back up any existing destination before replacement.

| Order | Exact local file | Exact Hostinger destination | Action |
|---|---|---|---|
| 1 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/CommerceRules.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/CommerceRules.php` | CREATE — if already present, back up then replace |
| 2 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/DeliveryService.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/DeliveryService.php` | CREATE — if already present, back up then replace |
| 3 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/CommerceService.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/CommerceService.php` | CREATE — if already present, back up then replace |
| 4 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Controllers/CommerceController.php` | `domains/virasatorganics.com/private/virasat-backend/app/Controllers/CommerceController.php` | CREATE — if already present, back up then replace |
| 5 | `D:/Virasat Organics/virasat-organics-v2/backend/config/commerce.example.php` | `domains/virasatorganics.com/private/virasat-backend/config/commerce.example.php` | CREATE reference only; do not load or rename as config.php |
| 6 | `D:/Virasat Organics/virasat-organics-v2/backend/bootstrap/load.php` | `domains/virasatorganics.com/private/virasat-backend/bootstrap/load.php` | REPLACE — back up existing file |
| 7 | `D:/Virasat Organics/virasat-organics-v2/backend/bootstrap/app.php` | `domains/virasatorganics.com/private/virasat-backend/bootstrap/app.php` | REPLACE — back up existing file |

No public API entry point or API .htaccess change is needed. Preserve exactly:
- `domains/virasatorganics.com/public_html/api/` and all media/entry points/.htaccess inside it.
- `domains/virasatorganics.com/private/virasat-backend/config/config.php` and database/Firebase/session credentials/settings.
- Private storage, sessions, uploads, customer records and existing order records.

Changed PHP tests are LOCAL/ISOLATED-TEST ONLY, not production uploads:
- `backend/tests/commerce.php`: new synthetic offline suite; no production destination.
- `backend/tests/commerce-mysql.php`: new explicitly opt-in disposable hosted test suite; optional private test installation only, never public_html and never run against production.
- `backend/tests/dispatch.php`: updated anonymous-route regression; no production destination.

## Optional commerce permissions — explicit operator action

A catalogue.write-only admin is denied order/settings APIs with 403 FORBIDDEN. Do not change AdminAuth to bypass permissions.

After reviewing the intended administrator, open `backend/database/manual/grant_commerce_permissions.sql`, replace its NULL email variable with the exact existing approved active administrator email, and import it separately in phpMyAdmin. It creates a dedicated per-admin commerce role with only orders.manage and settings.write, preserves existing catalogue roles and grants nothing by default. Expected commerce_permission_count is 2 after a valid reviewed target. Never run bootstrap-admin.php again to obtain these permissions. Sign out/in and test order/delivery pages.

To revoke this grant, remove only that user's association to the dedicated `commerce-<MD5 of admin ID>` role after review; preserve other roles/permissions and audit history. Do not delete all admin roles.

## Private feature flag — keep OFF

No config.php modification is included. When documenting the default explicitly, the operator may merge ONLY this top-level entry into the existing returned array (not replace the file):

```php
'commerce' => [
    'order_acceptance_enabled' => false,
],
```

Alternatively use the Hostinger PHP environment `ORDER_ACCEPTANCE_ENABLED=false`. This is a PHP server setting, not a Vite/browser variable or local .env.local setting. An explicit PHP config boolean overrides the environment; only boolean true or the exact environment string true enables placement. Missing/false settings fail closed. The reference config file is not automatically loaded.

GET `/api/commerce/status` should report `orderAcceptanceEnabled: false`. Quotes can be reviewed when business rules are configured, but POST /api/orders remains disabled. No admin UI toggle can change this private gate.

## Configure actual business delivery policy

After the reviewed permission grant, use `/admin/settings/delivery`:
- Set actual serviceable PIN zones, status and COD availability. Each PIN belongs to only one zone, including inactive zones; remove it explicitly before assigning it elsewhere.
- Enter integer paise for shipping, minimum order and optional free-shipping threshold. Empty zone amounts inherit store policy; an empty effective free-shipping threshold means no free-shipping rule. Explicit zero is supported; null is never assumed to be zero for required fees/minimum.
- Review an actual tax policy: no additional tax with explicit 0 basis points, or one uniform exclusive basis-point rate. Give it a reviewed version/reference. Rounding is half-up independently per order line and, if enabled, shipping. No tax rate is seeded. Mixed product rates, inclusive-GST breakdowns or other tax regimes are not implemented: do not activate if your actual policy requires them.
- Optional estimates require both min/max days. They are configured estimates, never inferred carrier tracking.
- Optional maximum radius requires administrator-reviewed origin coordinates and a centre plus coverage-radius bound for every serviceable PIN. Whole-PIN bound = origin-to-centre distance + PIN coverage radius, rounded conservatively, must fit the store radius. Customer map coordinates are NOT trusted to grant coverage or compute fees. Without reviewed coverage coordinates, radius-based coverage is unconfigured. PIN-only mode needs no customer coordinates.
- Verify actual product status, price and available inventory through existing catalogue tools. No prices, stock or coverage were invented by this implementation.

Policy/zone changes increment versions and invalidate existing quotes. Shipping and taxes become authoritative only at server quote time.

## Frontend upload

Upload/extract `D:/Virasat Organics/virasat-organics-v2/deployment/virasat-frontend-phase7d.zip` into `domains/virasatorganics.com/public_html/`. Upload hashed assets first, index.html last. The archive contains dist contents, not a dist folder. Do not upload source, scripts, tests, SQL, docs, node_modules or environment files.

The root .htaccess is the same API-excluding SPA template used for the previous release. Preserve/merge any hosting/security/canonical redirect additions in the existing root .htaccess instead of blindly replacing them. Never overwrite `public_html/api/.htaccess`. The SPA excludes api, PHP paths, existing files/directories and missing assets before index.html fallback. Purge Hostinger/CDN HTML cache and hard-refresh. Keep previous hashed assets for rollback until acceptance.

Exact frontend files (all paths are relative to public_html):
- `.htaccess`
- `assets/AdminManagementPage-BaqAihHm.js`
- `assets/CMSWorkspace-Cl50s0dN.js`
- `assets/CheckoutPreview-D2tRXGbt.js`
- `assets/LiveCommerce-D1GYKm-n.js`
- `assets/LiveCommerce-DowcPz2z.css`
- `assets/RealAccountPage-CxBLdks5.js`
- `assets/index-BQ2WO6kE.js`
- `assets/index-DE71NmC1.css`
- `assets/index.esm-Bi4P41uy.js`
- `assets/index.esm-Cm2M2pw6.js`
- `assets/index.esm-DEruQ0TR.js`
- `index.html`

## API checks after upload (no arbitrary production orders)

- GET /api/health and /api/ready: existing JSON 200. They do not prove Phase 7D schema/commerce correctness.
- GET /api/commerce/status: 200 with orderAcceptanceEnabled false.
- Guest GET /api/me/orders and POST /api/checkout/quote, /api/orders: 401; guest admin order/settings requests: 401. Mutations in authenticated sessions without valid CSRF: 403. An unrelated Origin remains 403.
- `/api/does-not-exist` stays API JSON 404, not React HTML; product/account/order deep-link refresh works.
- Sign in privately as the owner. Obtain customer CSRF via the existing app flow; never paste cookies, OTPs or Firebase tokens in chat. Review an owned saved address; foreign IDs must return 404. A real customer quote body is `{addressId,items:[{productId,quantity}],paymentMethod:"cod"}`. No client price/tax/stock fields are accepted.
- Quotes without configured pricing/inventory/delivery/tax are rejected. Eligible quotes return integer paise, immutable address/item data, opaque id, ten-minute expiry and the false acceptance flag. Stock is not reserved by a quote.
- With the flag off, POST orders stays ORDER_ACCEPTANCE_DISABLED for valid new requests. Do not enable production just to test arbitrary orders. An idempotent retry of an already committed order may return its prior result even after the flag is switched off.
- After grant, GET /api/admin/orders and delivery settings should work; before grant catalogue-only accounts must receive FORBIDDEN. Customer sessions must never authorize admin mutations.
- Test actual new orders/lifecycle/restocking only in the isolated test environment described below. Orders use `{quoteId,paymentMethod:"cod",deliveryInstructions?}` plus Idempotency-Key. Cancel uses POST /api/me/orders/{id}/cancel with `{}` and If-Match. Admin status PATCH uses `{status,internalNote?}` with If-Match; it cannot mark COD paid.

## Disposable MySQL concurrency gate

`backend/tests/commerce-mysql.php` is provided but NOT RUN. It defaults to SKIP. It requires a separate hosted database whose name ends `_test`, no customer/orders/quotes/zones/movements, unconfigured delivery settings, schema 001–004, PHP CLI + PDO MySQL + proc_open, and private `backend/config/commerce-test.php` in the same validated structure as config.example.php with ONLY disposable DB credentials. Do not copy production credentials. The test refuses localhost/127.0.0.1/::1. Never make this file public.

On that isolated host, operator command:

```sh
VIRASAT_COMMERCE_TEST_ACK=DISPOSABLE_DATABASE_ONLY php backend/tests/commerce-mysql.php --disposable-hosted-test-db
```

It temporarily enables acceptance in its own process configuration only, creates synthetic records, races two processes on one unit of stock and on one duplicate idempotency key, then deletes only its records and restores the prior test delivery settings. It never reads config.php. If proc_open/remote MySQL access is unavailable, arrange a suitable isolated test host; do not substitute a production database. A failed/terminated run may require inspection/cleanup of the disposable database. Passing SQLite tests is not a substitute for this gate.

## Activation criteria — not authorized automatically

Keep production off until all are recorded:
1. Owner/customer OTP + PHP session survives refresh and logout/re-login; actual profile/address persistence and cross-customer isolation verified; admin login still works; explicit Maps confirmation and manual address fallback verified.
2. Migration verification and permission checks pass on the intended deployment.
3. Disposable hosted-MySQL simultaneous last-stock/replay tests pass, plus isolated end-to-end quote → order → admin status → customer history → cancellation and once-only restock. Test expiry, stale quote, payment-status pending and rollback.
4. Actual business prices/stock, serviceable PINs, shipping/minimum/free shipping, tax policy and COD/estimates are approved. Confirm there are no mixed-tax requirements unsupported here.
5. Browser desktop/mobile checkout, expired sessions, duplicate-submit/network retry, owner-only confirmation/history, internal-note separation and disabled online payments pass. No real order can be placed while the flag is off.
6. The owner explicitly approves enabling production acceptance. Only then manually set the private boolean/environment to true. No activation was performed by Codex. Start with a specifically approved real order and monitor it; do not create arbitrary production fixtures.

## Rollback

First set the private acceptance flag false (operator action) to stop new orders. Preserve all orders, inventory movements, notes and events. Restore the previous frontend index/assets/root .htaccess if necessary. Before any real orders exist, restoring backed-up bootstrap/app.php first and load.php second removes the new routes; new class files and additive SQL columns can remain unused. Do not drop columns/tables, restore an old database over new orders, or reset inventory. If real orders exist, prefer stopping acceptance and fixing forward so operations/history remain available; plan any backend rollback around those orders. Preserve config.php, API .htaccess, sessions and media throughout.

## Rebuild locally

```powershell
Set-Location 'D:/Virasat Organics/virasat-organics-v2'
npm run build
node scripts/check-commerce.mjs
node scripts/check-production-deployment.mjs
& 'C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' scripts/package-phase7d.py
```

Regenerate the inventory in this guide if rebuilding changes asset hashes. Upload is manual only.

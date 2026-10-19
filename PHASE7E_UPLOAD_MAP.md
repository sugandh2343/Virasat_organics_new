# Phase 7E manual upload map — gateway disabled

Prepared 2026-10-19. No upload, production mutation or merchant API request was performed. Owner reports Phase 7D files uploaded; production acceptance remains pending.

## Packages

- Backend: `D:/Virasat Organics/virasat-organics-v2/backend/deployment/phase7e-razorpay-incremental.zip`
- Frontend: `D:/Virasat Organics/virasat-organics-v2/deployment/virasat-frontend-phase7e.zip` (contents of dist, no wrapper folder).
- Checksums/file inventory: `D:/Virasat Organics/virasat-organics-v2/deployment/phase7e-checksums.json`.
- SQL separately: `D:/Virasat Organics/virasat-organics-v2/backend/database/migrations/005_razorpay_ready.sql`.

Neither ZIP contains private config.php, environment files, private logs, credentials, uploaded media, SQL, tests or developer scripts.

## Prerequisites and database

1. Keep Razorpay disabled. Do not change ORDER_ACCEPTANCE_ENABLED as part of this phase.
2. Privately back up the database and all files marked REPLACE below. Keep existing frontend index.html, root .htaccess and hashed assets for rollback.
3. Confirm migrations 001–004 are present on the intended V2 database. Health/readiness alone does not prove 004 or 005.
4. First test 005 against a disposable hosted database with the current schema. No local MySQL service is needed. This implementation has not executed MySQL DDL.
5. In Hostinger phpMyAdmin, select the V2 database and import 005 once. It adds payments.verified_at/failure_code, makes unused payment_events.payload_encrypted nullable, and adds a durable razorpay_order_requests table with order/customer/payment FKs and unique request/order constraints. Existing payment/event uniqueness is preserved. It inserts no business records and enables nothing.
6. Verify with `SHOW COLUMNS FROM payments;`, `SHOW COLUMNS FROM payment_events;`, and `SHOW CREATE TABLE razorpay_order_requests;`. MySQL DDL is not transactionally rollbackable. If import partially fails, inspect actual columns/table before resuming; do not blindly rerun ALTER statements.

## Every changed runtime PHP file, in upload order

ZIP paths start at the private backend root. Upload files individually in this order; bootstrap/app.php LAST.

| Order | Exact local source | Exact Hostinger destination | Action | Backup |
|---|---|---|---|---|
| 1 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/RazorpayProvider.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/RazorpayProvider.php` | CREATE | If already present, stop and compare; back up before replacement |
| 2 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/RazorpayPayments.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/RazorpayPayments.php` | CREATE | If already present, stop and compare; back up before replacement |
| 3 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Controllers/PaymentController.php` | `domains/virasatorganics.com/private/virasat-backend/app/Controllers/PaymentController.php` | CREATE | If already present, stop and compare; back up before replacement |
| 4 | `D:/Virasat Organics/virasat-organics-v2/backend/config/payments.example.php` | `domains/virasatorganics.com/private/virasat-backend/config/payments.example.php` | CREATE | If already present, stop and compare; back up before replacement |
| 5 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/CommerceService.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/CommerceService.php` | REPLACE | Download existing file to private backup first |
| 6 | `D:/Virasat Organics/virasat-organics-v2/backend/bootstrap/load.php` | `domains/virasatorganics.com/private/virasat-backend/bootstrap/load.php` | REPLACE | Download existing file to private backup first |
| 7 | `D:/Virasat Organics/virasat-organics-v2/backend/bootstrap/app.php` | `domains/virasatorganics.com/private/virasat-backend/bootstrap/app.php` | REPLACE | Download existing file to private backup first |

`payments.example.php` is reference only, not automatically loaded. Do not rename it to config.php. No public_html/api file needs replacement. The offline test `backend/tests/payments.php` is local only and must not be uploaded.

## Private configuration (optional now; default is already off)

Inside the EXISTING returned array in `domains/virasatorganics.com/private/virasat-backend/config/config.php`, a future operator may merge this entry. Preserve every database, Firebase, session and commerce value:

```php
'payments' => [
    'razorpay' => [
        'enabled' => false,
        'key_id' => '',
        'key_secret' => '',
        'webhook_secret' => '',
    ],
],
```

No config.local.php. Private keys may alternatively come from RAZORPAY_ENABLED, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET environment variables. Only the exact environment string `true` enables; private PHP boolean false overrides environment. Explicit empty private values override environment too. All three values must be configured before the provider is ready. Never set VITE_RAZORPAY_KEY_SECRET or publish secrets in settings. Do not activate with placeholder values.

## Frontend

Extract the CONTENTS of the frontend ZIP into `domains/virasatorganics.com/public_html/`. Upload new hashed assets first and index.html last. The manifest lists every exact filename. Preserve existing assets until rollback is no longer needed. Compare/merge root .htaccess with existing Hostinger rules; it excludes /api, PHP entry points and real assets from SPA fallback. Do not alter `public_html/api/`, its .htaccess, private/, uploaded media, or config.php. Do not upload a dist/ wrapper.

Hard-refresh after clearing stale HTML/CDN cache; never cache authenticated API responses. This release keeps the existing checkout visual design and COD choice. It does not load Razorpay's SDK during ordinary browsing or checkout.

## Post-upload smoke checks

- health and ready retain JSON 200; unknown /api path returns API JSON 404, not HTML.
- Homepage, shop, deep-link refresh, customer sign-in/session and admin catalogue still work.
- commerce/status still has COD only and the unchanged private acceptance flag.
- Guest POST payments/razorpay/order and verify: 401. Authenticated mutation without valid CSRF: 403. Authenticated valid-CSRF request with gateway off: controlled 503 PAYMENT_UNAVAILABLE, no payment insert or outbound call.
- POST payments/razorpay/webhook with gateway off: controlled 503 PAYMENT_UNAVAILABLE. Once configured in an isolated test environment, invalid raw-body signature: 400; no DB state mutation.
- Unrelated browser Origin remains denied. No session or CSRF exemptions were added for browser endpoints. Webhook uses provider HMAC and does not open a browser session.
- Existing COD still records pending/created payment, never paid from placement or fulfilment. Do not create a production order merely as a smoke test.

## Rollback

Keep the gateway disabled. Restore old bootstrap/app.php first to stop routing new requests, then old bootstrap/load.php and CommerceService.php. Restore old frontend index.html/assets if necessary. Newly added unused PHP files can remain private. Leave the additive SQL/table in place; never drop payment/event records or restore an old database over new orders. If any gateway activity has occurred in future, reconcile provider payments before rollback. No automated destructive rollback script is provided.

## Deferred activation checklist

Merchant account/approval and legitimate TEST keys/webhook secret; reviewed auto-capture setting; verified HTTPS webhook subscriptions payment.authorized/payment.captured/payment.failed/order.paid; isolated hosted MySQL migration/FK/concurrency tests; durable uncertain-create reconciliation by receipt; online order creation with owned quote + reserved stock, reservation expiry/release/cancellation/refund workflow; explicit frontend enablement after backend acceptance; sandbox success/failure/dismissal/late capture/duplicate/out-of-order events; operator refund handling and monitoring. Currently no storefront path creates online orders, and COD orders are NEVER converted by the payment API. Adding keys alone does not expose a public Razorpay choice. Production activation requires a later owner-approved change and successful tests, not this upload.

# Phase 7E â€” disabled Razorpay infrastructure

2026-10-19. Implemented locally; merchant account and credentials absent. No provider calls, live database changes, upload or commit. Owner reports Phase 7D uploaded, but full COD/customer acceptance remains pending.

## Implementation

`RazorpayProvider` privately resolves configuration, requires explicit enablement and all credentials, uses a fixed HTTPS Razorpay v1 base with TLS verification, no redirects, bounded body/timeouts and sanitized error categories. It creates provider orders from server paise, fetches payments, provides an explicit capture operation for a future reviewed worker, and validates SHA256 HMAC with hash_equals. Auto-capture is the intended merchant configuration; authorized is not paid.

`RazorpayPayments` claims a durable payment request before an outbound create, uses the internal payment ID as receipt, and binds one provider order to an internal order. Creation is owner-scoped, rejects COD, checks placed/pending online order, active matching stock reservations, currency and amount, and requires Idempotency-Key. Network calls occur outside transaction locks. Matching ready retry returns the original provider order. Ambiguous timeout/crash remains uncertain/creating and refuses automatic retry, even with a new key; operator receipt reconciliation is necessary. A provider-created order lost before local persistence is intentionally not guessed or recreated.

Verification binds the server-stored order ID, validates the checkout HMAC, then fetches provider state. A frontend handler never marks paid. Amount, currency and ID binding are checked against immutable server totals. Captured state requires provider captured=true. Payment/order/reservations are locked; active held stock is consumed once with a unique inventory movement. Capture after cancellation/expiry/missing stock becomes refund_pending for operator review, with no invented refund completion or stock deduction. Payment updates do not advance fulfilment.

Webhooks validate the exact raw bytes before JSON/DB, require an event ID, accept the four subscribed event types, fetch current provider state and atomically record processed event + changes. Duplicate event ID/body hash is idempotent; changed body conflicts. Captured/refund states cannot regress on older failure/authorization events. Provider failures remain failed; browser dismissal remains unconfirmed and never changes financial records. Unsupported provider states require reconciliation. No raw webhook payload/PII is retained: payload_encrypted is NULL; body hash, timestamps and safe status metadata remain. Processing failures return non-2xx so the provider retries; there is no asynchronous durable inbox worker in this phase.

`PaymentController` registers POST /api/payments/razorpay/order, /verify and /webhook. Customer endpoints use existing separate secure PHP session, owner verification, CSRF/same-origin guard and rate limit. Webhook uses HMAC instead of CSRF, does not start a session and has a 256 KiB body limit. Existing CORS/TLS checks remain. Disabled provider never calls transport; no key is exposed until enabled, configured and a valid provider order exists.

`CommerceService` retains COD logic and adds a guard rejecting online orders from the COD fulfilment/cancellation path. This prevents inappropriate restock of merely reserved stock. No private config is changed. Current quote/order creation still accepts COD only.

Frontend `paymentProvider.js` supplies create/verify adapters with existing authenticated CSRF transport and an on-demand Checkout loader. SDK loading requires explicit enabled response + valid key/order/INR/paise. Existing checkout consumes its disabled notice only; active choices remain COD. Dismissal/failure does not claim paid. No localStorage credential/payment-success shortcut exists.

## Configuration and migration

Use the exact nested `payments.razorpay` entry in PHASE7E_UPLOAD_MAP.md inside existing private config.php; default false. Equivalent environment variables: RAZORPAY_ENABLED, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET. No Vite secrets/public settings keys. Migration 005 is additive/manual after 004; preserves existing records/constraints, adds verification/failure fields and unique durable request table. Ready does not certify this migration.

## Files

New runtime PHP: Services/RazorpayProvider.php, Services/RazorpayPayments.php, Controllers/PaymentController.php, config/payments.example.php. Changed runtime PHP: Services/CommerceService.php, bootstrap/load.php, bootstrap/app.php. New SQL: database/migrations/005_razorpay_ready.sql. New frontend service: src/services/paymentProvider.js; existing LiveCommerce.jsx imports disabled notice. New tests: backend/tests/payments.php, scripts/check-payments.mjs. Packaging: scripts/package-phase7e.py. Generated packages/checksums and this report/upload map are deliverables. Exact runtime source/destination mapping is in PHASE7E_UPLOAD_MAP.md.

## Validation

- Production build PASS: 1,756 modules, main chunk 495.13 kB, no chunk-size warning.
- All 30 frontend check scripts invoked: 28 PASS, 2 opt-in scripts SKIP (check-browser-protocol and check-live-admin-anonymous). Explicit mock mode for existing fixture tests; API-specific tests inject synthetic transport.
- PHP lint PASS across app/bootstrap/tests plus new reference configuration. Existing suites: foundation 36, configuration 13, catalogue 40, dispatch 17, customer 53, commerce 83; payment suite 54. Total 296 passing offline assertions.
- Payment tests cover disabled/missing credentials without outbound calls, exact boolean enablement, checkout/raw-body signatures and tampering, owner isolation, COD rejection/unpaid preservation, create idempotency/key conflicts, amount mismatch, authorized vs captured, duplicate/out-of-order events, nullable payload retention, failed payment, cancelled-order late capture/refund review, timeout uncertainty/no blind retry, expired reservation, synthetic post-stock capture failure rollback, online cancellation guard, guest 401, missing CSRF 403 and disabled webhook 503.
- Frontend tests cover COD-only choices, no SDK load while disabled/unconfigured, valid provider order checks, cookie/CSRF/stable key transport, payload allowlists and unavailable error propagation.
- Package file inventory, SHA-256, archive CRC and archived-content/source comparison verified by package-phase7e.py.
- No actual Razorpay, hosted MySQL, browser payment, sandbox merchant or production payment tests performed. No real orders created.

## Known limits and activation gates

This is real, offline-tested payment infrastructure, not an activated online checkout. Current orders are COD only. Online quote/placement/reservation-expiry/refund/cancellation orchestration is deliberately not exposed; online fulfilment remains blocked. A staged online order with valid held reservations can exercise the provider service in isolated tests, but operators must not manually convert live COD orders or insert fake production orders to bypass the gate.

No legitimate merchant account, test/live keys, webhook registration or provider E2E exists. Actual hosted MySQL migration, FKs, simultaneous webhook/verify processing and network reconciliation require isolated acceptance. SQLite exercises service transactions and uniqueness but cannot prove InnoDB behavior. No automatic receipt reconciliation worker, automatic refund, dispute handling, secret-rotation overlap or capture scheduler is shipped. Ambiguous creation/late capture require private operator review; failed attempts do not release reservations automatically. These workflows must be completed and tested before any public activation. Keep RAZORPAY_ENABLED=false and leave COD/order acceptance settings unchanged.

## Provider references checked

Signature uses server order ID + pipe + payment ID; webhook HMAC uses raw body and webhook secret; event header identifies duplicates. Provider status is fetched before confirming payment. References: [Razorpay integration](https://razorpay.com/docs/server-integration/python/test-app/), [official webhook validation](https://github.com/razorpay/markdown-docs/blob/master/webhooks/validate-test.md), [official webhook best practices](https://github.com/razorpay/markdown-docs/blob/master/webhooks/best-practices.md). No claim of merchant/provider live acceptance is made.

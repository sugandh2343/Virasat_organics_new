# Backend roadmap and Hostinger plan — Phase 6.2

Planning only. Phase7 has NOT started. Preserve V2 components/layouts; execute milestones only under subsequent user instructions. Do not touch D:/Virasat Organics/website. Contracts: API_CONTRACTS.md; schema: DATABASE_BLUEPRINT.md; adapters: MOCK_TO_API_MATRIX.md.

## Milestones and acceptance gates

Environment names below are proposed private runtime configuration, not populated values. None is required for current npm run dev/build. Never prefix secrets VITE_. Only deliberately public Firebase client configuration and Razorpay key ID may enter frontend builds.

### 7A — PHP foundation + migrations

Scope: private PHP8+ project, Composer lock, PDO, router/error envelope, session+CSRF, admin login/RBAC gate, migration/version runner, immutable core seeds and secure CLI bootstrap. Do not expose catalogue mutation before admin checks exist.
Depends: approved contracts; exact Hostinger PHP/MySQL/CLI/cron capabilities and isolated staging DB.
Private variables: APP_ENV, APP_URL, APP_KEY, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, SESSION_NAME, SESSION_IDLE_SECONDS, SESSION_ABSOLUTE_SECONDS, PRIVATE_STORAGE_PATH, LOG_PATH. Migration credentials separate and absent from runtime.
Acceptance: repeatable empty install/rerun, seed exactly five unpriced Coming Soon packs, no default admin credential; structured errors, HTTPS cookie/CSRF, permissions deny by default; demo bypass absent in production.
Tests: migrations partial-failure/recovery, DB constraints, CSRF/fixation/logout, disabled admin, unauthorized scopes, rate limits, SQL injection, secret-file denial, build/19 frontend regressions.
Blockers: hosting plan/version/access not provided; operator admin identity/password not provided (bootstrap later, never write credentials to docs); visual QA unresolved.

### 7B — Catalogue, media, CMS and admin APIs

Scope: public read adapters; product/category/status/inventory administration, safe media, homepage/banner/story/blog/policy/settings endpoints and dashboard reads. Maintain existing route/layout and primary media order. Duplicate product is new independent product, never variant.
Depends:7A authorization/schema; verified media upload constraints.
Variables: MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, MEDIA_PRIVATE_PATH, MEDIA_PUBLIC_BASE_URL, UPLOAD_QUARANTINE_PATH; no credentials in settings tables.
Acceptance: shared API changes reach storefront; inactive direct lookup404; null prices/stock stay unknown; CMS drafts invisible; reference-protected media delete; stale version409; categories update header/footer.
Tests: all four statuses, SKU/slug collisions, concurrent adjustments, safe blocks/URLs, upload MIME spoofing/path traversal/oversize, interrupted upload cleanup, conditional GSTIN/FSSAI; original frontend regression suite plus API integration tests.
Blockers: approved business/media/legal inputs remain missing; do not fabricate them or publish draft bodies. Hosting may not support100MB uploads or server video processing; choose explicit reduced cap/approved external storage before enabling.

### 7C — Firebase customer identity, profiles, addresses, wishlist

Scope: replace OTP format preview with authorized Firebase phone flow, verify ID tokens in PHP and issue owned server sessions; profile/address/default/wishlist endpoints and adapter wiring. Existing unverified demo mode must not authorize real APIs.
Depends:7A; Firebase project/provider, allowed domains, SMS quota/billing and privacy/consent decisions.
Private variables: FIREBASE_PROJECT_ID, FIREBASE_CREDENTIALS_PATH (private service-account file if chosen verifier/revocation API needs it), FIREBASE_CERT_CACHE_PATH. Public build values: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID (public config, not admin secrets).
Acceptance: only verified provider token opens customer session; wrong project/revoked token fails; default address ownership enforced; account switch/logout clears personal cache; anonymous cart remains local intent.
Tests: token expiry/signature/issuer/audience/revocation, CSRF, login/logout race, address IDOR, phone mutation rejection, wishlist merge/replay, Firebase test numbers before real SMS.
Blockers: Firebase account/configuration, authorized domains, actual provider access and SMS budget not supplied. No Firebase integration tested in6.2.

### 7D — Delivery, checkout, COD and inventory

Scope: authoritative zone/PIN checks, quotes, tax/shipping validation, atomic COD orders/items/history, admin customer/order views, cancellation and current-catalogue reorder. Shared server order source replaces nested demo session ledger.
Depends:7B+7C; reviewed price/stock, delivery fees, tax, minimum order and COD business rules.
Variables: QUOTE_TTL_SECONDS (proposed600), ORDER_IDEMPOTENCY_RETENTION_HOURS (minimum24), inventory/transaction retry limits. Business rules stored validated/versioned in DB, not hardcoded environment prices.
Acceptance: no order without owned valid address/configured totals; two buyers cannot oversell last item; duplicate timeout retry returns same order; cancelled eligible COD order restores once; immutable snapshots and permission-separated notes; public seed products still coming_soon until explicitly configured.
Tests: concurrent checkout and admin stock/status change, expired/stale quote, transactional crash rollback, same-key altered payload, missing tax/fee, foreign order, cancellation races, clear cart only after confirmed response.
Blockers: reviewed commerce rules and authentic product prices/stock unavailable. Tax calculation policy requires business/legal input; no rates invented.

### 7E — Razorpay and payment lifecycle/tracking

Scope: server provider order creation, signed callback verification, durable webhook inbox/reconciliation, online stock reservations/expiry and payment status separate from existing fulfilment tracking. No carrier tracking API or fabricated dispatch ETA. Cancellation refund lifecycle must be explicit, not silent success.
Depends:7D plus approved Razorpay account/test mode, HTTPS staging webhook, cron reliability and refund policy.
Variables: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, RAZORPAY_PREVIOUS_WEBHOOK_SECRET (rotation only), PAYMENT_MODE, RESERVATION_TTL_SECONDS (proposed900), private CRON_AUTH_TOKEN only if CLI cron impossible.
Acceptance: server-generated amounts, wrong signatures rejected, paid only after captured state verified, duplicate/out-of-order events safe, expired reservation/late capture handled without oversell or false refund claim; provider reconciliation after timeout.
Tests: sandbox success/failure/authorized-not-captured, mismatched order/amount, repeated webhook, callback-before/after-webhook, delayed capture after cancellation, timeout at each boundary, refund pending/failure, cron retry.
Blockers: merchant credentials, webhook registration, live enablement approval, cron capabilities, approved refund decisions. Current Online Payment remains disabled. No payment tested in6.2.

### 7F — Full testing, migration and deployment preparation

Scope: integration/security/accessibility/performance suite; real media/content acceptance; staged Hostinger package, migration rehearsal/backups/rollback and documented release checklist. Actual deployment still requires explicit instruction.
Depends:7A–7E passing; business data approval; browser access/manual acceptance.
Variables: final APP_URL, environment-specific private paths/DB credentials/provider mode; CSP_ALLOWED_ORIGINS explicitly limited to approved services; monitoring/error destination and backup path according to host.
Acceptance: all current frontend tests plus API concurrency/auth/webhook tests, responsive eight-width acceptance, deep-link refresh and API404 separation, no secrets in dist, no dev fixtures, restore rehearsal, reconciled inventory/payment state; approved launch inputs.
Tests: clean install and upgrade, data migration without demos, load/limits, upload serving, CSP/fonts/media, accessibility and 320/375/390/430/768/1024/1280/1440 layouts, production history fallback, backup restoration, session expiry.
Blockers: browser QA, hosting access, approved content, payment/go-live authorization. Do not call preparation a deployment.

## Hosting topology and deployment procedure

Proposed domain-home layout (verify actual Hostinger filesystem and permission restrictions):

    domain-home/
      private/virasat-backend/   PHP app, vendor, migrations, private config
      private/var/               sessions, logs, quarantine, original uploads, backups
      public_html/
        index.html              Vite production output
        assets/                 hashed JS/CSS, approved public media only
        api/index.php           thin bootstrap requiring private app
        .htaccess               routing/security configuration

No production Node process. Build React locally/CI and upload dist contents; PHP handles API requests and cron; MySQL is accessed by PHP only. Compile/vendor dependencies outside web runtime where Composer/SSH unavailable, matching host PHP/extensions. Verify PDO MySQL, openssl, curl, mbstring, fileinfo, image support, outbound HTTPS, upload/post limits, disk quotas, cron and MySQL8 support. Do not assume hosting SKU supports every capability.

Original uploads remain private, derivative/public assets served only after validation with execution disabled. If outside-public storage is unavailable, stop and design tested deny-all protected directories with host support; do not place secrets in public_html casually. Use private PHP config loaded by absolute path where environment injection is unavailable. Set restrictive filesystem permissions, disable directory listings/debug display, redact logs. Backups private and encrypted where practical.

Proposed Apache-compatible public_html/.htaccess (documentation only; test on actual Hostinger server):

    Options -Indexes
    RewriteEngine On
    RewriteRule ^api(?:/.*)?$ api/index.php [END,QSA]
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [END]
    RewriteRule ^assets(?:/.*)?$ - [R=404,END]
    RewriteRule ^ index.html [END]

API rule precedes SPA fallback and includes unknown API paths: PHP must return JSON404/405, never index.html. END requires compatible rewrite implementation; confirm Hostinger support before use, otherwise use tested exclusion/L rules to avoid loops. Base-path hosting requires adjusted Vite base and router basename; root-domain proposed here. Missing assets404 instead of HTML. HTTPS redirect preferably host setting after TLS configured; ensure proxy/HTTPS detection does not loop. Auth/API responses no-store, index.html revalidate, hashed assets immutable. Restrict PHP execution to API bootstrap; do not enable PHP in upload directories.

Hostinger documentation locates site-wide .htaccess in public_html: [Hostinger .htaccess guide](https://www.hostinger.com/support/1583307-how-to-create-an-htaccess-file-at-hostinger/). This proposed topology/rewrite was not deployed or tested against the user's account.

Deployment sequence for later approval: snapshot DB/files → maintenance window for incompatible migration → private backend/vendor/config upload → controlled CLI migration → versioned frontend assets/index switch → smoke deep links/API/session/upload/webhook → restore service. Retain previous assets through cache lifetime. Roll back frontend/backend only if DB schema compatible; destructive schema rollback uses tested backup restoration with an order/payment reconciliation plan, never blindly restore over new live orders. Cron processes bounded inbox/reservation batches with lock, retries and observable failures. No long-running Node queue assumed.

## Current validation and manual acceptance

6.2 changes documentation only. Run npm run build and all19 scripts/check-*.mjs; results recorded in PHASE6_DESIGN_FREEZE.md. PHP/MySQL/Firebase/Razorpay, rewrites, migrations and transactions are NOT TESTED.

Browser visual QA remains BLOCKED; do not mark design visually approved. At all eight widths inspect homepage/shop/detail/cart/wishlist/login/account/addresses/checkout/orders/admin tables/editors/settings. Check overflow, images, text/buttons, sticky header, drawers/dialogs, tab/Escape/focus restoration, errors and status messages. Repeat nine connected workflows from PHASE6_FULL_AUDIT.md. Existing code baseline is frozen; changes needed to fix verified accessibility/responsiveness defects remain allowed with regression evidence.

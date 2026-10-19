# Phase 7A — Hostinger PHP/MySQL foundation

Implemented in the existing V2 project. No deployment, remote API request, database connection, local PHP server, local MySQL server, XAMPP service, Docker or production Node backend was used. The existing installed PHP CLI executable was used with -n only for lint and isolated CLI tests; XAMPP installation/services are not required. The storefront and admin remain mock-backed.

## Delivered structure

backend/app/Controllers/SystemController.php: real GET health and readiness handlers.
backend/app/Helpers/Http.php: request validation, router, JSON responses and typed errors.
backend/app/Middleware/Security.php: exact CORS, private secure PHP sessions, CSRF guard and DB-backed admin permission guard.
backend/app/Repositories/Database.php: PDO with native prepares, UTF-8, UTC and strict SQL.
backend/app/Services/: private configuration, migration/readiness verification and quarantined upload inspection policy.
backend/bootstrap/: private loader/request dispatch.
backend/config/config.example.php: blank private DB configuration template.
backend/database/migrations/001_tables.sql: 41 InnoDB/utf8mb4 tables.
backend/database/migrations/002_foreign_keys.sql: 59 indexed, restrictive foreign keys; cyclic references added after table creation.
backend/database/seeds/003_core_catalogue.sql: two categories and five independent Coming Soon products, null prices/on_hand, zero reserved. No customer/admin/order/payment/company-credential seeds.
backend/database/manifest.json: immutable SQL SHA-256 checksums and expected schema.
backend/database/manual/: structural verification and guarded migration recording for phpMyAdmin.
backend/bin/migrate.php: optional CLI-only runner; not an HTTP endpoint.
backend/tests/: database-free helpers and isolated real-bootstrap dispatch tests.
backend/deployment/public_html/api/: minimal index.php and API-local .htaccess.
backend/storage/: empty private session/log/quarantine directories.

Generated upload folder: backend/deployment/upload/
Generated archive: backend/deployment/virasat-backend-upload.zip
Packaging script: scripts/package-backend.py; only allowlisted files are copied, never config.php/migration.php, sessions/logs/uploads or credentials. The package has its own checksum inventory.

Frontend additions: src/services/apiClient.js and .env.example; vite.config.js gains an opt-in remote development proxy. No existing service imports the API client. Normal npm run dev remains unchanged; build output remains the same storefront bundle.

## Complete upload map — owner action later

Do NOT upload the entire project or backend root into public_html. Do NOT overwrite an existing website or database. Confirm domain/document root and use a dedicated V2 database; existing old website remains untouched.

| Local package path | Remote destination |
| --- | --- |
| upload/public_html/api/index.php and .htaccess | domain's public_html/api/ only |
| upload/private/virasat-backend/app, bootstrap, config, database, bin, storage, .htaccess | domain-home/private/virasat-backend/ outside public_html |
| upload/PHASE7A_HOSTINGER_BACKEND.md, PACKAGE_SHA256.json | operator records; not publicly served |

The entry point resolves dirname(__DIR__,2) + /private/virasat-backend/bootstrap/app.php. For public_html/api this is the parent of public_html. Confirm the actual Hostinger directory tree in File Manager; adjust ONLY this private path if necessary. Do not use a URL include. If hosting permissions prohibit a private sibling directory, stop and confirm a secure host-supported layout before uploading secrets. Private .htaccess denies accidental direct web access as defense in depth, not permission to put secrets publicly.

No frontend upload is needed for this phase: React stays on the owner's computer via npm run dev. Do not replace a site's root index or root .htaccess with this package. If an existing SPA catchall intercepts /api, the owner must merge an API exclusion before that catchall, after reviewing the current hosting configuration:

    RewriteRule ^api(?:/|$) - [L]

Then the API directory's supplied .htaccess handles /api/health, /api/ready and unknown API paths. Hostinger rewrite/Options support is still unverified. If Options -Indexes is disallowed, remove only that directive after checking the private hosting error log and disable indexing using the hosting control panel. Never route unknown APIs to SPA HTML.

## Private configuration and MySQL setup

Use a supported maintained PHP8 release on Hostinger (code linted with existing CLI8.0.30; host runtime not tested). Required extensions: PDO + pdo_mysql, JSON, session; fileinfo/image inspection for future uploads. MySQL8.0.16+ or MariaDB10.11+ is supported by the migration/readiness verifier. Hostinger documents MariaDB for shared Web/Cloud plans, so this phase adds an explicit compatibility branch rather than assuming Oracle MySQL. The same MySQL8-compatible DDL uses MariaDB JSON aliases with JSON_VALID checks, verifies CHECK enforcement and handles different information_schema metadata. Confirm the actual host DB version before migration. SQL execution on either engine remains BLOCKED. [Hostinger database platform](https://www.hostinger.com/support/1583226-which-database-management-system-is-used-at-hostinger/), [MariaDB JSON alias](https://mariadb.com/docs/server/reference/data-types/string-data-types/json).

In hPanel create a NEW dedicated MySQL database/user for V2. Owner supplies exact host/name/user/password privately. Copy private config/config.example.php to private config/config.php and fill db keys; do not email/paste credentials into frontend code or repository files. config.example.php intentionally has blank credentials.

Production configuration:

    environment = production
    require_https = true
    app_origin = https://virasatorganics.com
    cors_origins = [https://virasatorganics.com]
    cors_credentials = false
    trusted_proxies = []

Use exact trusted proxy IPs only if Hostinger confirms the request passes through a trusted proxy and native HTTPS is not set. Arbitrary X-Forwarded-Proto is ignored. API rejects insecure requests with JSON400 rather than redirecting credential-bearing bodies. Enable HTTPS/TLS at host level. Session cookies remain Secure, HttpOnly, Path=/, SameSite=Lax and no Domain; health/readiness do not set them.

Ensure private storage/sessions and quarantine directories exist and are writable only by the PHP owner. Application code/config should not be writable by public visitors. Do not use world-writable777. Protect logs through private PHP/host logging settings.

Runtime DB account: SELECT only is sufficient for7A /ready (including information_schema visibility). Migration account additionally needs CREATE/ALTER/INDEX/REFERENCES/INSERT and CREATE TEMPORARY TABLES for the verification workflow. Do not grant FILE, global administration or DROP to runtime. Hostinger may provide a single scoped account: document that limitation and do not expose future mutations until permissions are reviewed.

## No-SSH phpMyAdmin migration procedure

All files are actual executable MySQL SQL; no public migration/reset URL exists. Back up and select the dedicated V2 database explicitly. Do not use an old website database. Do not edit released SQL files after application; create a new version later.

1. Open Hostinger phpMyAdmin privately. Run SELECT VERSION(), DATABASE(); require MySQL8.0.16+ or MariaDB10.11+, correct new DB.
2. Import database/migrations/001_tables.sql. Require zero errors. This creates tables and tracking table but does NOT falsely mark success.
3. Import database/migrations/002_foreign_keys.sql. Require zero errors. Prepared ALTER statements skip existing named FKs on retries; structural verification checks their target/column.
4. Import database/seeds/003_core_catalogue.sql. Require zero errors. It uses a transaction and inserts missing stable IDs only, never overwrites edited products. If an error occurs, ROLLBACK in that same connection where possible; do not continue. Idempotent retry recovers missing seeds after diagnosis.
5. Import database/manual/verify_schema.sql as one batch. It uses a temporary issues table and checks table engine/collation, columns/types/nullability, indexes, enforced CHECK names, FK targets, core product IDs and conflicting tracked checksums. Require the issues result to be empty, verification PASS and ZERO SQL errors. Inspect the initial five products: coming_soon, price_paise and compare_at_price_paise NULL; inventory on_hand NULL and reserved0. No fabricated stock.
6. Only then import database/manual/record_verified_migrations.sql. It repeats verification in its own connection; inserts tracking rows ONLY when no structural issues exist. Require zero errors and exactly the three expected versions/checksums. Existing different checksum is a failure, not automatically updated.
7. Save the private phpMyAdmin import logs, manifest.json and backup as the migration record. Remove SQL downloads from public locations. Verify /api/ready after configuring the private runtime account.

DDL auto-commits in MySQL. A failed migration is NOT rolled back as a whole. CREATE TABLE IF NOT EXISTS and conditional FK ALTER support retry; structural verification rejects missing/wrong columns/indexes/types, not all conceivable semantic changes. CHECK expressions/default values still require review against immutable SQL if an existing DB was hand-edited; do not treat matching constraint names as proof of identical logic. Never mark migration success after any SQL error. The manual workflow assumes one operator/maintenance window; do not run simultaneous imports or CLI migration. Do not blindly rerun the generator against an already deployed release.

Optional SSH/CLI if available later:

    php backend/bin/migrate.php --apply
    php backend/bin/migrate.php --verify

Run at the private backend location with adjusted path. Runner verifies checksums, takes a DB advisory lock, checks schema and records only completed versions. Optional private config/migration.php can hold a separate migration account. Not required: XAMPP, local MySQL, local PHP web server, SSH or Composer. No application dependencies beyond PHP extensions are required.

## Endpoint behavior and verification after upload

GET https://virasatorganics.com/api/health →200 JSON data.status=ok if private bootstrap/config and HTTPS are valid; does not connect to DB.
GET https://virasatorganics.com/api/ready →200 JSON data.status=ready only with reachable supported DB, all tracked checksums, expected tables/constraints/indexes and five core IDs.
Unconfigured/broken/pending DB →503 generic SERVICE_UNAVAILABLE, never fake ready.
Unknown path →404 JSON NOT_FOUND; POST /api/health →405 with Allow header.
OPTIONS on a known route supports configured origin/method/headers; unknown route404 and unsupported requested method405.
No GET /api/products, auth, orders, checkout, payments or admin CRUD endpoint is implemented. They return404. No fake commerce response.

All JSON errors carry a generated request ID when the application/entry catch handles them. PHP engine/host failures may still produce hosting-level errors; inspect private logs. Responses are no-store, nosniff, no stack/SQL/password values. Production never displays PHP diagnostics, including development-CORS mode. CLI tests provide local detailed assertion failures; production logging records request ID and exception class only. Enable private host error logging, not browser debug output.

Troubleshooting:
- 503 health: private path/config/permissions or missing PHP file; correlate request ID with private logs.
- 400 HTTPS_REQUIRED behind host proxy: confirm native HTTPS/trusted proxy configuration; never trust all forwarded headers.
- 503 ready: host DB name/user grants/version, migration records/checksums or schema drift. Use phpMyAdmin verification; do not expose PDO exceptions publicly.
- HTML404/200 instead of JSON: root SPA rewrite intercepted API or API .htaccess not applied.
- PHP500 before JSON: host PHP version/extensions/Options permission; inspect hosting logs without publishing configuration.
- CORS failure: exact scheme/host/port mismatch or development origins not enabled. Do not add wildcard.

## Development CORS and frontend API setup

Copy .env.example to .env.local (already ignored by *.local):

    VITE_API_BASE_URL=https://virasatorganics.com/api

This is a public address, NOT a secret. Existing storefront still uses local services. The API client defaults credentials=omit, does not auto-retry mutations and exposes typed errors, validation fields, request IDs, AbortSignal/timeout and idempotency/version headers. Future code must explicitly import it and select appropriate credential mode. It rejects arbitrary absolute request URLs; no credentials are stored in Vite variables.

Direct local-origin calls require a REMOTE DEVELOPMENT configuration: environment=development with only the needed entries selected from:
- http://localhost:5173
- http://localhost:5174
- http://127.0.0.1:5173
- http://127.0.0.1:5174
- https://virasatorganics.com (production origin)

Production environment validation refuses localhost entries. CORS is not authentication; nonbrowser clients can omit Origin. Future authenticated endpoints must always use session+CSRF+permission/ownership checks. cors_credentials stays false for health/ready. Do not enable arbitrary origins or reflect Origin automatically.

Preferred optional dev proxy (PHP still runs REMOTELY):

    VITE_API_BASE_URL=/api
    API_PROXY_ENABLED=true
    API_PROXY_TARGET=https://virasatorganics.com

Restart npm run dev. Vite proxies /api to the fixed HTTPS host with TLS verification enabled, changes Host and sets the upstream Origin to that configured application origin. No remote requests happen merely by enabling it; only requests made to /api are forwarded. Bind Vite to loopback, not public --host; this is a trusted development proxy, not a production server or public CORS relay. Target changes require explicit code review. Do not set server.allowedHosts=true.

Authenticated browser work is NOT implemented/tested here. Direct HTTP localhost→remote HTTPS is cross-site and SameSite=Lax cookies will not accompany fetch; SameSite=None does not defeat third-party cookie blocking. For future sessions use a same-origin hosted staging frontend, or locally trusted HTTPS Vite + /api proxy so Secure host-only cookies remain browser-compatible. The proxy deliberately does not strip Secure/HttpOnly/SameSite or rewrite cookie domains. Plain HTTP Vite is sufficient for public health/ready only; do not claim authenticated cookie support across every browser. Later auth must get its real CSRF token and opt into same-origin credentials. No session bypass added.

Official references: [Vite server proxy](https://vite.dev/config/server-options), [MySQL foreign keys](https://dev.mysql.com/doc/refman/8.0/en/create-table-foreign-keys.html), [PHP session settings](https://www.php.net/manual/en/session.security.ini.php). Actual Hostinger account capabilities remain unverified.

## Security boundaries and next work

The latest7A request explicitly defers full authentication, CRUD, checkout and Razorpay, narrowing the broader7A roadmap. AdminAuthorization re-queries active admin permissions from DB, but NO login/session-establishment endpoint or admin account exists. Existing static admin UI is still unsecured and disconnected. Do not equate middleware scaffolding with completed auth.

CSRF framework requires an active server session, exact same application Origin and constant-time token match; future mutation routes must call it. Session expiration/strict cookies are implemented; login rotation/revocation provider workflow belongs to authentication phase. Sessions currently use private PHP file storage; php_sessions schema is prepared for later database session handler, not secretly active. No sensitive PII enters new persistence from frontend.

UploadPolicy only inspects uploaded-file provenance/MIME/size and decodable images, returns a random quarantine name; it neither accepts/publishes files nor claims malware scanning. No upload route exists.7B must add authorization, CSRF, resource limits, safe re-encoding/scanning and nonexecutable serving. Payment/idempotency/order tables are structural only; transaction workflows in DATABASE_BLUEPRINT remain unimplemented. Rate-limit tables exist, but request throttling and abuse controls must be wired before auth/public expensive operations launch; consider host-level limits for readiness.

Seed scope intentionally only products/categories/inventory. Homepage/CMS/settings/admin/customer/order/payment tables are empty; no business facts or identities invented. SKU values retain DEMO prefix until owner supplies actual SKUs. No product_variants table. All financial columns are integer paise, nullable where unknown, with safe-integer checks.

## Tests and deployment acceptance

Local results: npm run build PASS (1,730 modules, 3.33s; no warnings; unchanged main bundle478.20kB). All20 check scripts PASS, including all19 existing regressions and the new backend/API-client suite. PHP lint passes for14 source PHP files. Database-free PHP tests:36 assertions plus7 actual-bootstrap CLI dispatch cases. Vite startup PASS on temporary port5186, HTTP200; that temporary server was stopped. Existing preview http://127.0.0.1:5174/ also returned HTTP200. Package ZIP integrity and allowlisted file hashes verified. None of these results constitutes remote HTTP or database execution. Remote MySQL migrations/transactions/constraints, actual HTTPS response headers/rewrite behavior, Hostinger grants, cookie behavior and remote API integration: BLOCKED until authorized upload/configuration. Browser visual QA remains the earlier BLOCKED status; no design changes made.

Owner deployment checklist:
- Confirm new V2 database/domain paths, PHP/extensions/MySQL version, private writable storage.
- Upload only mapped files, configure private credentials, import/verify/record migrations with zero errors.
- Health200; ready200; unknown404; unsupported405; HTTP rejected; no error details exposed.
- Allowed-origin preflight works; attacker/null/incorrect-port Origin rejected; no wildcard credentials.
- Check direct deep API routes, root SPA exclusions, private files/logs/SQL denied over HTTP.
- Confirm five Coming Soon records with NULL prices/stock and no extra customer/order/admin seeds.
- Verify supported authenticated staging/proxy setup later before real login; do not enable live commerce now.
- Retain backup/import logs/checksums, then plan7B only after remote foundation passes.

Changed files: backend/** (including generated upload package), scripts/build-backend-schema.py, scripts/package-backend.py, scripts/check-backend-foundation.mjs, src/services/apiClient.js, vite.config.js, .env.example and this document; dist regenerated. No dependencies added. The old website was not touched. Nothing was deployed or committed.

# Phase 7B catalogue implementation
18 October 2026. Implemented locally; not deployed or committed.
Existing Hostinger health/ready success is owner-reported. No remote mutation,
login or database integration test has been performed by Codex.

## Implemented
Public product/category listing and detail, normalized token search, category and
status/availability filters, allowlisted sorts, paginated products, related
products and ordered image/video projections. Inactive and unknown statuses are
not public; explicit zero prices remain valid, unknown price/stock stay null.
Five original independent seeds and all immutable migrations are unchanged.

Admin login/session/logout with password hashes, Secure/HttpOnly/SameSite cookies,
session rotation, CSRF, DB-backed catalogue.write permission and IP/account
rate-limited login. Initial admin uses private offline SQL generation, never a
public bootstrap endpoint or default account.

Product/category CRUD, archive, independent inactive duplicate, SKU/slug database
uniqueness, If-Match version checks, reference-protected deletion and safe audit
events. Product mutations replace ordered association lists transactionally.
Stock set/adjust requires reasons, locks product then inventory, honors reserved
quantity and rejects unknown-baseline adjustments/negative balances. Creates and
adjustments use transactional idempotency records; stale changes return conflicts.
Admin product stock display is available quantity; onHand is separately projected.

Multipart media upload validates MIME/size; images are decoded/re-encoded, random
filenames remain outside public_html. MP4 range streaming; metadata, primary
image ordering, product association, poster selection and FK-protected removal.
Video poster is per product association; library editing updates all current
associations for that video. Assign a video before setting its poster.
Global media-library ordering stays newest-first; product photo order is editable.

Explicit VITE_DATA_MODE mock/api. Default mock behavior preserved. API reads and
secured mutations have no silent mock fallback. Existing components/layouts and
selectors are reused. Admin login gate cannot use customer/demo identity.
Storefront reloads after confirmed mutations and on focus; server remains the
authority. Live checkout is explicitly unavailable; no fake order/payment success.
All other CMS/customer/order modules remain clearly scoped local previews.

## Routes
Public:
GET /api/products
GET /api/products/{slug}
GET /api/categories
GET /api/categories/{slug}
GET /api/media/{id}

Authentication:
GET /api/admin/session
POST /api/admin/login
POST /api/admin/logout

Authorized:
GET,POST /api/admin/products
GET,PATCH,DELETE /api/admin/products/{id}
POST /api/admin/products/{id}/duplicate
GET,POST /api/admin/categories
GET,PATCH,DELETE /api/admin/categories/{id}
GET /api/admin/inventory
POST /api/admin/inventory/adjustments
GET /api/admin/inventory/history
GET,POST /api/admin/media
GET,PATCH,DELETE /api/admin/media/{id}

JSON errors remain generic; no secrets/SQL traces in responses.
POST catalogue creates/adjustments require Idempotency-Key.
PATCH/DELETE catalogue records and stock adjustments require If-Match.
Uploads are not auto-retried or replayed; inspect the library after an uncertain
upload result. No idempotent multipart replay is claimed.
GET categories/media currently return their complete collection; products and
inventory history support pagination. No public includeInactive flag is honored.

## Source changes
New PHP: CatalogueRules, CatalogueRepository, CatalogueAdmin, AdminAuth,
CatalogueMedia, CatalogueController and bin/bootstrap-admin.php.
Updated bootstrap/app.php/load.php and CLI migrate config selection; config.php
itself is neither read for secrets nor changed. Exact source/destination inventory
is generated in PHASE7B_UPLOAD_MAP.md.
New local files: src/services/catalogueApi.js, components/admin/AdminApiGate.jsx,
scripts/check-catalogue-api.mjs, scripts/check-api-mode.mjs,
scripts/create-admin-bootstrap.ps1,
scripts/package-phase7b.py, backend/tests/catalogue.php,
backend/tests/catalogue-database.php, deployment checksum inventory.
Updated frontend: apiClient, productService, contentService, catalogueAdminService,
adminService, mockStore notification export, checkoutService live-mode guard,
AdminLayout, ProductEditor, CatalogueForms, CatalogueMediaLibrary,
CatalogueWorkspace, vite.config.js and .env.example.
Updated tests: backend/tests/dispatch.php, check-backend-foundation log text.
Backend .gitignore additionally excludes private config/test.php.

## Data/schema decisions
No schema changes or SQL migrations. Uses the deployed 41-table contract.
Do not reimport migrations 001–003 or overwrite existing catalogue data.
Tax setup and per-product low-stock thresholds are not fields in the Phase 7A
schema and are disabled in API-mode forms. They are not silently discarded.
No new prices, stock, certifications, sample orders or business data were seeded.
Deletes preserve core products and all restrictive order/media/history FKs.
Deleted media bytes remain private for recovery; no automated disk cleanup.

## Tests and results
- npm run build: PASS (1733 modules).
- All 20 pre-existing scripts/check-*.mjs: PASS; two failures in an intermediate
  run were corrected and their affected scripts rerun successfully.
- New check-catalogue-api.mjs: PASS (exact paise, pagination, 404 and failure/no-fallback).
- New check-api-mode.mjs: PASS (live branch, public-only reads, admin denial,
  blocked demo checkout; mocked HTTP transport, no Hostinger requests).
- npm run dev -- --host 127.0.0.1 --port 5188 --strictPort: PASS;
  local mock preview http://127.0.0.1:5188/.
- PHP foundation: 36 assertions PASS.
- PHP catalogue: 41 checks PASS with CLI fileinfo enabled (40 without it).
- PHP bootstrap dispatch: 10 cases PASS, including anonymous admin rejection.
- All backend app/bootstrap/bin/test PHP syntax checks: PASS.
- No XAMPP services, local PHP server or local database started.
- backend/tests/catalogue-database.php: NOT RUN; requires an explicitly selected
  disposable HOSTED *_test database, private config/test.php and CLI flag.
  Covers product/category writes, uniqueness, reference guards, hidden detail,
  version conflict, stock replay/negative rejection and audit records.
- True two-connection concurrency, authorized multipart processing, admin login,
  deployed PDO queries, remote error behavior and browser viewport/interaction:
  NOT VERIFIED. Follow the post-upload checklist; no remote success claimed.

## Delivery and next work
See PHASE7B_UPLOAD_MAP.md for exact upload order, first admin, secure local proxy,
required PHP extensions, media paths, rollback and remote endpoint checklist.
Incremental ZIP: backend/deployment/phase7b-catalogue-incremental.zip.
No secrets, config.php, old SQL, business records or user media are bundled.
Do not enable production commerce until later customer/quote/order/payment APIs.

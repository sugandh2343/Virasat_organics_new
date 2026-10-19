# Phase 7G upload map

Prepared 19 October 2026. No upload, remote SQL, credential changes or activation performed. Read PHASE7G_BUSINESS_OPERATIONS.md before using this package.

## Exact deliverables

- Backend: `D:/Virasat Organics/virasat-organics-v2/backend/deployment/phase7g-operations-incremental.zip` — 13 new/changed private PHP files only.
- Frontend: `D:/Virasat Organics/virasat-organics-v2/deployment/virasat-frontend-phase7g.zip` — contents of dist at ZIP root, excluding /api.
- Checksums/inventory: `D:/Virasat Organics/virasat-organics-v2/deployment/phase7g-checksums.json`.
- Separate migration: `D:/Virasat Organics/virasat-organics-v2/backend/database/migrations/007_business_operations.sql`.
- Separate optional owner grant: `D:/Virasat Organics/virasat-organics-v2/backend/database/manual/grant_operations_permissions.sql`.

No config.php, env files, credentials, uploaded media, customer records, logs, node_modules or developer scripts are packaged. SQL is not inside either ZIP and must not be uploaded under public_html.

## Backup and prerequisites

1. Export the current V2 MySQL database. Download every REPLACE PHP file below and current public_html/index.html, root .htaccess and frontend assets. Keep backups private.
2. Verify Phase 7A–7F runtime files and migrations 001–006 are present. Phase 7F implementation was verified locally, not remotely. Do not assume uploading 7G alone installs Phase 7E/F dependencies. Follow their upload maps first when missing. Phase 7F config/home-schema.json is required but unchanged and therefore not duplicated here.
3. Confirm PHP 8+, PDO MySQL and existing session/media directories. Preserve `domains/virasatorganics.com/private/virasat-backend/config/config.php` verbatim.
4. Test 007 on a disposable database clone before production. It adds inventory_balances.low_stock_threshold and three tables: cod_collections, operation_notifications, operation_notification_reads; it defines ten permissions, grants none, seeds no orders and enables no providers.

Migration preflight, with the intended V2 database selected:

```sql
SELECT DATABASE();
SELECT TABLE_NAME FROM information_schema.TABLES
WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN
('cod_collections','operation_notifications','operation_notification_reads');
SELECT COLUMN_NAME FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='inventory_balances'
AND COLUMN_NAME='low_stock_threshold';
```

For a first import the final two queries must be empty. If any object exists, stop and reconcile migration history rather than blindly re-importing. MySQL DDL may auto-commit; a failed partial migration is not rolled back automatically.

Import 007 once through phpMyAdmin after 006. Postflight: repeat those queries, expecting three tables and one column. Inspect foreign keys/indexes and verify no production business rows were inserted. `/api/ready` validates the earlier manifest, so its success alone does NOT prove 007 is installed.

## Controlled permissions

The existing owner may only have catalogue.write/CMS rights. In a private copy of grant_operations_permissions.sql set the target email to the intended existing active administrator and the approval string to `APPROVE BUSINESS OPERATIONS`; then review/import manually. NULL defaults grant nothing. Expected granted_permission_count: 10. The grant records an audit entry, creates a dedicated role, preserves existing roles and does not change credentials.

Rights: orders.read, orders.manage, customers.read, reports.read, inventory.read, inventory.write, delivery.read, delivery.manage, payments.record_cod, notifications.read. For narrower staff roles use a separately reviewed subset and matching audit description; there is no public role-escalation endpoint.

Compatibility change: order GET now requires orders.read; delivery GET/mutations require delivery.read/delivery.manage instead of settings.write. Inventory reads/writes require inventory.read/inventory.write. Stock changes through the catalogue editor also require inventory.write. Grant intended rights before operational testing. Catalogue/CMS permissions otherwise remain intact.

## Exact PHP destinations and upload order

Extract locally; upload into the existing PRIVATE backend tree. Use a short maintenance window for the multi-file replacement, not partially updated concurrent requests. All rows depend on the completed 001–007 schema and existing Phase 7F classes. New support files first, bootstrap/load next, bootstrap/app last.

| Order | Full local path | Exact Hostinger destination | Action | Access | Backup | SQL/runtime dependency |
|---|---|---|---|---|---|---|
| 1 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/OperationsRules.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/OperationsRules.php` | CREATE | Private | If already present | 001–007 and Phase 7F runtime |
| 2 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/OperationsService.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/OperationsService.php` | CREATE | Private | If already present | 001–007 and Phase 7F runtime |
| 3 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/OperationNotifications.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/OperationNotifications.php` | CREATE | Private | If already present | 001–007 and Phase 7F runtime |
| 4 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Controllers/OperationsController.php` | `domains/virasatorganics.com/private/virasat-backend/app/Controllers/OperationsController.php` | CREATE | Private | If already present | 001–007 and Phase 7F runtime |
| 5 | `D:/Virasat Organics/virasat-organics-v2/backend/bin/process-notifications.php` | `domains/virasatorganics.com/private/virasat-backend/bin/process-notifications.php` | CREATE | Private | If already present | 001–007 and Phase 7F runtime |
| 6 | `D:/Virasat Organics/virasat-organics-v2/backend/bootstrap/load.php` | `domains/virasatorganics.com/private/virasat-backend/bootstrap/load.php` | REPLACE | Private | Required | 001–007 and Phase 7F runtime |
| 7 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Middleware/Security.php` | `domains/virasatorganics.com/private/virasat-backend/app/Middleware/Security.php` | REPLACE | Private | Required | 001–007 and Phase 7F runtime |
| 8 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/AdminAuth.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/AdminAuth.php` | REPLACE | Private | Required | 001–007 and Phase 7F runtime |
| 9 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/CatalogueAdmin.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/CatalogueAdmin.php` | REPLACE | Private | Required | 001–007 and Phase 7F runtime |
| 10 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Controllers/CatalogueController.php` | `domains/virasatorganics.com/private/virasat-backend/app/Controllers/CatalogueController.php` | REPLACE | Private | Required | 001–007 and Phase 7F runtime |
| 11 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/CommerceService.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/CommerceService.php` | REPLACE | Private | Required | 001–007 and Phase 7F runtime |
| 12 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Controllers/CommerceController.php` | `domains/virasatorganics.com/private/virasat-backend/app/Controllers/CommerceController.php` | REPLACE | Private | Required | 001–007 and Phase 7F runtime |
| 13 | `D:/Virasat Organics/virasat-organics-v2/backend/bootstrap/app.php` | `domains/virasatorganics.com/private/virasat-backend/bootstrap/app.php` | REPLACE | Private | Required | 001–007 and Phase 7F runtime |

Local-only changed tests `backend/tests/operations.php` and `backend/tests/catalogue-database.php` are NOT uploaded. No public PHP file or public_html/api/.htaccess changes are needed.

## Backend smoke tests before frontend

- /api/health returns 200 and /api/ready succeeds. Verify 007 postflight separately.
- Guest /api/admin/dashboard, /reports/summary and /customers return 401; authenticated insufficient roles return 403.
- Approved owner can read dashboard/reports/current stock/delivery health. Empty actual datasets show zero/empty, not demo orders.
- Missing CSRF on notes/collection/threshold/read-state mutation returns 403. Never create fake live orders or record cash merely to test a button.
- /api/commerce/status reports orderAcceptanceEnabled=false. Authenticated POST /api/orders remains ORDER_ACCEPTANCE_DISABLED; it cannot be enabled through a CMS setting in this release. Checkout quote responses also keep the acceptance flag false.
- Razorpay remains disabled; this package contains no payment keys or provider activation.
- Test customer auth/profile/address and CMS endpoints for regression without creating test business records.

## Frontend upload

Upload contents of the frontend ZIP into `domains/virasatorganics.com/public_html/`.

1. Upload new hashed assets and supplied static asset paths first; the checksum manifest lists every file.
2. Preserve existing `/api/`, uploaded media and private backend. Do not delete unrelated Hostinger files.
3. Back up/merge root `.htaccess` with any existing custom rules. Packaged SPA rules exclude API paths, PHP entry points and actual files/directories. Leave `/api/.htaccess` unchanged.
4. Replace `index.html` last. Retain previous hashed assets for rollback.
5. Hard-refresh or open a fresh browser window. Purge any CDN index cache if used; authenticated API responses must not be cached.

Open https://virasatorganics.com/admin after manual upload. Check dashboard, /admin/orders, /admin/customers, /admin/reports, /admin/inventory, /admin/inventory/history, /admin/delivery and /admin/notifications. Browser validation is pending, not claimed complete.

## Optional Hostinger cron

Notifications are a durable in-app projection of committed order status events and low-stock balances. Loading the authorized list processes a bounded batch; optional cron drains larger backlogs. No continuously running process is needed.

Use Hostinger's actual PHP 8 CLI binary and account home path (verify them in hPanel; placeholders are intentional):

```text
<PHP_8_CLI> /home/<HOSTINGER_USER>/domains/virasatorganics.com/private/virasat-backend/bin/process-notifications.php
```

A five-minute schedule is optional. Each invocation inserts at most 500 order events plus 500 low-stock entries. Repeated/concurrent invocations are deduplicated by event_key. Script is CLI-only and prints only a processed count; it sends no email/SMS/WhatsApp. It also surfaces historical committed order events, never fabricated events. The email adapter is explicitly disabled; enabling real delivery requires a future reviewed provider implementation and schema change, not an invented success flag.

## Rollback and Phase 7H acceptance

Restore backed-up PHP as a coherent set (bootstrap/app first to remove new routing, then other prior files and prior load.php). Restore previous frontend index/.htaccess; retain prior assets. Do not delete config.php, sessions or media. Keep additive 007 objects and existing financial/audit records; never restore an old whole database over newly collected cash/orders/customer activity. Review backups with the operator if data rollback is necessary.

Phase 7H must verify on isolated MySQL: concurrent last-stock orders and adjustments, duplicate collection requests, stale versions, single cancellation restock, CSV safety, outbox races, permissions, date boundaries and reconciliation. Then verify actual browser/mobile flows, print layout, session expiry, customer tracking and genuine business configuration. Do not remove the public COD hold until that acceptance is explicitly completed. Do not enable Razorpay without its separate merchant/provider acceptance.

## Local PHP test files — do not upload

| Full local file | Hostinger destination | Action | Access / backup / order / SQL |
|---|---|---|---|
| D:/Virasat Organics/virasat-organics-v2/backend/tests/operations.php | None | CREATE locally only | Synthetic SQLite; no hosting upload or production SQL |
| D:/Virasat Organics/virasat-organics-v2/backend/tests/catalogue-database.php | None | REPLACE locally only | Opt-in disposable hosted database fixture; 001–007 required; never production |

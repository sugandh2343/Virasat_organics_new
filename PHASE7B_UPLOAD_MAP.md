# Phase 7B Hostinger upload map
Date: 18 October 2026. Existing health/readiness success is owner-reported.
This new release has NOT been deployed or tested against the live database.

## Exact files
Project root: D:/Virasat Organics/virasat-organics-v2.
Archive: backend/deployment/phase7b-catalogue-incremental.zip.
ZIP entries start private/virasat-backend/. No public files are changed.
<!-- FILE_MAP_START -->
| Local source | Hostinger destination | Action | Location | SQL import | Back up |
| --- | --- | --- | --- | --- | --- |
| D:/Virasat Organics/virasat-organics-v2/backend/app/Controllers/CatalogueController.php | domains/virasatorganics.com/private/virasat-backend/app/Controllers/CatalogueController.php | CREATE | Private | No | No existing file |
| D:/Virasat Organics/virasat-organics-v2/backend/app/Repositories/CatalogueRepository.php | domains/virasatorganics.com/private/virasat-backend/app/Repositories/CatalogueRepository.php | CREATE | Private | No | No existing file |
| D:/Virasat Organics/virasat-organics-v2/backend/app/Services/AdminAuth.php | domains/virasatorganics.com/private/virasat-backend/app/Services/AdminAuth.php | CREATE | Private | No | No existing file |
| D:/Virasat Organics/virasat-organics-v2/backend/app/Services/CatalogueAdmin.php | domains/virasatorganics.com/private/virasat-backend/app/Services/CatalogueAdmin.php | CREATE | Private | No | No existing file |
| D:/Virasat Organics/virasat-organics-v2/backend/app/Services/CatalogueMedia.php | domains/virasatorganics.com/private/virasat-backend/app/Services/CatalogueMedia.php | CREATE | Private | No | No existing file |
| D:/Virasat Organics/virasat-organics-v2/backend/app/Services/CatalogueRules.php | domains/virasatorganics.com/private/virasat-backend/app/Services/CatalogueRules.php | CREATE | Private | No | No existing file |
| D:/Virasat Organics/virasat-organics-v2/backend/bootstrap/app.php | domains/virasatorganics.com/private/virasat-backend/bootstrap/app.php | REPLACE | Private | No | Yes |
| D:/Virasat Organics/virasat-organics-v2/backend/bootstrap/load.php | domains/virasatorganics.com/private/virasat-backend/bootstrap/load.php | REPLACE | Private | No | Yes |
| D:/Virasat Organics/virasat-organics-v2/backend/bin/bootstrap-admin.php | domains/virasatorganics.com/private/virasat-backend/bin/bootstrap-admin.php | CREATE | Private | No | No existing file |
| D:/Virasat Organics/virasat-organics-v2/backend/bin/migrate.php | domains/virasatorganics.com/private/virasat-backend/bin/migrate.php | REPLACE | Private | No | Yes |
<!-- FILE_MAP_END -->

## Upload step by step
1. Keep the frontend in VITE_DATA_MODE=mock during the backend upload.
2. In Hostinger File Manager open domains/virasatorganics.com/. Back up the
   REPLACE files listed above to a private backup folder outside public_html.
   Back up the dedicated V2 database through phpMyAdmin before first-admin setup.
3. Create domains/virasatorganics.com/phase7b-staging/. Upload the incremental ZIP
   there and extract it. It produces phase7b-staging/private/virasat-backend/.
   Never extract into public_html, public_html/api, or the old website directory.
4. Copy every CREATE file from the extracted app/ and bin/ folders to the exact
   destinations listed above. Keep directory names and case unchanged.
5. Replace bin/migrate.php from the staging copy. Replace bootstrap/load.php
   after all new app files exist. Replace bootstrap/app.php LAST.
   Do this in a quiet maintenance window; don't test during partial copying.
6. DO NOT replace, rename, edit or delete private/virasat-backend/config/config.php.
   Do not upload config.local.php, config.example.php, the original 7A ZIP,
   node_modules, dist, existing user media, or migrations 001–003.
   public_html/api/index.php and .htaccess remain exactly as deployed.
7. Ensure PHP PDO MySQL, fileinfo, GD with JPEG/PNG/WebP and sessions are enabled.
   Private storage/sessions must already be writable by PHP. The service creates
   storage/media with owner permissions; if PHP cannot create it, create
   domains/virasatorganics.com/private/virasat-backend/storage/media in File Manager
   and permit the PHP owner to write it. Never use permissions 777.
   Code/config must remain private. The runtime DB account needs scoped
   SELECT/INSERT/UPDATE/DELETE on this V2 database; no FILE/global/admin privileges.
8. Verify /api/health, /api/ready, /api/products and /api/categories (URLs below).
9. Create the first administrator using the private procedure below.
10. Enable the local frontend API mode only after public checks pass. Use HTTPS
    for the authenticated local proxy. Test login and a reversible catalogue edit.
    Do not deploy the React frontend in this phase.

## Database migration
No new SQL migration is required. The existing 41 tables, immutable migrations,
seed products and migration tracking are unchanged. Do NOT reimport/reset them.
First-admin SQL only inserts the initial admin/role/permission when admin_users is
empty. It is not a schema migration and contains no database connection secrets.

## First administrator — no public endpoint
Use a private local terminal, not a shared recording or browser console:
    cd "D:/Virasat Organics/virasat-organics-v2"
    powershell -ExecutionPolicy Bypass -File scripts/create-admin-bootstrap.ps1

The helper uses the already installed PHP CLI only, not XAMPP services. Pass
-Php "C:/path/to/php.exe" if needed. Enter your own email, name and strong password
when prompted. Password input is hidden, passed via stdin, not command-line args.
No hardcoded account/password exists. No credentials are requested in this chat.

It writes backend/storage/bootstrap-admin.sql, containing a password HASH.
This file is sensitive, ignored by Git, and excluded from the upload ZIP.
Open phpMyAdmin for the dedicated V2 database and import this private SQL directly
from your computer. Require ZERO SQL errors and admin_created = 1.
If any SQL statement fails, stop; do not continue executing later statements.
If admin_created = 0, an admin already exists or the advisory lock failed.
Do not delete accounts or run a reset; use the existing admin or investigate
privately. The SQL is deliberately one-time and does not overwrite any account.
After successful import, remove the generated SQL from your computer and any
temporary private uploads. Never put it under public_html or send it in chat.
The new admin has catalogue.write only, covering this phase's catalogue endpoints.

## Local frontend configuration
Local .env.local (do not upload; contains no database credentials):
    VITE_DATA_MODE=api
    VITE_API_BASE_URL=https://virasatorganics.com/api
    API_PROXY_ENABLED=true
    VITE_API_PROXY_ENABLED=true
    API_PROXY_TARGET=https://virasatorganics.com
    DEV_HTTPS_CERT=C:/private-certificates/localhost.pem
    DEV_HTTPS_KEY=C:/private-certificates/localhost-key.pem

Use your own locally trusted HTTPS certificate/key; those example paths are not
supplied files. Restart npm run dev. Open its printed HTTPS localhost URL, then
/admin. The proxy keeps authenticated requests same-origin and forwards to the
fixed remote host. Secure/HttpOnly/SameSite=Lax cookies are NOT weakened.
Do not enable direct cross-site cookies or wildcard credentialed CORS.
Plain npm run dev/mock mode is unchanged. For a read-only direct remote API setup,
the deployed config must already allow the exact local origin; this release does
not modify your config.php. The proxy avoids needing that configuration change.

To return to demo mode set VITE_DATA_MODE=mock and restart Vite.
Source changes under src/, vite.config.js, .env.example, scripts/, tests and
Phase 7B Markdown documents remain LOCAL. Do not upload any to public_html.

## Media storage and URLs
Filesystem: domains/virasatorganics.com/private/virasat-backend/storage/media/
Generated filename: 48 random hexadecimal characters + validated extension.
Public URL: https://virasatorganics.com/api/media/{media-id}
The URL is read-only, and only assigned media on visible products/categories is
public. Unassigned previews require an authorized admin session (use local proxy).
JPEG/PNG/WebP are decoded and re-encoded with GD (max 10 MB, 16 megapixels).
MP4 has MIME/container validation (max 100 MB). Up to 10 files per request.
Hostinger upload_max_filesize/post_max_size/max_file_uploads can impose LOWER
limits; configure them in hPanel only if the hosting plan permits. Do not change
config.php. MP4 byte-range streaming supports seeking.
No video transcoding or malware scanner is claimed. Files are private and served
with fixed MIME, nosniff and sandbox headers; no PHP upload is executable.
Deletion removes metadata only after all FK references permit it. Private
unreferenced bytes are retained for operator recovery; no automatic garbage
collector deletes user uploads in this phase.

## Remote checks after upload
- GET https://virasatorganics.com/api/health -> 200 data.status ok.
- GET https://virasatorganics.com/api/ready -> 200 data.status ready.
- GET https://virasatorganics.com/api/products -> five existing seed products
  unless the operator already added/edited catalogue data. Never reset it.
- GET /api/products?category=mustard-oils&q=500&page=1&pageSize=2.
- GET /api/products/atta-5kg and /api/categories/atta-flour.
- Anonymous GET/POST /api/admin/products -> 401; no data mutation.
- In /admin, login, create a temporary inactive independent product, edit it,
  duplicate it, configure test stock with a reason, verify the audit/history,
  reject negative stock and archive it. Do not invent selling prices for seeds.
- Verify an inactive product slug returns 404 in a signed-out browser.
- Submit a stale version from two admin tabs -> 409, refresh before retrying.
- For actual concurrency, submit two adjustments using the SAME initial version
  and different idempotency keys: one succeeds and one conflicts, final stock
  reflects exactly one change. Repeating the successful key must not apply twice.
- Upload authorized test JPEG/PNG/WebP/MP4; assign to product; check primary image,
  poster, order, playback, refresh persistence and reference-protected removal.
  A renamed PHP file must fail MIME validation.
- Logout, then confirm every admin resource is inaccessible.

## Rollback
Switch local VITE_DATA_MODE to mock and restart. Restore the three REPLACE files
from the private backup (bootstrap/app.php first to stop dispatching new routes,
then bootstrap/load.php and bin/migrate.php). New files can remain private and
unused. No SQL rollback/reset is needed: there are no schema changes.
Preserve legitimate catalogue edits, media and created admin accounts. Do not
delete database rows as a deployment rollback. Restore a DB backup only through
a separately reviewed recovery operation if genuinely necessary.

## Validation limits
The code passed local PHP lint, isolated validation/dispatch tests and frontend
regressions/build. No Hostinger mutation, login, multipart upload, two-connection
concurrency or browser viewport test has been executed by Codex.
backend/tests/catalogue-database.php provides opt-in CRUD/inventory integration
tests requiring a separate HOSTED disposable database named *_test and private
config/test.php; these tests were not run and must never target the live store.

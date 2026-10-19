# Phase 7H upload map — owner action only

No upload has been performed. Deployment through Phase 7G/007 is owner-confirmed. Public COD and Razorpay must remain disabled. This is an incremental package, not a full backend install.

## Packages

- `D:/Virasat Organics/virasat-organics-v2/backend/deployment/phase7h-final-incremental.zip`
- `D:/Virasat Organics/virasat-organics-v2/deployment/virasat-frontend-phase7h.zip`
- `D:/Virasat Organics/virasat-organics-v2/deployment/phase7h-checksums.json`: exact archive and individual-file SHA-256 inventory; every frontend path listed here is relative to public_html.

Back up the existing frontend index, assets and root .htaccess, the nine corresponding private paths below, and export the V2 database privately before changes. Keep backups outside public_html. Do not delete existing hashed assets during the release; old open tabs may still need them.

## Private PHP upload order

Extract locally, then upload the listed files individually in order. Upload classes before bootstrap registrations. Do not extract this ZIP into public_html. For an already-existing CREATE target, compare and back up before replacement. There is no new SQL migration in this release. Do not rerun 001–007 or alter migration checksums to silence readiness failures.

| Order | Exact local source | Exact Hostinger destination | Action | Backup |
|---|---|---|---|---|
| 1 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/LaunchGate.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/LaunchGate.php` | CREATE | Back up if already present; otherwise create |
| 2 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/RuntimeSchema.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/RuntimeSchema.php` | CREATE | Back up if already present; otherwise create |
| 3 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Controllers/CrawlerController.php` | `domains/virasatorganics.com/private/virasat-backend/app/Controllers/CrawlerController.php` | CREATE | Back up if already present; otherwise create |
| 4 | `D:/Virasat Organics/virasat-organics-v2/backend/bin/audit-readiness.php` | `domains/virasatorganics.com/private/virasat-backend/bin/audit-readiness.php` | CREATE | Back up if already present; otherwise create |
| 5 | `D:/Virasat Organics/virasat-organics-v2/backend/config/launch.example.php` | `domains/virasatorganics.com/private/virasat-backend/config/launch.example.php` | CREATE | Back up if already present; otherwise create |
| 6 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Controllers/CommerceController.php` | `domains/virasatorganics.com/private/virasat-backend/app/Controllers/CommerceController.php` | REPLACE | Back up existing file |
| 7 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Controllers/SystemController.php` | `domains/virasatorganics.com/private/virasat-backend/app/Controllers/SystemController.php` | REPLACE | Back up existing file |
| 8 | `D:/Virasat Organics/virasat-organics-v2/backend/bootstrap/load.php` | `domains/virasatorganics.com/private/virasat-backend/bootstrap/load.php` | REPLACE | Back up existing file |
| 9 | `D:/Virasat Organics/virasat-organics-v2/backend/bootstrap/app.php` | `domains/virasatorganics.com/private/virasat-backend/bootstrap/app.php` | REPLACE | Back up existing file |

`launch.example.php` is documentation, not active configuration. Do not copy it to launch.php until following the gated acceptance procedure. Missing launch.php intentionally keeps ordering disabled.

## Frontend upload

Upload the CONTENTS of the frontend ZIP directly into `domains/virasatorganics.com/public_html/`. It contains root `index.html`, `.htaccess`, `robots.txt` and the exact asset paths in phase7h-checksums.json, with no enclosing dist folder. Upload assets first; index.html and reviewed root .htaccess last. The root rewrite configuration preserves existing /api and PHP entry points; merges with any host-specific redirects must retain that ordering. `/sitemap.xml` redirects to `/api/sitemap.xml`; robots.txt allows that sitemap.

NEVER touch `public_html/api/`, its .htaccess/index.php, private `config/config.php`, existing `config/launch.php`, sessions, uploaded media, database credentials, logs or the old website. No credentials, env files, private storage, node_modules or source scripts are in the frontend ZIP.

## Diagnostic and post-upload checks

Using the Hostinger terminal with the private backend as working directory, run `php bin/audit-readiness.php`. This is a private CLI-only read-only check; do not create a public diagnostic endpoint. If terminal access is unavailable, ask hosting support to run it privately. Share only its safe categories, not config.php, tokens or logs containing personal data. It reports schema/ledger stages, missing runtime columns/indexes, seed and business presence, publication count and session-directory writability. Resolve the reported stage before launch; the currently observed ready503 cause is not yet proven.

Verify health200, ready200, products/categories200, guest auth/me401, guest admin/dashboard401, published homepage200, settings/public200, robots.txt text/plain and sitemap XML. An unpublished homepage must be published by the owner with genuine content; do not seed fake content to obtain200. Check all SPA deep links and unknown /api URLs remain JSON404, never index.html. Private paths must deny access. Then perform FINAL_DEPLOYMENT_CHECKLIST.md.

Hard-refresh the browser, clear only site cached files if needed, close old tabs and confirm a new asset hash. Do not clear authentication storage to disguise session failures. Purge any host/CDN cached index or robots file; never cache authenticated API responses.

## Rollback

Set owner-controlled launch mode disabled first. Restore the backed-up private PHP files as a matching set and the prior frontend index/root .htaccess/assets. Remove only newly introduced files from this release if necessary after confirming exact paths; do not delete backend storage or live records. There is no Phase7H schema rollback. Do not restore a database backup over orders created since that backup without a separate recovery plan.

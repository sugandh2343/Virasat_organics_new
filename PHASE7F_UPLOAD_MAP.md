# Phase 7F Hostinger upload map

Prepared locally on 2026-10-19. Nothing uploaded or imported automatically. Do not overwrite private config.php. This package has no public PHP entry point changes.

## Packages and separate SQL

- PHP/supporting JSON: `D:/Virasat Organics/virasat-organics-v2/backend/deployment/phase7f-cms-incremental.zip` (12 files).
- Frontend: `D:/Virasat Organics/virasat-organics-v2/deployment/virasat-frontend-phase7f.zip` (contents of dist, no enclosing dist directory).
- SHA-256 manifest: `D:/Virasat Organics/virasat-organics-v2/deployment/phase7f-checksums.json`.
- Migration: `D:/Virasat Organics/virasat-organics-v2/backend/database/migrations/006_dynamic_cms.sql`.
- Draft initialization: `D:/Virasat Organics/virasat-organics-v2/backend/database/manual/initialize_cms_drafts.sql`.
- Optional approved permissions: `D:/Virasat Organics/virasat-organics-v2/backend/database/manual/grant_cms_permissions.sql`.

SQL files are deliberately outside both ZIPs. Import through phpMyAdmin into the existing V2 database; do not put them in public_html.

## Prerequisites and backup

1. Export the V2 database and download backups of all REPLACE files below, current frontend index.html/root .htaccess/assets. Keep backups outside public_html.
2. Confirm Phase 7D and Phase 7E runtime files and migrations 001–005 are installed. Phase 7E exists locally but its deployment is NOT confirmed. The new bootstrap retains PaymentController references, so deploying 7F without 7E dependencies will fail. Follow PHASE7E_UPLOAD_MAP.md first if necessary; Razorpay stays disabled.
3. Test migration 006 against a disposable MySQL copy first. Local SQLite tests do not prove deployed MySQL compatibility. Apply 006 once after 005; MySQL DDL may auto-commit. If partly applied, inspect columns before proceeding—do not blindly re-import.
4. Review/import initialize_cms_drafts.sql. It inserts missing sections, business/compliance rows and fixed pages, never publishes or overwrites existing records. Inspect partially initialized homepage rows first: existing conflicting order positions require deliberate reconciliation. No automatic deletion is provided.
5. Grant permissions only if needed: in a private working copy of grant_cms_permissions.sql replace the NULL target email and NULL approval with the intended existing active administrator and `APPROVE CMS AND SETTINGS`. Review, then import. Expected granted_permission_count=2. This adds a dedicated audited content.write/settings.write role, preserves other roles and creates no administrator. Never publish this file.

## Exact private runtime destinations

Upload supporting classes first and bootstrap/app.php last, in the order below. Avoid user traffic during the short multi-file replacement window. Extract ZIP locally, then upload to these exact paths, not public_html.

| Order | Full local source | Exact Hostinger destination | Action | Access | Backup |
|---|---|---|---|---|---|
| 1 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/CMSRules.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/CMSRules.php` | CREATE | Private | If already present |
| 2 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/CMSService.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/CMSService.php` | CREATE | Private | If already present |
| 3 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Controllers/CMSController.php` | `domains/virasatorganics.com/private/virasat-backend/app/Controllers/CMSController.php` | CREATE | Private | If already present |
| 4 | `D:/Virasat Organics/virasat-organics-v2/backend/config/home-schema.json` | `domains/virasatorganics.com/private/virasat-backend/config/home-schema.json` | CREATE | Private | If already present |
| 5 | `D:/Virasat Organics/virasat-organics-v2/backend/bootstrap/load.php` | `domains/virasatorganics.com/private/virasat-backend/bootstrap/load.php` | REPLACE | Private | Yes |
| 6 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Helpers/Http.php` | `domains/virasatorganics.com/private/virasat-backend/app/Helpers/Http.php` | REPLACE | Private | Yes |
| 7 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/AdminAuth.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/AdminAuth.php` | REPLACE | Private | Yes |
| 8 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Controllers/CatalogueController.php` | `domains/virasatorganics.com/private/virasat-backend/app/Controllers/CatalogueController.php` | REPLACE | Private | Yes |
| 9 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/CatalogueMedia.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/CatalogueMedia.php` | REPLACE | Private | Yes |
| 10 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/CommerceService.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/CommerceService.php` | REPLACE | Private | Yes |
| 11 | `D:/Virasat Organics/virasat-organics-v2/backend/app/Controllers/CommerceController.php` | `domains/virasatorganics.com/private/virasat-backend/app/Controllers/CommerceController.php` | REPLACE | Private | Yes |
| 12 | `D:/Virasat Organics/virasat-organics-v2/backend/bootstrap/app.php` | `domains/virasatorganics.com/private/virasat-backend/bootstrap/app.php` | REPLACE | Private | Yes |

Do not upload tests, developer scripts, migrations or documentation as public files. Changed backend/tests/commerce.php, backend/tests/commerce-mysql.php and new backend/tests/cms.php are local test files only.

## Content publication before frontend replacement

Use the updated local API-mode administrator UI against the uploaded backend. Sign in normally; never paste credentials into chat. Review homepage draft, imagery/media rights, links, section order and visibility, then explicitly Publish homepage. A saved homepage draft does not change its published snapshot. Unpublished public homepage returns CONTENT_UNPUBLISHED rather than fabricated fallback content.

Configure genuine business/contact/footer/announcement information in Business Settings. Review legal policies and publish individually; unpublished pages/blogs return 404. Banners require explicit active publication confirmation. No testimonials, regulatory numbers, legal copy or product facts have been invented. Disable unfinished sections.

Existing delivery/COD settings remain authoritative. New business seed defaults do not enable orders. Order acceptance now requires the private commerce flag AND business accept-orders enabled AND maintenance disabled, plus valid delivery/tax/COD configuration. Review these gates; do not enable real orders merely to test CMS. Razorpay remains disabled.

## Frontend root upload

After API/content checks, extract the frontend ZIP directly into `domains/virasatorganics.com/public_html/`:

- CREATE hashed `assets/*` files and supplied nested asset directories; the checksum manifest lists every archive entry.
- REPLACE `index.html` last, retaining prior assets for rollback.
- MERGE/REPLACE root `.htaccess` only after backing up existing rules. The supplied rules exclude `/api`, PHP paths, existing files/directories and missing assets from SPA fallback.
- Preserve `public_html/api/` including its .htaccess, private backend/config.php, storage/sessions and all uploaded media. The archive contains none of those paths.

The build uses same-origin /api, secure session cookies and CSRF. There are no env files, private credentials, service account files, source maps, node_modules or developer scripts in the archive. Browser Firebase/Maps configuration is intentionally public compiled configuration; keep provider restrictions in place.

## Post-upload checks

- GET `/api/health` and `/api/ready` succeed; `/api/admin/session` works and guest protected CMS requests return 401.
- Sign in as approved admin. Missing CSRF on a mutation returns 403; a role without content.write/settings.write is denied the corresponding operation.
- GET `/api/homepage`, `/api/store`, `/api/settings/public`, `/api/blog`, `/api/blog/categories`, published `/api/pages/{slug}` and `/api/story` return JSON. Draft blog/page slugs return 404.
- Edit homepage draft and check public content remains unchanged; publish and verify order/visibility after refresh. Reusing stale versions returns 409. Verify response ETag changes and conditional GET returns 304 when unchanged.
- Create/edit/archive banner, blog and category; verify draft/published visibility, unique slugs and category/search pagination. Core pages are edited/unpublished, not deleted.
- Upload genuine image/video through existing media library, assign it, inspect public rendering. Referenced media deletion is rejected. Replace references before deleting unused media.
- Check contact/footer/GSTIN/FSSAI flags; hidden/unconfigured registration numbers are absent publicly. Format validation is not licence verification.
- Confirm shared delivery settings and checkout gates, admin/customer login/logout, homepage/shop/product deep-link refresh, mobile editor/public layouts. Test Firebase/Maps separately with the owner. No live results are claimed here.
- Hard-refresh or use a fresh browser window after index upload; invalidate CDN index/API caches if configured. Do not cache authenticated API responses. Public CMS responses revalidate via ETag.

## Rollback

Restore backed-up index.html and root .htaccess; retain old hashed assets. Restore the backed-up PHP files as a coherent set, including bootstrap files. Keep additive 006 columns and reviewed content unless a DBA has assessed a rollback; never restore an old whole database over new orders/customer activity. New CMS files may remain unreferenced after restoring old bootstrap. Preserve config.php, media and sessions throughout.

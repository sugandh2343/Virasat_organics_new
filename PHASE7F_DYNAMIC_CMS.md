# Phase 7F dynamic CMS

Implemented locally, 2026-10-19. No deployment, live database writes, permission grants, commits or private config.php changes were performed. The old website was not modified.

## Functionality

API-mode storefront and existing administration editors now use PHP/PDO/MySQL for homepage sections, banners, story/policy pages, blog/categories and business/compliance settings. Explicit development mock mode remains available; API failures never silently fall back to mock content. Existing design tokens and luxury layouts are retained.

Homepage sections have independent enabled/order settings and a separate published snapshot. Save changes updates the draft; Publish homepage explicitly replaces the public snapshot. Disabled sections omit their content publicly. The reviewed draft initializer reuses existing design content without auto-publication. Homepage testimonials require genuine reviewed entries; no testimonials are seeded.

Banners, blog and pages have explicit publication confirmation, version conflicts and structured plaintext blocks. No raw HTML is rendered. Saving a previously published blog/page as draft unpublishes it; these records do not have homepage-style shadow drafts or full revision history. Fixed core policy/story pages cannot be deleted or renamed. Blogs support unique slugs, category filtering, search and pagination. CMS create retries use idempotency keys.

Existing private media upload/validation/storage is reused. Content/settings administrators can use the media library without catalogue rights. Ready media IDs are validated, public serving is restricted to public references and referenced media cannot be deleted. Homepage draft edits retain published references until publication replaces them. No authentic packaging or business content was fabricated.

Business settings include legal/display name, Hindi identity, contacts, announcement/footer visibility, social links, logo, SEO and conditional GSTIN/FSSAI display. Format validation does not prove registration validity. Private credentials are never accepted by these forms or returned. SEO updates document metadata in the SPA; server-rendered social previews are not part of this phase. No invented structured-data claims are emitted.

Delivery/COD editing reuses Phase 7D services/tables. No second shipping configuration exists. Server-side checkout requires the existing private commerce flag, business accept-orders flag and maintenance disabled, in addition to normal delivery/tax/stock rules. Razorpay remains disabled. Newsletter settings manage presentation only; no subscription service was added.

## Routes

Public GET:

- /api/store, /api/homepage, /api/banners
- /api/blog, /api/blog/categories, /api/blog/{slug}
- /api/pages/{slug}, /api/story
- /api/settings/public

Authenticated admin:

- GET/PUT /api/admin/homepage
- GET/PUT /api/admin/settings
- GET/POST /api/admin/blog, /pages, /banners, /blog-categories
- GET/PATCH/DELETE corresponding /{id} resources, with core-page deletion forbidden
- Existing /api/admin/media upload/metadata/delete and /api/media/{id} serving reused

Real PHP sessions authorize requests. Mutations require CSRF and permission checks, rate limits and optimistic versions; create requests require idempotency keys. content.write controls CMS, settings.write controls business/compliance, existing delivery authorization remains in place. Media accepts an appropriate catalogue/content/settings permission. Public content uses ETag revalidation. Unpublished records return 404, not demonstration content.

## Schema and permission setup

006_dynamic_cms.sql adds seven columns across existing homepage_sections, banners, blog_posts and business_settings tables, and defines content.write/settings.write. It grants nobody permission. Existing media references, audit and idempotency tables are reused.

initialize_cms_drafts.sql inserts missing draft homepage sections, fixed pages and singleton settings only. Review existing partial data before import. grant_cms_permissions.sql is an optional private operator-approved, audited grant to an existing active administrator; NULL defaults do nothing. See PHASE7F_UPLOAD_MAP.md for precise steps.

## Changed files

Backend runtime: new CMSRules.php, CMSService.php, CMSController.php and config/home-schema.json; updated Http.php, AdminAuth.php, CatalogueController.php, CatalogueMedia.php, CommerceService.php, CommerceController.php, bootstrap/load.php and bootstrap/app.php.

Database/support: migration 006, manual draft initialization and permission SQL; scripts/generate-cms-drafts.mjs and scripts/package-phase7f.py.

Frontend: new cmsApi.js, CMSMediaWorkspace.jsx, LiveBlog.jsx and useSEO.js; updated contentService.js, cmsAdminService.js, catalogueApi.js, apiClient.js, CMSWorkspace.jsx, CMSEditorControls.jsx, AdminManagementPage.jsx, CatalogueMediaLibrary.jsx, AdminLayout.jsx, cmsEditor.js, ContentBanners.jsx, FoundationPage.jsx, ContentDocument.jsx, SiteLayout.jsx and BusinessContext.jsx. LiveBlog is lazy-loaded to keep the main build chunk below the warning threshold.

Tests: new backend/tests/cms.php and scripts/check-cms-api.mjs; updated backend/tests/commerce.php and commerce-mysql.php for the new business order gate. The MySQL harness enables/restores synthetic business flags only inside its explicitly acknowledged disposable test database; it was not executed here.

## Validation results and failures

- PHP runtime/bootstrap/test syntax checks passed. Final modified MySQL harness syntax check also passed.
- Offline PHP suites: foundation 36, configuration 13, catalogue 40, dispatch 17, customer 53, commerce 83, payments 54, CMS 61: **357 assertions passed**.
- Full frontend regression run: **29 passed; 2 opt-in live/browser checks skipped** out of 31 scripts. Mock regressions run with VITE_DATA_MODE=mock; API regressions use their explicit API fixtures.
- CMS offline coverage includes draft/public visibility, reorder, banner CRUD, unsafe URLs, slug collisions, publish/unpublish, HTML rejection, fixed pages, authorization/CSRF, conditional compliance values, settings allowlists, media references, delivery consistency, idempotency and stale versions.
- Initial regression detected corrupted Unicode labels; repaired and rerun passed. A later targeted legacy mock test was accidentally invoked in default API mode and failed with NETWORK_ERROR; rerunning with explicit VITE_DATA_MODE=mock passed. No fallback was introduced.
- Final npm run build passed: 1760 modules, main JS 498.19 kB; no chunk-size warning after lazy-loading the journal page.
- Both ZIPs passed CRC, exact inventory and byte-for-byte source comparisons; SHA-256 manifest generated. Frontend archive contains dist contents with root .htaccess and excludes /api and private sources.

Tests used synthetic transport and SQLite fixtures. MySQL-specific DDL, concurrency, real browser layouts, Hostinger permissions, live CMS writes, Firebase/Maps and end-to-end commerce were NOT verified. Offline assertions are not proof of live production readiness.

## Deliverables

- D:/Virasat Organics/virasat-organics-v2/backend/deployment/phase7f-cms-incremental.zip
- D:/Virasat Organics/virasat-organics-v2/deployment/virasat-frontend-phase7f.zip
- D:/Virasat Organics/virasat-organics-v2/deployment/phase7f-checksums.json
- D:/Virasat Organics/virasat-organics-v2/PHASE7F_UPLOAD_MAP.md

SQL stays separate from the ZIPs. All twelve backend/supporting file destinations and CREATE/REPLACE instructions are in the upload map. Existing config.php, public_html/api, media and sessions must remain intact.

## Readiness and next work

1. Confirm Phase 7E runtime/schema dependencies are installed; deployment is not known. Keep its gateway disabled.
2. Back up and validate 006 on disposable MySQL before manual production import.
3. Initialize reviewed drafts and explicitly grant only intended administrator rights.
4. Upload PHP support files in the documented order. Publish reviewed homepage content through updated API-mode admin before replacing the storefront; otherwise public homepage intentionally returns CONTENT_UNPUBLISHED.
5. Supply genuine images/videos, reviewed legal text, official contact/registration details and any real testimonials; archive or disable unfinished content. No ratings, prices, licences or legal facts are invented.
6. Follow the upload map acceptance checklist for public/admin visibility, permissions, cache refresh, media references, customer sessions, checkout gates and mobile layouts.
7. Complete isolated MySQL concurrency and owner-assisted production QA. Do not enable live commerce or Razorpay merely because the CMS build passed.

No local preview server was started in this phase; the intended production preview is https://virasatorganics.com after the owner's manual deployment. Live state has not been changed.

# Frontend Hostinger upload — Phase 7C

Prepared 2026-10-19. Manual upload only. No Hostinger files, database settings or credentials were changed.

## Deliverables and destination

Project: `D:/Virasat Organics/virasat-organics-v2`

- ZIP: `D:/Virasat Organics/virasat-organics-v2/deployment/virasat-frontend-phase7c.zip`
- Built files: `D:/Virasat Organics/virasat-organics-v2/dist/`
- Per-file SHA-256 inventory: `D:/Virasat Organics/virasat-organics-v2/deployment/frontend-manifest.json`
- This guide: `D:/Virasat Organics/virasat-organics-v2/FRONTEND_HOSTINGER_UPLOAD.md`
- Destination: `domains/virasatorganics.com/public_html/`
- Intended URL: https://virasatorganics.com/ (use this exact HTTPS, non-www origin for acceptance).

The ZIP contains the CONTENTS of dist. Do not create a dist/ or project-name/ directory on Hostinger.
Only compiled frontend assets are included. Firebase Web and Maps browser configuration is intentionally public in compiled JavaScript; provider console domain/API restrictions must be verified by the owner. No database credentials, private config.php, .env files, service account JSON, PHP, source maps, tests, developer scripts or node_modules are included.

## Backup, upload and API preservation

1. Download a backup of the existing root `.htaccess`, root index files and any existing frontend assets to your computer. Keep the backup outside public_html. Record which root files already exist. Do not delete or move the entire public_html directory.
2. Inspect existing root `.htaccess` before replacing it. The package's file is a root SPA template; preserve existing HTTPS/canonical-domain redirects, security and hosting rules. If custom root PHP rewrite rules exist, retain them BEFORE the React fallback. Do not blindly replace unknown rules. The remote root .htaccess was not available for inspection during packaging.
3. Upload the ZIP, extract into `domains/virasatorganics.com/public_html/`, and verify the file list below. Alternatively upload `assets/` first, then the merged root `.htaccess`, then `index.html` last. Merge assets without deleting pre-existing unrelated assets. Enable hidden-file display so `.htaccess` is included.
4. Root `.htaccess`: CREATE if absent, otherwise BACK UP and MERGE/REPLACE only after step 2. `index.html`: CREATE or REPLACE after backup. Compiled assets: CREATE, or REPLACE the exact matching filenames only.
5. Remove the uploaded ZIP from public_html after extraction. Keep the local ZIP and manifest. Do not upload this guide or the manifest.
6. Test the API immediately, then test frontend routes. If any API response becomes HTML or 500, restore the backed-up root .htaccess before continuing.

NEVER touch:
- `domains/virasatorganics.com/public_html/api/` or anything inside it, especially its `.htaccess`, PHP entry points and media.
- `domains/virasatorganics.com/private/virasat-backend/`, especially `config/config.php`, storage or sessions.
- MySQL schema/data as part of this frontend upload.
- Existing unrelated PHP files, upload directories, hosting configuration or the previous local website.

The root rules exclude `/api` and `/api/...`, PHP paths (including PATH_INFO), existing files/directories and missing `/assets/...` before the SPA fallback. Root DirectoryIndex prefers index.html; requests explicitly addressing existing PHP files still reach PHP. Existing physical directories intentionally take precedence over SPA paths: check for any old physical `shop/`, `admin/` etc. before upload; resolve a collision explicitly rather than deleting it.

## Production configuration and safety

`.env.production` selects API mode, `/api`, and disables the development proxy. Vite also loads `.env.local`; mode-specific `.env.production` takes precedence over the generic local file. `.env.production.local` and shell variables can override values, so run the production validation before future packages. Firebase and Maps browser values currently come from local configuration and are compiled at build time; editing Hostinger PHP config does not change them. Rebuild for browser-value changes. All five required browser settings were present; values were not printed.

The API client and catalogue media resolver force same-origin `/api` in production regardless of localhost development configuration. Customer/admin transports retain credentials: include and in-memory CSRF tokens. Production forces real API mode, even if a development mock setting is present. API errors never silently switch to demo catalogue/authentication. Backend authorization is still required on every protected operation.

Admin pages are guarded by PHP session verification; other unfinished admin modules remain labelled local previews and cannot submit commerce operations. Development checkout and design-system routes are not built. Production checkout is an explicit unavailable page; COD, Razorpay and order submission remain disabled. Customer sign-in uses Firebase Phone Authentication then PHP token verification. Missing provider configuration blocks authentication with a setup message. Browser Firebase state is memory-only; PHP sessions are authoritative.

No product prices, inventory, reviews or certification claims were invented. Catalogue values come from the existing API and must be reviewed by the owner before launch. Media remains honestly labelled placeholder imagery where missing. Journal drafts, contact/social placeholders and non-submitting newsletter remain visible as previously designed. This is an authentication/catalogue release, not a completed commerce launch.

## Local validation results

- `npm run build`: PASS; 1751 modules; production assets generated.
- All 27 pre-existing `scripts/check-*.mjs` invoked: 25 PASS, 2 opt-in live scripts SKIP (`check-browser-protocol.mjs`, `check-live-admin-anonymous.mjs`). Mock regression environment explicitly selected; API-specific suites select their API branch.
- New `node scripts/check-production-deployment.mjs`: PASS; configured browser fields (values withheld), same-origin API/media, credential transport, real production mode, rejected demo orders, root asset references, no dev chunks/source maps/private-key material, static rewrite exclusions.
- Offline PHP tests foundation/configuration/catalogue/dispatch/customer: 152 assertions PASS. Customer repository tests use SQLite adapters, not live MySQL or concurrency tests.
- Existing Windows bootstrap tests: synthetic valid and Unicode cases PASS; private temporary SQL deleted, no real administrator created or credentials used.
- Production preview: seven root/deep-link HTML requests and all nine JS/CSS assets returned 200 with appropriate non-HTML asset responses. Browser rendered homepage and unavailable checkout; `/admin` redirected to login without a session. Preview has no PHP backend, so API-dependent screens correctly error rather than fabricate data. No live login claim.
- ZIP CRC and exact file-set comparison with cleaned dist: PASS, 11 files. Public source README/.gitkeep markers excluded from dist/package.
- Apache/LiteSpeed rewrite execution, live Firebase SMS, Maps provider, real customer database persistence and real authenticated browser sessions: NOT TESTED in this deployment task; require manual upload and owner interaction.
- Disposable-hosted-MySQL integration suite not run: no disposable hosted test database supplied. No production database test writes performed.

Rebuild commands (PowerShell, from the project):

```powershell
Set-Location 'D:/Virasat Organics/virasat-organics-v2'
npm run build
node scripts/check-production-deployment.mjs
& 'C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' scripts/package-frontend.py
node scripts/check-production-deployment.mjs
```

The packager strips public README/empty-directory markers only from dist and creates the frontend ZIP plus checksum inventory. Regenerate this guide's inventory if rebuilding changes hashes/filenames. No PHP build or deployment is required for these frontend changes.

## Cache refresh and rollback

HTML requests receive no-cache/must-revalidate when mod_headers is available; JS/CSS filenames contain content hashes. After upload purge any Hostinger/CDN HTML cache, hard-refresh Chrome (Ctrl+Shift+R), and test in a private window. Confirm new hashed assets load. Do not publish stale index.html with a different assets set. No service worker is installed by this project.

For rollback, restore the exact backed-up root `.htaccess` and previous index files. If no frontend existed, remove only the newly uploaded index.html and restore/remove the root .htaccess according to its recorded prior state. Remove only new asset filenames listed in the manifest if necessary; retain pre-existing assets and never delete the entire assets or api directory. Do not roll back private backend/config.php or MySQL for this frontend release. Retest health/ready after rollback.

## Live acceptance checklist — owner executes after upload

Do not share passwords, OTPs, cookies, CSRF tokens or Firebase ID tokens in chat or screenshots.

- [ ] Confirm HTTPS certificate and canonical https://virasatorganics.com origin. Firebase Authentication authorized domains includes `virasatorganics.com`. Confirm SMS region/quota settings permit the intended Indian phone number. Confirm Maps key's website restrictions cover `https://virasatorganics.com/*` and required Maps JavaScript / Places APIs; restrictions were not inspectable locally.
- [ ] `/` and `/shop` render approved design and real catalogue; verify displayed prices/status/stock against your own records. Category routes and product navigation work.
- [ ] Open a product from the actual catalogue, copy its `/product/<slug>` URL into a fresh tab and refresh. Test `/account`, `/login`, `/admin/login`, a category route and an unknown route by direct navigation. Unknown frontend route shows the friendly not-found page.
- [ ] `/api/health` and `/api/ready` remain JSON and successful. `/api/does-not-exist` must remain an API JSON 404, never React HTML. `/assets/does-not-exist.js` must return 404, not index.html. Existing PHP entry points retain their behavior.
- [ ] Guest `/api/auth/me` returns JSON 401 UNAUTHENTICATED. `/api/auth/csrf` returns 200. Do not copy token values out of DevTools.
- [ ] Visit `/admin` signed out: redirected to admin login. Enter your real credentials privately in the browser. Verify admin session survives refresh; protected catalogue loads and logout revokes access. Invalid credentials must produce 401 with valid session/CSRF setup, not an origin 403. No real admin password was used in local packaging tests.
- [ ] On `/login`, enter your own phone number, complete the Firebase security challenge yourself, request one SMS and enter OTP privately. Invalid OTP must not create a PHP customer session. Valid OTP must cause POST `/api/auth/firebase-session` to return 200, followed by authenticated `/api/auth/me` 200. Inspect status only; do not export token-bearing requests. SMS can incur provider charges.
- [ ] Verify secure, HttpOnly customer cookie accepted by browser; refreshing restores PHP customer session, and logout makes `/api/auth/me` return 401. Customer login/logout must not authenticate or clear the separate administrator session. Mutations without valid CSRF remain 403.
- [ ] In phpMyAdmin privately verify exactly one customer for the test Firebase UID/phone after first successful sign-in; repeat sign-in updates/reuses it, not a duplicate. A read-only `SELECT COUNT(*) AS customer_count FROM customers;` before/after helps for a genuinely new test user. Existing customer sign-in should not increase the count. Do not expose personal rows or UID values in chat. This upload has no SQL migration; prior Phase 7C schema prerequisites still apply.
- [ ] Save customer name/email; refresh and sign out/in to confirm persistence. Verified phone is not editable as a normal profile field.
- [ ] Create, edit and set a default address; refresh to confirm database-backed persistence. Delete only your disposable test address. Another customer must not see those addresses.
- [ ] Toggle wishlist on a real product; refresh and re-login to verify owner-scoped persistence. Logout must not leak another customer's wishlist.
- [ ] Open location selection; test real Google Places suggestions. Select a result, adjust if desired, and explicitly confirm coordinates. Verify saved coordinates match that selection; requesting GPS requires your browser permission and must remain optional.
- [ ] Test manual address/PIN entry without location permission or Maps access. Confirm no fabricated coordinates or claims of verified delivery coverage.
- [ ] `/checkout` says coming soon; COD and online payments cannot be selected or submitted. `/dev/checkout` and `/design-system` are unavailable in production. No fake success/order confirmation is generated.

If any live test fails, retain only safe HTTP status, error code and request ID. Do not weaken CSRF, cookies or origin checks. Provider tests remain unverified until the owner completes them.

## Changed source/support files

- `.env.production`
- `vite.config.js`
- `src/services/apiClient.js`
- `src/services/catalogueApi.js`
- `src/pages/CheckoutPreview.jsx`
- `public/.htaccess`
- `scripts/check-production-deployment.mjs`
- `scripts/package-frontend.py`
- `FRONTEND_HOSTINGER_UPLOAD.md`
- Generated `dist/` and `deployment/` files below.

## Exact ZIP contents / upload map

Each listed relative path goes directly under `domains/virasatorganics.com/public_html/`:

- `.htaccess`
- `assets/AdminManagementPage-BNCTZNh9.js`
- `assets/AdminManagementPage-D1JY7l5z.css`
- `assets/CMSWorkspace-CpDFCUq2.js`
- `assets/index-DE71NmC1.css`
- `assets/index-DndnveOO.js`
- `assets/index.esm-Bi4P41uy.js`
- `assets/index.esm-Cm2M2pw6.js`
- `assets/index.esm-DEruQ0TR.js`
- `assets/RealAccountPage-BpF3Anp5.js`
- `index.html`

ZIP SHA-256: `82b08d72c3d3dbf7cbbaab2e9e7ed64cfc924024f9a25892680fbfeee47794ed`

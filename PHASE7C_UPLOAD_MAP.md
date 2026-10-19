# Phase 7C — exact Hostinger upload map

19 October 2026. Implemented and packaged locally. Nothing uploaded or committed.
Admin authentication success is owner-reported; existing anonymous live admin
security checks still pass. Customer endpoints are not deployed (observed 404).

## Incremental package

`D:/Virasat Organics/virasat-organics-v2/backend/deployment/phase7c-customer-incremental.zip`

The ZIP contains exactly seven new/changed PHP runtime/reference files under
virasat-backend/. It excludes config.php, SQL, private keys, logs, media,
node_modules and unchanged PHP. Extract locally first; upload files individually
to the paths below, not to public_html. Do not extract over your whole backend.
Checksums: backend/deployment/phase7c-checksums.json.

| Exact local source | Exact Hostinger destination | Action | Visibility | Backup | Migration |
| --- | --- | --- | --- | --- | --- |
| `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/FirebaseIdentity.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/FirebaseIdentity.php` | CREATE | Private | If already present, stop and compare/backup | 003 before customer routes |
| `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/CustomerSecurity.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/CustomerSecurity.php` | CREATE | Private | If already present, stop and compare/backup | 003 before customer routes |
| `D:/Virasat Organics/virasat-organics-v2/backend/app/Services/CustomerAccounts.php` | `domains/virasatorganics.com/private/virasat-backend/app/Services/CustomerAccounts.php` | CREATE | Private | If already present, stop and compare/backup | 003 before customer routes |
| `D:/Virasat Organics/virasat-organics-v2/backend/app/Controllers/CustomerController.php` | `domains/virasatorganics.com/private/virasat-backend/app/Controllers/CustomerController.php` | CREATE | Private | If already present, stop and compare/backup | 003 before customer routes |
| `D:/Virasat Organics/virasat-organics-v2/backend/bootstrap/load.php` | `domains/virasatorganics.com/private/virasat-backend/bootstrap/load.php` | REPLACE | Private | Yes | 003 before customer routes |
| `D:/Virasat Organics/virasat-organics-v2/backend/bootstrap/app.php` | `domains/virasatorganics.com/private/virasat-backend/bootstrap/app.php` | REPLACE | Private | Yes | 003 before customer routes |
| `D:/Virasat Organics/virasat-organics-v2/backend/config/firebase.example.php` | `domains/virasatorganics.com/private/virasat-backend/config/firebase.example.php` | CREATE | Private | If already present, stop and compare/backup | 003 before customer routes |

The only additional new PHP file is an offline CLI test, deliberately excluded
from the deployment ZIP: local
`D:/Virasat Organics/virasat-organics-v2/backend/tests/customer.php`.
It needs no production upload. If retained on a separate test installation, CREATE
`domains/virasatorganics.com/private/virasat-backend/tests/customer.php` (private;
back up if an existing file is present). Never place it in public_html. It uses
synthetic in-memory SQLite and RSA fixtures, not the Hostinger database.

No changes in public_html/api. No replacement of the existing public index or
.htaccess. NEVER overwrite, rename, include in ZIP or replace
`domains/virasatorganics.com/private/virasat-backend/config/config.php`.

## Backup and safe order

1. Back up the V2 database in phpMyAdmin and the two current bootstrap files.
   Keep backups private. Save the existing frontend build separately if updating it.
2. Select the V2 database in phpMyAdmin. Run the verification queries below.
   If tables/indexes differ, stop; do not rerun initial migrations or seeds.
3. Import ONLY `backend/database/migrations/003_customer_uid_case.sql` through
   phpMyAdmin's Import tab. This alters Firebase UID collation to case-sensitive
   utf8mb4_bin. It does not delete/seed accounts or change admin tables.
4. Upload the four new app files first. Upload firebase.example.php as a reference
   only (not executed by the loader). Upload bootstrap/load.php next, and
   bootstrap/app.php LAST, preferably using a temporary filename then rename.
   This avoids registering routes before their classes exist.
5. Keep storage/sessions at the existing private path, writable only as needed
   by the hosting PHP user. The public Google certificate cache and lock are
   created there automatically; no new directory or permission 777 is required.
6. Enable the required Firebase project setting manually, preserving all existing
   settings/credentials. Do not replace the file with firebase.example.php.
7. Run post-upload checks, then configure/build the frontend separately. The PHP
   archive does not contain frontend dist. No automatic upload has occurred.

## phpMyAdmin checks and migration

Before import, verify the selected DB, existing columns and unique indexes:
```sql
SELECT DATABASE();
SHOW FULL COLUMNS FROM customers;
SHOW INDEX FROM customers;
SHOW FULL COLUMNS FROM addresses;
SHOW INDEX FROM wishlist_items;
SELECT firebase_uid, COUNT(*) AS n FROM customers GROUP BY firebase_uid HAVING n > 1;
SELECT phone_e164, COUNT(*) AS n FROM customers WHERE phone_e164 IS NOT NULL GROUP BY phone_e164 HAVING n > 1;
```
Keep results containing customer identities private. Required indexes:
uq_firebase, uq_phone and wishlist_items primary key(customer_id,product_id).
Existing addresses columns include latitude/longitude/coordinates_confirmed and
customers.default_address_id. No additional columns are needed.

Import the one incremental SQL file, then verify:
```sql
SELECT COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLLATION_NAME
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='customers' AND COLUMN_NAME='firebase_uid';
SHOW INDEX FROM customers;
SELECT COUNT(*) AS broken_defaults
FROM customers c LEFT JOIN addresses a ON a.id=c.default_address_id
WHERE c.default_address_id IS NOT NULL
AND (a.id IS NULL OR a.customer_id<>c.id OR a.deleted_at IS NOT NULL);
```
Expected firebase_uid: varchar(128), NO, utf8mb4_bin. broken_defaults must be zero.
001/002 and their checksums/manifest remain immutable. 003 is a standalone
operator-applied alteration, verified by the collation query; it is not inserted
into the original migration ledger or silently marked applied by this release.

## Firebase owner setup

Use the new project's real Firebase project ID. Either set PHP environment
`VIRASAT_FIREBASE_PROJECT_ID`, or manually add ONLY this non-secret array entry
inside the existing config.php returned array:
```php
'firebase' => ['project_id' => 'YOUR_ACTUAL_PROJECT_ID'],
```
Replace the example with the owner's actual ID; do not deploy the literal text.
The existing Configuration::load(config/config.php) remains the loader.
No config.local.php assumption, service account or private signing key is needed.
PHP requires OpenSSL, cURL with CA trust, PDO MySQL and existing sessions.
Outbound verified HTTPS to Google's fixed securetoken public certificate URL is
required. Cache-Control TTL is honored (capped at six hours); no stale-key use.
Provider failure is explicit, never a fake login.

In Firebase: register a Web App, enable Phone authentication, configure SMS region
policy for India, authorized domain(s), billing/quotas and abuse controls.
Do not disable reCAPTCHA or enable an emulator/testing bypass in the application.
The sign-in notice explains Google phone processing. Review privacy/consent text
and provider billing before public launch. No live SMS was sent by Codex.

Frontend variables (copy actual PUBLIC web settings to ignored .env.local):
```dotenv
VITE_DATA_MODE=api
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_GOOGLE_MAPS_BROWSER_KEY=
```
Keep existing localhost API proxy and trusted HTTPS settings. Restart Vite after
env changes. For a hosted frontend set VITE_API_PROXY_ENABLED=false and
VITE_API_BASE_URL to that site's HTTPS /api endpoint; never ship localhost proxy
settings in a hosted build. Never place service-account keys in VITE_ variables.

## Hosted provider testing

Firebase phone authentication does not support localhost as a hosted domain.
The UI deliberately blocks live SMS initiation there, even when web config exists.
Local URL https://localhost:5190/login is for UI/unconfigured and PHP proxy tests.

Proposed separate staging origin: https://staging.virasatorganics.com. It is NOT
created or verified by this work. Owner must provision DNS/TLS, an isolated V2
frontend/API/private backend and disposable test DB, authorize this exact domain
in Firebase, set the staging backend app_origin/cors_origins to that HTTPS origin,
and point the staging frontend to https://staging.virasatorganics.com/api with
Vite proxy disabled. The public API bootstrap path must reference the staging
private backend. Use its own config.php; never change production DB credentials.
Alternatively, owner-authorized testing on the actual production origin uses its
existing same-origin API and creates REAL customer records. Do not describe it
as a disposable staging test. No arbitrary origins or wildcard CORS.

## Google Maps/Places setup

Enable Maps JavaScript API and Places API (New), billing and usage limits in the
owner's project. Use a browser key restricted by exact approved HTTPS referrers
(production and chosen staging, plus https://localhost:5190/* only if desired).
Restrict APIs to Maps JavaScript and Places API (New). No server secrets in JS.
Autocomplete uses PlaceAutocompleteElement/gmp-select and fetchFields for
location/addressComponents. Map only appears after a real selected/GPS position;
there is no invented default coordinate. Click map to adjust, then explicitly
confirm. Editing address text clears previously confirmed coordinates.
Browser geolocation runs only after clicking Use current location. Denial/error
leaves manual entry working. Reverse geocoding is NOT enabled/required in this
release. A place or PIN is never proof of serviceability, shipping price or COD.

## Post-upload test order

1. health/ready/products/categories remain successful. Admin sign-in/refresh/
   catalogue edits must still work. Customer/admin cookies are different.
2. GET /api/auth/csrf returns JSON and a separate Secure/HttpOnly customer cookie.
   GET /api/auth/me and /api/me/addresses without customer login return 401.
   POST without valid same-session CSRF returns 403. Do not copy tokens into chat.
3. With CSRF but no Firebase project setting, exchange returns 503
   FIREBASE_UNCONFIGURED. With configured project, malformed/forged/expired/wrong
   project or non-phone tokens return 401. Google outage returns explicit 503.
4. On authorized hosted origin, owner requests a real SMS and enters the code
   directly. Verify account created exactly once, refresh restoration, profile
   save, read-only phone and logout. Returning identity must reuse the same row.
5. Create/edit/default/delete addresses. Default must remain unique. Test two
   independent customer browser sessions: foreign address IDs must return 404;
   own stale versions 409; missing versions 428. Review transaction behavior on
   MySQL under concurrent default/address writes before launch.
6. Save each visible product, retry additions (no duplicates), remove, reload,
   log out, sign in as another customer (no wishlist leakage). Inactive omitted;
   saved coming_soon/out_of_stock still cannot enter cart.
7. Configure Maps and test actual suggestions, pin adjustment, permission denial,
   explicit coordinates confirmation and manual fallback on mobile/desktop.

## Contract notes and session limits

GET auth/me returns {customer,csrfToken}; guests receive 401. Added GET auth/csrf
provides the pre-login handshake. Logout clears/regenerates ONLY the customer
session and returns {customer:null,csrfToken}. Profile PATCH requires If-Match.
Address POST requires Idempotency-Key, returns the updated list with 201;
PATCH/DELETE require If-Match and return the updated list with 200. DELETE wishlist
uses /api/me/wishlist/{productId}. Wishlist returns visible product IDs.
These explicit projections adapt the earlier proposed contract to existing UI.

Customer identity lives in a separate __Host-virasat_customer cookie, using the
same private session directory. Firebase SDK persistence is memory-only; server
session restores the account after refresh. No SDK/ID-token credentials in browser
storage. OTP exchanges require auth_time within five minutes. Customer PHP sessions
expire after at most one hour absolute and existing idle timeout; disabled MySQL
accounts are rejected on each request. No online Firebase revocation lookup is
implemented: provider-side revocation is not immediate for an existing PHP session.
Do not claim otherwise; an operator can disable the MySQL customer immediately.
Guest cart remains browser-local intent. Guest wishlist is not automatically
merged into an account. Authentication/identity is never trusted from local state.

## Rollback

Restore the backed-up bootstrap/app.php first to unregister customer routes, then
restore bootstrap/load.php. Existing admin/catalogue remain available. New private
class files can remain unused until investigated; never delete sessions/media or
config.php. Restore prior frontend build or explicitly use mock only for isolated
development. Keep the binary UID collation (safe for old code). Reverting it can
collapse case-distinct identities and requires a reviewed backup/duplicate audit;
do not blindly revert the ALTER or delete customer records.

## References

- https://firebase.google.com/docs/auth/web/phone-auth
- https://firebase.google.com/docs/auth/admin/verify-id-tokens
- https://developers.google.com/maps/documentation/javascript/place-autocomplete-new

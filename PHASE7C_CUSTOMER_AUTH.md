# Phase 7C — customer identity and account integration

19 October 2026. Local implementation complete; provider and Hostinger customer
integration acceptance remain blocked until configuration, upload and live tests.
No deployment, commit, admin reset, config.php change or old website modification.

## Implemented
- Modular Firebase Web Auth, visible reCAPTCHA lifecycle, +91 validation,
  six-digit OTP, resend cooldown, edit/reset, safe error mappings, memory-only SDK
  state, PHP exchange, server restoration and logout. Explicit unconfigured and
  unsupported-localhost states; no homemade OTP or API-mode demo bypass.
- Google public certificate RS256 verification in PHP: issuer/audience/time/UID,
  signature, key validity and phone-provider/phone-identity checks; fixed verified
  HTTPS key fetch/cache, bounded token size and rate limits. No service-account key.
- Separate secure customer session cookie and CSRF handshake; admin unchanged.
- MySQL customer creation/conflict protection; profile PATCH with version guard;
  owner-scoped addresses, 20-address limit, row-locked default pointer/deletion,
  idempotent create and validated nullable confirmed coordinates; unique wishlist.
- Existing luxury UI/CSS reused, real account screen and adapters; profile phone
  readonly, server wishlist, no mock fallback, guest cart isolated. Focus refresh,
  expiry errors, no credentials/profile/address persistence to localStorage.
- Places (New), Maps position adjustment, explicit browser geolocation and
  confirmation, manual address/PIN fallback. No fabricated coordinates/coverage.

## Files
Backend new: app/Services/FirebaseIdentity.php, CustomerSecurity.php,
CustomerAccounts.php; app/Controllers/CustomerController.php;
config/firebase.example.php; database/migrations/003_customer_uid_case.sql;
tests/customer.php. Modified bootstrap/app.php and load.php only among existing PHP.

Frontend new: services/firebasePhone.js, customerApi.js, mapsService.js;
state/useCustomerAccount.js; components/auth/FirebaseAuthFlow.jsx;
components/account/RealLocationSelector.jsx; pages/RealAccountPage.jsx.
Updated: state/StorefrontContext.jsx; components/auth/AuthFlow.jsx, AuthOverlays.jsx;
components/Header.jsx; components/account/AddressForm.jsx, LocationSelector.jsx;
pages/AccountPage.jsx, LoginPage.jsx, WishlistPage.jsx; layouts/SiteLayout.jsx.
Added .env.phase7c.example and scripts/check-customer-api.mjs. package.json/lock
add Firebase and patched gRPC override; Firebase App/Auth are the only SDK imports.
Runtime temporary diagnostics were not added. Build regenerates dist.

## Validation
- npm run build PASS, account and Firebase modules split into lazy chunks.
- All existing check scripts PASS in explicit mock test process; new customer API
  suite PASS in explicit API mode. Vite's first post-install SSR scan reported an
  outdated request during short-lived test-server shutdown, not a failed build.
- Existing offline PHP regressions PASS: 36 foundation, 13 configuration, 40 catalogue and 10 bootstrap dispatch checks.
- PHP syntax checks PASS. 53 offline customer checks PASS with existing PHP CLI, OpenSSL
  and in-memory SQLite (no Apache/MySQL/XAMPP services started).
- Synthetic real RSA signature verification/rejection; expired/wrong project/
  forged tokens, identity conflicts, disabled account, profile version/phone
  allowlist, foreign ownership, address default rollback/idempotency, wishlist
  isolation/inactive filtering, CSRF and customer/admin cookie isolation tested.
- SQLite shim tests repository behavior, NOT MySQL locking/concurrency. Live DB
  schema/collation migration, transaction contention and customer endpoints remain
  unverified until operator deployment/testing.
- Browser: real API-mode sign-in shows Firebase not configured and disables SMS;
  Maps-unconfigured manual PIN dialog works and rejects short PIN; render-loop
  regression found and fixed by keeping context dispatch identity stable.
- Existing live anonymous admin suite PASS: session200, protected401, invalid
  login401, missing/invalid CSRF403, foreign Origin403, five products/two categories.
- npm audit after patched gRPC override: zero vulnerabilities.

## Remaining live acceptance / Phase 7D prerequisites
Owner must configure Firebase/Maps public settings and PHP Firebase project ID,
apply the case-sensitive UID migration, upload the seven PHP files and validate
hosted SMS, server-created sessions/accounts, MySQL ownership/concurrency and
Google Maps behavior. No SMS, Maps lookup or real customer login has been claimed.
Provider revocation is bounded by PHP session expiry, not an immediate online
revocation lookup; see upload guide. Geocoding/delivery pricing/COD eligibility
and real checkout/order APIs remain Phase 7D. Confirm business delivery rules,
charges, stock/prices and hosted authentication acceptance first.

## Deliverables
- backend/deployment/phase7c-customer-incremental.zip (seven PHP files only)
- backend/deployment/phase7c-checksums.json
- backend/database/migrations/003_customer_uid_case.sql (separate phpMyAdmin import)
- PHASE7C_UPLOAD_MAP.md (every destination, order, backup, configuration and rollback)
- Preview: https://localhost:5190/login

# Phase 4 — Customer account, addresses and location

## Delivered
/account provides a personalized demo greeting, profile summary, saved-address count, recent-orders placeholder and quick links. A reusable responsive sidebar/navigation links Overview, Profile, Addresses, Orders and Wishlist with Logout. Guests redirect to /login with their intended account path preserved.

/account/profile edits name, unverified mobile and optional email through the existing customer service module. Validation uses the shared auth helpers; confirmation says Saved in this demo session. Mobile changes are never verified.

/account/addresses supports multiple Home/Work/Other addresses, stable UUIDs, add/edit, inline field errors, default selection, explicit delivery selection and confirmed deletion. Required recipient/contact/building/street/locality/city/state/PIN fields are validated; country is fixed to India. Landmark and instructions are optional. Removing the default promotes the first remaining address. Removing a selected address clears its selection/PIN.

## Session data and ownership
The existing StorefrontContext remains the sole state store. Each demo session now has a unique instanceId and an addresses array. New async helpers in customerService.js validate and transform only that session's records; they never write addresses to the shared fixture store. Every address carries customerId and sessionId. Stale actions and foreign address IDs are rejected. Profile/address data is discarded on refresh/logout and omitted from localStorage.

Selecting a saved address updates the header PIN in memory; its PIN is excluded from persistent preferences. A standalone PIN explicitly entered through the location tools continues using the pre-existing browser-local location preference. The PIN is not proof of coverage. No server, customer authentication or identity records are created.

## Shared location tools
LocationSelector is reusable by the header overlay, product PIN checker, address form and future checkout. It offers:
- Validated six-digit PIN entry.
- Clearly marked DEMO city/state suggestions from mock-data/account.js.
- A current-location placeholder explaining that GPS capture awaits integration.

No geolocation permission is requested, no maps/Places API is called, no coordinates are generated and no serviceability is inferred. Demo city suggestions can fill city/state in address forms; a PIN must be supplied separately. Header selection stores only an explicit PIN. A slim delivery-location row supplements the existing header. The existing product checker remains the source of static coverage feedback.

## Files
Added:
- src/pages/AccountPage.jsx
- src/components/account/LocationSelector.jsx
- src/mock-data/account.js
- src/styles/account.css
- scripts/check-account-addresses.mjs
- PHASE4_ACCOUNT_ADDRESSES.md

Updated services/customerService.js, services/authService.js, state/store.js, state/StorefrontContext.jsx, App.jsx, SiteLayout.jsx, Header.jsx and components/product/DeliveryPreview.jsx. Generated dist updated. No dependencies added. Existing login UI, cart, wishlist, homepage, shop, footer and product catalogue remain intact.

## Validation — 16 October 2026
npm run build and all twelve check scripts passed.
New automated checks cover profile/address validation, stable add/edit IDs, deletion, single default and fallback default, ownership isolation, stale-session rejection, selected-address PIN clearing, reset/persistence exclusion, safe login return paths and explicitly static suggestions without coordinates or live location calls.

Browser checks:
- Guest /account/addresses redirects to login and returns to that destination after explicit demo continuation.
- Required-field errors, address add/edit and delivery selection update the header.
- Delete confirmation cancel preserves the address; confirm removes it.
- Profile save uses session-only language.
- Demo suggestions and GPS placeholder show honest disclosures.
- A fresh session contains none of the prior session's addresses.
- Account/address layouts at 320, 390, 768, 1024 and 1440px show no horizontal overflow.
- Account dashboard visually reviewed; modal field labels remain stable when errors are shown.
- Existing modal Escape/focus behavior reused. No checkout or real order flow was added.

## Limitations and future integration
Demo ownership checks isolate UI state, not authenticated access. No Firebase authentication, PHP/MySQL APIs, Google Maps, backend persistence or real delivery check exists. Orders remain placeholders; checkout/payments/admin CRUD are outside this phase.

Future implementation needs verified authentication and server-side ownership enforcement, PHP address/profile endpoints, database persistence, and separately authorized Google Maps/Places/geolocation integration with actual returned coordinates. Real delivery zones remain a separate configuration/API concern.

Test profile/address details were synthetic, used only for QA and cleared with the test session. No old website changes, deployment or commit.
Preview: http://127.0.0.1:5174/account (guest redirects to demo login).

# Phase 4 — Customer authentication UI prototype

## Implementation
One AuthFlow is reused by /login and the header account modal. Desktop uses the existing ModalShell; mobile fills the viewport with a scrollable form. Every step displays DEV DEMO MODE and explicitly states no SMS is sent and no identity is verified.

Mobile entry accepts a ten-digit Indian-format number beginning 6–9, normalizes spaces/formatting and optional +91 prefix, and shows accessible errors. The six-digit field supports normal paste and numeric entry, receives focus on step change and offers format-only feedback. A 30-second timestamp-based countdown controls Resend demo preview. Resending only resets the local preview. No fixed code is accepted as authentication, and no verification endpoint exists.

Continue as Demo Customer is separate from code-format checking. An optional profile step validates full name and optional email, displaying the mobile number as unverified. All profile/session values live only in the existing context's memory, not localStorage. Refresh and Logout and reset demo discard them. Cart, wishlist and location persistence are unchanged.

The active account icon opens an account drawer with My Account, My Profile, My Addresses, My Orders, Wishlist and logout. /account and nested customer routes remain placeholders behind a presentation-only CustomerGate. This is not a security boundary. Mobile navigation retains its account link; /account offers the same demo login handoff.

Eligible checkout carts now hand off to /login?returnTo=/checkout when no demo session exists. After demo completion they return to the existing checkout placeholder. Invalid or empty carts remain blocked by existing checks. No checkout screens, order history, addresses, payments or real orders are implemented.

## Architecture and files
Added src/mock-data/auth.js, src/services/authService.js, src/components/auth/AuthFlow.jsx, src/components/auth/AuthOverlays.jsx, src/pages/LoginPage.jsx, src/styles/auth.css, scripts/check-auth-ui.mjs and this report.
Updated state/store.js, App.jsx, Header.jsx, SiteLayout.jsx and CheckoutPreview.jsx. Build regenerates dist.
The mock adapter separates normalization, format simulation, optional-profile validation and explicit unverified-session creation from UI. Return paths are limited to expected customer/checkout routes. Unique form IDs support a modal opened above /login without label collisions.

## Validation — 16 October 2026
Production build and all eleven regression scripts passed, including check-auth-ui.mjs.
New checks cover mobile normalization/validation, OTP format-only semantics (verified always false), no SMS/network implementation, demo disclosures, optional-profile validation, safe return paths, demo session creation/logout and exclusion of session data from persisted state.

Browser checks: header entry, number errors, normalized entry, short/six-digit format feedback, optional registration, demo completion, account menu, logout, protected placeholder and session reset after refresh. Escape restores focus and unlocks scrolling through the existing modal shell. Login page widths 320/390/768/1024/1440 have no horizontal overflow. Narrow mobile visual review found and fixed modal-width and prefix shrink issues. OTP uses one labelled input for keyboard and paste accessibility, not six fragile independent fields.

## Limitations and future integration
This is a static prototype, not phone authentication or registration. No SMS provider, Firebase SDK, CAPTCHA, tokens, backend or server session exists. Session state is memory-only and is neither persisted nor synchronized between tabs. Use demo data when trying the optional fields.

Future real authentication requires Firebase reCAPTCHA configuration, actual SMS sending and abuse controls, Firebase ID tokens, PHP backend token verification, secure server-managed sessions and user profile persistence. These requirements need a separate security-reviewed implementation; current demo values must never be trusted as authorization.

Old website untouched. No deployment or commit.
Preview: http://127.0.0.1:5174/login
Countdown expiry and Resend demo preview were also exercised in the browser; resend restarted the 30-second countdown without any SMS claim.

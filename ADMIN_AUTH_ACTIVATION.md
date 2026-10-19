# Real admin authentication — local activation

The local frontend is configured for real PHP API mode. No Hostinger files,
config.php, database credentials or admin records were changed.

## Start and open
Run npm run dev from D:/Virasat Organics/virasat-organics-v2.
Open https://localhost:5190/admin/login (not the old mock server on port 5174).
Sign in with admin@virasatorganics.com and the password ONLY in the browser form.
Do not send the password to Codex or enter it in shell commands.

The ignored .env.local is already configured:
    VITE_DATA_MODE=api
    VITE_API_BASE_URL=https://virasatorganics.com/api
    VITE_API_PROXY_ENABLED=true
    API_PROXY_ENABLED=true
    API_PROXY_TARGET=https://virasatorganics.com
    DEV_HTTPS_CERT=C:/ProgramData/VirasatOrganics/localhost-tls/localhost.pem
    DEV_HTTPS_KEY=C:/ProgramData/VirasatOrganics/localhost-tls/localhost-key.pem

The user approved a localhost-only certificate trusted in CurrentUser/Root.
Its private key is outside Git with current-user-only permissions. It expires
30 days after creation. Renew the certificate before expiry; never disable TLS
verification or remove Secure/HttpOnly cookie flags. No local PHP/MySQL services
are used. Vite forwards API requests to Hostinger over verified HTTPS.
The proxy rejects foreign browser Origins before rewriting the approved local
Origin to the upstream application Origin. No wildcard credentialed CORS.

## Implemented frontend behavior
/admin and all children verify GET /api/admin/session. Anonymous visitors are
redirected to /admin/login with a restricted local return path. Login obtains a
fresh CSRF/session handshake then POSTs /api/admin/login. Password inputs are
cleared after submission and never logged or stored in localStorage.
Server cookies stay Secure, HttpOnly, SameSite=Lax. CSRF tokens stay in memory.
A 401 or CSRF failure invalidates cached authentication and record versions.
Session is checked on refresh and window focus. Logout uses the server endpoint
and clears frontend auth, then returns to the login route. Errors never fall back
to mock identity/data. Server permissions remain authoritative for every write.
Existing real product/category service adapters and editors are preserved.
Other CMS/customer/order modules remain explicitly labelled local previews.
Mock mode is an explicit DEVELOPMENT option: set VITE_DATA_MODE=mock and restart
Vite. Production builds always use the real API gate, never demo admin access.

## Live verification on 18 October 2026
After the operator created private/virasat-backend/storage/sessions, the live
anonymous checks through the trusted local HTTPS proxy PASS:
- /api/admin/session: 200, anonymous session with Secure/HttpOnly/SameSite=Lax cookie.
- /api/admin/products without authentication: 401 (expected).
- Login without CSRF: 403 (expected).
- Synthetic invalid credentials with the session CSRF token: 401 (expected).
- /api/products: 200, five records; /api/categories: 200, two records.
- Anonymous logout with the same session CSRF token: 200.
- Foreign browser Origin rejected by local proxy: 403.
The cross-request CSRF checks demonstrate working session persistence. The local
configuration template points to dirname(__DIR__).'/storage/sessions', which maps
to domains/virasatorganics.com/private/virasat-backend/storage/sessions for the
reported installation. Session initialization checks the configured directory is
writable and outside the document root. Remote config.php, ownership and numeric
permissions were not directly inspected; operational session checks now pass.
No PHP hotfix, config.php change or upload is needed for this resolved failure.

## Next action
Reload https://localhost:5190/admin/login or click Retry connection, and enter the
real administrator credentials directly in the browser. Never send the password
in chat. Successful REAL admin login, authenticated catalogue loading, refresh
persistence and authenticated logout still require that browser sign-in; they
have not yet been verified. The live checks used only synthetic invalid credentials.
## Tests and commands
npm run build: passed in API mode.
Existing regression scripts plus check-admin-auth.mjs passed with explicit
VITE_DATA_MODE=mock, API_PROXY_ENABLED=false, VITE_API_PROXY_ENABLED=false in the
TEST process only. check-api-mode explicitly overrides to api for its assertions.
Mocked auth tests cover safe redirects, invalid login, successful server-shaped
session response, CSRF handshake/rejection, logout and expired-session handling.
These mocked successes are not live login verification.
Live anonymous test (no real credentials):
    node scripts/check-live-admin-anonymous.mjs --run
Passed after the session directory was created. It prints only status/count
metadata, never cookies, tokens, credentials or response bodies.

## Changed files
src/App.jsx; src/components/admin/AdminApiGate.jsx;
src/layouts/AdminLayout.jsx; src/services/catalogueApi.js; vite.config.js;
ignored .env.local; scripts/check-admin-auth.mjs;
scripts/check-live-admin-anonymous.mjs; this document.
No PHP change or deployment ZIP is needed for the frontend activation itself.
No commit/deploy performed; old website untouched.

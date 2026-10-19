# Browser admin login origin fix — 19 October 2026

Confirmed reproduction in the connected Chromium in-app browser: the HTTPS React
login page showed an invalid API response. Temporary non-secret request tracing
showed HTTP/2, :authority=localhost:5190, absent Host and GET Origin,
Referer=https://localhost:5190/admin/login, Sec-Fetch-Site=same-origin and
Sec-Fetch-Mode=cors. The local guard ran before the proxy and rejected absent Host.
Earlier Node https tests sent HTTP/1.1 Host, so they missed this defect.
The guard's plain-text rejection caused the API client's JSON parsing message.

Fix: validate HTTP/1.1 Host or HTTP/2 :authority against exactly localhost:5190;
reject conflicting headers, other ports, IP authorities and foreign origins.
Mutation Origin remains required. Local errors now use JSON and no-store.
Temporary request tracing was removed. No secrets or token values were logged.
The proxy still sets upstream Origin=https://virasatorganics.com and changeOrigin
sets upstream Host=virasatorganics.com. Referer is not an authorization mechanism.
PHP exact Origin/CSRF/session/permissions and config.php are unchanged.

Stopped three V2 Vite processes and started one clean instance at
https://localhost:5190. Use this exact HTTPS URL, not HTTP or 127.0.0.1.
The server is TLS-only; HTTP allowlist membership does not make it an HTTP server.
127.0.0.1 authority is deliberately not authorized. No broad loopback bypass.

Validation:
- Actual browser React bootstrap clears the invalid-response alert.
- Actual browser form with synthetic invalid credentials displays
  Invalid email or password; no real admin credentials used.
- Live HTTP/2: session 200; same-cookie CSRF persistence confirmed in memory;
  anonymous products 401 JSON UNAUTHENTICATED; missing CSRF 403;
  unrelated Origin and 127.0.0.1 authority 403; Secure/HttpOnly cookie confirmed.
- Live HTTP/1.1 suite passes, including invalid credentials 401 and invalid CSRF 403.
- npm run build passes; all existing check scripts pass (live scripts opt-in).
- The connected browser is the Codex Chromium in-app browser, not the owner's
  separate Chrome profile. Real successful admin login remains owner verification.

Changed: scripts/local-api-origin-guard.mjs, scripts/check-local-api-origin.mjs,
scripts/check-browser-protocol.mjs, this report. No PHP ZIP needed.

Owner action: open https://localhost:5190/admin/login in Chrome and Ctrl+Shift+R.
No broad cache/cookie deletion is required. Enter credentials only in the form.
If restarting, stop this server with Ctrl+C, then in the V2 directory run npm run dev.
Do not run another instance or use an old port. No deployment or commit performed.
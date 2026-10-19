# Configuration filename hotfix
The Phase 7A bootstrap previously read only config/config.php. This patch supports
config/config.local.php as the preferred private runtime configuration.
A present but invalid local file fails closed; it never falls back to config.php.
Missing operator configuration still fails, even when the example exists.
No credentials were read, bundled or changed. No deployment was performed.

## Upload
Back up the following existing files privately first. In the actual private backend
folder containing app/, bootstrap/, bin/ and config/ (outside public_html),
replace only these archive entries at their matching relative paths:
- app/Services/Configuration.php
- bootstrap/app.php
- bin/migrate.php

If your retained layout is domains/virasatorganics.com/private/virasat-backend/,
that is the destination root. If you moved/renamed it, use the actual private
backend root already referenced by public_html/api/index.php.
Do not upload this patch into public_html/api. Do not replace index.php.
Do not upload operator documentation or the test files to the public directory.

Keep config/config.local.php private. It must return a PHP array. Supported shape:
    <?php
    return [
      'db' => [
        'host' => '<existing Hostinger database host>',
        'port' => 3306,
        'name' => '<existing database name>',
        'user' => '<existing database user>',
        'password' => '<existing password>',
      ],
    ];

Preserve your actual values; the above strings are placeholders, not credentials.
A full array matching config/config.example.php is supported too.
Flat DB_HOST constants, dotenv text, and a file that does not return an array are
not supported. Never paste credentials into chat.
The existing config/config.example.php must remain in place for non-secret
defaults. No real config file is included in this patch. Local overrides replace
CORS lists as a whole; HTTPS/origin restrictions remain enforced.

## Verify
Open https://virasatorganics.com/api/health after replacing the three files.
Expected HTTP 200 with data.status = ok. Health does not test the database.
Then open https://virasatorganics.com/api/ready. This separately verifies database
connectivity and migration/schema readiness. A health success alone is not proof
that migrations 001–003 were imported.
If health still fails, check that the private filename is exactly
config/config.local.php (Linux filenames are case-sensitive) and it returns an
array of the shape above. Check the private Hostinger PHP error log using the new
response requestId; do not turn display_errors on or share credentials.
Remote host/path/config contents and migration readiness remain unverified.

## Rollback
Restore the three private files from your backup together. The old code requires
the original config/config.php filename; keep the backup private. No database
migration, data changes, frontend changes or public bootstrap changes are made.

## Local tests
13 configuration resolution/security assertions passed.
36 existing database-free foundation assertions passed.
14 real-bootstrap CLI cases passed (legacy and local configuration), including
health 200, readiness 503 with blank DB, HTTPS/CORS/method restrictions.
Changed runtime/migration PHP files passed syntax checks.
These are isolated CLI tests, not live Hostinger/database tests.

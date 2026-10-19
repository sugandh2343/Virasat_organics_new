# Secure first administrator bootstrap
18 October 2026

## Inspected state and verification limits
The actual local generator is backend/bin/bootstrap-admin.php (with a hyphen),
not bootstrapadmin.php. It remains unchanged. It accepts JSON on stdin and emits
SQL on stdout; it neither connects to MySQL nor exposes a public endpoint.
Its required columns, defaults, primary/unique keys and foreign-key order match
the checked-in Phase 7A manifest and SQL for admin_users, admin_roles,
admin_permissions, admin_user_roles and admin_role_permissions.
The user confirmed admin_users count = 0 in phpMyAdmin during this task.
The deployed schema has not been independently inspected. Before use, require
/api/ready to still return data.status = ready; that endpoint checks the deployed
schema against its manifest. Do not treat health alone as schema verification.
If deployed schema was manually changed, inspect those five tables against
backend/database/manifest.json; do not guess or modify them during bootstrap.

## Existing PHP CLI
C:\xampp\php\php.exe is allowed solely as an offline CLI executable. The helper
validates CLI SAPI and PHP 8+ using -n (no php.ini). It never starts Apache, MySQL,
XAMPP Control Panel or any local service, and makes no database connection.
No additional PHP installation is needed. No real credentials were collected. The later debug validation generated only
synthetic SQL in a private folder and immediately deleted it; nothing was imported.

## Run locally
Use Windows PowerShell 5.1+ or PowerShell 7 in a private terminal. Do not enable
transcription, debug tracing, screen recording or shell logging of sensitive
input. Do not paste passwords into commands, arguments, chat or configuration.
Use the installed CLI executable:

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "D:\Virasat Organics\virasat-organics-v2\scripts\create-admin-bootstrap.ps1" -Php "C:\xampp\php\php.exe"

Optional prerequisites-only check (does not execute the generator):

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "D:\Virasat Organics\virasat-organics-v2\scripts\create-admin-bootstrap.ps1" -Php "C:\xampp\php\php.exe" -CheckOnly

Before entering credentials, the helper asks you to confirm these live checks:
    SELECT COUNT(*) AS admin_count FROM admin_users;
Expected 0 in the selected V2 database, and /api/ready = ready.
Only then type VERIFIED EMPTY at the prompt.
Enter name, email and a unique password locally. The password and confirmation
are SecureString prompts (no echo). Policy: 16–72 UTF-8 bytes, at least 12
characters and eight distinct characters; preferably password-manager generated.
Non-ASCII characters may take multiple bytes. No default password exists.

The helper streams JSON through redirected stdin, never an argument or file.
PHP's stdout goes directly to an account-restricted file, never chat/terminal.
Stderr is captured and not printed. No credential-containing intermediate files
are created. Failed/partial output is removed. Native secret buffers are zeroed
and SecureStrings disposed; managed runtime strings cannot promise forensic
memory erasure.

## Private output
A unique directory is created for each successful run:
    %LOCALAPPDATA%\VirasatOrganics\bootstrap\<random-id>\admin-bootstrap.sql

If that location is within a Git checkout, the helper instead uses:
    %PROGRAMDATA%\VirasatOrganics\bootstrap\<random-id>\admin-bootstrap.sql

On this machine C:\Users\pc is a Git checkout, so ProgramData is selected.
The full absolute filename is printed by the helper after success. It is outside
the project and any ancestor Git checkout, with inherited ACLs removed and access
granted to the current Windows account. No output file exists until you run it.
The SQL contains a password hash and must still be treated as sensitive.

## Import in Hostinger phpMyAdmin
1. Select the SAME dedicated V2 database used by the working API.
2. Recheck admin_users count = 0. If nonzero, STOP; use the existing admin flow.
3. Open Import and select the exact private SQL file printed by the helper.
   Import directly from your PC; never upload it to public_html or the API folder.
4. Require ZERO SQL errors. Do not continue after a failed SQL statement.
   The generator uses an advisory lock, a transaction and an empty-table guard.
   It does not overwrite an existing account.
5. Find the result row named admin_created in the import output; require 1.
   This SELECT is executed inside the imported batch. Running SELECT @allowed
   later in another phpMyAdmin connection is NOT an equivalent verification.
6. Verify persisted results with these read-only queries, which reveal no hashes:

    SELECT COUNT(*) AS active_admins FROM admin_users WHERE status='active';

    SELECT COUNT(DISTINCT u.id) AS catalogue_admins
    FROM admin_users u
    JOIN admin_user_roles ur ON ur.admin_user_id=u.id
    JOIN admin_role_permissions rp ON rp.role_id=ur.role_id
    WHERE u.status='active' AND rp.permission_key='catalogue.write';

   Both should be 1 for the first admin. admin_created alone is a guard flag,
   not proof of successful execution after SQL errors. Require all checks.
7. If admin_created=0, a lock was unavailable or an admin already exists. Stop;
   do not delete users, change the guard, or rerun blindly.
No migration reimport, configuration rewrite, default account, public bootstrap
or automatic deployment is needed.

## Test login without exposing credentials
Use the existing frontend /admin page with VITE_DATA_MODE=api and a trusted HTTPS
same-origin development proxy as documented in PHASE7B_UPLOAD_MAP.md. Plain mock
mode does not test real authentication. No frontend upload is required.

The inspected API flow is:
1. GET /api/admin/session returns an anonymous session plus CSRF token.
2. POST /api/admin/login with JSON email/password, that session cookie and
   X-CSRF-Token. Origin must match the configured application origin; the fixed
   Vite proxy forwards the approved origin. Type credentials into the login form,
   not commands or DevTools snippets. The form handles these details.
3. Successful login returns admin identity and a new CSRF token; the server
   rotates the session ID and keeps Secure/HttpOnly/SameSite=Lax cookies.
4. GET /api/admin/products should now return 200 and the current catalogue.
5. POST /api/admin/logout with CSRF ends the session. Subsequent
   GET /api/admin/products must return 401.

GET /api/admin/login in the address bar is not a login test (POST is required).
401 means failed login/session; 403 may mean CSRF/origin/permission failure;
429 is login throttling (10 attempts per 15-minute bucket per IP/account).
Do not weaken cookies or CSRF to work around local HTTP/cross-site requests.
If the Phase 7B endpoints return 404, they are not deployed at those routes;
do not generate more admins or alter the database to solve routing.

## Cleanup
After import and login verification, delete the generated SQL from the exact
printed location, for example:
    Remove-Item -LiteralPath '<full private SQL path printed by helper>'
Remove the now-empty unique directory using File Explorer if desired.
Do not recursively delete the shared bootstrap directory or project folders.
Delete any accidental private copies/downloads; never retain the SQL in source
control or public hosting. Keep your password only in your password manager.
The helper removes partial files on failure; if file removal is blocked by Windows,
it warns you to inspect the private output directory without displaying contents.

## Tests performed
PowerShell parser: PASS.
-CheckOnly: automatic discovery and explicit XAMPP CLI selection both pass.
PHP CLI SAPI/version validation: PASS (8.0.30, cli).
Existing generator PHP syntax: PASS; source unchanged.
Windows PowerShell 5.1 stdin compatibility fixed: explicit UTF-8 bytes replace
an unsupported StandardInputEncoding property. No generator execution in tests.
Debug validation now includes synthetic-only generator execution and password
hashing, with generated files immediately removed. No real credentials, upload,
import, database mutation or login attempt occurred. Real interactive execution awaits local
credentials. Existing PHP generator was not modified.

## Safe failure categories and confirmed fix
The generic warning was reproduced at the outside-Git output-location check:
C:/Users/pc contains .git, which also made its AppData location ineligible.
The helper now checks AppData and then ProgramData; it never bypasses the Git
restriction and still enforces a current-user-only ACL before creating SQL.
The PHP SQL generator is unchanged.

Failures identify a fixed category plus helper line and exception type, without
exception messages, stderr, JSON, passwords, hashes or SQL:
INVALID_CONFIRMATION, INVALID_NAME, INVALID_EMAIL, SECURE_INPUT_FAILED,
PASSWORD_TOO_SHORT, PASSWORD_TOO_LONG, PASSWORD_POLICY_FAILED,
PASSWORD_MISMATCH, OUTPUT_LOCATION_INSIDE_GIT, OUTPUT_FILE_FAILED,
JSON_ENCODING_FAILED, STDIN_ENCODING_FAILED, PHP_CLI_FAILED,
SQL_GENERATOR_FAILED.

The confirmation remains exactly VERIFIED EMPTY (case-sensitive).
Passwords are compared ordinally without trimming or normalization; UTF-8 byte
length is checked independently from character count. The input JSON is sent as
explicit UTF-8 bytes without a BOM. PHP independently validates input and emits
SQL only on success; its stderr is never displayed.
The error observed on this machine was before PHP execution, not a PHP/JSON error.

Synthetic test harness: scripts/test-admin-bootstrap.ps1. It mocks prompts only
inside its separate test process, uses synthetic@example.invalid and generated
test passwords, validates output structure/no BOM/no plaintext, checks owner-only
ACLs, then removes the generated SQL and its exact unique directory. Never use
this harness for a real account. It does not connect to any database.

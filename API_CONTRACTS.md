# Phase 6.2 — Canonical data and API contracts

Status: PROPOSED implementation contract, 17 October 2026. No endpoint or integration exists yet. Applies to the inspected V2 React frontend, not the previous website. DATABASE_BLUEPRINT.md supplies persistence; MOCK_TO_API_MATRIX.md supplies adapters.

## Wire conventions

JSON camelCase; UTF-8; opaque stable string IDs (VARCHAR(64) storage, server-generated UUIDs for new records; retain existing seed IDs). Slugs lowercase ASCII hyphenated, unique per resource. ISO-8601 UTC timestamps; nullable unprovided fields use null, never fabricated defaults. Every persisted mutable entity has id, createdAt, updatedAt, version (positive integer); append-only events have id/createdAt only. Ownership is server-derived, never accepted from customer payloads.

Money: INR integer paise, named pricePaise, subtotalPaise etc; null means unconfigured, 0 explicitly configured zero. Nonnegative safe JSON integers capped at 9,007,199,254,740,991; database BIGINT with matching application bounds. Multiplication/addition checked for overflow. No floating-point arithmetic for quotes/orders/payments. Tax policy is not configured: fail closed until reviewed rules define integer rational calculation and explicit rounding. Quote locks a policy version and item-level tax; total = subtotal + shipping + tax (no discount system currently exists).

Current price/compareAtPrice and order amounts are rupee numbers. API adapters map display fields; commerce must retain authoritative paise fields and format with integer quotient/remainder. Admin decimal inputs parsed as strings with at most two decimal digits into paise, not parseFloat * 100. Do not migrate illustrative demo prices/orders.

Success: {data: entity|array, meta?:{page,pageSize,total}, requestId}. GET list page>=1, pageSize 1..100 (default 20), allowlisted sort, bounded q<=100. DELETE 204. POST create 201, other success 200; async provider work 202 with pending status.
Errors: {error:{code,message,fields?:{field:message}},requestId}. No stack/SQL/token disclosure.
Common errors: 400 BAD_REQUEST; 401 UNAUTHENTICATED; 403 FORBIDDEN/CSRF_FAILED; 404 NOT_FOUND (also foreign-owned IDs and hidden products); 409 VERSION_CONFLICT/IDEMPOTENCY_CONFLICT/REFERENCED_RESOURCE; 422 VALIDATION_FAILED/UNCONFIGURED/INSUFFICIENT_STOCK/NOT_PURCHASABLE/DELIVERY_UNAVAILABLE; 429 RATE_LIMITED (Retry-After); 503 PROVIDER_UNAVAILABLE.
All mutations require CSRF plus same-origin session except signed provider webhook. Patch/put require If-Match version; missing version 428 PRECONDITION_REQUIRED. Unknown writable fields rejected, not mass-assigned.
Idempotency-Key required on create-order, payment-order and inventory adjustments; also required on admin creates and address creates to avoid double submissions. Store request hash and result keyed by actor+method+path+key. Same key/body returns same result; changed body 409; in-progress 409 RETRY_LATER. At least 24h retention; order request identifiers remain unique indefinitely. PUT/PATCH deterministic under version check, DELETE repeat may return 204 after ownership check; never replay a stock adjustment.

## Entity dictionary

All references are IDs, not embedded mutable copies, except intentionally immutable snapshots. Arrays shown on resources can be read projections over child tables.

| Entity | Fields beyond common metadata; constraints |
| --- | --- |
| Product | slug, sku (unique), name, size, categoryId, status: active/inactive/out_of_stock/coming_soon, pricePaise?, compareAtPricePaise?, stock?, shortDescription?, longDescription?, ingredients:string[], nutrition?, storage?, specifications:object, seo:{title?,description?}, images:ProductImage[], videos:ProductVideo[]. stock is available quantity projection, null if inventory unknown; no variants. compareAtPrice only if >= configured price. |
| ProductImage | productId, mediaAssetId, alt?, sortOrder>=0; first ordered entry is primary, unique product/media. |
| ProductVideo | productId, mediaAssetId, posterMediaAssetId?, caption?, sortOrder>=0; video/media types enforced. |
| Category | slug, name, description?, imageMediaAssetId?, status:active/inactive, sortOrder. Two current categories; productCategory legacy display string is adapter-only. |
| InventoryMovement | productId, actorAdminId?, orderId?, reservationId?, kind:initialize/adjust/reserve/release/deduct/restock, onHandDelta:int, reservedDelta:int, reason, idempotencyKey, resultingOnHand, resultingReserved. Append-only; quantities never guessed. |
| Customer | firebaseUid unique, name?, phoneE164?, phoneVerifiedAt?, email?, status:active/disabled, defaultAddressId?. Phone verification comes only from verified identity provider, not profile input. |
| Address | customerId, label:Home/Work/Other, recipient, phoneE164, building, street, locality, city, state, postalCode (6-digit string), countryCode:IN, landmark?, instructions?, latitude?, longitude?, coordinatesConfirmed:boolean. Coordinates nullable and range checked; not proof of serviceability. |
| CustomerSession | customerId, expiresAt, authenticatedAt, revokedAt?, csrf token delivered separately. Opaque HttpOnly cookie; session secret/hash and provider tokens NEVER returned in entity. mode authenticated, not current demo mode. |
| Wishlist | customerId, items:[{productId,addedAt}]; unique owner/product; inaccessible products omitted in public projection. |
| Cart | localId, customerId? (UI association only), items:[{productId,quantity positive int}], updatedAt. Browser-owned intent, NOT authoritative price/stock. No server cart required by current UI; quote is authority. |
| CheckoutQuote | customerId, addressId, addressVersion, items:[{productId,productVersion,quantity,unitPricePaise,lineSubtotalPaise,taxPaise}], currency:INR, subtotalPaise, shippingPaise, taxPaise,totalPaise, deliveryZoneId, settingsVersion, paymentMethods[], expiresAt, consumedOrderId?. Server-calculated; no stock guarantee until order transaction. |
| Order | publicReference unique, customerId, quoteId, status:placed/confirmed/packed/shipped/out_for_delivery/delivered/cancelled, paymentMethod:cod/razorpay, paymentStatus:pending/authorized/paid/failed/refund_pending/refunded, currency, totals in paise, deliveryAddressSnapshot, customerSnapshot, deliveryInstructions?, items:OrderItem[], statusEvents:OrderStatusEvent[], idempotencyKey. Snapshot content immutable. |
| OrderItem | orderId, productId, skuSnapshot,nameSnapshot,sizeSnapshot,mediaSnapshot?,quantity,unitPricePaise,lineSubtotalPaise,taxPaise. Do not recalculate from current catalogue. |
| OrderStatusEvent | orderId, fromStatus?,toStatus, occurredAt, actorType:customer/admin/system, actorId?, publicNote?. Admin-only notes stored separately, never included by customer serializer. |
| Payment | orderId, provider:cod/razorpay, providerOrderId?,providerPaymentId?,amountPaise,currency,status:created/authorized/captured/failed/refund_pending/refunded, capturedAt?. Payment success never inferred from fulfilment. |
| DeliveryZone | name, status:active/inactive, postalCodes:string[], shippingPaise?,minimumOrderPaise?,freeShippingThresholdPaise?,codEnabled:boolean, priority. Exact PIN match initially; unique active assignment (no ambiguous zone). |
| DeliverySettings | singleton id, configured:boolean, defaultShippingPaise?,minimumOrderPaise?,freeShippingThresholdPaise?,codEnabled, originAddress?, taxPolicyVersion?. Unknown monetary rules remain null and block quote. |
| HomepageSection | stable key, enabled, sortOrder, content:validated discriminated JSON for existing hero/categories/collection/introduction/gallery/story/values/journal/testimonials/newsletter; referenced media IDs. No raw HTML; testimonials require approved real records, seed empty. |
| Banner | title, desktopMediaAssetId?,mobileMediaAssetId?,alt?,ctaLabel?,ctaDestination?,status:active/inactive/archived,sortOrder. Safe route/HTTPS destinations. |
| StoryContent | CMSPage projection for slug our-story plus videoMediaAssetId?,posterMediaAssetId?. No second competing story document. |
| BlogPost | slug,title,excerpt?,blogCategoryId?,status:draft/published/archived,blocks:Block[],imageMediaAssetId?,seo, publishedAt?,authorAdminId?. Current editorial_draft opt-in excerpts mapped explicitly; never publish bodies by default. |
| BlogCategory | slug,name,status:active/inactive. Existing editor has article category text; normalize confirmed unique values, no invented categories or new management screen required. |
| CMSPage | stable slug,title,description?,blocks:Block[],status:draft/published/archived,seo,publishedAt?, videoMediaAssetId?,posterMediaAssetId?. Core slugs cannot be renamed/deleted. |
| MediaAsset | ownerAdminId,storageKey(private),publicUrl(read-only projection),originalName,mimeType,bytes,kind:image/video,width?,height?,durationMs?,alt?,caption?,status:processing/ready/rejected/archived,checksumSha256. Never persist blob: URLs. |
| BusinessSettings | singleton id, name,hindiName?,tagline?,logoMediaAssetId?,logoAlt?,introduction?,email?,phoneE164?,whatsappE164?,address?,operatingHours?,socialLinks:[{label,url}],contactsVisible,announcementEnabled,previewNotice?,footerDescriptionVisible,footerNote?,maintenanceEnabled,acceptOrders,currency:INR,seo:{title?,description?,imageMediaAssetId?,siteUrl?}. No secrets. |
| ComplianceSettings | singleton id, gstinValue?,gstinVisible:boolean,fssaiValue?,fssaiVisible:boolean,notes? (admin only). Public serialization requires format-valid value AND visible flag. Format is not legal verification. |
| AdminUser | email unique,name,passwordHash(private),status:active/disabled,lastLoginAt?,passwordChangedAt?. No client-assigned role; no default password. |
| AdminRole | key unique,name,permissions:string[]. Admin/user-role joins; permissions catalogue.write/content.write/orders.manage/customers.read/settings.write/admin.manage, dashboard.read. |
| AuditLog | actorAdminId?,actorCustomerId?,action,resourceType,resourceId,requestId,occurredAt,redactedBefore?,redactedAfter?,source. Append-only, no secrets/OTP/full payment payload/PII dumps. |

Block = {id,type:paragraph/heading/quote/list/image,text?,mediaAssetId?,alt?}. Max 100 blocks, 10,000 characters each (existing CMS limits). Lists use newline text. Media references validated and rendered as React text, never HTML. Common limits: name/title 200, slug/SKU 120, description 10,000, quantities 1..10,000 bounded further by stock, instructions<=200. Existing stricter profile name<=80/email<=254 retained.

## Exact product and order behavior

active visible, purchasable only with nonnull integer pricePaise>=0 and known available stock >= requested quantity. This deliberately preserves existing isValidPrice allowing explicit zero. A real zero price must be consciously configured; null never converted to zero.
inactive hidden in list/search/direct lookup (404); unknown status fail closed.
out_of_stock visible, never purchasable even if stored stock positive.
coming_soon visible, never purchasable even if priced.
active stock=0 renders Out of stock; active missing/invalid price or stock renders Coming soon, matching getProductAvailability.

Admin updates increment version and invalidate product/search/cart views. Revalidate cart on load, focus, add/quantity change, API conflict and before quote/order; remove inaccessible IDs, cap quantity only with clear feedback, flag price/availability changes. Quote/order must reject changed prices/stock/settings with 409 QUOTE_STALE and require review. Public includeInactive=true is unsupported; admin endpoint only.

Fulfilment maps existing UI labels to wire enums: Placed→placed, Confirmed→confirmed, Packed→packed, Shipped→shipped, Out for Delivery→out_for_delivery, Delivered→delivered, Cancelled→cancelled. Only next stage or cancellation from placed/confirmed allowed. Delivered/cancelled terminal. Reorder is client intent from current visible products, NOT repeat original prices or create order automatically.

## Endpoint catalogue

P=public; C=authenticated customer, owner-scoped; A(permission)=authenticated admin; W=provider signature. CSRF mutation rules and common errors above apply to EVERY row. E means additional resource error codes. V means version required; I means Idempotency-Key; R means read/no mutation; D means deterministic delete; S means session operation. Resource shapes refer to dictionary; omitted fields never writable. Collection GET supports common pagination/filter conventions. Tables refer to DATABASE_BLUEPRINT.

| Method/path | Request → data response | Auth | Validation; extra errors | Replay | Tables | Actual consumer |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/store | none → {sections,banners,editorialPreviews} | P | enabled/approved projections only | R | homepage_sections,banners,blog_posts,media_assets | HomePage/HomeContent |
| GET /api/products | q,category,availability,sort → Product[] | P | visibility; name/size/category/keywords normalization; price sort only configured values | R | products,categories,inventory_balances,product_images,product_videos | ShopPage/SearchPage/HomeShopping |
| GET /api/products/:slug | slug → Product | P | inactive/unknown 404 | R | same | ProductPage |
| GET /api/categories | none → Category[] | P | active sorted | R | categories | category cards/header/footer |
| GET /api/blog | q,page → published BlogPost[] | P | no draft body | R | blog_posts,blog_categories | FoundationPage/journal |
| GET /api/blog/:slug | slug → BlogPost | P | published only, otherwise404 | R | same | FoundationPage |
| GET /api/pages/:slug | slug → CMSPage | P | published body only; draft shell may return title+status+empty blocks | R | cms_pages,media_assets | FoundationPage/ProductInformation |
| GET /api/settings/public | none → {business,compliance,deliverySummary} | P | allowlist, no private notes/settings/secrets | R | business_settings,compliance_settings,delivery_settings | BusinessProvider/Footer/Brand/contact |
| GET /api/auth/csrf | none → {csrfToken} | P | same-origin pre-session token; no-store | S | php_sessions | LoginPage/AuthModal, all mutations |
| POST /api/auth/firebase-session | {idToken} → {customer,expiresAt} + cookie | P | verified token, issuer/audience/time/revocation; E TOKEN_INVALID/ACCOUNT_DISABLED | S regenerate session | customers,php_sessions | LoginPage/AuthModal |
| GET /api/auth/me | none → {customer,expiresAt} | C | expired/revoked401 | R | customers,php_sessions | StorefrontProvider/CustomerGate |
| POST /api/auth/logout | {} → 204 | C | invalidate session and cookie | S repeat204 | php_sessions | AccountPage/logout |
| GET /api/me | none → Customer | C | owner from session | R | customers | AccountPage |
| PATCH /api/me | {name,email?} → Customer | C | phone change requires new verified identity flow, not ordinary patch | V | customers,audit_logs | profile form |
| GET /api/me/addresses | none → Address[] | C | owned only | R | addresses,customers | AddressForm/CheckoutPreview |
| POST /api/me/addresses | address writable fields → Address | C | validated Indian address; coordinates nullable | I | addresses | AddressForm |
| PATCH /api/me/addresses/:id | address patch or {isDefault:true} → Address | C | ownership; default pointer atomically changed | V | addresses,customers | AccountPage |
| DELETE /api/me/addresses/:id | none → 204 | C | owner; clear/reassign default atomically; order snapshot untouched | D | addresses,customers | AccountPage |
| GET /api/me/wishlist | none → Wishlist | C | hide inactive | R | wishlist_items,products | WishlistPage/header |
| POST /api/me/wishlist | {productId} → Wishlist | C | visible product; unique membership makes replay safe | set-idempotent | wishlist_items | ProductCard/ProductPage |
| DELETE /api/me/wishlist | {productId} → 204 | C | own membership; allow clearing no-longer-visible ID | D | wishlist_items | WishlistPage |
| GET /api/me/orders | filters → Order[] | C | own only, cursor/page bounded | R | orders,order_items | AccountPage/OrdersView |
| GET /api/me/orders/:id | id → Order with public events | C | own only,404 foreign | R | orders,order_items,order_status_events | order detail |
| POST /api/checkout/quote | {addressId,items:[{productId,quantity}],paymentMethod} → CheckoutQuote | C | authoritative prices/coverage/tax; E UNCONFIGURED/QUOTE_STALE | new expiring quote, no stock mutation | checkout_quotes,quote_items,products,inventory_balances,addresses,delivery_* | CheckoutPreview |
| POST /api/orders | {quoteId,deliveryInstructions?,paymentMethod} → Order | C | unexpired owned quote, revalidate inside transaction; E QUOTE_STALE | I | orders,order_items,order_status_events,inventory_*,payments,checkout_quotes,idempotency_keys | checkout confirmation |
| GET /api/orders/:id | id → Order | C | alias same owned serializer as me/orders | R | orders,order_items,order_status_events | OrderSuccessPage |
| POST /api/orders/:id/cancel | {expectedVersion} → Order | C | placed/confirmed only; E INVALID_TRANSITION; no automatic refund success | I | orders,inventory_*,order_status_events,payments | OrdersView |
| POST /api/delivery/check | {postalCode} → {status:serviceable/unserviceable/unconfigured,zoneId?,codEnabled} | P | six-digit PIN; rate limit, no false ETA | R | delivery_zones,delivery_zone_pins,delivery_settings | DeliveryPreview/LocationSelector |
| POST /api/delivery/quote | {addressId,items} → {shippingPaise,taxPaise?,serviceable,expiresAt} | C | owned address; compute subtotal server; authoritative checkout quote still required | R | addresses,products,delivery_*,checkout_quotes | CheckoutPreview |
| GET /api/admin/dashboard | none → counts/activity/configuration gaps | A(dashboard.read) | only authorized aggregated scopes | R | products,orders,customers,blog_posts,cms_pages | AdminDashboard |
| GET /api/admin/products | filters → Product[] incl inactive | A(catalogue.write) | allowlisted filters | R | products,inventory_balances,product_* | CatalogueWorkspace |
| GET /api/admin/products/:id | id → Product | A(catalogue.write) |404 | R | same | ProductEditor |
| POST /api/admin/products | editable Product fields → Product | A(catalogue.write) | unique SKU/slug, no variants; stock set via inventory endpoint | I | products,product_images,product_videos | new/duplicate ProductEditor |
| PATCH /api/admin/products/:id | fields/status/media ordering → Product | A(catalogue.write) | reference types, no stock direct patch | V | products,product_images,product_videos,audit_logs | ProductEditor/status controls |
| DELETE /api/admin/products/:id | none →204 | A(catalogue.write) | referenced order/core seed reject; archive instead | V,D | products | CatalogueWorkspace |
| GET /api/admin/categories | none → Category[] | A(catalogue.write) | includes inactive | R | categories | CatalogueForms |
| GET /api/admin/categories/:id | id → Category | A(catalogue.write) |404 | R | categories | category editor |
| POST /api/admin/categories | Category fields → Category | A(catalogue.write) | unique slug | I | categories | CatalogueForms |
| PATCH /api/admin/categories/:id | fields → Category | A(catalogue.write) | unique slug, media type | V | categories | CatalogueForms |
| DELETE /api/admin/categories/:id | none →204 | A(catalogue.write) | assigned products reject409 | V,D | categories | CatalogueForms |
| GET /api/admin/inventory/adjustments | productId,page → InventoryMovement[] | A(catalogue.write) | bounded history | R | inventory_movements | inventory panel |
| POST /api/admin/inventory/adjustments | {productId,mode:initialize/adjust/set,amount,reason,expectedVersion} → balance+movement | A(catalogue.write) | integers, known baseline for adjust, cannot reduce below reserved | I,V | inventory_balances,inventory_movements | CatalogueForms |
| GET /api/admin/orders | filters → Order[] | A(orders.manage) | status/payment/date/search bounds | R | orders,order_items | OperationsWorkspace |
| GET /api/admin/orders/:id | id → Order+internalNotes | A(orders.manage) |404 | R | orders,order_items,order_status_events,order_notes | order detail admin |
| PATCH /api/admin/orders/:id | {status,note?,expectedStatus} → Order | A(orders.manage) | sequential/terminal rules, E INVALID_TRANSITION | V | orders,order_status_events,order_notes,inventory_* | OperationsWorkspace |
| PATCH /api/admin/orders | none →405 | A(orders.manage) | collection mutation intentionally disallowed; use item path | none | none | none; resolves ambiguous bulk endpoint |
| GET /api/admin/customers | q,page → Customer summaries | A(customers.read) | no Firebase tokens or passwords | R | customers,orders | OperationsWorkspace |
| GET /api/admin/customers/:id | id → {customer,addresses,ordersSummary} | A(customers.read) | permission-scoped PII | R | customers,addresses,orders | customer detail |
| GET /api/admin/homepage | none → HomepageSection[]+chrome | A(content.write) | existing keys | R | homepage_sections,business_settings | HomeEditor |
| PUT /api/admin/homepage | {sections,chrome} → same | A(content.write) | exactly original keys/order, safe refs; chrome allowlist | V | homepage_sections,business_settings,audit_logs | HomeEditor |
| GET /api/admin/settings | none → BusinessSettings+ComplianceSettings+DeliverySettings+zones | A(settings.write) | never credentials | R | settings tables,delivery_* | SettingsEditor |
| PUT /api/admin/settings | validated settings bundle → same | A(settings.write) | atomic sections, GSTIN/FSSAI format, flags, COD; reject secret fields | V | settings tables,delivery_* | SettingsEditor |
| GET /api/admin/media | filters → MediaAsset[] | A(catalogue.write OR content.write) | bounded list | R | media_assets | MediaLibrary/CMSFields |
| POST /api/admin/media | multipart file,alt?,caption? → MediaAsset | A(catalogue.write OR content.write) | sniff type, limits, random path, no execution; E UNSUPPORTED_MEDIA | I | media_assets | MediaLibrary |
| PATCH /api/admin/media/:id | {alt,caption,posterMediaAssetId?} → MediaAsset | A(catalogue.write OR content.write) | safe metadata/types | V | media_assets | MediaLibrary |
| DELETE /api/admin/media/:id | none →204 | A(catalogue.write OR content.write) | references prevent deletion409 | V,D | media_assets,media_references | MediaLibrary |
| GET /api/admin/session | none → {admin,permissions,csrfToken} | A(any) | no password hash | R | admin_users,admin_roles,php_sessions | AdminLayout gate (future wiring) |
| POST /api/admin/session | {email,password} → admin summary+cookie | P | throttled, password_verify, generic invalid401 | S | admin_users,php_sessions | required gate for existing admin; minimal login wiring in7A |
| DELETE /api/admin/session | none →204 | A(any) | revoke server session | S | php_sessions | admin logout |
| PATCH /api/admin/profile | {name,currentPassword?,newPassword?} → admin summary | A(any) | reauth for password; reject role input | V | admin_users,audit_logs | existing admin profile shell |
| POST /api/payments/razorpay/order | {orderId} → {providerOrderId,keyId,amountPaise,currency} | C | owned pending order, active reservation; never client amount | I | payments,orders,idempotency_keys | disabled online option, future7E |
| POST /api/payments/razorpay/verify | {orderId,razorpayOrderId,razorpayPaymentId,signature} → {paymentStatus} | C | bound server IDs/signature; fetch provider captured state before paid | provider-payment unique | payments,payment_events,orders,inventory_* | future checkout return |
| POST /api/payments/razorpay/webhook | raw body + signature/event-id headers → {received:true} | W | HMAC raw bytes, amount/currency/order mapping; invalid400 | unique provider event, no regression | payment_events,payments,orders,inventory_* | no direct UI; refresh order status |

### CMS CRUD expansion (each row is a concrete endpoint family)

For resource R in blog, pages, banners, replace :id with stable record ID, never slug. Tables respectively blog_posts/blog_categories, cms_pages, banners plus media_references/audit_logs. Consumer respectively ContentEditor blog, ContentEditor page/story, ContentEditor banner. All require A(content.write), common errors, reference validation and version semantics above.

| Method/path (three concrete resources) | Request → response | Validation / replay |
| --- | --- | --- |
| GET /api/admin/blog; GET /api/admin/pages; GET /api/admin/banners | filters → resource[] | R, includes drafts |
| GET /api/admin/blog/:id; GET /api/admin/pages/:id; GET /api/admin/banners/:id | id → resource | R,404 unknown |
| POST /api/admin/blog; POST /api/admin/pages; POST /api/admin/banners | writable resource → resource | I; unique slug for documents; new pages limited to registered routable core slugs until UI adds routes |
| PATCH /api/admin/blog/:id; PATCH /api/admin/pages/:id; PATCH /api/admin/banners/:id | fields/status → resource | V; publishing requires explicit publishConfirmed:true and nonempty validated blocks; banner active/inactive; server timestamp actual publication |
| DELETE /api/admin/blog/:id; DELETE /api/admin/pages/:id; DELETE /api/admin/banners/:id | none →204 | V,D; seed articles/core pages protected; archive instead |

No newsletter submission, GPS/geocoding, review creation, coupon, variants, carrier API or server cart endpoint: not implemented UI requirements. Reorder is existing cart logic. Blog category normalization happens in editor payload under content permission; no new taxonomy screen assumed. Delivery zones use settings bundle, not an invented management route.

## Security and external references

Planning choices: same-origin HTTPS, PHP session cookie Secure/HttpOnly/SameSite=Lax, strict session mode, rotate on authentication, idle30min/absolute12h, CSRF secret bound to session and Origin verification on every unsafe browser request. Restrict admin sessions separately from customer identity; roles checked server-side per request. No permissive credentialed CORS. Public GET cacheable with ETag; private/auth no-store.

Firebase PHP verification uses maintained third-party JWT tooling (PHP is not a native Firebase Admin SDK language); verify RS256, trusted kid/cached Google certs, signature, aud project, iss, exp, iat, auth_time and nonempty sub. Bind phone only from verified provider claims; disable/revocation checks on session exchange and periodically thereafter. Never accept custom tokens as ID tokens. Do not hand-roll cryptography. [Firebase verification guidance](https://firebase.google.com/docs/auth/admin/verify-id-tokens).

PDO prepared statements with emulation off, allowlisted identifier/sort maps; least-privilege DB user. Rate-limit auth per IP+account (initial proposal5/min, escalating), anonymous search/delivery60/min, mutations30/min, adjustable with logs. Shared-host limits backed by DB, not in-process counters. Use constant-time comparisons, request size limits and redacted logs.

Uploads initially JPEG/PNG/WebP/GIF<=10MB, MP4<=100MB matching preview; hosting upload/post limits may force lower explicit UI caps. Validate MIME with finfo and decode images, reject SVG/PHP/polyglots, random filenames, private quarantine, no execution, safe media delivery and reference-protected deletion. Do not fetch arbitrary user URLs server-side.

Webhook raw body HMAC uses separate secret; unique provider event ID, durable inbox before acknowledgement, duplicates safe and out-of-order states never downgrade captured. Rotate secrets with overlap for retries. [Razorpay webhook validation](https://razorpay.com/docs/webhooks/validate-test/). Callback verification alone must not imply captured payment. Server/provider reconciliation decides status.

Session settings reference: [PHP session security](https://www.php.net/manual/en/session.security.ini.php). Specifications above are proposed application policy, not tested hosting configuration.
## Query and compatibility examples

Product filters: category is category slug; availability=all|available|out_of_stock|coming_soon; sort=default|name_asc|name_desc|price_asc|price_desc. Default preserves existing five-product ordering using an explicit display_order column in products (integer, indexed with status). available means currently purchasable, not merely status=active. q trims/collapses whitespace and compares case-insensitively across name, SKU, size, category and configured keywords; pack-unit normalization preserves existing 1 L/1 litre matching. Add products.keywords JSON string array (empty seed) for this explicit search field. Price filters minPricePaise/maxPricePaise accept nonnegative integers only; unavailable-price products are excluded when price filtering is requested. The UI hides price controls while no numeric prices exist. Price sorts place unknown prices last, tie-break by display_order,id. API must return total after filtering, before pagination.

Order filters: q matches order reference/customer contact only within caller scope; status is canonical fulfilment enum, paymentMethod=cod|razorpay, paymentStatus canonical order payment enum, from/to ISO dates interpreted UTC with inclusive start/exclusive next-day end, sort=created_desc|created_asc|total_asc|total_desc. Customer cannot search other customers by passing their contact.

A public product response retains nulls (abbreviated):

    {"data":{"id":"demo-atta-5kg","slug":"atta-5kg","sku":"DEMO-ATTA-5KG",
      "name":"Atta","size":"5 kg","categoryId":"category-atta",
      "pricePaise":null,"compareAtPricePaise":null,"stock":null,
      "status":"coming_soon","images":[],"videos":[]},"requestId":"<server request ID>"}

A future order request contains intent only:

    POST /api/orders
    Idempotency-Key: <unique client attempt key>
    X-CSRF-Token: <session token>
    {"quoteId":"<owned server quote ID>","paymentMethod":"cod","deliveryInstructions":""}

Client totals, customerId, status, price and stock are rejected if submitted as writable order fields. Quote and order GET responses use the exact dictionary fields and server IDs; adapters can construct current UI aliases orderId/address/subtotal only at the boundary.

A stale quote response:

    {"error":{"code":"QUOTE_STALE","message":"The collection or delivery details changed. Review a new quote."},
     "requestId":"<server request ID>"}

The examples are shape examples, not executed requests, configured business facts or real orders.

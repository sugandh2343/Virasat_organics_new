# MySQL database blueprint — Phase 6.2

PROPOSED ONLY. No SQL executed, database connected or PHP created. API_CONTRACTS.md is the wire dictionary; this document defines physical mapping and transaction invariants.

## Conventions and migration strategy

Target MySQL 8.0.16+ (enforced CHECK support), InnoDB, utf8mb4/utf8mb4_unicode_ci. Verify actual Hostinger server/version first; MariaDB compatibility is not assumed. IDs VARCHAR(64) ASCII binary collation; all FK ID types match. Slugs/SKU VARCHAR(120) unique case-insensitively, normalized before write. New IDs UUID strings, existing seed IDs retained. Mutable tables use created_at/updated_at DATETIME(6) UTC and version BIGINT UNSIGNED DEFAULT1. Soft archive/status preferred to deleting referenced business records. Append-only event tables omit updated_at/version.

Money BIGINT UNSIGNED nullable where unconfigured, otherwise NOT NULL; application caps JSON-safe range. Quantity INT UNSIGNED, movements signed INT. Boolean TINYINT(1) with CHECK in(0,1). Status VARCHAR(32) with CHECK against API dictionary. Names/titles VARCHAR(200), profile names80, email254, phone16, PIN CHAR(6), content TEXT, structured blocks JSON. Required fields NOT NULL unless '?' shown. JSON allowed only flexible editorial content/specifications or immutable snapshots, not mutable relationships, inventory or totals. SQL snake_case ↔ JSON camelCase mapper.

Every -> relation below is a real FK with ON UPDATE RESTRICT, ON DELETE RESTRICT unless cascade explicitly allowed. Index FK columns. Do not soft-delete then expose via default queries. Unique UQ; IDX = composite query index. Fields described in API_CONTRACTS map to snake_case using these type rules; table-specific fields below add persistence detail. Keep typed settings columns, not an unrestricted key/value bag.

schema_migrations(version VARCHAR(100) PK, checksum CHAR(64), applied_at, execution_ms). Private CLI migration runner takes DB advisory lock; records checksums after success. Ordered forward migrations; MySQL DDL implicit commits mean no promise of transactional rollback. Each step restart-safe with explicit preconditions, backup before destructive changes; no public web migration route. Separate migration user from restricted runtime user. Test empty install, rerun, interrupted run and restore on disposable DB before hosting.

## Tables and relations

| Table | Columns / relationships beyond common metadata | Constraints/indexes |
| --- | --- | --- |
| categories | slug,name,description?,image_media_asset_id? -> media_assets,status,sort_order INT | UQ slug; IDX(status,sort_order,id) |
| products | slug,sku,name,size VARCHAR(40),category_id -> categories,status,price_paise?,compare_at_price_paise?,short_description?,long_description?,ingredients JSON,nutrition JSON?,storage TEXT?,specifications JSON,seo_title?,seo_description?,is_core_seed bool | UQ slug,sku; IDX(category_id,status,id), (status,name,id); compare price >= price if both set; no stock copy |
| inventory_balances | product_id PK -> products,on_hand INT?,reserved INT DEFAULT0,version,updated_at | on_hand null implies reserved0; otherwise reserved<=on_hand; available=on_hand-reserved |
| product_images | product_id -> products,media_asset_id -> media_assets,alt?,sort_order | UQ(product_id,media_asset_id), UQ(product_id,sort_order); type image checked service |
| product_videos | product_id -> products,media_asset_id -> media_assets,poster_media_asset_id? -> media_assets,caption?,sort_order | UQ(product_id,media_asset_id), UQ(product_id,sort_order); types video/image |
| inventory_movements | product_id -> products,actor_admin_id? -> admin_users,order_id? -> orders,reservation_id? -> inventory_reservations,kind,on_hand_delta INT,reserved_delta INT,reason TEXT,idempotency_key,resulting_on_hand,resulting_reserved,created_at | append-only; IDX(product_id,created_at,id); UQ(idempotency_key,product_id,kind) |
| customers | firebase_uid VARCHAR(128),name?,phone_e164?,phone_verified_at?,email?,status,default_address_id? -> addresses | UQ firebase_uid; verified phone policy unique nullable phone; IDX(status,created_at,id); default address must belong to same owner (transactional validation) |
| addresses | customer_id -> customers,label,recipient,phone_e164,building,street,locality,city,state,postal_code,country_code CHAR(2),landmark?,instructions?,latitude DECIMAL(10,7)?,longitude DECIMAL(10,7)?,coordinates_confirmed bool,deleted_at? | IDX(customer_id,deleted_at,id); latitude -90..90/longitude -180..180; country IN |
| php_sessions | id_hash CHAR(64) PK,customer_id? -> customers,admin_user_id? -> admin_users,payload_encrypted BLOB,csrf_hash CHAR(64),authenticated_at,last_seen_at,expires_at,revoked_at? | exactly one principal for authenticated session; anonymous allowed for CSRF; IDX(expires_at), each owner; never store raw session key in logs |
| wishlist_items | customer_id -> customers,product_id -> products,created_at | composite PK(customer_id,product_id); owner cascade on approved customer erasure only |
| checkout_quotes | customer_id -> customers,address_id -> addresses,address_version,settings_version,delivery_zone_id -> delivery_zones,currency CHAR(3),subtotal_paise,shipping_paise,tax_paise,total_paise,payment_methods JSON,expires_at,consumed_order_id? -> orders | IDX(customer_id,expires_at); UQ consumed_order_id; CHECK total=sum |
| quote_items | quote_id -> checkout_quotes,product_id -> products,product_version,quantity,unit_price_paise,line_subtotal_paise,tax_paise | UQ(quote_id,product_id); CHECK quantity>0 and line_subtotal=unit*quantity |
| orders | public_reference VARCHAR(64),customer_id -> customers,quote_id -> checkout_quotes,status,payment_method,payment_status,currency,subtotal_paise,shipping_paise,tax_paise,total_paise,delivery_address_snapshot JSON,customer_snapshot JSON,delivery_instructions?,idempotency_key,placed_at | UQ public_reference,quote_id,(customer_id,idempotency_key); IDX(customer_id,created_at,id), (status,created_at,id); total=sum; snapshot immutable |
| order_items | order_id -> orders,product_id -> products,sku_snapshot,name_snapshot,size_snapshot,media_snapshot JSON?,quantity,unit_price_paise,line_subtotal_paise,tax_paise | UQ(order_id,product_id); snapshot write-once; product hard deletion restricted |
| order_status_events | order_id -> orders,from_status?,to_status,occurred_at,actor_admin_id? -> admin_users,actor_customer_id? -> customers,public_note? | IDX(order_id,occurred_at,id); actor nullable for system; append-only |
| order_notes | order_id -> orders,admin_user_id -> admin_users,note TEXT,created_at | admin-only serializer/permission; IDX(order_id,created_at) |
| inventory_reservations | order_id -> orders,product_id -> products,quantity,status:held/consumed/released,expires_at?,consumed_at?,released_at? | UQ(order_id,product_id); IDX(status,expires_at); release/consume mutually exclusive |
| payments | order_id -> orders,provider,provider_order_id?,provider_payment_id?,amount_paise,currency,status,captured_at? | UQ(provider,provider_order_id), UQ(provider,provider_payment_id); IDX(order_id,status); COD IDs null |
| payment_events | provider,event_id VARCHAR(255),payment_id? -> payments,body_hash CHAR(64),payload_encrypted BLOB,signature_verified_at,received_at,processed_at?,status:pending/processed/failed,attempts,last_error_code? | UQ(provider,event_id); IDX(status,received_at); restricted retention; no raw payload in audit |
| delivery_settings | singleton id,configured,default_shipping_paise?,minimum_order_paise?,free_shipping_threshold_paise?,cod_enabled,origin_address JSON?,tax_policy_version? | one row; unknown rules null |
| delivery_zones | name,status,shipping_paise?,minimum_order_paise?,free_shipping_threshold_paise?,cod_enabled,priority INT | IDX(status,priority) |
| delivery_zone_pins | postal_code PK,zone_id -> delivery_zones | one zone per exact PIN initially; avoids ambiguous active matches |
| homepage_sections | section_key VARCHAR(40),enabled,sort_order,content JSON | UQ section_key,sort_order; allowed ten existing keys |
| banners | title,desktop_media_asset_id? -> media_assets,mobile_media_asset_id? -> media_assets,alt?,cta_label?,cta_destination?,status,sort_order | IDX(status,sort_order,id) |
| blog_categories | slug,name,status | UQ slug |
| blog_posts | slug,title,excerpt?,blog_category_id? -> blog_categories,status,blocks JSON,image_media_asset_id? -> media_assets,seo_title?,seo_description?,published_at?,author_admin_id? -> admin_users,is_core_seed bool,preview_enabled bool | UQ slug; IDX(status,published_at,id); publication requires blocks; previews excerpt only |
| cms_pages | slug,title,description?,blocks JSON,status,seo_title?,seo_description?,published_at?,video_media_asset_id? -> media_assets,poster_media_asset_id? -> media_assets,is_core_seed bool | UQ slug; stable core slugs; story same row our-story |
| media_assets | owner_admin_id? -> admin_users,storage_key VARCHAR(255),original_name,mime_type VARCHAR(100),bytes BIGINT UNSIGNED,kind,width INT?,height INT?,duration_ms INT?,alt?,caption?,status,checksum_sha256 CHAR(64) | UQ storage_key; IDX(status,created_at,id), checksum; public URL computed, no blob URL |
| media_references | media_asset_id -> media_assets,homepage_section_id? -> homepage_sections,blog_post_id? -> blog_posts,cms_page_id? -> cms_pages,field_path VARCHAR(255) | exactly one owner FK nonnull; generated refs for JSON blocks/content, maintained in same transaction; index each owner and media |
| business_settings | singleton id,name,hindi_name?,tagline?,logo_media_asset_id? -> media_assets,logo_alt?,introduction?,email?,phone_e164?,whatsapp_e164?,address?,operating_hours?,contacts_visible,announcement_enabled,preview_notice?,footer_description_visible,footer_note?,maintenance_enabled,accept_orders,currency,seo_title?,seo_description?,seo_image_media_asset_id? -> media_assets,seo_site_url? | one row, INR only; no secret or payment keys |
| business_social_links | business_id -> business_settings,label,url,sort_order | UQ(business_id,label); HTTPS allowlist |
| compliance_settings | singleton id,gstin_value VARCHAR(15)?,gstin_visible,fssai_value VARCHAR(14)?,fssai_visible,notes? | one row; API hides invalid/nonvisible; do not claim registration verification |
| admin_users | email,name,password_hash VARCHAR(255),status,last_login_at?,password_changed_at? | UQ email; password_hash never projected |
| admin_roles | role_key VARCHAR(64),name | UQ role_key |
| admin_permissions | permission_key VARCHAR(80) PK | allowlisted existing-UI scopes |
| admin_user_roles | admin_user_id -> admin_users,role_id -> admin_roles | composite PK |
| admin_role_permissions | role_id -> admin_roles,permission_key -> admin_permissions | composite PK |
| audit_logs | actor_admin_id? -> admin_users,actor_customer_id? -> customers,action VARCHAR(100),resource_type VARCHAR(60),resource_id VARCHAR(64),request_id,occurred_at,redacted_before JSON?,redacted_after JSON?,source VARCHAR(40) | append-only; IDX(resource_type,resource_id,occurred_at), (actor_admin_id,occurred_at); resource reference intentionally polymorphic history |
| idempotency_keys | actor_scope VARCHAR(100),method,path_hash CHAR(64),key_value VARCHAR(128),request_hash CHAR(64),status,result_status?,result_json JSON?,expires_at,created_at | composite UQ(actor_scope,method,path_hash,key_value); IDX(expires_at); no secret payload |
| rate_limit_buckets | bucket_hash CHAR(64),window_start,request_count INT,expires_at | composite PK(bucket_hash,window_start); indexed expiry, atomic increment |

Cart is local intent, no cart table. CustomerSession is php_sessions public projection. StoryContent is cms_pages projection. Product stock derives inventory_balances, not a second field. InventoryMovement tracks every mutation. Settings cod_enabled exists once in delivery_settings; payment settings view reads it. payment provider secrets stay out of database/public settings. Nullable circular FKs (customer default address, consumed quote order) added after tables exist; set only after child insertion. All normal relations use restrictive deletion; no cascading deletion of orders/audit/payment records. Erasure/retention policy requires approval before production.

## Transaction algorithms

Inventory initialize/set/adjust: begin, lock product and balance FOR UPDATE in stable product-ID order; require expected version; null baseline accepts initialize/set only; require resulting on_hand>=reserved>=0. Update balance/version, append movement with reason/actor/idempotency result and audit atomically. Negative adjustment is not permitted to consume reserved stock. Administrative product price/status cannot bypass inventory endpoint. [MySQL locking reads](https://dev.mysql.com/doc/refman/8.0/en/innodb-locking-reads.html).

Quote: compute using current products, owned address and configured delivery/tax; expires after proposed10min. It reserves no stock. Revalidate versions and amounts on placement; changed values return QUOTE_STALE, never silently increase total.

COD placement: begin; claim idempotency key; lock quote/customer address and relevant product/balance rows in stable order; validate owner/expiry/status/amounts/coverage. Insert immutable order/items and placed event. Atomically decrement on_hand by quantity (no temporary reservation required for COD), append deduct movements, create pending COD payment, consume quote, record idempotency result; commit. Transaction rollback leaves no partial order or stock. Never mark COD paid simply because delivered; settlement needs later authorized business process, not existing status control.

Online placement (7E): same validation, create pending-payment order and held reservations, increment reserved while leaving on_hand unchanged; reserve duration proposed15min configurable and displayed honestly. Create provider order outside DB lock using durable payment-attempt/idempotency record. External timeout leaves pending work for reconciliation, never duplicate blindly.

Capture: after verified provider state, lock payment/order/reservations; if still held, reduce on_hand and reserved together and mark consumed; update paid exactly once. Duplicate/out-of-order provider events cannot repeat movement or regress captured. If capture arrives after released reservation/cancelled order, do not fulfil or silently decrement unavailable stock: flag refund_pending, queue reconciliation/refund operation for7E, keep order cancelled. Do not announce refund completion until provider confirms.

Cancel placed/confirmed: lock order and version; repeated cancelled returns same result. COD deduction restored exactly once with restock movement; online held reservation released; consumed online stock restored once when cancellation accepted, payment refund_pending until reconciled. Append cancelled event. packed/shipped/delivered reject cancellation. Status change and stock changes share transaction.
Reservation expiry: cron worker locks due held rows, marks pending orders cancelled/expired-payment reason, releases reserved once, appends events. Existing fulfilment enum remains cancelled with explanatory event; payment status remains separate. Reconcile provider capture before final expiry where possible; late capture follows rule above. No Node worker required.

Webhook: verify signature before trusting body; durable unique event inbox insert then acknowledge; cron/inline bounded processor retries idempotently. Events can precede callback and be reordered. Compare provider amount/currency/order linkage. No transaction held across outbound HTTP. At-least-once delivery with unique keys + state machine, not a claim of exactly-once networking.

## Seeds, publishing and bootstrap

Seed only the five existing independent products, retaining IDs/slugs/demo SKUs as explicitly provisional identifiers:
- demo-atta-5kg / atta-5kg / DEMO-ATTA-5KG / Atta / 5 kg
- demo-black-oil-500ml / black-mustard-oil-500ml / DEMO-BMO-500ML / 500 ml
- demo-black-oil-1l / black-mustard-oil-1-litre / DEMO-BMO-1L / 1 L
- demo-yellow-oil-500ml / yellow-mustard-oil-500ml / DEMO-YMO-500ML / 500 ml
- demo-yellow-oil-1l / yellow-mustard-oil-1-litre / DEMO-YMO-1L / 1 L

All status coming_soon, price/compare price/on_hand null, reserved0. Category IDs category-atta (atta-flour) and category-oils (mustard-oils). Confirm real SKUs before launch; don't invent replacements. No customers, addresses, orders, sales, compliance values or sample payment data. Never import /src/dev/checkoutFixture.js.
Core CMS pages remain draft, three editorial ideas remain drafts; optional preview excerpts explicitly labelled, no published body. Seed existing homepage configuration without promoting claims/media as verified. Seed scripts keyed by immutable IDs and run once; never overwrite later edits on migration rerun.

Secure admin bootstrap: private interactive CLI creates first admin from operator-supplied email/name/password, hashes with PHP password_hash, assigns bootstrap role in transaction and logs creation without password. No hardcoded defaults, public registration or frontend bootstrap route. Require password change/rotation procedure and disable bootstrap after creation. Role definitions seeded but no invented admin identity.

Publishing sets actual published_at only after explicit review; archive hides content, core route stays stable. Block/media refs updated atomically. Compliance flags default false/value null; visible only with format-valid confirmed input, legal verification remains external.

Database schema, constraints, migrations, concurrency, backups and transaction behavior are NOT TESTED in this phase. This is a blueprint to implement and verify in7A–7F.
## Explicit search/order columns

products additionally has display_order INT NOT NULL (seed0..4 in current catalogue order) and keywords JSON NOT NULL (empty array seed). Index(status,display_order,id). This supports current independent-pack default ordering and requested keyword search. API adapters do not treat database insertion order as display order. Initial search uses bounded prepared LIKE predicates on normalized searchable fields; JSON keywords may be normalized into product_keywords(product_id FK, keyword VARCHAR(100), composite PK) when indexed search is required. Choose one authoritative representation during7B; baseline schema here uses JSON and no second mutable keyword store.

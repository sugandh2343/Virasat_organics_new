CREATE TABLE IF NOT EXISTS schema_migrations (
 version VARCHAR(100) NOT NULL PRIMARY KEY,
 checksum CHAR(64) NOT NULL,
 applied_at DATETIME(6) NOT NULL,
 execution_ms BIGINT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 email VARCHAR(254) NOT NULL,
 name VARCHAR(200) NOT NULL,
 password_hash VARCHAR(255) NOT NULL,
 status VARCHAR(32) NOT NULL,
 last_login_at DATETIME(6) NULL,
 password_changed_at DATETIME(6) NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 UNIQUE KEY uq_email (email),
 CONSTRAINT ck_admin_status CHECK (status IN ('active','disabled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_roles (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 role_key VARCHAR(64) NOT NULL,
 name VARCHAR(200) NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 UNIQUE KEY uq_role_key (role_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_permissions (
 permission_key VARCHAR(80) NOT NULL PRIMARY KEY
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_user_roles (
 admin_user_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 role_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 PRIMARY KEY (admin_user_id,role_id),
 KEY ix_admin_user_id (admin_user_id),
 KEY ix_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_role_permissions (
 role_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 permission_key VARCHAR(80) NOT NULL,
 PRIMARY KEY (role_id,permission_key),
 KEY ix_permission (permission_key),
 KEY ix_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_assets (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 storage_key VARCHAR(255) NOT NULL,
 original_name VARCHAR(200) NOT NULL,
 mime_type VARCHAR(100) NOT NULL,
 bytes BIGINT UNSIGNED NOT NULL,
 kind VARCHAR(32) NOT NULL,
 width INT UNSIGNED NULL,
 height INT UNSIGNED NULL,
 duration_ms INT UNSIGNED NULL,
 alt TEXT NULL,
 caption TEXT NULL,
 status VARCHAR(32) NOT NULL,
 checksum_sha256 CHAR(64) NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 owner_admin_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 UNIQUE KEY uq_storage_key (storage_key),
 KEY ix_status_created (status,created_at,id),
 KEY ix_checksum (checksum_sha256),
 CONSTRAINT ck_media_kind CHECK (kind IN ('image','video')),
 CONSTRAINT ck_media_status CHECK (status IN ('processing','ready','rejected','archived')),
 KEY ix_owner_admin_id (owner_admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 slug VARCHAR(120) NOT NULL,
 name VARCHAR(200) NOT NULL,
 description TEXT NULL,
 status VARCHAR(32) NOT NULL,
 sort_order INT UNSIGNED NOT NULL DEFAULT 0,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 image_media_asset_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 UNIQUE KEY uq_slug (slug),
 KEY ix_status_order (status,sort_order,id),
 CONSTRAINT ck_category_status CHECK (status IN ('active','inactive')),
 KEY ix_image_media_asset_id (image_media_asset_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 slug VARCHAR(120) NOT NULL,
 sku VARCHAR(120) NOT NULL,
 name VARCHAR(200) NOT NULL,
 size VARCHAR(40) NOT NULL,
 status VARCHAR(32) NOT NULL,
 price_paise BIGINT UNSIGNED NULL,
 compare_at_price_paise BIGINT UNSIGNED NULL,
 short_description TEXT NULL,
 long_description TEXT NULL,
 ingredients JSON NOT NULL,
 nutrition JSON NULL,
 storage TEXT NULL,
 specifications JSON NOT NULL,
 seo_title VARCHAR(200) NULL,
 seo_description TEXT NULL,
 is_core_seed BOOLEAN NOT NULL DEFAULT 0,
 display_order INT UNSIGNED NOT NULL DEFAULT 0,
 keywords JSON NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 category_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 UNIQUE KEY uq_slug (slug),
 UNIQUE KEY uq_sku (sku),
 KEY ix_category_status (category_id,status,id),
 KEY ix_status_name (status,name,id),
 KEY ix_status_order (status,display_order,id),
 CONSTRAINT ck_product_status CHECK (status IN ('active','inactive','out_of_stock','coming_soon')),
 CONSTRAINT ck_compare_price CHECK (compare_at_price_paise IS NULL OR price_paise IS NULL OR compare_at_price_paise >= price_paise),
 KEY ix_category_id (category_id),
 CONSTRAINT ck_products_price_paise CHECK (price_paise IS NULL OR price_paise<=9007199254740991),
 CONSTRAINT ck_products_compare_at_price_paise CHECK (compare_at_price_paise IS NULL OR compare_at_price_paise<=9007199254740991),
 CONSTRAINT ck_products_is_core_seed CHECK (is_core_seed IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_balances (
 product_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 on_hand INT UNSIGNED NULL,
 reserved INT UNSIGNED NOT NULL DEFAULT 0,
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 CONSTRAINT ck_balance CHECK ((on_hand IS NULL AND reserved=0) OR (on_hand IS NOT NULL AND reserved<=on_hand))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_images (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 sort_order INT UNSIGNED NOT NULL,
 alt TEXT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 product_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 media_asset_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 UNIQUE KEY uq_product_media (product_id,media_asset_id),
 UNIQUE KEY uq_product_order (product_id,sort_order),
 KEY ix_product_id (product_id),
 KEY ix_media_asset_id (media_asset_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_videos (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 sort_order INT UNSIGNED NOT NULL,
 caption TEXT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 product_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 media_asset_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 poster_media_asset_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 UNIQUE KEY uq_product_media (product_id,media_asset_id),
 UNIQUE KEY uq_product_order (product_id,sort_order),
 KEY ix_product_id (product_id),
 KEY ix_media_asset_id (media_asset_id),
 KEY ix_poster_media_asset_id (poster_media_asset_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customers (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 firebase_uid VARCHAR(128) NOT NULL,
 name VARCHAR(80) NULL,
 phone_e164 VARCHAR(16) NULL,
 phone_verified_at DATETIME(6) NULL,
 email VARCHAR(254) NULL,
 status VARCHAR(32) NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 default_address_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 UNIQUE KEY uq_firebase (firebase_uid),
 UNIQUE KEY uq_phone (phone_e164),
 KEY ix_status_created (status,created_at,id),
 CONSTRAINT ck_customer_status CHECK (status IN ('active','disabled')),
 KEY ix_default_address_id (default_address_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS addresses (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 label VARCHAR(20) NOT NULL,
 recipient VARCHAR(200) NOT NULL,
 phone_e164 VARCHAR(16) NOT NULL,
 building VARCHAR(200) NOT NULL,
 street VARCHAR(200) NOT NULL,
 locality VARCHAR(200) NOT NULL,
 city VARCHAR(200) NOT NULL,
 state VARCHAR(200) NOT NULL,
 postal_code CHAR(6) NOT NULL,
 country_code CHAR(2) NOT NULL DEFAULT 'IN',
 landmark TEXT NULL,
 instructions VARCHAR(200) NULL,
 latitude DECIMAL(10,7) NULL,
 longitude DECIMAL(10,7) NULL,
 coordinates_confirmed BOOLEAN NOT NULL DEFAULT 0,
 deleted_at DATETIME(6) NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 customer_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 KEY ix_owner_active (customer_id,deleted_at,id),
 CONSTRAINT ck_address_label CHECK (label IN ('Home','Work','Other')),
 CONSTRAINT ck_address_country CHECK (country_code='IN'),
 CONSTRAINT ck_latitude CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
 CONSTRAINT ck_longitude CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
 CONSTRAINT ck_confirmed_coords CHECK (coordinates_confirmed=0 OR (latitude IS NOT NULL AND longitude IS NOT NULL)),
 KEY ix_customer_id (customer_id),
 CONSTRAINT ck_addresses_coordinates_confirmed CHECK (coordinates_confirmed IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS php_sessions (
 id_hash CHAR(64) NOT NULL PRIMARY KEY,
 payload_encrypted BLOB NOT NULL,
 csrf_hash CHAR(64) NOT NULL,
 authenticated_at DATETIME(6) NULL,
 last_seen_at DATETIME(6) NOT NULL,
 expires_at DATETIME(6) NOT NULL,
 revoked_at DATETIME(6) NULL,
 customer_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 admin_user_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 KEY ix_expiry (expires_at),
 CONSTRAINT ck_session_owner CHECK (customer_id IS NULL OR admin_user_id IS NULL),
 KEY ix_customer_id (customer_id),
 KEY ix_admin_user_id (admin_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wishlist_items (
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 customer_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 product_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 PRIMARY KEY (customer_id,product_id),
 KEY ix_customer_id (customer_id),
 KEY ix_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS delivery_settings (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 configured BOOLEAN NOT NULL DEFAULT 0,
 default_shipping_paise BIGINT UNSIGNED NULL,
 minimum_order_paise BIGINT UNSIGNED NULL,
 free_shipping_threshold_paise BIGINT UNSIGNED NULL,
 cod_enabled BOOLEAN NOT NULL DEFAULT 0,
 origin_address JSON NULL,
 tax_policy_version VARCHAR(100) NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 CONSTRAINT ck_delivery_singleton CHECK (id='delivery-settings'),
 CONSTRAINT ck_delivery_settings_configured CHECK (configured IN (0,1)),
 CONSTRAINT ck_delivery_settings_default_shipping_paise CHECK (default_shipping_paise IS NULL OR default_shipping_paise<=9007199254740991),
 CONSTRAINT ck_delivery_settings_minimum_order_paise CHECK (minimum_order_paise IS NULL OR minimum_order_paise<=9007199254740991),
 CONSTRAINT ck_delivery_settings_free_shipping_threshold_paise CHECK (free_shipping_threshold_paise IS NULL OR free_shipping_threshold_paise<=9007199254740991),
 CONSTRAINT ck_delivery_settings_cod_enabled CHECK (cod_enabled IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS delivery_zones (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 name VARCHAR(200) NOT NULL,
 status VARCHAR(32) NOT NULL,
 shipping_paise BIGINT UNSIGNED NULL,
 minimum_order_paise BIGINT UNSIGNED NULL,
 free_shipping_threshold_paise BIGINT UNSIGNED NULL,
 cod_enabled BOOLEAN NOT NULL DEFAULT 0,
 priority INT NOT NULL DEFAULT 0,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 KEY ix_zone_status (status,priority),
 CONSTRAINT ck_zone_status CHECK (status IN ('active','inactive')),
 CONSTRAINT ck_delivery_zones_shipping_paise CHECK (shipping_paise IS NULL OR shipping_paise<=9007199254740991),
 CONSTRAINT ck_delivery_zones_minimum_order_paise CHECK (minimum_order_paise IS NULL OR minimum_order_paise<=9007199254740991),
 CONSTRAINT ck_delivery_zones_free_shipping_threshold_paise CHECK (free_shipping_threshold_paise IS NULL OR free_shipping_threshold_paise<=9007199254740991),
 CONSTRAINT ck_delivery_zones_cod_enabled CHECK (cod_enabled IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS delivery_zone_pins (
 postal_code CHAR(6) NOT NULL PRIMARY KEY,
 zone_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 KEY ix_zone_id (zone_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS checkout_quotes (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 address_version BIGINT UNSIGNED NOT NULL,
 settings_version BIGINT UNSIGNED NOT NULL,
 currency CHAR(3) NOT NULL DEFAULT 'INR',
 subtotal_paise BIGINT UNSIGNED NOT NULL,
 shipping_paise BIGINT UNSIGNED NOT NULL,
 tax_paise BIGINT UNSIGNED NOT NULL,
 total_paise BIGINT UNSIGNED NOT NULL,
 payment_methods JSON NOT NULL,
 expires_at DATETIME(6) NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 customer_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 address_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 delivery_zone_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 consumed_order_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 KEY ix_owner_expiry (customer_id,expires_at),
 UNIQUE KEY uq_consumed (consumed_order_id),
 CONSTRAINT ck_quote_total CHECK (total_paise=subtotal_paise+shipping_paise+tax_paise),
 KEY ix_customer_id (customer_id),
 KEY ix_address_id (address_id),
 KEY ix_delivery_zone_id (delivery_zone_id),
 KEY ix_consumed_order_id (consumed_order_id),
 CONSTRAINT ck_checkout_quotes_currency CHECK (currency='INR'),
 CONSTRAINT ck_checkout_quotes_subtotal_paise CHECK (subtotal_paise IS NULL OR subtotal_paise<=9007199254740991),
 CONSTRAINT ck_checkout_quotes_shipping_paise CHECK (shipping_paise IS NULL OR shipping_paise<=9007199254740991),
 CONSTRAINT ck_checkout_quotes_tax_paise CHECK (tax_paise IS NULL OR tax_paise<=9007199254740991),
 CONSTRAINT ck_checkout_quotes_total_paise CHECK (total_paise IS NULL OR total_paise<=9007199254740991)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quote_items (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 product_version BIGINT UNSIGNED NOT NULL,
 quantity INT UNSIGNED NOT NULL,
 unit_price_paise BIGINT UNSIGNED NOT NULL,
 line_subtotal_paise BIGINT UNSIGNED NOT NULL,
 tax_paise BIGINT UNSIGNED NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 quote_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 product_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 UNIQUE KEY uq_quote_product (quote_id,product_id),
 CONSTRAINT ck_quote_quantity CHECK (quantity>0),
 CONSTRAINT ck_quote_line CHECK (line_subtotal_paise=quantity*unit_price_paise),
 KEY ix_quote_id (quote_id),
 KEY ix_product_id (product_id),
 CONSTRAINT ck_quote_items_unit_price_paise CHECK (unit_price_paise IS NULL OR unit_price_paise<=9007199254740991),
 CONSTRAINT ck_quote_items_line_subtotal_paise CHECK (line_subtotal_paise IS NULL OR line_subtotal_paise<=9007199254740991),
 CONSTRAINT ck_quote_items_tax_paise CHECK (tax_paise IS NULL OR tax_paise<=9007199254740991)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 public_reference VARCHAR(64) NOT NULL,
 status VARCHAR(32) NOT NULL,
 payment_method VARCHAR(32) NOT NULL,
 payment_status VARCHAR(32) NOT NULL,
 currency CHAR(3) NOT NULL DEFAULT 'INR',
 subtotal_paise BIGINT UNSIGNED NOT NULL,
 shipping_paise BIGINT UNSIGNED NOT NULL,
 tax_paise BIGINT UNSIGNED NOT NULL,
 total_paise BIGINT UNSIGNED NOT NULL,
 delivery_address_snapshot JSON NOT NULL,
 customer_snapshot JSON NOT NULL,
 delivery_instructions VARCHAR(200) NULL,
 idempotency_key VARCHAR(128) NOT NULL,
 placed_at DATETIME(6) NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 customer_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 quote_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 UNIQUE KEY uq_reference (public_reference),
 UNIQUE KEY uq_quote (quote_id),
 UNIQUE KEY uq_owner_request (customer_id,idempotency_key),
 KEY ix_owner_created (customer_id,created_at,id),
 KEY ix_status_created (status,created_at,id),
 CONSTRAINT ck_order_total CHECK (total_paise=subtotal_paise+shipping_paise+tax_paise),
 CONSTRAINT ck_order_status CHECK (status IN ('placed','confirmed','packed','shipped','out_for_delivery','delivered','cancelled')),
 CONSTRAINT ck_order_method CHECK (payment_method IN ('cod','razorpay')),
 CONSTRAINT ck_order_payment_status CHECK (payment_status IN ('pending','authorized','paid','failed','refund_pending','refunded')),
 KEY ix_customer_id (customer_id),
 KEY ix_quote_id (quote_id),
 CONSTRAINT ck_orders_currency CHECK (currency='INR'),
 CONSTRAINT ck_orders_subtotal_paise CHECK (subtotal_paise IS NULL OR subtotal_paise<=9007199254740991),
 CONSTRAINT ck_orders_shipping_paise CHECK (shipping_paise IS NULL OR shipping_paise<=9007199254740991),
 CONSTRAINT ck_orders_tax_paise CHECK (tax_paise IS NULL OR tax_paise<=9007199254740991),
 CONSTRAINT ck_orders_total_paise CHECK (total_paise IS NULL OR total_paise<=9007199254740991)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 sku_snapshot VARCHAR(120) NOT NULL,
 name_snapshot VARCHAR(200) NOT NULL,
 size_snapshot VARCHAR(40) NOT NULL,
 media_snapshot JSON NULL,
 quantity INT UNSIGNED NOT NULL,
 unit_price_paise BIGINT UNSIGNED NOT NULL,
 line_subtotal_paise BIGINT UNSIGNED NOT NULL,
 tax_paise BIGINT UNSIGNED NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 order_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 product_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 UNIQUE KEY uq_order_product (order_id,product_id),
 CONSTRAINT ck_order_quantity CHECK (quantity>0),
 CONSTRAINT ck_order_line CHECK (line_subtotal_paise=quantity*unit_price_paise),
 KEY ix_order_id (order_id),
 KEY ix_product_id (product_id),
 CONSTRAINT ck_order_items_unit_price_paise CHECK (unit_price_paise IS NULL OR unit_price_paise<=9007199254740991),
 CONSTRAINT ck_order_items_line_subtotal_paise CHECK (line_subtotal_paise IS NULL OR line_subtotal_paise<=9007199254740991),
 CONSTRAINT ck_order_items_tax_paise CHECK (tax_paise IS NULL OR tax_paise<=9007199254740991)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_status_events (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 from_status VARCHAR(32) NULL,
 to_status VARCHAR(32) NOT NULL,
 occurred_at DATETIME(6) NOT NULL,
 public_note TEXT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 order_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 actor_admin_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 actor_customer_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 KEY ix_order_time (order_id,occurred_at,id),
 CONSTRAINT ck_event_to CHECK (to_status IN ('placed','confirmed','packed','shipped','out_for_delivery','delivered','cancelled')),
 CONSTRAINT ck_event_actor CHECK (actor_admin_id IS NULL OR actor_customer_id IS NULL),
 KEY ix_order_id (order_id),
 KEY ix_actor_admin_id (actor_admin_id),
 KEY ix_actor_customer_id (actor_customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_notes (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 note TEXT NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 order_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 admin_user_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 KEY ix_order_created (order_id,created_at),
 KEY ix_order_id (order_id),
 KEY ix_admin_user_id (admin_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_reservations (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 quantity INT UNSIGNED NOT NULL,
 status VARCHAR(32) NOT NULL,
 expires_at DATETIME(6) NULL,
 consumed_at DATETIME(6) NULL,
 released_at DATETIME(6) NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 order_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 product_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 UNIQUE KEY uq_order_product (order_id,product_id),
 KEY ix_status_expiry (status,expires_at),
 CONSTRAINT ck_reservation_status CHECK (status IN ('held','consumed','released')),
 CONSTRAINT ck_reservation_quantity CHECK (quantity>0),
 CONSTRAINT ck_reservation_terminal CHECK (consumed_at IS NULL OR released_at IS NULL),
 KEY ix_order_id (order_id),
 KEY ix_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_movements (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 kind VARCHAR(32) NOT NULL,
 on_hand_delta INT NOT NULL,
 reserved_delta INT NOT NULL,
 reason TEXT NOT NULL,
 idempotency_key VARCHAR(128) NOT NULL,
 resulting_on_hand INT UNSIGNED NOT NULL,
 resulting_reserved INT UNSIGNED NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 product_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 actor_admin_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 order_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 reservation_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 KEY ix_product_created (product_id,created_at,id),
 UNIQUE KEY uq_movement (idempotency_key,product_id,kind),
 CONSTRAINT ck_movement_kind CHECK (kind IN ('initialize','adjust','reserve','release','deduct','restock')),
 CONSTRAINT ck_movement_balance CHECK (resulting_reserved<=resulting_on_hand),
 KEY ix_product_id (product_id),
 KEY ix_actor_admin_id (actor_admin_id),
 KEY ix_order_id (order_id),
 KEY ix_reservation_id (reservation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 provider VARCHAR(32) NOT NULL,
 provider_order_id VARCHAR(128) NULL,
 provider_payment_id VARCHAR(128) NULL,
 amount_paise BIGINT UNSIGNED NOT NULL,
 currency CHAR(3) NOT NULL DEFAULT 'INR',
 status VARCHAR(32) NOT NULL,
 captured_at DATETIME(6) NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 order_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 UNIQUE KEY uq_provider_order (provider,provider_order_id),
 UNIQUE KEY uq_provider_payment (provider,provider_payment_id),
 KEY ix_order_status (order_id,status),
 CONSTRAINT ck_payment_provider CHECK (provider IN ('cod','razorpay')),
 CONSTRAINT ck_payment_state CHECK (status IN ('created','authorized','captured','failed','refund_pending','refunded')),
 KEY ix_order_id (order_id),
 CONSTRAINT ck_payments_amount_paise CHECK (amount_paise IS NULL OR amount_paise<=9007199254740991),
 CONSTRAINT ck_payments_currency CHECK (currency='INR')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_events (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 provider VARCHAR(32) NOT NULL,
 event_id VARCHAR(255) NOT NULL,
 body_hash CHAR(64) NOT NULL,
 payload_encrypted BLOB NOT NULL,
 signature_verified_at DATETIME(6) NOT NULL,
 received_at DATETIME(6) NOT NULL,
 processed_at DATETIME(6) NULL,
 status VARCHAR(32) NOT NULL,
 attempts INT UNSIGNED NOT NULL DEFAULT 0,
 last_error_code VARCHAR(80) NULL,
 payment_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 UNIQUE KEY uq_provider_event (provider,event_id),
 KEY ix_status_received (status,received_at),
 CONSTRAINT ck_payment_event_status CHECK (status IN ('pending','processed','failed')),
 KEY ix_payment_id (payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS homepage_sections (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 section_key VARCHAR(40) NOT NULL,
 enabled BOOLEAN NOT NULL DEFAULT 0,
 sort_order INT UNSIGNED NOT NULL,
 content JSON NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 UNIQUE KEY uq_section (section_key),
 UNIQUE KEY uq_sort (sort_order),
 CONSTRAINT ck_section_key CHECK (section_key IN ('hero','categories','collection','introduction','gallery','story','values','journal','testimonials','newsletter')),
 CONSTRAINT ck_homepage_sections_enabled CHECK (enabled IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS banners (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 title VARCHAR(200) NOT NULL,
 alt TEXT NULL,
 cta_label VARCHAR(200) NULL,
 cta_destination VARCHAR(2048) NULL,
 status VARCHAR(32) NOT NULL,
 sort_order INT UNSIGNED NOT NULL DEFAULT 0,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 desktop_media_asset_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 mobile_media_asset_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 KEY ix_status_sort (status,sort_order,id),
 CONSTRAINT ck_banner_status CHECK (status IN ('active','inactive','archived')),
 KEY ix_desktop_media_asset_id (desktop_media_asset_id),
 KEY ix_mobile_media_asset_id (mobile_media_asset_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_categories (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 slug VARCHAR(120) NOT NULL,
 name VARCHAR(200) NOT NULL,
 status VARCHAR(32) NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 UNIQUE KEY uq_slug (slug),
 CONSTRAINT ck_blog_category_status CHECK (status IN ('active','inactive'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_posts (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 slug VARCHAR(120) NOT NULL,
 title VARCHAR(200) NOT NULL,
 blocks JSON NOT NULL,
 status VARCHAR(32) NOT NULL,
 seo_title VARCHAR(200) NULL,
 seo_description TEXT NULL,
 published_at DATETIME(6) NULL,
 is_core_seed BOOLEAN NOT NULL DEFAULT 0,
 excerpt TEXT NULL,
 preview_enabled BOOLEAN NOT NULL DEFAULT 0,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 blog_category_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 image_media_asset_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 author_admin_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 UNIQUE KEY uq_slug (slug),
 KEY ix_status_published (status,published_at,id),
 CONSTRAINT ck_blog_status CHECK (status IN ('draft','published','archived')),
 CONSTRAINT ck_blog_published CHECK (status<>'published' OR (published_at IS NOT NULL AND JSON_LENGTH(blocks)>0)),
 KEY ix_blog_category_id (blog_category_id),
 KEY ix_image_media_asset_id (image_media_asset_id),
 KEY ix_author_admin_id (author_admin_id),
 CONSTRAINT ck_blog_posts_is_core_seed CHECK (is_core_seed IN (0,1)),
 CONSTRAINT ck_blog_posts_preview_enabled CHECK (preview_enabled IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cms_pages (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 slug VARCHAR(120) NOT NULL,
 title VARCHAR(200) NOT NULL,
 blocks JSON NOT NULL,
 status VARCHAR(32) NOT NULL,
 seo_title VARCHAR(200) NULL,
 seo_description TEXT NULL,
 published_at DATETIME(6) NULL,
 is_core_seed BOOLEAN NOT NULL DEFAULT 0,
 description TEXT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 video_media_asset_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 poster_media_asset_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 UNIQUE KEY uq_slug (slug),
 CONSTRAINT ck_cms_status CHECK (status IN ('draft','published','archived')),
 CONSTRAINT ck_cms_published CHECK (status<>'published' OR (published_at IS NOT NULL AND JSON_LENGTH(blocks)>0)),
 KEY ix_video_media_asset_id (video_media_asset_id),
 KEY ix_poster_media_asset_id (poster_media_asset_id),
 CONSTRAINT ck_cms_pages_is_core_seed CHECK (is_core_seed IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_references (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 field_path VARCHAR(255) NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 media_asset_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 homepage_section_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 blog_post_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 cms_page_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 CONSTRAINT ck_media_owner CHECK ((homepage_section_id IS NOT NULL)+(blog_post_id IS NOT NULL)+(cms_page_id IS NOT NULL)=1),
 KEY ix_media_asset_id (media_asset_id),
 KEY ix_homepage_section_id (homepage_section_id),
 KEY ix_blog_post_id (blog_post_id),
 KEY ix_cms_page_id (cms_page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS business_settings (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 name VARCHAR(200) NOT NULL,
 hindi_name VARCHAR(200) NULL,
 tagline VARCHAR(200) NULL,
 logo_alt VARCHAR(200) NULL,
 introduction TEXT NULL,
 email VARCHAR(254) NULL,
 phone_e164 VARCHAR(16) NULL,
 whatsapp_e164 VARCHAR(16) NULL,
 address TEXT NULL,
 operating_hours TEXT NULL,
 contacts_visible BOOLEAN NOT NULL DEFAULT 0,
 announcement_enabled BOOLEAN NOT NULL DEFAULT 0,
 preview_notice TEXT NULL,
 footer_description_visible BOOLEAN NOT NULL DEFAULT 0,
 footer_note TEXT NULL,
 maintenance_enabled BOOLEAN NOT NULL DEFAULT 0,
 accept_orders BOOLEAN NOT NULL DEFAULT 0,
 currency CHAR(3) NOT NULL DEFAULT 'INR',
 seo_title VARCHAR(200) NULL,
 seo_description TEXT NULL,
 seo_site_url VARCHAR(2048) NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 logo_media_asset_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 seo_image_media_asset_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 CONSTRAINT ck_business_singleton CHECK (id='business-virasat'),
 KEY ix_logo_media_asset_id (logo_media_asset_id),
 KEY ix_seo_image_media_asset_id (seo_image_media_asset_id),
 CONSTRAINT ck_business_settings_contacts_visible CHECK (contacts_visible IN (0,1)),
 CONSTRAINT ck_business_settings_announcement_enabled CHECK (announcement_enabled IN (0,1)),
 CONSTRAINT ck_business_settings_footer_description_visible CHECK (footer_description_visible IN (0,1)),
 CONSTRAINT ck_business_settings_maintenance_enabled CHECK (maintenance_enabled IN (0,1)),
 CONSTRAINT ck_business_settings_accept_orders CHECK (accept_orders IN (0,1)),
 CONSTRAINT ck_business_settings_currency CHECK (currency='INR')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS business_social_links (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 label VARCHAR(80) NOT NULL,
 url VARCHAR(2048) NOT NULL,
 sort_order INT UNSIGNED NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 business_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 UNIQUE KEY uq_business_label (business_id,label),
 KEY ix_business_id (business_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS compliance_settings (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 gstin_value VARCHAR(15) NULL,
 gstin_visible BOOLEAN NOT NULL DEFAULT 0,
 fssai_value VARCHAR(14) NULL,
 fssai_visible BOOLEAN NOT NULL DEFAULT 0,
 notes TEXT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 CONSTRAINT ck_compliance_singleton CHECK (id='compliance-settings'),
 CONSTRAINT ck_compliance_settings_gstin_visible CHECK (gstin_visible IN (0,1)),
 CONSTRAINT ck_compliance_settings_fssai_visible CHECK (fssai_visible IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 action VARCHAR(100) NOT NULL,
 resource_type VARCHAR(60) NOT NULL,
 resource_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 request_id VARCHAR(64) NOT NULL,
 occurred_at DATETIME(6) NOT NULL,
 redacted_before JSON NULL,
 redacted_after JSON NULL,
 source VARCHAR(40) NOT NULL,
 actor_admin_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 actor_customer_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
 KEY ix_resource_time (resource_type,resource_id,occurred_at),
 KEY ix_actor_time (actor_admin_id,occurred_at),
 CONSTRAINT ck_audit_actor CHECK (actor_admin_id IS NULL OR actor_customer_id IS NULL),
 KEY ix_actor_admin_id (actor_admin_id),
 KEY ix_actor_customer_id (actor_customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS idempotency_keys (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 actor_scope VARCHAR(100) NOT NULL,
 method VARCHAR(10) NOT NULL,
 path_hash CHAR(64) NOT NULL,
 key_value VARCHAR(128) NOT NULL,
 request_hash CHAR(64) NOT NULL,
 status VARCHAR(20) NOT NULL,
 result_status SMALLINT UNSIGNED NULL,
 result_json JSON NULL,
 expires_at DATETIME(6) NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 UNIQUE KEY uq_request (actor_scope,method,path_hash,key_value),
 KEY ix_expiry (expires_at),
 CONSTRAINT ck_idempotency_status CHECK (status IN ('pending','complete'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
 bucket_hash CHAR(64) NOT NULL,
 window_start DATETIME(6) NOT NULL,
 request_count INT UNSIGNED NOT NULL,
 expires_at DATETIME(6) NOT NULL,
 PRIMARY KEY (bucket_hash,window_start),
 KEY ix_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

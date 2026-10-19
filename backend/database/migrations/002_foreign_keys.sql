SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='admin_user_roles' AND CONSTRAINT_NAME='fk_admin_user_roles_admin_user_id'), 'SELECT 1', 'ALTER TABLE admin_user_roles ADD CONSTRAINT fk_admin_user_roles_admin_user_id FOREIGN KEY (admin_user_id) REFERENCES admin_users (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='admin_user_roles' AND CONSTRAINT_NAME='fk_admin_user_roles_role_id'), 'SELECT 1', 'ALTER TABLE admin_user_roles ADD CONSTRAINT fk_admin_user_roles_role_id FOREIGN KEY (role_id) REFERENCES admin_roles (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='admin_role_permissions' AND CONSTRAINT_NAME='fk_admin_role_permissions_role_id'), 'SELECT 1', 'ALTER TABLE admin_role_permissions ADD CONSTRAINT fk_admin_role_permissions_role_id FOREIGN KEY (role_id) REFERENCES admin_roles (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='admin_role_permissions' AND CONSTRAINT_NAME='fk_role_permission'), 'SELECT 1', 'ALTER TABLE admin_role_permissions ADD CONSTRAINT fk_role_permission FOREIGN KEY (permission_key) REFERENCES admin_permissions (permission_key) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='media_assets' AND CONSTRAINT_NAME='fk_media_assets_owner_admin_id'), 'SELECT 1', 'ALTER TABLE media_assets ADD CONSTRAINT fk_media_assets_owner_admin_id FOREIGN KEY (owner_admin_id) REFERENCES admin_users (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='categories' AND CONSTRAINT_NAME='fk_categories_image_media_asset_id'), 'SELECT 1', 'ALTER TABLE categories ADD CONSTRAINT fk_categories_image_media_asset_id FOREIGN KEY (image_media_asset_id) REFERENCES media_assets (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='products' AND CONSTRAINT_NAME='fk_products_category_id'), 'SELECT 1', 'ALTER TABLE products ADD CONSTRAINT fk_products_category_id FOREIGN KEY (category_id) REFERENCES categories (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='inventory_balances' AND CONSTRAINT_NAME='fk_balance_product'), 'SELECT 1', 'ALTER TABLE inventory_balances ADD CONSTRAINT fk_balance_product FOREIGN KEY (product_id) REFERENCES products (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='product_images' AND CONSTRAINT_NAME='fk_product_images_product_id'), 'SELECT 1', 'ALTER TABLE product_images ADD CONSTRAINT fk_product_images_product_id FOREIGN KEY (product_id) REFERENCES products (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='product_images' AND CONSTRAINT_NAME='fk_product_images_media_asset_id'), 'SELECT 1', 'ALTER TABLE product_images ADD CONSTRAINT fk_product_images_media_asset_id FOREIGN KEY (media_asset_id) REFERENCES media_assets (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='product_videos' AND CONSTRAINT_NAME='fk_product_videos_product_id'), 'SELECT 1', 'ALTER TABLE product_videos ADD CONSTRAINT fk_product_videos_product_id FOREIGN KEY (product_id) REFERENCES products (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='product_videos' AND CONSTRAINT_NAME='fk_product_videos_media_asset_id'), 'SELECT 1', 'ALTER TABLE product_videos ADD CONSTRAINT fk_product_videos_media_asset_id FOREIGN KEY (media_asset_id) REFERENCES media_assets (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='product_videos' AND CONSTRAINT_NAME='fk_product_videos_poster_media_asset_id'), 'SELECT 1', 'ALTER TABLE product_videos ADD CONSTRAINT fk_product_videos_poster_media_asset_id FOREIGN KEY (poster_media_asset_id) REFERENCES media_assets (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='customers' AND CONSTRAINT_NAME='fk_customers_default_address_id'), 'SELECT 1', 'ALTER TABLE customers ADD CONSTRAINT fk_customers_default_address_id FOREIGN KEY (default_address_id) REFERENCES addresses (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='addresses' AND CONSTRAINT_NAME='fk_addresses_customer_id'), 'SELECT 1', 'ALTER TABLE addresses ADD CONSTRAINT fk_addresses_customer_id FOREIGN KEY (customer_id) REFERENCES customers (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='php_sessions' AND CONSTRAINT_NAME='fk_php_sessions_customer_id'), 'SELECT 1', 'ALTER TABLE php_sessions ADD CONSTRAINT fk_php_sessions_customer_id FOREIGN KEY (customer_id) REFERENCES customers (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='php_sessions' AND CONSTRAINT_NAME='fk_php_sessions_admin_user_id'), 'SELECT 1', 'ALTER TABLE php_sessions ADD CONSTRAINT fk_php_sessions_admin_user_id FOREIGN KEY (admin_user_id) REFERENCES admin_users (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='wishlist_items' AND CONSTRAINT_NAME='fk_wishlist_items_customer_id'), 'SELECT 1', 'ALTER TABLE wishlist_items ADD CONSTRAINT fk_wishlist_items_customer_id FOREIGN KEY (customer_id) REFERENCES customers (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='wishlist_items' AND CONSTRAINT_NAME='fk_wishlist_items_product_id'), 'SELECT 1', 'ALTER TABLE wishlist_items ADD CONSTRAINT fk_wishlist_items_product_id FOREIGN KEY (product_id) REFERENCES products (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='delivery_zone_pins' AND CONSTRAINT_NAME='fk_delivery_zone_pins_zone_id'), 'SELECT 1', 'ALTER TABLE delivery_zone_pins ADD CONSTRAINT fk_delivery_zone_pins_zone_id FOREIGN KEY (zone_id) REFERENCES delivery_zones (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='checkout_quotes' AND CONSTRAINT_NAME='fk_checkout_quotes_customer_id'), 'SELECT 1', 'ALTER TABLE checkout_quotes ADD CONSTRAINT fk_checkout_quotes_customer_id FOREIGN KEY (customer_id) REFERENCES customers (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='checkout_quotes' AND CONSTRAINT_NAME='fk_checkout_quotes_address_id'), 'SELECT 1', 'ALTER TABLE checkout_quotes ADD CONSTRAINT fk_checkout_quotes_address_id FOREIGN KEY (address_id) REFERENCES addresses (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='checkout_quotes' AND CONSTRAINT_NAME='fk_checkout_quotes_delivery_zone_id'), 'SELECT 1', 'ALTER TABLE checkout_quotes ADD CONSTRAINT fk_checkout_quotes_delivery_zone_id FOREIGN KEY (delivery_zone_id) REFERENCES delivery_zones (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='checkout_quotes' AND CONSTRAINT_NAME='fk_checkout_quotes_consumed_order_id'), 'SELECT 1', 'ALTER TABLE checkout_quotes ADD CONSTRAINT fk_checkout_quotes_consumed_order_id FOREIGN KEY (consumed_order_id) REFERENCES orders (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='quote_items' AND CONSTRAINT_NAME='fk_quote_items_quote_id'), 'SELECT 1', 'ALTER TABLE quote_items ADD CONSTRAINT fk_quote_items_quote_id FOREIGN KEY (quote_id) REFERENCES checkout_quotes (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='quote_items' AND CONSTRAINT_NAME='fk_quote_items_product_id'), 'SELECT 1', 'ALTER TABLE quote_items ADD CONSTRAINT fk_quote_items_product_id FOREIGN KEY (product_id) REFERENCES products (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND CONSTRAINT_NAME='fk_orders_customer_id'), 'SELECT 1', 'ALTER TABLE orders ADD CONSTRAINT fk_orders_customer_id FOREIGN KEY (customer_id) REFERENCES customers (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND CONSTRAINT_NAME='fk_orders_quote_id'), 'SELECT 1', 'ALTER TABLE orders ADD CONSTRAINT fk_orders_quote_id FOREIGN KEY (quote_id) REFERENCES checkout_quotes (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='order_items' AND CONSTRAINT_NAME='fk_order_items_order_id'), 'SELECT 1', 'ALTER TABLE order_items ADD CONSTRAINT fk_order_items_order_id FOREIGN KEY (order_id) REFERENCES orders (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='order_items' AND CONSTRAINT_NAME='fk_order_items_product_id'), 'SELECT 1', 'ALTER TABLE order_items ADD CONSTRAINT fk_order_items_product_id FOREIGN KEY (product_id) REFERENCES products (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='order_status_events' AND CONSTRAINT_NAME='fk_order_status_events_order_id'), 'SELECT 1', 'ALTER TABLE order_status_events ADD CONSTRAINT fk_order_status_events_order_id FOREIGN KEY (order_id) REFERENCES orders (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='order_status_events' AND CONSTRAINT_NAME='fk_order_status_events_actor_admin_id'), 'SELECT 1', 'ALTER TABLE order_status_events ADD CONSTRAINT fk_order_status_events_actor_admin_id FOREIGN KEY (actor_admin_id) REFERENCES admin_users (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='order_status_events' AND CONSTRAINT_NAME='fk_order_status_events_actor_customer_id'), 'SELECT 1', 'ALTER TABLE order_status_events ADD CONSTRAINT fk_order_status_events_actor_customer_id FOREIGN KEY (actor_customer_id) REFERENCES customers (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='order_notes' AND CONSTRAINT_NAME='fk_order_notes_order_id'), 'SELECT 1', 'ALTER TABLE order_notes ADD CONSTRAINT fk_order_notes_order_id FOREIGN KEY (order_id) REFERENCES orders (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='order_notes' AND CONSTRAINT_NAME='fk_order_notes_admin_user_id'), 'SELECT 1', 'ALTER TABLE order_notes ADD CONSTRAINT fk_order_notes_admin_user_id FOREIGN KEY (admin_user_id) REFERENCES admin_users (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='inventory_reservations' AND CONSTRAINT_NAME='fk_inventory_reservations_order_id'), 'SELECT 1', 'ALTER TABLE inventory_reservations ADD CONSTRAINT fk_inventory_reservations_order_id FOREIGN KEY (order_id) REFERENCES orders (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='inventory_reservations' AND CONSTRAINT_NAME='fk_inventory_reservations_product_id'), 'SELECT 1', 'ALTER TABLE inventory_reservations ADD CONSTRAINT fk_inventory_reservations_product_id FOREIGN KEY (product_id) REFERENCES products (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='inventory_movements' AND CONSTRAINT_NAME='fk_inventory_movements_product_id'), 'SELECT 1', 'ALTER TABLE inventory_movements ADD CONSTRAINT fk_inventory_movements_product_id FOREIGN KEY (product_id) REFERENCES products (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='inventory_movements' AND CONSTRAINT_NAME='fk_inventory_movements_actor_admin_id'), 'SELECT 1', 'ALTER TABLE inventory_movements ADD CONSTRAINT fk_inventory_movements_actor_admin_id FOREIGN KEY (actor_admin_id) REFERENCES admin_users (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='inventory_movements' AND CONSTRAINT_NAME='fk_inventory_movements_order_id'), 'SELECT 1', 'ALTER TABLE inventory_movements ADD CONSTRAINT fk_inventory_movements_order_id FOREIGN KEY (order_id) REFERENCES orders (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='inventory_movements' AND CONSTRAINT_NAME='fk_inventory_movements_reservation_id'), 'SELECT 1', 'ALTER TABLE inventory_movements ADD CONSTRAINT fk_inventory_movements_reservation_id FOREIGN KEY (reservation_id) REFERENCES inventory_reservations (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='payments' AND CONSTRAINT_NAME='fk_payments_order_id'), 'SELECT 1', 'ALTER TABLE payments ADD CONSTRAINT fk_payments_order_id FOREIGN KEY (order_id) REFERENCES orders (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='payment_events' AND CONSTRAINT_NAME='fk_payment_events_payment_id'), 'SELECT 1', 'ALTER TABLE payment_events ADD CONSTRAINT fk_payment_events_payment_id FOREIGN KEY (payment_id) REFERENCES payments (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='banners' AND CONSTRAINT_NAME='fk_banners_desktop_media_asset_id'), 'SELECT 1', 'ALTER TABLE banners ADD CONSTRAINT fk_banners_desktop_media_asset_id FOREIGN KEY (desktop_media_asset_id) REFERENCES media_assets (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='banners' AND CONSTRAINT_NAME='fk_banners_mobile_media_asset_id'), 'SELECT 1', 'ALTER TABLE banners ADD CONSTRAINT fk_banners_mobile_media_asset_id FOREIGN KEY (mobile_media_asset_id) REFERENCES media_assets (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='blog_posts' AND CONSTRAINT_NAME='fk_blog_posts_blog_category_id'), 'SELECT 1', 'ALTER TABLE blog_posts ADD CONSTRAINT fk_blog_posts_blog_category_id FOREIGN KEY (blog_category_id) REFERENCES blog_categories (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='blog_posts' AND CONSTRAINT_NAME='fk_blog_posts_image_media_asset_id'), 'SELECT 1', 'ALTER TABLE blog_posts ADD CONSTRAINT fk_blog_posts_image_media_asset_id FOREIGN KEY (image_media_asset_id) REFERENCES media_assets (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='blog_posts' AND CONSTRAINT_NAME='fk_blog_posts_author_admin_id'), 'SELECT 1', 'ALTER TABLE blog_posts ADD CONSTRAINT fk_blog_posts_author_admin_id FOREIGN KEY (author_admin_id) REFERENCES admin_users (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='cms_pages' AND CONSTRAINT_NAME='fk_cms_pages_video_media_asset_id'), 'SELECT 1', 'ALTER TABLE cms_pages ADD CONSTRAINT fk_cms_pages_video_media_asset_id FOREIGN KEY (video_media_asset_id) REFERENCES media_assets (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='cms_pages' AND CONSTRAINT_NAME='fk_cms_pages_poster_media_asset_id'), 'SELECT 1', 'ALTER TABLE cms_pages ADD CONSTRAINT fk_cms_pages_poster_media_asset_id FOREIGN KEY (poster_media_asset_id) REFERENCES media_assets (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='media_references' AND CONSTRAINT_NAME='fk_media_references_media_asset_id'), 'SELECT 1', 'ALTER TABLE media_references ADD CONSTRAINT fk_media_references_media_asset_id FOREIGN KEY (media_asset_id) REFERENCES media_assets (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='media_references' AND CONSTRAINT_NAME='fk_media_references_homepage_section_id'), 'SELECT 1', 'ALTER TABLE media_references ADD CONSTRAINT fk_media_references_homepage_section_id FOREIGN KEY (homepage_section_id) REFERENCES homepage_sections (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='media_references' AND CONSTRAINT_NAME='fk_media_references_blog_post_id'), 'SELECT 1', 'ALTER TABLE media_references ADD CONSTRAINT fk_media_references_blog_post_id FOREIGN KEY (blog_post_id) REFERENCES blog_posts (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='media_references' AND CONSTRAINT_NAME='fk_media_references_cms_page_id'), 'SELECT 1', 'ALTER TABLE media_references ADD CONSTRAINT fk_media_references_cms_page_id FOREIGN KEY (cms_page_id) REFERENCES cms_pages (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='business_settings' AND CONSTRAINT_NAME='fk_business_settings_logo_media_asset_id'), 'SELECT 1', 'ALTER TABLE business_settings ADD CONSTRAINT fk_business_settings_logo_media_asset_id FOREIGN KEY (logo_media_asset_id) REFERENCES media_assets (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='business_settings' AND CONSTRAINT_NAME='fk_business_settings_seo_image_media_asset_id'), 'SELECT 1', 'ALTER TABLE business_settings ADD CONSTRAINT fk_business_settings_seo_image_media_asset_id FOREIGN KEY (seo_image_media_asset_id) REFERENCES media_assets (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='business_social_links' AND CONSTRAINT_NAME='fk_business_social_links_business_id'), 'SELECT 1', 'ALTER TABLE business_social_links ADD CONSTRAINT fk_business_social_links_business_id FOREIGN KEY (business_id) REFERENCES business_settings (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='audit_logs' AND CONSTRAINT_NAME='fk_audit_logs_actor_admin_id'), 'SELECT 1', 'ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_actor_admin_id FOREIGN KEY (actor_admin_id) REFERENCES admin_users (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='audit_logs' AND CONSTRAINT_NAME='fk_audit_logs_actor_customer_id'), 'SELECT 1', 'ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_actor_customer_id FOREIGN KEY (actor_customer_id) REFERENCES customers (id) ON UPDATE RESTRICT ON DELETE RESTRICT');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

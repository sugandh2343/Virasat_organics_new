-- Phase 7D additive migration. Backup first; import once after verifying columns absent.
-- MySQL DDL auto-commits. If interrupted, inspect information_schema before resuming individual statements.
ALTER TABLE delivery_settings
 ADD COLUMN tax_mode VARCHAR(32) NULL,
 ADD COLUMN tax_basis_points INT UNSIGNED NULL,
 ADD COLUMN tax_shipping BOOLEAN NOT NULL DEFAULT 0,
 ADD COLUMN maximum_distance_m INT UNSIGNED NULL;
ALTER TABLE delivery_zones ADD COLUMN estimate_min_days INT UNSIGNED NULL, ADD COLUMN estimate_max_days INT UNSIGNED NULL;
-- These PIN coverage coordinates are administrator-reviewed, not customer supplied.
ALTER TABLE delivery_zone_pins ADD COLUMN latitude DECIMAL(10,7) NULL, ADD COLUMN longitude DECIMAL(10,7) NULL, ADD COLUMN coverage_radius_m INT UNSIGNED NULL;
ALTER TABLE checkout_quotes ADD COLUMN snapshot JSON NULL;
ALTER TABLE orders ADD COLUMN request_hash CHAR(64) NULL;
INSERT INTO delivery_settings (id) SELECT 'delivery-settings' WHERE NOT EXISTS (SELECT 1 FROM delivery_settings WHERE id='delivery-settings');
INSERT INTO admin_permissions (permission_key) VALUES ('orders.manage'),('settings.write') ON DUPLICATE KEY UPDATE permission_key=VALUES(permission_key);
-- No user/role grant and no order acceptance flag are enabled by this migration.

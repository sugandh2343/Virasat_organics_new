-- Run read-only checks in the selected V2 database after importing 004_cod_commerce.sql.
-- Expect exactly these eleven new columns; review types/nullability as well as count.
SELECT TABLE_NAME,COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA=DATABASE() AND (
 (TABLE_NAME='delivery_settings' AND COLUMN_NAME IN ('tax_mode','tax_basis_points','tax_shipping','maximum_distance_m')) OR
 (TABLE_NAME='delivery_zones' AND COLUMN_NAME IN ('estimate_min_days','estimate_max_days')) OR
 (TABLE_NAME='delivery_zone_pins' AND COLUMN_NAME IN ('latitude','longitude','coverage_radius_m')) OR
 (TABLE_NAME='checkout_quotes' AND COLUMN_NAME='snapshot') OR
 (TABLE_NAME='orders' AND COLUMN_NAME='request_hash')) ORDER BY TABLE_NAME,COLUMN_NAME;
SELECT id,configured,cod_enabled,tax_mode,tax_basis_points,tax_policy_version,version FROM delivery_settings WHERE id='delivery-settings';
SELECT permission_key FROM admin_permissions WHERE permission_key IN ('orders.manage','settings.write');
SELECT COUNT(*) AS invalid_balances FROM inventory_balances WHERE reserved<0 OR on_hand<0 OR (on_hand IS NULL AND reserved<>0) OR reserved>on_hand;
-- Expected invalid_balances = 0. Do not rewrite balances to make this check pass.
SELECT INDEX_NAME,GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns_in_order FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND NON_UNIQUE=0 GROUP BY INDEX_NAME;
-- Confirm uq_quote(quote_id), uq_owner_request(customer_id,idempotency_key), uq_reference(public_reference).
-- Optional permission verification after selecting an approved existing admin email:
-- SELECT DISTINCT rp.permission_key FROM admin_users u JOIN admin_user_roles ur ON ur.admin_user_id=u.id JOIN admin_role_permissions rp ON rp.role_id=ur.role_id WHERE u.email='APPROVED_ADMIN_EMAIL' AND u.status='active';

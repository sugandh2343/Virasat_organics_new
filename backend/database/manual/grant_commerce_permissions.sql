-- OPTIONAL operator-reviewed grant. Do not import until you approve the target administrator.
-- Replace NULL below with the exact existing administrator email as a SQL string.
SET @commerce_admin_email = NULL;
SET @commerce_admin_id = (SELECT id FROM admin_users WHERE email=@commerce_admin_email AND status='active');
SET @commerce_role_id = CONCAT('commerce-',MD5(@commerce_admin_id));
START TRANSACTION;
INSERT INTO admin_roles (id,role_key,name)
 SELECT @commerce_role_id,@commerce_role_id,'Commerce operator' WHERE @commerce_admin_id IS NOT NULL
 ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO admin_role_permissions (role_id,permission_key)
 SELECT @commerce_role_id,permission_key FROM admin_permissions WHERE permission_key IN ('orders.manage','settings.write') AND @commerce_admin_id IS NOT NULL
 ON DUPLICATE KEY UPDATE permission_key=VALUES(permission_key);
INSERT INTO admin_user_roles (admin_user_id,role_id)
 SELECT @commerce_admin_id,@commerce_role_id WHERE @commerce_admin_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM admin_user_roles WHERE admin_user_id=@commerce_admin_id AND role_id=@commerce_role_id);
COMMIT;
SELECT COUNT(*) AS commerce_permission_count FROM admin_user_roles ur JOIN admin_role_permissions rp ON rp.role_id=ur.role_id
 WHERE ur.admin_user_id=@commerce_admin_id AND ur.role_id=@commerce_role_id AND rp.permission_key IN ('orders.manage','settings.write');
-- Expected 2 only after selecting an approved active admin. Existing catalogue permissions are untouched.

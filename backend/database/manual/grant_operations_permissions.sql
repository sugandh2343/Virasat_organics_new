-- PRIVATE OPERATOR ACTION ONLY. Do not import without approving the target and scope.
SET @operations_admin_email = NULL;
SET @operations_approval = NULL; -- set to 'APPROVE BUSINESS OPERATIONS' only after review
SET @operations_admin_id = (SELECT id FROM admin_users WHERE email=@operations_admin_email AND status='active' AND @operations_approval='APPROVE BUSINESS OPERATIONS');
SET @operations_role = CONCAT('ops-',MD5(@operations_admin_id));
START TRANSACTION;
INSERT INTO admin_roles(id,role_key,name) SELECT @operations_role,@operations_role,'Business operations operator' WHERE @operations_admin_id IS NOT NULL ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO admin_role_permissions(role_id,permission_key) SELECT @operations_role,permission_key FROM admin_permissions WHERE permission_key IN ('orders.read','orders.manage','customers.read','reports.read','inventory.read','inventory.write','delivery.read','delivery.manage','payments.record_cod','notifications.read') AND @operations_admin_id IS NOT NULL ON DUPLICATE KEY UPDATE permission_key=VALUES(permission_key);
INSERT INTO admin_user_roles(admin_user_id,role_id) SELECT @operations_admin_id,@operations_role WHERE @operations_admin_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM admin_user_roles WHERE admin_user_id=@operations_admin_id AND role_id=@operations_role);
INSERT INTO audit_logs(id,action,resource_type,resource_id,request_id,occurred_at,source,actor_admin_id,redacted_after) SELECT REPLACE(UUID(),'-',''),'permissions.operator_grant','admin',@operations_admin_id,REPLACE(UUID(),'-',''),UTC_TIMESTAMP(6),'private-operator',@operations_admin_id,JSON_OBJECT('permissions',JSON_ARRAY('orders.read','orders.manage','customers.read','reports.read','inventory.read','inventory.write','delivery.read','delivery.manage','payments.record_cod','notifications.read')) WHERE @operations_admin_id IS NOT NULL;
COMMIT;
SELECT COUNT(*) AS granted_permission_count FROM admin_user_roles ur JOIN admin_role_permissions rp ON ur.role_id=rp.role_id WHERE ur.admin_user_id=@operations_admin_id AND ur.role_id=@operations_role;
-- Expect 10 for an approved existing active administrator, otherwise 0. Other roles remain intact.

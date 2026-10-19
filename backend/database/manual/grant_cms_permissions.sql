-- PRIVATE OPERATOR ACTION ONLY. Do not import without approving the target and scope.
SET @cms_admin_email = NULL;
SET @cms_approval = NULL; -- set to 'APPROVE CMS AND SETTINGS' only after review
SET @cms_admin_id = (SELECT id FROM admin_users WHERE email=@cms_admin_email AND status='active' AND @cms_approval='APPROVE CMS AND SETTINGS');
SET @cms_role = CONCAT('cms-',MD5(@cms_admin_id));
START TRANSACTION;
INSERT INTO admin_roles(id,role_key,name) SELECT @cms_role,@cms_role,'CMS and settings operator' WHERE @cms_admin_id IS NOT NULL ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO admin_role_permissions(role_id,permission_key) SELECT @cms_role,permission_key FROM admin_permissions WHERE permission_key IN ('content.write','settings.write') AND @cms_admin_id IS NOT NULL ON DUPLICATE KEY UPDATE permission_key=VALUES(permission_key);
INSERT INTO admin_user_roles(admin_user_id,role_id) SELECT @cms_admin_id,@cms_role WHERE @cms_admin_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM admin_user_roles WHERE admin_user_id=@cms_admin_id AND role_id=@cms_role);
INSERT INTO audit_logs(id,action,resource_type,resource_id,request_id,occurred_at,source,actor_admin_id,redacted_after) SELECT REPLACE(UUID(),'-',''),'permissions.operator_grant','admin',@cms_admin_id,REPLACE(UUID(),'-',''),UTC_TIMESTAMP(6),'private-operator',@cms_admin_id,JSON_OBJECT('permissions',JSON_ARRAY('content.write','settings.write')) WHERE @cms_admin_id IS NOT NULL;
COMMIT;
SELECT COUNT(*) AS granted_permission_count FROM admin_user_roles ur JOIN admin_role_permissions rp ON ur.role_id=rp.role_id WHERE ur.admin_user_id=@cms_admin_id AND ur.role_id=@cms_role;
-- Expect 2 for an approved existing active administrator, otherwise 0. Other roles remain intact.

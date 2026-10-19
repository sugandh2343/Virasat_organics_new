-- Apply once after 001-005, on a backed-up V2 database; test on disposable MySQL first.
ALTER TABLE homepage_sections ADD COLUMN published_content JSON NULL, ADD COLUMN published_at DATETIME(6) NULL;
ALTER TABLE banners ADD COLUMN name VARCHAR(200) NULL, ADD COLUMN description TEXT NULL, ADD COLUMN published_at DATETIME(6) NULL;
ALTER TABLE blog_posts ADD COLUMN author_display VARCHAR(200) NULL;
ALTER TABLE business_settings ADD COLUMN legal_name VARCHAR(200) NULL;
INSERT IGNORE INTO admin_permissions(permission_key) VALUES ('content.write'),('settings.write');
-- No permission grants, public publication, payment activation or live content replacement.

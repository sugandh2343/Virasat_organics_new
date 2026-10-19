-- Apply once after 006 on a backed-up V2 database. No ordering/payment activation.
ALTER TABLE inventory_balances ADD COLUMN low_stock_threshold INT UNSIGNED NULL;
CREATE TABLE cod_collections (
 order_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 actor_admin_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 amount_paise BIGINT UNSIGNED NOT NULL,
 reference_note VARCHAR(500) NOT NULL,
 request_key VARCHAR(128) NOT NULL,
 collected_at DATETIME(6) NOT NULL,
 CONSTRAINT fk_cod_order FOREIGN KEY(order_id) REFERENCES orders(id),
 CONSTRAINT fk_cod_actor FOREIGN KEY(actor_admin_id) REFERENCES admin_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE operation_notifications (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 event_key VARCHAR(160) NOT NULL UNIQUE,
 event_type VARCHAR(40) NOT NULL,
 resource_id VARCHAR(64) NOT NULL,
 message VARCHAR(500) NOT NULL,
 occurred_at DATETIME(6) NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 email_status VARCHAR(20) NOT NULL DEFAULT 'disabled',
 INDEX ix_notification_date(occurred_at,id),
 CONSTRAINT ck_notification_email CHECK(email_status='disabled')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE operation_notification_reads (
 notification_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 admin_user_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 read_at DATETIME(6) NOT NULL,
 PRIMARY KEY(notification_id,admin_user_id),
 FOREIGN KEY(notification_id) REFERENCES operation_notifications(id),
 FOREIGN KEY(admin_user_id) REFERENCES admin_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT IGNORE INTO admin_permissions(permission_key) VALUES
 ('orders.read'),('orders.manage'),('customers.read'),('reports.read'),('inventory.read'),('inventory.write'),('delivery.read'),('delivery.manage'),('payments.record_cod'),('notifications.read');

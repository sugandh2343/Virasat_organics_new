-- Manual, additive, one-time migration after 001-004. Back up first; MySQL DDL commits.
-- No credentials, gateway activation, orders, payments or permission grants are seeded.
ALTER TABLE payments
 ADD COLUMN verified_at DATETIME(6) NULL,
 ADD COLUMN failure_code VARCHAR(80) NULL;
-- Do not retain raw webhook PII; this implementation stores body_hash + safe metadata only.
ALTER TABLE payment_events MODIFY COLUMN payload_encrypted BLOB NULL;
CREATE TABLE razorpay_order_requests (
 id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 order_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 customer_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 payment_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 idempotency_key VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 status VARCHAR(32) NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 version BIGINT UNSIGNED NOT NULL DEFAULT 1,
 UNIQUE KEY uq_razorpay_internal_order(order_id),
 UNIQUE KEY uq_razorpay_request(customer_id,idempotency_key),
 UNIQUE KEY uq_razorpay_request_payment(payment_id),
 CONSTRAINT fk_rp_request_order FOREIGN KEY(order_id) REFERENCES orders(id),
 CONSTRAINT fk_rp_request_customer FOREIGN KEY(customer_id) REFERENCES customers(id),
 CONSTRAINT fk_rp_request_payment FOREIGN KEY(payment_id) REFERENCES payments(id),
 CONSTRAINT ck_rp_request_status CHECK(status IN ('creating','ready','uncertain'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

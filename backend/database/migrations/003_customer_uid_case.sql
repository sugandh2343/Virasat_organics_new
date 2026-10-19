-- Phase 7C: run once after backup, with migrations 001/002 already verified.
-- Firebase UIDs are case-sensitive. No data is deleted or seeded.
ALTER TABLE customers MODIFY firebase_uid VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL;

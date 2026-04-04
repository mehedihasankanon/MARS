-- Memorable coupon codes (customers enter code; UUID still stored as primary key)
-- Password reset tokens for forgot-password flow

ALTER TABLE mars.coupons
  ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(64);

UPDATE mars.coupons c
SET coupon_code = 'MARS-' || SUBSTRING(REPLACE(c.coupon_id::text, '-', ''), 1, 12)
WHERE c.coupon_code IS NULL OR TRIM(c.coupon_code) = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code_lower
  ON mars.coupons (LOWER(TRIM(coupon_code)));

ALTER TABLE mars.users
  ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(128),
  ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;

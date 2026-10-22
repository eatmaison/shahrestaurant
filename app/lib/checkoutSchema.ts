/** Additive shared-database migration; safe for the five existing applications. */
export const CHECKOUT_DDL = [
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS request_key text`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS request_fingerprint text`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_request_key ON orders (request_key)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_request_fingerprint ON orders (request_fingerprint, created_at)`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS checkout_url text`,
];

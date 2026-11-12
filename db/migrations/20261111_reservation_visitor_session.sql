-- MANUAL, OPTIONAL MIGRATION. Not registered in ensureReady()/automatic DDL.
-- Apply only after the database owner approves the target database and rollout.
-- Existing reservations are deliberately NOT backfilled by name, email, IP or time.
BEGIN;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS visitor_session_id text;
CREATE INDEX IF NOT EXISTS idx_reservations_visitor_session ON reservations (visitor_session_id)
  WHERE visitor_session_id IS NOT NULL;
COMMIT;

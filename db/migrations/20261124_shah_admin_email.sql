BEGIN;
CREATE TABLE IF NOT EXISTS shah_email_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(btrim(email)) AND length(email) BETWEEN 3 AND 254),
  granted_at timestamptz NOT NULL DEFAULT now(),
  evidence text NOT NULL CHECK (length(evidence) BETWEEN 12 AND 500),
  granted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  unsubscribe_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS shah_email_campaigns (
  id uuid PRIMARY KEY,
  subject text NOT NULL CHECK (length(subject) BETWEEN 1 AND 160),
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 12000),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS shah_email_deliveries (
  campaign_id uuid NOT NULL REFERENCES shah_email_campaigns(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES shah_email_permissions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','accepted','not_sent','uncertain')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (campaign_id, permission_id)
);
CREATE INDEX IF NOT EXISTS idx_shah_email_delivery_pending ON shah_email_deliveries(campaign_id, permission_id) WHERE status = 'pending';
COMMIT;
